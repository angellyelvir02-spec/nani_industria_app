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