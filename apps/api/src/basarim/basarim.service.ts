import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BildirimService } from '../bildirim/bildirim.service';
import { BasarimKategori, BasarimNadirlik, BildirimTipi } from '@prisma/client';

export interface BasarimVerisi {
  id: string;
  kod: string;
  isim: string;
  aciklama: string;
  ikon: string;
  kategori: BasarimKategori;
  nadirlik: BasarimNadirlik;
  kazanildiAt?: string;
  kazanildiMi: boolean;
}

export interface BasarimOzeti {
  toplam: number;
  kazanilan: number;
  yuzde: number;
  sonKazanilan?: BasarimVerisi;
}

// Varsayılan başarımlar
const VARSAYILAN_BASARIMLAR = [
  // OYUN kategorisi
  {
    kod: 'ILK_OYUN',
    isim: 'İlk Adım',
    aciklama: 'İlk oyununu tamamla',
    ikon: '🎮',
    kategori: BasarimKategori.OYUN,
    nadirlik: BasarimNadirlik.YAYGIN,
    kosulTipi: 'tamamlanan_oyun',
    kosulDeger: 1,
  },
  {
    kod: 'OYUN_5',
    isim: 'Deneyimli',
    aciklama: '5 oyun tamamla',
    ikon: '⭐',
    kategori: BasarimKategori.OYUN,
    nadirlik: BasarimNadirlik.YAYGIN,
    kosulTipi: 'tamamlanan_oyun',
    kosulDeger: 5,
  },
  {
    kod: 'OYUN_25',
    isim: 'Veteran',
    aciklama: '25 oyun tamamla',
    ikon: '🏅',
    kategori: BasarimKategori.OYUN,
    nadirlik: BasarimNadirlik.SEYREK,
    kosulTipi: 'tamamlanan_oyun',
    kosulDeger: 25,
  },
  {
    kod: 'OYUN_100',
    isim: 'Efsane Oyuncu',
    aciklama: '100 oyun tamamla',
    ikon: '👑',
    kategori: BasarimKategori.OYUN,
    nadirlik: BasarimNadirlik.NADIR,
    kosulTipi: 'tamamlanan_oyun',
    kosulDeger: 100,
  },

  // OYLAMA kategorisi
  {
    kod: 'ILK_OY',
    isim: 'Demokrat',
    aciklama: 'İlk oyunu kullan',
    ikon: '🗳️',
    kategori: BasarimKategori.OYLAMA,
    nadirlik: BasarimNadirlik.YAYGIN,
    kosulTipi: 'verilen_oy',
    kosulDeger: 1,
  },
  {
    kod: 'OY_50',
    isim: 'Aktif Vatandaş',
    aciklama: '50 oy kullan',
    ikon: '📊',
    kategori: BasarimKategori.OYLAMA,
    nadirlik: BasarimNadirlik.SEYREK,
    kosulTipi: 'verilen_oy',
    kosulDeger: 50,
  },
  {
    kod: 'OY_200',
    isim: 'Oy Ustası',
    aciklama: '200 oy kullan',
    ikon: '🎯',
    kategori: BasarimKategori.OYLAMA,
    nadirlik: BasarimNadirlik.NADIR,
    kosulTipi: 'verilen_oy',
    kosulDeger: 200,
  },

  // ONERI kategorisi
  {
    kod: 'ILK_ONERI',
    isim: 'Sesini Duyur',
    aciklama: 'İlk önerisini yap',
    ikon: '💡',
    kategori: BasarimKategori.ONERI,
    nadirlik: BasarimNadirlik.YAYGIN,
    kosulTipi: 'yapilan_oneri',
    kosulDeger: 1,
  },
  {
    kod: 'ONERI_10',
    isim: 'Fikir Fabrikası',
    aciklama: '10 öneri yap',
    ikon: '🏭',
    kategori: BasarimKategori.ONERI,
    nadirlik: BasarimNadirlik.SEYREK,
    kosulTipi: 'yapilan_oneri',
    kosulDeger: 10,
  },
  {
    kod: 'ONERI_50',
    isim: 'Vizyoner',
    aciklama: '50 öneri yap',
    ikon: '🔮',
    kategori: BasarimKategori.ONERI,
    nadirlik: BasarimNadirlik.NADIR,
    kosulTipi: 'yapilan_oneri',
    kosulDeger: 50,
  },

  // LIDERLIK kategorisi
  {
    kod: 'KURUCU',
    isim: 'Kurucu',
    aciklama: 'Bir topluluk kur',
    ikon: '🏛️',
    kategori: BasarimKategori.LIDERLIK,
    nadirlik: BasarimNadirlik.YAYGIN,
    kosulTipi: 'kurulan_topluluk',
    kosulDeger: 1,
  },
  {
    kod: 'LIDER_5',
    isim: 'Deneyimli Lider',
    aciklama: '5 topluluk kur',
    ikon: '🎖️',
    kategori: BasarimKategori.LIDERLIK,
    nadirlik: BasarimNadirlik.SEYREK,
    kosulTipi: 'kurulan_topluluk',
    kosulDeger: 5,
  },

  // OZEL kategorisi
  {
    kod: 'ERKEN_KATILIMCI',
    isim: 'Erken Kuş',
    aciklama: 'Beta döneminde katıl',
    ikon: '🐦',
    kategori: BasarimKategori.OZEL,
    nadirlik: BasarimNadirlik.EFSANEVI,
    kosulTipi: 'ozel',
    kosulDeger: 1,
    gizliMi: false,
  },
  {
    kod: 'MUKEMMEL_SONUC',
    isim: 'Mükemmeliyetçi',
    aciklama: 'Bir oyunu "Parladı" sonucu ile bitir',
    ikon: '✨',
    kategori: BasarimKategori.OZEL,
    nadirlik: BasarimNadirlik.NADIR,
    kosulTipi: 'oyun_sonucu_parladi',
    kosulDeger: 1,
  },
];

@Injectable()
export class BasarimService {
  constructor(
    private prisma: PrismaService,
    private bildirimService: BildirimService,
  ) {}

  // Varsayılan başarımları seed et
  async basarimlariSeedle(): Promise<number> {
    let eklenen = 0;

    for (const basarim of VARSAYILAN_BASARIMLAR) {
      const mevcut = await this.prisma.basarim.findUnique({
        where: { kod: basarim.kod },
      });

      if (!mevcut) {
        await this.prisma.basarim.create({
          data: {
            kod: basarim.kod,
            isim: basarim.isim,
            aciklama: basarim.aciklama,
            ikon: basarim.ikon,
            kategori: basarim.kategori,
            nadirlik: basarim.nadirlik,
            kosulTipi: basarim.kosulTipi,
            kosulDeger: basarim.kosulDeger,
            gizliMi: (basarim as any).gizliMi ?? false,
          },
        });
        eklenen++;
      }
    }

    return eklenen;
  }

  // Tüm başarımları getir
  async tumBasarimlar(oyuncuId?: string): Promise<BasarimVerisi[]> {
    const basarimlar = await this.prisma.basarim.findMany({
      where: { aktifMi: true },
      orderBy: [{ kategori: 'asc' }, { kosulDeger: 'asc' }],
    });

    let kazanilanlar: Set<string> = new Set();
    let kazanilmaTarihleri: Map<string, Date> = new Map();

    if (oyuncuId) {
      const oyuncuBasarimlari = await this.prisma.kazanilanBasarim.findMany({
        where: { oyuncuId },
      });
      kazanilanlar = new Set(oyuncuBasarimlari.map((kb) => kb.basarimId));
      oyuncuBasarimlari.forEach((kb) => {
        kazanilmaTarihleri.set(kb.basarimId, kb.kazanildiAt);
      });
    }

    return basarimlar.map((b) => ({
      id: b.id,
      kod: b.kod,
      isim: b.gizliMi && !kazanilanlar.has(b.id) ? '???' : b.isim,
      aciklama: b.gizliMi && !kazanilanlar.has(b.id) ? 'Gizli başarım' : b.aciklama,
      ikon: b.gizliMi && !kazanilanlar.has(b.id) ? '❓' : b.ikon,
      kategori: b.kategori,
      nadirlik: b.nadirlik,
      kazanildiMi: kazanilanlar.has(b.id),
      kazanildiAt: kazanilmaTarihleri.get(b.id)?.toISOString(),
    }));
  }

  // Oyuncunun başarım özetini getir
  async basarimOzeti(oyuncuId: string): Promise<BasarimOzeti> {
    const [toplamBasarim, kazanilanSayisi, sonKazanilan] = await Promise.all([
      this.prisma.basarim.count({ where: { aktifMi: true } }),
      this.prisma.kazanilanBasarim.count({ where: { oyuncuId } }),
      this.prisma.kazanilanBasarim.findFirst({
        where: { oyuncuId },
        orderBy: { kazanildiAt: 'desc' },
        include: { basarim: true },
      }),
    ]);

    const yuzde = toplamBasarim > 0 ? Math.round((kazanilanSayisi / toplamBasarim) * 100) : 0;

    return {
      toplam: toplamBasarim,
      kazanilan: kazanilanSayisi,
      yuzde,
      sonKazanilan: sonKazanilan
        ? {
            id: sonKazanilan.basarim.id,
            kod: sonKazanilan.basarim.kod,
            isim: sonKazanilan.basarim.isim,
            aciklama: sonKazanilan.basarim.aciklama,
            ikon: sonKazanilan.basarim.ikon,
            kategori: sonKazanilan.basarim.kategori,
            nadirlik: sonKazanilan.basarim.nadirlik,
            kazanildiMi: true,
            kazanildiAt: sonKazanilan.kazanildiAt.toISOString(),
          }
        : undefined,
    };
  }

  // Başarım kazandır
  async basarimKazandir(oyuncuId: string, basarimKodu: string): Promise<BasarimVerisi | null> {
    const basarim = await this.prisma.basarim.findUnique({
      where: { kod: basarimKodu },
    });

    if (!basarim || !basarim.aktifMi) return null;

    // Zaten kazanılmış mı kontrol et
    const mevcutKazanim = await this.prisma.kazanilanBasarim.findUnique({
      where: {
        oyuncuId_basarimId: {
          oyuncuId,
          basarimId: basarim.id,
        },
      },
    });

    if (mevcutKazanim) return null;

    // Başarımı kazandır
    const kazanilanBasarim = await this.prisma.kazanilanBasarim.create({
      data: {
        oyuncuId,
        basarimId: basarim.id,
      },
    });

    // Bildirim gönder
    await this.bildirimService.bildirimOlustur(
      oyuncuId,
      BildirimTipi.BASARIM_KAZANILDI,
      `${basarim.ikon} Yeni Başarım!`,
      `"${basarim.isim}" başarımını kazandınız: ${basarim.aciklama}`,
      '/profil?tab=basarimlar',
    );

    return {
      id: basarim.id,
      kod: basarim.kod,
      isim: basarim.isim,
      aciklama: basarim.aciklama,
      ikon: basarim.ikon,
      kategori: basarim.kategori,
      nadirlik: basarim.nadirlik,
      kazanildiMi: true,
      kazanildiAt: kazanilanBasarim.kazanildiAt.toISOString(),
    };
  }

  // Oyuncu istatistiklerine göre başarım kontrolü
  async basarimKontrol(oyuncuId: string): Promise<BasarimVerisi[]> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: {
        tamamlananOyunlar: true,
        verilenOylar: true,
        yapilanOneriler: true,
      },
    });

    if (!oyuncu) return [];

    // Kurulan topluluk sayısı
    const kurulanToplulukSayisi = await this.prisma.topluluk.count({
      where: { kurucuId: oyuncuId },
    });

    const kazanilanlar: BasarimVerisi[] = [];

    // Tüm aktif başarımları kontrol et
    const basarimlar = await this.prisma.basarim.findMany({
      where: { aktifMi: true },
    });

    for (const basarim of basarimlar) {
      let hedefDeger = 0;

      switch (basarim.kosulTipi) {
        case 'tamamlanan_oyun':
          hedefDeger = oyuncu.tamamlananOyunlar;
          break;
        case 'verilen_oy':
          hedefDeger = oyuncu.verilenOylar;
          break;
        case 'yapilan_oneri':
          hedefDeger = oyuncu.yapilanOneriler;
          break;
        case 'kurulan_topluluk':
          hedefDeger = kurulanToplulukSayisi;
          break;
        default:
          continue;
      }

      if (hedefDeger >= basarim.kosulDeger) {
        const kazanilan = await this.basarimKazandir(oyuncuId, basarim.kod);
        if (kazanilan) {
          kazanilanlar.push(kazanilan);
        }
      }
    }

    return kazanilanlar;
  }

  // Nadirlik istatistiklerini getir
  async nadirlikIstatistikleri(): Promise<{ kod: string; isim: string; kazananSayisi: number; yuzde: number }[]> {
    const toplamOyuncu = await this.prisma.oyuncu.count();

    const basarimlar = await this.prisma.basarim.findMany({
      where: { aktifMi: true },
      include: {
        _count: {
          select: { kazananlar: true },
        },
      },
    });

    return basarimlar.map((b) => ({
      kod: b.kod,
      isim: b.isim,
      kazananSayisi: b._count.kazananlar,
      yuzde: toplamOyuncu > 0 ? Math.round((b._count.kazananlar / toplamOyuncu) * 100) : 0,
    }));
  }
}
