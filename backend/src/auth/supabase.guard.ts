import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

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

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Formato de token inválido, se esperaba Bearer',
      );
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      throw new UnauthorizedException('Token vacío');
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabaseService.getAdminClient().auth.getUser(token);

      if (error) {
        console.error('Error validando token en SupabaseGuard:', error);
        throw new UnauthorizedException('Token inválido o expirado');
      }

      if (!user) {
        throw new UnauthorizedException('Usuario no válido');
      }

      // Inyecta el usuario en la request
      request.user = user;

      return true;
    } catch (err) {
      console.error('Error crítico en SupabaseGuard:', err);

      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al validar autenticación',
      );
    }
  }
}