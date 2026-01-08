import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TekrarService } from './tekrar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tekrar')
export class TekrarController {
  constructor(private tekrarService: TekrarService) {}

  // Tamamlanan oyunların listesi
  @Get('oyunlar')
  async tamamlananOyunlar(@Query('sayfa') sayfa?: string, @Query('limit') limit?: string) {
    const sayfaNum = parseInt(sayfa || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    return this.tekrarService.tamamlananOyunlar(sayfaNum, limitNum);
  }

  // Oyun tekrarını getir
  @Get(':id')
  async tekrarGetir(@Param('id') id: string) {
    const tekrar = await this.tekrarService.tekrarGetir(id);
    if (!tekrar) {
      return { hata: 'Oyun bulunamadı' };
    }
    return { tekrar };
  }

  // Oyun özeti
  @Get(':id/ozet')
  async oyunOzeti(@Param('id') id: string) {
    const ozet = await this.tekrarService.oyunOzeti(id);
    if (!ozet) {
      return { hata: 'Oyun bulunamadı' };
    }
    return ozet;
  }

  // Belirli bir turun olayları
  @Get(':id/tur/:turNumarasi')
  async turOlaylari(@Param('id') id: string, @Param('turNumarasi') turNumarasi: string) {
    const olaylar = await this.tekrarService.turOlaylari(id, parseInt(turNumarasi, 10));
    return { olaylar };
  }
}
