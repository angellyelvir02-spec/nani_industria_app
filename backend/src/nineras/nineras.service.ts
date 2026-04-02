import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Disponibilidad_reserva } from './dto/disponibilidad.dto';

@Injectable()
export class NinerasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  //se muestran en el dashbord del cliente aquellas niñeras que han sido aprobadas

  async findAll() {
    const client = this.supabaseService.getAdminClient();

    try {
      const { data, error } = await client
        .from('ninera')
        .select(
          `
          id,
          tarifa,
          experiencia,
          verificada,
          persona:persona_id (
            nombre,
            apellido,
            foto_url,
            direccion:id_direccion ( 
              id,
              direccion_completa,
              latitud,
              longitud
            )
          )
        `,
        )
        .eq('verificada', true);

      if (error) {
        console.error('Error de Supabase en findAll:', error);
        throw new InternalServerErrorException(
          `Error de base de datos: ${error.message}`,
        );
      }
      return data;
    } catch (err) {
      console.error('Error crítico en findAll:', err);
      throw new InternalServerErrorException(
        'Error interno al obtener niñeras',
      );
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('ninera')
        .select(
          `
          id,
          tarifa,
          experiencia,
          verificada,
          presentacion,
          persona:persona_id ( 
            id, 
            nombre, 
            apellido, 
            foto_url,
            direccion:id_direccion( 
              id,
              direccion_completa,
              latitud,
              longitud
            )
          ),
          habilidades:habilidad_ninera ( nombre ),
          certificaciones:certificaciones_ninera ( nombre ),
          disponibilidad:disponibilidad_ninera ( dia_semana, hora_inicio, hora_fin )
        `,
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error de Supabase en findOne:', error);
        throw new NotFoundException(`La niñera no existe o error en consulta`);
      }
      return data;
    } catch (err) {
      console.error('Error crítico en findOne:', err);
      throw new InternalServerErrorException('Error al cargar el detalle');
    }
  }

  // 2. Corregido findOneByUsuario (Perfil propio de la niñera)
  async findOneByUsuario(usuarioId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ninera')
      .select(
        `
        id,
        tarifa,
        experiencia,
        verificada,
        presentacion,
        persona:persona_id ( 
          id, 
          nombre, 
          apellido, 
          foto_url,
          direccion:direccion_id ( // <--- CAMBIO: Quitamos 'ubicacion'
            direccion_completa,
            latitud,
            longitud
          )
        ),
        usuario:usuario_id ( correo ),
        habilidades:habilidad_ninera ( nombre ),
        certificaciones:certificaciones_ninera ( nombre )
      `,
      )
      .eq('usuario_id', usuarioId)
      .single();

    if (error) throw new NotFoundException('No se encontró el perfil');
    return data;
  }

  async updateFotoPerfil(usuarioId: string, foto: Express.Multer.File) {
    const client = this.supabaseService.getAdminClient();

    if (!foto) {
      throw new NotFoundException('No se recibió ninguna imagen');
    }

    const { data: ninera, error: nineraError } = await client
      .from('ninera')
      .select('id, persona_id')
      .eq('usuario_id', usuarioId)
      .single();

    if (nineraError || !ninera) {
      throw new NotFoundException('No se encontró la niñera');
    }

    const fileName = `perfil-${usuarioId}-${Date.now()}-${foto.originalname.replace(/\s/g, '_')}`;

    const { error: uploadError } = await client.storage
      .from('documentos')
      .upload(fileName, foto.buffer, {
        contentType: foto.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(
        `Error subiendo imagen: ${uploadError.message}`,
      );
    }

    const publicUrl = client.storage.from('documentos').getPublicUrl(fileName)
      .data.publicUrl;

    const { error: updateError } = await client
      .from('persona')
      .update({ foto_url: publicUrl })
      .eq('id', ninera.persona_id);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error actualizando foto: ${updateError.message}`,
      );
    }

    return {
      message: 'Foto de perfil actualizada correctamente',
      foto_url: publicUrl,
    };
  }

  /////..................HORARIOS DISPONIBLES

  async getAvailableSlots(dto: Disponibilidad_reserva) {
    const { nineraId, fecha } = dto;
    const client = this.supabaseService.getAdminClient();

    // 1. Mapeo de días en español coincidente con tu Base de Datos
    const diasSemanas = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    const [year, month, day] = fecha.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const diaSemanaNombre = diasSemanas[dateObj.getDay()];

    console.log(
      `Consulta Nani: ${fecha} -> Detectado como: ${diaSemanaNombre}`,
    );

    // 3. Obtener el horario base de la niñera para ese día específico
    const { data: horarioBase, error: errorBase } = await client
      .from('disponibilidad_ninera')
      .select('hora_inicio, hora_fin')
      .eq('ninera_id', nineraId)
      .eq('dia_semana', diaSemanaNombre)
      .maybeSingle();

    // Si no hay horario configurado (ej: Domingo), retornamos vacío de inmediato
    if (errorBase || !horarioBase) {
      return [];
    }

    // 4. Obtener reservas que ya existen para ese día y esa niñera
    const { data: reservas } = await client
      .from('reserva')
      .select('hora_inicio, hora_fin')
      .eq('ninera_id', nineraId)
      .eq('fecha_servicio', fecha)
      .neq('estado', 'cancelado');

    const slots: { time: string; status: 'occupied' | 'available' }[] = [];

    // 5. Generar los bloques de horas (Slots)
    // Convertimos "08:00:00" a número 8
    const inicio = parseInt(horarioBase.hora_inicio.split(':')[0]);
    const fin = parseInt(horarioBase.hora_fin.split(':')[0]);

    for (let hora = inicio; hora <= fin; hora++) {
      const horaStr = `${hora.toString().padStart(2, '0')}:00`;

      // Verificamos si esta hora cae dentro del rango de alguna reserva existente
      const estaOcupado = (reservas || []).some((res) => {
        const resInicio = parseInt(res.hora_inicio.split(':')[0]);
        const resFin = parseInt(res.hora_fin.split(':')[0]);
        // Si la hora actual está entre el inicio y el fin de una reserva
        return hora >= resInicio && hora < resFin;
      });

      slots.push({
        time: horaStr,
        status: estaOcupado ? 'occupied' : 'available',
      });
    }

    return slots;
  }
}
