import { Module } from '@nestjs/common';
import { IzleyiciController } from './izleyici.controller';
import { IzleyiciService } from './izleyici.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IzleyiciController],
  providers: [IzleyiciService],
  exports: [IzleyiciService],
})
export class IzleyiciModule {}
