import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PremiumTip } from '@prisma/client';

// Premium avantajları
export interface PremiumAvantajlari {
  puanCarpani: number;
  rozet: string;
  oncelikliEslestirme: boolean;
  oncelikSirasi: number; // 1=en yüksek
  reklamsiz: boolean;
  ozelOyunModlari: boolean;
  detayliIstatistik: boolean;
  ozelAvatarCerceleri: boolean;
  betaErisim: boolean;
  destekciRozeti: boolean;
}

const PREMIUM_AVANTAJLARI: Record<PremiumTip, PremiumAvantajlari> = {
  VIP: {
    puanCarpani: 1.2,
    rozet: 'VIP',
    oncelikliEslestirme: true,
    oncelikSirasi: 3,
    reklamsiz: true,
    ozelOyunModlari: false,
    detayliIstatistik: false,
    ozelAvatarCerceleri: false,
    betaErisim: false,
    destekciRozeti: false,
  },
  GOLD: {
    puanCarpani: 1.5,
    rozet: 'GOLD',
    oncelikliEslestirme: true,
    oncelikSirasi: 2,
    reklamsiz: true,
    ozelOyunModlari: true,
    detayliIstatistik: true,
    ozelAvatarCerceleri: false,
    betaErisim: false,
    destekciRozeti: false,
  },
  DIAMOND: {
    puanCarpani: 2.0,
    rozet: 'DIAMOND',
    oncelikliEslestirme: true,
    oncelikSirasi: 1,
    reklamsiz: true,
    ozelOyunModlari: true,
    detayliIstatistik: true,
    ozelAvatarCerceleri: true,
    betaErisim: true,
    destekciRozeti: false,
  },
  LIFETIME: {
    puanCarpani: 2.0,
    rozet: 'LIFETIME',
    oncelikliEslestirme: true,
    oncelikSirasi: 1,
    reklamsiz: true,
    ozelOyunModlari: true,
    detayliIstatistik: true,
    ozelAvatarCerceleri: true,
    betaErisim: true,
    destekciRozeti: true,
  },
};

// Fiyatlandırma (TL)
const PREMIUM_FIYATLARI: Record<PremiumTip, number> = {
  VIP: 49.99,       // 1 ay
  GOLD: 119.99,     // 3 ay
  DIAMOND: 399.99,  // 1 yıl
  LIFETIME: 999.99, // Ömür boyu
};

// Süre (saat cinsinden)
const PREMIUM_SURELERI: Record<PremiumTip, number> = {
  VIP: 30 * 24,       // 30 gün
  GOLD: 90 * 24,      // 90 gün
  DIAMOND: 365 * 24,  // 365 gün
  LIFETIME: 0,        // Sınırsız
};

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  // Kullanıcının aktif premium üyeliğini getir
  async aktifUyelikGetir(oyuncuId: string) {
    const simdi = new Date();

    const uyelik = await this.prisma.premiumUyelik.findFirst({
      where: {
        oyuncuId,
        aktif: true,
        iptalEdildi: false,
        OR: [
          { tip: PremiumTip.LIFETIME },
          { bitis: { gte: simdi } },
        ],
      },
      orderBy: { olusturuldu: 'desc' },
    });

    if (!uyelik) {
      return null;
    }

    return {
      ...uyelik,
      avantajlar: PREMIUM_AVANTAJLARI[uyelik.tip],
    };
  }

  // Premium durumu kontrolü
  async premiumMu(oyuncuId: string): Promise<boolean> {
    const uyelik = await this.aktifUyelikGetir(oyuncuId);
    return uyelik !== null;
  }

  // Avantajları getir (premium değilse varsayılan)
  async avantajlariGetir(oyuncuId: string): Promise<PremiumAvantajlari | null> {
    const uyelik = await this.aktifUyelikGetir(oyuncuId);
    return uyelik?.avantajlar || null;
  }

  // Puan çarpanı getir
  async puanCarpaniGetir(oyuncuId: string): Promise<number> {
    const avantajlar = await this.avantajlariGetir(oyuncuId);
    return avantajlar?.puanCarpani || 1.0;
  }

  // Tüm paketleri listele
  paketleriGetir() {
    return Object.entries(PREMIUM_FIYATLARI).map(([tip, fiyat]) => ({
      tip: tip as PremiumTip,
      fiyat,
      sureSaat: PREMIUM_SURELERI[tip as PremiumTip],
      avantajlar: PREMIUM_AVANTAJLARI[tip as PremiumTip],
    }));
  }

  // Premium satın al (ödeme işlemi simülasyonu)
  async premiumSatinAl(
    oyuncuId: string,
    tip: PremiumTip,
    odemeRefId?: string,
    odemeYontemi?: string,
  ) {
    const simdi = new Date();
    const sureSaat = PREMIUM_SURELERI[tip];
    const bitis = sureSaat === 0
      ? new Date(9999, 11, 31) // Lifetime için çok uzak bir tarih
      : new Date(simdi.getTime() + sureSaat * 60 * 60 * 1000);

    const uyelik = await this.prisma.premiumUyelik.create({
      data: {
        oyuncuId,
        tip,
        baslangic: simdi,
        bitis,
        odemeTutari: PREMIUM_FIYATLARI[tip],
        odemeYontemi: odemeYontemi || 'test',
        odemeRefId: odemeRefId || `TEST-${Date.now()}`,
      },
    });

    return {
      uyelik,
      avantajlar: PREMIUM_AVANTAJLARI[tip],
      mesaj: `${tip} premium üyeliğiniz aktif edildi!`,
    };
  }

  // Promosyon kodu kullan
  async promosyonKoduKullan(oyuncuId: string, kod: string) {
    const promosyon = await this.prisma.promosyonKodu.findUnique({
      where: { kod },
    });

    if (!promosyon) {
      throw new NotFoundException('Geçersiz promosyon kodu');
    }

    if (!promosyon.aktif) {
      throw new BadRequestException('Bu promosyon kodu artık geçerli değil');
    }

    const simdi = new Date();
    if (promosyon.gecerliBitis && promosyon.gecerliBitis < simdi) {
      throw new BadRequestException('Bu promosyon kodunun süresi dolmuş');
    }

    if (promosyon.kullanilanSayi >= promosyon.maxKullanim) {
      throw new BadRequestException('Bu promosyon kodu kullanım limitine ulaştı');
    }

    // Bu kullanıcı daha önce kullanmış mı?
    const oncekiKullanim = await this.prisma.promosyonKullanimi.findUnique({
      where: {
        promosyonKodId_oyuncuId: {
          promosyonKodId: promosyon.id,
          oyuncuId,
        },
      },
    });

    if (oncekiKullanim) {
      throw new BadRequestException('Bu promosyon kodunu zaten kullandınız');
    }

    // Premium uygula
    const bitis = new Date(simdi.getTime() + promosyon.sureSaat * 60 * 60 * 1000);

    const [uyelik] = await this.prisma.$transaction([
      this.prisma.premiumUyelik.create({
        data: {
          oyuncuId,
          tip: promosyon.premiumTip,
          baslangic: simdi,
          bitis,
          odemeTutari: 0,
          odemeYontemi: 'promosyon',
          odemeRefId: promosyon.kod,
        },
      }),
      this.prisma.promosyonKullanimi.create({
        data: {
          promosyonKodId: promosyon.id,
          oyuncuId,
        },
      }),
      this.prisma.promosyonKodu.update({
        where: { id: promosyon.id },
        data: { kullanilanSayi: { increment: 1 } },
      }),
    ]);

    return {
      uyelik,
      avantajlar: PREMIUM_AVANTAJLARI[promosyon.premiumTip],
      mesaj: `${promosyon.premiumTip} premium üyeliğiniz ${promosyon.sureSaat / 24} gün için aktif edildi!`,
    };
  }

  // Admin: Promosyon kodu oluştur
  async promosyonKoduOlustur(
    olusturanId: string,
    data: {
      kod: string;
      premiumTip: PremiumTip;
      sureSaat: number;
      maxKullanim?: number;
      gecerliBitis?: Date;
    },
  ) {
    return this.prisma.promosyonKodu.create({
      data: {
        kod: data.kod.toUpperCase(),
        premiumTip: data.premiumTip,
        sureSaat: data.sureSaat,
        maxKullanim: data.maxKullanim || 1,
        gecerliBitis: data.gecerliBitis,
        olusturanId,
      },
    });
  }

  // Admin: Kullanıcıya premium ver
  async premiumVer(
    oyuncuId: string,
    tip: PremiumTip,
    sureSaat: number,
    yetkiliId: string,
  ) {
    const simdi = new Date();
    const bitis = new Date(simdi.getTime() + sureSaat * 60 * 60 * 1000);

    return this.prisma.premiumUyelik.create({
      data: {
        oyuncuId,
        tip,
        baslangic: simdi,
        bitis,
        odemeTutari: 0,
        odemeYontemi: 'admin_hediye',
        odemeRefId: `ADMIN-${yetkiliId}-${Date.now()}`,
      },
    });
  }

  // Kullanıcının premium geçmişi
  async premiumGecmisiGetir(oyuncuId: string) {
    return this.prisma.premiumUyelik.findMany({
      where: { oyuncuId },
      orderBy: { olusturuldu: 'desc' },
    });
  }
}
