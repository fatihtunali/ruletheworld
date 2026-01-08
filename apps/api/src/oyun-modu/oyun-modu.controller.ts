import { Controller, Get, Param } from '@nestjs/common';
import { OyunModuService, OyunModu, OyunModuAyarlari } from './oyun-modu.service';

@Controller('oyun-modu')
export class OyunModuController {
  constructor(private oyunModuService: OyunModuService) {}

  // Tüm modları listele
  @Get()
  tumModlar(): OyunModuAyarlari[] {
    return this.oyunModuService.tumModlar();
  }

  // Mod özeti (frontend için)
  @Get('ozet')
  modOzetleri(): Array<{
    kod: OyunModu;
    isim: string;
    aciklama: string;
    sure: string;
    oyuncuSayisi: string;
  }> {
    const modlar = this.oyunModuService.tumModlar();
    return modlar.map((m) => ({
      kod: m.kod,
      ...this.oyunModuService.modOzeti(m.kod),
    }));
  }

  // Belirli bir modu getir
  @Get(':mod')
  modGetir(@Param('mod') mod: OyunModu): OyunModuAyarlari | { hata: string } {
    const ayarlar = this.oyunModuService.modGetir(mod);
    if (!ayarlar) {
      return { hata: 'Geçersiz oyun modu' };
    }
    return ayarlar;
  }
}
