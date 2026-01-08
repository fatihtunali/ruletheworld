import { Module } from '@nestjs/common';
import { TekrarController } from './tekrar.controller';
import { TekrarService } from './tekrar.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TekrarController],
  providers: [TekrarService],
  exports: [TekrarService],
})
export class TekrarModule {}
