export class CreateReservaDto {
  cliente_id: string;
  ninera_id: string;
  direccion_id: string;
  metodo_pago_id: string;
  fecha_servicio: string;
  turno?: string;
  hora_inicio: string;
  hora_fin: string;
  notas_importantes?: string;
  ninos_ids: string[];
}