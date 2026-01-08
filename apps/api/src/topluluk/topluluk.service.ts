import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToplulukOlusturDto } from './dto/topluluk.dto';
import { ToplulukDurumu, UyeRolu } from '@prisma/client';
import { BotService } from '../bot/bot.service';

// Otomatik bot ekleme için bekleme süreleri (ms)
const BOT_BEKLEME_SURESI = 30000; // 30 saniye
const BOT_EKLEME_ARALIGI = 5000; // Her 5 saniyede bir bot ekle

@Injectable()
export class ToplulukService {
  private readonly logger = new Logger(ToplulukService.name);
  private bekleyenLobiler = new Map<string, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private botService: BotService,
  ) {}

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

    // Otomatik bot ekleme zamanlayıcısını başlat
    this.botZamanlayicisiBaslat(topluluk.id);

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

  // Bot otomatik ekleme zamanlayıcısını başlat
  async botZamanlayicisiBaslat(toplulukId: string) {
    // Önceki zamanlayıcı varsa iptal et
    if (this.bekleyenLobiler.has(toplulukId)) {
      clearTimeout(this.bekleyenLobiler.get(toplulukId));
    }

    this.logger.log(`Topluluk ${toplulukId} için bot zamanlayıcısı başlatıldı (${BOT_BEKLEME_SURESI / 1000}s)`);

    const timeout = setTimeout(async () => {
      await this.botlariEkle(toplulukId);
    }, BOT_BEKLEME_SURESI);

    this.bekleyenLobiler.set(toplulukId, timeout);
  }

  // Bot zamanlayıcısını iptal et (yeterli oyuncu katılınca)
  botZamanlayicisiIptal(toplulukId: string) {
    if (this.bekleyenLobiler.has(toplulukId)) {
      clearTimeout(this.bekleyenLobiler.get(toplulukId));
      this.bekleyenLobiler.delete(toplulukId);
      this.logger.log(`Topluluk ${toplulukId} için bot zamanlayıcısı iptal edildi`);
    }
  }

  // Lobiye bot ekle (minimum oyuncu sayısına ulaşana kadar)
  async botlariEkle(toplulukId: string, minOyuncu: number = 4) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) {
      this.logger.warn(`Topluluk ${toplulukId} bulunamadı`);
      return;
    }

    // Lobi durumunda değilse ekleme yapma
    if (topluluk.durum !== ToplulukDurumu.LOBI) {
      this.logger.log(`Topluluk ${toplulukId} artık lobide değil, bot eklenmedi`);
      return;
    }

    const mevcutOyuncuSayisi = topluluk.uyeler.length;
    const eklenecekBotSayisi = Math.min(
      minOyuncu - mevcutOyuncuSayisi,
      topluluk.maxOyuncu - mevcutOyuncuSayisi
    );

    if (eklenecekBotSayisi <= 0) {
      this.logger.log(`Topluluk ${toplulukId} zaten yeterli oyuncuya sahip`);
      return;
    }

    this.logger.log(`Topluluk ${toplulukId}'ye ${eklenecekBotSayisi} bot ekleniyor...`);

    // Botları sırayla ekle (daha doğal görünmesi için)
    for (let i = 0; i < eklenecekBotSayisi; i++) {
      try {
        const bot = await this.botService.botGetirVeyaOlustur();

        await this.prisma.toplulukUyesi.create({
          data: {
            oyuncuId: bot.id,
            toplulukId: topluluk.id,
            rol: UyeRolu.OYUNCU,
          },
        });

        this.logger.log(`Bot ${bot.id} (${bot.kisilik}) topluluk ${toplulukId}'ye eklendi`);

        // Kısa gecikme ekle (doğal görünmesi için)
        if (i < eklenecekBotSayisi - 1) {
          await new Promise(resolve => setTimeout(resolve, BOT_EKLEME_ARALIGI));
        }
      } catch (error) {
        this.logger.error(`Bot ekleme hatası: ${error.message}`);
      }
    }

    // Zamanlayıcıyı temizle
    this.bekleyenLobiler.delete(toplulukId);

    this.logger.log(`Topluluk ${toplulukId}'ye botlar eklendi, toplam oyuncu: ${mevcutOyuncuSayisi + eklenecekBotSayisi}`);
  }

  // Manuel bot ekleme (endpoint için)
  async manuelBotEkle(toplulukId: string, oyuncuId: string, adet: number = 1) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    // Sadece kurucu bot ekleyebilir
    const kurucu = topluluk.uyeler.find(u => u.rol === UyeRolu.KURUCU);
    if (!kurucu || kurucu.oyuncuId !== oyuncuId) {
      throw new ForbiddenException('Sadece topluluk kurucusu bot ekleyebilir');
    }

    if (topluluk.durum !== ToplulukDurumu.LOBI) {
      throw new BadRequestException('Oyun başladıktan sonra bot eklenemez');
    }

    const bosYer = topluluk.maxOyuncu - topluluk.uyeler.length;
    if (bosYer <= 0) {
      throw new BadRequestException('Topluluk dolu');
    }

    const eklenecek = Math.min(adet, bosYer);
    const eklenenBotlar = [];

    for (let i = 0; i < eklenecek; i++) {
      const bot = await this.botService.botGetirVeyaOlustur();

      await this.prisma.toplulukUyesi.create({
        data: {
          oyuncuId: bot.id,
          toplulukId: topluluk.id,
          rol: UyeRolu.OYUNCU,
        },
      });

      eklenenBotlar.push({ id: bot.id, kisilik: bot.kisilik });
    }

    return {
      mesaj: `${eklenecek} bot eklendi`,
      eklenenBotlar,
      yeniOyuncuSayisi: topluluk.uyeler.length + eklenecek,
    };
  }
}
