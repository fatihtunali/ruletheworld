import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { KayitDto, GirisDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async kayitOl(dto: KayitDto): Promise<AuthResponse> {
    // E-posta kontrolü
    const mevcutEmail = await this.prisma.oyuncu.findUnique({
      where: { email: dto.email },
    });

    if (mevcutEmail) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    // Kullanıcı adı kontrolü
    const mevcutKullaniciAdi = await this.prisma.oyuncu.findUnique({
      where: { kullaniciAdi: dto.kullaniciAdi },
    });

    if (mevcutKullaniciAdi) {
      throw new ConflictException('Bu kullanıcı adı zaten kullanılıyor');
    }

    // Şifreyi hashle
    const hashedSifre = await bcrypt.hash(dto.sifre, 10);

    // Oyuncu oluştur
    const oyuncu = await this.prisma.oyuncu.create({
      data: {
        kullaniciAdi: dto.kullaniciAdi,
        email: dto.email,
        sifreHash: hashedSifre,
      },
    });

    // Email dogrulama tokeni olustur ve gonder
    await this.emailDogrulamaTalebiGonder(oyuncu.id);

    // Token oluştur
    const accessToken = this.createToken(oyuncu.id);

    return {
      accessToken,
      oyuncu: {
        id: oyuncu.id,
        kullaniciAdi: oyuncu.kullaniciAdi,
        email: oyuncu.email,
        olusturulmaTarihi: oyuncu.olusturuldu,
      },
    };
  }

  async girisYap(dto: GirisDto): Promise<AuthResponse> {
    // Oyuncuyu bul
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { email: dto.email },
    });

    if (!oyuncu) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // Şifreyi kontrol et
    const sifreGecerli = await bcrypt.compare(dto.sifre, oyuncu.sifreHash);

    if (!sifreGecerli) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // Token oluştur
    const accessToken = this.createToken(oyuncu.id);

    return {
      accessToken,
      oyuncu: {
        id: oyuncu.id,
        kullaniciAdi: oyuncu.kullaniciAdi,
        email: oyuncu.email,
        olusturulmaTarihi: oyuncu.olusturuldu,
      },
    };
  }

  async profilGetir(oyuncuId: string) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new UnauthorizedException('Oyuncu bulunamadı');
    }

    return {
      id: oyuncu.id,
      kullaniciAdi: oyuncu.kullaniciAdi,
      email: oyuncu.email,
      sistemRolu: oyuncu.sistemRolu,
      hesapDurumu: oyuncu.hesapDurumu,
      olusturulmaTarihi: oyuncu.olusturuldu,
    };
  }

  async profilDetayGetir(oyuncuId: string) {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      include: {
        uyelikler: {
          take: 10,
          orderBy: { katildiAt: 'desc' },
          include: {
            topluluk: {
              select: {
                id: true,
                isim: true,
                durum: true,
                basladiAt: true,
                bittiAt: true,
                oyunDurumu: {
                  select: { sonuc: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            oneriler: true,
            oylar: true,
            mesajlar: true,
          },
        },
      },
    });

    if (!oyuncu) {
      throw new UnauthorizedException('Oyuncu bulunamadı');
    }

    return {
      id: oyuncu.id,
      kullaniciAdi: oyuncu.kullaniciAdi,
      email: oyuncu.email,
      sistemRolu: oyuncu.sistemRolu,
      olusturulmaTarihi: oyuncu.olusturuldu,
      sonAktiflik: oyuncu.sonAktiflik,
      istatistikler: {
        oynananOyunlar: oyuncu.oynananOyunlar,
        tamamlananOyunlar: oyuncu.tamamlananOyunlar,
        yapilanOneriler: oyuncu.yapilanOneriler,
        verilenOylar: oyuncu.verilenOylar,
        toplamMesaj: oyuncu._count.mesajlar,
      },
      sonOyunlar: oyuncu.uyelikler.map((u) => ({
        toplulukId: u.topluluk.id,
        toplulukIsmi: u.topluluk.isim,
        durum: u.topluluk.durum,
        sonuc: u.topluluk.oyunDurumu?.sonuc || null,
        katildiAt: u.katildiAt,
        basladiAt: u.topluluk.basladiAt,
        bittiAt: u.topluluk.bittiAt,
      })),
    };
  }

  private createToken(oyuncuId: string): string {
    return this.jwtService.sign({ sub: oyuncuId });
  }

  // Şifre sıfırlama talebi
  async sifreSifirlamaTalebi(email: string): Promise<{ mesaj: string; token?: string }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { email },
    });

    // Güvenlik için her zaman aynı mesajı döndür
    if (!oyuncu) {
      return { mesaj: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi' };
    }

    // Eskik tokenleri geçersiz kıl
    await this.prisma.sifreSifirlama.updateMany({
      where: {
        oyuncuId: oyuncu.id,
        kullanildi: false,
        sonlanma: { gt: new Date() },
      },
      data: { kullanildi: true },
    });

    // Yeni token oluştur
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.prisma.sifreSifirlama.create({
      data: {
        oyuncuId: oyuncu.id,
        tokenHash,
        sonlanma: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
      },
    });

    // Not: Gerçek uygulamada burada email gönderilir
    // Şimdilik token'ı geliştirme amaçlı döndürüyoruz
    return {
      mesaj: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi',
      token: process.env.NODE_ENV === 'development' ? token : undefined,
    };
  }

  // Şifre sıfırlama token'ını doğrula
  async sifreSifirlamaDogrula(token: string): Promise<{ gecerli: boolean; oyuncuId?: string }> {
    const sifreSifirlamalari = await this.prisma.sifreSifirlama.findMany({
      where: {
        kullanildi: false,
        sonlanma: { gt: new Date() },
      },
    });

    for (const kayit of sifreSifirlamalari) {
      const eslesiyor = await bcrypt.compare(token, kayit.tokenHash);
      if (eslesiyor) {
        return { gecerli: true, oyuncuId: kayit.oyuncuId };
      }
    }

    return { gecerli: false };
  }

  // Şifreyi sıfırla
  async sifreyiSifirla(token: string, yeniSifre: string): Promise<{ basarili: boolean }> {
    if (yeniSifre.length < 6) {
      throw new BadRequestException('Şifre en az 6 karakter olmalı');
    }

    const dogrulama = await this.sifreSifirlamaDogrula(token);

    if (!dogrulama.gecerli || !dogrulama.oyuncuId) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token');
    }

    // Şifreyi güncelle
    const hashedSifre = await bcrypt.hash(yeniSifre, 10);

    await this.prisma.oyuncu.update({
      where: { id: dogrulama.oyuncuId },
      data: { sifreHash: hashedSifre },
    });

    // Tüm tokenları geçersiz kıl
    await this.prisma.sifreSifirlama.updateMany({
      where: { oyuncuId: dogrulama.oyuncuId },
      data: { kullanildi: true },
    });

    return { basarili: true };
  }

  // Şifre değiştirme (giriş yapmış kullanıcı için)
  async sifreDegistir(
    oyuncuId: string,
    eskiSifre: string,
    yeniSifre: string,
  ): Promise<{ basarili: boolean }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new NotFoundException('Oyuncu bulunamadı');
    }

    const sifreGecerli = await bcrypt.compare(eskiSifre, oyuncu.sifreHash);
    if (!sifreGecerli) {
      throw new UnauthorizedException('Mevcut şifre hatalı');
    }

    if (yeniSifre.length < 6) {
      throw new BadRequestException('Yeni şifre en az 6 karakter olmalı');
    }

    const hashedSifre = await bcrypt.hash(yeniSifre, 10);

    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: { sifreHash: hashedSifre },
    });

    return { basarili: true };
  }

  // Email dogrulama tokeni olustur ve gonder
  async emailDogrulamaTalebiGonder(oyuncuId: string): Promise<{ mesaj: string; token?: string }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new NotFoundException('Oyuncu bulunamadi');
    }

    if (oyuncu.emailDogrulandi) {
      return { mesaj: 'Email zaten dogrulanmis' };
    }

    // Eski tokenleri gecersiz kil
    await this.prisma.emailDogrulama.updateMany({
      where: {
        oyuncuId: oyuncu.id,
        kullanildi: false,
        sonlanma: { gt: new Date() },
      },
      data: { kullanildi: true },
    });

    // Yeni token olustur
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.prisma.emailDogrulama.create({
      data: {
        oyuncuId: oyuncu.id,
        tokenHash,
        sonlanma: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
      },
    });

    // Email gonder
    await this.emailService.sendVerificationEmail(oyuncu.email, token, oyuncu.kullaniciAdi);

    return {
      mesaj: 'Dogrulama emaili gonderildi',
      token: process.env.NODE_ENV === 'development' ? token : undefined,
    };
  }

  // Email dogrula
  async emailDogrula(token: string): Promise<{ basarili: boolean; mesaj: string }> {
    const emailDogrulamalari = await this.prisma.emailDogrulama.findMany({
      where: {
        kullanildi: false,
        sonlanma: { gt: new Date() },
      },
      include: { oyuncu: true },
    });

    for (const kayit of emailDogrulamalari) {
      const eslesiyor = await bcrypt.compare(token, kayit.tokenHash);
      if (eslesiyor) {
        // Email dogrulandi
        await this.prisma.oyuncu.update({
          where: { id: kayit.oyuncuId },
          data: { emailDogrulandi: true },
        });

        // Token'i kullanildi isaretle
        await this.prisma.emailDogrulama.update({
          where: { id: kayit.id },
          data: { kullanildi: true },
        });

        // Hosgeldin emaili gonder
        await this.emailService.sendWelcomeEmail(kayit.oyuncu.email, kayit.oyuncu.kullaniciAdi);

        return { basarili: true, mesaj: 'Email basariyla dogrulandi' };
      }
    }

    throw new BadRequestException('Gecersiz veya suresi dolmus dogrulama linki');
  }

  // Email dogrulama durumu kontrol
  async emailDogrulamaDurumu(oyuncuId: string): Promise<{ dogrulandi: boolean }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { emailDogrulandi: true },
    });

    if (!oyuncu) {
      throw new NotFoundException('Oyuncu bulunamadi');
    }

    return { dogrulandi: oyuncu.emailDogrulandi };
  }

  // Email dogrulama yeniden gonder
  async emailDogrulamaYenidenGonder(oyuncuId: string): Promise<{ mesaj: string; token?: string }> {
    return this.emailDogrulamaTalebiGonder(oyuncuId);
  }
}
