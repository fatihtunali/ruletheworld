import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { KayitDto, GirisDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('kayit')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı', description: 'Yeni bir oyuncu hesabı oluşturur' })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı, JWT token döner' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya kullanıcı zaten mevcut' })
  async kayitOl(@Body() dto: KayitDto) {
    return this.authService.kayitOl(dto);
  }

  @Post('giris')
  @ApiOperation({ summary: 'Kullanıcı girişi', description: 'Email ve şifre ile giriş yapar' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı, JWT token döner' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  async girisYap(@Body() dto: GirisDto) {
    return this.authService.girisYap(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profil')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Profil bilgilerini getir', description: 'Giriş yapmış kullanıcının profil bilgilerini döner' })
  @ApiResponse({ status: 200, description: 'Profil bilgileri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async profilGetir(@Request() req: { user: { id: string } }) {
    return this.authService.profilGetir(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profil/detay')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Detaylı profil bilgileri', description: 'İstatistikler ve son oyunlar dahil detaylı profil' })
  @ApiResponse({ status: 200, description: 'Detaylı profil bilgileri' })
  async profilDetayGetir(@Request() req: { user: { id: string } }) {
    return this.authService.profilDetayGetir(req.user.id);
  }

  @Post('sifre-sifirlama/talep')
  async sifreSifirlamaTalebi(@Body() body: { email: string }) {
    return this.authService.sifreSifirlamaTalebi(body.email);
  }

  @Post('sifre-sifirlama/dogrula')
  async sifreSifirlamaDogrula(@Body() body: { token: string }) {
    return this.authService.sifreSifirlamaDogrula(body.token);
  }

  @Post('sifre-sifirlama/sifirla')
  async sifreyiSifirla(@Body() body: { token: string; yeniSifre: string }) {
    return this.authService.sifreyiSifirla(body.token, body.yeniSifre);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sifre-degistir')
  async sifreDegistir(
    @Request() req: { user: { id: string } },
    @Body() body: { eskiSifre: string; yeniSifre: string },
  ) {
    return this.authService.sifreDegistir(
      req.user.id,
      body.eskiSifre,
      body.yeniSifre,
    );
  }

  // Email dogrulama
  @Post('email-dogrula')
  async emailDogrula(@Body() body: { token: string }) {
    return this.authService.emailDogrula(body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('email-dogrulama/durum')
  async emailDogrulamaDurumu(@Request() req: { user: { id: string } }) {
    return this.authService.emailDogrulamaDurumu(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-dogrulama/yeniden-gonder')
  async emailDogrulamaYenidenGonder(@Request() req: { user: { id: string } }) {
    return this.authService.emailDogrulamaYenidenGonder(req.user.id);
  }
}
