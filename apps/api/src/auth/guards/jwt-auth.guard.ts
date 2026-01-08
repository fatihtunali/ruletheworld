import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma?: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Önce JWT doğrulaması yap
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Kullanıcının ban durumunu kontrol et
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.id && this.prisma) {
      const oyuncu = await this.prisma.oyuncu.findUnique({
        where: { id: user.id },
        select: {
          hesapDurumu: true,
          banSebebi: true,
          banBitisi: true,
        },
      });

      if (oyuncu) {
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
                banBitisi: null,
              },
            });
          } else {
            const banBitisStr = oyuncu.banBitisi
              ? `Ban bitiş: ${new Date(oyuncu.banBitisi).toLocaleDateString('tr-TR')}`
              : 'Kalıcı ban';

            throw new ForbiddenException(
              `Hesabınız banlandı. Sebep: ${oyuncu.banSebebi || 'Belirtilmedi'}. ${banBitisStr}`
            );
          }
        }

        if (oyuncu.hesapDurumu === 'ASKIDA') {
          throw new ForbiddenException('Hesabınız askıya alındı.');
        }

        if (oyuncu.hesapDurumu === 'SILINDI') {
          throw new ForbiddenException('Bu hesap silinmiş.');
        }
      }
    }

    return true;
  }
}
