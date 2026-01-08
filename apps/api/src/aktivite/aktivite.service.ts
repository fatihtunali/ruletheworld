import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AktiviteTipi } from '@prisma/client';

@Injectable()
export class AktiviteService {
  private readonly logger = new Logger(AktiviteService.name);

  constructor(private prisma: PrismaService) {}

  // Aktivite ekle
  async aktiviteEkle(
    oyuncuId: string,
    tip: AktiviteTipi,
    baslik: string,
    detay?: Record<string, any>,
    referansId?: string,
    referansTip?: string,
  ) {
    const aktivite = await this.prisma.aktivite.create({
      data: {
        oyuncuId,
        tip,
        baslik,
        detay: detay || {},
        referansId,
        referansTip,
      },
    });

    this.logger.log(`Aktivite eklendi: ${tip} - ${oyuncuId}`);
    return aktivite;
  }

  // Oyuncunun aktivitelerini getir
  async oyuncuAktiviteleri(oyuncuId: string, sayfa = 1, limit = 20) {
    const skip = (sayfa - 1) * limit;

    const [aktiviteler, toplam] = await Promise.all([
      this.prisma.aktivite.findMany({
        where: { oyuncuId },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aktivite.count({ where: { oyuncuId } }),
    ]);

    return {
      aktiviteler,
      toplam,
      sayfa,
      toplamSayfa: Math.ceil(toplam / limit),
    };
  }

  // Arkadaşların aktiviteleri (feed)
  async arkadasAktiviteleri(oyuncuId: string, sayfa = 1, limit = 20) {
    const skip = (sayfa - 1) * limit;

    // Arkadaşları bul
    const arkadasliklar = await this.prisma.arkadaslik.findMany({
      where: {
        OR: [
          { gonderenId: oyuncuId, durum: 'KABUL_EDILDI' },
          { alanId: oyuncuId, durum: 'KABUL_EDILDI' },
        ],
      },
    });

    const arkadasIdleri = arkadasliklar.map((a) =>
      a.gonderenId === oyuncuId ? a.alanId : a.gonderenId,
    );

    if (arkadasIdleri.length === 0) {
      return { aktiviteler: [], toplam: 0, sayfa, toplamSayfa: 0 };
    }

    const [aktiviteler, toplam] = await Promise.all([
      this.prisma.aktivite.findMany({
        where: {
          oyuncuId: { in: arkadasIdleri },
        },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aktivite.count({
        where: { oyuncuId: { in: arkadasIdleri } },
      }),
    ]);

    return {
      aktiviteler,
      toplam,
      sayfa,
      toplamSayfa: Math.ceil(toplam / limit),
    };
  }

  // Görülmemiş aktiviteleri işaretle
  async gorulduIsaretle(oyuncuId: string) {
    await this.prisma.aktivite.updateMany({
      where: {
        oyuncuId,
        goruldu: false,
      },
      data: {
        goruldu: true,
      },
    });
  }

  // Görülmemiş aktivite sayısı
  async gorulmemisAktiviteSayisi(oyuncuId: string) {
    return this.prisma.aktivite.count({
      where: {
        oyuncuId,
        goruldu: false,
      },
    });
  }

  // Global aktivite akışı (herkesin aktiviteleri)
  async globalAktiviteler(sayfa = 1, limit = 20) {
    const skip = (sayfa - 1) * limit;

    const [aktiviteler, toplam] = await Promise.all([
      this.prisma.aktivite.findMany({
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aktivite.count(),
    ]);

    return {
      aktiviteler,
      toplam,
      sayfa,
      toplamSayfa: Math.ceil(toplam / limit),
    };
  }
}
