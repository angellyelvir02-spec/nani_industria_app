import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReservasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private calcularDuracionHoras(horaInicio: string, horaFin: string): number {
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    const minutosInicio = inicioH * 60 + inicioM;
    const minutosFin = finH * 60 + finM;

    if (minutosFin <= minutosInicio) {
      throw new BadRequestException(
        'La hora de fin debe ser mayor que la hora de inicio',
      );
    }
    return (minutosFin - minutosInicio) / 60;
  }

  // src/reservas/reservas.service.ts
  async create(createReservaDto: any, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Obtener perfil
    const { data: usuarioPerfil, error: usuarioError } = await admin
      .from('usuario')
      .select('id, correo')
      .eq('auth_id', authUserId)
      .single();

    if (usuarioError || !usuarioPerfil) {
      throw new BadRequestException(`Usuario no encontrado: ${authUserId}`);
    }

    // 2. Obtener Cliente
    const { data: cliente, error: clienteError } = await admin
      .from('cliente')
      .select('id, persona_id')
      .eq('usuario_id', usuarioPerfil.id)
      .single();

    // VALIDACIÓN CRÍTICA: Si no hay cliente, lanzamos error para que TS sepa que después de aquí 'cliente' NO es null
    if (clienteError || !cliente) {
      throw new BadRequestException(
        'El usuario no tiene un perfil de cliente vinculado.',
      );
    }

    // 3. Obtener Persona
    const { data: persona, error: personaError } = await admin
      .from('persona')
      .select('nombre, apellido, id_direccion')
      .eq('id', cliente.persona_id)
      .single();

    // VALIDACIÓN CRÍTICA: Si no hay persona, lanzamos error
    if (personaError || !persona) {
      throw new BadRequestException(
        'No se encontró la información personal del cliente.',
      );
    }

    // 4. Extraer valores
    const duracion = createReservaDto.duracion_horas;
    const montoBase = parseFloat(createReservaDto.monto_base);
    const comisionNani = parseFloat(createReservaDto.monto_comision);
    const propina = parseFloat(createReservaDto.propina) || 0;
    const montoTotalFinal = montoBase + comisionNani + propina;

    // 5. Insertar Reserva (Ahora TS sabe que 'cliente' y 'persona' existen)
    const { data: reserva, error: reservaError } = await admin
      .from('reserva')
      .insert({
        codigo_reserva: `RES-${Date.now()}`,
        cliente_id: cliente.id,
        ninera_id: createReservaDto.ninera_id,
        direccion_id: createReservaDto.direccion_id || persona.id_direccion,
        metodo_pago_id: createReservaDto.metodo_pago_id,
        fecha_servicio: createReservaDto.fecha_servicio,
        hora_inicio: createReservaDto.hora_inicio,
        hora_fin: createReservaDto.hora_fin,
        duracion_horas: duracion,
        notas_importantes: createReservaDto.notas_importantes || null,
        monto_total: montoTotalFinal,
        monto_comision: comisionNani,
        estado: 'pendiente',
        estado_pago: 'pendiente',
      })
      .select()
      .single();

    if (reservaError || !reserva) {
      throw new BadRequestException(
        `Error al guardar reserva: ${reservaError?.message}`,
      );
    }

    // 6. Insertar Pago
    // 6. Insertar Pago
    const tarifaPorHora = montoBase / duracion;

    // Aseguramos que los valores sean números antes de enviar
    const { data: pagoInsertado, error: errorPago } = await admin
      .from('pago')
      .insert({
        reserva_id: reserva.id,
        hora_programada: Number(duracion),
        tarifa_por_hora: Number(tarifaPorHora),
        servicio_base: Number(montoBase),
        tiempo_espera_minutos: 0,
        cargo_tiempo_adicional: 0,
        propina: Number(propina),
        total_a_recibir: Number(montoTotalFinal),
        estado_pago: 'pendiente',
      })
      .select(); // <--- AGREGAMOS SELECT PARA FORZAR CONFIRMACIÓN

    if (errorPago) {
      console.error('ERROR CRÍTICO EN TABLA PAGO:', errorPago);
      throw new BadRequestException(
        `Error al registrar el pago: ${errorPago.message} - Detalle: ${errorPago.details}`,
      );
    }

    console.log('Pago registrado con éxito:', pagoInsertado);

    // 7. Relación con niños (Corrección del error de tipo 'never[]')
    let detallesNinos: any[] = []; // Definimos el tipo como arreglo de cualquier objeto

    if (createReservaDto.ninos_ids?.length > 0) {
      const insertNinos = createReservaDto.ninos_ids.map((id: string) => ({
        reserva_id: reserva.id,
        nino_id: id,
      }));
      await admin.from('reserva_nino').insert(insertNinos);

      const { data: ninosData } = await admin
        .from('nino')
        .select('nombre, edad')
        .in('id', createReservaDto.ninos_ids);

      detallesNinos = ninosData || [];
    }

    // 8. Retorno
    return {
      message: 'Reserva creada con éxito',
      reservaId: reserva.id,
      codigoReserva: reserva.codigo_reserva,
      montoTotal: reserva.monto_total,
      nombreCliente: `${persona.nombre} ${persona.apellido}`,
      correoCliente: usuarioPerfil.correo,
      ninos: detallesNinos,
    };
  }

  async findAll() {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('reserva')
      .select(
        `
        *,
        cliente (id, persona (nombre, apellido, foto_url)),
        ninera (id, persona (nombre, apellido, foto_url))
      `,
      )
      .order('created_at', { ascending: false });

    if (error)
      throw new BadRequestException(
        `Error obteniendo reservas: ${error.message}`,
      );
    return data;
  }

  async findByNinera(usuarioId: string) {
    const admin = this.supabaseService.getAdminClient();
    
    const { data: ninera, error: nineraError } = await admin
      .from('ninera')
      .select('id')
      .eq('usuario_id', usuarioId)
      .single();
    
    if (nineraError || !ninera) {
      throw new NotFoundException('Niñera no encontrada');
    }
  
    const { data, error } = await admin
      .from('reserva')
      .select(
        `
        id,
        fecha_servicio,
        hora_inicio,
        hora_fin,
        duracion_horas,
        monto_total,
        estado,
        notas_importantes,
        cliente:cliente_id (
          id,
          persona:persona_id (
            nombre,
            apellido,
            foto_url
          )
        ),
        direccion:direccion_id (
          direccion_completa,
          punto_referencia,
          latitud,
          longitud
        ),
        metodo_pago:metodo_pago_id (
          nombre
        ),
        reserva_nino (
          nino_id
        )
        `,
      )
      .eq('ninera_id', ninera.id)
      .order('fecha_servicio', { ascending: false });
    
    if (error) {
      throw new BadRequestException(
        `Error obteniendo reservas de niñera: ${error.message}`,
      );
    }
  
    return data;
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('reserva')
      .select(
        `
        *,
        cliente (id, persona (nombre, apellido, foto_url)),
        ninera (id, persona (nombre, apellido, foto_url))
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Reserva no encontrada');
    return data;
  }

  async update(id: string, updateReservaDto: UpdateReservaDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('reserva')
      .update(updateReservaDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Error actualizando reserva: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return data;
  }

  remove(id: string) {
    return {
      message: `Aquí irá la eliminación de la reserva ${id}`,
    };
  }

  async getMetodosPago() {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('metodo_pago')
      .select('id, nombre')
      .eq('activo', true);

    if (error)
      throw new BadRequestException(
        `Error al obtener métodos de pago: ${error.message}`,
      );
    return data;
  }

  ///mostrar reservaas en la pantalla reservas del cliente

  async findBookingsForClientApp(idUsuarioDesdeFrontend: string) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Buscamos el ID de la tabla 'cliente'
    const { data: cliente, error: errorCliente } = await admin
      .from('cliente')
      .select('id')
      .eq('usuario_id', idUsuarioDesdeFrontend)
      .maybeSingle();

    if (errorCliente || !cliente) {
      console.error(
        'Cliente no encontrado para el usuario:',
        idUsuarioDesdeFrontend,
      );
      return [];
    }

    // 2. Traemos las reservas
    const { data, error } = await admin
      .from('reserva')
      .select(
        `
      id, 
      fecha_servicio, 
      hora_inicio, 
      hora_fin, 
      monto_total, 
      estado, 
      estado_comprobacion,
      duracion_horas,
      direccion:direccion_id (direccion_completa, punto_referencia),
      ninera:ninera_id (persona:persona_id (nombre, apellido, foto_url))
    `,
      )
      .eq('cliente_id', cliente.id)
      .order('fecha_servicio', { ascending: false });

    if (error) {
      throw new BadRequestException('Error al obtener reservas.');
    }

    // 3. MAPEO CORREGIDO PARA EL FRONTEND
    return (data || []).map((res: any) => {
      let visualStatus:
        | 'confirmed'
        | 'pending'
        | 'completed'
        | 'cancelled'
        | 'en_progreso' = 'pending';

      // Sincronización de nombres de estado con el App
      if (res.estado === 'finalizada') {
        visualStatus = 'completed';
      } else if (res.estado === 'cancelada') {
        visualStatus = 'cancelled';
      } else if (res.estado === 'en_progreso') {
        visualStatus = 'en_progreso';
      } else if (
        res.estado === 'confirmada' ||
        res.estado_comprobacion === 'confirmada'
      ) {
        visualStatus = 'confirmed';
      } else {
        visualStatus = 'pending';
      }

      const ubicacion = res.direccion
        ? `${res.direccion.direccion_completa}${res.direccion.punto_referencia && res.direccion.punto_referencia !== 'EMPTY' ? ', ' + res.direccion.punto_referencia : ''}`
        : 'Ubicación no especificada';

      return {
        id: res.id,
        babysitter: res.ninera?.persona
          ? `${res.ninera.persona.nombre} ${res.ninera.persona.apellido}`
          : 'Niñera Nani',
        photo:
          res.ninera?.persona?.foto_url || 'https://via.placeholder.com/150',
        date: res.fecha_servicio,
        time: `${res.hora_inicio?.slice(0, 5)} - ${res.hora_fin?.slice(0, 5)}`,
        duration: res.duracion_horas ? `${res.duracion_horas} h` : 'N/A',
        location: ubicacion,
        amount: `L. ${res.monto_total}`,
        status: visualStatus, // Ahora envía 'confirmed', 'completed', etc.
        rating: 5.0,
        reviewed: false,
      };
    });
  }

  // detalles reserva

  async getBookingDetail(bookingId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('reserva')
      .select(
        `
      id,
      codigo_reserva,
      estado_pago,
      fecha_servicio,
      hora_inicio,
      hora_fin,
      monto_total,
      monto_comision,   
      estado,
      duracion_horas,
      notas_importantes,
      metodo_pago:metodo_pago_id (nombre), 
      direccion:direccion_id (
        direccion_completa, 
        punto_referencia, 
        latitud, 
        longitud
      ),
      ninera:ninera_id (
        id,
        persona:persona_id (nombre, apellido, foto_url, telefono)
      ),
      reserva_nino (
        nino:nino_id (nombre, edad, nota)
      ),
      pago (
        tarifa_por_hora,
        propina,
        servicio_base
      )
    `,
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      console.error('ERROR REAL SUPABASE:', error);
      throw new BadRequestException(`Error de base de datos: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('La reserva no existe en Nani');
    }

    const getFirst = (val: any) => (Array.isArray(val) ? val[0] : val);

    const listaNinos =
      data.reserva_nino?.map((rn: any) => ({
        nombre: rn.nino?.nombre || 'N/A',
        edad: rn.nino?.edad || 0,
        nota: rn.nino?.nota || '',
      })) || [];

    const direccion = getFirst(data.direccion);
    const ninera = getFirst(data.ninera);
    const metodo_pago = getFirst(data.metodo_pago);
    const pago = getFirst(data.pago);

    return {
      id: data.id,
      codigo_reserva: data.codigo_reserva || data.id.substring(0, 8),
      babysitterName: ninera?.persona
        ? `${ninera.persona.nombre} ${ninera.persona.apellido}`
        : 'Niñera asignada',
      babysitterPhoto: ninera?.persona?.foto_url || null,
      babysitterPhone: ninera?.persona?.telefono || '',
      fecha_servicio: data.fecha_servicio, // Necesario para el cronómetro
      hora_inicio: data.hora_inicio, // Necesario para validación QR
      hora_fin: data.hora_fin, // Necesario para el cronómetro

      time: `${data.hora_inicio?.slice(0, 5) || '--:--'} - ${data.hora_fin?.slice(0, 5) || '--:--'}`,
      address: direccion?.direccion_completa || 'Sin dirección',
      puntoReferencia: direccion?.punto_referencia || '',
      paymentStatus: data.estado_pago || 'pendiente',
      scheduledHours: data.duracion_horas,
      childrenArray: listaNinos,
      status: data.estado,
      baseAmount: pago?.servicio_base || 0,
      feeAmount: data.monto_comision || 0,
      cargo_tiempo_adicional: pago?.cargo_tiempo_adicional || 0,

      tip: pago?.propina || 0,
      total: data.monto_total,
    };
  }

  async procesarCheckout(reservaId: string) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Obtener la reserva y su registro de pago asociado usando Supabase
    const { data: reserva, error: errorReserva } = await admin
      .from('reserva')
      .select(
        `
        id, 
        fecha_servicio, 
        hora_fin, 
        estado,
        pago (
          id,
          tarifa_por_hora,
          servicio_base,
          propina
        )
      `,
      )
      .eq('id', reservaId)
      .maybeSingle();

    if (errorReserva || !reserva) {
      throw new NotFoundException(
        'La reserva o su registro de pago no existen',
      );
    }

    const ahora = new Date();
    // Combinamos la fecha del servicio con la hora_fin programada
    const finProgramado = new Date(
      `${reserva.fecha_servicio}T${reserva.hora_fin}`,
    );

    // 2. Calcular diferencia de tiempo en minutos
    const diferenciaMilisegundos = ahora.getTime() - finProgramado.getTime();
    const minutosTranscurridosExtra = Math.floor(
      diferenciaMilisegundos / (1000 * 60),
    );

    // 3. CONFIGURACIÓN DE GRACIA Y TARIFAS
    const MINUTOS_GRACIA = 15;
    let cargoTiempoAdicional = 0;

    const pago = Array.isArray(reserva.pago) ? reserva.pago[0] : reserva.pago;

    if (!pago) {
      throw new BadRequestException(
        'No se encontró información de pago para esta reserva',
      );
    }

    const tarifaPorMinuto = Number(pago.tarifa_por_hora) / 60;

    // 4. CÁLCULO DEL CARGO ADICIONAL CON PERIODO DE GRACIA
    if (minutosTranscurridosExtra > MINUTOS_GRACIA) {
      // Si excede la gracia, se cobran los minutos extras transcurridos
      cargoTiempoAdicional = minutosTranscurridosExtra * tarifaPorMinuto;
    }

    // 5. CALCULAR NUEVO TOTAL
    const nuevoTotalARecibir =
      Number(pago.servicio_base) +
      Number(cargoTiempoAdicional) +
      Number(pago.propina);

    // 6. ACTUALIZAR TABLA 'PAGO' EN SUPABASE
    const { error: errorUpdatePago } = await admin
      .from('pago')
      .update({
        cargo_tiempo_adicional: Number(cargoTiempoAdicional.toFixed(2)),
        total_a_recibir: Number(nuevoTotalARecibir.toFixed(2)),
        estado_pago:
          cargoTiempoAdicional > 0 ? 'ajuste_pendiente' : 'completado',
      })
      .eq('id', pago.id);

    if (errorUpdatePago) {
      throw new BadRequestException(
        `Error al actualizar pago: ${errorUpdatePago.message}`,
      );
    }

    // 7. ACTUALIZAR ESTADO DE LA RESERVA
    const { data: reservaFinalizada, error: errorUpdateReserva } = await admin
      .from('reserva')
      .update({ estado: 'finalizada' })
      .eq('id', reservaId)
      .select()
      .single();

    if (errorUpdateReserva) {
      throw new BadRequestException(
        `Error al finalizar reserva: ${errorUpdateReserva.message}`,
      );
    }

    return {
      message: 'Checkout procesado con éxito',
      reserva: reservaFinalizada,
      cargosAdicionales: cargoTiempoAdicional.toFixed(2),
      totalFinal: nuevoTotalARecibir.toFixed(2),
    };
  }
}
