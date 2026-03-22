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

    // 1. Buscar en la tabla 'usuario' usando el UUID de Auth
    const { data: usuarioPerfil, error: usuarioError } = await admin
      .from('usuario')
      .select('id')
      .eq('auth_id', authUserId) // Campo según tu esquema
      .single();

    if (usuarioError || !usuarioPerfil) {
      throw new BadRequestException(
        `No se encontró el usuario para el UUID: ${authUserId}`,
      );
    }

    // 2. Buscar el Cliente y su Persona asociada (Relación directa en tabla cliente)
    const { data: cliente, error: clienteError } = await admin
      .from('cliente')
      .select('id, persona_id') // Obtenemos el ID de la persona desde aquí
      .eq('usuario_id', usuarioPerfil.id)
      .single();

    if (clienteError || !cliente) {
      throw new BadRequestException(
        'El usuario no tiene un perfil de cliente.',
      );
    }

    // 3. Buscar la dirección en la tabla 'persona' usando el persona_id del cliente
    const { data: persona, error: personaError } = await admin
      .from('persona')
      .select('id_direccion') // Campo según tu esquema
      .eq('id', cliente.persona_id)
      .single();

    if (personaError || !persona) {
      throw new BadRequestException(
        'No se encontró la información de la persona.',
      );
    }

    // 4. Insertar Reserva (SIN la columna 'turno')
    const duracion_horas = this.calcularDuracionHoras(
      createReservaDto.hora_inicio,
      createReservaDto.hora_fin,
    );

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
        duracion_horas,
        notas_importantes: createReservaDto.notas_importantes || null,
        monto_total:
          parseFloat(createReservaDto.monto_base) +
          (parseFloat(createReservaDto.propina) || 0),
        estado: 'pendiente',
        estado_pago: 'pendiente',
        // 'turno' eliminado para evitar el error de esquema
      })
      .select()
      .single();

    if (reservaError || !reserva) {
      throw new BadRequestException(
        `Error reserva: ${reservaError?.message || 'Error desconocido'}`,
      );
    }

    // 5. Insertar Pago
    await admin.from('pago').insert({
      reserva_id: reserva.id,
      hora_programada: duracion_horas,
      tarifa_por_hora: parseFloat(createReservaDto.monto_base) / duracion_horas,
      servicio_base: parseFloat(createReservaDto.monto_base),
      propina: parseFloat(createReservaDto.propina) || 0,
      total_a_recibir:
        parseFloat(createReservaDto.monto_base) +
        (parseFloat(createReservaDto.propina) || 0),
      estado_pago: 'pendiente',
    });

    // 6. Relación con niños
    if (createReservaDto.ninos_ids?.length > 0) {
      const insertNinos = createReservaDto.ninos_ids.map((id: string) => ({
        reserva_id: reserva.id,
        nino_id: id,
      }));
      await admin.from('reserva_nino').insert(insertNinos);
    }

    return { message: 'Reserva creada con éxito', reservaId: reserva.id };
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

    if (nineraError || !ninera)
      throw new NotFoundException('Niñera no encontrada');

    const { data, error } = await admin
      .from('reserva')
      .select(
        `
        *,
        cliente (id, persona (nombre, apellido, foto_url))
      `,
      )
      .eq('ninera_id', ninera.id)
      .order('fecha_servicio', { ascending: false });

    if (error)
      throw new BadRequestException(
        `Error obteniendo reservas de niñera: ${error.message}`,
      );
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
}
