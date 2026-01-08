import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class IstatistikService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Liderlik tablosu (5 dakika cache)
  async liderlikTablosuGetir(limit: number = 20) {
    const cacheKey = `${CacheService.KEYS.LIDERLIK}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const oyuncular = await this.prisma.oyuncu.findMany({
          where: { hesapDurumu: 'AKTIF' },
          orderBy: [
            { tamamlananOyunlar: 'desc' },
            { yapilanOneriler: 'desc' },
          ],
          take: limit,
          select: {
            id: true,
            kullaniciAdi: true,
            oynananOyunlar: true,
            tamamlananOyunlar: true,
            yapilanOneriler: true,
            verilenOylar: true,
            olusturuldu: true,
          },
        });

        return oyuncular.map((o, index) => ({
          sira: index + 1,
          id: o.id,
          kullaniciAdi: o.kullaniciAdi,
          oynananOyunlar: o.oynananOyunlar,
          tamamlananOyunlar: o.tamamlananOyunlar,
          yapilanOneriler: o.yapilanOneriler,
          verilenOylar: o.verilenOylar,
          kayitTarihi: o.olusturuldu,
        }));
      },
      CacheService.TTL.LONG,
    );
  }

  // Genel istatistikler (1 dakika cache)
  async genelIstatistiklerGetir() {
    return this.cache.getOrSet(
      CacheService.KEYS.GENEL_ISTATISTIK,
      async () => {
        const [
          toplamOyuncu,
          toplamTopluluk,
          tamamlananOyun,
          toplamOneri,
          toplamOy,
          toplamMesaj,
        ] = await Promise.all([
          this.prisma.oyuncu.count({ where: { hesapDurumu: 'AKTIF' } }),
          this.prisma.topluluk.count(),
          this.prisma.topluluk.count({ where: { durum: 'TAMAMLANDI' } }),
          this.prisma.oneri.count(),
          this.prisma.oy.count(),
          this.prisma.mesaj.count(),
        ]);

        // Son 7 gun aktivite
        const yediGunOnce = new Date();
        yediGunOnce.setDate(yediGunOnce.getDate() - 7);

        const sonYediGunOyunlar = await this.prisma.topluluk.count({
          where: {
            basladiAt: { gte: yediGunOnce },
          },
        });

        return {
          toplamOyuncu,
          toplamTopluluk,
          tamamlananOyun,
          toplamOneri,
          toplamOy,
          toplamMesaj,
          sonYediGunOyunlar,
        };
      },
      CacheService.TTL.MEDIUM,
    );
  }

  // Oyun sonuc dagilimi (5 dakika cache)
  async oyunSonucDagilimiGetir() {
    return this.cache.getOrSet(
      CacheService.KEYS.SONUC_DAGILIMI,
      async () => {
        const sonuclar = await this.prisma.oyunDurumu.groupBy({
          by: ['sonuc'],
          _count: true,
          where: {
            sonuc: { not: null },
          },
        });

        return sonuclar.map((s) => ({
          sonuc: s.sonuc,
          sayi: s._count,
        }));
      },
      CacheService.TTL.LONG,
    );
  }
}
