import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { AltinService } from './altin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

class HediyeGonderDto {
  @ApiProperty({ description: 'Alıcının kullanıcı adı' })
  @IsString()
  aliciKullaniciAdi: string;

  @ApiProperty({ description: 'Gönderilecek altın miktarı', minimum: 10 })
  @IsNumber()
  @Min(10)
  miktar: number;

  @ApiProperty({ description: 'Hediye mesajı (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  mesaj?: string;
}

@ApiTags('Altın')
@ApiBearerAuth('JWT-auth')
@Controller('altin')
@UseGuards(JwtAuthGuard)
export class AltinController {
  constructor(private altinService: AltinService) {}

  @Get('bakiye')
  @ApiOperation({ summary: 'Altın bakiyesi', description: 'Oyuncunun altın cüzdanı bilgileri' })
  @ApiResponse({ status: 200, description: 'Bakiye, toplam kazanılan ve harcanan' })
  async bakiyeGetir(@Request() req: { user: { id: string } }) {
    return this.altinService.bakiyeGetir(req.user.id);
  }

  @Get('islemler')
  @ApiOperation({ summary: 'İşlem geçmişi', description: 'Altın işlem geçmişi listesi' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maksimum işlem sayısı (varsayılan: 20)' })
  @ApiResponse({ status: 200, description: 'İşlem listesi' })
  async islemGecmisi(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: number,
  ) {
    return this.altinService.islemGecmisiGetir(req.user.id, limit || 20);
  }

  @Post('gunluk-bonus')
  @ApiOperation({ summary: 'Günlük bonus al', description: 'Her gün 100 altın bonus kazanın' })
  @ApiResponse({ status: 200, description: 'Bonus alındı, yeni miktar döner' })
  @ApiResponse({ status: 400, description: 'Bugün zaten bonus alınmış' })
  async gunlukBonusAl(@Request() req: { user: { id: string } }) {
    return this.altinService.gunlukBonusAl(req.user.id);
  }

  @Post('hediye')
  @ApiOperation({ summary: 'Altın hediye et', description: 'Başka bir oyuncuya altın gönder' })
  @ApiResponse({ status: 200, description: 'Hediye gönderildi' })
  @ApiResponse({ status: 400, description: 'Yetersiz bakiye veya geçersiz alıcı' })
  async hediyeGonder(
    @Request() req: { user: { id: string } },
    @Body() dto: HediyeGonderDto,
  ) {
    return this.altinService.hediyeGonder(
      req.user.id,
      dto.aliciKullaniciAdi,
      dto.miktar,
      dto.mesaj,
    );
  }
}
