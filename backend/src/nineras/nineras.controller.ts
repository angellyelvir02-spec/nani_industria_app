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

  // Retorna todas las niñeras verificadas
  @Get()
  async getAllNineras() {
    return this.ninerasService.findAll();
  }

  // Retorna el perfil de la niñera asociado a un usuario
  @Get('/usuario/:usuarioId')
  async findByUsuario(@Param('usuarioId', ParseUUIDPipe) usuarioId: string) {
    return this.ninerasService.findOneByUsuario(usuarioId);
  }

  // Actualiza la foto de perfil de la niñera
  @Patch('/foto/:usuarioId')
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: {
        fileSize: 1024 * 1024 * 3, // 3 MB
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
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @UploadedFile() foto: Express.Multer.File,
  ) {
    if (!foto) {
      throw new BadRequestException(
        'Debe enviar una imagen en el campo "foto"',
      );
    }

    return this.ninerasService.updateFotoPerfil(usuarioId, foto);
  }

  // Retorna el detalle de una niñera por su ID
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ninerasService.findOne(id);
  }

  // Retorna la disponibilidad de la niñera para una fecha específica
  @Get(':id/availability')
  async getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fecha') fecha: string,
  ) {
    if (!fecha) {
      throw new BadRequestException('El parámetro "fecha" es obligatorio');
    }

    const dto: Disponibilidad_reserva = {
      nineraId: id,
      fecha,
    };

    return this.ninerasService.getAvailableSlots(dto);
  }

  // para mostrar las reseñas en el perfil
  @Get(':id/resenas')
  async obtenerResenas(@Param('id') id: string) {
    const resenas = await this.ninerasService.obtenerResenasPorNinera(id);

    return {
      success: true,
      data: resenas,
    };
  }
}
