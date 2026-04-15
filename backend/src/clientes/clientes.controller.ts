import {
  Controller,
  Get,
  Headers,
  BadRequestException,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
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

  @Get('usuario/:usuarioId')
  async getPerfil(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.clientesService.getPerfilByUsuario(usuarioId);
  }

  @Patch('usuario/:usuarioId')
  async updatePerfil(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Body()
    body: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
    },
  ) {
    return this.clientesService.updatePerfilByUsuario(usuarioId, body);
  }

  @Get('usuario/:usuarioId/notificaciones')
  async getNotifications(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    return this.clientesService.getNotificationsByUsuario(usuarioId);
  }
}
