import { Module } from '@nestjs/common';
import { IstatistikController } from './istatistik.controller';
import { IstatistikService } from './istatistik.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IstatistikController],
  providers: [IstatistikService],
  exports: [IstatistikService],
})
export class IstatistikModule {}
