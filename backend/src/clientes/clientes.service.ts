import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ClientesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private formatRelativeTime(dateString?: string | null) {
    if (!dateString) return 'Reciente';

    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diffMinutes = Math.max(1, Math.floor((now - date) / 60000));

    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `Hace ${diffDays} d`;
    }

    return new Date(dateString).toLocaleDateString('es-HN');
  }

  async getPerfilByUsuario(usuarioId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('cliente')
      .select(
        `
        id,
        usuario_id,
        persona:persona_id (
          id,
          nombre,
          apellido,
          telefono,
          foto_url,
          direccion:id_direccion (
            direccion_completa,
            latitud,
            longitud
          )
        ),
        usuario:usuario_id (
          correo
        )
      `,
      )
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Error de base de datos: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException('Perfil de cliente no encontrado');
    }

    const { count: totalNinos } = await admin
      .from('nino')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', (data as any).id);

    return {
      ...data,
      total_ninos: totalNinos || 0,
    };
  }

  async updatePerfilByUsuario(
    usuarioId: string,
    body: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
    },
  ) {
    const admin = this.supabaseService.getAdminClient();
    const perfil = await this.getPerfilByUsuario(usuarioId);

    const patchData: Record<string, string> = {};

    if (body.nombre !== undefined) {
      patchData.nombre = String(body.nombre).trim();
    }

    if (body.apellido !== undefined) {
      patchData.apellido = String(body.apellido).trim();
    }

    if (body.telefono !== undefined) {
      patchData.telefono = String(body.telefono).trim();
    }

    if (Object.keys(patchData).length === 0) {
      return perfil;
    }

    const { error } = await admin
      .from('persona')
      .update(patchData)
      .eq('id', (perfil as any).persona?.id);

    if (error) {
      throw new InternalServerErrorException(
        `Error actualizando perfil: ${error.message}`,
      );
    }

    return this.getPerfilByUsuario(usuarioId);
  }

  async getNotificationsByUsuario(usuarioId: string) {
    const admin = this.supabaseService.getAdminClient();
    const perfil = await this.getPerfilByUsuario(usuarioId);

    const { data: reservas, error: reservasError } = await admin
      .from('reserva')
      .select(
        `
        id,
        estado,
        fecha_servicio,
        created_at,
        ninera:ninera_id (
          persona:persona_id (
            nombre,
            apellido
          )
        )
      `,
      )
      .eq('cliente_id', (perfil as any).id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (reservasError) {
      throw new InternalServerErrorException(
        `Error obteniendo reservas: ${reservasError.message}`,
      );
    }

    const { data: chats, error: chatsError } = await admin
      .from('chat_mensaje')
      .select(
        `
        id,
        mensaje,
        created_at,
        sender:sender_id (
          id
        ),
        chat:chat_id (
          chat_participante (
            usuario_id
          )
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(30);

    if (chatsError) {
      throw new InternalServerErrorException(
        `Error obteniendo mensajes: ${chatsError.message}`,
      );
    }

    const userId = (perfil as any).usuario_id;

    const notificationItems = [
      ...(reservas || []).map((reserva: any) => {
        const persona = Array.isArray(reserva.ninera?.persona)
          ? reserva.ninera.persona[0]
          : reserva.ninera?.persona;
        const nineraNombre = persona
          ? `${persona.nombre} ${persona.apellido}`.trim()
          : 'Tu niñera';

        let title = 'Actualizacion de reserva';
        let message = `Tu reserva con ${nineraNombre} tuvo una actualización.`;
        let color = '#886BC1';
        let read = true;

        if (reserva.estado === 'pendiente') {
          title = 'Reserva creada';
          message = `Tu solicitud con ${nineraNombre} fue enviada para ${reserva.fecha_servicio}.`;
          color = '#FF768A';
        } else if (reserva.estado === 'confirmada') {
          title = 'Reserva confirmada';
          message = `${nineraNombre} confirmó tu reserva.`;
          color = '#22C55E';
          read = false;
        } else if (reserva.estado === 'en_progreso') {
          title = 'Servicio en curso';
          message = `El servicio con ${nineraNombre} está en progreso.`;
          color = '#886BC1';
        } else if (reserva.estado === 'completada') {
          title = 'Servicio completado';
          message = `El servicio con ${nineraNombre} ya fue completado.`;
          color = '#0EA5E9';
        } else if (reserva.estado === 'rechazada') {
          title = 'Reserva rechazada';
          message = `${nineraNombre} no pudo aceptar tu reserva.`;
          color = '#EF4444';
          read = false;
        }

        return {
          id: `booking-${reserva.id}`,
          title,
          message,
          time: this.formatRelativeTime(reserva.created_at),
          read,
          icon: 'calendar',
          color,
          createdAt: reserva.created_at,
        };
      }),
      ...(chats || [])
        .filter((item: any) => {
          const participantes = Array.isArray(item.chat?.chat_participante)
            ? item.chat.chat_participante
            : [];
          return (
            item.sender?.id !== userId &&
            participantes.some((participant: any) => participant.usuario_id === userId)
          );
        })
        .slice(0, 10)
        .map((chat: any) => ({
          id: `chat-${chat.id}`,
          title: 'Nuevo mensaje',
          message: chat.mensaje || 'Recibiste un nuevo mensaje.',
          time: this.formatRelativeTime(chat.created_at),
          read: false,
          icon: 'chatbubble',
          color: '#886BC1',
          createdAt: chat.created_at,
        })),
    ]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 25);

    return notificationItems;
  }

  async getMisNinos(userId: string) {
    const admin = this.supabaseService.getAdminClient();

    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }

    try {
      // Obtiene el id de la tabla cliente vinculado al usuario autenticado
      const { data: cliente, error: clientError } = await admin
        .from('cliente')
        .select('id')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (clientError) {
        console.error('Error obteniendo cliente en getMisNinos:', clientError);
        throw new InternalServerErrorException(
          `Error de base de datos: ${clientError.message}`,
        );
      }

      if (!cliente) {
        throw new NotFoundException('Perfil de cliente no encontrado');
      }

      // Consulta los niños vinculados al cliente
      const { data: ninos, error: ninosError } = await admin
        .from('nino')
        .select('id, nombre, edad, nota')
        .eq('cliente_id', cliente.id);

      if (ninosError) {
        console.error('Error obteniendo niños en getMisNinos:', ninosError);
        throw new InternalServerErrorException(
          `Error al obtener niños: ${ninosError.message}`,
        );
      }

      return ninos ?? [];
    } catch (err) {
      console.error('Error crítico en getMisNinos:', err);

      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al obtener los niños del cliente',
      );
    }
  }
}
