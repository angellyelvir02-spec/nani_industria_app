import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReservasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private calcularDuracionHoras(horaInicio: string, horaFin: string): number {
    if (!horaInicio || !horaFin) return 1;
    const inicio = parseInt(horaInicio.split(':')[0], 10);
    const fin = parseInt(horaFin.split(':')[0], 10);

    if (inicio === fin) return 1;
    return Math.abs(fin - inicio) + 1;
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
        estado_pago: 'pendiente',
      })
      .select()
      .single();

    if (reservaError || !reserva) {
      throw new BadRequestException(
        `Error al guardar reserva: ${reservaError?.message}`,
      );
    }

    const tarifaPorHora = duracion > 0 ? montoBase / duracion : 0;

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
        estado_pago: 'pendiente',
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
      } else {
        patchData.estado = estadoNormalizado;
      }

      if (!allowedStates.includes(patchData.estado)) {
        throw new BadRequestException(
          `Estado inválido para reserva: ${patchData.estado}`,
        );
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

    return (data || []).map((res: any) => {
      let visualStatus:
        | 'confirmed'
        | 'pending'
        | 'completed'
        | 'cancelled'
        | 'en_progreso' = 'pending';

      if (res.estado === 'completada') {
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
        rating: 5.0,
        reviewed: false,
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
      paymentStatus: data.estado_pago || 'pendiente',
      scheduledHours: data.duracion_horas,
      childrenArray: listaNinos,
      status: data.estado,
      checkInReal: seguimiento?.hora_entrada_real || null,
      checkOutReal: seguimiento?.hora_salida_real || null,
      tiempoTotalTrabajado: seguimiento?.tiempo_total_trabajado || null,
      baseAmount: pago?.servicio_base || 0,
      feeAmount: data.monto_comision || 0,
      cargo_tiempo_adicional: pago?.cargo_tiempo_adicional || 0,
      tip: pago?.propina || 0,
      total: data.monto_total,
      paymentMethodName: metodo_pago?.nombre || '',
    };
  }

  async procesarCheckin(
    reservaId: string,
    body: {
      qrCode?: string;
      checkInTime?: string | number;
    },
  ) {
    const admin = this.supabaseService.getAdminClient();

    const { data: reserva, error: errorReserva } = await admin
      .from('reserva')
      .select('id, estado, codigo_reserva')
      .eq('id', reservaId)
      .maybeSingle();

    if (errorReserva) {
      throw new InternalServerErrorException(
        `Error consultando reserva: ${errorReserva.message}`,
      );
    }

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado !== 'confirmada') {
      throw new BadRequestException(
        'La reserva debe estar confirmada para registrar entrada',
      );
    }

    const checkInIso = body?.checkInTime
      ? new Date(Number(body.checkInTime)).toISOString()
      : new Date().toISOString();

    const { data: seguimientoExistente, error: errorSeguimiento } = await admin
      .from('seguimiento_sesion')
      .select('id, hora_entrada_real')
      .eq('reserva_id', reservaId)
      .maybeSingle();

    if (errorSeguimiento) {
      throw new InternalServerErrorException(
        `Error consultando seguimiento: ${errorSeguimiento.message}`,
      );
    }

    if (seguimientoExistente?.hora_entrada_real) {
      throw new BadRequestException('La entrada ya fue registrada');
    }

    if (seguimientoExistente?.id) {
      const { error: updateSeguimientoError } = await admin
        .from('seguimiento_sesion')
        .update({
          hora_entrada_real: checkInIso,
          codigo_qr_entrada: body?.qrCode || null,
        })
        .eq('id', seguimientoExistente.id);

      if (updateSeguimientoError) {
        throw new InternalServerErrorException(
          `Error actualizando seguimiento: ${updateSeguimientoError.message}`,
        );
      }
    } else {
      const { error: insertSeguimientoError } = await admin
        .from('seguimiento_sesion')
        .insert({
          reserva_id: reservaId,
          hora_entrada_real: checkInIso,
          codigo_qr_entrada: body?.qrCode || null,
        });

      if (insertSeguimientoError) {
        throw new InternalServerErrorException(
          `Error creando seguimiento: ${insertSeguimientoError.message}`,
        );
      }
    }

    const { data: reservaActualizada, error: errorUpdateReserva } = await admin
      .from('reserva')
      .update({
        estado: 'en_progreso',
      })
      .eq('id', reservaId)
      .select()
      .single();

    if (errorUpdateReserva) {
      throw new InternalServerErrorException(
        `Error actualizando reserva: ${errorUpdateReserva.message}`,
      );
    }

    return {
      message: 'Check-in registrado con éxito',
      reserva: reservaActualizada,
      checkInTime: checkInIso,
    };
  }

  async procesarCheckout(
    reservaId: string,
    body?: {
      rating?: number;
      comments?: string;
      checkInTime?: string | number;
      checkOutTime?: string | number;
      totalHours?: number;
      totalPayment?: number;
      qrCode?: string;
    },
  ) {
    const admin = this.supabaseService.getAdminClient();

    const { data: reserva, error: errorReserva } = await admin
      .from('reserva')
      .select(
        `
        id,
        cliente_id,
        ninera_id,
        fecha_servicio,
        hora_inicio,
        hora_fin,
        estado,
        monto_total,
        estado_pago,
        pago (
          id,
          tarifa_por_hora,
          servicio_base,
          propina,
          cargo_tiempo_adicional,
          total_a_recibir,
          estado_pago
        ),
        seguimiento_sesion (
          id,
          hora_entrada_real,
          hora_salida_real
        )
      `,
      )
      .eq('id', reservaId)
      .maybeSingle();

    if (errorReserva) {
      throw new InternalServerErrorException(
        `Error consultando reserva: ${errorReserva.message}`,
      );
    }

    if (!reserva) {
      throw new NotFoundException('La reserva no existe');
    }

    if (reserva.estado !== 'en_progreso') {
      throw new BadRequestException(
        'La reserva debe estar en progreso para registrar salida',
      );
    }

    const pago = Array.isArray((reserva as any).pago)
      ? (reserva as any).pago[0]
      : (reserva as any).pago;

    if (!pago) {
      throw new BadRequestException(
        'No se encontró información de pago para esta reserva',
      );
    }

    const seguimiento = Array.isArray((reserva as any).seguimiento_sesion)
      ? (reserva as any).seguimiento_sesion[0]
      : (reserva as any).seguimiento_sesion;

    const checkInIso = body?.checkInTime
      ? new Date(Number(body.checkInTime)).toISOString()
      : seguimiento?.hora_entrada_real;

    if (!checkInIso) {
      throw new BadRequestException(
        'No se encontró la hora de entrada para esta sesión',
      );
    }

    const checkOutIso = body?.checkOutTime
      ? new Date(Number(body.checkOutTime)).toISOString()
      : new Date().toISOString();

    const workedHours =
      body?.totalHours !== undefined &&
      body?.totalHours !== null &&
      Number.isFinite(Number(body.totalHours))
        ? Number(body.totalHours)
        : Math.max(
            0,
            (new Date(checkOutIso).getTime() - new Date(checkInIso).getTime()) /
              3600000,
          );

    if (!Number.isFinite(workedHours) || workedHours < 0) {
      throw new BadRequestException('El total de horas trabajado es inválido');
    }

    const tarifaPorHora = Number(pago.tarifa_por_hora) || 0;
    const propina = Number(pago.propina) || 0;
    const servicioBase = Number(pago.servicio_base) || 0;
    const horasProgramadas = Number((pago as any).hora_programada || 0);

    const overtimeHours = Math.max(0, workedHours - horasProgramadas);
    const cargoTiempoAdicional = overtimeHours * tarifaPorHora;

    const totalFinal =
      body?.totalPayment !== undefined &&
      body?.totalPayment !== null &&
      Number.isFinite(Number(body.totalPayment))
        ? Number(body.totalPayment)
        : servicioBase + cargoTiempoAdicional + propina;

    const nuevoEstadoPago =
      cargoTiempoAdicional > 0 ? 'ajuste_pendiente' : 'completado';

    if (seguimiento?.id) {
      const { error: updateSeguimientoError } = await admin
        .from('seguimiento_sesion')
        .update({
          hora_entrada_real: checkInIso,
          hora_salida_real: checkOutIso,
          tiempo_total_trabajado: this.formatDurationFromHours(workedHours),
          codigo_qr_salida: body?.qrCode || null,
        })
        .eq('id', seguimiento.id);

      if (updateSeguimientoError) {
        throw new InternalServerErrorException(
          `Error actualizando seguimiento: ${updateSeguimientoError.message}`,
        );
      }
    } else {
      const { error: insertSeguimientoError } = await admin
        .from('seguimiento_sesion')
        .insert({
          reserva_id: reservaId,
          hora_entrada_real: checkInIso,
          hora_salida_real: checkOutIso,
          tiempo_total_trabajado: this.formatDurationFromHours(workedHours),
          codigo_qr_salida: body?.qrCode || null,
        });

      if (insertSeguimientoError) {
        throw new InternalServerErrorException(
          `Error creando seguimiento: ${insertSeguimientoError.message}`,
        );
      }
    }

    const { error: errorUpdatePago } = await admin
      .from('pago')
      .update({
        cargo_tiempo_adicional: Number(cargoTiempoAdicional.toFixed(2)),
        total_a_recibir: Number(totalFinal.toFixed(2)),
        estado_pago: nuevoEstadoPago,
      })
      .eq('id', pago.id);

    if (errorUpdatePago) {
      throw new BadRequestException(
        `Error al actualizar pago: ${errorUpdatePago.message}`,
      );
    }

    const { data: reservaFinalizada, error: errorUpdateReserva } = await admin
      .from('reserva')
      .update({
        estado: 'completada',
        estado_pago: nuevoEstadoPago,
        monto_total: Number(totalFinal.toFixed(2)),
      })
      .eq('id', reservaId)
      .select()
      .single();

    if (errorUpdateReserva) {
      throw new BadRequestException(
        `Error al finalizar reserva: ${errorUpdateReserva.message}`,
      );
    }

    if (
      body?.rating &&
      Number(body.rating) >= 1 &&
      Number(body.rating) <= 5 &&
      reserva.cliente_id &&
      reserva.ninera_id
    ) {
      const { data: nineraData } = await admin
        .from('ninera')
        .select('usuario_id')
        .eq('id', reserva.ninera_id)
        .maybeSingle();

      const { data: clienteData } = await admin
        .from('cliente')
        .select('usuario_id')
        .eq('id', reserva.cliente_id)
        .maybeSingle();

      if (nineraData?.usuario_id && clienteData?.usuario_id) {
        await admin.from('resena').upsert(
          {
            reserva_id: reservaId,
            autor_id: nineraData.usuario_id,
            receptor_id: clienteData.usuario_id,
            puntuacion: Number(body.rating),
            comentario: body.comments || null,
          },
          { onConflict: 'reserva_id' },
        );
      }
    }

    return {
      message: 'Checkout procesado con éxito',
      reserva: reservaFinalizada,
      checkInTime: checkInIso,
      checkOutTime: checkOutIso,
      workedHours: Number(workedHours.toFixed(2)),
      cargosAdicionales: Number(cargoTiempoAdicional.toFixed(2)),
      totalFinal: Number(totalFinal.toFixed(2)),
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
}
