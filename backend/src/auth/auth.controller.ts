import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseInterceptors,
  UploadedFiles,
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
  async getMe(@Req() req: any) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    return this.authService.getMe(token);
  }

  @Post('register/ninera')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'DNI_frontal_url', maxCount: 1 },
        { name: 'DNI_reverso_url', maxCount: 1 },
        { name: 'Antecedentes_penales_url', maxCount: 1 },
      ],
      {
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
      },
    ),
  )
  async registerNinera(
    @Body() dto: RegisterNineraDto,
    @UploadedFiles()
    files: {
      DNI_frontal_url: Express.Multer.File[];
      DNI_reverso_url: Express.Multer.File[];
      Antecedentes_penales_url: Express.Multer.File[];
    },
  ) {
    return this.authService.registerNinera(dto, files);
  }

  @Post('register/cliente')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'DNI_frontal_url', maxCount: 1 },
      { name: 'foto_url', maxCount: 1 },
    ]),
  )
  async registerCliente(
    @Body() dto: RegisterClienteDto,
    @UploadedFiles()
    files: {
      DNI_frontal_url: Express.Multer.File[];
      foto_url: Express.Multer.File[];
    },
  ) {
    return this.authService.registerCliente(dto, files);
  }
}