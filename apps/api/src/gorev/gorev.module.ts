import { Module } from '@nestjs/common';
import { GorevController } from './gorev.controller';
import { GorevService } from './gorev.service';

@Module({
  controllers: [GorevController],
  providers: [GorevService],
  exports: [GorevService],
})
export class GorevModule {}
