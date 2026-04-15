import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { CheckinDto } from './dto/chekin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReservasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  calcularDuracionHoras(horaInicio: string, horaFin: string): number {
    const [hInicio] = horaInicio.split(':').map(Number);
    const [hFin] = horaFin.split(':').map(Number);

    return hFin - hInicio;
  }

  private formatDurationFromHours(hours: number): string {
    if (!Number.isFinite(hours) || hours < 0) {
      return '0h 0m';
    }

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return `${h}h ${m}m`;
  }

  async create(createReservaDto: CreateReservaDto, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: usuarioPerfil, error: usuarioError } = await admin
      .from('usuario')
      .select('id, correo')
      .eq('auth_id', authUserId)
      .single();

    if (usuarioError || !usuarioPerfil) {
      throw new BadRequestException(`Usuario no encontrado: ${authUserId}`);
    }

    const { data: cliente, error: clienteError } = await admin
      .from('cliente')
      .select('id, persona_id')
      .eq('usuario_id', usuarioPerfil.id)
      .single();

    if (clienteError || !cliente) {
      throw new BadRequestException(
        'El usuario no tiene un perfil de cliente vinculado.',
      );
    }

    const { data: persona, error: personaError } = await admin
      .from('persona')
      .select('nombre, apellido, id_direccion')
      .eq('id', cliente.persona_id)
      .single();

    if (personaError || !persona) {
      throw new BadRequestException(
        'No se encontró la información personal del cliente.',
      );
    }

    const direccionId = createReservaDto.direccion_id || persona.id_direccion;

    if (!direccionId) {
      throw new BadRequestException(
        'El cliente no tiene una dirección asociada para la reserva.',
      );
    }

    const duracion = this.calcularDuracionHoras(
      createReservaDto.hora_inicio,
      createReservaDto.hora_fin,
    );

    const tarifaReal = Number((createReservaDto as any).tarifa_por_hora) || 0;
    const montoBase = Number((createReservaDto as any).monto_base);
    const comisionNani = Number((createReservaDto as any).monto_comision);
    const propina = Number((createReservaDto as any).propina || 0);

    if (
      !Number.isFinite(montoBase) ||
      !Number.isFinite(comisionNani) ||
      !Number.isFinite(propina)
    ) {
      throw new BadRequestException('Montos inválidos en la reserva');
    }

    const montoTotalFinal = montoBase + comisionNani + propina;

    const { data: metodoPago, error: metodoPagoError } = await admin
      .from('metodo_pago')
      .select('id, nombre')
      .eq('id', createReservaDto.metodo_pago_id)
      .single();

    if (metodoPagoError || !metodoPago) {
      throw new BadRequestException('Metodo de pago no valido.');
    }

    const esTarjeta = metodoPago.nombre.toLowerCase().includes('tarjeta');
    const estadoPagoReserva = esTarjeta ? 'completada' : 'pendiente';
    const estadoPagoRegistro = esTarjeta ? 'completado' : 'pendiente';

    let tarjetaUsada: any = null;

    if (esTarjeta) {
      const tarjetaGuardadaId = (createReservaDto as any).tarjeta_guardada_id;
      const nuevaTarjeta = (createReservaDto as any).nueva_tarjeta;

      if (tarjetaGuardadaId) {
        const { data: tarjetaGuardada, error: tarjetaError } = await admin
          .from('cliente_tarjeta')
          .select('id, titular, marca, ultimos_4, vencimiento')
          .eq('id', tarjetaGuardadaId)
          .eq('cliente_id', cliente.id)
          .single();

        if (tarjetaError || !tarjetaGuardada) {
          throw new BadRequestException('La tarjeta seleccionada no existe.');
        }

        tarjetaUsada = tarjetaGuardada;
      } else if (nuevaTarjeta) {
        const numero = String(nuevaTarjeta.numero ?? '').replace(/\D/g, '');
        const titular = String(nuevaTarjeta.titular ?? '').trim();
        const vencimiento = String(nuevaTarjeta.vencimiento ?? '').trim();
        const cvv = String(nuevaTarjeta.cvv ?? '').replace(/\D/g, '');
        const marca =
          String(nuevaTarjeta.marca ?? '').trim() ||
          (numero.startsWith('4')
            ? 'Visa'
            : numero.startsWith('5')
              ? 'Mastercard'
              : 'Tarjeta');

        if (titular.length < 3) {
          throw new BadRequestException(
            'Debes ingresar el titular de la tarjeta.',
          );
        }

        if (numero.length < 13) {
          throw new BadRequestException(
            'Debes ingresar un numero de tarjeta valido.',
          );
        }

        if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
          throw new BadRequestException(
            'Debes ingresar una fecha de vencimiento valida.',
          );
        }

        if (cvv.length < 3) {
          throw new BadRequestException('Debes ingresar un CVV valido.');
        }

        const predeterminada = Boolean(nuevaTarjeta.predeterminada);

        if (predeterminada) {
          await admin
            .from('cliente_tarjeta')
            .update({ predeterminada: false })
            .eq('cliente_id', cliente.id);
        }

        const { data: tarjetaNueva, error: tarjetaNuevaError } = await admin
          .from('cliente_tarjeta')
          .insert({
            cliente_id: cliente.id,
            titular,
            numero,
            ultimos_4: numero.slice(-4),
            vencimiento,
            cvv,
            marca,
            predeterminada,
          })
          .select('id, titular, marca, ultimos_4, vencimiento')
          .single();

        if (tarjetaNuevaError || !tarjetaNueva) {
          throw new BadRequestException(
            `No se pudo guardar la tarjeta: ${tarjetaNuevaError?.message}`,
          );
        }

        tarjetaUsada = tarjetaNueva;
      } else {
        throw new BadRequestException(
          'Debes seleccionar una tarjeta guardada o ingresar una nueva.',
        );
      }
    }

    const { data: reserva, error: reservaError } = await admin
      .from('reserva')
      .insert({
        codigo_reserva: `RES-${Date.now()}`,
        cliente_id: cliente.id,
        ninera_id: createReservaDto.ninera_id,
        direccion_id: direccionId,
        metodo_pago_id: createReservaDto.metodo_pago_id,
        fecha_servicio: createReservaDto.fecha_servicio,
        hora_inicio: createReservaDto.hora_inicio,
        hora_fin: createReservaDto.hora_fin,
        duracion_horas: duracion,
        notas_importantes: (createReservaDto as any).notas_importantes || null,
        monto_total: montoTotalFinal,
        monto_comision: comisionNani,
        estado: 'pendiente',
        estado_pago: estadoPagoReserva,
      })
      .select()
      .single();

    if (reservaError || !reserva) {
      throw new BadRequestException(
        `Error al guardar reserva: ${reservaError?.message}`,
      );
    }

    const { data: pagoInsertado, error: errorPago } = await admin
      .from('pago')
      .insert({
        reserva_id: reserva.id,
        hora_programada: Number(duracion),
        tarifa_por_hora: Number(tarifaReal),
        servicio_base: Number(montoBase),
        tiempo_espera_minutos: 0,
        cargo_tiempo_adicional: 0,
        propina: Number(propina),
        total_a_recibir: Number(montoTotalFinal),
        estado_pago: estadoPagoRegistro,
      })
      .select();

    if (errorPago) {
      await admin.from('reserva').delete().eq('id', reserva.id);

      throw new BadRequestException(
        `Error al registrar el pago: ${errorPago.message}`,
      );
    }

    let detallesNinos: any[] = [];

    if ((createReservaDto as any).ninos_ids?.length > 0) {
      const insertNinos = (createReservaDto as any).ninos_ids.map(
        (id: string) => ({
          reserva_id: reserva.id,
          nino_id: id,
        }),
      );

      const { error: errorNinos } = await admin
        .from('reserva_nino')
        .insert(insertNinos);

      if (errorNinos) {
        await admin.from('pago').delete().eq('reserva_id', reserva.id);
        await admin.from('reserva').delete().eq('id', reserva.id);

        throw new BadRequestException(
          `Error al registrar niños de la reserva: ${errorNinos.message}`,
        );
      }

      const { data: ninosData } = await admin
        .from('nino')
        .select('nombre, edad')
        .in('id', (createReservaDto as any).ninos_ids);

      detallesNinos = ninosData || [];
    }

    return {
      message: 'Reserva creada con éxito',
      reservaId: reserva.id,
      codigoReserva: reserva.codigo_reserva,
      montoTotal: reserva.monto_total,
      paymentStatus: reserva.estado_pago,
      paymentUpfront: esTarjeta,
      tarjeta: tarjetaUsada,
      nombreCliente: `${persona.nombre} ${persona.apellido}`,
      correoCliente: usuarioPerfil.correo,
      ninos: detallesNinos,
      pago: pagoInsertado,
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

    if (error) {
      throw new BadRequestException(
        `Error obteniendo reservas: ${error.message}`,
      );
    }

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
        codigo_reserva,
        fecha_servicio,
        hora_inicio,
        hora_fin,
        duracion_horas,
        monto_total,
        estado,
        notas_importantes,
        motivo_rechazo,
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

    if (error || !data) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return data;
  }

  async update(id: string, updateReservaDto: UpdateReservaDto) {
    const admin = this.supabaseService.getAdminClient();

    const allowedStates = [
      'pendiente',
      'confirmada',
      'en_progreso',
      'completada',
      'cancelada',
      'rechazada',
    ];

    const patchData: any = { ...updateReservaDto };

    if (patchData.estado) {
      const estadoNormalizado = String(patchData.estado).toLowerCase().trim();

      if (estadoNormalizado === 'confirmado') {
        patchData.estado = 'confirmada';
      } else if (estadoNormalizado === 'finalizada') {
        patchData.estado = 'completada';
      } else if (estadoNormalizado === 'cancelado') {
        patchData.estado = 'cancelada';
      } else if (estadoNormalizado === 'rechazado') {
        patchData.estado = 'rechazada';
      } else {
        patchData.estado = estadoNormalizado;
      }

      if (!allowedStates.includes(patchData.estado)) {
        throw new BadRequestException(
          `Estado inválido para reserva: ${patchData.estado}`,
        );
      }

      if (patchData.estado === 'confirmada') {
        patchData.estado_comprobacion = 'confirmada';
      } else if (patchData.estado === 'rechazada') {
        patchData.estado_comprobacion = 'rechazada';
      } else if (
        patchData.estado === 'cancelada' ||
        patchData.estado === 'completada'
      ) {
        patchData.estado_comprobacion = null;
      }
    }

    const { data, error } = await admin
      .from('reserva')
      .update(patchData)
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

    if (error) {
      throw new BadRequestException(
        `Error al obtener métodos de pago: ${error.message}`,
      );
    }

    return data;
  }

  async findBookingsForClientApp(idUsuarioDesdeFrontend: string) {
    const admin = this.supabaseService.getAdminClient();

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

    const { data, error } = await admin
      .from('reserva')
      .select(
        `
      id,
      codigo_reserva,
      ninera_id,
      fecha_servicio,
      hora_inicio,
      hora_fin,
      monto_total,
      estado,
      estado_comprobacion,
      duracion_horas,
      motivo_rechazo,
      direccion:direccion_id (direccion_completa, punto_referencia),
      ninera:ninera_id (usuario_id, persona:persona_id (nombre, apellido, foto_url))
    `,
      )
      .eq('cliente_id', cliente.id)
      .order('fecha_servicio', { ascending: false });

    if (error) {
      throw new BadRequestException('Error al obtener reservas.');
    }

    // Obtener todos los usuario_id de niñeras
    const usuarioIds = (data || [])
      .map((r: any) => r.ninera?.usuario_id)
      .filter((id: string) => !!id);

    const { data: resenas, error: resError } = await admin
      .from('resena')
      .select('receptor_id, puntuacion')
      .in('receptor_id', usuarioIds);

    const ratingsMap: Record<string, number> = {};

    if (!resError && resenas) {
      const agrupadas: Record<string, number[]> = {};

      resenas.forEach((r: any) => {
        if (!agrupadas[r.receptor_id]) {
          agrupadas[r.receptor_id] = [];
        }
        agrupadas[r.receptor_id].push(r.puntuacion || 0);
      });

      Object.keys(agrupadas).forEach((userId) => {
        const lista = agrupadas[userId];
        const promedio =
          lista.reduce((acc, val) => acc + val, 0) / lista.length;

        ratingsMap[userId] = parseFloat(promedio.toFixed(1));
      });
    }

    return (data || []).map((res: any) => {
      let visualStatus:
        | 'confirmed'
        | 'pending'
        | 'completed'
        | 'rejected'
        | 'cancelled'
        | 'en_progreso' = 'pending';

      if (res.estado === 'completada') {
        visualStatus = 'completed';
      } else if (res.estado === 'cancelado') {
        visualStatus = 'cancelled';
      } else if (res.estado === 'en_progreso') {
        visualStatus = 'en_progreso';
      } else if (res.estado === 'rechazada') {
        visualStatus = 'rejected';
      } else if (
        res.estado === 'confirmada' ||
        res.estado_comprobacion === 'confirmada'
      ) {
        visualStatus = 'confirmed';
      } else {
        visualStatus = 'pending';
      }

      const ubicacion = res.direccion
        ? `${res.direccion.direccion_completa}${
            res.direccion.punto_referencia &&
            res.direccion.punto_referencia !== 'EMPTY'
              ? ', ' + res.direccion.punto_referencia
              : ''
          }`
        : 'Ubicación no especificada';

      return {
        id: res.id,
        codigo_reserva: res.codigo_reserva,
        ninera_id: res.ninera_id,
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
        status: visualStatus,
        rating: res.ninera?.usuario_id
          ? ratingsMap[res.ninera.usuario_id] || 0.0
          : 0.0,
        reviewed: false,
        motivo_rechazo: res.motivo_rechazo || null,
      };
    });
  }

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
      estado_comprobacion,
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
        servicio_base,
        cargo_tiempo_adicional
      ),
      seguimiento_sesion (
        hora_entrada_real,
        hora_salida_real,
        tiempo_total_trabajado,
        codigo_qr_entrada,
        codigo_qr_salida
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
    const seguimiento = getFirst((data as any).seguimiento_sesion);
    const estadoDetalle =
      data.estado === 'pendiente' && data.estado_comprobacion === 'confirmada'
        ? 'confirmada'
        : data.estado;

    return {
      id: data.id,
      codigo_reserva: data.codigo_reserva || data.id.substring(0, 8),
      babysitterName: ninera?.persona
        ? `${ninera.persona.nombre} ${ninera.persona.apellido}`
        : 'Niñera asignada',
      babysitterPhoto: ninera?.persona?.foto_url || null,
      babysitterPhone: ninera?.persona?.telefono || '',
      fecha_servicio: data.fecha_servicio,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      time: `${data.hora_inicio?.slice(0, 5) || '--:--'} - ${
        data.hora_fin?.slice(0, 5) || '--:--'
      }`,
      address: direccion?.direccion_completa || 'Sin dirección',
      puntoReferencia: direccion?.punto_referencia || '',
      latitud: direccion?.latitud ?? null,
      longitud: direccion?.longitud ?? null,
      paymentStatus: data.estado_pago || 'pendiente',
      scheduledHours: data.duracion_horas,
      childrenArray: listaNinos,
      status: estadoDetalle,
      checkInReal: seguimiento?.hora_entrada_real || null,
      checkOutReal: seguimiento?.hora_salida_real || null,
      tiempoTotalTrabajado: seguimiento?.tiempo_total_trabajado || null,
      baseAmount: pago?.servicio_base || 0,
      feeAmount: data.monto_comision || 0,
      cargo_tiempo_adicional: pago?.cargo_tiempo_adicional || 0,
      tip: pago?.propina || 0,
      total: data.monto_total,
      paymentMethod: metodo_pago?.nombre || '',
    };
  }

  async procesarCheckin(
    reservaId: string,
    body: CheckinDto,
    authUserId: string,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const manual: boolean = !!(body as any).manual;
    const motivo_manual: string = ((body as any).motivo_manual ?? '').trim();

    if (manual && motivo_manual.length < 10) {
      throw new BadRequestException(
        'Se requiere un motivo de al menos 10 caracteres para el check-in manual.',
      );
    }

    const { data: reserva, error: errReserva } = await admin
      .from('reserva')
      .select('id, estado, ninera_id')
      .eq('id', reservaId)
      .single();

    if (errReserva || !reserva)
      throw new NotFoundException('Reserva no encontrada.');
    if (reserva.estado !== 'confirmada') {
      throw new BadRequestException(
        'Solo se puede hacer check-in en reservas con estado "confirmada".',
      );
    }

    const ahora = new Date(parseInt(body.checkInTime));

    const { data: existing } = await admin
      .from('seguimiento_sesion')
      .select('id')
      .eq('reserva_id', reservaId)
      .maybeSingle();

    const seguimientoData: Record<string, any> = {
      reserva_id: reservaId,
      hora_entrada_real: ahora.toISOString(),
      codigo_qr_entrada: (body as any).qrCode ?? null,
      checkin_manual: manual,
      motivo_manual_entrada: manual ? motivo_manual : null,
    };

    if (existing?.id) {
      await admin
        .from('seguimiento_sesion')
        .update(seguimientoData)
        .eq('id', existing.id);
    } else {
      await admin.from('seguimiento_sesion').insert(seguimientoData);
    }

    await admin
      .from('reserva')
      .update({ estado: 'en_progreso' })
      .eq('id', reservaId);

    return {
      success: true,
      message: 'Check-in registrado correctamente.',
      manual,
    };
  }

  async procesarCheckout(
    reservaId: string,
    body: CheckoutDto,
    authUserId: string,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const manual: boolean = !!(body as any).manual;
    const motivo_manual: string = ((body as any).motivo_manual ?? '').trim();

    if (manual && motivo_manual.length < 10) {
      throw new BadRequestException(
        'Se requiere un motivo de al menos 10 caracteres para el check-out manual.',
      );
    }

    const { data: seguimiento, error: errSeg } = await admin
      .from('seguimiento_sesion')
      .select('id, hora_entrada_real')
      .eq('reserva_id', reservaId)
      .maybeSingle();

    if (errSeg || !seguimiento) {
      throw new NotFoundException(
        'No se encontró el registro de entrada para esta reserva.',
      );
    }

    const entrada = new Date(seguimiento.hora_entrada_real).getTime();
    const salida = new Date(parseInt(body.checkOutTime)).getTime();

    if (salida <= entrada) {
      throw new BadRequestException(
        'La hora de salida no puede ser anterior o igual a la de entrada.',
      );
    }

    const totalHorasReales = (salida - entrada) / 1000 / 3600;

    await admin
      .from('seguimiento_sesion')
      .update({
        hora_salida_real: new Date(salida).toISOString(),
        tiempo_total_trabajado: totalHorasReales.toFixed(4),
        checkout_manual: manual,
        motivo_manual_salida: manual ? motivo_manual : null,
      })
      .eq('id', seguimiento.id);

    await admin
      .from('reserva')
      .update({ estado: 'pendiente_confirmacion' })
      .eq('id', reservaId);

    return {
      success: true,
      message: 'Check-out registrado. Esperando confirmación del cliente.',
      totalHoras: totalHorasReales.toFixed(4),
      manual,
    };
  }

  async confirmarFinalizacionCliente(reservaId: string, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: usuario } = await admin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUserId)
      .single();

    if (!usuario) throw new ForbiddenException('Usuario no encontrado.');

    const { data: cliente } = await admin
      .from('cliente')
      .select('id')
      .eq('usuario_id', usuario.id)
      .single();

    if (!cliente)
      throw new ForbiddenException('Perfil de cliente no encontrado.');

    // 3. Obtener Reserva y Seguimiento
    const { data: reserva, error: errReserva } = await admin
      .from('reserva')
      .select(
        `
      id,
      estado,
      estado_pago,
      metodo_pago_id,
      cliente_id,
      cliente_confirmo_finalizacion,
      ninera_id,
      seguimiento_sesion (
        hora_entrada_real,
        hora_salida_real,
        tiempo_total_trabajado
      )
    `,
      )
      .eq('id', reservaId)
      .single();

    if (errReserva || !reserva)
      throw new NotFoundException('Reserva no encontrada.');

    if (cliente.id !== reserva.cliente_id) {
      throw new ForbiddenException(
        'No tienes permiso para confirmar esta reserva.',
      );
    }

    const estadosElegibles = [
      'pendiente_confirmacion',
      'completada',
      'en_progreso',
    ];
    if (!estadosElegibles.includes(reserva.estado)) {
      throw new BadRequestException(
        `No se puede confirmar en estado "${reserva.estado}".`,
      );
    }

    const { data: pago } = await admin
      .from('pago')
      .select('tarifa_por_hora, estado_pago')
      .eq('reserva_id', reservaId)
      .maybeSingle();

    const { data: metodoPago } = await admin
      .from('metodo_pago')
      .select('nombre')
      .eq('id', (reserva as any).metodo_pago_id)
      .maybeSingle();

    const seg: any = Array.isArray(reserva.seguimiento_sesion)
      ? reserva.seguimiento_sesion[0]
      : reserva.seguimiento_sesion;

    const tarifaPorHora = parseFloat(pago?.tarifa_por_hora ?? '0');
    const horasTrabajadas = parseFloat(seg?.tiempo_total_trabajado ?? '0');
    const totalCalculado = +(horasTrabajadas * tarifaPorHora).toFixed(2);
    const metodoPagoNombre = metodoPago?.nombre || '';
    const esTarjetaReal = metodoPagoNombre.toLowerCase().includes('tarjeta');
    const pagoYaCompletado =
      reserva.estado_pago === 'completada' || pago?.estado_pago === 'completado';


    const updateReserva: any = {
      estado: 'completada',
      cliente_confirmo_finalizacion: true,
      fecha_confirmacion_cliente: new Date().toISOString(),
      total_calculado: totalCalculado,
    };

    const updatePago: any = {
      total_a_recibir: totalCalculado,
    };

    if (esTarjetaReal && !pagoYaCompletado) {
      updateReserva.estado_pago = 'completada';
      updatePago.estado_pago = 'completado';
    }

    await admin.from('reserva').update(updateReserva).eq('id', reservaId);

    if (pago) {
      await admin.from('pago').update(updatePago).eq('reserva_id', reservaId);
    }

    return {
      success: true,
      message: esTarjetaReal
        ? 'Finalización y pago con tarjeta confirmados.'
        : 'Finalización confirmada. Pendiente confirmación de cobro en efectivo por la niñera.',
      horas_trabajadas: horasTrabajadas.toFixed(2),
      total_calculado: totalCalculado,
      metodo_pago: metodoPagoNombre,
    };
  }

  async confirmarCobroEfectivoNinera(reservaId: string, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: usuario, error: errUser } = await admin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUserId)
      .single();

    if (!usuario) throw new ForbiddenException('Usuario no encontrado.');

    const { data: ninera } = await admin
      .from('ninera')
      .select('id')
      .eq('usuario_id', usuario.id)
      .single();
    if (!ninera)
      throw new ForbiddenException('Perfil de niñera no encontrado.');

    const { data: reserva, error: errReserva } = await admin
      .from('reserva')
      .select('*')
      .eq('id', reservaId)
      .single();

    if (errReserva || !reserva)
      throw new NotFoundException('Reserva no encontrada.');
    if (ninera.id !== reserva.ninera_id) {
      throw new ForbiddenException('No tienes permiso sobre esta reserva.');
    }

    const { data: pago, error: errPago } = await admin
      .from('pago')
      .select('*')
      .eq('reserva_id', reservaId)
      .single();

    if (errPago || !pago) {
      throw new NotFoundException('Pago no encontrado.');
    }

    await admin
      .from('reserva')
      .update({
        estado_pago: 'completada',
      })
      .eq('id', reservaId);

    if (pago) {
      await admin
        .from('pago')
        .update({
          total_a_recibir: reserva.monto_total,
          estado_pago: 'completado',
        })
        .eq('reserva_id', reservaId);
    }

    return {
      success: true,
      message: 'Cobro en efectivo confirmado correctamente',
      total_calculado: reserva.monto_total,
    };
  }

  ///////Permite al cliente crear reseñas

  async crearResena(resenaDto: any, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    const malasPalabras = [
      'estupida',
      'basura',
      'mierda',
      'puto',
      'puta',
      'estupido',
      'pendeja',
      'pendejo',
    ];
    const comentarioLimpio = resenaDto.comentario.toLowerCase();
    const contieneInsultos = malasPalabras.some((palabra) =>
      comentarioLimpio.includes(palabra),
    );

    if (contieneInsultos) {
      throw new BadRequestException(
        'El comentario contiene lenguaje inapropiado.',
      );
    }

    if (resenaDto.reserva_id) {
      const { data: existeResena } = await admin
        .from('resena')
        .select('id')
        .eq('reserva_id', resenaDto.reserva_id)
        .maybeSingle();

      if (existeResena) {
        throw new BadRequestException(
          'Ya has calificado esta reserva anteriormente.',
        );
      }
    }

    const { data: usuarioAutor, error: errorUser } = await admin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUserId)
      .maybeSingle();

    if (errorUser || !usuarioAutor) {
      throw new BadRequestException('Tu cuenta de usuario no fue encontrada.');
    }

    const { data: nineraData, error: errorNinera } = await admin
      .from('ninera')
      .select('usuario_id')
      .eq('id', resenaDto.ninera_id)
      .maybeSingle();

    if (errorNinera || !nineraData) {
      throw new BadRequestException('No se encontró el perfil de la niñera.');
    }

    const { data: nuevaResena, error: errorInsert } = await admin
      .from('resena')
      .insert({
        reserva_id: resenaDto.reserva_id || null,
        autor_id: usuarioAutor.id,
        receptor_id: nineraData.usuario_id,
        puntuacion: Number(resenaDto.puntuacion),
        comentario: resenaDto.comentario,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (errorInsert) {
      if (errorInsert.code === '23505') {
        throw new BadRequestException('Esta reserva ya cuenta con una reseña.');
      }
      throw new BadRequestException(
        `Error al insertar reseña: ${errorInsert.message}`,
      );
    }

    const { data: resenas } = await admin
      .from('resena')
      .select('puntuacion')
      .eq('receptor_id', nineraData.usuario_id);

    if (resenas && resenas.length > 0) {
      const suma = resenas.reduce((acc, curr) => acc + curr.puntuacion, 0);
      const promedio = parseFloat((suma / resenas.length).toFixed(1));

      await admin
        .from('ninera')
        .update({ promedio_rating: promedio })
        .eq('id', resenaDto.ninera_id);
    }

    return {
      success: true,
      message: '¡Reseña publicada exitosamente!',
      data: nuevaResena,
    };
  }

  async cancelarReserva(reservaId: string, motivo: string, authUserId: string) {
    const admin = this.supabaseService.getAdminClient();

    if (!motivo || motivo.trim().length < 5) {
      throw new BadRequestException(
        'Debes indicar un motivo de cancelación (mínimo 5 caracteres).',
      );
    }

    const { data: reserva } = await admin
      .from('reserva')
      .select('id, estado, cliente_id, ninera_id')
      .eq('id', reservaId)
      .maybeSingle();

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    if (reserva.estado !== 'confirmada') {
      throw new BadRequestException(
        'Solo se pueden cancelar reservas que ya estén confirmadas.',
      );
    }

    const { data: usuario } = await admin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUserId)
      .maybeSingle();
    if (!usuario) throw new BadRequestException('Usuario no encontrado');

    const { data: clienteData } = await admin
      .from('cliente')
      .select('id, usuario_id')
      .eq('id', reserva.cliente_id)
      .maybeSingle();
    const { data: nineraData } = await admin
      .from('ninera')
      .select('id, usuario_id')
      .eq('id', reserva.ninera_id)
      .maybeSingle();

    const esCliente = clienteData?.usuario_id === usuario.id;
    const esNinera = nineraData?.usuario_id === usuario.id;

    if (!esCliente && !esNinera)
      throw new BadRequestException(
        'No tienes permiso para cancelar esta reserva.',
      );

    const canceladoPor = esCliente ? 'cliente' : 'ninera';

    const { data: reservaActualizada, error } = await admin
      .from('reserva')
      .update({
        estado: 'cancelada',
        motivo_cancelacion: motivo.trim(),
        cancelado_por: canceladoPor,
      })
      .eq('id', reservaId)
      .select()
      .single();

    if (error)
      throw new BadRequestException(`Error al cancelar: ${error.message}`);

    // Contar cancelaciones para advertencia
    let totalCancelaciones = 0;
    if (esCliente && clienteData) {
      const { count } = await admin
        .from('reserva')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteData.id)
        .eq('estado', 'cancelada');
      totalCancelaciones = count || 0;
    } else if (esNinera && nineraData) {
      const { count } = await admin
        .from('reserva')
        .select('id', { count: 'exact', head: true })
        .eq('ninera_id', nineraData.id)
        .eq('estado', 'cancelada');
      totalCancelaciones = count || 0;
    }

    const advertencia =
      totalCancelaciones >= 5
        ? `⚠️ Llevas ${totalCancelaciones} cancelaciones. A partir de 5 cancelaciones empezaremos a evaluar los motivos para garantizar la calidad del servicio.`
        : null;

    return {
      message: 'Reserva cancelada exitosamente.',
      reserva: reservaActualizada,
      cancelado_por: canceladoPor,
      total_cancelaciones: totalCancelaciones,
      advertencia,
    };
  }
}



