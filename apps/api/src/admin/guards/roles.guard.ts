import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SistemRolu } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SistemRolu[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Rol gerekliliği yoksa geç
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Oturum açmanız gerekiyor');
    }

    // Kullanıcının rolünü veritabanından al
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: user.id },
      select: { sistemRolu: true, hesapDurumu: true },
    });

    if (!oyuncu) {
      throw new ForbiddenException('Kullanıcı bulunamadı');
    }

    // Hesap durumunu kontrol et
    if (oyuncu.hesapDurumu !== 'AKTIF') {
      throw new ForbiddenException('Hesabınız aktif değil');
    }

    // Rol kontrolü
    if (!requiredRoles.includes(oyuncu.sistemRolu)) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }

    // Rol bilgisini request'e ekle
    request.user.sistemRolu = oyuncu.sistemRolu;

    return true;
  }
}
