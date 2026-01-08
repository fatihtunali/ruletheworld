import { Module } from '@nestjs/common';
import { AktiviteController } from './aktivite.controller';
import { AktiviteService } from './aktivite.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AktiviteController],
  providers: [AktiviteService],
  exports: [AktiviteService],
})
export class AktiviteModule {}
