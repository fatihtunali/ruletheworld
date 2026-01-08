import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AltinIslemTipi } from '@prisma/client';

@Injectable()
export class ReferansService {
  private readonly logger = new Logger(ReferansService.name);

  // Ödül miktarları
  private readonly DAVETCI_ODULU = 100; // Altın
  private readonly DAVETLI_ODULU = 50;  // Altın

  constructor(private prisma: PrismaService) {}

  // Kod oluştur
  private kodOlustur(): string {
    const karakterler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let kod = '';
    for (let i = 0; i < 8; i++) {
      kod += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    return kod;
  }

  // Referans kodunu getir veya oluştur
  async referansKoduGetir(oyuncuId: string) {
    // Mevcut kod var mı?
    let referansKodu = await this.prisma.referansKodu.findUnique({
      where: { oyuncuId },
    });

    if (!referansKodu) {
      // Benzersiz kod oluştur
      let kod: string;
      let mevcutKod;
      do {
        kod = this.kodOlustur();
        mevcutKod = await this.prisma.referansKodu.findUnique({ where: { kod } });
      } while (mevcutKod);

      referansKodu = await this.prisma.referansKodu.create({
        data: {
          oyuncuId,
          kod,
        },
      });
    }

    return {
      kod: referansKodu.kod,
      kullanilanSayi: referansKodu.kullanilanSayi,
      kazanilanAltin: referansKodu.kazanilanAltin,
    };
  }

  // Referans kodu kullan (kayıt sırasında)
  async referansKoduKullan(yeniOyuncuId: string, kod: string) {
    // Kod var mı?
    const referansKodu = await this.prisma.referansKodu.findUnique({
      where: { kod },
    });

    if (!referansKodu) {
      throw new NotFoundException('Referans kodu bulunamadı');
    }

    // Kendi kodunu kullanmaya çalışıyor mu?
    if (referansKodu.oyuncuId === yeniOyuncuId) {
      throw new BadRequestException('Kendi referans kodunuzu kullanamazsınız');
    }

    // Daha önce referans kullandı mı?
    const mevcutKullanim = await this.prisma.referansKullanimi.findUnique({
      where: { yeniOyuncuId },
    });

    if (mevcutKullanim) {
      throw new BadRequestException('Zaten bir referans kodu kullandınız');
    }

    // Kullanım kaydı oluştur
    const kullanim = await this.prisma.referansKullanimi.create({
      data: {
        referansKodId: referansKodu.id,
        yeniOyuncuId,
      },
    });

    // Referans kodunu güncelle
    await this.prisma.referansKodu.update({
      where: { id: referansKodu.id },
      data: {
        kullanilanSayi: { increment: 1 },
      },
    });

    this.logger.log(`Referans kodu ${kod} kullanıldı. Yeni oyuncu: ${yeniOyuncuId}`);

    return kullanim;
  }

  // Ödülleri ver (ilk oyun tamamlandığında çağrılır)
  async oduluVer(yeniOyuncuId: string) {
    const kullanim = await this.prisma.referansKullanimi.findUnique({
      where: { yeniOyuncuId },
      include: { referansKod: true },
    });

    if (!kullanim || kullanim.davetliOdulVerildi) {
      return null;
    }

    // Davetli ödülü
    if (!kullanim.davetliOdulVerildi) {
      await this.altinEkle(yeniOyuncuId, this.DAVETLI_ODULU, 'Referans ödülü (Davetli)');

      await this.prisma.referansKullanimi.update({
        where: { id: kullanim.id },
        data: { davetliOdulVerildi: true },
      });
    }

    // Davetçi ödülü
    if (!kullanim.davetciOdulVerildi) {
      await this.altinEkle(
        kullanim.referansKod.oyuncuId,
        this.DAVETCI_ODULU,
        'Referans ödülü (Davetçi)',
      );

      await this.prisma.referansKullanimi.update({
        where: { id: kullanim.id },
        data: { davetciOdulVerildi: true },
      });

      // Referans kodunu güncelle
      await this.prisma.referansKodu.update({
        where: { id: kullanim.referansKodId },
        data: {
          kazanilanAltin: { increment: this.DAVETCI_ODULU },
        },
      });
    }

    this.logger.log(`Referans ödülleri verildi. Yeni oyuncu: ${yeniOyuncuId}`);
    return { davetliOdulu: this.DAVETLI_ODULU, davetciOdulu: this.DAVETCI_ODULU };
  }

  private async altinEkle(oyuncuId: string, miktar: number, aciklama: string) {
    // Cüzdan bul veya oluştur
    let cuzdan = await this.prisma.altinCuzdani.findUnique({
      where: { oyuncuId },
    });

    if (!cuzdan) {
      cuzdan = await this.prisma.altinCuzdani.create({
        data: { oyuncuId },
      });
    }

    // İşlem oluştur
    await this.prisma.altinIslem.create({
      data: {
        cuzdanId: cuzdan.id,
        miktar,
        tip: 'HEDIYE_ALINDI' as AltinIslemTipi,
        aciklama,
      },
    });

    // Bakiye güncelle
    await this.prisma.altinCuzdani.update({
      where: { id: cuzdan.id },
      data: {
        bakiye: { increment: miktar },
        toplamKazanilan: { increment: miktar },
      },
    });
  }

  // İstatistikler
  async referansIstatistikleri(oyuncuId: string) {
    const referansKodu = await this.prisma.referansKodu.findUnique({
      where: { oyuncuId },
      include: {
        kullanimlar: {
          orderBy: { olusturuldu: 'desc' },
          take: 10,
        },
      },
    });

    if (!referansKodu) {
      return null;
    }

    return {
      kod: referansKodu.kod,
      toplamKullanim: referansKodu.kullanilanSayi,
      kazanilanAltin: referansKodu.kazanilanAltin,
      sonKullanimlar: referansKodu.kullanimlar.map((k) => ({
        tarih: k.olusturuldu,
        odulVerildi: k.davetciOdulVerildi,
      })),
    };
  }
}
