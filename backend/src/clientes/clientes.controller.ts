import {
  Controller,
  Get,
  Headers,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { AuthService } from '../auth/auth.service';

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly authService: AuthService,
  ) {}

  @Get('mis-ninos')
  async getMisNinos(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new BadRequestException('No se proporcionó token de acceso');
    }

    if (!auth.startsWith('Bearer ')) {
      throw new BadRequestException(
        'Formato de token inválido, se esperaba Bearer',
      );
    }

    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Token vacío');
    }

    try {
      // Obtiene el usuario desde el token
      const user = await this.authService.getMe(token);

      if (!user || !user.id) {
        throw new BadRequestException('Sesión inválida o expirada');
      }

      return this.clientesService.getMisNinos(user.id);
    } catch (err) {
      console.error('Error en getMisNinos (ClientesController):', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al validar la sesión',
      );
    }
  }
}