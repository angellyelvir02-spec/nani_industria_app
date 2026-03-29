import { Module } from '@nestjs/common';
import { DisponibilidadController } from './disponibilidad.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DisponibilidadController],
  providers: [DisponibilidadService],
})
export class DisponibilidadModule {}