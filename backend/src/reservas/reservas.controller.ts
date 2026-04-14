import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { CheckinDto } from './dto/chekin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get('metodos-pago')
  async obtenerMetodos() {
    return this.reservasService.getMetodosPago();
  }

  @Get('mis-reservas/:usuarioId')
  async getMisReservas(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.reservasService.findBookingsForClientApp(usuarioId);
  }

  @Post()
  @UseGuards(SupabaseGuard)
  async create(@Body() createReservaDto: CreateReservaDto, @Req() req: any) {
    const authUserId = req.user?.id || req.user?.sub;

    if (!authUserId) {
      throw new BadRequestException('Usuario no identificado');
    }

    return this.reservasService.create(createReservaDto, authUserId);
  }

  @Get('detalle/:id')
  async getDetalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.getBookingDetail(id);
  }

  @Post(':id/checkin')
  @UseGuards(SupabaseGuard)
  async checkin(
    @Param('id')
    id: string,
    @Body() body: CheckinDto,
    @Req() req: any,
  ) {
    return this.reservasService.procesarCheckin(id, body, req.user.id);
  }

  @Post(':id/checkout')
  @UseGuards(SupabaseGuard)
  async checkout(
    @Param('id') id: string,
    @Body() body: CheckoutDto,
    @Req() req: any,
  ) {
    return this.reservasService.procesarCheckout(id, body, req.user.id);
  }

  @Post(':id/confirmar-finalizacion')
  @UseGuards(SupabaseGuard)
  async confirmarFinalizacion(@Param('id') id: string, @Req() req: any) {
    return this.reservasService.confirmarFinalizacionCliente(
      id,
      req.user.sub ?? req.user.id,
    );
  }
  @Post(':id/confirmar-cobro-efectivo')
  @UseGuards(SupabaseGuard)
  async confirmarCobro(@Param('id') id: string, @Req() req) {
    const authUserId = req.user.sub ?? req.user.id;

    return await this.reservasService.confirmarCobroEfectivoNinera(
      id,
      authUserId,
    );
  }

  @Get('ninera/:usuarioId')
  async findByNinera(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.reservasService.findByNinera(usuarioId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReservaDto: UpdateReservaDto,
  ) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.remove(id);
  }

  @Get()
  async findAll() {
    return this.reservasService.findAll();
  }

  // crear reseña y calificar
  @Post('calificar')
  @UseGuards(SupabaseGuard)
  async calificar(@Body() body: any, @Req() req: any) {
    const authUserIdFromToken =
      req.user?.id || req.user?.sub || req.user?.user?.id;

    if (!authUserIdFromToken) {
      throw new BadRequestException(
        'No se pudo identificar al usuario desde el token.',
      );
    }
    const resenaDto = body.resenaDto || body;

    console.log(
      'DEBUG - Procesando reseña para Usuario ID:',
      authUserIdFromToken,
    );

    return this.reservasService.crearResena(resenaDto, authUserIdFromToken);
  }

  @UseGuards(SupabaseGuard)
  @Patch(':id/rechazar')
  async rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo_rechazo?: string },
  ) {
    return this.reservasService.update(id, {
      estado: 'rechazada',
      motivo_rechazo: body.motivo_rechazo || null,
    } as any);
  }
  @UseGuards(SupabaseGuard)
  @Patch(':id/cancelar')
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo_cancelacion?: string },
    @Req() req: any,
  ) {
    const authUserId = req.user?.id || req.user?.sub;
    if (!authUserId) throw new BadRequestException('Usuario no identificado');
    return this.reservasService.cancelarReserva(
      id,
      body.motivo_cancelacion || '',
      authUserId,
    );
  }
}
