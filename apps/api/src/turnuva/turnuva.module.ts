import { Module } from '@nestjs/common';
import { TurnuvaController } from './turnuva.controller';
import { TurnuvaService } from './turnuva.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TurnuvaController],
  providers: [TurnuvaService],
  exports: [TurnuvaService],
})
export class TurnuvaModule {}
