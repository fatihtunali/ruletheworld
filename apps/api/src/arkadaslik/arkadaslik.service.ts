import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BildirimService } from '../bildirim/bildirim.service';

@Injectable()
export class ArkadaslikService {
  constructor(
    private prisma: PrismaService,
    private bildirimService: BildirimService,
  ) {}

  // Arkadaşlık isteği gönder
  async istekGonder(gonderenId: string, alanKullaniciAdi: string) {
    // Alıcıyı bul
    const alan = await this.prisma.oyuncu.findUnique({
      where: { kullaniciAdi: alanKullaniciAdi },
    });

    if (!alan) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (alan.id === gonderenId) {
      throw new BadRequestException('Kendinize arkadaşlık isteği gönderemezsiniz');
    }

    // Mevcut arkadaşlık kontrolü
    const mevcutArkadaslik = await this.prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId, alanId: alan.id },
          { gonderenId: alan.id, alanId: gonderenId },
        ],
      },
    });

    if (mevcutArkadaslik) {
      if (mevcutArkadaslik.durum === 'KABUL_EDILDI') {
        throw new ConflictException('Zaten arkadaşsınız');
      }
      if (mevcutArkadaslik.durum === 'BEKLIYOR') {
        throw new ConflictException('Zaten bekleyen bir istek var');
      }
      if (mevcutArkadaslik.durum === 'ENGELLENDI') {
        throw new BadRequestException('Bu kullanıcıyla arkadaş olamazsınız');
      }
    }

    // Yeni istek oluştur
    const arkadaslik = await this.prisma.arkadaslik.create({
      data: {
        gonderenId,
        alanId: alan.id,
        durum: 'BEKLIYOR',
      },
      include: {
        gonderen: {
          select: { id: true, kullaniciAdi: true },
        },
        alan: {
          select: { id: true, kullaniciAdi: true },
        },
      },
    });

    // Bildirim gönder
    await this.bildirimService.bildirimOlustur({
      oyuncuId: alan.id,
      tip: 'SISTEM',
      baslik: 'Yeni Arkadaşlık İsteği',
      icerik: `${arkadaslik.gonderen.kullaniciAdi} size arkadaşlık isteği gönderdi`,
      link: '/arkadaslar',
    });

    return {
      basarili: true,
      mesaj: 'Arkadaşlık isteği gönderildi',
      arkadaslik,
    };
  }

  // İsteği kabul et
  async istekKabulEt(oyuncuId: string, arkadaslikId: string) {
    const arkadaslik = await this.prisma.arkadaslik.findUnique({
      where: { id: arkadaslikId },
      include: {
        gonderen: { select: { id: true, kullaniciAdi: true } },
        alan: { select: { id: true, kullaniciAdi: true } },
      },
    });

    if (!arkadaslik) {
      throw new NotFoundException('Arkadaşlık isteği bulunamadı');
    }

    if (arkadaslik.alanId !== oyuncuId) {
      throw new BadRequestException('Bu isteği kabul etme yetkiniz yok');
    }

    if (arkadaslik.durum !== 'BEKLIYOR') {
      throw new BadRequestException('Bu istek zaten yanıtlanmış');
    }

    const guncellenenArkadaslik = await this.prisma.arkadaslik.update({
      where: { id: arkadaslikId },
      data: {
        durum: 'KABUL_EDILDI',
        yanitlandiAt: new Date(),
      },
      include: {
        gonderen: { select: { id: true, kullaniciAdi: true } },
        alan: { select: { id: true, kullaniciAdi: true } },
      },
    });

    // Gönderene bildirim
    await this.bildirimService.bildirimOlustur({
      oyuncuId: arkadaslik.gonderenId,
      tip: 'SISTEM',
      baslik: 'Arkadaşlık İsteği Kabul Edildi',
      icerik: `${arkadaslik.alan.kullaniciAdi} arkadaşlık isteğinizi kabul etti`,
      link: '/arkadaslar',
    });

    return {
      basarili: true,
      mesaj: 'Arkadaşlık isteği kabul edildi',
      arkadaslik: guncellenenArkadaslik,
    };
  }

  // İsteği reddet
  async istekReddet(oyuncuId: string, arkadaslikId: string) {
    const arkadaslik = await this.prisma.arkadaslik.findUnique({
      where: { id: arkadaslikId },
    });

    if (!arkadaslik) {
      throw new NotFoundException('Arkadaşlık isteği bulunamadı');
    }

    if (arkadaslik.alanId !== oyuncuId) {
      throw new BadRequestException('Bu isteği reddetme yetkiniz yok');
    }

    if (arkadaslik.durum !== 'BEKLIYOR') {
      throw new BadRequestException('Bu istek zaten yanıtlanmış');
    }

    await this.prisma.arkadaslik.update({
      where: { id: arkadaslikId },
      data: {
        durum: 'REDDEDILDI',
        yanitlandiAt: new Date(),
      },
    });

    return {
      basarili: true,
      mesaj: 'Arkadaşlık isteği reddedildi',
    };
  }

  // Arkadaşlıktan çıkar
  async arkadaslikCikar(oyuncuId: string, arkadasId: string) {
    const arkadaslik = await this.prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId: oyuncuId, alanId: arkadasId, durum: 'KABUL_EDILDI' },
          { gonderenId: arkadasId, alanId: oyuncuId, durum: 'KABUL_EDILDI' },
        ],
      },
    });

    if (!arkadaslik) {
      throw new NotFoundException('Arkadaşlık bulunamadı');
    }

    await this.prisma.arkadaslik.delete({
      where: { id: arkadaslik.id },
    });

    return {
      basarili: true,
      mesaj: 'Arkadaşlıktan çıkarıldı',
    };
  }

  // Kullanıcıyı engelle
  async engelle(oyuncuId: string, hedefId: string) {
    // Mevcut arkadaşlığı bul veya yeni oluştur
    const mevcutArkadaslik = await this.prisma.arkadaslik.findFirst({
      where: {
        OR: [
          { gonderenId: oyuncuId, alanId: hedefId },
          { gonderenId: hedefId, alanId: oyuncuId },
        ],
      },
    });

    if (mevcutArkadaslik) {
      await this.prisma.arkadaslik.update({
        where: { id: mevcutArkadaslik.id },
        data: {
          durum: 'ENGELLENDI',
          gonderenId: oyuncuId, // Engelleyen kişi gonderen olsun
          alanId: hedefId,
        },
      });
    } else {
      await this.prisma.arkadaslik.create({
        data: {
          gonderenId: oyuncuId,
          alanId: hedefId,
          durum: 'ENGELLENDI',
        },
      });
    }

    return {
      basarili: true,
      mesaj: 'Kullanıcı engellendi',
    };
  }

  // Engeli kaldır
  async engelKaldir(oyuncuId: string, hedefId: string) {
    const engel = await this.prisma.arkadaslik.findFirst({
      where: {
        gonderenId: oyuncuId,
        alanId: hedefId,
        durum: 'ENGELLENDI',
      },
    });

    if (!engel) {
      throw new NotFoundException('Engel bulunamadı');
    }

    await this.prisma.arkadaslik.delete({
      where: { id: engel.id },
    });

    return {
      basarili: true,
      mesaj: 'Engel kaldırıldı',
    };
  }

  // Arkadaş listesi
  async arkadaslariGetir(oyuncuId: string) {
    const arkadasliklar = await this.prisma.arkadaslik.findMany({
      where: {
        OR: [
          { gonderenId: oyuncuId, durum: 'KABUL_EDILDI' },
          { alanId: oyuncuId, durum: 'KABUL_EDILDI' },
        ],
      },
      include: {
        gonderen: {
          select: {
            id: true,
            kullaniciAdi: true,
            sonAktiflik: true,
            toplamPuan: true,
          },
        },
        alan: {
          select: {
            id: true,
            kullaniciAdi: true,
            sonAktiflik: true,
            toplamPuan: true,
          },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    // Arkadaş bilgilerini düzelt (gonderen veya alan hangisi arkadaşsa)
    return arkadasliklar.map((a) => {
      const arkadas = a.gonderenId === oyuncuId ? a.alan : a.gonderen;
      const sonAktiflik = new Date(arkadas.sonAktiflik);
      const simdi = new Date();
      const farkDakika = Math.floor(
        (simdi.getTime() - sonAktiflik.getTime()) / (1000 * 60),
      );

      return {
        id: a.id,
        arkadas: {
          id: arkadas.id,
          kullaniciAdi: arkadas.kullaniciAdi,
          toplamPuan: arkadas.toplamPuan,
          cevrimici: farkDakika < 5,
          sonAktiflik: arkadas.sonAktiflik,
        },
        arkadaslikTarihi: a.yanitlandiAt || a.olusturuldu,
      };
    });
  }

  // Bekleyen istekler
  async bekleyenIstekleriGetir(oyuncuId: string) {
    const gelenIstekler = await this.prisma.arkadaslik.findMany({
      where: {
        alanId: oyuncuId,
        durum: 'BEKLIYOR',
      },
      include: {
        gonderen: {
          select: {
            id: true,
            kullaniciAdi: true,
            toplamPuan: true,
          },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    const gidenIstekler = await this.prisma.arkadaslik.findMany({
      where: {
        gonderenId: oyuncuId,
        durum: 'BEKLIYOR',
      },
      include: {
        alan: {
          select: {
            id: true,
            kullaniciAdi: true,
            toplamPuan: true,
          },
        },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    return {
      gelen: gelenIstekler.map((i) => ({
        id: i.id,
        gonderen: i.gonderen,
        tarih: i.olusturuldu,
      })),
      giden: gidenIstekler.map((i) => ({
        id: i.id,
        alan: i.alan,
        tarih: i.olusturuldu,
      })),
    };
  }

  // Engellenen kullanıcılar
  async engellenenler(oyuncuId: string) {
    const engeller = await this.prisma.arkadaslik.findMany({
      where: {
        gonderenId: oyuncuId,
        durum: 'ENGELLENDI',
      },
      include: {
        alan: {
          select: {
            id: true,
            kullaniciAdi: true,
          },
        },
      },
      orderBy: { guncellendi: 'desc' },
    });

    return engeller.map((e) => ({
      id: e.id,
      kullanici: e.alan,
      engelTarihi: e.guncellendi,
    }));
  }

  // Kullanıcı ara (arkadaş eklemek için)
  async kullaniciAra(oyuncuId: string, arama: string) {
    if (arama.length < 2) {
      return [];
    }

    const kullanicilar = await this.prisma.oyuncu.findMany({
      where: {
        AND: [
          { id: { not: oyuncuId } },
          { hesapDurumu: 'AKTIF' },
          {
            kullaniciAdi: {
              contains: arama,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        kullaniciAdi: true,
        toplamPuan: true,
        oynananOyunlar: true,
      },
      take: 10,
    });

    // Her kullanıcı için arkadaşlık durumunu kontrol et
    const sonuclar = await Promise.all(
      kullanicilar.map(async (k) => {
        const arkadaslik = await this.prisma.arkadaslik.findFirst({
          where: {
            OR: [
              { gonderenId: oyuncuId, alanId: k.id },
              { gonderenId: k.id, alanId: oyuncuId },
            ],
          },
        });

        let durum: 'YOK' | 'ARKADAS' | 'BEKLIYOR' | 'GELEN_ISTEK' | 'ENGELLENDI' =
          'YOK';

        if (arkadaslik) {
          if (arkadaslik.durum === 'KABUL_EDILDI') {
            durum = 'ARKADAS';
          } else if (arkadaslik.durum === 'BEKLIYOR') {
            durum = arkadaslik.gonderenId === oyuncuId ? 'BEKLIYOR' : 'GELEN_ISTEK';
          } else if (arkadaslik.durum === 'ENGELLENDI') {
            durum = 'ENGELLENDI';
          }
        }

        return {
          ...k,
          arkadaslikDurumu: durum,
        };
      }),
    );

    return sonuclar;
  }

  // Çevrimiçi arkadaşlar
  async cevrimiçiArkadaslar(oyuncuId: string) {
    const arkadaslar = await this.arkadaslariGetir(oyuncuId);
    return arkadaslar.filter((a) => a.arkadas.cevrimici);
  }
}
