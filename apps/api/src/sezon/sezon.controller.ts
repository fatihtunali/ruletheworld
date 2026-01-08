import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SezonService } from './sezon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sezon')
@Controller('sezon')
export class SezonController {
  constructor(private sezonService: SezonService) {}

  @Get('aktif')
  @ApiOperation({ summary: 'Aktif sezonu getir', description: 'Şu anda aktif olan sezon bilgilerini döner' })
  @ApiResponse({ status: 200, description: 'Aktif sezon bilgileri' })
  async aktifSezon() {
    return this.sezonService.aktifSezonuGetir();
  }

  @Get('siralama')
  @ApiOperation({ summary: 'Sezon sıralaması', description: 'Aktif sezonun liderlik tablosu' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum oyuncu sayısı (varsayılan: 100)' })
  @ApiResponse({ status: 200, description: 'Sıralama listesi' })
  async sezonSiralamasi(@Query('limit') limit?: number) {
    return this.sezonService.sezonSiralamasiGetir(limit || 100);
  }

  @Get('ben')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Benim sezon durumum', description: 'Giriş yapmış oyuncunun sezon istatistikleri' })
  @ApiResponse({ status: 200, description: 'Oyuncu sezon durumu, tier ve sıralama' })
  async benimDurumum(@Request() req: { user: { id: string } }) {
    return this.sezonService.oyuncuSezonDurumuGetir(req.user.id);
  }
}
