import { Module } from '@nestjs/common';
import { DuyuruController } from './duyuru.controller';
import { AdminService } from '../admin/admin.service';

@Module({
  controllers: [DuyuruController],
  providers: [AdminService],
})
export class DuyuruModule {}
