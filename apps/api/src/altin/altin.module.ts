import { Module } from '@nestjs/common';
import { AltinController } from './altin.controller';
import { AltinService } from './altin.service';

@Module({
  controllers: [AltinController],
  providers: [AltinService],
  exports: [AltinService],
})
export class AltinModule {}
