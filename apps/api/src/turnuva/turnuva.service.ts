import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { TurnuvaDurumu } from '@prisma/client';

export interface TurnuvaOzeti {
  id: string;
  isim: string;
  aciklama?: string;
  durum: TurnuvaDurumu;
  maxKatilimci: number;
  mevcutKatilimci: number;
  kayitBitis: string;
  baslamaZamani?: string;
}

export interface TurnuvaDetay extends TurnuvaOzeti {
  katilimcilar: {
    id: string;
    kullaniciAdi: string;
    puan: number;
    kazanilanMac: number;
    kayipMac: number;
    sira?: number;
  }[];
  maclar: {
    id: string;
    turNumarasi: number;
    macNumarasi: number;
    durum: string;
    kazananId?: string;
  }[];
}

@Injectable()
export class TurnuvaService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Turnuva olustur
  async turnuvaOlustur(
    olusturanId: string,
    data: {
      isim: string;
      aciklama?: string;
      maxKatilimci?: number;
      minKatilimci?: number;
      oyunBasinaOyuncu?: number;
      kayitBitis: Date;
      baslamaZamani?: Date;
    },
  ): Promise<TurnuvaOzeti> {
    const turnuva = await this.prisma.turnuva.create({
      data: {
        isim: data.isim,
        aciklama: data.aciklama,
        maxKatilimci: data.maxKatilimci || 16,
        minKatilimci: data.minKatilimci || 4,
        oyunBasinaOyuncu: data.oyunBasinaOyuncu || 4,
        kayitBitis: data.kayitBitis,
        baslamaZamani: data.baslamaZamani,
        olusturanId,
      },
      include: {
        _count: { select: { katilimcilar: true } },
      },
    });

    return {
      id: turnuva.id,
      isim: turnuva.isim,
      aciklama: turnuva.aciklama || undefined,
      durum: turnuva.durum,
      maxKatilimci: turnuva.maxKatilimci,
      mevcutKatilimci: turnuva._count.katilimcilar,
      kayitBitis: turnuva.kayitBitis.toISOString(),
      baslamaZamani: turnuva.baslamaZamani?.toISOString(),
    };
  }

  // Turnuvalari listele
  async turnuvalariListele(
    sayfa: number = 1,
    limit: number = 20,
    durum?: TurnuvaDurumu,
  ): Promise<{ turnuvalar: TurnuvaOzeti[]; toplam: number }> {
    const skip = (sayfa - 1) * limit;
    const where = durum ? { durum } : {};

    const [turnuvalar, toplam] = await Promise.all([
      this.prisma.turnuva.findMany({
        where,
        include: {
          _count: { select: { katilimcilar: true } },
        },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.turnuva.count({ where }),
    ]);

    return {
      turnuvalar: turnuvalar.map((t) => ({
        id: t.id,
        isim: t.isim,
        aciklama: t.aciklama || undefined,
        durum: t.durum,
        maxKatilimci: t.maxKatilimci,
        mevcutKatilimci: t._count.katilimcilar,
        kayitBitis: t.kayitBitis.toISOString(),
        baslamaZamani: t.baslamaZamani?.toISOString(),
      })),
      toplam,
    };
  }

  // Turnuva detayi
  async turnuvaDetay(id: string): Promise<TurnuvaDetay | null> {
    const turnuva = await this.prisma.turnuva.findUnique({
      where: { id },
      include: {
        katilimcilar: {
          include: {
            oyuncu: { select: { id: true, kullaniciAdi: true } },
          },
          orderBy: { puan: 'desc' },
        },
        maclar: {
          orderBy: [{ turNumarasi: 'asc' }, { macNumarasi: 'asc' }],
        },
        _count: { select: { katilimcilar: true } },
      },
    });

    if (!turnuva) return null;

    return {
      id: turnuva.id,
      isim: turnuva.isim,
      aciklama: turnuva.aciklama || undefined,
      durum: turnuva.durum,
      maxKatilimci: turnuva.maxKatilimci,
      mevcutKatilimci: turnuva._count.katilimcilar,
      kayitBitis: turnuva.kayitBitis.toISOString(),
      baslamaZamani: turnuva.baslamaZamani?.toISOString(),
      katilimcilar: turnuva.katilimcilar.map((k) => ({
        id: k.oyuncu.id,
        kullaniciAdi: k.oyuncu.kullaniciAdi,
        puan: k.puan,
        kazanilanMac: k.kazanilanMac,
        kayipMac: k.kayipMac,
        sira: k.sira || undefined,
      })),
      maclar: turnuva.maclar.map((m) => ({
        id: m.id,
        turNumarasi: m.turNumarasi,
        macNumarasi: m.macNumarasi,
        durum: m.durum,
        kazananId: m.kazananId || undefined,
      })),
    };
  }

  // Turnuvaya katil
  async turnuvayaKatil(turnuvaId: string, oyuncuId: string): Promise<{ basarili: boolean; mesaj: string }> {
    const turnuva = await this.prisma.turnuva.findUnique({
      where: { id: turnuvaId },
      include: { _count: { select: { katilimcilar: true } } },
    });

    if (!turnuva) {
      throw new NotFoundException('Turnuva bulunamadi');
    }

    if (turnuva.durum !== 'KAYIT_ACIK') {
      throw new BadRequestException('Turnuva kayitlari kapali');
    }

    if (new Date() > turnuva.kayitBitis) {
      throw new BadRequestException('Kayit suresi dolmus');
    }

    if (turnuva._count.katilimcilar >= turnuva.maxKatilimci) {
      throw new BadRequestException('Turnuva dolu');
    }

    // Zaten katilmis mi kontrol et
    const mevcutKatilim = await this.prisma.turnuvaKatilimci.findUnique({
      where: { turnuvaId_oyuncuId: { turnuvaId, oyuncuId } },
    });

    if (mevcutKatilim) {
      throw new BadRequestException('Zaten bu turnuvaya katilmissiniz');
    }

    await this.prisma.turnuvaKatilimci.create({
      data: { turnuvaId, oyuncuId },
    });

    // Cache invalidate
    await this.cache.del(CacheService.KEYS.AKTIF_TURNUVALAR);
    await this.cache.del(CacheService.KEYS.TURNUVA(turnuvaId));

    return { basarili: true, mesaj: 'Turnuvaya basariyla katildiniz' };
  }

  // Turnuvadan ayril
  async turnuvadanAyril(turnuvaId: string, oyuncuId: string): Promise<{ basarili: boolean; mesaj: string }> {
    const turnuva = await this.prisma.turnuva.findUnique({
      where: { id: turnuvaId },
    });

    if (!turnuva) {
      throw new NotFoundException('Turnuva bulunamadi');
    }

    if (turnuva.durum !== 'KAYIT_ACIK') {
      throw new BadRequestException('Turnuva basladiktan sonra ayrilamazsiniz');
    }

    const katilim = await this.prisma.turnuvaKatilimci.findUnique({
      where: { turnuvaId_oyuncuId: { turnuvaId, oyuncuId } },
    });

    if (!katilim) {
      throw new BadRequestException('Bu turnuvaya katilmamissiniz');
    }

    await this.prisma.turnuvaKatilimci.delete({
      where: { id: katilim.id },
    });

    // Cache invalidate
    await this.cache.del(CacheService.KEYS.AKTIF_TURNUVALAR);
    await this.cache.del(CacheService.KEYS.TURNUVA(turnuvaId));

    return { basarili: true, mesaj: 'Turnuvadan ayrildiniz' };
  }

  // Turnuvayi baslat
  async turnuvayiBaslat(turnuvaId: string): Promise<{ basarili: boolean; mesaj: string }> {
    const turnuva = await this.prisma.turnuva.findUnique({
      where: { id: turnuvaId },
      include: {
        katilimcilar: true,
        _count: { select: { katilimcilar: true } },
      },
    });

    if (!turnuva) {
      throw new NotFoundException('Turnuva bulunamadi');
    }

    if (turnuva.durum !== 'KAYIT_ACIK' && turnuva.durum !== 'KAYIT_KAPALI') {
      throw new BadRequestException('Turnuva zaten baslamis veya bitmis');
    }

    if (turnuva._count.katilimcilar < turnuva.minKatilimci) {
      throw new BadRequestException(`En az ${turnuva.minKatilimci} katilimci gerekli`);
    }

    // Turnuva durumunu guncelle
    await this.prisma.turnuva.update({
      where: { id: turnuvaId },
      data: {
        durum: 'DEVAM_EDIYOR',
        baslamaZamani: new Date(),
      },
    });

    return { basarili: true, mesaj: 'Turnuva basladi' };
  }

  // Aktif turnuvalari getir (kayit acik olanlar) - 30 saniye cache
  async aktifTurnuvalar(): Promise<TurnuvaOzeti[]> {
    return this.cache.getOrSet(
      CacheService.KEYS.AKTIF_TURNUVALAR,
      async () => {
        const turnuvalar = await this.prisma.turnuva.findMany({
          where: {
            durum: 'KAYIT_ACIK',
            kayitBitis: { gte: new Date() },
          },
          include: {
            _count: { select: { katilimcilar: true } },
          },
          orderBy: { kayitBitis: 'asc' },
        });

        return turnuvalar.map((t) => ({
          id: t.id,
          isim: t.isim,
          aciklama: t.aciklama || undefined,
          durum: t.durum,
          maxKatilimci: t.maxKatilimci,
          mevcutKatilimci: t._count.katilimcilar,
          kayitBitis: t.kayitBitis.toISOString(),
          baslamaZamani: t.baslamaZamani?.toISOString(),
        }));
      },
      CacheService.TTL.SHORT,
    );
  }

  // Kullanicinin turnuvalari
  async kullanicininTurnuvalari(oyuncuId: string): Promise<TurnuvaOzeti[]> {
    const katilimlar = await this.prisma.turnuvaKatilimci.findMany({
      where: { oyuncuId },
      include: {
        turnuva: {
          include: { _count: { select: { katilimcilar: true } } },
        },
      },
      orderBy: { katildiAt: 'desc' },
    });

    return katilimlar.map((k) => ({
      id: k.turnuva.id,
      isim: k.turnuva.isim,
      aciklama: k.turnuva.aciklama || undefined,
      durum: k.turnuva.durum,
      maxKatilimci: k.turnuva.maxKatilimci,
      mevcutKatilimci: k.turnuva._count.katilimcilar,
      kayitBitis: k.turnuva.kayitBitis.toISOString(),
      baslamaZamani: k.turnuva.baslamaZamani?.toISOString(),
    }));
  }
}
