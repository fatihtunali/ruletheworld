import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ArkadaslikService } from './arkadaslik.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('arkadaslik')
@UseGuards(JwtAuthGuard)
export class ArkadaslikController {
  constructor(private arkadaslikService: ArkadaslikService) {}

  // Arkadaş listesi
  @Get()
  async arkadaslariGetir(@Request() req: { user: { id: string } }) {
    return this.arkadaslikService.arkadaslariGetir(req.user.id);
  }

  // Çevrimiçi arkadaşlar
  @Get('cevrimici')
  async cevrimiciArkadaslar(@Request() req: { user: { id: string } }) {
    return this.arkadaslikService.cevrimiçiArkadaslar(req.user.id);
  }

  // Bekleyen istekler
  @Get('istekler')
  async bekleyenIstekleriGetir(@Request() req: { user: { id: string } }) {
    return this.arkadaslikService.bekleyenIstekleriGetir(req.user.id);
  }

  // Engellenen kullanıcılar
  @Get('engellenenler')
  async engellenenler(@Request() req: { user: { id: string } }) {
    return this.arkadaslikService.engellenenler(req.user.id);
  }

  // Kullanıcı ara
  @Get('ara')
  async kullaniciAra(
    @Request() req: { user: { id: string } },
    @Query('q') arama: string,
  ) {
    return this.arkadaslikService.kullaniciAra(req.user.id, arama);
  }

  // Arkadaşlık isteği gönder
  @Post('istek')
  async istekGonder(
    @Request() req: { user: { id: string } },
    @Body() body: { kullaniciAdi: string },
  ) {
    return this.arkadaslikService.istekGonder(req.user.id, body.kullaniciAdi);
  }

  // İsteği kabul et
  @Post('kabul/:id')
  async istekKabulEt(
    @Request() req: { user: { id: string } },
    @Param('id') arkadaslikId: string,
  ) {
    return this.arkadaslikService.istekKabulEt(req.user.id, arkadaslikId);
  }

  // İsteği reddet
  @Post('reddet/:id')
  async istekReddet(
    @Request() req: { user: { id: string } },
    @Param('id') arkadaslikId: string,
  ) {
    return this.arkadaslikService.istekReddet(req.user.id, arkadaslikId);
  }

  // Arkadaşlıktan çıkar
  @Delete(':arkadasId')
  async arkadaslikCikar(
    @Request() req: { user: { id: string } },
    @Param('arkadasId') arkadasId: string,
  ) {
    return this.arkadaslikService.arkadaslikCikar(req.user.id, arkadasId);
  }

  // Engelle
  @Post('engelle/:hedefId')
  async engelle(
    @Request() req: { user: { id: string } },
    @Param('hedefId') hedefId: string,
  ) {
    return this.arkadaslikService.engelle(req.user.id, hedefId);
  }

  // Engeli kaldır
  @Delete('engel/:hedefId')
  async engelKaldir(
    @Request() req: { user: { id: string } },
    @Param('hedefId') hedefId: string,
  ) {
    return this.arkadaslikService.engelKaldir(req.user.id, hedefId);
  }
}
