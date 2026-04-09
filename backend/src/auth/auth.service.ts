import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
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

    try {
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
        .maybeSingle();

      if (usuarioError) {
        console.error('Error obteniendo usuario en login:', usuarioError);
        throw new InternalServerErrorException(
          `Error de base de datos: ${usuarioError.message}`,
        );
      }

      if (!usuario) {
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

      const datosNinera =
        usuario.rol === 'ninera'
          ? Array.isArray(usuario.ninera)
            ? usuario.ninera[0]
            : usuario.ninera
          : null;

      return {
        message: 'Login exitoso',
        session: authData.session,
        user: {
          ...usuario,
          verificada:
            usuario.rol === 'ninera' ? datosNinera?.verificada ?? false : null,
        },
      };
    } catch (err) {
      console.error('Error en login:', err);

      if (
        err instanceof UnauthorizedException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Error interno en login');
    }
  }

  async getMe(token: string | null) {
    const supabase = this.supabaseService.getPublicClient();
    const admin = this.supabaseService.getAdminClient();

    if (!token) {
      throw new UnauthorizedException('Token no enviado');
    }

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        throw new UnauthorizedException('Sesión expirada o token inválido');
      }

      const { data: usuario, error: usuarioError } = await admin
        .from('usuario')
        .select('id, auth_id, correo, rol, fecha_registro')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (usuarioError) {
        console.error('Error obteniendo usuario en getMe:', usuarioError);
        throw new InternalServerErrorException(
          `Error de base de datos: ${usuarioError.message}`,
        );
      }

      if (!usuario) {
        throw new UnauthorizedException('Usuario no existe en la base de datos');
      }

      if (usuario.rol === 'cliente') {
        const { data: cliente, error: clienteError } = await admin
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

        if (clienteError) {
          console.error('Error obteniendo cliente en getMe:', clienteError);
          throw new InternalServerErrorException(
            `Error de base de datos: ${clienteError.message}`,
          );
        }

        return {
          id: usuario.id,
          auth_id: usuario.auth_id,
          correo: usuario.correo,
          rol: usuario.rol,
          fecha_registro: usuario.fecha_registro,
          persona: cliente?.persona || null,
        };
      }

      if (usuario.rol === 'ninera') {
        const { data: ninera, error: nineraError } = await admin
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

        if (nineraError) {
          console.error('Error obteniendo niñera en getMe:', nineraError);
          throw new InternalServerErrorException(
            `Error de base de datos: ${nineraError.message}`,
          );
        }

        return {
          id: usuario.id,
          auth_id: usuario.auth_id,
          correo: usuario.correo,
          rol: usuario.rol,
          fecha_registro: usuario.fecha_registro,
          verificada: ninera?.verificada ?? false,
          persona: ninera?.persona || null,
        };
      }

      return {
        id: usuario.id,
        auth_id: usuario.auth_id,
        correo: usuario.correo,
        rol: usuario.rol,
        fecha_registro: usuario.fecha_registro,
        persona: null,
      };
    } catch (err) {
      console.error('Error en getMe:', err);

      if (
        err instanceof UnauthorizedException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al obtener usuario',
      );
    }
  }

  async registerNinera(dto: RegisterNineraDto, files: any) {
    const admin = this.supabaseService.getAdminClient();

    const uploadFile = async (file: Express.Multer.File, bucket: string) => {
      const safeName = file.originalname.replace(/[^\w.\-]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;

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

      const {
        data: { publicUrl },
      } = admin.storage.from(bucket).getPublicUrl(fileName);

      if (!publicUrl) {
        throw new InternalServerErrorException(
          'No se pudo obtener URL del archivo',
        );
      }

      return publicUrl;
    };

    const normalizeInput = (input: any) => {
      if (!input) return [];
      return Array.isArray(input)
        ? input
        : input
            .split(',')
            .map((i: string) => i.trim())
            .filter(Boolean);
    };

    try {
      let urlFoto = '';
      let urlFrontal = '';
      let urlReverso = '';
      let urlAntecedentes = '';

      if (files?.foto_url?.[0]) {
        urlFoto = await uploadFile(files.foto_url[0], 'documentos');
      }

      if (files?.DNI_frontal_url?.[0]) {
        urlFrontal = await uploadFile(files.DNI_frontal_url[0], 'documentos');
      }

      if (files?.DNI_reverso_url?.[0]) {
        urlReverso = await uploadFile(files.DNI_reverso_url[0], 'documentos');
      }

      if (files?.Antecedentes_penales_url?.[0]) {
        urlAntecedentes = await uploadFile(
          files.Antecedentes_penales_url[0],
          'documentos',
        );
      }

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
          DNI_reverso_url: urlReverso || null,
        })
        .select()
        .single();

      if (personaError) {
        throw new BadRequestException(
          `Error en tabla persona: ${personaError.message}`,
        );
      }

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
    } catch (err) {
      console.error('Error en registerNinera:', err);

      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al registrar niñera',
      );
    }
  }

  async registerCliente(dto: RegisterClienteDto, files: any) {
    const admin = this.supabaseService.getAdminClient();

    const uploadFile = async (
      file: Express.Multer.File[] | undefined,
      bucket: string,
    ) => {
      if (!file || !file[0]) return null;

      const fileData = file[0];
      const safeName = (fileData.originalname || 'archivo').replace(
        /[^\w.\-]/g,
        '_',
      );
      const fileName = `cliente-${Date.now()}-${safeName}`;

      const { error } = await admin.storage
        .from(bucket)
        .upload(fileName, fileData.buffer, {
          contentType: fileData.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(`Error storage: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = admin.storage.from(bucket).getPublicUrl(fileName);

      if (!publicUrl) {
        throw new InternalServerErrorException(
          'No se pudo obtener URL del archivo',
        );
      }

      return publicUrl;
    };

    try {
      const urlFoto = await uploadFile(files?.foto_url, 'documentos');
      const urlDni = await uploadFile(files?.DNI_frontal_url, 'documentos');
      const urlDniReverso = await uploadFile(
        files?.DNI_reverso_url,
        'documentos',
      );

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

      const { data: usuario, error: uError } = await admin
        .from('usuario')
        .insert({
          auth_id: authCreated.user.id,
          correo: dto.correo,
          rol: 'cliente',
        })
        .select()
        .single();

      if (uError) {
        throw new BadRequestException(`Error en tabla usuario: ${uError.message}`);
      }

      const { data: persona, error: pError } = await admin
        .from('persona')
        .insert({
          nombre: dto.nombre,
          apellido: dto.apellido,
          telefono: dto.telefono || null,
          id_direccion: null,
          fecha_nacimiento: dto.fecha_nacimiento || null,
          foto_url: urlFoto,
          DNI_frontal_url: urlDni,
          DNI_reverso_url: urlDniReverso,
        })
        .select()
        .single();

      if (pError) {
        throw new BadRequestException(`Error en tabla persona: ${pError.message}`);
      }

      const { error: cError } = await admin.from('cliente').insert({
        persona_id: persona.id,
        usuario_id: usuario.id,
      });

      if (cError) {
        throw new BadRequestException(`Error en tabla cliente: ${cError.message}`);
      }

      return {
        message: 'Cliente registrado con éxito',
        userId: authCreated.user.id,
      };
    } catch (err) {
      console.error('Error en registerCliente:', err);

      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al registrar cliente',
      );
    }
  }

  async completeProfile(userId: string, dto: any, files: any) {
    const admin = this.supabaseService.getAdminClient();

    const uploadFile = async (
      file: Express.Multer.File[] | undefined,
      bucket: string,
      prefix: string,
    ) => {
      if (!file || !file[0]) return null;

      const fileData = file[0];
      const extSafeName = (fileData.originalname || 'archivo').replace(
        /[^\w.\-]/g,
        '_',
      );
      const fileName = `${prefix}-${userId}-${Date.now()}-${extSafeName}`;

      const { error } = await admin.storage
        .from(bucket)
        .upload(fileName, fileData.buffer, {
          contentType: fileData.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(
          `Error subiendo ${prefix}: ${error.message}`,
        );
      }

      const {
        data: { publicUrl },
      } = admin.storage.from(bucket).getPublicUrl(fileName);

      if (!publicUrl) {
        throw new InternalServerErrorException(
          'No se pudo obtener URL del archivo',
        );
      }

      return publicUrl;
    };

    try {
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

      const { data: cliente, error: clientError } = await admin
        .from('cliente')
        .select('id, persona_id')
        .eq('usuario_id', userId)
        .maybeSingle();

      if (clientError) {
        throw new InternalServerErrorException(
          `Error de base de datos: ${clientError.message}`,
        );
      }

      if (!cliente) {
        throw new BadRequestException('Cliente no encontrado');
      }

      let direccionId = null;

      if (dto.direccion || dto.ubicacion) {
        const coords =
          typeof dto.ubicacion === 'string' ? dto.ubicacion.split(',') : [];
        const lat = coords[0] ? parseFloat(coords[0]) : null;
        const lng = coords[1] ? parseFloat(coords[1]) : null;

        const { data: personaActual, error: personaActualError } = await admin
          .from('persona')
          .select('id_direccion')
          .eq('id', cliente.persona_id)
          .maybeSingle();

        if (personaActualError) {
          throw new InternalServerErrorException(
            `Error de base de datos: ${personaActualError.message}`,
          );
        }

        if (personaActual?.id_direccion) {
          const { error: updateDireccionError } = await admin
            .from('direccion')
            .update({
              direccion_completa: dto.direccion,
              punto_referencia: dto.punto_referencia,
              latitud: lat,
              longitud: lng,
            })
            .eq('id', personaActual.id_direccion);

          if (updateDireccionError) {
            throw new BadRequestException(
              `Error actualizando dirección: ${updateDireccionError.message}`,
            );
          }

          direccionId = personaActual.id_direccion;
        } else {
          const { data: nuevaDir, error: nuevaDirError } = await admin
            .from('direccion')
            .insert({
              direccion_completa: dto.direccion,
              punto_referencia: dto.punto_referencia,
              latitud: lat,
              longitud: lng,
            })
            .select('id')
            .single();

          if (nuevaDirError) {
            throw new BadRequestException(
              `Error creando dirección: ${nuevaDirError.message}`,
            );
          }

          direccionId = nuevaDir.id;
        }
      }

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

      if (updateError) {
        throw new BadRequestException(
          `Error al actualizar perfil: ${updateError.message}`,
        );
      }

      if (dto.ninos) {
        try {
          const listaNinos =
            typeof dto.ninos === 'string' ? JSON.parse(dto.ninos) : dto.ninos;

          if (Array.isArray(listaNinos) && listaNinos.length > 0) {
            const ninosInsert = listaNinos.map((n: any) => ({
              cliente_id: cliente.id,
              nombre: n.nombre,
              edad: parseInt(n.edad, 10),
              nota: n.nota || null,
            }));

            const { error: ninosError } = await admin
              .from('nino')
              .insert(ninosInsert);

            if (ninosError) {
              console.error('Error guardando niños:', ninosError.message);
              throw new BadRequestException(
                `Error guardando niños: ${ninosError.message}`,
              );
            }
          }
        } catch (e: any) {
          console.error('Error al procesar JSON de niños:', e?.message);

          if (e instanceof BadRequestException) {
            throw e;
          }

          throw new BadRequestException('Formato inválido en el campo ninos');
        }
      }

      return { message: 'Perfil de Nani completado con éxito' };
    } catch (err) {
      console.error('Error en completeProfile:', err);

      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Error interno al completar perfil',
      );
    }
  }
}