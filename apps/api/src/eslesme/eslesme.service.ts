import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToplulukService } from '../topluluk/topluluk.service';
import { EslesmeDurumu, OyunModu } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface EslesmeKuyrugaGirDto {
  oyunModu?: OyunModu;
  minOyuncu?: number;
  maxOyuncu?: number;
}

export interface EslesmeDurumuDto {
  id: string;
  durum: EslesmeDurumu;
  beklemeSuresi: number; // saniye
  kuyrukSirasi: number;
  tahminiSure: number; // saniye
  eslesilenToplulukId?: string;
}

@Injectable()
export class EslesmeService {
  private readonly logger = new Logger(EslesmeService.name);

  // Minimum eşleşme için gerekli oyuncu sayısı
  private readonly MIN_ESLESTIRME = 4;
  // Maksimum bekleme süresi (saniye)
  private readonly MAX_BEKLEME_SURESI = 300; // 5 dakika

  constructor(
    private prisma: PrismaService,
    private toplulukService: ToplulukService,
  ) {}

  // Kuyruğa gir
  async kuyrugaGir(oyuncuId: string, dto: EslesmeKuyrugaGirDto): Promise<EslesmeDurumuDto> {
    // Oyuncunun aktif oyunu var mı kontrol et
    const aktifOyun = await this.prisma.toplulukUyesi.findFirst({
      where: {
        oyuncuId,
        durum: 'AKTIF',
        topluluk: {
          durum: { in: ['LOBI', 'DEVAM_EDIYOR'] },
        },
      },
    });

    if (aktifOyun) {
      throw new BadRequestException('Zaten aktif bir oyununuz var');
    }

    // Mevcut kuyruk kaydı var mı?
    const mevcutKayit = await this.prisma.eslesmeSirasi.findUnique({
      where: { oyuncuId },
    });

    if (mevcutKayit && mevcutKayit.durum === 'BEKLIYOR') {
      // Güncelle
      const guncellenmis = await this.prisma.eslesmeSirasi.update({
        where: { id: mevcutKayit.id },
        data: {
          oyunModu: dto.oyunModu || 'NORMAL',
          minOyuncu: dto.minOyuncu || 4,
          maxOyuncu: dto.maxOyuncu || 8,
          guncellendi: new Date(),
        },
      });
      return this.eslesmeDurumuGetir(guncellenmis.id);
    }

    // Premium kontrolü
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      include: {
        premiumUyelikler: {
          where: {
            aktif: true,
            bitis: { gt: new Date() },
          },
        },
      },
    });

    const oncelikli = (oyuncu?.premiumUyelikler?.length || 0) > 0;

    // Yeni kayıt oluştur
    const kayit = await this.prisma.eslesmeSirasi.create({
      data: {
        oyuncuId,
        oyunModu: dto.oyunModu || 'NORMAL',
        minOyuncu: dto.minOyuncu || 4,
        maxOyuncu: dto.maxOyuncu || 8,
        oncelikli,
        durum: 'BEKLIYOR',
      },
    });

    this.logger.log(`Oyuncu ${oyuncuId} kuyruğa girdi`);

    // Anında eşleştirme dene
    await this.eslestirmeYap();

    return this.eslesmeDurumuGetir(kayit.id);
  }

  // Kuyruktan çık
  async kuyrukdanCik(oyuncuId: string): Promise<void> {
    await this.prisma.eslesmeSirasi.updateMany({
      where: {
        oyuncuId,
        durum: 'BEKLIYOR',
      },
      data: {
        durum: 'IPTAL',
      },
    });

    this.logger.log(`Oyuncu ${oyuncuId} kuyruktan çıktı`);
  }

  // Kuyruk durumunu getir
  async kuyrukDurumuGetir(oyuncuId: string): Promise<EslesmeDurumuDto | null> {
    const kayit = await this.prisma.eslesmeSirasi.findUnique({
      where: { oyuncuId },
    });

    if (!kayit || kayit.durum !== 'BEKLIYOR') {
      return null;
    }

    return this.eslesmeDurumuGetir(kayit.id);
  }

  // Eşleşme durumunu getir
  private async eslesmeDurumuGetir(kayitId: string): Promise<EslesmeDurumuDto> {
    const kayit = await this.prisma.eslesmeSirasi.findUnique({
      where: { id: kayitId },
    });

    if (!kayit) {
      throw new BadRequestException('Kuyruk kaydı bulunamadı');
    }

    // Kuyruk sırası hesapla
    const oncekiler = await this.prisma.eslesmeSirasi.count({
      where: {
        durum: 'BEKLIYOR',
        oyunModu: kayit.oyunModu,
        olusturuldu: { lt: kayit.olusturuldu },
      },
    });

    // Aynı modda bekleyen toplam
    const toplamBekleyen = await this.prisma.eslesmeSirasi.count({
      where: {
        durum: 'BEKLIYOR',
        oyunModu: kayit.oyunModu,
      },
    });

    const beklemeSuresi = Math.floor(
      (Date.now() - kayit.olusturuldu.getTime()) / 1000,
    );

    // Tahmini süre hesapla (basit formül)
    const tahminiSure = Math.max(
      0,
      (this.MIN_ESLESTIRME - toplamBekleyen) * 30,
    );

    return {
      id: kayit.id,
      durum: kayit.durum,
      beklemeSuresi,
      kuyrukSirasi: oncekiler + 1,
      tahminiSure,
      eslesilenToplulukId: kayit.eslesilenToplulukId || undefined,
    };
  }

  // Periyodik eşleştirme (her 5 saniye)
  @Cron('*/5 * * * * *')
  async eslestirmeYap(): Promise<void> {
    // Oyun modlarına göre grupla ve eşleştir
    const modlar = Object.values(OyunModu);

    for (const mod of modlar) {
      await this.modIcinEslestir(mod);
    }

    // Zaman aşımı kontrolü
    await this.zamanAsimiKontrol();
  }

  private async modIcinEslestir(oyunModu: OyunModu): Promise<void> {
    // Bekleyen oyuncuları getir (öncelikli olanlar önce, sonra sıraya göre)
    const bekleyenler = await this.prisma.eslesmeSirasi.findMany({
      where: {
        durum: 'BEKLIYOR',
        oyunModu,
      },
      orderBy: [
        { oncelikli: 'desc' },
        { olusturuldu: 'asc' },
      ],
      include: {
        // Oyuncu bilgisi için
      },
    });

    if (bekleyenler.length < this.MIN_ESLESTIRME) {
      return;
    }

    // En az minOyuncu kadar oyuncu var, eşleştir
    const eslestirilenler = bekleyenler.slice(0, Math.min(bekleyenler.length, 8));
    const oyuncuIdleri = eslestirilenler.map((b) => b.oyuncuId);

    try {
      // Topluluk oluştur
      const ilkOyuncu = oyuncuIdleri[0];
      const topluluk = await this.toplulukService.toplulukOlustur(ilkOyuncu, {
        isim: `Eşleşme ${Date.now().toString(36).toUpperCase()}`,
        gizliMi: true, // Eşleşme lobileri gizli
        maxOyuncu: 8,
        oyunModu,
      });

      // Diğer oyuncuları katıl
      for (let i = 1; i < oyuncuIdleri.length; i++) {
        try {
          if (topluluk.kod) {
            await this.toplulukService.toplulugaKatil(
              oyuncuIdleri[i],
              topluluk.kod,
            );
          }
        } catch (e: any) {
          this.logger.warn(`Oyuncu ${oyuncuIdleri[i]} katılamadı: ${e.message}`);
        }
      }

      // Kuyruk kayıtlarını güncelle
      await this.prisma.eslesmeSirasi.updateMany({
        where: {
          oyuncuId: { in: oyuncuIdleri },
          durum: 'BEKLIYOR',
        },
        data: {
          durum: 'ESLESTI',
          eslestiAt: new Date(),
          eslesilenToplulukId: topluluk.id,
        },
      });

      this.logger.log(
        `${eslestirilenler.length} oyuncu eşleştirildi -> Topluluk: ${topluluk.id}`,
      );
    } catch (error: any) {
      this.logger.error(`Eşleştirme hatası: ${error.message}`);
    }
  }

  private async zamanAsimiKontrol(): Promise<void> {
    const zamanAsimiSiniri = new Date(
      Date.now() - this.MAX_BEKLEME_SURESI * 1000,
    );

    await this.prisma.eslesmeSirasi.updateMany({
      where: {
        durum: 'BEKLIYOR',
        olusturuldu: { lt: zamanAsimiSiniri },
      },
      data: {
        durum: 'ZAMAN_ASIMI',
      },
    });
  }

  // Kuyruk istatistikleri
  async kuyrukIstatistikleri(): Promise<{
    toplamBekleyen: number;
    modlaraGore: Record<string, number>;
    ortalamaBekmeSuresi: number;
  }> {
    const bekleyenler = await this.prisma.eslesmeSirasi.findMany({
      where: { durum: 'BEKLIYOR' },
    });

    const modlaraGore: Record<string, number> = {};
    let toplamBekleme = 0;

    for (const b of bekleyenler) {
      modlaraGore[b.oyunModu] = (modlaraGore[b.oyunModu] || 0) + 1;
      toplamBekleme += (Date.now() - b.olusturuldu.getTime()) / 1000;
    }

    return {
      toplamBekleyen: bekleyenler.length,
      modlaraGore,
      ortalamaBekmeSuresi:
        bekleyenler.length > 0 ? Math.floor(toplamBekleme / bekleyenler.length) : 0,
    };
  }
}
