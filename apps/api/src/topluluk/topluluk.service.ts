import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToplulukOlusturDto } from './dto/topluluk.dto';
import { ToplulukDurumu, UyeRolu } from '@prisma/client';

@Injectable()
export class ToplulukService {
  constructor(private prisma: PrismaService) {}

  // Rastgele 6 haneli kod oluştur
  private kodOlustur(): string {
    const karakterler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let kod = '';
    for (let i = 0; i < 6; i++) {
      kod += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    return kod;
  }

  async tumTopluluklariGetir() {
    const topluluklar = await this.prisma.topluluk.findMany({
      where: {
        durum: { in: [ToplulukDurumu.LOBI, ToplulukDurumu.DEVAM_EDIYOR] },
        gizliMi: false,
      },
      include: {
        uyeler: {
          where: { durum: 'AKTIF' },
          include: { oyuncu: { select: { kullaniciAdi: true } } },
        },
        _count: { select: { uyeler: true } },
      },
      orderBy: { olusturuldu: 'desc' },
    });

    return topluluklar.map((t) => {
      const kurucu = t.uyeler.find((u) => u.rol === UyeRolu.KURUCU);
      return {
        id: t.id,
        isim: t.isim,
        kod: t.davetKodu,
        durum: t.durum,
        oyuncuSayisi: t._count.uyeler,
        maxOyuncu: t.maxOyuncu,
        liderAdi: kurucu?.oyuncu.kullaniciAdi || 'Bilinmiyor',
      };
    });
  }

  async toplulukOlustur(oyuncuId: string, dto: ToplulukOlusturDto) {
    // Benzersiz kod oluştur
    let davetKodu: string;
    let mevcutKod;
    do {
      davetKodu = this.kodOlustur();
      mevcutKod = await this.prisma.topluluk.findUnique({ where: { davetKodu } });
    } while (mevcutKod);

    const topluluk = await this.prisma.topluluk.create({
      data: {
        isim: dto.isim,
        davetKodu,
        kurucuId: oyuncuId,
        uyeler: {
          create: {
            oyuncuId,
            rol: UyeRolu.KURUCU,
          },
        },
      },
      include: {
        uyeler: {
          include: { oyuncu: { select: { kullaniciAdi: true } } },
        },
        _count: { select: { uyeler: true } },
      },
    });

    const kurucu = topluluk.uyeler.find((u) => u.rol === UyeRolu.KURUCU);

    return {
      id: topluluk.id,
      isim: topluluk.isim,
      kod: topluluk.davetKodu,
      durum: topluluk.durum,
      oyuncuSayisi: topluluk._count.uyeler,
      maxOyuncu: topluluk.maxOyuncu,
      liderAdi: kurucu?.oyuncu.kullaniciAdi || 'Bilinmiyor',
    };
  }

  async toplulugaKatil(oyuncuId: string, kod: string) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { davetKodu: kod },
      include: {
        uyeler: {
          where: { durum: 'AKTIF' },
          include: { oyuncu: { select: { kullaniciAdi: true } } },
        },
        _count: { select: { uyeler: true } },
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    if (topluluk.durum !== ToplulukDurumu.LOBI) {
      throw new BadRequestException('Bu topluluğa artık katılamazsınız');
    }

    if (topluluk._count.uyeler >= topluluk.maxOyuncu) {
      throw new BadRequestException('Topluluk dolu');
    }

    // Zaten üye mi kontrol et
    const mevcutUyelik = await this.prisma.toplulukUyesi.findUnique({
      where: {
        oyuncuId_toplulukId: {
          oyuncuId,
          toplulukId: topluluk.id,
        },
      },
    });

    if (mevcutUyelik) {
      throw new BadRequestException('Zaten bu topluluğun üyesisiniz');
    }

    // Topluluğa ekle
    await this.prisma.toplulukUyesi.create({
      data: {
        oyuncuId,
        toplulukId: topluluk.id,
        rol: UyeRolu.OYUNCU,
      },
    });

    const kurucu = topluluk.uyeler.find((u) => u.rol === UyeRolu.KURUCU);

    return {
      id: topluluk.id,
      isim: topluluk.isim,
      kod: topluluk.davetKodu,
      durum: topluluk.durum,
      oyuncuSayisi: topluluk._count.uyeler + 1,
      maxOyuncu: topluluk.maxOyuncu,
      liderAdi: kurucu?.oyuncu.kullaniciAdi || 'Bilinmiyor',
    };
  }

  async toplulukDetayGetir(toplulukId: string, oyuncuId: string) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: {
          where: { durum: 'AKTIF' },
          include: { oyuncu: { select: { id: true, kullaniciAdi: true } } },
        },
        oyunDurumu: true,
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    // Oyuncu bu toplulukta mı?
    const oyuncuMevcut = topluluk.uyeler.some((u) => u.oyuncuId === oyuncuId);
    if (!oyuncuMevcut) {
      throw new ForbiddenException('Bu topluluğa erişim izniniz yok');
    }

    const kurucu = topluluk.uyeler.find((u) => u.rol === UyeRolu.KURUCU);

    return {
      id: topluluk.id,
      isim: topluluk.isim,
      kod: topluluk.davetKodu,
      durum: topluluk.durum,
      maxOyuncu: topluluk.maxOyuncu,
      lider: kurucu
        ? { id: kurucu.oyuncu.id, kullaniciAdi: kurucu.oyuncu.kullaniciAdi }
        : null,
      oyuncular: topluluk.uyeler.map((u) => ({
        id: u.oyuncu.id,
        kullaniciAdi: u.oyuncu.kullaniciAdi,
        rol: u.rol,
        hazir: false, // TODO: Hazırlık durumu eklenecek
      })),
      oyunDurumu: topluluk.oyunDurumu
        ? {
            id: topluluk.oyunDurumu.id,
            mevcutTur: topluluk.oyunDurumu.mevcutTur,
            asama: topluluk.oyunDurumu.asama,
            kaynaklar: {
              hazine: topluluk.oyunDurumu.hazine,
              refah: topluluk.oyunDurumu.refah,
              istikrar: topluluk.oyunDurumu.istikrar,
              altyapi: topluluk.oyunDurumu.altyapi,
            },
          }
        : null,
    };
  }
}
