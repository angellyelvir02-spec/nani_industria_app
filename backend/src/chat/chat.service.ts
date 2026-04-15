import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type AppUser = {
  id: string;
  rol: 'cliente' | 'ninera';
};

type Counterpart = {
  usuarioId: string;
  nombre: string;
  foto: string | null;
  estadoReserva: string;
  reservaId: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get admin() {
    return this.supabaseService.getAdminClient();
  }

  private async getAppUser(authUserId: string): Promise<AppUser> {
    const { data, error } = await this.admin
      .from('usuario')
      .select('id, rol')
      .eq('auth_id', authUserId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return data as AppUser;
  }

  private async getRoleProfileId(usuarioId: string, rol: 'cliente' | 'ninera') {
    const table = rol === 'cliente' ? 'cliente' : 'ninera';
    const { data, error } = await this.admin
      .from(table)
      .select('id')
      .eq('usuario_id', usuarioId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Perfil de ${rol} no encontrado`);
    }

    return data.id as string;
  }

  private async getEligibleCounterparts(user: AppUser): Promise<Counterpart[]> {
    const profileId = await this.getRoleProfileId(user.id, user.rol);

    if (user.rol === 'cliente') {
      const { data, error } = await this.admin
        .from('reserva')
        .select(
          `
          id,
          estado,
          ninera:ninera_id (
            usuario_id,
            persona:persona_id (
              nombre,
              apellido,
              foto_url
            )
          )
        `,
        )
        .eq('cliente_id', profileId)
        .in('estado', ['confirmada', 'en_progreso']);

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return (data ?? [])
        .map((row: any) => ({
          usuarioId: row.ninera?.usuario_id,
          nombre: row.ninera?.persona
            ? `${row.ninera.persona.nombre} ${row.ninera.persona.apellido}`
            : 'Niñera',
          foto: row.ninera?.persona?.foto_url ?? null,
          estadoReserva: row.estado,
          reservaId: row.id,
        }))
        .filter((item) => !!item.usuarioId);
    }

    const { data, error } = await this.admin
      .from('reserva')
      .select(
        `
        id,
        estado,
        cliente:cliente_id (
          usuario_id,
          persona:persona_id (
            nombre,
            apellido,
            foto_url
          )
        )
      `,
      )
      .eq('ninera_id', profileId)
      .in('estado', ['confirmada', 'en_progreso']);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? [])
      .map((row: any) => ({
        usuarioId: row.cliente?.usuario_id,
        nombre: row.cliente?.persona
          ? `${row.cliente.persona.nombre} ${row.cliente.persona.apellido}`
          : 'Cliente',
        foto: row.cliente?.persona?.foto_url ?? null,
        estadoReserva: row.estado,
        reservaId: row.id,
      }))
      .filter((item) => !!item.usuarioId);
  }

  private async findChatBetweenUsers(userA: string, userB: string) {
    const { data: partA, error: errorA } = await this.admin
      .from('chat_participante')
      .select('chat_id')
      .eq('usuario_id', userA);

    if (errorA) {
      throw new InternalServerErrorException(errorA.message);
    }

    const { data: partB, error: errorB } = await this.admin
      .from('chat_participante')
      .select('chat_id')
      .eq('usuario_id', userB);

    if (errorB) {
      throw new InternalServerErrorException(errorB.message);
    }

    const chatIdsA = new Set((partA ?? []).map((row: any) => row.chat_id));
    const commonChat = (partB ?? []).find((row: any) => chatIdsA.has(row.chat_id));

    return commonChat?.chat_id ?? null;
  }

  private isUniqueConstraintError(message?: string | null) {
    const errorMessage = String(message ?? '').toLowerCase();
    return (
      errorMessage.includes('duplicate key value') ||
      errorMessage.includes('unique constraint') ||
      errorMessage.includes('chat_participante_chat_id_key') ||
      errorMessage.includes('chat_participante_usuario_id_key')
    );
  }

  private async createDirectChat(userA: string, userB: string) {
    const existingChatId = await this.findChatBetweenUsers(userA, userB);

    if (existingChatId) {
      return existingChatId;
    }

    const { data: chat, error: chatError } = await this.admin
      .from('chat')
      .insert({ tipo: 'directo' })
      .select('id')
      .single();

    if (chatError || !chat) {
      throw new InternalServerErrorException(
        chatError?.message || 'No se pudo crear el chat',
      );
    }

    const { error: participantsError } = await this.admin
      .from('chat_participante')
      .insert([
        { chat_id: chat.id, usuario_id: userA },
        { chat_id: chat.id, usuario_id: userB },
      ]);

    if (participantsError) {
      await this.admin.from('chat').delete().eq('id', chat.id);

      const retryChatId = await this.findChatBetweenUsers(userA, userB);
      if (retryChatId) {
        return retryChatId;
      }

      if (this.isUniqueConstraintError(participantsError.message)) {
        throw new BadRequestException(
          'La tabla chat_participante tiene restricciones UNIQUE incorrectas. Ejecuta el script SQL de correccion antes de probar el chat.',
        );
      }

      throw new InternalServerErrorException(participantsError.message);
    }

    return chat.id as string;
  }

  private async getLastMessage(chatId: string) {
    const { data, error } = await this.admin
      .from('chat_mensaje')
      .select('mensaje, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  private formatConversationTime(dateString?: string | null) {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async getConversations(authUserId: string) {
    const user = await this.getAppUser(authUserId);
    const counterparts = await this.getEligibleCounterparts(user);

    const uniqueCounterparts = Array.from(
      new Map(counterparts.map((item) => [item.usuarioId, item])).values(),
    );

    const conversations = await Promise.all(
      uniqueCounterparts.map(async (item) => {
        const chatId = await this.findChatBetweenUsers(user.id, item.usuarioId);
        const lastMessage = chatId ? await this.getLastMessage(chatId) : null;

        return {
          chatId,
          otherUserId: item.usuarioId,
          name: item.nombre,
          photo: item.foto,
          status: item.estadoReserva,
          reservaId: item.reservaId,
          lastMessage: lastMessage?.mensaje || 'Sin mensajes todavía',
          time: this.formatConversationTime(lastMessage?.created_at),
          unreadCount: 0,
          isOnline: true,
        };
      }),
    );

    return conversations;
  }

  async getConversationWithUser(authUserId: string, otherUserId: string) {
    const user = await this.getAppUser(authUserId);
    const counterparts = await this.getEligibleCounterparts(user);
    const counterpart = counterparts.find((item) => item.usuarioId === otherUserId);

    if (!counterpart) {
      throw new BadRequestException(
        'Solo puedes chatear con usuarios que tengan una reserva confirmada o en curso contigo.',
      );
    }

    const chatId = await this.findChatBetweenUsers(user.id, otherUserId);

    const { data, error } = chatId
      ? await this.admin
          .from('chat_mensaje')
          .select('id, mensaje, sender_id, created_at')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
      : { data: [], error: null };

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      chatId,
      otherUserId,
      counterpart: {
        name: counterpart.nombre,
        photo: counterpart.foto,
        status:
          counterpart.estadoReserva === 'en_progreso'
            ? 'Servicio en curso'
            : 'Reserva confirmada',
      },
      messages: (data ?? []).map((message: any) => ({
        id: message.id,
        text: message.mensaje,
        sender: message.sender_id === user.id ? 'me' : 'other',
        senderId: message.sender_id,
        createdAt: message.created_at,
      })),
    };
  }

  async sendMessage(authUserId: string, otherUserId: string, mensaje?: string) {
    const cleanMessage = String(mensaje ?? '').trim();

    if (!cleanMessage) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    const user = await this.getAppUser(authUserId);
    const counterparts = await this.getEligibleCounterparts(user);
    const counterpart = counterparts.find((item) => item.usuarioId === otherUserId);

    if (!counterpart) {
      throw new BadRequestException(
        'Solo puedes chatear con usuarios que tengan una reserva confirmada o en curso contigo.',
      );
    }

    const chatId = await this.createDirectChat(user.id, otherUserId);

    const { data, error } = await this.admin
      .from('chat_mensaje')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        mensaje: cleanMessage,
      })
      .select('id, mensaje, sender_id, created_at')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message || 'No se pudo enviar el mensaje',
      );
    }

    return {
      success: true,
      chatId,
      message: {
        id: data.id,
        text: data.mensaje,
        sender: 'me',
        senderId: data.sender_id,
        createdAt: data.created_at,
      },
    };
  }
}
