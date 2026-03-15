import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NinerasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  //se muestran en el dashbord del cliente aquellas niñeras que han sido aprobadas

  async findAll() {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('ninera')
      .select(
        `
        id,
        tarifa,
        experiencia,
        verificada,
        persona:persona_id (
          nombre,
          apellido,
          ubicacion,
          foto_url
        )
      `,
      )
      .eq('verificada', true);

    if (error) {
      console.error('--- ERROR DE SUPABASE ---');
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findOneByUsuario(usuarioId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ninera')
      .select(
        `
      id,
      tarifa,
      experiencia,
      verificada,
      presentacion,
      persona:persona_id ( 
        id, 
        nombre, 
        apellido, 
        ubicacion, 
        foto_url 
      ),
      usuario:usuario_id ( 
        correo 
      ),
      habilidades:habilidad_ninera ( 
        nombre 
      ),
      certificaciones:certificaciones_ninera ( 
        nombre 
      )
    `,
      )
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      console.error('Error Supabase:', error.message);
      throw new NotFoundException('No se encontró el perfil de la niñera');
    }

    return data;
  }
}
