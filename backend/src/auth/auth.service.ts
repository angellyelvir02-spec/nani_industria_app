import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterNineraDto } from './dto/register-ninera.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getPublicClient();
    const admin = this.supabaseService.getAdminClient();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: dto.correo,
      password: dto.password,
    });
    
    if (authError || !authData.user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    const authUserId = authData.user.id;
    const { data: usuario, error: usuarioError } = await admin
    .from('usuario')
    .select(`
      id, 
      auth_id, 
      correo, 
      rol, 
      fecha_registro,
      ninera ( verificada )
    `)
    .eq('auth_id', authUserId)
    .single();
    if (usuarioError) {
      throw new UnauthorizedException('El usuario autenticado no existe en la tabla usuario');
    }
    
    if (usuario.rol === 'ninera') {
      const datosNinera = Array.isArray(usuario.ninera) ? usuario.ninera[0] : usuario.ninera;
      if (!datosNinera || datosNinera.verificada === false) {
        throw new UnauthorizedException('Tu perfil está siendo revisado todavía. Te avisaremos por correo cuando sea aprobado.');
      }
    }
    const esVerificada = usuario.rol === 'ninera' ? usuario.ninera?.[0]?.verificada : null;
    return {
      message: 'Login exitoso',
      session: authData.session,
      user: {
        ...usuario,
        verificada: esVerificada 
      },
    };
  }
  async getMe(token: string | null) {
    const supabase = this.supabaseService.getPublicClient();
    const admin = this.supabaseService.getAdminClient();
    
    if (!token) {
      throw new UnauthorizedException('Token no enviado');
    }
  
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
  
    if (authError || !authData.user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  
    const authUserId = authData.user.id;
  
    const { data: usuario, error: usuarioError } = await admin
      .from('usuario')
      .select('id, auth_id, correo, rol, fecha_registro')
      .eq('auth_id', authUserId)
      .single();
  
    if (usuarioError || !usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
  
    if (usuario.rol === 'cliente') {
      const { data: cliente, error: clienteError } = await admin
        .from('cliente')
        .select(`
          id,
          persona (
            id,
            nombre,
            apellido,
            telefono,
            ubicacion,
            foto_url
          )
        `)
        .eq('usuario_id', usuario.id)
        .single();
        
      if (clienteError || !cliente) {
        throw new UnauthorizedException('Perfil de cliente no encontrado');
      }
    
      return {
        id: usuario.id,
        auth_id: usuario.auth_id,
        correo: usuario.correo,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
        persona: cliente.persona,
      };
    }
  
    if (usuario.rol === 'ninera') {
      const { data: ninera, error: nineraError } = await admin
        .from('ninera')
        .select(`
          id,
          verificada,
          persona (
            id,
            nombre,
            apellido,
            telefono,
            ubicacion,
            foto_url
          )
        `)
        .eq('usuario_id', usuario.id)
        .single();
        
      if (nineraError || !ninera) {
        throw new UnauthorizedException('Perfil de niñera no encontrado');
      }
    
      return {
        id: usuario.id,
        auth_id: usuario.auth_id,
        correo: usuario.correo,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
        verificada: ninera.verificada,
        persona: ninera.persona,
      };
    }
  
    throw new UnauthorizedException('Rol no válido');
  }

 async registerNinera(dto: RegisterNineraDto, files: any) {
  const admin = this.supabaseService.getAdminClient();

  // --- FUNCIÓN PARA SUBIR ARCHIVOS ---
  const uploadFile = async (file: Express.Multer.File, bucket: string) => {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) throw new BadRequestException(`Error subiendo archivo: ${error.message}`);
    return admin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  let urlFrontal = '';
  let urlReverso = '';
  let urlAntecedentes = '';

  if (files?.DNI_frontal_url) urlFrontal = await uploadFile(files.DNI_frontal_url[0], 'documentos');
  if (files?.DNI_reverso_url) urlReverso = await uploadFile(files.DNI_reverso_url[0], 'documentos');
  if (files?.Antecedentes_penales_url) urlAntecedentes = await uploadFile(files.Antecedentes_penales_url[0], 'documentos');

  // 1. Crear usuario en Supabase Auth
  const { data: authCreated, error: authError } = await admin.auth.admin.createUser({
    email: dto.correo,
    password: dto.password,
    email_confirm: true,
  });

  if (authError || !authCreated.user) {
    throw new BadRequestException(authError?.message || 'No se pudo crear el usuario en Auth');
  }

  const authUserId = authCreated.user.id;

  // 2. Crear registro en tabla usuario
  const { data: usuario, error: usuarioError } = await admin
    .from('usuario')
    .insert({
      auth_id: authUserId,
      correo: dto.correo,
      rol: 'ninera',
    })
    .select().single();

  if (usuarioError) throw new BadRequestException(`Error en tabla usuario: ${usuarioError.message}`);

  // 3. Crear registro en persona
  const { data: persona, error: personaError } = await admin
    .from('persona')
    .insert({
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
      ubicacion: dto.ubicacion,
      fecha_nacimiento: dto.fecha_nacimiento || null,
      foto_url: dto.foto_url || null,
      DNI_frontal_url: urlFrontal,
      DNI_reverso_url: urlReverso,
    })
    .select().single();

  if (personaError) throw new BadRequestException(`Error en tabla persona: ${personaError.message}`);

  // 4. Crear registro en ninera
  const { data: ninera, error: nineraError } = await admin
    .from('ninera')
    .insert({
      persona_id: persona.id,
      usuario_id: usuario.id,
      presentacion: dto.presentacion,
      experiencia: dto.experiencia ?? null,
      Antecedentes_penales_url: urlAntecedentes,
      tarifa: Number(dto.tarifa), // Aseguramos que sea número
    })
    .select().single();

  if (nineraError) throw new BadRequestException(`Error en tabla ninera: ${nineraError.message}`);

  // --- LÓGICA MEJORADA PARA HABILIDADES Y CERTIFICACIONES ---

  // Función interna para normalizar entradas (String o Array)
  const normalizeInput = (input: any) => {
    if (!input) return [];
    return Array.isArray(input) ? input : input.split(',').map(i => i.trim());
  };

  // 5. Insertar Habilidades
  const listaHabilidades = normalizeInput(dto.habilidades);
  if (listaHabilidades.length > 0) {
    const insertHabs = listaHabilidades.map(h => ({
      ninera_id: ninera.id,
      nombre: h,
    }));
    await admin.from('habilidad_ninera').insert(insertHabs);
  }

  // 6. Insertar Certificaciones (Nota: asegúrate que en el front sea 'certificaciones')
  const listaCerts = normalizeInput(dto.certificaciones || (dto as any).certificados);
  if (listaCerts.length > 0) {
    const insertCerts = listaCerts.map(c => ({
      ninera_id: ninera.id,
      nombre: c,
    }));
    await admin.from('certificaciones_ninera').insert(insertCerts);
  }

  return {
    message: 'Niñera registrada correctamente. Recibirás un correo para el siguiente paso',
    user: { auth_id: authUserId, usuario_id: usuario.id, ninera_id: ninera.id },
  };
}


  //////////////////////////////////
  async registerCliente(dto: RegisterClienteDto, files: any) {
    const admin = this.supabaseService.getAdminClient();

    // --- 1. SUBIR ARCHIVOS A STORAGE --- (Esto ya te funciona)
    const uploadFile = async (file: Express.Multer.File, bucket: string) => {
        const fileName = `cliente-${Date.now()}-${file.originalname}`;
        const { data, error } = await admin.storage
            .from(bucket)
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) throw new BadRequestException(`Error storage: ${error.message}`);
        return admin.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    };

    let urlDni = '';
    let urlSelfie = '';

    if (files?.DNI_frontal_url) urlDni = await uploadFile(files.DNI_frontal_url[0], 'documentos');
    if (files?.foto_url) urlSelfie = await uploadFile(files.foto_url[0], 'documentos');

    // --- 2. CREAR EN SUPABASE AUTH ---
    const { data: authCreated, error: authError } = await admin.auth.admin.createUser({
        email: dto.correo,
        password: dto.password,
        email_confirm: true,
    });
    if (authError) throw new BadRequestException(authError.message);

    // --- 3. INSERTAR EN TABLA USUARIO ---
    const { data: usuario, error: uError } = await admin
        .from('usuario')
        .insert({
            auth_id: authCreated.user.id,
            correo: dto.correo,
            rol: 'cliente',
        })
        .select().single();
    if (uError) throw new BadRequestException(uError.message);

    // --- 4. INSERTAR EN TABLA PERSONA ---
    // Agregamos .select().single() para capturar el ID de la persona creada
    const { data: persona, error: pError } = await admin
        .from('persona')
        .insert({
            nombre: dto.nombre,
            apellido: dto.apellido,
            telefono: dto.telefono,
            ubicacion: dto.ubicacion,
            foto_url: urlSelfie,
            DNI_frontal_url: urlDni,
        })
        .select().single(); // <--- IMPORTANTE: Esto permite obtener persona.id
        
    if (pError) throw new BadRequestException(pError.message);

    // --- 5. INSERTAR EN TABLA CLIENTE ---
    // Ahora insertamos en la tabla cliente vinculando los IDs anteriores
    const { error: cError } = await admin
        .from('cliente')
        .insert({
            persona_id: persona.id, // ID obtenido del paso 4
            usuario_id: usuario.id, // ID obtenido del paso 3
        });

    if (cError) throw new BadRequestException(cError.message);

    // Solo retornamos éxito si TODO el proceso terminó bien
    return { message: 'Cliente registrado con éxito' };
}
}