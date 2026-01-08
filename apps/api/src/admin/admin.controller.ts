import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminOnly, ModeratorOnly } from './decorators/roles.decorator';
import { BanOyuncuDto, UnbanOyuncuDto, RolDegistirDto, KullaniciAraDto, ToplulukDondurDto, DuyuruOlusturDto, DuyuruGuncelleDto, PromosyonOlusturDto, PremiumVerDto } from './dto/admin.dto';
import { PremiumService } from '../premium/premium.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private premiumService: PremiumService,
  ) {}

  // ============ İSTATİSTİKLER ============

  @Get('istatistikler')
  @ModeratorOnly()
  async istatistikleriGetir() {
    return this.adminService.istatistikleriGetir();
  }

  // ============ KULLANICI YÖNETİMİ ============

  @Get('kullanicilar')
  @ModeratorOnly()
  async kullanicilariGetir(@Query() dto: KullaniciAraDto) {
    return this.adminService.kullanicilariGetir(dto);
  }

  @Get('kullanicilar/:id')
  @ModeratorOnly()
  async kullaniciDetayGetir(@Param('id') id: string) {
    return this.adminService.kullaniciDetayGetir(id);
  }

  @Post('kullanicilar/:id/ban')
  @ModeratorOnly()
  async oyuncuyuBanla(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: BanOyuncuDto,
  ) {
    return this.adminService.oyuncuyuBanla(id, req.user.id, dto);
  }

  @Post('kullanicilar/:id/unban')
  @ModeratorOnly()
  async oyuncununBaniniKaldir(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UnbanOyuncuDto,
  ) {
    return this.adminService.oyuncununBaniniKaldir(id, req.user.id, dto);
  }

  @Put('kullanicilar/:id/rol')
  @AdminOnly()
  async rolDegistir(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: RolDegistirDto,
  ) {
    return this.adminService.rolDegistir(id, req.user.id, dto);
  }

  // ============ TOPLULUK YÖNETİMİ ============

  @Get('topluluklar')
  @ModeratorOnly()
  async topluluklariGetir(
    @Query('sayfa') sayfa?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.topluluklariGetir(sayfa, limit);
  }

  @Delete('topluluklar/:id')
  @AdminOnly()
  async toplulukSil(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: ToplulukDondurDto,
  ) {
    return this.adminService.toplulukSil(id, req.user.id, dto.sebep);
  }

  // ============ MODERASYON LOGLARI ============

  @Get('loglar')
  @ModeratorOnly()
  async moderasyonLoglariniGetir(
    @Query('sayfa') sayfa?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.moderasyonLoglariniGetir(sayfa, limit);
  }

  // ============ İLK ADMIN OLUŞTURMA ============
  // Bu endpoint sadece sistemde admin yokken çalışır

  @Post('ilk-admin')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard) // RolesGuard yok çünkü henüz admin yok
  async ilkAdminOlustur(@Request() req: { user: { id: string } }) {
    return this.adminService.ilkAdminOlustur(req.user.id);
  }

  // ============ SİSTEM DUYURULARI ============

  @Get('duyurular')
  @ModeratorOnly()
  async duyurulariGetir(
    @Query('sayfa') sayfa?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.duyurulariGetir(sayfa, limit);
  }

  @Post('duyurular')
  @AdminOnly()
  async duyuruOlustur(
    @Request() req: { user: { id: string } },
    @Body() dto: DuyuruOlusturDto,
  ) {
    return this.adminService.duyuruOlustur(req.user.id, dto);
  }

  @Put('duyurular/:id')
  @AdminOnly()
  async duyuruGuncelle(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: DuyuruGuncelleDto,
  ) {
    return this.adminService.duyuruGuncelle(id, req.user.id, dto);
  }

  @Delete('duyurular/:id')
  @AdminOnly()
  async duyuruSil(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.duyuruSil(id, req.user.id);
  }

  // ============ PREMİUM YÖNETİMİ ============

  @Post('premium/promosyon')
  @AdminOnly()
  async promosyonOlustur(
    @Request() req: { user: { id: string } },
    @Body() dto: PromosyonOlusturDto,
  ) {
    return this.premiumService.promosyonKoduOlustur(req.user.id, {
      kod: dto.kod,
      premiumTip: dto.premiumTip,
      sureSaat: dto.sureSaat,
      maxKullanim: dto.maxKullanim,
      gecerliBitis: dto.gecerliBitis ? new Date(dto.gecerliBitis) : undefined,
    });
  }

  @Post('premium/ver')
  @AdminOnly()
  async premiumVer(
    @Request() req: { user: { id: string } },
    @Body() dto: PremiumVerDto,
  ) {
    return this.premiumService.premiumVer(
      dto.oyuncuId,
      dto.premiumTip,
      dto.sureSaat,
      req.user.id,
    );
  }
}
