import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterClienteDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  rol?: string; // Por defecto será 'cliente' en tu service

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  apellido: string;

  // --- CAMPOS OPCIONALES PARA REGISTRO RÁPIDO ---

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion_completa?: string;

  @IsOptional()
  @IsString()
  latitud?: number;

  @IsOptional()
  @IsString()
  longitud?: number;

  @IsOptional()
  @IsString()
  fecha_nacimiento?: string;

  // Estos suelen ser strings (URLs) que genera el service,
  // no vienen directamente como texto del frontend en el body.
  @IsOptional()
  @IsString()
  foto_url?: string;

  @IsOptional()
  @IsString()
  DNI_frontal_url?: string;

  @IsOptional()
  @IsString()
  DNI_reverso_url?: string;

  @IsOptional()
  @IsString()
  ninos?: string;
}
