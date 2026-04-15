import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  @Get('ninera/:usuarioId')
  async getDisponibilidad(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.disponibilidadService.getDisponibilidadByUsuario(usuarioId);
  }

  @Post('ninera')
  async saveDisponibilidad(
    @Body()
    body: {
      usuario_id: string;
      disponibilidad: {
        dia_semana: string;
        hora_inicio: string;
        hora_fin: string;
      }[];
    },
  ) {
    if (!body) {
      throw new BadRequestException('El body es requerido');
    }

    if (!body.usuario_id) {
      throw new BadRequestException('usuario_id es requerido');
    }

    if (!Array.isArray(body.disponibilidad)) {
      throw new BadRequestException('disponibilidad debe ser un arreglo');
    }

    return this.disponibilidadService.saveDisponibilidad(body);
  }
}
