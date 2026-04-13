import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Disponibilidad_reserva } from './dto/disponibilidad.dto';

@Injectable()
export class NinerasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Retorna las niñeras verificadas para mostrarse en el dashboard del cliente
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

      return data ?? [];
    } catch (err) {
      console.error('Error crítico en findAll:', err);

      if (err instanceof InternalServerErrorException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al obtener niñeras',
      );
    }
  }

  // Retorna el detalle de una niñera por su ID
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
            direccion:id_direccion (
              id,
              direccion_completa,
              latitud,
              longitud
            )
          ),
          habilidades:habilidad_ninera (
            nombre
          ),
          certificaciones:certificaciones_ninera (
            nombre
          ),
          disponibilidad:disponibilidad_ninera (
            dia_semana,
            hora_inicio,
            hora_fin
          )
        `,
        )
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error de Supabase en findOne:', error);
        throw new InternalServerErrorException(
          `Error de base de datos: ${error.message}`,
        );
      }

      if (!data) {
        throw new NotFoundException('La niñera no existe');
      }

      return data;
    } catch (err) {
      console.error('Error crítico en findOne:', err);

      if (
        err instanceof NotFoundException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Error al cargar el detalle');
    }
  }

  // Retorna el perfil propio de la niñera usando usuario_id
  async findOneByUsuario(usuarioId: string) {
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
          presentacion,
          persona:persona_id (
            id,
            nombre,
            apellido,
            foto_url,
            id_direccion,
            direccion:id_direccion (
              direccion_completa,
              latitud,
              longitud
            )
          ),
          usuario:usuario_id (
            correo
          ),
          habilidades:habilidad_ninera (
            nombre
          ),
          certificaciones:certificaciones_ninera (
            nombre
          )
        `,
        )
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (error) {
        console.error('Error de Supabase en findOneByUsuario:', error);
        throw new InternalServerErrorException(
          `Error de base de datos: ${error.message}`,
        );
      }

      if (!data) {
        throw new NotFoundException('No se encontró el perfil');
      }

      return data;
    } catch (err) {
      console.error('Error crítico en findOneByUsuario:', err);

      if (
        err instanceof NotFoundException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Error al obtener el perfil');
    }
  }

  // Actualiza la foto de perfil de la niñera a partir del usuario_id
  async updateFotoPerfil(usuarioId: string, foto: Express.Multer.File) {
    const client = this.supabaseService.getAdminClient();

    if (!foto) {
      throw new NotFoundException('No se recibió ninguna imagen');
    }

    try {
      const { data: ninera, error: nineraError } = await client
        .from('ninera')
        .select('id, persona_id')
        .eq('usuario_id', usuarioId)
        .maybeSingle();

      if (nineraError) {
        console.error(
          'Error buscando niñera en updateFotoPerfil:',
          nineraError,
        );
        throw new InternalServerErrorException(
          `Error de base de datos: ${nineraError.message}`,
        );
      }

      if (!ninera) {
        throw new NotFoundException('No se encontró la niñera');
      }

      const safeOriginalName = foto.originalname.replace(/[^\w.\-]/g, '_');
      const fileName = `perfil-${usuarioId}-${Date.now()}-${safeOriginalName}`;

      const { error: uploadError } = await client.storage
        .from('documentos')
        .upload(fileName, foto.buffer, {
          contentType: foto.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error(
          'Error subiendo imagen en updateFotoPerfil:',
          uploadError,
        );
        throw new InternalServerErrorException(
          `Error subiendo imagen: ${uploadError.message}`,
        );
      }

      const {
        data: { publicUrl },
      } = client.storage.from('documentos').getPublicUrl(fileName);

      if (!publicUrl) {
        throw new InternalServerErrorException(
          'No se pudo obtener la URL pública de la imagen',
        );
      }

      const { error: updateError } = await client
        .from('persona')
        .update({ foto_url: publicUrl })
        .eq('id', ninera.persona_id);

      if (updateError) {
        console.error(
          'Error actualizando foto_url en updateFotoPerfil:',
          updateError,
        );
        throw new InternalServerErrorException(
          `Error actualizando foto: ${updateError.message}`,
        );
      }

      return {
        message: 'Foto de perfil actualizada correctamente',
        foto_url: publicUrl,
      };
    } catch (err) {
      console.error('Error crítico en updateFotoPerfil:', err);

      if (
        err instanceof NotFoundException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al actualizar la foto de perfil',
      );
    }
  }

  // Retorna bloques horarios disponibles de una niñera para una fecha dada
  async getAvailableSlots(dto: Disponibilidad_reserva) {
    const { nineraId, fecha } = dto;
    const client = this.supabaseService.getAdminClient();

    const diasSemanas = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    try {
      const [year, month, day] = fecha.split('-').map(Number);

      if (!year || !month || !day) {
        throw new InternalServerErrorException(
          'La fecha recibida no tiene un formato válido',
        );
      }

      const dateObj = new Date(year, month - 1, day);
      const diaSemanaNombre = diasSemanas[dateObj.getDay()];

      console.log(
        `Consulta Nani: ${fecha} -> Detectado como: ${diaSemanaNombre}`,
      );

      const { data: horarioBase, error: errorBase } = await client
        .from('disponibilidad_ninera')
        .select('hora_inicio, hora_fin')
        .eq('ninera_id', nineraId)
        .eq('dia_semana', diaSemanaNombre)
        .maybeSingle();

      if (errorBase) {
        console.error(
          'Error obteniendo horario base en getAvailableSlots:',
          errorBase,
        );
        throw new InternalServerErrorException(
          `Error de base de datos: ${errorBase.message}`,
        );
      }

      if (!horarioBase) {
        return [];
      }

      const { data: reservas, error: reservasError } = await client
        .from('reserva')
        .select('hora_inicio, hora_fin')
        .eq('ninera_id', nineraId)
        .eq('fecha_servicio', fecha)
        .neq('estado', 'cancelado');

      if (reservasError) {
        console.error(
          'Error obteniendo reservas en getAvailableSlots:',
          reservasError,
        );
        throw new InternalServerErrorException(
          `Error de base de datos: ${reservasError.message}`,
        );
      }

      const slots: { time: string; status: 'occupied' | 'available' }[] = [];

      const inicio = parseInt(horarioBase.hora_inicio.split(':')[0], 10);
      const fin = parseInt(horarioBase.hora_fin.split(':')[0], 10);

      if (Number.isNaN(inicio) || Number.isNaN(fin)) {
        throw new InternalServerErrorException(
          'El horario configurado no tiene un formato válido',
        );
      }

      for (let hora = inicio; hora <= fin; hora++) {
        const horaStr = `${hora.toString().padStart(2, '0')}:00`;

        const estaOcupado = (reservas ?? []).some((res) => {
          const resInicio = parseInt(res.hora_inicio.split(':')[0], 10);
          const resFin = parseInt(res.hora_fin.split(':')[0], 10);

          if (Number.isNaN(resInicio) || Number.isNaN(resFin)) {
            return false;
          }

          return hora >= resInicio && hora <= resFin;
        });

        slots.push({
          time: horaStr,
          status: estaOcupado ? 'occupied' : 'available',
        });
      }

      return slots;
    } catch (err) {
      console.error('Error crítico en getAvailableSlots:', err);

      if (err instanceof InternalServerErrorException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al obtener horarios disponibles',
      );
    }
  }

  //mostrar reseñas en el perfil de la niñera

  async obtenerResenasPorNinera(nineraId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data: ninera } = await admin
      .from('ninera')
      .select('usuario_id')
      .eq('id', nineraId)
      .single();

    if (!ninera) throw new BadRequestException('Niñera no encontrada');

    const { data, error } = await admin
      .from('resena')
      .select(
        `
      id,
      puntuacion,
      comentario,
      created_at,
      autor:usuario!resenas_autor_id_fkey (
        id,
        cliente!cliente_usuario_id_fkey ( 
          persona:persona (
            nombre,
            apellido,
            foto_url
          )
        )
      )
    `,
      )
      .eq('receptor_id', ninera.usuario_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(
        `Error al obtener reseñas: ${error.message}`,
      );
    }

    return data.map((r: any) => {
      const cliente = Array.isArray(r.autor?.cliente)
        ? r.autor.cliente[0]
        : r.autor?.cliente;
      const persona = cliente?.persona;

      return {
        id: r.id,
        puntuacion: r.puntuacion,
        comentario: r.comentario,
        created_at: r.created_at,
        autor_nombre: persona
          ? `${persona.nombre} ${persona.apellido}`.trim()
          : 'Usuario de Nani',
        autor_foto: persona?.foto_url || null,
      };
    });
  }
}
