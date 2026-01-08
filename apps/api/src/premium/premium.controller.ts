import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { PremiumTip } from '@prisma/client';

// DTOs
export class PromosyonKullanDto {
  @IsString()
  kod: string;
}

export class PremiumSatinAlDto {
  @IsEnum(PremiumTip)
  tip: PremiumTip;

  @IsString()
  @IsOptional()
  odemeRefId?: string;

  @IsString()
  @IsOptional()
  odemeYontemi?: string;
}

export class PromosyonOlusturDto {
  @IsString()
  kod: string;

  @IsEnum(PremiumTip)
  premiumTip: PremiumTip;

  @IsNumber()
  @Min(1)
  sureSaat: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxKullanim?: number;

  @IsDateString()
  @IsOptional()
  gecerliBitis?: string;
}

export class PremiumVerDto {
  @IsString()
  oyuncuId: string;

  @IsEnum(PremiumTip)
  tip: PremiumTip;

  @IsNumber()
  @Min(1)
  sureSaat: number;
}

@Controller('premium')
export class PremiumController {
  constructor(private premiumService: PremiumService) {}

  // Tüm paketleri listele - Auth gerektirmez
  @Get('paketler')
  paketleriGetir() {
    return this.premiumService.paketleriGetir();
  }

  // Kendi premium durumumu getir
  @Get('durum')
  @UseGuards(JwtAuthGuard)
  async durumGetir(@Request() req: { user: { id: string } }) {
    const uyelik = await this.premiumService.aktifUyelikGetir(req.user.id);
    return {
      premiumMu: uyelik !== null,
      uyelik,
    };
  }

  // Premium geçmişim
  @Get('gecmis')
  @UseGuards(JwtAuthGuard)
  async gecmisGetir(@Request() req: { user: { id: string } }) {
    return this.premiumService.premiumGecmisiGetir(req.user.id);
  }

  // Premium satın al
  @Post('satin-al')
  @UseGuards(JwtAuthGuard)
  async satinAl(
    @Request() req: { user: { id: string } },
    @Body() dto: PremiumSatinAlDto,
  ) {
    return this.premiumService.premiumSatinAl(
      req.user.id,
      dto.tip,
      dto.odemeRefId,
      dto.odemeYontemi,
    );
  }

  // Promosyon kodu kullan
  @Post('promosyon')
  @UseGuards(JwtAuthGuard)
  async promosyonKullan(
    @Request() req: { user: { id: string } },
    @Body() dto: PromosyonKullanDto,
  ) {
    return this.premiumService.promosyonKoduKullan(req.user.id, dto.kod);
  }
}
