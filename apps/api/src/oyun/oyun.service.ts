import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToplulukDurumu, OyunAsamasi, UyeRolu, OneriDurumu, OySecimi, OyunSonucu } from '@prisma/client';
import { rastgeleOlayGetir, olayGetir, Olay, OlaySecenegi } from './olaylar.data';
import {
  OyunStateMachineService,
  TIMING,
  GAME_CONFIG,
  TieBreakScore,
} from './oyun-state-machine.service';

// Zamanlayıcı süreleri (saniye) - State Machine'den alınıyor
const SURELER = {
  OLAY_ACILISI: TIMING.EVENT_REVEAL / 1000,
  TARTISMA: TIMING.PROPOSAL / 1000,
  OYLAMA: TIMING.VOTING / 1000,
  TUR_SONU: TIMING.RESULTS / 1000,
  HESAPLAMA: TIMING.RESOLVE / 1000,
};

export interface OyuncuDurumu {
  id: string;
  kullaniciAdi: string;
  rol: 'KURUCU' | 'OYUNCU';
  hazir: boolean;
  bagli: boolean;
}

export interface Kaynaklar {
  hazine: number;
  refah: number;
  istikrar: number;
  altyapi: number;
}

export interface OneriVerisi {
  id: string;
  onericiId: string;
  onericiAdi: string;
  baslik: string;
  aciklama: string;
  secenekId: string;
  oylar: { oyuncuId: string; secim: 'EVET' | 'HAYIR' | 'CEKIMSER' }[];
}

export interface MesajVerisi {
  id: string;
  oyuncuId: string;
  oyuncuAdi: string;
  icerik: string;
  zaman: string;
}

export interface ToplulukDurumuVerisi {
  toplulukId: string;
  toplulukIsmi: string;
  durum: ToplulukDurumu;
  asama: OyunAsamasi;
  mevcutTur: number;
  toplamTur: number;
  kaynaklar: Kaynaklar;
  oyuncular: OyuncuDurumu[];
  mevcutOlay: Olay | null;
  oneriler: OneriVerisi[];
  mesajlar: MesajVerisi[];
  asamaBitisZamani: number | null;
  sonuc: {
    durum: OyunSonucu;
    kaynaklar: Kaynaklar;
    ozet: string;
  } | null;
}

@Injectable()
export class OyunService {
  private readonly logger = new Logger(OyunService.name);

  // Bellek içi hazırlık durumları (socket disconnect olunca sıfırlanır)
  private hazirlikDurumlari = new Map<string, Map<string, boolean>>();
  // Bağlı oyuncular
  private bagliOyuncular = new Map<string, Set<string>>();
  // Kullanılan olaylar (tekrar gelmemesi için)
  private kullanilanOlaylar = new Map<string, string[]>();

  constructor(
    private prisma: PrismaService,
    private stateMachine: OyunStateMachineService,
  ) {}

  // Oyuncu bağlandığında
  async oyuncuBaglandi(toplulukId: string, oyuncuId: string): Promise<ToplulukDurumuVerisi | null> {
    // Bağlı oyuncuları güncelle
    if (!this.bagliOyuncular.has(toplulukId)) {
      this.bagliOyuncular.set(toplulukId, new Set());
    }
    this.bagliOyuncular.get(toplulukId)!.add(oyuncuId);

    // Hazırlık durumlarını başlat
    if (!this.hazirlikDurumlari.has(toplulukId)) {
      this.hazirlikDurumlari.set(toplulukId, new Map());
    }

    return this.toplulukDurumuGetir(toplulukId, oyuncuId);
  }

  // Oyuncu ayrıldığında
  oyuncuAyrildi(toplulukId: string, oyuncuId: string): void {
    const baglilar = this.bagliOyuncular.get(toplulukId);
    if (baglilar) {
      baglilar.delete(oyuncuId);
    }
  }

  // Topluluk durumunu getir
  async toplulukDurumuGetir(toplulukId: string, oyuncuId: string): Promise<ToplulukDurumuVerisi | null> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: {
          where: { durum: 'AKTIF' },
          include: { oyuncu: { select: { id: true, kullaniciAdi: true } } },
        },
        oyunDurumu: true,
        mesajlar: {
          take: 50,
          orderBy: { olusturuldu: 'desc' },
          include: { oyuncu: { select: { kullaniciAdi: true } } },
        },
      },
    });

    if (!topluluk) return null;

    // Oyuncu bu toplulukta mı?
    const oyuncuMevcut = topluluk.uyeler.some((u) => u.oyuncuId === oyuncuId);
    if (!oyuncuMevcut) return null;

    const hazirliklar = this.hazirlikDurumlari.get(toplulukId) || new Map();
    const baglilar = this.bagliOyuncular.get(toplulukId) || new Set();

    // Mevcut tur varsa önerileri getir
    let oneriler: OneriVerisi[] = [];
    let mevcutOlay: Olay | null = null;

    if (topluluk.oyunDurumu && topluluk.oyunDurumu.mevcutTur > 0) {
      const tur = await this.prisma.tur.findUnique({
        where: {
          toplulukId_turNumarasi: {
            toplulukId,
            turNumarasi: topluluk.oyunDurumu.mevcutTur,
          },
        },
        include: {
          oneriler: {
            include: {
              onerici: { select: { kullaniciAdi: true } },
              oylar: true,
            },
          },
        },
      });

      if (tur?.olayVerisi) {
        mevcutOlay = tur.olayVerisi as unknown as Olay;
      }

      if (tur?.oneriler) {
        oneriler = tur.oneriler.map((o) => ({
          id: o.id,
          onericiId: o.onericiId,
          onericiAdi: o.onerici.kullaniciAdi,
          baslik: o.baslik,
          aciklama: o.aciklama,
          secenekId: (o.eylemler as { secenekId: string }).secenekId || '',
          oylar: o.oylar.map((oy) => ({
            oyuncuId: oy.oyuncuId,
            secim: oy.secim as 'EVET' | 'HAYIR' | 'CEKIMSER',
          })),
        }));
      }
    }

    return {
      toplulukId: topluluk.id,
      toplulukIsmi: topluluk.isim,
      durum: topluluk.durum,
      asama: topluluk.oyunDurumu?.asama || OyunAsamasi.LOBI,
      mevcutTur: topluluk.oyunDurumu?.mevcutTur || 0,
      toplamTur: topluluk.oyunDurumu?.toplamTur || 6,
      kaynaklar: {
        hazine: topluluk.oyunDurumu?.hazine || 1000,
        refah: topluluk.oyunDurumu?.refah || 60,
        istikrar: topluluk.oyunDurumu?.istikrar || 60,
        altyapi: topluluk.oyunDurumu?.altyapi || 50,
      },
      oyuncular: topluluk.uyeler.map((u) => ({
        id: u.oyuncu.id,
        kullaniciAdi: u.oyuncu.kullaniciAdi,
        rol: u.rol as 'KURUCU' | 'OYUNCU',
        hazir: hazirliklar.get(u.oyuncuId) || false,
        bagli: baglilar.has(u.oyuncuId),
      })),
      mevcutOlay,
      oneriler,
      mesajlar: topluluk.mesajlar.reverse().map((m) => ({
        id: m.id,
        oyuncuId: m.oyuncuId,
        oyuncuAdi: m.oyuncu.kullaniciAdi,
        icerik: m.icerik,
        zaman: m.olusturuldu.toISOString(),
      })),
      asamaBitisZamani: topluluk.oyunDurumu?.asamaBitisAt?.getTime() || null,
      sonuc: topluluk.oyunDurumu?.sonuc
        ? {
            durum: topluluk.oyunDurumu.sonuc,
            kaynaklar: {
              hazine: topluluk.oyunDurumu.hazine,
              refah: topluluk.oyunDurumu.refah,
              istikrar: topluluk.oyunDurumu.istikrar,
              altyapi: topluluk.oyunDurumu.altyapi,
            },
            ozet: this.ozetOlustur(topluluk.oyunDurumu.sonuc),
          }
        : null,
    };
  }

  // Hazırlık durumunu değiştir
  async hazirlikDegistir(toplulukId: string, oyuncuId: string): Promise<boolean> {
    if (!this.hazirlikDurumlari.has(toplulukId)) {
      this.hazirlikDurumlari.set(toplulukId, new Map());
    }
    const hazirliklar = this.hazirlikDurumlari.get(toplulukId)!;
    const mevcutDurum = hazirliklar.get(oyuncuId) || false;
    hazirliklar.set(oyuncuId, !mevcutDurum);
    return !mevcutDurum;
  }

  // Oyunu başlat
  async oyunuBaslat(toplulukId: string, kurucuId: string): Promise<{ basarili: boolean; hata?: string }> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) {
      return { basarili: false, hata: 'Topluluk bulunamadı' };
    }

    // Kurucu mu kontrol et
    const kurucu = topluluk.uyeler.find((u) => u.oyuncuId === kurucuId && u.rol === UyeRolu.KURUCU);
    if (!kurucu) {
      return { basarili: false, hata: 'Sadece kurucu oyunu başlatabilir' };
    }

    // Minimum oyuncu kontrolü
    if (topluluk.uyeler.length < topluluk.minOyuncu) {
      return { basarili: false, hata: `En az ${topluluk.minOyuncu} oyuncu gerekli` };
    }

    // Herkes hazır mı kontrolü
    const hazirliklar = this.hazirlikDurumlari.get(toplulukId);
    const herkezHazir = topluluk.uyeler.every((u) => hazirliklar?.get(u.oyuncuId));
    if (!herkezHazir) {
      return { basarili: false, hata: 'Tüm oyuncular hazır olmalı' };
    }

    // Oyun durumu oluştur
    await this.prisma.$transaction([
      this.prisma.topluluk.update({
        where: { id: toplulukId },
        data: {
          durum: ToplulukDurumu.DEVAM_EDIYOR,
          basladiAt: new Date(),
        },
      }),
      this.prisma.oyunDurumu.create({
        data: {
          toplulukId,
          asama: OyunAsamasi.TUR_BASI,
          mevcutTur: 0,
          toplamTur: 6,
          hazine: 1000,
          refah: 60,
          istikrar: 60,
          altyapi: 50,
        },
      }),
    ]);

    return { basarili: true };
  }

  // Yeni tur başlat
  async yeniTurBaslat(toplulukId: string): Promise<{ olay: Olay; sure: number } | null> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu) return null;

    const yeniTur = oyunDurumu.mevcutTur + 1;

    // Oyun bitti mi?
    if (yeniTur > oyunDurumu.toplamTur) {
      return null;
    }

    // Kullanılan olayları getir
    const kullanilanlar = this.kullanilanOlaylar.get(toplulukId) || [];
    const olay = rastgeleOlayGetir(kullanilanlar);
    kullanilanlar.push(olay.id);
    this.kullanilanOlaylar.set(toplulukId, kullanilanlar);

    const asamaBitisAt = new Date(Date.now() + SURELER.OLAY_ACILISI * 1000);

    await this.prisma.$transaction([
      this.prisma.oyunDurumu.update({
        where: { toplulukId },
        data: {
          mevcutTur: yeniTur,
          asama: OyunAsamasi.OLAY_ACILISI,
          asamaBitisAt,
        },
      }),
      this.prisma.tur.create({
        data: {
          toplulukId,
          turNumarasi: yeniTur,
          olayId: olay.id,
          olayVerisi: JSON.parse(JSON.stringify(olay)),
          basHazine: oyunDurumu.hazine,
          basRefah: oyunDurumu.refah,
          basIstikrar: oyunDurumu.istikrar,
          basAltyapi: oyunDurumu.altyapi,
        },
      }),
    ]);

    return { olay, sure: SURELER.OLAY_ACILISI };
  }

  // Tartışma başlat
  async tartismaBaslat(toplulukId: string): Promise<{ sure: number }> {
    const asamaBitisAt = new Date(Date.now() + SURELER.TARTISMA * 1000);

    await this.prisma.oyunDurumu.update({
      where: { toplulukId },
      data: {
        asama: OyunAsamasi.TARTISMA,
        asamaBitisAt,
      },
    });

    return { sure: SURELER.TARTISMA };
  }

  // Öneri gönder
  async oneriGonder(
    toplulukId: string,
    oyuncuId: string,
    secenekId: string,
    aciklama: string,
  ): Promise<OneriVerisi | null> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu || oyunDurumu.asama !== OyunAsamasi.TARTISMA) return null;

    const tur = await this.prisma.tur.findUnique({
      where: {
        toplulukId_turNumarasi: {
          toplulukId,
          turNumarasi: oyunDurumu.mevcutTur,
        },
      },
    });

    if (!tur?.olayVerisi) return null;

    const olay = tur.olayVerisi as unknown as Olay;
    const secenek = olay.secenekler.find((s) => s.id === secenekId);
    if (!secenek) return null;

    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { kullaniciAdi: true },
    });

    if (!oyuncu) return null;

    const oneri = await this.prisma.oneri.create({
      data: {
        turId: tur.id,
        onericiId: oyuncuId,
        baslik: secenek.baslik,
        aciklama: aciklama || secenek.aciklama,
        eylemler: { secenekId },
        durum: OneriDurumu.OYLAMADA,
      },
    });

    // İstatistik güncelle
    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: { yapilanOneriler: { increment: 1 } },
    });

    return {
      id: oneri.id,
      onericiId: oyuncuId,
      onericiAdi: oyuncu.kullaniciAdi,
      baslik: oneri.baslik,
      aciklama: oneri.aciklama,
      secenekId,
      oylar: [],
    };
  }

  // Oylama başlat
  async oylamaBaslat(toplulukId: string): Promise<{ sure: number }> {
    const asamaBitisAt = new Date(Date.now() + SURELER.OYLAMA * 1000);

    await this.prisma.oyunDurumu.update({
      where: { toplulukId },
      data: {
        asama: OyunAsamasi.OYLAMA,
        asamaBitisAt,
      },
    });

    return { sure: SURELER.OYLAMA };
  }

  // Oy ver
  async oyVer(
    toplulukId: string,
    oyuncuId: string,
    oneriId: string,
    secim: 'EVET' | 'HAYIR' | 'CEKIMSER',
  ): Promise<boolean> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu || oyunDurumu.asama !== OyunAsamasi.OYLAMA) return false;

    try {
      await this.prisma.oy.upsert({
        where: {
          oneriId_oyuncuId: {
            oneriId,
            oyuncuId,
          },
        },
        create: {
          oneriId,
          oyuncuId,
          secim: OySecimi[secim],
        },
        update: {
          secim: OySecimi[secim],
        },
      });

      // Öneri oy sayılarını güncelle
      const oylar = await this.prisma.oy.groupBy({
        by: ['secim'],
        where: { oneriId },
        _count: true,
      });

      const evetCount = oylar.find((o) => o.secim === OySecimi.EVET)?._count || 0;
      const hayirCount = oylar.find((o) => o.secim === OySecimi.HAYIR)?._count || 0;
      const cekimserCount = oylar.find((o) => o.secim === OySecimi.CEKIMSER)?._count || 0;

      await this.prisma.oneri.update({
        where: { id: oneriId },
        data: {
          evetOylari: evetCount,
          hayirOylari: hayirCount,
          cekimserOylar: cekimserCount,
        },
      });

      // İstatistik güncelle
      await this.prisma.oyuncu.update({
        where: { id: oyuncuId },
        data: { verilenOylar: { increment: 1 } },
      });

      return true;
    } catch {
      return false;
    }
  }

  // Tur sonuçlandır
  async turuSonuclandir(toplulukId: string): Promise<{
    kazananOneri: OneriVerisi | null;
    yeniKaynaklar: Kaynaklar;
    aciklama: string;
  }> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu) {
      return {
        kazananOneri: null,
        yeniKaynaklar: { hazine: 1000, refah: 60, istikrar: 60, altyapi: 50 },
        aciklama: 'Hata oluştu',
      };
    }

    const tur = await this.prisma.tur.findUnique({
      where: {
        toplulukId_turNumarasi: {
          toplulukId,
          turNumarasi: oyunDurumu.mevcutTur,
        },
      },
      include: {
        oneriler: {
          include: {
            onerici: { select: { kullaniciAdi: true } },
            oylar: true,
          },
        },
      },
    });

    if (!tur) {
      return {
        kazananOneri: null,
        yeniKaynaklar: {
          hazine: oyunDurumu.hazine,
          refah: oyunDurumu.refah,
          istikrar: oyunDurumu.istikrar,
          altyapi: oyunDurumu.altyapi,
        },
        aciklama: 'Tur bulunamadı',
      };
    }

    // En çok evet alan öneriyi bul
    let kazananOneri = tur.oneriler[0];
    for (const oneri of tur.oneriler) {
      if (oneri.evetOylari > kazananOneri.evetOylari) {
        kazananOneri = oneri;
      }
    }

    let yeniKaynaklar: Kaynaklar;
    let aciklama: string;

    if (kazananOneri && kazananOneri.evetOylari > kazananOneri.hayirOylari) {
      // Kazanan öneriyi uygula
      const olay = tur.olayVerisi as unknown as Olay;
      const secenekId = (kazananOneri.eylemler as { secenekId: string }).secenekId;
      const secenek = olay.secenekler.find((s) => s.id === secenekId);

      if (secenek) {
        yeniKaynaklar = {
          hazine: Math.max(0, oyunDurumu.hazine + secenek.etkiler.hazine),
          refah: Math.max(0, Math.min(100, oyunDurumu.refah + secenek.etkiler.refah)),
          istikrar: Math.max(0, Math.min(100, oyunDurumu.istikrar + secenek.etkiler.istikrar)),
          altyapi: Math.max(0, Math.min(100, oyunDurumu.altyapi + secenek.etkiler.altyapi)),
        };
        aciklama = `"${kazananOneri.baslik}" kabul edildi.`;

        await this.prisma.oneri.update({
          where: { id: kazananOneri.id },
          data: { durum: OneriDurumu.GECTI },
        });
      } else {
        yeniKaynaklar = {
          hazine: oyunDurumu.hazine,
          refah: oyunDurumu.refah,
          istikrar: oyunDurumu.istikrar,
          altyapi: oyunDurumu.altyapi,
        };
        aciklama = 'Seçenek bulunamadı, değişiklik yapılmadı.';
      }
    } else {
      // Hiçbir öneri kabul edilmedi
      yeniKaynaklar = {
        hazine: oyunDurumu.hazine,
        refah: Math.max(0, oyunDurumu.refah - 5),
        istikrar: Math.max(0, oyunDurumu.istikrar - 5),
        altyapi: oyunDurumu.altyapi,
      };
      aciklama = 'Uzlaşma sağlanamadı. Topluluk karar veremedi.';
    }

    // Veritabanını güncelle
    await this.prisma.$transaction([
      this.prisma.oyunDurumu.update({
        where: { toplulukId },
        data: {
          asama: OyunAsamasi.TUR_SONU,
          hazine: yeniKaynaklar.hazine,
          refah: yeniKaynaklar.refah,
          istikrar: yeniKaynaklar.istikrar,
          altyapi: yeniKaynaklar.altyapi,
          asamaBitisAt: new Date(Date.now() + SURELER.TUR_SONU * 1000),
        },
      }),
      this.prisma.tur.update({
        where: { id: tur.id },
        data: {
          kazananOneriId: kazananOneri?.id,
          uygulananSonuc: JSON.parse(JSON.stringify(yeniKaynaklar)),
          bittiAt: new Date(),
        },
      }),
    ]);

    return {
      kazananOneri: kazananOneri
        ? {
            id: kazananOneri.id,
            onericiId: kazananOneri.onericiId,
            onericiAdi: kazananOneri.onerici.kullaniciAdi,
            baslik: kazananOneri.baslik,
            aciklama: kazananOneri.aciklama,
            secenekId: (kazananOneri.eylemler as { secenekId: string }).secenekId || '',
            oylar: kazananOneri.oylar.map((oy) => ({
              oyuncuId: oy.oyuncuId,
              secim: oy.secim as 'EVET' | 'HAYIR' | 'CEKIMSER',
            })),
          }
        : null,
      yeniKaynaklar,
      aciklama,
    };
  }

  // Oyunu bitir
  async oyunuBitir(toplulukId: string, erkenBitis: boolean = false): Promise<{
    sonuc: OyunSonucu;
    kaynaklar: Kaynaklar;
    ozet: string;
    carpan: number;
  }> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu) {
      return {
        sonuc: OyunSonucu.COKTU,
        kaynaklar: { hazine: 0, refah: 0, istikrar: 0, altyapi: 0 },
        ozet: 'Oyun durumu bulunamadı.',
        carpan: 0.5,
      };
    }

    const kaynaklar: Kaynaklar = {
      hazine: oyunDurumu.hazine,
      refah: oyunDurumu.refah,
      istikrar: oyunDurumu.istikrar,
      altyapi: oyunDurumu.altyapi,
    };

    // State Machine ile sonucu hesapla (min-based formula)
    const result = this.stateMachine.classifyGameResult(kaynaklar, erkenBitis);

    // Veritabanını güncelle
    await this.prisma.$transaction([
      this.prisma.oyunDurumu.update({
        where: { toplulukId },
        data: {
          asama: OyunAsamasi.SONUC,
          sonuc: result.sonuc,
        },
      }),
      this.prisma.topluluk.update({
        where: { id: toplulukId },
        data: {
          durum: ToplulukDurumu.TAMAMLANDI,
          bittiAt: new Date(),
        },
      }),
    ]);

    // Oyuncu istatistiklerini güncelle
    const uyeler = await this.prisma.toplulukUyesi.findMany({
      where: { toplulukId, durum: 'AKTIF' },
    });

    for (const uye of uyeler) {
      await this.prisma.oyuncu.update({
        where: { id: uye.oyuncuId },
        data: {
          oynananOyunlar: { increment: 1 },
          tamamlananOyunlar: { increment: 1 },
        },
      });
    }

    // Bellek temizliği
    this.hazirlikDurumlari.delete(toplulukId);
    this.bagliOyuncular.delete(toplulukId);
    this.kullanilanOlaylar.delete(toplulukId);

    return {
      sonuc: result.sonuc,
      kaynaklar,
      ozet: result.aciklama,
      carpan: result.carpan,
    };
  }

  // Erken bitiş kontrolü (kaynak 0'a düştü mü?)
  async erkenBitisKontrol(toplulukId: string): Promise<{ bittiMi: boolean; sebep?: string }> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu) return { bittiMi: false };

    const kaynaklar = {
      hazine: oyunDurumu.hazine,
      refah: oyunDurumu.refah,
      istikrar: oyunDurumu.istikrar,
      altyapi: oyunDurumu.altyapi,
    };

    const result = this.stateMachine.checkEarlyGameEnd(kaynaklar);
    return { bittiMi: result.shouldEnd, sebep: result.reason };
  }

  // Zafer anı kontrolü (kaynak 100'e ulaştı mı?)
  async zaferAniKontrol(toplulukId: string): Promise<{ zaferMi: boolean; kaynak?: string }> {
    const oyunDurumu = await this.prisma.oyunDurumu.findUnique({
      where: { toplulukId },
    });

    if (!oyunDurumu) return { zaferMi: false };

    const kaynaklar = {
      hazine: oyunDurumu.hazine,
      refah: oyunDurumu.refah,
      istikrar: oyunDurumu.istikrar,
      altyapi: oyunDurumu.altyapi,
    };

    const result = this.stateMachine.checkVictoryMoment(kaynaklar);
    return { zaferMi: result.hasVictory, kaynak: result.resource };
  }

  // Mesaj gönder
  async mesajGonder(toplulukId: string, oyuncuId: string, icerik: string): Promise<MesajVerisi | null> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { kullaniciAdi: true },
    });

    if (!oyuncu) return null;

    const mesaj = await this.prisma.mesaj.create({
      data: {
        toplulukId,
        oyuncuId,
        icerik: icerik.slice(0, 200),
      },
    });

    return {
      id: mesaj.id,
      oyuncuId,
      oyuncuAdi: oyuncu.kullaniciAdi,
      icerik: mesaj.icerik,
      zaman: mesaj.olusturuldu.toISOString(),
    };
  }

  private ozetOlustur(sonuc: OyunSonucu): string {
    switch (sonuc) {
      case OyunSonucu.PARLADI:
        return 'Topluluk birlik içinde çalışarak parlak bir gelecek inşa etti. Tüm kaynaklar 70 üzerinde! Mükemmel bir liderlik örneği!';
      case OyunSonucu.GELISTI:
        return 'Topluluk iyi yönetildi ve gelişme kaydetti. Dengeli kararlar toplumu güçlendirdi.';
      case OyunSonucu.DURAGAN:
        return 'Topluluk idare etti. Ne büyük bir başarı ne de başarısızlık. Orta düzeyde bir yönetim.';
      case OyunSonucu.GERILEDI:
        return 'Topluluk ciddi zorluklarla karşılaştı. Bazı kararlar olumsuz sonuçlar doğurdu, daha dikkatli kararlar gerekiyor.';
      case OyunSonucu.COKTU:
        return 'Ne yazık ki topluluk çöktü. Bir kaynak sıfıra düştü ve topluluk ayakta kalamadı.';
      // Backward compatibility
      case OyunSonucu.HAYATTA_KALDI:
        return 'Zorluklara rağmen topluluk ayakta kalmayı başardı.';
      case OyunSonucu.ZORLANDI:
        return 'Topluluk ciddi zorluklarla karşılaştı.';
      default:
        return 'Oyun tamamlandı.';
    }
  }

  // Tie-breaker ile kazanan öneriyi seç
  private kazananOneriyiSec(oneriler: Array<{
    id: string;
    evetOylari: number;
    hazineEtki: number;
    istikrarEtki: number;
    olusturuldu: Date;
  }>): string | null {
    if (oneriler.length === 0) return null;

    const tieBreakScores: TieBreakScore[] = oneriler.map(o => ({
      proposalId: o.id,
      voteCount: o.evetOylari,
      hazineEtki: o.hazineEtki,
      istikrarEtki: o.istikrarEtki,
      timestamp: o.olusturuldu,
      score: this.stateMachine.calculateTieBreakScore(
        o.hazineEtki,
        o.istikrarEtki,
        o.olusturuldu,
      ),
    }));

    const winner = this.stateMachine.selectWinningProposal(tieBreakScores);
    return winner?.proposalId || null;
  }
}
