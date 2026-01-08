import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { TurnuvaService } from './turnuva.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TurnuvaDurumu } from '@prisma/client';

@Controller('turnuvalar')
export class TurnuvaController {
  constructor(private turnuvaService: TurnuvaService) {}

  // Turnuvalari listele
  @Get()
  async turnuvalariListele(
    @Query('sayfa') sayfa?: string,
    @Query('limit') limit?: string,
    @Query('durum') durum?: TurnuvaDurumu,
  ) {
    const sayfaNum = parseInt(sayfa || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    return this.turnuvaService.turnuvalariListele(sayfaNum, limitNum, durum);
  }

  // Aktif turnuvalar (kayit acik)
  @Get('aktif')
  async aktifTurnuvalar() {
    const turnuvalar = await this.turnuvaService.aktifTurnuvalar();
    return { turnuvalar };
  }

  // Kullanicinin turnuvalari
  @Get('benim')
  @UseGuards(JwtAuthGuard)
  async benimTurnuvalarim(@Request() req: any) {
    const turnuvalar = await this.turnuvaService.kullanicininTurnuvalari(req.user.sub);
    return { turnuvalar };
  }

  // Turnuva detayi
  @Get(':id')
  async turnuvaDetay(@Param('id') id: string) {
    const turnuva = await this.turnuvaService.turnuvaDetay(id);
    if (!turnuva) {
      return { hata: 'Turnuva bulunamadi' };
    }
    return { turnuva };
  }

  // Turnuva olustur
  @Post()
  @UseGuards(JwtAuthGuard)
  async turnuvaOlustur(
    @Request() req: any,
    @Body()
    body: {
      isim: string;
      aciklama?: string;
      maxKatilimci?: number;
      minKatilimci?: number;
      oyunBasinaOyuncu?: number;
      kayitBitis: string;
      baslamaZamani?: string;
    },
  ) {
    const turnuva = await this.turnuvaService.turnuvaOlustur(req.user.sub, {
      isim: body.isim,
      aciklama: body.aciklama,
      maxKatilimci: body.maxKatilimci,
      minKatilimci: body.minKatilimci,
      oyunBasinaOyuncu: body.oyunBasinaOyuncu,
      kayitBitis: new Date(body.kayitBitis),
      baslamaZamani: body.baslamaZamani ? new Date(body.baslamaZamani) : undefined,
    });
    return { turnuva };
  }

  // Turnuvaya katil
  @Post(':id/katil')
  @UseGuards(JwtAuthGuard)
  async turnuvayaKatil(@Param('id') id: string, @Request() req: any) {
    return this.turnuvaService.turnuvayaKatil(id, req.user.sub);
  }

  // Turnuvadan ayril
  @Delete(':id/ayril')
  @UseGuards(JwtAuthGuard)
  async turnuvadanAyril(@Param('id') id: string, @Request() req: any) {
    return this.turnuvaService.turnuvadanAyril(id, req.user.sub);
  }

  // Turnuvayi baslat (admin veya olusturan)
  @Post(':id/baslat')
  @UseGuards(JwtAuthGuard)
  async turnuvayiBaslat(@Param('id') id: string) {
    return this.turnuvaService.turnuvayiBaslat(id);
  }
}
