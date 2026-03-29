import { Body, Controller, Post } from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

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
    return this.disponibilidadService.saveDisponibilidad(body);
  }
}