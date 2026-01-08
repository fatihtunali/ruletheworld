import { Controller, Get, Query } from '@nestjs/common';
import { IstatistikService } from './istatistik.service';

@Controller('istatistikler')
export class IstatistikController {
  constructor(private istatistikService: IstatistikService) {}

  @Get('liderlik')
  async liderlikTablosu(@Query('limit') limit?: string) {
    const sayi = parseInt(limit || '20', 10);
    return this.istatistikService.liderlikTablosuGetir(Math.min(sayi, 100));
  }

  @Get('genel')
  async genelIstatistikler() {
    return this.istatistikService.genelIstatistiklerGetir();
  }

  @Get('sonuc-dagilimi')
  async sonucDagilimi() {
    return this.istatistikService.oyunSonucDagilimiGetir();
  }
}
