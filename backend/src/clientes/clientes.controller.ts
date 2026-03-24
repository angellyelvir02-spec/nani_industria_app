import { Controller, Get, Headers, BadRequestException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { AuthService } from '../auth/auth.service'; // Para validar el token

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

    const token = auth.replace('Bearer ', '');

    // Usamos tu método existente de AuthService para sacar el usuario del token
    const user = await this.authService.getMe(token);
    if (!user) {
      throw new BadRequestException('Sesión inválida o expirada');
    }

    return this.clientesService.getMisNinos(user.id);
  }
}
