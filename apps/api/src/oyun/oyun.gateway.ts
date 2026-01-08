import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OyunService } from './oyun.service';

interface AuthenticatedSocket extends Socket {
  oyuncuId?: string;
  toplulukId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.1.107'],
    credentials: true,
  },
})
export class OyunGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OyunGateway.name);

  // Aşama zamanlayıcıları
  private asamaZamanlayicilari = new Map<string, NodeJS.Timeout>();

  constructor(
    private oyunService: OyunService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Bağlantı reddedildi: Token yok`);
        client.emit('hata', { mesaj: 'Oturum geçersiz' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.oyuncuId = payload.sub;
      this.logger.log(`Oyuncu bağlandı: ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Token doğrulama hatası: ${error}`);
      client.emit('hata', { mesaj: 'Oturum geçersiz' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.oyuncuId && client.toplulukId) {
      this.oyunService.oyuncuAyrildi(client.toplulukId, client.oyuncuId);

      // Diğer oyunculara bildir
      this.server.to(client.toplulukId).emit('oyuncu-ayrildi', {
        oyuncuId: client.oyuncuId,
      });

      this.logger.log(`Oyuncu ayrıldı: ${client.oyuncuId} - Topluluk: ${client.toplulukId}`);
    }
  }

  @SubscribeMessage('topluluga-katil')
  async handleToplulugaKatil(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { toplulukId: string },
  ) {
    if (!client.oyuncuId) {
      client.emit('hata', { mesaj: 'Oturum geçersiz' });
      return;
    }

    const toplulukId = data.toplulukId;
    client.toplulukId = toplulukId;

    // Socket.io odasına katıl
    client.join(toplulukId);

    // Oyuncu bağlandı
    const durum = await this.oyunService.oyuncuBaglandi(toplulukId, client.oyuncuId);

    if (!durum) {
      client.emit('hata', { mesaj: 'Topluluğa erişim izniniz yok' });
      client.leave(toplulukId);
      return;
    }

    // Durumu gönder
    client.emit('topluluk-durumu', durum);

    // Diğer oyunculara bildir
    const oyuncu = durum.oyuncular.find((o) => o.id === client.oyuncuId);
    if (oyuncu) {
      client.to(toplulukId).emit('oyuncu-katildi', oyuncu);
    }

    this.logger.log(`Oyuncu topluluğa katıldı: ${client.oyuncuId} -> ${toplulukId}`);
  }

  @SubscribeMessage('hazir-ol')
  async handleHazirOl(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.oyuncuId || !client.toplulukId) {
      client.emit('hata', { mesaj: 'Topluluğa katılmalısınız' });
      return;
    }

    const yeniDurum = await this.oyunService.hazirlikDegistir(client.toplulukId, client.oyuncuId);

    // Tüm oyunculara bildir
    this.server.to(client.toplulukId).emit('hazirlik-guncellendi', {
      oyuncuId: client.oyuncuId,
      hazir: yeniDurum,
    });
  }

  @SubscribeMessage('oyunu-baslat')
  async handleOyunuBaslat(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.oyuncuId || !client.toplulukId) {
      client.emit('hata', { mesaj: 'Topluluğa katılmalısınız' });
      return;
    }

    const sonuc = await this.oyunService.oyunuBaslat(client.toplulukId, client.oyuncuId);

    if (!sonuc.basarili) {
      client.emit('hata', { mesaj: sonuc.hata });
      return;
    }

    // Tüm oyunculara oyun başladı
    const durum = await this.oyunService.toplulukDurumuGetir(client.toplulukId, client.oyuncuId);
    this.server.to(client.toplulukId).emit('oyun-basladi', {
      kaynaklar: durum?.kaynaklar,
    });

    // İlk turu başlat
    await this.yeniTurBaslat(client.toplulukId);
  }

  private async yeniTurBaslat(toplulukId: string) {
    const sonuc = await this.oyunService.yeniTurBaslat(toplulukId);

    if (!sonuc) {
      // Oyun bitti
      await this.oyunuBitir(toplulukId);
      return;
    }

    // Tüm oyunculara yeni tur
    this.server.to(toplulukId).emit('yeni-tur', {
      tur: sonuc.olay ? 1 : 0,
      olay: sonuc.olay,
      sure: sonuc.sure,
    });

    // Olay açılışı sonrası tartışmayı başlat
    this.zamanlayiciKur(toplulukId, sonuc.sure * 1000, () => {
      this.tartismaBaslat(toplulukId);
    });
  }

  private async tartismaBaslat(toplulukId: string) {
    const sonuc = await this.oyunService.tartismaBaslat(toplulukId);

    this.server.to(toplulukId).emit('tartisma-basladi', {
      sure: sonuc.sure,
    });

    // Tartışma sonrası oylamayı başlat
    this.zamanlayiciKur(toplulukId, sonuc.sure * 1000, () => {
      this.oylamaBaslat(toplulukId);
    });
  }

  @SubscribeMessage('oneri-gonder')
  async handleOneriGonder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { secenekId: string; aciklama: string },
  ) {
    if (!client.oyuncuId || !client.toplulukId) {
      client.emit('hata', { mesaj: 'Topluluğa katılmalısınız' });
      return;
    }

    const oneri = await this.oyunService.oneriGonder(
      client.toplulukId,
      client.oyuncuId,
      data.secenekId,
      data.aciklama || '',
    );

    if (oneri) {
      // Tüm oyunculara yeni öneriyi bildir
      this.server.to(client.toplulukId).emit('yeni-oneri', oneri);
    }
  }

  private async oylamaBaslat(toplulukId: string) {
    const sonuc = await this.oyunService.oylamaBaslat(toplulukId);

    this.server.to(toplulukId).emit('oylama-basladi', {
      sure: sonuc.sure,
    });

    // Oylama sonrası turu sonuçlandır
    this.zamanlayiciKur(toplulukId, sonuc.sure * 1000, () => {
      this.turuSonuclandir(toplulukId);
    });
  }

  @SubscribeMessage('oy-ver')
  async handleOyVer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { oneriId: string; secim: 'EVET' | 'HAYIR' | 'CEKIMSER' },
  ) {
    if (!client.oyuncuId || !client.toplulukId) {
      client.emit('hata', { mesaj: 'Topluluğa katılmalısınız' });
      return;
    }

    const basarili = await this.oyunService.oyVer(
      client.toplulukId,
      client.oyuncuId,
      data.oneriId,
      data.secim,
    );

    if (basarili) {
      // Tüm oyunculara oy bildir
      this.server.to(client.toplulukId).emit('oy-guncellendi', {
        oneriId: data.oneriId,
        oyuncuId: client.oyuncuId,
        secim: data.secim,
      });
    }
  }

  private async turuSonuclandir(toplulukId: string) {
    const sonuc = await this.oyunService.turuSonuclandir(toplulukId);

    this.server.to(toplulukId).emit('tur-sonucu', {
      kazananOneri: sonuc.kazananOneri,
      yeniKaynaklar: sonuc.yeniKaynaklar,
      aciklama: sonuc.aciklama,
    });

    // 5 saniye sonra yeni turu başlat
    this.zamanlayiciKur(toplulukId, 5000, () => {
      this.yeniTurBaslat(toplulukId);
    });
  }

  private async oyunuBitir(toplulukId: string) {
    const sonuc = await this.oyunService.oyunuBitir(toplulukId);

    this.server.to(toplulukId).emit('oyun-bitti', {
      sonuc: {
        durum: sonuc.sonuc,
        kaynaklar: sonuc.kaynaklar,
        ozet: sonuc.ozet,
      },
    });

    // Zamanlayıcıyı temizle
    this.zamanlayiciTemizle(toplulukId);
  }

  @SubscribeMessage('mesaj-gonder')
  async handleMesajGonder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { icerik: string },
  ) {
    if (!client.oyuncuId || !client.toplulukId) {
      client.emit('hata', { mesaj: 'Topluluğa katılmalısınız' });
      return;
    }

    if (!data.icerik?.trim()) return;

    const mesaj = await this.oyunService.mesajGonder(
      client.toplulukId,
      client.oyuncuId,
      data.icerik,
    );

    if (mesaj) {
      // Tüm oyunculara mesajı ilet
      this.server.to(client.toplulukId).emit('yeni-mesaj', mesaj);
    }
  }

  private zamanlayiciKur(toplulukId: string, sure: number, callback: () => void) {
    // Önceki zamanlayıcıyı temizle
    this.zamanlayiciTemizle(toplulukId);

    const timeout = setTimeout(callback, sure);
    this.asamaZamanlayicilari.set(toplulukId, timeout);
  }

  private zamanlayiciTemizle(toplulukId: string) {
    const mevcutTimeout = this.asamaZamanlayicilari.get(toplulukId);
    if (mevcutTimeout) {
      clearTimeout(mevcutTimeout);
      this.asamaZamanlayicilari.delete(toplulukId);
    }
  }
}
