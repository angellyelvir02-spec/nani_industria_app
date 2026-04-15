import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class DisponibilidadService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDisponibilidadByUsuario(usuarioId: string) {
    const admin = this.supabaseService.getAdminClient();

    if (!usuarioId) {
      throw new BadRequestException('usuario_id es requerido');
    }

    const { data: ninera, error: nineraError } = await admin
      .from('ninera')
      .select('id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (nineraError) {
      throw new InternalServerErrorException(
        `Error de base de datos: ${nineraError.message}`,
      );
    }

    if (!ninera) {
      throw new BadRequestException('No se encontró la niñera');
    }

    const { data, error } = await admin
      .from('disponibilidad_ninera')
      .select('id, dia_semana, hora_inicio, hora_fin')
      .eq('ninera_id', ninera.id)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(
        `Error obteniendo disponibilidad: ${error.message}`,
      );
    }

    return data || [];
  }

  async saveDisponibilidad(body: {
    usuario_id: string;
    disponibilidad: {
      dia_semana: string;
      hora_inicio: string;
      hora_fin: string;
    }[];
  }) {
    const admin = this.supabaseService.getAdminClient();

    if (!body?.usuario_id) {
      throw new BadRequestException('usuario_id es requerido');
    }

    if (!Array.isArray(body.disponibilidad) || body.disponibilidad.length === 0) {
      throw new BadRequestException('No se recibió disponibilidad');
    }

    const diasValidos = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ];

    const horaRegex = /^([01]\d|2[0-3]):00$/;

    for (const item of body.disponibilidad) {
      if (!item.dia_semana || !diasValidos.includes(item.dia_semana)) {
        throw new BadRequestException(
          `Día inválido: ${item.dia_semana}`,
        );
      }

      if (!item.hora_inicio || !horaRegex.test(item.hora_inicio)) {
        throw new BadRequestException(
          `Hora de inicio inválida para ${item.dia_semana}`,
        );
      }

      if (!item.hora_fin || !horaRegex.test(item.hora_fin)) {
        throw new BadRequestException(
          `Hora de fin inválida para ${item.dia_semana}`,
        );
      }

      const inicio = parseInt(item.hora_inicio.split(':')[0], 10);
      const fin = parseInt(item.hora_fin.split(':')[0], 10);

      if (inicio >= fin) {
        throw new BadRequestException(
          `La hora_inicio debe ser menor que hora_fin en ${item.dia_semana}`,
        );
      }
    }

    try {
      const { data: ninera, error: nineraError } = await admin
        .from('ninera')
        .select('id')
        .eq('usuario_id', body.usuario_id)
        .maybeSingle();

      if (nineraError) {
        console.error(
          'Error buscando niñera en saveDisponibilidad:',
          nineraError,
        );
        throw new InternalServerErrorException(
          `Error de base de datos: ${nineraError.message}`,
        );
      }

      if (!ninera) {
        throw new BadRequestException('No se encontró la niñera');
      }

      const insertData = body.disponibilidad.map((item) => ({
        ninera_id: ninera.id,
        dia_semana: item.dia_semana,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
      }));

      const { error: deleteError } = await admin
        .from('disponibilidad_ninera')
        .delete()
        .eq('ninera_id', ninera.id);

      if (deleteError) {
        console.error(
          'Error limpiando disponibilidad previa en saveDisponibilidad:',
          deleteError,
        );
        throw new InternalServerErrorException(
          `Error limpiando disponibilidad previa: ${deleteError.message}`,
        );
      }

      const { error } = await admin
        .from('disponibilidad_ninera')
        .insert(insertData);

      if (error) {
        console.error(
          'Error guardando disponibilidad en saveDisponibilidad:',
          error,
        );
        throw new InternalServerErrorException(
          `Error guardando disponibilidad: ${error.message}`,
        );
      }

      return {
        message: 'Disponibilidad guardada correctamente',
      };
    } catch (err) {
      console.error('Error crítico en saveDisponibilidad:', err);

      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al guardar disponibilidad',
      );
    }
  }
}
