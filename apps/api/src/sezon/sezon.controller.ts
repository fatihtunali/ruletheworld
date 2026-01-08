import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SezonService } from './sezon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sezon')
export class SezonController {
  constructor(private sezonService: SezonService) {}

  // Aktif sezonu getir - Auth gerektirmez
  @Get('aktif')
  async aktifSezon() {
    return this.sezonService.aktifSezonuGetir();
  }

  // Sezon sıralaması - Auth gerektirmez
  @Get('siralama')
  async sezonSiralamasi(@Query('limit') limit?: number) {
    return this.sezonService.sezonSiralamasiGetir(limit || 100);
  }

  // Benim sezon durumum
  @Get('ben')
  @UseGuards(JwtAuthGuard)
  async benimDurumum(@Request() req: { user: { id: string } }) {
    return this.sezonService.oyuncuSezonDurumuGetir(req.user.id);
  }
}
