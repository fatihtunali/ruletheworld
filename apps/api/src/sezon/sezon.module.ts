import { Module } from '@nestjs/common';
import { SezonController } from './sezon.controller';
import { SezonService } from './sezon.service';

@Module({
  controllers: [SezonController],
  providers: [SezonService],
  exports: [SezonService],
})
export class SezonModule {}
