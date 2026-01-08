import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GorevService } from './gorev.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gorev')
@UseGuards(JwtAuthGuard)
export class GorevController {
  constructor(private gorevService: GorevService) {}

  // Aktif görevlerimi getir
  @Get()
  async gorevleriGetir(@Request() req: { user: { id: string } }) {
    return this.gorevService.aktifGorevleriGetir(req.user.id);
  }

  // Günlük görevleri getir
  @Get('gunluk')
  async gunlukGorevler(@Request() req: { user: { id: string } }) {
    const tumGorevler = await this.gorevService.aktifGorevleriGetir(req.user.id);
    return tumGorevler.filter((g) => g.tip === 'GUNLUK');
  }

  // Haftalık görevleri getir
  @Get('haftalik')
  async haftalikGorevler(@Request() req: { user: { id: string } }) {
    const tumGorevler = await this.gorevService.aktifGorevleriGetir(req.user.id);
    return tumGorevler.filter((g) => g.tip === 'HAFTALIK');
  }

  // Görev ödülünü al
  @Post(':gorevId/odul')
  async odulAl(
    @Request() req: { user: { id: string } },
    @Param('gorevId') gorevId: string,
  ) {
    return this.gorevService.odulAl(req.user.id, gorevId);
  }

  // Varsayılan görevleri oluştur (Admin)
  @Post('seed')
  async varsayilanGörevleriOlustur() {
    return this.gorevService.varsayilanGörevleriOlustur();
  }
}
