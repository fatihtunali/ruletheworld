import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BildirimTipi } from '@prisma/client';

export interface BildirimVerisi {
  id: string;
  tip: BildirimTipi;
  baslik: string;
  icerik: string;
  link?: string;
  okundu: boolean;
  olusturuldu: string;
}

@Injectable()
export class BildirimService {
  constructor(private prisma: PrismaService) {}

  // Bildirim oluştur
  async bildirimOlustur(
    oyuncuId: string,
    tip: BildirimTipi,
    baslik: string,
    icerik: string,
    link?: string,
  ): Promise<BildirimVerisi> {
    const bildirim = await this.prisma.bildirim.create({
      data: {
        oyuncuId,
        tip,
        baslik,
        icerik,
        link,
      },
    });

    return {
      id: bildirim.id,
      tip: bildirim.tip,
      baslik: bildirim.baslik,
      icerik: bildirim.icerik,
      link: bildirim.link || undefined,
      okundu: bildirim.okundu,
      olusturuldu: bildirim.olusturuldu.toISOString(),
    };
  }

  // Toplu bildirim oluştur (birden fazla oyuncuya)
  async topluBildirimOlustur(
    oyuncuIdleri: string[],
    tip: BildirimTipi,
    baslik: string,
    icerik: string,
    link?: string,
  ): Promise<void> {
    await this.prisma.bildirim.createMany({
      data: oyuncuIdleri.map((oyuncuId) => ({
        oyuncuId,
        tip,
        baslik,
        icerik,
        link,
      })),
    });
  }

  // Oyuncunun bildirimlerini getir
  async bildirimleriGetir(
    oyuncuId: string,
    sayfa: number = 1,
    limit: number = 20,
  ): Promise<{ bildirimler: BildirimVerisi[]; okunmamisSayisi: number; toplam: number }> {
    const skip = (sayfa - 1) * limit;

    const [bildirimler, toplam, okunmamisSayisi] = await Promise.all([
      this.prisma.bildirim.findMany({
        where: { oyuncuId },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bildirim.count({ where: { oyuncuId } }),
      this.prisma.bildirim.count({ where: { oyuncuId, okundu: false } }),
    ]);

    return {
      bildirimler: bildirimler.map((b) => ({
        id: b.id,
        tip: b.tip,
        baslik: b.baslik,
        icerik: b.icerik,
        link: b.link || undefined,
        okundu: b.okundu,
        olusturuldu: b.olusturuldu.toISOString(),
      })),
      okunmamisSayisi,
      toplam,
    };
  }

  // Bildirimi okundu olarak işaretle
  async okunduIsaretle(oyuncuId: string, bildirimId: string): Promise<boolean> {
    const bildirim = await this.prisma.bildirim.findFirst({
      where: { id: bildirimId, oyuncuId },
    });

    if (!bildirim) return false;

    await this.prisma.bildirim.update({
      where: { id: bildirimId },
      data: { okundu: true },
    });

    return true;
  }

  // Tüm bildirimleri okundu olarak işaretle
  async tumunuOkunduIsaretle(oyuncuId: string): Promise<number> {
    const result = await this.prisma.bildirim.updateMany({
      where: { oyuncuId, okundu: false },
      data: { okundu: true },
    });

    return result.count;
  }

  // Eski bildirimleri sil (30 günden eski)
  async eskiBildirimleriSil(): Promise<number> {
    const otuzGunOnce = new Date();
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

    const result = await this.prisma.bildirim.deleteMany({
      where: {
        olusturuldu: { lt: otuzGunOnce },
        okundu: true,
      },
    });

    return result.count;
  }

  // Okunmamış bildirim sayısını getir
  async okunmamisSayisiGetir(oyuncuId: string): Promise<number> {
    return this.prisma.bildirim.count({
      where: { oyuncuId, okundu: false },
    });
  }
}
