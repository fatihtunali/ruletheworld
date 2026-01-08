import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class IstatistikService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Detaylı oyuncu istatistikleri
  async oyuncuIstatistikleriGetir(oyuncuId: string) {
    const cacheKey = `oyuncu-istatistik:${oyuncuId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const oyuncu = await this.prisma.oyuncu.findUnique({
          where: { id: oyuncuId },
          select: {
            id: true,
            kullaniciAdi: true,
            oynananOyunlar: true,
            tamamlananOyunlar: true,
            yapilanOneriler: true,
            verilenOylar: true,
            toplamPuan: true,
            sezonPuani: true,
            haftalikPuan: true,
            olusturuldu: true,
            sonAktiflik: true,
          },
        });

        if (!oyuncu) {
          throw new NotFoundException('Oyuncu bulunamadı');
        }

        // Son 10 oyun
        const sonOyunlar = await this.prisma.toplulukUyesi.findMany({
          where: {
            oyuncuId,
            topluluk: {
              durum: 'TAMAMLANDI',
            },
          },
          orderBy: {
            topluluk: {
              bittiAt: 'desc',
            },
          },
          take: 10,
          include: {
            topluluk: {
              select: {
                id: true,
                isim: true,
                basladiAt: true,
                bittiAt: true,
                oyunDurumu: {
                  select: {
                    sonuc: true,
                    hazine: true,
                    refah: true,
                    istikrar: true,
                    altyapi: true,
                  },
                },
              },
            },
          },
        });

        // Sonuç dağılımı (oyuncunun oynadığı oyunlar)
        const oyunSonuclari = await this.prisma.oyunDurumu.groupBy({
          by: ['sonuc'],
          _count: true,
          where: {
            sonuc: { not: null },
            topluluk: {
              uyeler: {
                some: { oyuncuId },
              },
            },
          },
        });

        // Kabul edilen öneri oranı
        const kabullenenOneriler = await this.prisma.oneri.count({
          where: {
            onericiId: oyuncuId,
            durum: 'GECTI',
          },
        });

        const toplamOneriler = await this.prisma.oneri.count({
          where: {
            onericiId: oyuncuId,
          },
        });

        // Başarımlar
        const basarimlar = await this.prisma.kazanilanBasarim.findMany({
          where: { oyuncuId },
          include: {
            basarim: {
              select: {
                kod: true,
                isim: true,
                ikon: true,
                nadirlik: true,
              },
            },
          },
          orderBy: { kazanildiAt: 'desc' },
          take: 20,
        });

        return {
          oyuncu,
          sonOyunlar: sonOyunlar.map((u) => ({
            toplulukId: u.topluluk.id,
            toplulukIsmi: u.topluluk.isim,
            basladiAt: u.topluluk.basladiAt,
            bittiAt: u.topluluk.bittiAt,
            sonuc: u.topluluk.oyunDurumu?.sonuc,
            kaynaklar: u.topluluk.oyunDurumu
              ? {
                  hazine: u.topluluk.oyunDurumu.hazine,
                  refah: u.topluluk.oyunDurumu.refah,
                  istikrar: u.topluluk.oyunDurumu.istikrar,
                  altyapi: u.topluluk.oyunDurumu.altyapi,
                }
              : null,
          })),
          sonucDagilimi: oyunSonuclari.reduce(
            (acc, s) => {
              if (s.sonuc) acc[s.sonuc] = s._count;
              return acc;
            },
            {} as Record<string, number>,
          ),
          oneriBasariOrani:
            toplamOneriler > 0
              ? Math.round((kabullenenOneriler / toplamOneriler) * 100)
              : 0,
          basarimlar: basarimlar.map((b) => ({
            kod: b.basarim.kod,
            isim: b.basarim.isim,
            ikon: b.basarim.ikon,
            nadirlik: b.basarim.nadirlik,
            kazanildiAt: b.kazanildiAt,
          })),
        };
      },
      CacheService.TTL.MEDIUM,
    );
  }

  // Oyun tekrarı (replay) verisi
  async oyunTekrariGetir(toplulukId: string) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      select: {
        id: true,
        isim: true,
        durum: true,
        oyunModu: true,
        basladiAt: true,
        bittiAt: true,
        uyeler: {
          include: {
            oyuncu: {
              select: {
                id: true,
                kullaniciAdi: true,
                botMu: true,
                botKisilik: true,
              },
            },
          },
        },
        oyunDurumu: true,
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    // Tüm oyun olayları
    const olaylar = await this.prisma.oyunOlayi.findMany({
      where: { toplulukId },
      orderBy: { olusturuldu: 'asc' },
    });

    // Tur detayları
    const turlar = await this.prisma.tur.findMany({
      where: { toplulukId },
      orderBy: { turNumarasi: 'asc' },
      include: {
        oneriler: {
          include: {
            onerici: {
              select: {
                id: true,
                kullaniciAdi: true,
              },
            },
            oylar: {
              include: {
                oyuncu: {
                  select: {
                    id: true,
                    kullaniciAdi: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      topluluk: {
        id: topluluk.id,
        isim: topluluk.isim,
        durum: topluluk.durum,
        oyunModu: topluluk.oyunModu,
        basladiAt: topluluk.basladiAt,
        bittiAt: topluluk.bittiAt,
        sonuc: topluluk.oyunDurumu?.sonuc,
        finalKaynaklar: topluluk.oyunDurumu
          ? {
              hazine: topluluk.oyunDurumu.hazine,
              refah: topluluk.oyunDurumu.refah,
              istikrar: topluluk.oyunDurumu.istikrar,
              altyapi: topluluk.oyunDurumu.altyapi,
            }
          : null,
      },
      oyuncular: topluluk.uyeler.map((u) => ({
        id: u.oyuncu.id,
        kullaniciAdi: u.oyuncu.kullaniciAdi,
        rol: u.rol,
        botMu: u.oyuncu.botMu,
        botKisilik: u.oyuncu.botKisilik,
      })),
      turlar: turlar.map((t) => ({
        turNumarasi: t.turNumarasi,
        basHazine: t.basHazine,
        basRefah: t.basRefah,
        basIstikrar: t.basIstikrar,
        basAltyapi: t.basAltyapi,
        olayVerisi: t.olayVerisi,
        kazananOneriId: t.kazananOneriId,
        uygulananSonuc: t.uygulananSonuc,
        basladiAt: t.basladiAt,
        bittiAt: t.bittiAt,
        oneriler: t.oneriler.map((o) => ({
          id: o.id,
          baslik: o.baslik,
          aciklama: o.aciklama,
          eylemler: o.eylemler,
          durum: o.durum,
          onerici: o.onerici,
          oylar: o.oylar.map((oy) => ({
            oyuncu: oy.oyuncu,
            secim: oy.secim,
            otomatikMi: oy.otomatikMi,
          })),
          evetOylari: o.evetOylari,
          hayirOylari: o.hayirOylari,
          cekimserOylar: o.cekimserOylar,
        })),
      })),
      olaylar: olaylar.map((o) => ({
        tip: o.tip,
        veri: o.veri,
        turNumarasi: o.turNumarasi,
        kaynaklar:
          o.hazine !== null
            ? {
                hazine: o.hazine,
                refah: o.refah,
                istikrar: o.istikrar,
                altyapi: o.altyapi,
              }
            : null,
        zaman: o.olusturuldu,
      })),
    };
  }

  // Aktif oyunlar (admin için)
  async aktifOyunlariGetir() {
    return this.cache.getOrSet(
      'aktif-oyunlar',
      async () => {
        const aktifOyunlar = await this.prisma.topluluk.findMany({
          where: {
            durum: {
              in: ['BEKLEME', 'HAZIR', 'GERI_SAYIM', 'BOT_DOLDURMA', 'LOBI', 'DEVAM_EDIYOR'],
            },
          },
          include: {
            uyeler: {
              where: { durum: 'AKTIF' },
              include: {
                oyuncu: {
                  select: {
                    id: true,
                    kullaniciAdi: true,
                    botMu: true,
                  },
                },
              },
            },
            oyunDurumu: {
              select: {
                asama: true,
                mevcutTur: true,
                toplamTur: true,
                hazine: true,
                refah: true,
                istikrar: true,
                altyapi: true,
              },
            },
          },
          orderBy: { olusturuldu: 'desc' },
        });

        return aktifOyunlar.map((t) => ({
          id: t.id,
          isim: t.isim,
          durum: t.durum,
          oyunModu: t.oyunModu,
          olusturuldu: t.olusturuldu,
          basladiAt: t.basladiAt,
          oyuncuSayisi: t.uyeler.length,
          maxOyuncu: t.maxOyuncu,
          oyuncular: t.uyeler.map((u) => ({
            id: u.oyuncu.id,
            kullaniciAdi: u.oyuncu.kullaniciAdi,
            rol: u.rol,
            botMu: u.oyuncu.botMu,
          })),
          oyunDurumu: t.oyunDurumu
            ? {
                asama: t.oyunDurumu.asama,
                mevcutTur: t.oyunDurumu.mevcutTur,
                toplamTur: t.oyunDurumu.toplamTur,
                kaynaklar: {
                  hazine: t.oyunDurumu.hazine,
                  refah: t.oyunDurumu.refah,
                  istikrar: t.oyunDurumu.istikrar,
                  altyapi: t.oyunDurumu.altyapi,
                },
              }
            : null,
        }));
      },
      CacheService.TTL.SHORT, // 30 saniye cache
    );
  }

  // Haftalık/Sezonluk/Toplam liderlik tablosu
  async genisLiderlikTablosuGetir(tip: 'haftalik' | 'sezonluk' | 'toplam', limit: number = 50) {
    const cacheKey = `liderlik-${tip}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const orderField =
          tip === 'haftalik'
            ? 'haftalikPuan'
            : tip === 'sezonluk'
              ? 'sezonPuani'
              : 'toplamPuan';

        const oyuncular = await this.prisma.oyuncu.findMany({
          where: {
            hesapDurumu: 'AKTIF',
            botMu: false,
          },
          orderBy: { [orderField]: 'desc' },
          take: limit,
          select: {
            id: true,
            kullaniciAdi: true,
            toplamPuan: true,
            sezonPuani: true,
            haftalikPuan: true,
            oynananOyunlar: true,
            tamamlananOyunlar: true,
          },
        });

        return oyuncular.map((o, index) => ({
          sira: index + 1,
          ...o,
        }));
      },
      CacheService.TTL.LONG,
    );
  }

  // Liderlik tablosu (5 dakika cache)
  async liderlikTablosuGetir(limit: number = 20) {
    const cacheKey = `${CacheService.KEYS.LIDERLIK}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const oyuncular = await this.prisma.oyuncu.findMany({
          where: { hesapDurumu: 'AKTIF' },
          orderBy: [
            { tamamlananOyunlar: 'desc' },
            { yapilanOneriler: 'desc' },
          ],
          take: limit,
          select: {
            id: true,
            kullaniciAdi: true,
            oynananOyunlar: true,
            tamamlananOyunlar: true,
            yapilanOneriler: true,
            verilenOylar: true,
            olusturuldu: true,
          },
        });

        return oyuncular.map((o, index) => ({
          sira: index + 1,
          id: o.id,
          kullaniciAdi: o.kullaniciAdi,
          oynananOyunlar: o.oynananOyunlar,
          tamamlananOyunlar: o.tamamlananOyunlar,
          yapilanOneriler: o.yapilanOneriler,
          verilenOylar: o.verilenOylar,
          kayitTarihi: o.olusturuldu,
        }));
      },
      CacheService.TTL.LONG,
    );
  }

  // Genel istatistikler (1 dakika cache)
  async genelIstatistiklerGetir() {
    return this.cache.getOrSet(
      CacheService.KEYS.GENEL_ISTATISTIK,
      async () => {
        const [
          toplamOyuncu,
          toplamTopluluk,
          tamamlananOyun,
          toplamOneri,
          toplamOy,
          toplamMesaj,
        ] = await Promise.all([
          this.prisma.oyuncu.count({ where: { hesapDurumu: 'AKTIF' } }),
          this.prisma.topluluk.count(),
          this.prisma.topluluk.count({ where: { durum: 'TAMAMLANDI' } }),
          this.prisma.oneri.count(),
          this.prisma.oy.count(),
          this.prisma.mesaj.count(),
        ]);

        // Son 7 gun aktivite
        const yediGunOnce = new Date();
        yediGunOnce.setDate(yediGunOnce.getDate() - 7);

        const sonYediGunOyunlar = await this.prisma.topluluk.count({
          where: {
            basladiAt: { gte: yediGunOnce },
          },
        });

        return {
          toplamOyuncu,
          toplamTopluluk,
          tamamlananOyun,
          toplamOneri,
          toplamOy,
          toplamMesaj,
          sonYediGunOyunlar,
        };
      },
      CacheService.TTL.MEDIUM,
    );
  }

  // Oyun sonuc dagilimi (5 dakika cache)
  async oyunSonucDagilimiGetir() {
    return this.cache.getOrSet(
      CacheService.KEYS.SONUC_DAGILIMI,
      async () => {
        const sonuclar = await this.prisma.oyunDurumu.groupBy({
          by: ['sonuc'],
          _count: true,
          where: {
            sonuc: { not: null },
          },
        });

        return sonuclar.map((s) => ({
          sonuc: s.sonuc,
          sayi: s._count,
        }));
      },
      CacheService.TTL.LONG,
    );
  }

  // Oyuncu arama
  async oyuncuAra(arama: string, limit: number = 10) {
    if (!arama || arama.length < 2) {
      return { oyuncular: [] };
    }

    const oyuncular = await this.prisma.oyuncu.findMany({
      where: {
        kullaniciAdi: {
          contains: arama,
          mode: 'insensitive',
        },
        hesapDurumu: 'AKTIF',
        botMu: false,
      },
      take: limit,
      select: {
        id: true,
        kullaniciAdi: true,
        toplamPuan: true,
        tamamlananOyunlar: true,
        olusturuldu: true,
      },
      orderBy: { toplamPuan: 'desc' },
    });

    return {
      oyuncular: oyuncular.map((o) => ({
        id: o.id,
        kullaniciAdi: o.kullaniciAdi,
        toplamPuan: o.toplamPuan,
        oyunSayisi: o.tamamlananOyunlar,
        kayitTarihi: o.olusturuldu,
      })),
    };
  }
}
