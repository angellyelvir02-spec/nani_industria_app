import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { AuthService } from '../auth/auth.service';

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly authService: AuthService,
  ) {}

  private async getAuthUserIdFromHeader(auth: string) {
    if (!auth) {
      throw new BadRequestException('No se proporciono token de acceso');
    }

    if (!auth.startsWith('Bearer ')) {
      throw new BadRequestException(
        'Formato de token invalido, se esperaba Bearer',
      );
    }

    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Token vacio');
    }

    const user = await this.authService.getMe(token);

    if (!user || !user.id) {
      throw new BadRequestException('Sesion invalida o expirada');
    }

    return user.id;
  }

  @Get('mis-ninos')
  async getMisNinos(@Headers('authorization') auth: string) {
    try {
      const userId = await this.getAuthUserIdFromHeader(auth);
      return this.clientesService.getMisNinos(userId);
    } catch (err) {
      console.error('Error en getMisNinos (ClientesController):', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al validar la sesion',
      );
    }
  }

  @Get('mis-tarjetas')
  async getMisTarjetas(@Headers('authorization') auth: string) {
    try {
      const userId = await this.getAuthUserIdFromHeader(auth);
      return this.clientesService.getMisTarjetas(userId);
    } catch (err) {
      console.error('Error en getMisTarjetas (ClientesController):', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al obtener las tarjetas',
      );
    }
  }

  @Post('mis-tarjetas')
  async createTarjeta(
    @Headers('authorization') auth: string,
    @Body()
    body: {
      titular?: string;
      numero?: string;
      vencimiento?: string;
      cvv?: string;
      marca?: string;
      predeterminada?: boolean;
    },
  ) {
    try {
      const userId = await this.getAuthUserIdFromHeader(auth);
      return this.clientesService.createTarjeta(userId, body);
    } catch (err) {
      console.error('Error en createTarjeta (ClientesController):', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al guardar la tarjeta',
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
