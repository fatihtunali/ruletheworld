import { Module } from '@nestjs/common';
import { ToplulukController } from './topluluk.controller';
import { ToplulukService } from './topluluk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [PrismaModule, BotModule],
  controllers: [ToplulukController],
  providers: [ToplulukService],
  exports: [ToplulukService],
})
export class ToplulukModule {}
