import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class DisponibilidadService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async saveDisponibilidad(body: {
    usuario_id: string;
    disponibilidad: {
      dia_semana: string;
      hora_inicio: string;
      hora_fin: string;
    }[];
  }) {
    const admin = this.supabaseService.getAdminClient();

    if (!body.usuario_id) {
      throw new BadRequestException('usuario_id es requerido');
    }

    if (!body.disponibilidad || body.disponibilidad.length === 0) {
      throw new BadRequestException('No se recibió disponibilidad');
    }

    const { data: ninera, error: nineraError } = await admin
      .from('ninera')
      .select('id')
      .eq('usuario_id', body.usuario_id)
      .single();

    if (nineraError || !ninera) {
      throw new BadRequestException('No se encontró la niñera');
    }

    const insertData = body.disponibilidad.map((item) => ({
      ninera_id: ninera.id,
      dia_semana: item.dia_semana,
      hora_inicio: item.hora_inicio,
      hora_fin: item.hora_fin,
    }));

    const { error } = await admin
      .from('disponibilidad_ninera')
      .insert(insertData);

    if (error) {
      throw new BadRequestException(
        `Error guardando disponibilidad: ${error.message}`,
      );
    }

    return {
      message: 'Disponibilidad guardada correctamente',
    };
  }
}