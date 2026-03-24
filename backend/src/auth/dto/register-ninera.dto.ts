export class RegisterNineraDto {
  correo: string;
  password: string;
  rol: string;
  habilidades: string;
  certificaciones: string;

  nombre: string;
  apellido: string;
  telefono: string;
  ubicacion: string;

  fecha_nacimiento: string;
  foto_url: string;
  DNI_frontal_url: string;
  DNI_reverso_url: string;
  Antecedentes_penales_url: string;
  tarifa: number;

  presentacion: string;
  experiencia?: string | null;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}
