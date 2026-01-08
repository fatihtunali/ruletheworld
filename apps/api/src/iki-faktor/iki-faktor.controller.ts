import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IkiFactorService } from './iki-faktor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString } from 'class-validator';

class TokenDto {
  @ApiProperty({ description: '6 haneli doğrulama kodu veya yedek kod', example: '123456' })
  @IsString()
  token: string;
}

@ApiTags('2FA (İki Faktörlü Doğrulama)')
@Controller('2fa')
export class IkiFactorController {
  constructor(private ikiFaktorService: IkiFactorService) {}

  @Get('durum')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '2FA durumu', description: 'İki faktörlü doğrulama durumunu kontrol eder' })
  @ApiResponse({ status: 200, description: '2FA aktif mi ve kalan yedek kod sayısı' })
  async durum(@Request() req: { user: { id: string } }) {
    return this.ikiFaktorService.durumGetir(req.user.id);
  }

  @Post('kurulum/baslat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '2FA kurulumu başlat', description: 'Secret key ve QR kod oluşturur' })
  @ApiResponse({ status: 200, description: 'Secret, OTPAuth URL ve QR kod URL' })
  @ApiResponse({ status: 400, description: '2FA zaten aktif' })
  async kurulumBaslat(@Request() req: { user: { id: string } }) {
    return this.ikiFaktorService.kurulumBaslat(req.user.id);
  }

  @Post('kurulum/tamamla')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '2FA kurulumu tamamla', description: 'Doğrulama kodu ile 2FA aktivasyonu' })
  @ApiResponse({ status: 200, description: 'Yedek kodlar listesi' })
  @ApiResponse({ status: 400, description: 'Geçersiz kod' })
  async kurulumTamamla(
    @Request() req: { user: { id: string } },
    @Body() dto: TokenDto,
  ) {
    return this.ikiFaktorService.kurulumTamamla(req.user.id, dto.token);
  }

  @Post('dogrula')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '2FA doğrula', description: 'Doğrulama kodu veya yedek kod ile giriş' })
  @ApiResponse({ status: 200, description: 'Doğrulama başarılı' })
  @ApiResponse({ status: 401, description: 'Geçersiz kod' })
  async dogrula(
    @Request() req: { user: { id: string } },
    @Body() dto: TokenDto,
  ) {
    const gecerli = await this.ikiFaktorService.dogrula(req.user.id, dto.token);
    if (!gecerli) {
      return { basarili: false, mesaj: 'Geçersiz doğrulama kodu' };
    }
    return { basarili: true, mesaj: 'Doğrulama başarılı' };
  }

  @Post('deaktif')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '2FA kapat', description: 'İki faktörlü doğrulamayı deaktif eder' })
  @ApiResponse({ status: 200, description: '2FA kapatıldı' })
  @ApiResponse({ status: 400, description: '2FA zaten kapalı' })
  async deaktifEt(
    @Request() req: { user: { id: string } },
    @Body() dto: TokenDto,
  ) {
    return this.ikiFaktorService.deaktifEt(req.user.id, dto.token);
  }

  @Post('yedek-kodlar/yenile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Yedek kodları yenile', description: '10 yeni yedek kod oluşturur' })
  @ApiResponse({ status: 200, description: 'Yeni yedek kodlar listesi' })
  @ApiResponse({ status: 401, description: 'Geçersiz doğrulama kodu' })
  async yedekKodlariYenile(
    @Request() req: { user: { id: string } },
    @Body() dto: TokenDto,
  ) {
    return this.ikiFaktorService.yedekKodlariYenile(req.user.id, dto.token);
  }
}
