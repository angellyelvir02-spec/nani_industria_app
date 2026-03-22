import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // Ajusta la ruta a tu servicio de Supabase

@Injectable()
export class ClientesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getMisNinos(userId: string) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Obtenemos el id de la tabla 'cliente' vinculado al UUID de auth
    const { data: cliente, error: clientError } = await admin
      .from('cliente')
      .select('id')
      .eq('usuario_id', userId)
      .single();

    if (clientError || !cliente) {
      throw new NotFoundException('Perfil de cliente no encontrado');
    }

    // 2. Consultamos los niños vinculados a ese cliente
    const { data: ninos, error: ninosError } = await admin
      .from('nino')
      .select('id, nombre, edad, nota')
      .eq('cliente_id', cliente.id);

    if (ninosError) {
      throw new BadRequestException(
        `Error al obtener niños: ${ninosError.message}`,
      );
    }

    return ninos;
  }
}
