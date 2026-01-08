import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SistemRolu, HesapDurumu, BanTipi, ModeasyonTipi, ToplulukDurumu, DuyuruTipi } from '@prisma/client';
import { BanOyuncuDto, UnbanOyuncuDto, RolDegistirDto, KullaniciAraDto, DuyuruOlusturDto, DuyuruGuncelleDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============ İSTATİSTİKLER ============

  async istatistikleriGetir() {
    const [
      toplamKullanici,
      aktifKullanici,
      banliKullanici,
      toplamTopluluk,
      aktifTopluluk,
      toplamOyun,
      bugunKayit,
      bugunOyun,
    ] = await Promise.all([
      this.prisma.oyuncu.count(),
      this.prisma.oyuncu.count({ where: { hesapDurumu: HesapDurumu.AKTIF } }),
      this.prisma.oyuncu.count({ where: { hesapDurumu: HesapDurumu.BANLANDI } }),
      this.prisma.topluluk.count(),
      this.prisma.topluluk.count({ where: { durum: { in: [ToplulukDurumu.LOBI, ToplulukDurumu.DEVAM_EDIYOR] } } }),
      this.prisma.topluluk.count({ where: { durum: ToplulukDurumu.TAMAMLANDI } }),
      this.prisma.oyuncu.count({
        where: {
          olusturuldu: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      this.prisma.topluluk.count({
        where: {
          basladiAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
    ]);

    // Son 7 günlük kayıt grafiği
    const sonYediGun = await this.prisma.$queryRaw<{ tarih: Date; sayi: bigint }[]>`
      SELECT DATE(olusturuldu) as tarih, COUNT(*) as sayi
      FROM oyuncular
      WHERE olusturuldu >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(olusturuldu)
      ORDER BY tarih DESC
    `;

    return {
      kullanicilar: {
        toplam: toplamKullanici,
        aktif: aktifKullanici,
        banli: banliKullanici,
        bugunKayit,
      },
      topluluklar: {
        toplam: toplamTopluluk,
        aktif: aktifTopluluk,
        tamamlanan: toplamOyun,
        bugunOyun,
      },
      sonYediGunKayit: sonYediGun.map(g => ({
        tarih: g.tarih,
        sayi: Number(g.sayi)
      })),
    };
  }

  // ============ KULLANICI YÖNETİMİ ============

  async kullanicilariGetir(dto: KullaniciAraDto) {
    const { arama, rol, hesapDurumu, sayfa = 1, limit = 20 } = dto;
    const skip = (sayfa - 1) * limit;

    const where: Record<string, unknown> = {};

    if (arama) {
      where.OR = [
        { kullaniciAdi: { contains: arama, mode: 'insensitive' } },
        { email: { contains: arama, mode: 'insensitive' } },
      ];
    }

    if (rol) {
      where.sistemRolu = rol;
    }

    if (hesapDurumu) {
      where.hesapDurumu = hesapDurumu;
    }

    const [kullanicilar, toplam] = await Promise.all([
      this.prisma.oyuncu.findMany({
        where,
        select: {
          id: true,
          kullaniciAdi: true,
          email: true,
          sistemRolu: true,
          hesapDurumu: true,
          banSebebi: true,
          banBitisi: true,
          oynananOyunlar: true,
          tamamlananOyunlar: true,
          olusturuldu: true,
          sonAktiflik: true,
        },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.oyuncu.count({ where }),
    ]);

    return {
      kullanicilar,
      sayfalama: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  }

  async kullaniciDetayGetir(oyuncuId: string) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      include: {
        alinanBanlar: {
          orderBy: { baslangic: 'desc' },
          take: 10,
          include: {
            yetkili: { select: { kullaniciAdi: true } }
          }
        },
        uyelikler: {
          take: 10,
          orderBy: { katildiAt: 'desc' },
          include: {
            topluluk: { select: { isim: true, durum: true } }
          }
        },
        _count: {
          select: {
            mesajlar: true,
            oneriler: true,
            oylar: true,
          }
        }
      },
    });

    if (!oyuncu) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return oyuncu;
  }

  async oyuncuyuBanla(oyuncuId: string, yetkiliId: string, dto: BanOyuncuDto) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { sistemRolu: true, hesapDurumu: true },
    });

    if (!oyuncu) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Admin banlanamaz
    if (oyuncu.sistemRolu === SistemRolu.ADMIN) {
      throw new ForbiddenException('Admin kullanıcılar banlanamaz');
    }

    // Zaten banlı mı?
    if (oyuncu.hesapDurumu === HesapDurumu.BANLANDI) {
      throw new BadRequestException('Kullanıcı zaten banlı');
    }

    const banBitisi = dto.tip === BanTipi.GECICI && dto.bitis
      ? new Date(dto.bitis)
      : null;

    await this.prisma.$transaction([
      // Kullanıcıyı banla
      this.prisma.oyuncu.update({
        where: { id: oyuncuId },
        data: {
          hesapDurumu: HesapDurumu.BANLANDI,
          banSebebi: dto.sebep,
          banBitisi,
        },
      }),
      // Ban kaydı oluştur
      this.prisma.ban.create({
        data: {
          oyuncuId,
          yetkiliId,
          sebep: dto.sebep,
          tip: dto.tip || BanTipi.GECICI,
          bitis: banBitisi,
        },
      }),
      // Moderasyon logu
      this.prisma.moderasyon.create({
        data: {
          yetkiliId,
          aksiyon: ModeasyonTipi.KULLANICI_BAN,
          hedefTip: 'oyuncu',
          hedefId: oyuncuId,
          detay: JSON.parse(JSON.stringify({ sebep: dto.sebep, tip: dto.tip, bitis: banBitisi })),
        },
      }),
    ]);

    return { mesaj: 'Kullanıcı başarıyla banlandı' };
  }

  async oyuncununBaniniKaldir(oyuncuId: string, yetkiliId: string, dto: UnbanOyuncuDto) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { hesapDurumu: true },
    });

    if (!oyuncu) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (oyuncu.hesapDurumu !== HesapDurumu.BANLANDI) {
      throw new BadRequestException('Kullanıcı banlı değil');
    }

    await this.prisma.$transaction([
      // Kullanıcıyı aktifleştir
      this.prisma.oyuncu.update({
        where: { id: oyuncuId },
        data: {
          hesapDurumu: HesapDurumu.AKTIF,
          banSebebi: null,
          banBitisi: null,
        },
      }),
      // Aktif ban kaydını iptal et
      this.prisma.ban.updateMany({
        where: {
          oyuncuId,
          iptalEdildi: false,
        },
        data: {
          iptalEdildi: true,
          iptalSebebi: dto.sebep || 'Yetkili tarafından kaldırıldı',
        },
      }),
      // Moderasyon logu
      this.prisma.moderasyon.create({
        data: {
          yetkiliId,
          aksiyon: ModeasyonTipi.KULLANICI_UNBAN,
          hedefTip: 'oyuncu',
          hedefId: oyuncuId,
          detay: JSON.parse(JSON.stringify({ sebep: dto.sebep })),
        },
      }),
    ]);

    return { mesaj: 'Kullanıcının banı kaldırıldı' };
  }

  async rolDegistir(oyuncuId: string, yetkiliId: string, dto: RolDegistirDto) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { sistemRolu: true },
    });

    if (!oyuncu) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const eskiRol = oyuncu.sistemRolu;

    await this.prisma.$transaction([
      this.prisma.oyuncu.update({
        where: { id: oyuncuId },
        data: { sistemRolu: dto.yeniRol },
      }),
      this.prisma.moderasyon.create({
        data: {
          yetkiliId,
          aksiyon: ModeasyonTipi.ROL_DEGISTIR,
          hedefTip: 'oyuncu',
          hedefId: oyuncuId,
          detay: JSON.parse(JSON.stringify({ eskiRol, yeniRol: dto.yeniRol })),
        },
      }),
    ]);

    return { mesaj: `Kullanıcı rolü ${dto.yeniRol} olarak değiştirildi` };
  }

  // ============ TOPLULUK YÖNETİMİ ============

  async topluluklariGetir(sayfa: number = 1, limit: number = 20) {
    const skip = (sayfa - 1) * limit;

    const [topluluklar, toplam] = await Promise.all([
      this.prisma.topluluk.findMany({
        include: {
          _count: { select: { uyeler: true, mesajlar: true } },
        },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.topluluk.count(),
    ]);

    return {
      topluluklar,
      sayfalama: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  }

  async toplulukSil(toplulukId: string, yetkiliId: string, sebep: string) {
    const topluluk = await this.prisma.topluluk.findUnique({
      where: { id: toplulukId },
    });

    if (!topluluk) {
      throw new NotFoundException('Topluluk bulunamadı');
    }

    await this.prisma.$transaction([
      this.prisma.topluluk.delete({ where: { id: toplulukId } }),
      this.prisma.moderasyon.create({
        data: {
          yetkiliId,
          aksiyon: ModeasyonTipi.TOPLULUK_SIL,
          hedefTip: 'topluluk',
          hedefId: toplulukId,
          detay: JSON.parse(JSON.stringify({ toplulukIsmi: topluluk.isim, sebep })),
        },
      }),
    ]);

    return { mesaj: 'Topluluk silindi' };
  }

  // ============ MODERASYON LOGLARI ============

  async moderasyonLoglariniGetir(sayfa: number = 1, limit: number = 50) {
    const skip = (sayfa - 1) * limit;

    const [loglar, toplam] = await Promise.all([
      this.prisma.moderasyon.findMany({
        include: {
          yetkili: { select: { kullaniciAdi: true } },
        },
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderasyon.count(),
    ]);

    return {
      loglar,
      sayfalama: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  }

  // ============ İLK ADMIN OLUŞTURMA ============

  async ilkAdminOlustur(oyuncuId: string) {
    // Sistemde admin var mı kontrol et
    const adminSayisi = await this.prisma.oyuncu.count({
      where: { sistemRolu: SistemRolu.ADMIN },
    });

    if (adminSayisi > 0) {
      throw new BadRequestException('Sistemde zaten admin bulunuyor');
    }

    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: { sistemRolu: SistemRolu.ADMIN },
    });

    return { mesaj: 'İlk admin başarıyla oluşturuldu' };
  }

  // ============ SİSTEM DUYURULARI ============

  async duyuruOlustur(yetkiliId: string, dto: DuyuruOlusturDto) {
    const duyuru = await this.prisma.sistemDuyurusu.create({
      data: {
        baslik: dto.baslik,
        icerik: dto.icerik,
        tip: dto.tip || DuyuruTipi.BILGI,
        baslangic: dto.baslangic ? new Date(dto.baslangic) : new Date(),
        bitis: dto.bitis ? new Date(dto.bitis) : null,
        olusturanId: yetkiliId,
      },
    });

    // Moderasyon logu
    await this.prisma.moderasyon.create({
      data: {
        yetkiliId,
        aksiyon: ModeasyonTipi.DUYURU_OLUSTUR,
        hedefTip: 'duyuru',
        hedefId: duyuru.id,
        detay: JSON.parse(JSON.stringify({ baslik: dto.baslik, tip: dto.tip })),
      },
    });

    return duyuru;
  }

  async duyuruGuncelle(duyuruId: string, yetkiliId: string, dto: DuyuruGuncelleDto) {
    const mevcutDuyuru = await this.prisma.sistemDuyurusu.findUnique({
      where: { id: duyuruId },
    });

    if (!mevcutDuyuru) {
      throw new NotFoundException('Duyuru bulunamadı');
    }

    const duyuru = await this.prisma.sistemDuyurusu.update({
      where: { id: duyuruId },
      data: {
        baslik: dto.baslik,
        icerik: dto.icerik,
        tip: dto.tip,
        aktif: dto.aktif,
        baslangic: dto.baslangic ? new Date(dto.baslangic) : undefined,
        bitis: dto.bitis ? new Date(dto.bitis) : undefined,
      },
    });

    // Moderasyon logu
    await this.prisma.moderasyon.create({
      data: {
        yetkiliId,
        aksiyon: ModeasyonTipi.DUYURU_GUNCELLE,
        hedefTip: 'duyuru',
        hedefId: duyuruId,
        detay: JSON.parse(JSON.stringify(dto)),
      },
    });

    return duyuru;
  }

  async duyuruSil(duyuruId: string, yetkiliId: string) {
    const duyuru = await this.prisma.sistemDuyurusu.findUnique({
      where: { id: duyuruId },
    });

    if (!duyuru) {
      throw new NotFoundException('Duyuru bulunamadı');
    }

    await this.prisma.$transaction([
      this.prisma.sistemDuyurusu.delete({ where: { id: duyuruId } }),
      this.prisma.moderasyon.create({
        data: {
          yetkiliId,
          aksiyon: ModeasyonTipi.DUYURU_SIL,
          hedefTip: 'duyuru',
          hedefId: duyuruId,
          detay: JSON.parse(JSON.stringify({ baslik: duyuru.baslik })),
        },
      }),
    ]);

    return { mesaj: 'Duyuru silindi' };
  }

  async duyurulariGetir(sayfa: number = 1, limit: number = 20) {
    const skip = (sayfa - 1) * limit;

    const [duyurular, toplam] = await Promise.all([
      this.prisma.sistemDuyurusu.findMany({
        orderBy: { olusturuldu: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sistemDuyurusu.count(),
    ]);

    return {
      duyurular,
      sayfalama: {
        toplam,
        sayfa,
        limit,
        toplamSayfa: Math.ceil(toplam / limit),
      },
    };
  }

  // Herkese açık: Aktif duyuruları getir
  async aktifDuyurulariGetir() {
    const simdi = new Date();

    const duyurular = await this.prisma.sistemDuyurusu.findMany({
      where: {
        aktif: true,
        baslangic: { lte: simdi },
        OR: [
          { bitis: null },
          { bitis: { gte: simdi } },
        ],
      },
      orderBy: [
        { tip: 'desc' }, // ONEMLI önce
        { olusturuldu: 'desc' },
      ],
      select: {
        id: true,
        baslik: true,
        icerik: true,
        tip: true,
        baslangic: true,
        bitis: true,
      },
    });

    return duyurular;
  }
}
