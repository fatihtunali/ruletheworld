import { Module } from '@nestjs/common';
import { ReaksiyonController } from './reaksiyon.controller';
import { ReaksiyonService } from './reaksiyon.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReaksiyonController],
  providers: [ReaksiyonService],
  exports: [ReaksiyonService],
})
export class ReaksiyonModule {}
