import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { BasarimService } from './basarim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('basarimlar')
export class BasarimController {
  constructor(private basarimService: BasarimService) {}

  // Varsayılan başarımları seed et (admin için)
  @Post('seed')
  async seedBasarimlar() {
    const eklenen = await this.basarimService.basarimlariSeedle();
    return { mesaj: `${eklenen} yeni başarım eklendi` };
  }

  // Tüm başarımları listele
  @Get()
  @UseGuards(JwtAuthGuard)
  async tumBasarimlar(@Request() req: any) {
    const basarimlar = await this.basarimService.tumBasarimlar(req.user.sub);
    return { basarimlar };
  }

  // Public başarım listesi (giriş yapmadan)
  @Get('liste')
  async basarimListesi() {
    const basarimlar = await this.basarimService.tumBasarimlar();
    return { basarimlar };
  }

  // Oyuncunun başarım özeti
  @Get('ozet')
  @UseGuards(JwtAuthGuard)
  async basarimOzeti(@Request() req: any) {
    const ozet = await this.basarimService.basarimOzeti(req.user.sub);
    return ozet;
  }

  // Başarım kontrolü tetikle
  @Post('kontrol')
  @UseGuards(JwtAuthGuard)
  async basarimKontrol(@Request() req: any) {
    const kazanilanlar = await this.basarimService.basarimKontrol(req.user.sub);
    return {
      yeniBasarimlar: kazanilanlar,
      mesaj: kazanilanlar.length > 0
        ? `${kazanilanlar.length} yeni başarım kazandınız!`
        : 'Henüz yeni başarım yok',
    };
  }

  // Nadirlik istatistikleri
  @Get('istatistikler')
  async nadirlikIstatistikleri() {
    const istatistikler = await this.basarimService.nadirlikIstatistikleri();
    return { istatistikler };
  }
}
