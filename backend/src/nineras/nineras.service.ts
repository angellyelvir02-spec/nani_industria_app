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

  async updateFotoPerfil(usuarioId: string, foto: Express.Multer.File) {
    const client = this.supabaseService.getAdminClient();

    if (!foto) {
      throw new NotFoundException('No se recibió ninguna imagen');
    }

    const { data: ninera, error: nineraError } = await client
      .from('ninera')
      .select('id, persona_id')
      .eq('usuario_id', usuarioId)
      .single();

    if (nineraError || !ninera) {
      throw new NotFoundException('No se encontró la niñera');
    }

    const fileName = `perfil-${usuarioId}-${Date.now()}-${foto.originalname.replace(/\s/g, '_')}`;

    const { error: uploadError } = await client.storage
      .from('documentos')
      .upload(fileName, foto.buffer, {
        contentType: foto.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(
        `Error subiendo imagen: ${uploadError.message}`,
      );
    }

    const publicUrl = client.storage.from('documentos').getPublicUrl(fileName).data.publicUrl;

    const { error: updateError } = await client
      .from('persona')
      .update({ foto_url: publicUrl })
      .eq('id', ninera.persona_id);

    if (updateError) {
      throw new InternalServerErrorException(
        `Error actualizando foto: ${updateError.message}`,
      );
    }

    return {
      message: 'Foto de perfil actualizada correctamente',
      foto_url: publicUrl,
    };
  }
}
