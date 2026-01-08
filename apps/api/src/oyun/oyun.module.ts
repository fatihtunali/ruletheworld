import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OyunGateway } from './oyun.gateway';
import { OyunService } from './oyun.service';
import { OyunStateMachineService } from './oyun-state-machine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BildirimModule } from '../bildirim/bildirim.module';

@Module({
  imports: [
    PrismaModule,
    BildirimModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
    }),
  ],
  providers: [OyunGateway, OyunService, OyunStateMachineService],
  exports: [OyunService, OyunStateMachineService],
})
export class OyunModule {}
