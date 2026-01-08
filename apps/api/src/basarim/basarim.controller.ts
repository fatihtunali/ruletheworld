import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BasarimService } from './basarim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Başarımlar')
@Controller('basarimlar')
export class BasarimController {
  constructor(private basarimService: BasarimService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Başarımları seed et', description: 'Varsayılan başarımları veritabanına ekler (admin için)' })
  @ApiResponse({ status: 200, description: 'Eklenen başarım sayısı' })
  async seedBasarimlar() {
    const eklenen = await this.basarimService.basarimlariSeedle();
    return { mesaj: `${eklenen} yeni başarım eklendi` };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tüm başarımlar', description: 'Giriş yapmış oyuncunun başarım durumlarını listeler' })
  @ApiResponse({ status: 200, description: 'Başarım listesi (kazanılmış/kazanılmamış durumlarıyla)' })
  async tumBasarimlar(@Request() req: any) {
    const basarimlar = await this.basarimService.tumBasarimlar(req.user.sub);
    return { basarimlar };
  }

  @Get('liste')
  @ApiOperation({ summary: 'Başarım listesi (public)', description: 'Tüm başarımları listeler (giriş yapmadan)' })
  @ApiResponse({ status: 200, description: 'Tüm başarımların listesi' })
  async basarimListesi() {
    const basarimlar = await this.basarimService.tumBasarimlar();
    return { basarimlar };
  }

  @Get('ozet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Başarım özeti', description: 'Oyuncunun başarım istatistiklerini getirir' })
  @ApiResponse({ status: 200, description: 'Toplam, kazanılan, yüzde ve son kazanılan başarım' })
  async basarimOzeti(@Request() req: any) {
    const ozet = await this.basarimService.basarimOzeti(req.user.sub);
    return ozet;
  }

  @Post('kontrol')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Başarım kontrolü', description: 'Oyuncunun istatistiklerine göre kazanılabilecek başarımları kontrol eder' })
  @ApiResponse({ status: 200, description: 'Yeni kazanılan başarımlar listesi' })
  async basarimKontrol(@Request() req: any) {
    const kazanilanlar = await this.basarimService.basarimKontrol(req.user.sub);
    return {
      yeniBasarimlar: kazanilanlar,
      mesaj: kazanilanlar.length > 0
        ? `${kazanilanlar.length} yeni başarım kazandınız!`
        : 'Henüz yeni başarım yok',
    };
  }

  @Get('istatistikler')
  @ApiOperation({ summary: 'Nadirlik istatistikleri', description: 'Her başarımın kaç oyuncu tarafından kazanıldığını gösterir' })
  @ApiResponse({ status: 200, description: 'Başarım istatistikleri listesi' })
  async nadirlikIstatistikleri() {
    const istatistikler = await this.basarimService.nadirlikIstatistikleri();
    return { istatistikler };
  }

  @Get('kategori/:kategori')
  @ApiOperation({ summary: 'Kategoriye göre başarımlar', description: 'Belirli bir kategorideki başarımları listeler' })
  @ApiResponse({ status: 200, description: 'Kategori başarımları' })
  async kategoriyeGore(@Param('kategori') kategori: string) {
    const basarimlar = await this.basarimService.tumBasarimlar();
    const filtrelenmis = basarimlar.filter(b => b.kategori === kategori.toUpperCase());
    return { basarimlar: filtrelenmis };
  }
}
