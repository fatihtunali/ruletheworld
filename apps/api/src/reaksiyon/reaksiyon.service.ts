import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// İzin verilen emojiler
export const IZIN_VERILEN_EMOJILER = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯'];

export interface ReaksiyonOzeti {
  emoji: string;
  sayi: number;
  benReaksiyonVerdimMi: boolean;
}

@Injectable()
export class ReaksiyonService {
  constructor(private prisma: PrismaService) {}

  // Mesaja reaksiyon ekle veya kaldır (toggle)
  async reaksiyonToggle(
    mesajId: string,
    oyuncuId: string,
    emoji: string,
  ): Promise<{ eklendi: boolean; reaksiyonlar: ReaksiyonOzeti[] }> {
    // Emoji kontrolü
    if (!IZIN_VERILEN_EMOJILER.includes(emoji)) {
      throw new BadRequestException(`Geçersiz emoji. İzin verilenler: ${IZIN_VERILEN_EMOJILER.join(', ')}`);
    }

    // Mesaj var mı kontrol et
    const mesaj = await this.prisma.mesaj.findUnique({
      where: { id: mesajId },
    });

    if (!mesaj) {
      throw new NotFoundException('Mesaj bulunamadı');
    }

    // Mevcut reaksiyon var mı kontrol et
    const mevcutReaksiyon = await this.prisma.mesajReaksiyon.findUnique({
      where: {
        mesajId_oyuncuId_emoji: {
          mesajId,
          oyuncuId,
          emoji,
        },
      },
    });

    let eklendi = false;

    if (mevcutReaksiyon) {
      // Kaldır
      await this.prisma.mesajReaksiyon.delete({
        where: { id: mevcutReaksiyon.id },
      });
    } else {
      // Ekle
      await this.prisma.mesajReaksiyon.create({
        data: {
          mesajId,
          oyuncuId,
          emoji,
        },
      });
      eklendi = true;
    }

    // Güncel reaksiyonları getir
    const reaksiyonlar = await this.mesajReaksiyonlariGetir(mesajId, oyuncuId);

    return { eklendi, reaksiyonlar };
  }

  // Mesajın reaksiyonlarını getir
  async mesajReaksiyonlariGetir(
    mesajId: string,
    oyuncuId?: string,
  ): Promise<ReaksiyonOzeti[]> {
    const reaksiyonlar = await this.prisma.mesajReaksiyon.groupBy({
      by: ['emoji'],
      where: { mesajId },
      _count: { emoji: true },
    });

    // Oyuncunun kendi reaksiyonlarını al
    let oyuncuReaksiyonlari: Set<string> = new Set();
    if (oyuncuId) {
      const benimReaksiyonlarim = await this.prisma.mesajReaksiyon.findMany({
        where: { mesajId, oyuncuId },
        select: { emoji: true },
      });
      oyuncuReaksiyonlari = new Set(benimReaksiyonlarim.map((r) => r.emoji));
    }

    return reaksiyonlar.map((r) => ({
      emoji: r.emoji,
      sayi: r._count.emoji,
      benReaksiyonVerdimMi: oyuncuReaksiyonlari.has(r.emoji),
    }));
  }

  // Birden fazla mesajın reaksiyonlarını getir (performans için)
  async cokluMesajReaksiyonlariGetir(
    mesajIdler: string[],
    oyuncuId?: string,
  ): Promise<Map<string, ReaksiyonOzeti[]>> {
    const tumReaksiyonlar = await this.prisma.mesajReaksiyon.findMany({
      where: { mesajId: { in: mesajIdler } },
    });

    // Mesaj bazında grupla
    const mesajReaksiyonMap = new Map<string, Map<string, { sayi: number; oyuncular: Set<string> }>>();

    for (const reaksiyon of tumReaksiyonlar) {
      if (!mesajReaksiyonMap.has(reaksiyon.mesajId)) {
        mesajReaksiyonMap.set(reaksiyon.mesajId, new Map());
      }
      const emojiMap = mesajReaksiyonMap.get(reaksiyon.mesajId)!;

      if (!emojiMap.has(reaksiyon.emoji)) {
        emojiMap.set(reaksiyon.emoji, { sayi: 0, oyuncular: new Set() });
      }
      const emojiData = emojiMap.get(reaksiyon.emoji)!;
      emojiData.sayi++;
      emojiData.oyuncular.add(reaksiyon.oyuncuId);
    }

    // Sonuç oluştur
    const sonuc = new Map<string, ReaksiyonOzeti[]>();

    for (const mesajId of mesajIdler) {
      const emojiMap = mesajReaksiyonMap.get(mesajId);
      if (!emojiMap) {
        sonuc.set(mesajId, []);
        continue;
      }

      const reaksiyonlar: ReaksiyonOzeti[] = [];
      for (const [emoji, data] of emojiMap.entries()) {
        reaksiyonlar.push({
          emoji,
          sayi: data.sayi,
          benReaksiyonVerdimMi: oyuncuId ? data.oyuncular.has(oyuncuId) : false,
        });
      }
      sonuc.set(mesajId, reaksiyonlar);
    }

    return sonuc;
  }

  // Belirli bir emojiye reaksiyon veren oyuncuları getir
  async reaksiyonVerenOyunculariGetir(
    mesajId: string,
    emoji: string,
  ): Promise<{ id: string; kullaniciAdi: string }[]> {
    const reaksiyonlar = await this.prisma.mesajReaksiyon.findMany({
      where: { mesajId, emoji },
      include: {
        oyuncu: {
          select: { id: true, kullaniciAdi: true },
        },
      },
      orderBy: { olusturuldu: 'asc' },
    });

    return reaksiyonlar.map((r) => ({
      id: r.oyuncu.id,
      kullaniciAdi: r.oyuncu.kullaniciAdi,
    }));
  }

  // İzin verilen emojileri getir
  izinVerilenEmojileriGetir(): string[] {
    return IZIN_VERILEN_EMOJILER;
  }
}
