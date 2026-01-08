import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GorevService } from './gorev.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Görev')
@ApiBearerAuth('JWT-auth')
@Controller('gorevler')
@UseGuards(JwtAuthGuard)
export class GorevController {
  constructor(private gorevService: GorevService) {}

  @Get('ilerleme')
  @ApiOperation({ summary: 'Görev ilerleme durumu', description: 'Oyuncunun tüm aktif görevleri ve ilerleme durumu' })
  @ApiResponse({ status: 200, description: 'Görev listesi ve ilerleme' })
  async gorevleriGetir(@Request() req: { user: { id: string } }) {
    return this.gorevService.aktifGorevleriGetir(req.user.id);
  }

  @Get('gunluk')
  @ApiOperation({ summary: 'Günlük görevler', description: 'Sadece günlük görevleri listeler' })
  @ApiResponse({ status: 200, description: 'Günlük görev listesi' })
  async gunlukGorevler(@Request() req: { user: { id: string } }) {
    const tumGorevler = await this.gorevService.aktifGorevleriGetir(req.user.id);
    return tumGorevler.filter((g) => g.tip === 'GUNLUK');
  }

  @Get('haftalik')
  @ApiOperation({ summary: 'Haftalık görevler', description: 'Sadece haftalık görevleri listeler' })
  @ApiResponse({ status: 200, description: 'Haftalık görev listesi' })
  async haftalikGorevler(@Request() req: { user: { id: string } }) {
    const tumGorevler = await this.gorevService.aktifGorevleriGetir(req.user.id);
    return tumGorevler.filter((g) => g.tip === 'HAFTALIK');
  }

  @Post(':gorevId/odul-al')
  @ApiOperation({ summary: 'Görev ödülü al', description: 'Tamamlanan görevin ödülünü alır' })
  @ApiResponse({ status: 200, description: 'Ödül alındı' })
  @ApiResponse({ status: 400, description: 'Görev henüz tamamlanmadı veya ödül alınmış' })
  async odulAl(
    @Request() req: { user: { id: string } },
    @Param('gorevId') gorevId: string,
  ) {
    return this.gorevService.odulAl(req.user.id, gorevId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Varsayılan görevleri oluştur', description: 'Admin: Varsayılan görevleri sisteme ekler' })
  @ApiResponse({ status: 201, description: 'Görevler oluşturuldu' })
  async varsayilanGörevleriOlustur() {
    return this.gorevService.varsayilanGörevleriOlustur();
  }
}
