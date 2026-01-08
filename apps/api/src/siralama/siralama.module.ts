import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SiralamaController } from './siralama.controller';
import { SiralamaService } from './siralama.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [SiralamaController],
  providers: [SiralamaService],
  exports: [SiralamaService],
})
export class SiralamaModule {}
