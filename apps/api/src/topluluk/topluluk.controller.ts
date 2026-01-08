import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ToplulukService } from './topluluk.service';
import { ToplulukOlusturDto } from './dto/topluluk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Topluluk')
@ApiBearerAuth('JWT-auth')
@Controller('topluluklar')
@UseGuards(JwtAuthGuard)
export class ToplulukController {
  constructor(private toplulukService: ToplulukService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm toplulukları getir', description: 'Açık olan tüm toplulukları listeler' })
  @ApiResponse({ status: 200, description: 'Topluluk listesi başarıyla getirildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async tumTopluluklariGetir() {
    return this.toplulukService.tumTopluluklariGetir();
  }

  @Post()
  @ApiOperation({ summary: 'Yeni topluluk oluştur', description: 'Yeni bir oyun topluluğu oluşturur' })
  @ApiResponse({ status: 201, description: 'Topluluk başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async toplulukOlustur(
    @Request() req: { user: { id: string } },
    @Body() dto: ToplulukOlusturDto,
  ) {
    return this.toplulukService.toplulukOlustur(req.user.id, dto);
  }

  @Post('katil/:kod')
  @ApiOperation({ summary: 'Topluluğa katıl', description: 'Davet kodu ile topluluğa katılır' })
  @ApiParam({ name: 'kod', description: '6 haneli davet kodu', example: 'ABC123' })
  @ApiResponse({ status: 200, description: 'Topluluğa başarıyla katıldı' })
  @ApiResponse({ status: 400, description: 'Geçersiz kod veya topluluk dolu' })
  @ApiResponse({ status: 404, description: 'Topluluk bulunamadı' })
  async toplulugaKatil(
    @Request() req: { user: { id: string } },
    @Param('kod') kod: string,
  ) {
    return this.toplulukService.toplulugaKatil(req.user.id, kod);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Topluluk detayı', description: 'Belirli bir topluluğun detaylarını getirir' })
  @ApiParam({ name: 'id', description: 'Topluluk ID' })
  @ApiResponse({ status: 200, description: 'Topluluk detayları başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Topluluk bulunamadı' })
  async toplulukDetayGetir(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.toplulukService.toplulukDetayGetir(id, req.user.id);
  }

  @Post(':id/bot-ekle')
  @ApiOperation({ summary: 'Bot ekle', description: 'Topluluğa bot oyuncu ekler (sadece kurucu)' })
  @ApiParam({ name: 'id', description: 'Topluluk ID' })
  @ApiBody({ schema: { type: 'object', properties: { adet: { type: 'number', default: 1, description: 'Eklenecek bot sayısı' } } } })
  @ApiResponse({ status: 200, description: 'Bot başarıyla eklendi' })
  @ApiResponse({ status: 403, description: 'Sadece kurucu bot ekleyebilir' })
  async botEkle(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { adet?: number },
  ) {
    return this.toplulukService.manuelBotEkle(id, req.user.id, body.adet || 1);
  }

  @Post(':id/botlarla-doldur')
  @ApiOperation({ summary: 'Botlarla doldur', description: 'Boş tüm yerleri bot ile doldurur (sadece kurucu)' })
  @ApiParam({ name: 'id', description: 'Topluluk ID' })
  @ApiResponse({ status: 200, description: 'Botlar başarıyla eklendi' })
  @ApiResponse({ status: 403, description: 'Sadece kurucu bot ekleyebilir' })
  async botlarlaDoldur(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.toplulukService.manuelBotEkle(id, req.user.id, 8);
  }
}
