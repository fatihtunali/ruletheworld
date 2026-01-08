import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AltinService } from './altin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

class HediyeGonderDto {
  @IsString()
  aliciKullaniciAdi: string;

  @IsNumber()
  @Min(10)
  miktar: number;

  @IsString()
  @IsOptional()
  mesaj?: string;
}

@Controller('altin')
@UseGuards(JwtAuthGuard)
export class AltinController {
  constructor(private altinService: AltinService) {}

  // Bakiyemi getir
  @Get('bakiye')
  async bakiyeGetir(@Request() req: { user: { id: string } }) {
    return this.altinService.bakiyeGetir(req.user.id);
  }

  // İşlem geçmişim
  @Get('gecmis')
  async islemGecmisi(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: number,
  ) {
    return this.altinService.islemGecmisiGetir(req.user.id, limit || 20);
  }

  // Günlük bonusumu al
  @Post('gunluk-bonus')
  async gunlukBonusAl(@Request() req: { user: { id: string } }) {
    return this.altinService.gunlukBonusAl(req.user.id);
  }

  // Hediye gönder
  @Post('hediye')
  async hediyeGonder(
    @Request() req: { user: { id: string } },
    @Body() dto: HediyeGonderDto,
  ) {
    return this.altinService.hediyeGonder(
      req.user.id,
      dto.aliciKullaniciAdi,
      dto.miktar,
      dto.mesaj,
    );
  }
}
