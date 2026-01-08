import { Module } from '@nestjs/common';
import { ArkadaslikController } from './arkadaslik.controller';
import { ArkadaslikService } from './arkadaslik.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BildirimModule } from '../bildirim/bildirim.module';

@Module({
  imports: [PrismaModule, BildirimModule],
  controllers: [ArkadaslikController],
  providers: [ArkadaslikService],
  exports: [ArkadaslikService],
})
export class ArkadaslikModule {}
