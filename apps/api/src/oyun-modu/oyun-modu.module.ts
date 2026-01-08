import { Module } from '@nestjs/common';
import { OyunModuController } from './oyun-modu.controller';
import { OyunModuService } from './oyun-modu.service';

@Module({
  controllers: [OyunModuController],
  providers: [OyunModuService],
  exports: [OyunModuService],
})
export class OyunModuModule {}
