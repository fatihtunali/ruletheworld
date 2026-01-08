import { Module } from '@nestjs/common';
import { BildirimController } from './bildirim.controller';
import { BildirimService } from './bildirim.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BildirimController],
  providers: [BildirimService],
  exports: [BildirimService],
})
export class BildirimModule {}
