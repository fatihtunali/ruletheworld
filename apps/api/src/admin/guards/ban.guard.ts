import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BanGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return true; // Auth guard zaten kontrol edecek
    }

    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: user.id },
      select: {
        hesapDurumu: true,
        banSebebi: true,
        banBitisi: true
      },
    });

    if (!oyuncu) {
      return true; // Auth guard zaten kontrol edecek
    }

    // Ban durumunu kontrol et
    if (oyuncu.hesapDurumu === 'BANLANDI') {
      // Geçici ban ise süresini kontrol et
      if (oyuncu.banBitisi && new Date(oyuncu.banBitisi) < new Date()) {
        // Ban süresi dolmuş, hesabı aktifleştir
        await this.prisma.oyuncu.update({
          where: { id: user.id },
          data: {
            hesapDurumu: 'AKTIF',
            banSebebi: null,
            banBitisi: null
          },
        });
        return true;
      }

      const banBitisStr = oyuncu.banBitisi
        ? `Ban bitiş: ${new Date(oyuncu.banBitisi).toLocaleDateString('tr-TR')}`
        : 'Kalıcı ban';

      throw new ForbiddenException(
        `Hesabınız banlandı. Sebep: ${oyuncu.banSebebi || 'Belirtilmedi'}. ${banBitisStr}`
      );
    }

    if (oyuncu.hesapDurumu === 'ASKIDA') {
      throw new ForbiddenException('Hesabınız askıya alındı. Lütfen yöneticiyle iletişime geçin.');
    }

    if (oyuncu.hesapDurumu === 'SILINDI') {
      throw new ForbiddenException('Bu hesap silinmiş.');
    }

    return true;
  }
}
