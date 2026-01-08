import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BildirimService } from './bildirim.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bildirimler')
@UseGuards(JwtAuthGuard)
export class BildirimController {
  constructor(private bildirimService: BildirimService) {}

  @Get()
  async bildirimleriGetir(
    @Request() req,
    @Query('sayfa') sayfa?: string,
  ) {
    const sayfaNo = parseInt(sayfa || '1', 10);
    return this.bildirimService.bildirimleriGetir(req.user.id, sayfaNo);
  }

  @Get('okunmamis-sayisi')
  async okunmamisSayisiGetir(@Request() req) {
    const sayi = await this.bildirimService.okunmamisSayisiGetir(req.user.id);
    return { sayi };
  }

  @Post(':id/okundu')
  async okunduIsaretle(@Request() req, @Param('id') bildirimId: string) {
    const basarili = await this.bildirimService.okunduIsaretle(
      req.user.id,
      bildirimId,
    );
    return { basarili };
  }

  @Post('tumunu-oku')
  async tumunuOkunduIsaretle(@Request() req) {
    const okunan = await this.bildirimService.tumunuOkunduIsaretle(req.user.id);
    return { okunan };
  }
}
