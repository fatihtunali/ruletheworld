import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AktiviteService } from './aktivite.service';

@ApiTags('Aktivite')
@Controller('aktivite')
export class AktiviteController {
  constructor(private aktiviteService: AktiviteService) {}

  @Get('benim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi aktivitelerimi getir' })
  @ApiQuery({ name: 'sayfa', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Aktivite listesi' })
  async benimAktivitelerim(
    @Request() req,
    @Query('sayfa') sayfa?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aktiviteService.oyuncuAktiviteleri(
      req.user.id,
      sayfa ? parseInt(sayfa) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('arkadaslar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arkadaşların aktivitelerini getir' })
  @ApiQuery({ name: 'sayfa', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Arkadaş aktiviteleri' })
  async arkadasAktiviteleri(
    @Request() req,
    @Query('sayfa') sayfa?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aktiviteService.arkadasAktiviteleri(
      req.user.id,
      sayfa ? parseInt(sayfa) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('global')
  @ApiOperation({ summary: 'Global aktivite akışı' })
  @ApiQuery({ name: 'sayfa', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Global aktiviteler' })
  async globalAktiviteler(
    @Query('sayfa') sayfa?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aktiviteService.globalAktiviteler(
      sayfa ? parseInt(sayfa) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('goruldu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktiviteleri görüldü olarak işaretle' })
  @ApiResponse({ status: 200, description: 'Aktiviteler işaretlendi' })
  async gorulduIsaretle(@Request() req) {
    await this.aktiviteService.gorulduIsaretle(req.user.id);
    return { mesaj: 'Aktiviteler görüldü olarak işaretlendi' };
  }

  @Get('gorulmemis-sayisi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Görülmemiş aktivite sayısı' })
  @ApiResponse({ status: 200, description: 'Görülmemiş aktivite sayısı' })
  async gorulmemisSayisi(@Request() req) {
    const sayi = await this.aktiviteService.gorulmemisAktiviteSayisi(req.user.id);
    return { sayi };
  }
}
