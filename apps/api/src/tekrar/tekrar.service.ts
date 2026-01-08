import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OlayTipi, Prisma } from '@prisma/client';

export interface OlayVerisi {
  id: string;
  tip: OlayTipi;
  turNumarasi?: number;
  veri: Record<string, unknown>;
  kaynaklar?: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  };
  zaman: string;
}

export interface OyunTekrari {
  toplulukId: string;
  toplulukIsmi: string;
  baslangic: string;
  bitis?: string;
  sonuc?: string;
  oyuncular: { id: string; kullaniciAdi: string }[];
  turSayisi: number;
  olaylar: OlayVerisi[];
}

@Injectable()
export class TekrarService {
  constructor(private prisma: PrismaService) {}

  // Olay kaydet
  async olayKaydet(
    toplulukId: string,
    tip: OlayTipi,
    veri: Record<string, unknown>,
    turId?: string,
    turNumarasi?: number,
    kaynaklar?: { hazine: number; refah: number; istikrar: number; altyapi: number },
  ): Promise<void> {
    await this.prisma.oyunOlayi.create({
      data: {
        toplulukId,
        turId,
        turNumarasi,
        tip,
        veri: veri as Prisma.InputJsonValue,
        hazine: kaynaklar?.hazine,
        refah: kaynaklar?.refah,
        istikrar: kaynaklar?.istikrar,
        altyapi: kaynaklar?.altyapi,
      },
    });
  }

  // Oyun tekrarını getir
  async tekrarGetir(toplulukId: string): Promise<OyunTekrari | null> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: {
          include: {
            oyuncu: {
              select: { id: true, kullaniciAdi: true },
            },
          },
        },
        oyunDurumu: true,
        turlar: {
          orderBy: { turNumarasi: 'asc' },
        },
        oyunOlaylari: {
          orderBy: { olusturuldu: 'asc' },
        },
      },
    });

    if (!topluluk) return null;

    return {
      toplulukId: topluluk.id,
      toplulukIsmi: topluluk.isim,
      baslangic: topluluk.basladiAt?.toISOString() || topluluk.olusturuldu.toISOString(),
      bitis: topluluk.bittiAt?.toISOString(),
      sonuc: topluluk.oyunDurumu?.sonuc || undefined,
      oyuncular: topluluk.uyeler.map((u) => ({
        id: u.oyuncu.id,
        kullaniciAdi: u.oyuncu.kullaniciAdi,
      })),
      turSayisi: topluluk.turlar.length,
      olaylar: topluluk.oyunOlaylari.map((o) => ({
        id: o.id,
        tip: o.tip,
        turNumarasi: o.turNumarasi || undefined,
        veri: o.veri as Record<string, unknown>,
        kaynaklar: o.hazine !== null
          ? {
              hazine: o.hazine!,
              refah: o.refah!,
              istikrar: o.istikrar!,
              altyapi: o.altyapi!,
            }
          : undefined,
        zaman: o.olusturuldu.toISOString(),
      })),
    };
  }

  // Tamamlanan oyunların listesi
  async tamamlananOyunlar(
    sayfa: number = 1,
    limit: number = 20,
  ): Promise<{ oyunlar: { id: string; isim: string; sonuc: string; tarih: string; oyuncuSayisi: number }[]; toplam: number }> {
    const skip = (sayfa - 1) * limit;

    const [oyunlar, toplam] = await Promise.all([
      this.prisma.topluluk.findMany({
        where: {
          durum: 'TAMAMLANDI',
        },
        include: {
          oyunDurumu: true,
          _count: { select: { uyeler: true } },
        },
        orderBy: { bittiAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.topluluk.count({
        where: { durum: 'TAMAMLANDI' },
      }),
    ]);

    return {
      oyunlar: oyunlar.map((o) => ({
        id: o.id,
        isim: o.isim,
        sonuc: o.oyunDurumu?.sonuc || 'BILINMIYOR',
        tarih: o.bittiAt?.toISOString() || o.guncellendi.toISOString(),
        oyuncuSayisi: o._count.uyeler,
      })),
      toplam,
    };
  }

  // Belirli bir turun olaylarını getir
  async turOlaylari(toplulukId: string, turNumarasi: number): Promise<OlayVerisi[]> {
    const olaylar = await this.prisma.oyunOlayi.findMany({
      where: {
        toplulukId,
        turNumarasi,
      },
      orderBy: { olusturuldu: 'asc' },
    });

    return olaylar.map((o) => ({
      id: o.id,
      tip: o.tip,
      turNumarasi: o.turNumarasi || undefined,
      veri: o.veri as Record<string, unknown>,
      kaynaklar: o.hazine !== null
        ? {
            hazine: o.hazine!,
            refah: o.refah!,
            istikrar: o.istikrar!,
            altyapi: o.altyapi!,
          }
        : undefined,
      zaman: o.olusturuldu.toISOString(),
    }));
  }

  // Özet istatistikler
  async oyunOzeti(toplulukId: string): Promise<{
    toplamOneri: number;
    toplamOy: number;
    toplamMesaj: number;
    enAktifOyuncu?: { kullaniciAdi: string; oneriSayisi: number };
  } | null> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        turlar: {
          include: {
            oneriler: {
              include: {
                onerici: { select: { kullaniciAdi: true } },
                _count: { select: { oylar: true } },
              },
            },
          },
        },
        _count: { select: { mesajlar: true } },
      },
    });

    if (!topluluk) return null;

    const oneriler = topluluk.turlar.flatMap((t) => t.oneriler);
    const toplamOneri = oneriler.length;
    const toplamOy = oneriler.reduce((acc, o) => acc + o._count.oylar, 0);

    // En aktif oyuncu
    const oyuncuOnerileri: Record<string, { kullaniciAdi: string; sayi: number }> = {};
    oneriler.forEach((o) => {
      const key = o.onerici.kullaniciAdi;
      if (!oyuncuOnerileri[key]) {
        oyuncuOnerileri[key] = { kullaniciAdi: key, sayi: 0 };
      }
      oyuncuOnerileri[key].sayi++;
    });

    const enAktif = Object.values(oyuncuOnerileri).sort((a, b) => b.sayi - a.sayi)[0];

    return {
      toplamOneri,
      toplamOy,
      toplamMesaj: topluluk._count.mesajlar,
      enAktifOyuncu: enAktif ? { kullaniciAdi: enAktif.kullaniciAdi, oneriSayisi: enAktif.sayi } : undefined,
    };
  }
}
