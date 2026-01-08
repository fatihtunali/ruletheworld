import { Module } from '@nestjs/common';
import { BasarimController } from './basarim.controller';
import { BasarimService } from './basarim.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BildirimModule } from '../bildirim/bildirim.module';

@Module({
  imports: [PrismaModule, BildirimModule],
  controllers: [BasarimController],
  providers: [BasarimService],
  exports: [BasarimService],
})
export class BasarimModule {}
