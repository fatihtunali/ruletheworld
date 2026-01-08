import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GorevTipi } from '@prisma/client';

// Varsayılan görevler
const VARSAYILAN_GOREVLER = [
  // Günlük görevler
  {
    kod: 'GUNLUK_1_OYUN',
    tip: GorevTipi.GUNLUK,
    baslik: 'Günlük Savaşçı',
    aciklama: '1 oyun oyna',
    hedefDeger: 1,
    hedefTip: 'OYUN_OYNA',
    altinOdulu: 50,
    xpOdulu: 25,
  },
  {
    kod: 'GUNLUK_3_OYUN',
    tip: GorevTipi.GUNLUK,
    baslik: 'Aktif Lider',
    aciklama: '3 oyun oyna',
    hedefDeger: 3,
    hedefTip: 'OYUN_OYNA',
    altinOdulu: 150,
    xpOdulu: 75,
  },
  {
    kod: 'GUNLUK_1_KAZAN',
    tip: GorevTipi.GUNLUK,
    baslik: 'Zafer!',
    aciklama: '1 oyun kazan (Parladı)',
    hedefDeger: 1,
    hedefTip: 'OYUN_KAZAN',
    altinOdulu: 100,
    xpOdulu: 50,
  },
  {
    kod: 'GUNLUK_5_ONERI',
    tip: GorevTipi.GUNLUK,
    baslik: 'Strateji Ustası',
    aciklama: '5 öneri yap',
    hedefDeger: 5,
    hedefTip: 'ONERI_YAP',
    altinOdulu: 75,
    xpOdulu: 40,
  },
  {
    kod: 'GUNLUK_10_OY',
    tip: GorevTipi.GUNLUK,
    baslik: 'Demokrat',
    aciklama: '10 oy kullan',
    hedefDeger: 10,
    hedefTip: 'OY_KULLAN',
    altinOdulu: 60,
    xpOdulu: 30,
  },

  // Haftalık görevler
  {
    kod: 'HAFTALIK_10_OYUN',
    tip: GorevTipi.HAFTALIK,
    baslik: 'Haftalık Maratoncu',
    aciklama: '10 oyun oyna',
    hedefDeger: 10,
    hedefTip: 'OYUN_OYNA',
    altinOdulu: 500,
    xpOdulu: 250,
  },
  {
    kod: 'HAFTALIK_5_KAZAN',
    tip: GorevTipi.HAFTALIK,
    baslik: 'Şampiyon',
    aciklama: '5 oyun kazan',
    hedefDeger: 5,
    hedefTip: 'OYUN_KAZAN',
    altinOdulu: 750,
    xpOdulu: 400,
  },
  {
    kod: 'HAFTALIK_1000_PUAN',
    tip: GorevTipi.HAFTALIK,
    baslik: 'Puan Avcısı',
    aciklama: '1000 puan kazan',
    hedefDeger: 1000,
    hedefTip: 'PUAN_KAZAN',
    altinOdulu: 600,
    xpOdulu: 300,
  },
  {
    kod: 'HAFTALIK_3_FARKLI_MOD',
    tip: GorevTipi.HAFTALIK,
    baslik: 'Çok Yönlü',
    aciklama: '3 farklı oyun modunda oyna',
    hedefDeger: 3,
    hedefTip: 'FARKLI_MOD',
    altinOdulu: 400,
    xpOdulu: 200,
  },
];

@Injectable()
export class GorevService {
  constructor(private prisma: PrismaService) {}

  // Varsayılan görevleri oluştur (seed)
  async varsayilanGörevleriOlustur() {
    for (const gorev of VARSAYILAN_GOREVLER) {
      await this.prisma.gorev.upsert({
        where: { kod: gorev.kod },
        update: {},
        create: {
          ...gorev,
          aktif: true,
          tekrarlanabilir: true,
        },
      });
    }
    return { mesaj: 'Varsayılan görevler oluşturuldu' };
  }

  // Oyuncunun aktif görevlerini getir
  async aktifGorevleriGetir(oyuncuId: string) {
    const simdi = new Date();
    const gunBaslangic = new Date(simdi.setHours(0, 0, 0, 0));
    const haftaBaslangic = this.haftaninBaslangici(new Date());

    // Tüm aktif görevleri al
    const gorevler = await this.prisma.gorev.findMany({
      where: { aktif: true },
      orderBy: [{ tip: 'asc' }, { altinOdulu: 'desc' }],
    });

    // Oyuncunun ilerlemelerini al
    const ilerlemeler = await this.prisma.gorevIlerleme.findMany({
      where: {
        oyuncuId,
        gorevId: { in: gorevler.map((g) => g.id) },
      },
    });

    // Görevleri ilerleme bilgisiyle birleştir
    return gorevler.map((gorev) => {
      let periyotBaslangic: Date;
      if (gorev.tip === GorevTipi.GUNLUK) {
        periyotBaslangic = gunBaslangic;
      } else if (gorev.tip === GorevTipi.HAFTALIK) {
        periyotBaslangic = haftaBaslangic;
      } else {
        periyotBaslangic = new Date(0);
      }

      const ilerleme = ilerlemeler.find(
        (i) =>
          i.gorevId === gorev.id &&
          new Date(i.periyotBaslangic).getTime() === periyotBaslangic.getTime()
      );

      return {
        ...gorev,
        ilerleme: ilerleme
          ? {
              mevcutDeger: ilerleme.mevcutDeger,
              tamamlandi: ilerleme.tamamlandi,
              odulAlindi: ilerleme.odulAlindi,
            }
          : {
              mevcutDeger: 0,
              tamamlandi: false,
              odulAlindi: false,
            },
        yuzdeTamamlama: ilerleme
          ? Math.min(100, Math.round((ilerleme.mevcutDeger / gorev.hedefDeger) * 100))
          : 0,
      };
    });
  }

  // Görev ilerlemesini güncelle
  async ilerlemeGuncelle(
    oyuncuId: string,
    hedefTip: string,
    deger: number = 1,
  ) {
    const simdi = new Date();
    const gunBaslangic = new Date(new Date().setHours(0, 0, 0, 0));
    const haftaBaslangic = this.haftaninBaslangici(new Date());

    // Bu hedef tipine sahip görevleri bul
    const gorevler = await this.prisma.gorev.findMany({
      where: { hedefTip, aktif: true },
    });

    const tamamlananlar: string[] = [];

    for (const gorev of gorevler) {
      let periyotBaslangic: Date;
      if (gorev.tip === GorevTipi.GUNLUK) {
        periyotBaslangic = gunBaslangic;
      } else if (gorev.tip === GorevTipi.HAFTALIK) {
        periyotBaslangic = haftaBaslangic;
      } else {
        periyotBaslangic = new Date(0);
      }

      // Mevcut ilerlemeyi al veya oluştur
      let ilerleme = await this.prisma.gorevIlerleme.findFirst({
        where: {
          gorevId: gorev.id,
          oyuncuId,
          periyotBaslangic,
        },
      });

      if (!ilerleme) {
        ilerleme = await this.prisma.gorevIlerleme.create({
          data: {
            gorevId: gorev.id,
            oyuncuId,
            periyotBaslangic,
            mevcutDeger: 0,
          },
        });
      }

      // Zaten tamamlandıysa atla
      if (ilerleme.tamamlandi) continue;

      // İlerlemeyi güncelle
      const yeniDeger = ilerleme.mevcutDeger + deger;
      const tamamlandi = yeniDeger >= gorev.hedefDeger;

      await this.prisma.gorevIlerleme.update({
        where: { id: ilerleme.id },
        data: {
          mevcutDeger: yeniDeger,
          tamamlandi,
          tamamlandiAt: tamamlandi ? new Date() : null,
        },
      });

      if (tamamlandi) {
        tamamlananlar.push(gorev.baslik);
      }
    }

    return { tamamlananlar };
  }

  // Görev ödülünü al
  async odulAl(oyuncuId: string, gorevId: string) {
    const gorev = await this.prisma.gorev.findUnique({
      where: { id: gorevId },
    });

    if (!gorev) {
      throw new NotFoundException('Görev bulunamadı');
    }

    let periyotBaslangic: Date;
    if (gorev.tip === GorevTipi.GUNLUK) {
      periyotBaslangic = new Date(new Date().setHours(0, 0, 0, 0));
    } else if (gorev.tip === GorevTipi.HAFTALIK) {
      periyotBaslangic = this.haftaninBaslangici(new Date());
    } else {
      periyotBaslangic = new Date(0);
    }

    const ilerleme = await this.prisma.gorevIlerleme.findFirst({
      where: {
        gorevId,
        oyuncuId,
        periyotBaslangic,
      },
    });

    if (!ilerleme || !ilerleme.tamamlandi) {
      throw new BadRequestException('Görev henüz tamamlanmadı');
    }

    if (ilerleme.odulAlindi) {
      throw new BadRequestException('Ödül zaten alındı');
    }

    // Ödülü ver ve işaretle
    await this.prisma.$transaction(async (tx) => {
      // İlerlemeyi güncelle
      await tx.gorevIlerleme.update({
        where: { id: ilerleme.id },
        data: { odulAlindi: true },
      });

      // Altın ödülü ver
      if (gorev.altinOdulu > 0) {
        const cuzdan = await tx.altinCuzdani.upsert({
          where: { oyuncuId },
          update: {
            bakiye: { increment: gorev.altinOdulu },
            toplamKazanilan: { increment: gorev.altinOdulu },
          },
          create: {
            oyuncuId,
            bakiye: gorev.altinOdulu,
            toplamKazanilan: gorev.altinOdulu,
          },
        });

        await tx.altinIslem.create({
          data: {
            cuzdanId: cuzdan.id,
            miktar: gorev.altinOdulu,
            tip: 'GOREV_ODULU',
            aciklama: `${gorev.baslik} görevi tamamlandı`,
            referansId: gorev.id,
          },
        });
      }

      // Puan ödülü ver
      if (gorev.puanOdulu > 0) {
        await tx.oyuncu.update({
          where: { id: oyuncuId },
          data: {
            toplamPuan: { increment: gorev.puanOdulu },
            sezonPuani: { increment: gorev.puanOdulu },
            haftalikPuan: { increment: gorev.puanOdulu },
          },
        });
      }
    });

    return {
      mesaj: 'Ödül başarıyla alındı!',
      altin: gorev.altinOdulu,
      puan: gorev.puanOdulu,
      xp: gorev.xpOdulu,
    };
  }

  // Yardımcı: Haftanın başlangıcını bul (Pazartesi)
  private haftaninBaslangici(tarih: Date): Date {
    const gun = tarih.getDay();
    const fark = tarih.getDate() - gun + (gun === 0 ? -6 : 1);
    const pazartesi = new Date(tarih.setDate(fark));
    pazartesi.setHours(0, 0, 0, 0);
    return pazartesi;
  }
}
