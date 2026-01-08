import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IzleyiciService {
  private readonly logger = new Logger(IzleyiciService.name);

  constructor(private prisma: PrismaService) {}

  // İzlemeye başla
  async izlemeyeBasla(oyuncuId: string, toplulukId: string) {
    // Topluluk var mı ve devam ediyor mu?
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    if (topluluk.durum !== 'DEVAM_EDIYOR') {
      throw new BadRequestException('Bu oyun izlenemiyor');
    }

    // Oyuncu bu oyunda oynuyor mu?
    const uyelik = await this.prisma.toplulukUyesi.findFirst({
      where: {
        oyuncuId,
        toplulukId,
        durum: 'AKTIF',
      },
    });

    if (uyelik) {
      throw new BadRequestException('Kendi oynadığınız oyunu izleyemezsiniz');
    }

    // Zaten izliyor mu?
    const mevcutIzleme = await this.prisma.izleyici.findUnique({
      where: {
        oyuncuId_toplulukId: { oyuncuId, toplulukId },
      },
    });

    if (mevcutIzleme && !mevcutIzleme.ayrildiAt) {
      return mevcutIzleme;
    }

    // İzleyici kaydı oluştur
    const izleyici = await this.prisma.izleyici.upsert({
      where: {
        oyuncuId_toplulukId: { oyuncuId, toplulukId },
      },
      update: {
        katildiAt: new Date(),
        ayrildiAt: null,
      },
      create: {
        oyuncuId,
        toplulukId,
      },
    });

    this.logger.log(`Oyuncu ${oyuncuId} topluluk ${toplulukId} izlemeye başladı`);
    return izleyici;
  }

  // İzlemeyi bırak
  async izlemeyiBirak(oyuncuId: string, toplulukId: string) {
    await this.prisma.izleyici.updateMany({
      where: {
        oyuncuId,
        toplulukId,
        ayrildiAt: null,
      },
      data: {
        ayrildiAt: new Date(),
      },
    });

    this.logger.log(`Oyuncu ${oyuncuId} topluluk ${toplulukId} izlemeyi bıraktı`);
  }

  // Bir topluluğun izleyicilerini getir
  async toplulukIzleyicileri(toplulukId: string) {
    const izleyiciler = await this.prisma.izleyici.findMany({
      where: {
        toplulukId,
        ayrildiAt: null,
      },
      include: {
        // Oyuncu bilgisi için eklenebilir
      },
    });

    return {
      izleyiciSayisi: izleyiciler.length,
      izleyiciler: izleyiciler.map((i) => ({ id: i.id, oyuncuId: i.oyuncuId })),
    };
  }

  // İzlenebilir oyunları getir
  async izlenebilirOyunlar() {
    const oyunlar = await this.prisma.topluluk.findMany({
      where: {
        durum: 'DEVAM_EDIYOR',
        gizliMi: false,
      },
      include: {
        uyeler: {
          where: { durum: 'AKTIF' },
          include: { oyuncu: { select: { kullaniciAdi: true } } },
        },
        oyunDurumu: true,
        _count: {
          select: {
            izleyiciler: {
              where: { ayrildiAt: null },
            },
          },
        },
      },
      orderBy: { basladiAt: 'desc' },
    });

    return oyunlar.map((o) => ({
      id: o.id,
      isim: o.isim,
      oyunModu: o.oyunModu,
      mevcutTur: o.oyunDurumu?.mevcutTur || 1,
      toplamTur: o.toplamTurSayisi,
      oyuncuSayisi: o.uyeler.length,
      izleyiciSayisi: (o._count as any).izleyiciler || 0,
      basladiAt: o.basladiAt,
    }));
  }
}
