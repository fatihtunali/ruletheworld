import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EslesmeService, EslesmeKuyrugaGirDto } from './eslesme.service';

@ApiTags('Eslestirme')
@Controller('eslestirme')
export class EslesmeController {
  constructor(private eslesmeService: EslesmeService) {}

  @Post('kuyruk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eşleştirme kuyruğuna gir' })
  @ApiResponse({ status: 201, description: 'Kuyruğa başarıyla girildi' })
  async kuyrugaGir(@Request() req, @Body() dto: EslesmeKuyrugaGirDto) {
    return this.eslesmeService.kuyrugaGir(req.user.id, dto);
  }

  @Delete('kuyruk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eşleştirme kuyruğundan çık' })
  @ApiResponse({ status: 200, description: 'Kuyruktan başarıyla çıkıldı' })
  async kuyrukdanCik(@Request() req) {
    await this.eslesmeService.kuyrukdanCik(req.user.id);
    return { mesaj: 'Kuyruktan çıkıldı' };
  }

  @Get('kuyruk/durum')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kuyruk durumunu kontrol et' })
  @ApiResponse({ status: 200, description: 'Kuyruk durumu' })
  async kuyrukDurumu(@Request() req) {
    const durum = await this.eslesmeService.kuyrukDurumuGetir(req.user.id);
    return durum || { kuyrukta: false };
  }

  @Get('kuyruk/istatistikler')
  @ApiOperation({ summary: 'Kuyruk istatistiklerini getir' })
  @ApiResponse({ status: 200, description: 'Kuyruk istatistikleri' })
  async kuyrukIstatistikleri() {
    return this.eslesmeService.kuyrukIstatistikleri();
  }
}
