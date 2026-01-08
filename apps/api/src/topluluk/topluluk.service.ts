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
import { BotService, BotKisilik } from '../bot/bot.service';
import {
  OyunStateMachineService,
  TIMING,
  GAME_CONFIG,
} from '../oyun/oyun-state-machine.service';

@Injectable()
export class ToplulukService {
  private readonly logger = new Logger(ToplulukService.name);
  private bekleyenLobiler = new Map<string, NodeJS.Timeout>();
  private countdownTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private prisma: PrismaService,
    private botService: BotService,
    private stateMachine: OyunStateMachineService,
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

  // ==================== STATE TRANSITIONS ====================

  /**
   * Update lobby state based on player count
   */
  async durumGuncelle(toplulukId: string): Promise<ToplulukDurumu> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) return ToplulukDurumu.LOBI;

    const oyuncuSayisi = topluluk.uyeler.length;
    let yeniDurum = topluluk.durum;

    // State transitions based on player count
    if (topluluk.durum === ToplulukDurumu.LOBI || topluluk.durum === ToplulukDurumu.BEKLEME) {
      if (this.stateMachine.canTransitionToReady(oyuncuSayisi)) {
        yeniDurum = ToplulukDurumu.HAZIR;
        this.logger.log(`Topluluk ${toplulukId}: BEKLEME -> HAZIR (${oyuncuSayisi} oyuncu)`);
      } else {
        yeniDurum = ToplulukDurumu.BEKLEME;
      }
    } else if (topluluk.durum === ToplulukDurumu.HAZIR) {
      if (this.stateMachine.shouldTransitionToWaiting(oyuncuSayisi)) {
        yeniDurum = ToplulukDurumu.BEKLEME;
        this.logger.log(`Topluluk ${toplulukId}: HAZIR -> BEKLEME (${oyuncuSayisi} oyuncu)`);
      }
    }

    // Update if changed
    if (yeniDurum !== topluluk.durum) {
      await this.prisma.topluluk.update({
        where: { id: toplulukId },
        data: { durum: yeniDurum },
      });
    }

    return yeniDurum;
  }

  /**
   * Start countdown timer (host clicked start)
   */
  async countdownBaslat(toplulukId: string, oyuncuId: string): Promise<{ basarili: boolean; mesaj: string }> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    // Only host can start
    const kurucu = topluluk.uyeler.find(u => u.rol === UyeRolu.KURUCU);
    if (!kurucu || kurucu.oyuncuId !== oyuncuId) {
      throw new ForbiddenException('Sadece topluluk kurucusu oyunu başlatabilir');
    }

    // Must be in HAZIR state
    if (topluluk.durum !== ToplulukDurumu.HAZIR && topluluk.durum !== ToplulukDurumu.LOBI) {
      throw new BadRequestException('Oyun şu anda başlatılamaz');
    }

    // Check minimum players
    if (!this.stateMachine.canTransitionToReady(topluluk.uyeler.length)) {
      throw new BadRequestException(`En az ${GAME_CONFIG.MIN_PLAYERS} oyuncu gerekli`);
    }

    // Transition to COUNTDOWN
    await this.prisma.topluluk.update({
      where: { id: toplulukId },
      data: { durum: ToplulukDurumu.GERI_SAYIM },
    });

    this.logger.log(`Topluluk ${toplulukId}: Countdown başladı (${TIMING.COUNTDOWN / 1000}s)`);

    // Set countdown timer
    const timer = setTimeout(async () => {
      await this.countdownBitti(toplulukId);
    }, TIMING.COUNTDOWN);

    this.countdownTimers.set(toplulukId, timer);

    return { basarili: true, mesaj: `${TIMING.COUNTDOWN / 1000} saniye sonra oyun başlayacak` };
  }

  /**
   * Cancel countdown (host clicked cancel)
   */
  async countdownIptal(toplulukId: string, oyuncuId: string): Promise<{ basarili: boolean }> {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    // Only host can cancel
    const kurucu = topluluk.uyeler.find(u => u.rol === UyeRolu.KURUCU);
    if (!kurucu || kurucu.oyuncuId !== oyuncuId) {
      throw new ForbiddenException('Sadece topluluk kurucusu iptal edebilir');
    }

    // Must be in COUNTDOWN state
    if (topluluk.durum !== ToplulukDurumu.GERI_SAYIM) {
      return { basarili: false };
    }

    // Clear timer
    if (this.countdownTimers.has(toplulukId)) {
      clearTimeout(this.countdownTimers.get(toplulukId));
      this.countdownTimers.delete(toplulukId);
    }

    // Transition back to HAZIR
    await this.prisma.topluluk.update({
      where: { id: toplulukId },
      data: { durum: ToplulukDurumu.HAZIR },
    });

    this.logger.log(`Topluluk ${toplulukId}: Countdown iptal edildi`);

    return { basarili: true };
  }

  /**
   * Countdown finished - fill bots if needed and start game
   */
  private async countdownBitti(toplulukId: string) {
    this.countdownTimers.delete(toplulukId);

    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
      include: {
        uyeler: { where: { durum: 'AKTIF' } },
      },
    });

    if (!topluluk || topluluk.durum !== ToplulukDurumu.GERI_SAYIM) {
      this.logger.warn(`Topluluk ${toplulukId}: Countdown bitti ama durum uygun değil`);
      return;
    }

    const oyuncuSayisi = topluluk.uyeler.length;

    // If not enough players, fill with bots
    if (oyuncuSayisi < GAME_CONFIG.MIN_PLAYERS) {
      await this.prisma.topluluk.update({
        where: { id: toplulukId },
        data: { durum: ToplulukDurumu.BOT_DOLDURMA },
      });

      this.logger.log(`Topluluk ${toplulukId}: BOT_DOLDURMA - ${GAME_CONFIG.MIN_PLAYERS - oyuncuSayisi} bot eklenecek`);
      await this.botlariEkle(toplulukId);
    }

    // Start the game
    await this.oyunuBaslat(toplulukId);
  }

  /**
   * Start the actual game
   */
  private async oyunuBaslat(toplulukId: string) {
    await this.prisma.topluluk.update({
      where: { id: toplulukId },
      data: { durum: ToplulukDurumu.DEVAM_EDIYOR },
    });

    this.logger.log(`Topluluk ${toplulukId}: Oyun başladı!`);

    // TODO: Create game state, start first round
    // This will be handled by OyunService
  }

  // ==================== BOT MANAGEMENT ====================

  // Bot otomatik ekleme zamanlayıcısını başlat (lobi oluşturulduğunda)
  async botZamanlayicisiBaslat(toplulukId: string) {
    // Önceki zamanlayıcı varsa iptal et
    if (this.bekleyenLobiler.has(toplulukId)) {
      clearTimeout(this.bekleyenLobiler.get(toplulukId));
    }

    this.logger.log(`Topluluk ${toplulukId} için bot zamanlayıcısı başlatıldı (${TIMING.COUNTDOWN / 1000}s)`);

    const timeout = setTimeout(async () => {
      await this.botlariEkle(toplulukId);
    }, TIMING.COUNTDOWN);

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
  async botlariEkle(toplulukId: string, minOyuncu: number = GAME_CONFIG.MIN_PLAYERS) {
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

    // Lobi veya bot doldurma durumunda değilse ekleme yapma
    const allowedStates: ToplulukDurumu[] = [ToplulukDurumu.LOBI, ToplulukDurumu.BEKLEME, ToplulukDurumu.BOT_DOLDURMA];
    if (!allowedStates.includes(topluluk.durum)) {
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
          await new Promise(resolve => setTimeout(resolve, TIMING.BOT_FILL_INTERVAL));
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
    const eklenenBotlar: { id: string; kisilik: BotKisilik }[] = [];

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
