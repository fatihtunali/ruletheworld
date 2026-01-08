import { Module } from '@nestjs/common';
import { ReferansController } from './referans.controller';
import { ReferansService } from './referans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReferansController],
  providers: [ReferansService],
  exports: [ReferansService],
})
export class ReferansModule {}
