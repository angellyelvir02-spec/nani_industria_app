import { Controller, Get, Param } from '@nestjs/common';
import { NinerasService } from './nineras.service';

@Controller('nineras')
export class NinerasController {
  constructor(private readonly ninerasService: NinerasService) {}

  @Get()
  async getAllNineras() {
    return this.ninerasService.findAll();
  }

  @Get('/usuario/:usuarioId') // La ruta será: /nineras/usuario/EL_ID_AQUÍ
  async findByUsuario(@Param('usuarioId') usuarioId: string) {
    return await this.ninerasService.findOneByUsuario(usuarioId);
  }
}