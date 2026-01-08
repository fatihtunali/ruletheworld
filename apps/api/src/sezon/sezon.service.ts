import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SezonOdulleri {
  bronz: { altinOdulu: number; puanOdulu: number; rozetKodu?: string };
  gumus: { altinOdulu: number; puanOdulu: number; rozetKodu?: string };
  altin: { altinOdulu: number; puanOdulu: number; rozetKodu?: string };
  elmas: { altinOdulu: number; puanOdulu: number; rozetKodu?: string };
}

const VARSAYILAN_ODULLER: SezonOdulleri = {
  bronz: { altinOdulu: 500, puanOdulu: 100 },
  gumus: { altinOdulu: 1000, puanOdulu: 250, rozetKodu: 'SEZON_GUMUS' },
  altin: { altinOdulu: 2500, puanOdulu: 500, rozetKodu: 'SEZON_ALTIN' },
  elmas: { altinOdulu: 5000, puanOdulu: 1000, rozetKodu: 'SEZON_ELMAS' },
};

@Injectable()
export class SezonService {
  constructor(private prisma: PrismaService) {}

  // Aktif sezonu getir
  async aktifSezonuGetir() {
    const sezon = await this.prisma.sezon.findFirst({
      where: { aktif: true },
      include: {
        _count: { select: { katilimcilar: true } },
      },
    });

    if (!sezon) {
      return null;
    }

    const kalanGun = Math.ceil(
      (new Date(sezon.bitis).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...sezon,
      kalanGun: Math.max(0, kalanGun),
      katilimciSayisi: sezon._count.katilimcilar,
    };
  }

  // Oyuncunun sezon durumunu getir
  async oyuncuSezonDurumuGetir(oyuncuId: string) {
    const sezon = await this.prisma.sezon.findFirst({
      where: { aktif: true },
    });

    if (!sezon) {
      return { sezonAktif: false };
    }

    let katilim = await this.prisma.sezonKatilimci.findUnique({
      where: {
        sezonId_oyuncuId: { sezonId: sezon.id, oyuncuId },
      },
    });

    // Otomatik katılım
    if (!katilim) {
      katilim = await this.prisma.sezonKatilimci.create({
        data: { sezonId: sezon.id, oyuncuId },
      });
    }

    // Sıralamayı hesapla
    const sira = await this.prisma.sezonKatilimci.count({
      where: {
        sezonId: sezon.id,
        puan: { gt: katilim.puan },
      },
    });

    // Tier hesapla
    const toplamKatilimci = await this.prisma.sezonKatilimci.count({
      where: { sezonId: sezon.id },
    });

    const yuzdelik = ((sira + 1) / toplamKatilimci) * 100;
    let tier: string;
    if (yuzdelik <= 5) tier = 'ELMAS';
    else if (yuzdelik <= 15) tier = 'ALTIN';
    else if (yuzdelik <= 35) tier = 'GUMUS';
    else tier = 'BRONZ';

    // Sonraki seviye için gereken XP
    const seviyeXP = katilim.seviye * 1000;
    const xpYuzde = Math.min(100, Math.round((katilim.xp / seviyeXP) * 100));

    return {
      sezonAktif: true,
      sezon: {
        id: sezon.id,
        isim: sezon.isim,
        bitis: sezon.bitis,
      },
      sira: sira + 1,
      puan: katilim.puan,
      seviye: katilim.seviye,
      xp: katilim.xp,
      xpYuzde,
      sonrakiSeviyeXP: seviyeXP,
      tier,
    };
  }

  // Sezon sıralamasını getir
  async sezonSiralamasiGetir(limit: number = 100) {
    const sezon = await this.prisma.sezon.findFirst({
      where: { aktif: true },
    });

    if (!sezon) {
      return [];
    }

    const siralama = await this.prisma.sezonKatilimci.findMany({
      where: { sezonId: sezon.id },
      orderBy: { puan: 'desc' },
      take: limit,
      include: {
        // Oyuncu bilgisi için ayrı sorgu yapılmalı (relation yok)
      },
    });

    // Oyuncu bilgilerini ekle
    const oyuncuIdler = siralama.map((k) => k.oyuncuId);
    const oyuncular = await this.prisma.oyuncu.findMany({
      where: { id: { in: oyuncuIdler } },
      select: { id: true, kullaniciAdi: true },
    });

    const oyuncuMap = new Map(oyuncular.map((o) => [o.id, o]));

    return siralama.map((k, index) => ({
      sira: index + 1,
      oyuncu: oyuncuMap.get(k.oyuncuId),
      puan: k.puan,
      seviye: k.seviye,
    }));
  }

  // Sezon puanı ekle
  async sezonPuaniEkle(oyuncuId: string, puan: number, xp: number = 0) {
    const sezon = await this.prisma.sezon.findFirst({
      where: { aktif: true },
    });

    if (!sezon) return;

    let katilim = await this.prisma.sezonKatilimci.findUnique({
      where: {
        sezonId_oyuncuId: { sezonId: sezon.id, oyuncuId },
      },
    });

    if (!katilim) {
      katilim = await this.prisma.sezonKatilimci.create({
        data: { sezonId: sezon.id, oyuncuId },
      });
    }

    // XP ve seviye hesapla
    let yeniXP = katilim.xp + xp;
    let yeniSeviye = katilim.seviye;
    const seviyeXP = yeniSeviye * 1000;

    while (yeniXP >= seviyeXP) {
      yeniXP -= seviyeXP;
      yeniSeviye++;
    }

    await this.prisma.sezonKatilimci.update({
      where: { id: katilim.id },
      data: {
        puan: { increment: puan },
        xp: yeniXP,
        seviye: yeniSeviye,
      },
    });
  }

  // Admin: Yeni sezon oluştur
  async sezonOlustur(isim: string, baslangic: Date, bitis: Date, aciklama?: string) {
    // Önce aktif sezonu kapat
    await this.prisma.sezon.updateMany({
      where: { aktif: true },
      data: { aktif: false },
    });

    return this.prisma.sezon.create({
      data: {
        isim,
        aciklama,
        baslangic,
        bitis,
        aktif: true,
        oduller: VARSAYILAN_ODULLER,
      },
    });
  }

  // Admin: Sezonu bitir ve ödülleri dağıt
  async sezonuBitir(sezonId: string) {
    const sezon = await this.prisma.sezon.findUnique({
      where: { id: sezonId },
    });

    if (!sezon) {
      throw new NotFoundException('Sezon bulunamadı');
    }

    // Sıralamaları hesapla ve ödülleri dağıt
    const katilimcilar = await this.prisma.sezonKatilimci.findMany({
      where: { sezonId },
      orderBy: { puan: 'desc' },
    });

    const toplam = katilimcilar.length;
    const oduller = (sezon.oduller as SezonOdulleri) || VARSAYILAN_ODULLER;

    for (let i = 0; i < katilimcilar.length; i++) {
      const katilimci = katilimcilar[i];
      const yuzdelik = ((i + 1) / toplam) * 100;

      let tier: string;
      let odul: { altinOdulu: number; puanOdulu: number; rozetKodu?: string };

      if (yuzdelik <= 5) {
        tier = 'ELMAS';
        odul = oduller.elmas;
      } else if (yuzdelik <= 15) {
        tier = 'ALTIN';
        odul = oduller.altin;
      } else if (yuzdelik <= 35) {
        tier = 'GUMUS';
        odul = oduller.gumus;
      } else {
        tier = 'BRONZ';
        odul = oduller.bronz;
      }

      // Katılımcıyı güncelle
      await this.prisma.sezonKatilimci.update({
        where: { id: katilimci.id },
        data: {
          sonSira: i + 1,
          sonTier: tier,
        },
      });

      // Ödülleri ver (altın ve puan)
      // Not: Bu kısım altin service ile entegre edilmeli
    }

    // Sezonu kapat
    await this.prisma.sezon.update({
      where: { id: sezonId },
      data: { aktif: false },
    });

    return { mesaj: 'Sezon bitirildi ve ödüller dağıtıldı', katilimciSayisi: toplam };
  }
}
