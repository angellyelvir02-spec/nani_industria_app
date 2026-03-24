import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { AuthModule } from '../auth/auth.module'; // Importante para validar el token
import { SupabaseModule } from '../supabase/supabase.module'; // Para acceder a la base de datos

@Module({
  imports: [
    AuthModule, // Permite usar AuthService en el controlador para validar al usuario
    SupabaseModule, // Permite usar SupabaseService en el servicio para las consultas
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService], // Por si necesitas usarlo en otros módulos en el futuro
})
export class ClientesModule {}
