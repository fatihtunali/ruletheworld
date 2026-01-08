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
import { BanOyuncuDto, UnbanOyuncuDto, RolDegistirDto, KullaniciAraDto, ToplulukDondurDto } from './dto/admin.dto';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

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
}
