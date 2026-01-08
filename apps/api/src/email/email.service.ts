import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.initTransporter();
  }

  private initTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('SMTP credentials not configured - emails will be logged only');
    }
  }

  async sendVerificationEmail(email: string, token: string, kullaniciAdi: string): Promise<boolean> {
    const verifyUrl = `${this.frontendUrl}/email-dogrula?token=${token}`;

    const subject = 'RuleTheWorld - Email Adresini Dogrula';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Merhaba ${kullaniciAdi}!</h1>
        <p>RuleTheWorld'e hosgeldin! Hesabini aktive etmek icin email adresini dogrulaman gerekiyor.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Email Adresimi Dogrula
          </a>
        </div>
        <p style="color: #666;">Veya bu linki tarayicina yapistir:</p>
        <p style="color: #4F46E5; word-break: break-all;">${verifyUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Bu email RuleTheWorld tarafindan gonderildi. Eger sen kayit olmadiysan bu emaili gormezden gelebilirsin.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, token: string, kullaniciAdi: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/sifre-sifirla?token=${token}`;

    const subject = 'RuleTheWorld - Sifre Sifirlama';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Merhaba ${kullaniciAdi}!</h1>
        <p>Sifreni sifirlamak icin bir talep aldik. Asagidaki butona tiklayarak yeni sifre belirleyebilirsin.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Sifremi Sifirla
          </a>
        </div>
        <p style="color: #666;">Veya bu linki tarayicina yapistir:</p>
        <p style="color: #4F46E5; word-break: break-all;">${resetUrl}</p>
        <p style="color: #f97316;">Bu link 1 saat icinde gecersiz olacak.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Eger bu talebi sen gondermediysen bu emaili gormezden gelebilirsin.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, kullaniciAdi: string): Promise<boolean> {
    const subject = 'RuleTheWorld\'e Hosgeldin!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Hosgeldin ${kullaniciAdi}!</h1>
        <p>Email adresini basariyla dogruladidin. Artik RuleTheWorld'un tum ozelliklerini kullanabilirsin.</p>
        <div style="margin: 30px 0;">
          <a href="${this.frontendUrl}/lobi"
             style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Oyuna Basla
          </a>
        </div>
        <h2 style="color: #333;">Nasil Oynanir?</h2>
        <ul style="color: #666;">
          <li>Bir topluluk olustur veya mevcut bir topluluga katil</li>
          <li>Topluluk olaylarina oneri sun</li>
          <li>Diger oyuncularin onerilerine oy ver</li>
          <li>Toplulugunun kaynaklarini dengeli tut</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          RuleTheWorld - Topluluk Yonetim Oyunu
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const from = this.configService.get<string>('SMTP_FROM') || 'noreply@ruletheworld.com';

    if (!this.transporter) {
      // Development mode - log email
      this.logger.log(`[DEV] Email to: ${to}`);
      this.logger.log(`[DEV] Subject: ${subject}`);
      this.logger.debug(`[DEV] HTML: ${html}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }
}
