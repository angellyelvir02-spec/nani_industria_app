import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // src/reservas/reservas.controller.ts
  @Post()
  @UseGuards(SupabaseGuard) // Es vital que este Guard esté para que req.user exista
  async create(@Body() createReservaDto: CreateReservaDto, @Req() req: any) {
    // Imprime req.user en consola para ver dónde viene el ID si esto falla
    const authUserId = req.user?.id || req.user?.sub;

    if (!authUserId) {
      throw new BadRequestException(
        'No se pudo identificar al usuario desde el token',
      );
    }

    return this.reservasService.create(createReservaDto, authUserId);
  }

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  // Cambié Param a @Param para que coincida con NestJS
  @Get('ninera/:usuarioId')
  findByNinera(@Param('usuarioId') usuarioId: string) {
    return this.reservasService.findByNinera(usuarioId);
  }

  @Get('metodos-pago')
  async obtenerMetodos() {
    console.log('Solicitando métodos de pago desde el cliente...');
    return await this.reservasService.getMetodosPago();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservasService.remove(id);
  }
}
