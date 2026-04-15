import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateReservaDto {
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @IsUUID()
  @IsNotEmpty()
  ninera_id: string;

  @IsUUID()
  @IsNotEmpty()
  direccion_id: string;

  @IsUUID()
  @IsNotEmpty()
  metodo_pago_id: string; // El ID del catálogo (Tarjeta o Efectivo)

  @IsDateString()
  @IsNotEmpty()
  fecha_servicio: string; // Formato YYYY-MM-DD

  @IsString()
  @IsOptional()
  turno?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'Formato de hora debe ser HH:mm',
  })
  hora_inicio: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'Formato de hora debe ser HH:mm',
  })
  hora_fin: string;

  @IsString()
  @IsOptional()
  notas_importantes?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  ninos_ids: string[]; // Arreglo de UUIDs para la tabla reserva_nino

  @IsNumber()
  @IsNotEmpty()
  monto_comision: number;

  @IsNumber()
  @IsNotEmpty()
  monto_base: number; // El subtotal calculado en el frontend

  @IsNumber()
  @IsOptional()
  propina?: number;

  @IsOptional()
  @IsUUID()
  tarjeta_guardada_id?: string;

  @IsOptional()
  @IsObject()
  nueva_tarjeta?: {
    titular?: string;
    numero?: string;
    vencimiento?: string;
    cvv?: string;
    marca?: string;
    predeterminada?: boolean;
  };
}
