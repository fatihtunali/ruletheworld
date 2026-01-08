import { Module } from '@nestjs/common';
import { SiralamaController } from './siralama.controller';
import { SiralamaService } from './siralama.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SiralamaController],
  providers: [SiralamaService],
  exports: [SiralamaService],
})
export class SiralamaModule {}
