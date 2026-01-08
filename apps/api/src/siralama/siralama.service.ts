import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SiralamaGirisi {
  sira: number;
  oyuncu: {
    id: string;
    kullaniciAdi: string;
  };
  puan: number;
  oynananOyun: number;
  tamamlananOyun: number;
}

@Injectable()
export class SiralamaService {
  constructor(private prisma: PrismaService) {}

  // Genel sıralama (tüm zamanlar)
  async genelSiralama(limit = 100, offset = 0): Promise<SiralamaGirisi[]> {
    const oyuncular = await this.prisma.oyuncu.findMany({
      where: { hesapDurumu: 'AKTIF' },
      orderBy: { toplamPuan: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        kullaniciAdi: true,
        toplamPuan: true,
        oynananOyunlar: true,
        tamamlananOyunlar: true,
      },
    });

    return oyuncular.map((o, index) => ({
      sira: offset + index + 1,
      oyuncu: {
        id: o.id,
        kullaniciAdi: o.kullaniciAdi,
      },
      puan: o.toplamPuan,
      oynananOyun: o.oynananOyunlar,
      tamamlananOyun: o.tamamlananOyunlar,
    }));
  }

  // Haftalık sıralama
  async haftalikSiralama(limit = 100, offset = 0): Promise<SiralamaGirisi[]> {
    const oyuncular = await this.prisma.oyuncu.findMany({
      where: {
        hesapDurumu: 'AKTIF',
        haftalikPuan: { gt: 0 },
      },
      orderBy: { haftalikPuan: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        kullaniciAdi: true,
        haftalikPuan: true,
        oynananOyunlar: true,
        tamamlananOyunlar: true,
      },
    });

    return oyuncular.map((o, index) => ({
      sira: offset + index + 1,
      oyuncu: {
        id: o.id,
        kullaniciAdi: o.kullaniciAdi,
      },
      puan: o.haftalikPuan,
      oynananOyun: o.oynananOyunlar,
      tamamlananOyun: o.tamamlananOyunlar,
    }));
  }

  // Sezon sıralaması
  async sezonSiralama(limit = 100, offset = 0): Promise<SiralamaGirisi[]> {
    const oyuncular = await this.prisma.oyuncu.findMany({
      where: {
        hesapDurumu: 'AKTIF',
        sezonPuani: { gt: 0 },
      },
      orderBy: { sezonPuani: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        kullaniciAdi: true,
        sezonPuani: true,
        oynananOyunlar: true,
        tamamlananOyunlar: true,
      },
    });

    return oyuncular.map((o, index) => ({
      sira: offset + index + 1,
      oyuncu: {
        id: o.id,
        kullaniciAdi: o.kullaniciAdi,
      },
      puan: o.sezonPuani,
      oynananOyun: o.oynananOyunlar,
      tamamlananOyun: o.tamamlananOyunlar,
    }));
  }

  // Arkadaşlar arasında sıralama
  async arkadasSiralama(oyuncuId: string): Promise<SiralamaGirisi[]> {
    // Önce arkadaşları bul
    const arkadasliklar = await this.prisma.arkadaslik.findMany({
      where: {
        OR: [
          { gonderenId: oyuncuId, durum: 'KABUL_EDILDI' },
          { alanId: oyuncuId, durum: 'KABUL_EDILDI' },
        ],
      },
      select: {
        gonderenId: true,
        alanId: true,
      },
    });

    const arkadasIdleri = arkadasliklar.map((a) =>
      a.gonderenId === oyuncuId ? a.alanId : a.gonderenId,
    );

    // Kendini de ekle
    arkadasIdleri.push(oyuncuId);

    const oyuncular = await this.prisma.oyuncu.findMany({
      where: {
        id: { in: arkadasIdleri },
        hesapDurumu: 'AKTIF',
      },
      orderBy: { toplamPuan: 'desc' },
      select: {
        id: true,
        kullaniciAdi: true,
        toplamPuan: true,
        oynananOyunlar: true,
        tamamlananOyunlar: true,
      },
    });

    return oyuncular.map((o, index) => ({
      sira: index + 1,
      oyuncu: {
        id: o.id,
        kullaniciAdi: o.kullaniciAdi,
      },
      puan: o.toplamPuan,
      oynananOyun: o.oynananOyunlar,
      tamamlananOyun: o.tamamlananOyunlar,
    }));
  }

  // Kullanıcının sıralamasını getir
  async kullaniciSiralama(oyuncuId: string) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
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

    if (!oyuncu) {
      return null;
    }

    // Genel sıra
    const genelSira = await this.prisma.oyuncu.count({
      where: {
        hesapDurumu: 'AKTIF',
        toplamPuan: { gt: oyuncu.toplamPuan },
      },
    });

    // Haftalık sıra
    const haftalikSira = await this.prisma.oyuncu.count({
      where: {
        hesapDurumu: 'AKTIF',
        haftalikPuan: { gt: oyuncu.haftalikPuan },
      },
    });

    // Sezon sırası
    const sezonSira = await this.prisma.oyuncu.count({
      where: {
        hesapDurumu: 'AKTIF',
        sezonPuani: { gt: oyuncu.sezonPuani },
      },
    });

    // Toplam oyuncu sayısı
    const toplamOyuncu = await this.prisma.oyuncu.count({
      where: { hesapDurumu: 'AKTIF' },
    });

    return {
      oyuncu: {
        id: oyuncu.id,
        kullaniciAdi: oyuncu.kullaniciAdi,
      },
      puanlar: {
        toplam: oyuncu.toplamPuan,
        sezon: oyuncu.sezonPuani,
        haftalik: oyuncu.haftalikPuan,
      },
      siralar: {
        genel: genelSira + 1,
        haftalik: haftalikSira + 1,
        sezon: sezonSira + 1,
      },
      istatistikler: {
        oynananOyun: oyuncu.oynananOyunlar,
        tamamlananOyun: oyuncu.tamamlananOyunlar,
      },
      toplamOyuncu,
    };
  }

  // Puan ekle (oyun bittiğinde çağrılacak)
  async puanEkle(oyuncuId: string, puan: number) {
    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: {
        toplamPuan: { increment: puan },
        sezonPuani: { increment: puan },
        haftalikPuan: { increment: puan },
      },
    });
  }

  // Haftalık puanları sıfırla (her Pazartesi 00:00)
  @Cron(CronExpression.EVERY_WEEK)
  async haftalikPuanlariSifirla() {
    console.log('[Siralama] Haftalik puanlar sifirlaniyor...');
    await this.prisma.oyuncu.updateMany({
      data: { haftalikPuan: 0 },
    });
    console.log('[Siralama] Haftalik puanlar sifirlandi');
  }

  // Sezon puanlarını sıfırla (her 3 ayda bir)
  async sezonPuanlariSifirla() {
    console.log('[Siralama] Sezon puanlari sifirlaniyor...');
    await this.prisma.oyuncu.updateMany({
      data: { sezonPuani: 0 },
    });
    console.log('[Siralama] Sezon puanlari sifirlandi');
  }

  // En iyi oyuncular özeti (ana sayfa için)
  async enIyiOyuncular() {
    const [genelTop3, haftalikTop3, enAktif] = await Promise.all([
      this.genelSiralama(3),
      this.haftalikSiralama(3),
      this.prisma.oyuncu.findMany({
        where: { hesapDurumu: 'AKTIF' },
        orderBy: { oynananOyunlar: 'desc' },
        take: 3,
        select: {
          id: true,
          kullaniciAdi: true,
          oynananOyunlar: true,
        },
      }),
    ]);

    return {
      genelTop3,
      haftalikTop3,
      enAktif: enAktif.map((o, i) => ({
        sira: i + 1,
        oyuncu: { id: o.id, kullaniciAdi: o.kullaniciAdi },
        oynananOyun: o.oynananOyunlar,
      })),
    };
  }
}
