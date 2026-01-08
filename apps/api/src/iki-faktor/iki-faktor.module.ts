import { Module } from '@nestjs/common';
import { IkiFactorController } from './iki-faktor.controller';
import { IkiFactorService } from './iki-faktor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IkiFactorController],
  providers: [IkiFactorService],
  exports: [IkiFactorService],
})
export class IkiFactorModule {}
