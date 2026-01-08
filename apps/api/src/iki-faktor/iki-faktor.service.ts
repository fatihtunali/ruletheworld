import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';

// TOTP parametreleri
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // saniye
const TOTP_WINDOW = 1; // +/- 1 period tolerance

// Base32 karakterleri
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class IkiFactorService {
  constructor(private prisma: PrismaService) {}

  // Base32 encode
  private base32Encode(buffer: Buffer): string {
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += BASE32_CHARS[(value << (5 - bits)) & 31];
    }

    return result;
  }

  // Base32 decode
  private base32Decode(str: string): Buffer {
    const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < cleaned.length; i++) {
      const index = BASE32_CHARS.indexOf(cleaned[i]);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  // TOTP hesapla
  private generateTOTP(secret: string, time?: number): string {
    const secretBuffer = this.base32Decode(secret);
    const counter = Math.floor((time || Date.now() / 1000) / TOTP_PERIOD);

    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, TOTP_DIGITS);
    return otp.toString().padStart(TOTP_DIGITS, '0');
  }

  // TOTP doğrula (window ile)
  private verifyTOTP(secret: string, token: string): boolean {
    const now = Math.floor(Date.now() / 1000);

    for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
      const time = now + i * TOTP_PERIOD;
      if (this.generateTOTP(secret, time) === token) {
        return true;
      }
    }

    return false;
  }

  // Secret oluştur
  private generateSecret(): string {
    return this.base32Encode(randomBytes(20));
  }

  // Yedek kodlar oluştur
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  // 2FA kurulum başlat
  async kurulumBaslat(oyuncuId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeUrl: string;
  }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new BadRequestException('Oyuncu bulunamadı');
    }

    if (oyuncu.ikiFactorAktif) {
      throw new BadRequestException('2FA zaten aktif');
    }

    const secret = this.generateSecret();
    const issuer = 'RuleTheWorld';
    const otpauthUrl = `otpauth://totp/${issuer}:${oyuncu.email}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

    // Secret'ı geçici olarak kaydet (henüz aktif değil)
    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: { ikiFactorSecret: secret },
    });

    // QR kod URL'i (Google Chart API ile)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    return {
      secret,
      otpauthUrl,
      qrCodeUrl,
    };
  }

  // 2FA kurulumu tamamla
  async kurulumTamamla(
    oyuncuId: string,
    token: string,
  ): Promise<{ yedekKodlar: string[] }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new BadRequestException('Oyuncu bulunamadı');
    }

    if (oyuncu.ikiFactorAktif) {
      throw new BadRequestException('2FA zaten aktif');
    }

    if (!oyuncu.ikiFactorSecret) {
      throw new BadRequestException('Önce kurulum başlatılmalı');
    }

    // Token doğrula
    if (!this.verifyTOTP(oyuncu.ikiFactorSecret, token)) {
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    // Yedek kodları oluştur
    const yedekKodlar = this.generateBackupCodes();

    // 2FA'yı aktifleştir
    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: {
        ikiFactorAktif: true,
        ikiFactorYedekKodlar: JSON.stringify(yedekKodlar),
      },
    });

    return { yedekKodlar };
  }

  // 2FA doğrula (giriş için)
  async dogrula(oyuncuId: string, token: string): Promise<boolean> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu || !oyuncu.ikiFactorAktif || !oyuncu.ikiFactorSecret) {
      throw new UnauthorizedException('2FA aktif değil');
    }

    // Önce TOTP dene
    if (this.verifyTOTP(oyuncu.ikiFactorSecret, token)) {
      return true;
    }

    // Yedek kod dene
    if (oyuncu.ikiFactorYedekKodlar) {
      const yedekKodlar: string[] = JSON.parse(oyuncu.ikiFactorYedekKodlar);
      const normalizedToken = token.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const index = yedekKodlar.findIndex(
        (kod) => kod.replace(/-/g, '') === normalizedToken,
      );

      if (index !== -1) {
        // Kullanılan yedek kodu sil
        yedekKodlar.splice(index, 1);
        await this.prisma.oyuncu.update({
          where: { id: oyuncuId },
          data: { ikiFactorYedekKodlar: JSON.stringify(yedekKodlar) },
        });
        return true;
      }
    }

    return false;
  }

  // 2FA deaktif et
  async deaktifEt(
    oyuncuId: string,
    token: string,
  ): Promise<{ basarili: boolean }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
    });

    if (!oyuncu) {
      throw new BadRequestException('Oyuncu bulunamadı');
    }

    if (!oyuncu.ikiFactorAktif) {
      throw new BadRequestException('2FA zaten kapalı');
    }

    // Token doğrula
    const gecerli = await this.dogrula(oyuncuId, token);
    if (!gecerli) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu');
    }

    // 2FA'yı kapat
    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: {
        ikiFactorAktif: false,
        ikiFactorSecret: null,
        ikiFactorYedekKodlar: null,
      },
    });

    return { basarili: true };
  }

  // 2FA durumunu getir
  async durumGetir(oyuncuId: string): Promise<{
    aktif: boolean;
    kalanYedekKod: number;
  }> {
    const oyuncu = await this.prisma.oyuncu.findUnique({
      where: { id: oyuncuId },
      select: { ikiFactorAktif: true, ikiFactorYedekKodlar: true },
    });

    if (!oyuncu) {
      throw new BadRequestException('Oyuncu bulunamadı');
    }

    let kalanYedekKod = 0;
    if (oyuncu.ikiFactorYedekKodlar) {
      const kodlar: string[] = JSON.parse(oyuncu.ikiFactorYedekKodlar);
      kalanYedekKod = kodlar.length;
    }

    return {
      aktif: oyuncu.ikiFactorAktif,
      kalanYedekKod,
    };
  }

  // Yeni yedek kodlar oluştur
  async yedekKodlariYenile(
    oyuncuId: string,
    token: string,
  ): Promise<{ yedekKodlar: string[] }> {
    const gecerli = await this.dogrula(oyuncuId, token);
    if (!gecerli) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu');
    }

    const yedekKodlar = this.generateBackupCodes();

    await this.prisma.oyuncu.update({
      where: { id: oyuncuId },
      data: { ikiFactorYedekKodlar: JSON.stringify(yedekKodlar) },
    });

    return { yedekKodlar };
  }
}
