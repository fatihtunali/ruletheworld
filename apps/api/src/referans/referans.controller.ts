import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReferansService } from './referans.service';

class ReferansKullanDto {
  kod: string;
}

@ApiTags('Referans')
@Controller('referans')
export class ReferansController {
  constructor(private referansService: ReferansService) {}

  @Get('kodum')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi referans kodumu getir' })
  @ApiResponse({ status: 200, description: 'Referans kodu' })
  async referansKoduGetir(@Request() req) {
    return this.referansService.referansKoduGetir(req.user.id);
  }

  @Post('kullan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Referans kodu kullan' })
  @ApiResponse({ status: 201, description: 'Kod kullanıldı' })
  async referansKoduKullan(@Request() req, @Body() dto: ReferansKullanDto) {
    await this.referansService.referansKoduKullan(req.user.id, dto.kod);
    return { mesaj: 'Referans kodu başarıyla kullanıldı' };
  }

  @Get('istatistikler')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Referans istatistiklerimi getir' })
  @ApiResponse({ status: 200, description: 'Referans istatistikleri' })
  async referansIstatistikleri(@Request() req) {
    return this.referansService.referansIstatistikleri(req.user.id);
  }
}
