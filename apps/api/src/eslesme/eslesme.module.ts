import { Module } from '@nestjs/common';
import { EslesmeController } from './eslesme.controller';
import { EslesmeService } from './eslesme.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ToplulukModule } from '../topluluk/topluluk.module';

@Module({
  imports: [PrismaModule, ToplulukModule],
  controllers: [EslesmeController],
  providers: [EslesmeService],
  exports: [EslesmeService],
})
export class EslesmeModule {}
