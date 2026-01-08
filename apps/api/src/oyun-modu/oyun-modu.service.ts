import { Injectable } from '@nestjs/common';

export enum OyunModu {
  NORMAL = 'NORMAL',
  HIZLI = 'HIZLI',
  UZUN = 'UZUN',
  MARATON = 'MARATON',
  EGITIM = 'EGITIM',
  OZEL = 'OZEL',
}

export interface OyunModuAyarlari {
  kod: OyunModu;
  isim: string;
  aciklama: string;
  turSayisi: number;
  turSuresi: number; // saniye
  minOyuncu: number;
  maxOyuncu: number;
  baslangicKaynaklari: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  };
  puanCarpani: number; // Sıralama puanı çarpanı
  botDestegi: boolean;
}

@Injectable()
export class OyunModuService {
  private readonly modlar: Map<OyunModu, OyunModuAyarlari> = new Map([
    [
      OyunModu.NORMAL,
      {
        kod: OyunModu.NORMAL,
        isim: 'Normal Oyun',
        aciklama: 'Standart oyun deneyimi. 6 tur, her tur 2 dakika.',
        turSayisi: 6,
        turSuresi: 120,
        minOyuncu: 4,
        maxOyuncu: 8,
        baslangicKaynaklari: {
          hazine: 1000,
          refah: 60,
          istikrar: 60,
          altyapi: 50,
        },
        puanCarpani: 1.0,
        botDestegi: true,
      },
    ],
    [
      OyunModu.HIZLI,
      {
        kod: OyunModu.HIZLI,
        isim: 'Hızlı Oyun',
        aciklama: 'Kısa ve hızlı oyunlar için. 4 tur, her tur 1 dakika.',
        turSayisi: 4,
        turSuresi: 60,
        minOyuncu: 3,
        maxOyuncu: 6,
        baslangicKaynaklari: {
          hazine: 800,
          refah: 50,
          istikrar: 50,
          altyapi: 40,
        },
        puanCarpani: 0.7,
        botDestegi: true,
      },
    ],
    [
      OyunModu.UZUN,
      {
        kod: OyunModu.UZUN,
        isim: 'Uzun Oyun',
        aciklama: 'Derinlemesine strateji için. 10 tur, her tur 3 dakika.',
        turSayisi: 10,
        turSuresi: 180,
        minOyuncu: 4,
        maxOyuncu: 10,
        baslangicKaynaklari: {
          hazine: 1500,
          refah: 70,
          istikrar: 70,
          altyapi: 60,
        },
        puanCarpani: 1.5,
        botDestegi: true,
      },
    ],
    [
      OyunModu.MARATON,
      {
        kod: OyunModu.MARATON,
        isim: 'Maraton',
        aciklama: 'Epik uzunlukta oyun. 15 tur, her tur 5 dakika.',
        turSayisi: 15,
        turSuresi: 300,
        minOyuncu: 6,
        maxOyuncu: 12,
        baslangicKaynaklari: {
          hazine: 2000,
          refah: 80,
          istikrar: 80,
          altyapi: 70,
        },
        puanCarpani: 2.5,
        botDestegi: false, // Maratonda bot yok
      },
    ],
    [
      OyunModu.EGITIM,
      {
        kod: OyunModu.EGITIM,
        isim: 'Eğitim Modu',
        aciklama: 'Oyunu öğrenmek için. 3 tur, süre sınırı yok.',
        turSayisi: 3,
        turSuresi: 0, // 0 = sınırsız
        minOyuncu: 1,
        maxOyuncu: 4,
        baslangicKaynaklari: {
          hazine: 1200,
          refah: 70,
          istikrar: 70,
          altyapi: 60,
        },
        puanCarpani: 0, // Eğitimde puan yok
        botDestegi: true,
      },
    ],
    [
      OyunModu.OZEL,
      {
        kod: OyunModu.OZEL,
        isim: 'Özel Mod',
        aciklama: 'Kendi kurallarını belirle.',
        turSayisi: 6,
        turSuresi: 120,
        minOyuncu: 2,
        maxOyuncu: 12,
        baslangicKaynaklari: {
          hazine: 1000,
          refah: 60,
          istikrar: 60,
          altyapi: 50,
        },
        puanCarpani: 0.5,
        botDestegi: true,
      },
    ],
  ]);

  // Tüm modları getir
  tumModlar(): OyunModuAyarlari[] {
    return Array.from(this.modlar.values());
  }

  // Belirli bir modu getir
  modGetir(mod: OyunModu): OyunModuAyarlari | undefined {
    return this.modlar.get(mod);
  }

  // Mod ayarlarını özelleştir (OZEL mod için)
  ozelModOlustur(
    ayarlar: Partial<Omit<OyunModuAyarlari, 'kod' | 'isim'>>,
  ): OyunModuAyarlari {
    const varsayilan = this.modlar.get(OyunModu.OZEL)!;
    return {
      ...varsayilan,
      ...ayarlar,
      kod: OyunModu.OZEL,
      isim: 'Özel Mod',
    };
  }

  // Mod için uygun süre kontrolü
  sureDolduMu(baslangic: Date, turSuresi: number): boolean {
    if (turSuresi === 0) return false; // Sınırsız süre
    const gecenSure = (Date.now() - baslangic.getTime()) / 1000;
    return gecenSure >= turSuresi;
  }

  // Puan hesapla
  puanHesapla(
    mod: OyunModu,
    sonuc: 'PARLADI' | 'HAYATTA_KALDI' | 'ZORLANDI' | 'COKTU',
  ): number {
    const modAyarlari = this.modlar.get(mod);
    if (!modAyarlari) return 0;

    const temelPuanlar: Record<string, number> = {
      PARLADI: 100,
      HAYATTA_KALDI: 60,
      ZORLANDI: 30,
      COKTU: 10,
    };

    return Math.round(temelPuanlar[sonuc] * modAyarlari.puanCarpani);
  }

  // Mod özeti (frontend için)
  modOzeti(mod: OyunModu): {
    isim: string;
    aciklama: string;
    sure: string;
    oyuncuSayisi: string;
  } {
    const ayarlar = this.modlar.get(mod);
    if (!ayarlar) {
      return {
        isim: 'Bilinmeyen',
        aciklama: '',
        sure: '',
        oyuncuSayisi: '',
      };
    }

    const sureStr =
      ayarlar.turSuresi === 0
        ? 'Sınırsız'
        : `${ayarlar.turSayisi} tur × ${Math.floor(ayarlar.turSuresi / 60)} dk`;

    return {
      isim: ayarlar.isim,
      aciklama: ayarlar.aciklama,
      sure: sureStr,
      oyuncuSayisi: `${ayarlar.minOyuncu}-${ayarlar.maxOyuncu} oyuncu`,
    };
  }
}
