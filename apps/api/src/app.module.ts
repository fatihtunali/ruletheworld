import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ToplulukModule } from './topluluk/topluluk.module';
import { OyunModule } from './oyun/oyun.module';
import { AdminModule } from './admin/admin.module';
import { BildirimModule } from './bildirim/bildirim.module';
import { IstatistikModule } from './istatistik/istatistik.module';
import { BasarimModule } from './basarim/basarim.module';
import { TekrarModule } from './tekrar/tekrar.module';
import { TurnuvaModule } from './turnuva/turnuva.module';
import { CacheModuleConfig } from './cache/cache.module';
import { EmailModule } from './email/email.module';
import { ArkadaslikModule } from './arkadaslik/arkadaslik.module';
import { SiralamaModule } from './siralama/siralama.module';
import { BotModule } from './bot/bot.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Yapılandırma modülü
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting - Dakikada 60 istek, 10 dakikada 200 istek
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,    // 1 dakika
        limit: 60,     // 60 istek
      },
      {
        name: 'long',
        ttl: 600000,   // 10 dakika
        limit: 200,    // 200 istek
      },
    ]),

    // Redis Cache
    CacheModuleConfig,

    // Email
    EmailModule,

    // Veritabanı
    PrismaModule,

    // Auth
    AuthModule,

    // Topluluklar
    ToplulukModule,

    // Oyun (WebSocket)
    OyunModule,

    // Admin Panel
    AdminModule,

    // Bildirimler
    BildirimModule,

    // Istatistikler
    IstatistikModule,

    // Basarimlar
    BasarimModule,

    // Oyun Tekrari
    TekrarModule,

    // Turnuvalar
    TurnuvaModule,

    // Arkadaslik
    ArkadaslikModule,

    // Siralama (Leaderboard)
    SiralamaModule,

    // Bot Oyuncular
    BotModule,
  ],
  controllers: [],
  providers: [
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
