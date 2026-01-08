import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AltinIslemTipi } from '@prisma/client';

@Injectable()
export class AltinService {
  constructor(private prisma: PrismaService) {}

  // Cüzdan oluştur veya getir
  async cuzdanGetirVeyaOlustur(oyuncuId: string) {
    return this.prisma.altinCuzdani.upsert({
      where: { oyuncuId },
      update: {},
      create: { oyuncuId, bakiye: 0 },
    });
  }

  // Bakiye getir
  async bakiyeGetir(oyuncuId: string) {
    const cuzdan = await this.cuzdanGetirVeyaOlustur(oyuncuId);
    return {
      bakiye: cuzdan.bakiye,
      toplamKazanilan: cuzdan.toplamKazanilan,
      toplamHarcanan: cuzdan.toplamHarcanan,
    };
  }

  // Altın ekle
  async altinEkle(
    oyuncuId: string,
    miktar: number,
    tip: AltinIslemTipi,
    aciklama?: string,
    referansId?: string,
  ) {
    const cuzdan = await this.cuzdanGetirVeyaOlustur(oyuncuId);

    const [guncelCuzdan, islem] = await this.prisma.$transaction([
      this.prisma.altinCuzdani.update({
        where: { id: cuzdan.id },
        data: {
          bakiye: { increment: miktar },
          toplamKazanilan: { increment: miktar },
        },
      }),
      this.prisma.altinIslem.create({
        data: {
          cuzdanId: cuzdan.id,
          miktar,
          tip,
          aciklama,
          referansId,
        },
      }),
    ]);

    return {
      yeniBakiye: guncelCuzdan.bakiye,
      islem,
    };
  }

  // Altın harca
  async altinHarca(
    oyuncuId: string,
    miktar: number,
    aciklama?: string,
    referansId?: string,
  ) {
    const cuzdan = await this.cuzdanGetirVeyaOlustur(oyuncuId);

    if (cuzdan.bakiye < miktar) {
      throw new BadRequestException('Yetersiz altın bakiyesi');
    }

    const [guncelCuzdan, islem] = await this.prisma.$transaction([
      this.prisma.altinCuzdani.update({
        where: { id: cuzdan.id },
        data: {
          bakiye: { decrement: miktar },
          toplamHarcanan: { increment: miktar },
        },
      }),
      this.prisma.altinIslem.create({
        data: {
          cuzdanId: cuzdan.id,
          miktar: -miktar,
          tip: AltinIslemTipi.HARCAMA,
          aciklama,
          referansId,
        },
      }),
    ]);

    return {
      yeniBakiye: guncelCuzdan.bakiye,
      islem,
    };
  }

  // Günlük bonus ver
  async gunlukBonusAl(oyuncuId: string) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    // Bugün bonus alınmış mı kontrol et
    const mevcutIslem = await this.prisma.altinIslem.findFirst({
      where: {
        cuzdan: { oyuncuId },
        tip: AltinIslemTipi.GUNLUK_BONUS,
        olusturuldu: { gte: bugun },
      },
    });

    if (mevcutIslem) {
      throw new BadRequestException('Günlük bonus zaten alındı');
    }

    // Premium kontrolü - premium kullanıcılara daha fazla bonus
    const premium = await this.prisma.premiumUyelik.findFirst({
      where: {
        oyuncuId,
        aktif: true,
        bitis: { gte: new Date() },
      },
    });

    let bonusMiktar = 100; // Varsayılan bonus
    if (premium) {
      switch (premium.tip) {
        case 'VIP':
          bonusMiktar = 150;
          break;
        case 'GOLD':
          bonusMiktar = 200;
          break;
        case 'DIAMOND':
        case 'LIFETIME':
          bonusMiktar = 300;
          break;
      }
    }

    return this.altinEkle(
      oyuncuId,
      bonusMiktar,
      AltinIslemTipi.GUNLUK_BONUS,
      'Günlük giriş bonusu',
    );
  }

  // İşlem geçmişi
  async islemGecmisiGetir(oyuncuId: string, limit: number = 20) {
    const cuzdan = await this.cuzdanGetirVeyaOlustur(oyuncuId);

    return this.prisma.altinIslem.findMany({
      where: { cuzdanId: cuzdan.id },
      orderBy: { olusturuldu: 'desc' },
      take: limit,
    });
  }

  // Hediye gönder
  async hediyeGonder(
    gonderenId: string,
    alanKullaniciAdi: string,
    miktar: number,
    mesaj?: string,
  ) {
    if (miktar < 10) {
      throw new BadRequestException('Minimum hediye miktarı 10 altın');
    }

    const alan = await this.prisma.oyuncu.findUnique({
      where: { kullaniciAdi: alanKullaniciAdi },
    });

    if (!alan) {
      throw new NotFoundException('Alıcı bulunamadı');
    }

    if (alan.id === gonderenId) {
      throw new BadRequestException('Kendinize hediye gönderemezsiniz');
    }

    // Gönderenin bakiyesi yeterli mi?
    const gonderenCuzdan = await this.cuzdanGetirVeyaOlustur(gonderenId);
    if (gonderenCuzdan.bakiye < miktar) {
      throw new BadRequestException('Yetersiz bakiye');
    }

    // Transfer yap
    await this.prisma.$transaction(async (tx) => {
      // Gönderenden düş
      await tx.altinCuzdani.update({
        where: { id: gonderenCuzdan.id },
        data: {
          bakiye: { decrement: miktar },
          toplamHarcanan: { increment: miktar },
        },
      });

      await tx.altinIslem.create({
        data: {
          cuzdanId: gonderenCuzdan.id,
          miktar: -miktar,
          tip: AltinIslemTipi.HEDIYE_GONDERILDI,
          aciklama: `${alan.kullaniciAdi} kullanıcısına hediye`,
          referansId: alan.id,
        },
      });

      // Alana ekle
      const alanCuzdan = await tx.altinCuzdani.upsert({
        where: { oyuncuId: alan.id },
        update: {
          bakiye: { increment: miktar },
          toplamKazanilan: { increment: miktar },
        },
        create: {
          oyuncuId: alan.id,
          bakiye: miktar,
          toplamKazanilan: miktar,
        },
      });

      await tx.altinIslem.create({
        data: {
          cuzdanId: alanCuzdan.id,
          miktar,
          tip: AltinIslemTipi.HEDIYE_ALINDI,
          aciklama: mesaj || 'Hediye altın',
          referansId: gonderenId,
        },
      });

      // Hediye kaydı oluştur
      await tx.hediye.create({
        data: {
          gonderenId,
          alanId: alan.id,
          tip: 'ALTIN',
          deger: miktar,
          mesaj,
          kabulEdildi: true,
          kabulTarihi: new Date(),
        },
      });
    });

    return { mesaj: `${miktar} altın ${alan.kullaniciAdi} kullanıcısına gönderildi` };
  }
}
