import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { BanGuard } from './guards/ban.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard, BanGuard],
  exports: [AdminService, RolesGuard, BanGuard],
})
export class AdminModule {}
