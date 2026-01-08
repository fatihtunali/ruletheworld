import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string }) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: payload.sub },
    });

    if (!oyuncu) {
      throw new UnauthorizedException('Oturum geçersiz');
    }

    return {
      id: oyuncu.id,
      kullaniciAdi: oyuncu.kullaniciAdi,
      email: oyuncu.email,
    };
  }
}
