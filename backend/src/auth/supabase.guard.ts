import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // Ajusta la ruta a tu SupabaseService

@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException(
        'No se proporcionó un token de autenticación',
      );
    }

    const token = authHeader.split(' ')[1];
    // Usamos el cliente de Supabase para validar el token real de la sesión
    const {
      data: { user },
      error,
    } = await this.supabaseService.getAdminClient().auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // ¡IMPORTANTE! Inyectamos el usuario en la request para que el Controlador lo reciba
    request.user = user;
    return true;
  }
}
