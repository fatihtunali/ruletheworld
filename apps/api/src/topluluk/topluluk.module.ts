import { Module } from '@nestjs/common';
import { ToplulukController } from './topluluk.controller';
import { ToplulukService } from './topluluk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BotModule } from '../bot/bot.module';
import { OyunModule } from '../oyun/oyun.module';

@Module({
  imports: [PrismaModule, BotModule, OyunModule],
  controllers: [ToplulukController],
  providers: [ToplulukService],
  exports: [ToplulukService],
})
export class ToplulukModule {}
