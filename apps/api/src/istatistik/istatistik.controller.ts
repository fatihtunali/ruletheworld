import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IstatistikService } from './istatistik.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../admin/guards/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';

@ApiTags('İstatistikler')
@Controller('istatistikler')
export class IstatistikController {
  constructor(private istatistikService: IstatistikService) {}

  @Get('liderlik')
  @ApiOperation({ summary: 'Liderlik tablosu', description: 'Tüm oyuncuların sıralamasını getirir' })
  @ApiQuery({ name: 'limit', required: false, description: 'Kaç oyuncu getirilecek (max 100)', example: 20 })
  @ApiQuery({ name: 'tip', required: false, enum: ['haftalik', 'sezonluk', 'toplam'], description: 'Sıralama tipi' })
  @ApiResponse({ status: 200, description: 'Liderlik tablosu başarıyla getirildi' })
  async liderlikTablosu(
    @Query('limit') limit?: string,
    @Query('tip') tip?: 'haftalik' | 'sezonluk' | 'toplam',
  ) {
    const sayi = parseInt(limit || '20', 10);
    if (tip) {
      return this.istatistikService.genisLiderlikTablosuGetir(tip, Math.min(sayi, 100));
    }
    return this.istatistikService.liderlikTablosuGetir(Math.min(sayi, 100));
  }

  @Get('genel')
  @ApiOperation({ summary: 'Genel istatistikler', description: 'Platform genelindeki istatistikleri getirir' })
  @ApiResponse({ status: 200, description: 'Genel istatistikler başarıyla getirildi' })
  async genelIstatistikler() {
    return this.istatistikService.genelIstatistiklerGetir();
  }

  @Get('sonuc-dagilimi')
  @ApiOperation({ summary: 'Oyun sonuç dağılımı', description: 'Tüm oyunların sonuç dağılımını getirir' })
  @ApiResponse({ status: 200, description: 'Sonuç dağılımı başarıyla getirildi' })
  async sonucDagilimi() {
    return this.istatistikService.oyunSonucDagilimiGetir();
  }

  @Get('oyuncu/:id')
  @ApiOperation({ summary: 'Oyuncu detaylı istatistikleri', description: 'Belirli bir oyuncunun detaylı istatistiklerini getirir' })
  @ApiParam({ name: 'id', description: 'Oyuncu ID' })
  @ApiResponse({ status: 200, description: 'Oyuncu istatistikleri başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Oyuncu bulunamadı' })
  async oyuncuIstatistikleri(@Param('id') id: string) {
    return this.istatistikService.oyuncuIstatistikleriGetir(id);
  }

  @Get('tekrar/:toplulukId')
  @ApiOperation({ summary: 'Oyun tekrarı', description: 'Tamamlanmış bir oyunun tüm detaylarını getirir (replay)' })
  @ApiParam({ name: 'toplulukId', description: 'Topluluk ID' })
  @ApiResponse({ status: 200, description: 'Oyun tekrarı verileri başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Topluluk bulunamadı' })
  async oyunTekrari(@Param('toplulukId') toplulukId: string) {
    return this.istatistikService.oyunTekrariGetir(toplulukId);
  }

  @Get('aktif-oyunlar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktif oyunlar (Admin)', description: 'Şu an devam eden tüm oyunları listeler' })
  @ApiResponse({ status: 200, description: 'Aktif oyunlar başarıyla getirildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Bu işlem için yetkiniz yok' })
  async aktifOyunlar() {
    return this.istatistikService.aktifOyunlariGetir();
  }

  @Get('oyuncu-ara')
  @ApiOperation({ summary: 'Oyuncu ara', description: 'Kullanıcı adına göre oyuncu arar' })
  @ApiQuery({ name: 'q', required: true, description: 'Arama terimi (en az 2 karakter)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Kaç sonuç getirilecek (max 20)', example: 10 })
  @ApiResponse({ status: 200, description: 'Arama sonuçları' })
  async oyuncuAra(
    @Query('q') arama: string,
    @Query('limit') limit?: string,
  ) {
    return this.istatistikService.oyuncuAra(arama, Math.min(parseInt(limit || '10'), 20));
  }
}
