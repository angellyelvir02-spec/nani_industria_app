// src/nineras/nineras.module.ts
import { Module } from '@nestjs/common';
import { NinerasController } from './nineras.controller';
import { NinerasService } from './nineras.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NinerasController], // <-- ¿Está esto aquí?
  providers: [NinerasService],
})
export class NinerasModule {}