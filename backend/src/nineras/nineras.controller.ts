import { Controller, Get } from '@nestjs/common';
import { NinerasService } from './nineras.service';

@Controller('nineras')
export class NinerasController {
  constructor(private readonly ninerasService: NinerasService) {}

  @Get()
  async getAllNineras() {
    return this.ninerasService.findAll();
  }
}