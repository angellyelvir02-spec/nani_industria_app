import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NinerasService } from './nineras.service';
import { Disponibilidad_reserva } from './dto/disponibilidad.dto';

@Controller('nineras')
export class NinerasController {
  constructor(private readonly ninerasService: NinerasService) {}

  @Get()
  async getAllNineras() {
    return this.ninerasService.findAll();
  }

  @Get('/usuario/:usuarioId')
  async findByUsuario(@Param('usuarioId') usuarioId: string) {
    return await this.ninerasService.findOneByUsuario(usuarioId);
  }

  @Patch('/foto/:usuarioId')
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: {
        fileSize: 1024 * 1024 * 3,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException(
              'Solo se permiten archivos JPG, JPEG o PNG',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async updateFotoPerfil(
    @Param('usuarioId') usuarioId: string,
    @UploadedFile() foto: Express.Multer.File,
  ) {
    return this.ninerasService.updateFotoPerfil(usuarioId, foto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ninerasService.findOne(id);
  }

  //disponibilidad niñera
  @Get(':id/availability')
  async getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fecha') fecha: string,
  ) {
    const dto: Disponibilidad_reserva = {
      nineraId: id,
      fecha: fecha,
    };

    return this.ninerasService.getAvailableSlots(dto);
  }
}
