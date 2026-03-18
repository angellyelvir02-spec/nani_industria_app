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
      throw new BadRequestException('La hora de fin debe ser mayor que la hora de inicio');
    }

    const duracionMinutos = minutosFin - minutosInicio;
    return duracionMinutos / 60;
  }

  async create(createReservaDto: CreateReservaDto) {
    const admin = this.supabaseService.getAdminClient();

    const {
      cliente_id,
      ninera_id,
      direccion_id,
      metodo_pago_id,
      fecha_servicio,
      turno,
      hora_inicio,
      hora_fin,
      notas_importantes,
      ninos_ids,
    } = createReservaDto;

    if (!ninos_ids || ninos_ids.length === 0) {
      throw new BadRequestException('Debes enviar al menos un niño para la reserva');
    }

    const duracion_horas = this.calcularDuracionHoras(hora_inicio, hora_fin);

    const codigo_reserva = `RES-${Date.now()}`;

    const { data: choque, error: choqueError } = await admin
      .from('reserva')
      .select('id, hora_inicio, hora_fin, estado')
      .eq('ninera_id', ninera_id)
      .eq('fecha_servicio', fecha_servicio)
      .in('estado', ['pendiente', 'confirmada', 'en_progreso']);

    if (choqueError) {
      throw new BadRequestException(`Error validando disponibilidad: ${choqueError.message}`);
    }

    const nuevaInicio = hora_inicio;
    const nuevaFin = hora_fin;

    const hayCruce = (choque || []).some((r) => {
      return nuevaInicio < r.hora_fin && nuevaFin > r.hora_inicio;
    });

    if (hayCruce) {
      throw new BadRequestException('La niñera ya tiene una reserva en ese horario');
    }

    const { data: reserva, error: reservaError } = await admin
      .from('reserva')
      .insert({
        codigo_reserva,
        cliente_id,
        ninera_id,
        direccion_id,
        metodo_pago_id,
        fecha_servicio,
        turno: turno || null,
        hora_inicio,
        hora_fin,
        duracion_horas,
        estado: 'pendiente',
        notas_importantes: notas_importantes || null,
      })
      .select()
      .single();

    if (reservaError || !reserva) {
      throw new BadRequestException(`Error creando reserva: ${reservaError?.message}`);
    }

    const insertNinos = ninos_ids.map((ninoId) => ({
      reserva_id: reserva.id,
      nino_id: ninoId,
    }));

    const { error: ninosError } = await admin
      .from('reserva_nino')
      .insert(insertNinos);

    if (ninosError) {
      throw new BadRequestException(`Reserva creada, pero falló la asociación de niños: ${ninosError.message}`);
    }

    return {
      message: 'Reserva creada correctamente',
      reserva,
    };
  }

  async findAll() {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('reserva')
      .select(`
        *,
        cliente (
          id,
          persona (
            nombre,
            apellido,
            foto_url
          )
        ),
        ninera (
          id,
          persona (
            nombre,
            apellido,
            foto_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Error obteniendo reservas: ${error.message}`);
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
      .select(`
        *,
        cliente (
          id,
          persona (
            nombre,
            apellido,
            foto_url
          )
        )
      `)
      .eq('ninera_id', ninera.id)
      .order('fecha_servicio', { ascending: false });

    if (error) {
      throw new BadRequestException(`Error obteniendo reservas de niñera: ${error.message}`);
    }

    return data;
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('reserva')
      .select(`
        *,
        cliente (
          id,
          persona (
            nombre,
            apellido,
            foto_url
          )
        ),
        ninera (
          id,
          persona (
            nombre,
            apellido,
            foto_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return data;
  }

  update(id: string, updateReservaDto: UpdateReservaDto) {
    return {
      message: `Aquí irá la actualización de la reserva ${id}`,
      data: updateReservaDto,
    };
  }

  remove(id: string) {
    return {
      message: `Aquí irá la eliminación de la reserva ${id}`,
    };
  }
}