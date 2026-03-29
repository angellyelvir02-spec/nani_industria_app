import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterNineraDto } from './dto/register-ninera.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getPublicClient();
    const admin = this.supabaseService.getAdminClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: dto.correo,
        password: dto.password,
      });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const authUserId = authData.user.id;

    const { data: usuario, error: usuarioError } = await admin
      .from('usuario')
      .select(
        `
        id, 
        auth_id, 
        correo, 
        rol, 
        fecha_registro,
        ninera ( verificada )
      `,
      )
      .eq('auth_id', authUserId)
      .single();

    if (usuarioError) {
      throw new UnauthorizedException(
        'El usuario autenticado no existe en la tabla usuario',
      );
    }

    if (usuario.rol === 'ninera') {
      const datosNinera = Array.isArray(usuario.ninera)
        ? usuario.ninera[0]
        : usuario.ninera;

      if (!datosNinera || datosNinera.verificada === false) {
        throw new UnauthorizedException(
          'Tu perfil está siendo revisado todavía. Te avisaremos por correo cuando sea aprobado.',
        );
      }
    }

    const esVerificada =
      usuario.rol === 'ninera' ? usuario.ninera?.[0]?.verificada : null;

    return {
      message: 'Login exitoso',
      session: authData.session,
      user: {
        ...usuario,
        verificada: esVerificada,
      },
    };
  }

  async getMe(token: string | null) {
    const supabase = this.supabaseService.getPublicClient();
    const admin = this.supabaseService.getAdminClient();

    if (!token) throw new UnauthorizedException('Token no enviado');

    // 1. Validar sesión en Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedException('Sesión expirada o token inválido');
    }

    // 2. Obtener el usuario base
    const { data: usuario, error: usuarioError } = await admin
      .from('usuario')
      .select('id, auth_id, correo, rol, fecha_registro')
      .eq('auth_id', authData.user.id)
      .single();

    if (usuarioError || !usuario) {
      throw new UnauthorizedException('Usuario no existe en la base de datos');
    }

    // 3. Lógica para CLIENTE
    if (usuario.rol === 'cliente') {
      const { data: cliente } = await admin
        .from('cliente')
        .select(
          `
        id,
        persona:persona_id (
          id,
          nombre,
          apellido,
          foto_url,
          telefono,
          fecha_nacimiento,
          DNI_frontal_url,
          DNI_reverso_url
        )
      `,
        )
        .eq('usuario_id', usuario.id)
        .maybeSingle();

      return {
        id: usuario.id,
        auth_id: usuario.auth_id,
        correo: usuario.correo,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
        persona: cliente?.persona || null,
      };
    }

    // 4. Lógica para NIÑERA
    if (usuario.rol === 'ninera') {
      const { data: ninera } = await admin
        .from('ninera')
        .select(
          `
        id,
        verificada,
        persona:persona_id (
          id,
          nombre,
          apellido,
          telefono,
          foto_url
        )
      `,
        )
        .eq('usuario_id', usuario.id)
        .maybeSingle();

      return {
        id: usuario.id,
        auth_id: usuario.auth_id,
        correo: usuario.correo,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
        verificada: ninera?.verificada || false,
        persona: ninera?.persona || null,
      };
    }

    // 5. Fallback
    return {
      id: usuario.id,
      auth_id: usuario.auth_id,
      correo: usuario.correo,
      rol: usuario.rol,
      fecha_registro: usuario.fecha_registro,
      persona: null,
    };
  }

  async registerNinera(dto: RegisterNineraDto, files: any) {
    const admin = this.supabaseService.getAdminClient();
    
    const uploadFile = async (file: Express.Multer.File, bucket: string) => {
      const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
      const { error } = await admin.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
      
      if (error) {
        throw new BadRequestException(
          `Error subiendo archivo: ${error.message}`,
        );
      }
    
      return admin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    };
  
    let urlFoto = '';
    let urlFrontal = '';
    let urlAntecedentes = '';
  
    // ✅ foto de perfil
    if (files?.foto_url) {
      urlFoto = await uploadFile(files.foto_url[0], 'documentos');
    }
  
    // ✅ dni frontal
    if (files?.DNI_frontal_url) {
      urlFrontal = await uploadFile(files.DNI_frontal_url[0], 'documentos');
    }
  
    // ✅ antecedentes
    if (files?.Antecedentes_penales_url) {
      urlAntecedentes = await uploadFile(
        files.Antecedentes_penales_url[0],
        'documentos',
      );
    }
  
    // 1. Crear usuario en Auth
    const { data: authCreated, error: authError } =
      await admin.auth.admin.createUser({
        email: dto.correo,
        password: dto.password,
        email_confirm: true,
      });
    
    if (authError || !authCreated.user) {
      throw new BadRequestException(
        authError?.message || 'No se pudo crear el usuario en Auth',
      );
    }
  
    const authUserId = authCreated.user.id;
  
    // 2. Crear usuario en tabla usuario
    const { data: usuario, error: usuarioError } = await admin
      .from('usuario')
      .insert({
        auth_id: authUserId,
        correo: dto.correo,
        rol: 'ninera',
      })
      .select()
      .single();
    
    if (usuarioError) {
      throw new BadRequestException(
        `Error en tabla usuario: ${usuarioError.message}`,
      );
    }
  
    // 3. Crear dirección
    const { data: direccion, error: direccionError } = await admin
      .from('direccion')
      .insert({
        direccion_completa: dto.ubicacion,
        latitud: 0,
        longitud: 0,
        punto_referencia: null,
      })
      .select()
      .single();
    
    if (direccionError) {
      throw new BadRequestException(
        `Error en tabla direccion: ${direccionError.message}`,
      );
    }
  
    // 4. Crear persona
    const { data: persona, error: personaError } = await admin
      .from('persona')
      .insert({
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono,
        id_direccion: direccion.id,
        fecha_nacimiento: dto.fecha_nacimiento || null,
        foto_url: urlFoto || null,
        DNI_frontal_url: urlFrontal || null,
        DNI_reverso_url: null,
      })
      .select()
      .single();
    
    if (personaError) {
      throw new BadRequestException(
        `Error en tabla persona: ${personaError.message}`,
      );
    }
  
    // 5. Crear niñera
    const { data: ninera, error: nineraError } = await admin
      .from('ninera')
      .insert({
        persona_id: persona.id,
        usuario_id: usuario.id,
        presentacion: dto.presentacion ?? null,
        experiencia: dto.experiencia ?? null,
        Antecedentes_penales_url: urlAntecedentes || null,
        tarifa: Number(dto.tarifa),
        verificada: false,
      })
      .select()
      .single();
    
    if (nineraError) {
      throw new BadRequestException(
        `Error en tabla ninera: ${nineraError.message}`,
      );
    }
  
    const normalizeInput = (input: any) => {
      if (!input) return [];
      return Array.isArray(input)
        ? input
        : input.split(',').map((i: string) => i.trim()).filter(Boolean);
    };
  
    // 6. Habilidades
    const listaHabilidades = normalizeInput(dto.habilidades);
    if (listaHabilidades.length > 0) {
      const insertHabs = listaHabilidades.map((h: string) => ({
        ninera_id: ninera.id,
        nombre: h,
      }));
    
      const { error: habError } = await admin
        .from('habilidad_ninera')
        .insert(insertHabs);
    
      if (habError) {
        throw new BadRequestException(
          `Error en habilidades: ${habError.message}`,
        );
      }
    }
  
    // 7. Certificaciones
    const listaCerts = normalizeInput(dto.certificaciones);
    if (listaCerts.length > 0) {
      const insertCerts = listaCerts.map((c: string) => ({
        ninera_id: ninera.id,
        nombre: c,
      }));
    
      const { error: certError } = await admin
        .from('certificaciones_ninera')
        .insert(insertCerts);
    
      if (certError) {
        throw new BadRequestException(
          `Error en certificaciones: ${certError.message}`,
        );
      }
    }
  
    return {
      message:
        'Niñera registrada correctamente. Recibirás un correo para el siguiente paso',
      user: {
        auth_id: authUserId,
        usuario_id: usuario.id,
        ninera_id: ninera.id,
        persona_id: persona.id,
        direccion_id: direccion.id,
      },
    };
  }

  async registerCliente(dto: RegisterClienteDto, files: any) {
    const admin = this.supabaseService.getAdminClient();

    const uploadFile = async (file: any, bucket: string) => {
      if (!file || !file[0]) return null;
      const fileData = file[0];
      const fileName = `cliente-${Date.now()}-${fileData.originalname?.replace(/\s/g, '_') || 'archivo'}`;

      const { error } = await admin.storage
        .from(bucket)
        .upload(fileName, fileData.buffer, {
          contentType: fileData.mimetype,
          upsert: true,
        });

      if (error)
        throw new BadRequestException(`Error storage: ${error.message}`);
      return admin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    };

    // 1. Subida opcional de archivos (Paso 1)
    const urlFoto = await uploadFile(files?.foto_url, 'documentos');
    const urlDni = await uploadFile(files?.DNI_frontal_url, 'documentos');
    const urlDniReverso = await uploadFile(
      files?.DNI_reverso_url,
      'documentos',
    );

    // 2. Creación en Auth de Supabase
    const { data: authCreated, error: authError } =
      await admin.auth.admin.createUser({
        email: dto.correo,
        password: dto.password,
        email_confirm: true,
      });

    if (authError || !authCreated.user) {
      throw new BadRequestException(
        authError?.message || 'No se pudo crear el usuario',
      );
    }

    // 3. Insertar en tabla 'usuario'
    const { data: usuario, error: uError } = await admin
      .from('usuario')
      .insert({
        auth_id: authCreated.user.id,
        correo: dto.correo,
        rol: 'cliente',
      })
      .select()
      .single();

    if (uError) throw new BadRequestException(uError.message);

    // 4. Insertar en tabla 'persona' (direccion_id inicia en null)
    const { data: persona, error: pError } = await admin
      .from('persona')
      .insert({
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono || null,
        id_direccion: null, // Se llena hasta el segundo formulario
        fecha_nacimiento: dto.fecha_nacimiento || null,
        foto_url: urlFoto,
        DNI_frontal_url: urlDni,
        DNI_reverso_url: urlDniReverso,
      })
      .select()
      .single();

    if (pError) throw new BadRequestException(pError.message);

    // 5. Vincular en tabla 'cliente'
    const { error: cError } = await admin.from('cliente').insert({
      persona_id: persona.id,
      usuario_id: usuario.id,
    });

    if (cError) throw new BadRequestException(cError.message);

    return {
      message: 'Cliente registrado con éxito',
      userId: authCreated.user.id,
    };
  }

  async completeProfile(userId: string, dto: any, files: any) {
    const admin = this.supabaseService.getAdminClient();

    const uploadFile = async (file: any, bucket: string, prefix: string) => {
      if (!file || !file[0]) return null;
      const fileData = file[0];
      const fileName = `${prefix}-${userId}-${Date.now()}`;

      const { error } = await admin.storage
        .from(bucket)
        .upload(fileName, fileData.buffer, {
          contentType: fileData.mimetype,
          upsert: true,
        });

      if (error)
        throw new BadRequestException(
          `Error subiendo ${prefix}: ${error.message}`,
        );
      return admin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    };

    // 1. Subida de archivos (Se mantiene igual)
    const urlFotoPerfil = await uploadFile(
      files?.foto_url,
      'perfiles',
      'avatar',
    );
    const urlDniFrontal = await uploadFile(
      files?.DNI_frontal_url,
      'documentos',
      'dni-f',
    );
    const urlDniReverso = await uploadFile(
      files?.DNI_reverso_url,
      'documentos',
      'dni-r',
    );

    // 2. Obtener el cliente y su persona_id
    const { data: cliente, error: clientError } = await admin
      .from('cliente')
      .select('id, persona_id')
      .eq('usuario_id', userId)
      .single();

    if (clientError || !cliente)
      throw new BadRequestException('Cliente no encontrado');

    // 3. Gestión de Dirección (Se mantiene igual)
    let direccionId = null;
    if (dto.direccion || dto.ubicacion) {
      const coords = dto.ubicacion?.split(',') || [];
      const lat = coords[0] ? parseFloat(coords[0]) : null;
      const lng = coords[1] ? parseFloat(coords[1]) : null;

      const { data: personaActual } = await admin
        .from('persona')
        .select('id_direccion')
        .eq('id', cliente.persona_id)
        .single();

      if (personaActual?.id_direccion) {
        await admin
          .from('direccion')
          .update({
            direccion_completa: dto.direccion,
            punto_referencia: dto.punto_referencia,
            latitud: lat,
            longitud: lng,
          })
          .eq('id', personaActual.id_direccion);
        direccionId = personaActual.id_direccion;
      } else {
        const { data: nuevaDir } = await admin
          .from('direccion')
          .insert({
            direccion_completa: dto.direccion,
            punto_referencia: dto.punto_referencia,
            latitud: lat,
            longitud: lng,
          })
          .select('id')
          .single();
        direccionId = nuevaDir?.id;
      }
    }

    // 4. Actualizar tabla 'persona'
    const { error: updateError } = await admin
      .from('persona')
      .update({
        telefono: dto.telefono,
        id_direccion: direccionId,
        fecha_nacimiento: dto.fecha_nacimiento,
        ...(urlFotoPerfil && { foto_url: urlFotoPerfil }),
        ...(urlDniFrontal && { DNI_frontal_url: urlDniFrontal }),
        ...(urlDniReverso && { DNI_reverso_url: urlDniReverso }),
      })
      .eq('id', cliente.persona_id);

    if (updateError)
      throw new BadRequestException(
        `Error al actualizar perfil: ${updateError.message}`,
      );

    // --- NUEVO: GESTIÓN DE NIÑOS ---
    if (dto.ninos) {
      try {
        // Parseamos el string que viene del FormData
        const listaNinos =
          typeof dto.ninos === 'string' ? JSON.parse(dto.ninos) : dto.ninos;

        if (Array.isArray(listaNinos) && listaNinos.length > 0) {
          const ninosInsert = listaNinos.map((n: any) => ({
            cliente_id: cliente.id,
            nombre: n.nombre,
            edad: parseInt(n.edad),
            nota: n.nota || null,
          }));

          const { error: ninosError } = await admin
            .from('nino')
            .insert(ninosInsert);
          if (ninosError)
            console.error('Error guardando niños:', ninosError.message);
        }
      } catch (e) {
        console.error('Error al procesar JSON de niños:', e.message);
      }
    }

    return { message: 'Perfil de Nani completado con éxito' };
  }
}
