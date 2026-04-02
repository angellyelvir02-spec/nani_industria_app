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

  // 1. PRIMERO: Métodos de pago (Ruta específica sin parámetros)
  @Get('metodos-pago')
  async obtenerMetodos() {
    return await this.reservasService.getMetodosPago();
  }

  // muestra las reservas en la pantalla reservas del cliente

  @Get('mis-reservas/:usuarioId')
  async getMisReservas(@Param('usuarioId') usuarioId: string) {
    return await this.reservasService.findBookingsForClientApp(usuarioId);
  }

  // crear reserva
  @Post()
  @UseGuards(SupabaseGuard)
  async create(@Body() createReservaDto: CreateReservaDto, @Req() req: any) {
    const authUserId = req.user?.id || req.user?.sub;
    if (!authUserId) throw new BadRequestException('Usuario no identificado');
    return this.reservasService.create(createReservaDto, authUserId);
  }

  // muestra las detalles de cada reserva del cliente
  @Get('detalle/:id')
  async getDetalle(@Param('id') id: string) {
    return await this.reservasService.getBookingDetail(id);
  }

  @Patch(':id/checkout')
  async checkout(@Param('id') id: string) {
    // Esta función llama a la lógica de Supabase que corregimos
    return await this.reservasService.procesarCheckout(id);
  }

  // 4. RUTAS CON PARÁMETROS ESPECÍFICOS
  @Get('ninera/:usuarioId')
  findByNinera(@Param('usuarioId') usuarioId: string) {
    return this.reservasService.findByNinera(usuarioId);
  }

  // 5. RUTAS GENÉRICAS AL FINAL (Para evitar que atrapen otras peticiones)
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

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }
}
