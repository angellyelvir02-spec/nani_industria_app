import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Headers,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterNineraDto } from './dto/register-ninera.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async getMe(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new BadRequestException(
        'No se proporcionó el token de autorización',
      );
    }

    if (!auth.startsWith('Bearer ')) {
      throw new BadRequestException(
        'Formato de token inválido, se esperaba Bearer',
      );
    }

    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Token vacío');
    }

    return this.authService.getMe(token);
  }

  @Post('register/ninera')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'foto_url', maxCount: 1 },
        { name: 'DNI_frontal_url', maxCount: 1 },
        { name: 'DNI_reverso_url', maxCount: 1 },
        { name: 'Antecedentes_penales_url', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 1024 * 1024 * 10,
        },
        fileFilter: (req, file, callback) => {
          const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
          ];

          if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
              new BadRequestException(
                'Solo se permiten archivos JPG, JPEG, PNG o PDF',
              ),
              false,
            );
          }

          callback(null, true);
        },
      },
    ),
  )
  async registerNinera(
    @Body() dto: RegisterNineraDto,
    @UploadedFiles()
    files: {
      foto_url?: Express.Multer.File[];
      DNI_frontal_url?: Express.Multer.File[];
      DNI_reverso_url?: Express.Multer.File[];
      Antecedentes_penales_url?: Express.Multer.File[];
    },
  ) {
    return this.authService.registerNinera(dto, files);
  }

  @Post('register/cliente')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'DNI_frontal_url', maxCount: 1 },
        { name: 'DNI_reverso_url', maxCount: 1 },
        { name: 'foto_url', maxCount: 1 },
      ],
      {
        limits: { fileSize: 1024 * 1024 * 3 },
        fileFilter: (req, file, callback) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            return callback(
              new BadRequestException('Solo JPG, JPEG o PNG'),
              false,
            );
          }
          callback(null, true);
        },
      },
    ),
  )
  async registerCliente(
    @Body() dto: RegisterClienteDto,
    @UploadedFiles()
    files: {
      foto_url?: Express.Multer.File[];
      DNI_frontal_url?: Express.Multer.File[];
      DNI_reverso_url?: Express.Multer.File[];
    },
  ) {
    return this.authService.registerCliente(dto, files);
  }

  @Post('complete-profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'foto_url', maxCount: 1 },
        { name: 'DNI_frontal_url', maxCount: 1 },
        { name: 'DNI_reverso_url', maxCount: 1 },
      ],
      {
        limits: { fileSize: 1024 * 1024 * 10 },
        fileFilter: (req, file, callback) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            return callback(
              new BadRequestException('Formato de imagen no válido'),
              false,
            );
          }
          callback(null, true);
        },
      },
    ),
  )
  async completeProfile(
    @Headers('authorization') auth: string,
    @Body() dto: any,
    @UploadedFiles()
    files: {
      foto_url?: Express.Multer.File[];
      DNI_frontal_url?: Express.Multer.File[];
      DNI_reverso_url?: Express.Multer.File[];
    },
  ) {
    if (!auth) {
      throw new BadRequestException('No se proporcionó token');
    }

    if (!auth.startsWith('Bearer ')) {
      throw new BadRequestException(
        'Formato de token inválido, se esperaba Bearer',
      );
    }

    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Token vacío');
    }

    try {
      const user = await this.authService.getMe(token);

      if (!user || !user.id) {
        throw new BadRequestException('Token inválido o expirado');
      }

      return this.authService.completeProfile(user.id, dto, files);
    } catch (err) {
      console.error('Error en completeProfile (AuthController):', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al completar perfil',
      );
    }
  }
}