import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { ReaksiyonService } from './reaksiyon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString } from 'class-validator';

class ReaksiyonEkleDto {
  @ApiProperty({ description: 'Reaksiyon emojisi', example: '👍' })
  @IsString()
  emoji: string;
}

@ApiTags('Reaksiyonlar')
@Controller('reaksiyonlar')
export class ReaksiyonController {
  constructor(private reaksiyonService: ReaksiyonService) {}

  @Get('emojiler')
  @ApiOperation({ summary: 'İzin verilen emojiler', description: 'Reaksiyon olarak kullanılabilecek emojilerin listesi' })
  @ApiResponse({ status: 200, description: 'Emoji listesi' })
  izinVerilenEmojiler() {
    return {
      emojiler: this.reaksiyonService.izinVerilenEmojileriGetir(),
    };
  }

  @Post('mesaj/:mesajId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reaksiyon ekle/kaldır', description: 'Mesaja reaksiyon ekler veya kaldırır (toggle)' })
  @ApiResponse({ status: 200, description: 'Reaksiyon durumu güncellendi' })
  async reaksiyonToggle(
    @Request() req: { user: { id: string } },
    @Param('mesajId') mesajId: string,
    @Body() dto: ReaksiyonEkleDto,
  ) {
    return this.reaksiyonService.reaksiyonToggle(mesajId, req.user.id, dto.emoji);
  }

  @Get('mesaj/:mesajId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mesaj reaksiyonları', description: 'Mesajın aldığı reaksiyonları getirir' })
  @ApiResponse({ status: 200, description: 'Reaksiyon listesi' })
  async mesajReaksiyonlari(
    @Request() req: { user: { id: string } },
    @Param('mesajId') mesajId: string,
  ) {
    const reaksiyonlar = await this.reaksiyonService.mesajReaksiyonlariGetir(
      mesajId,
      req.user.id,
    );
    return { reaksiyonlar };
  }

  @Get('mesaj/:mesajId/emoji/:emoji/oyuncular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reaksiyon veren oyuncular', description: 'Belirli emojiye reaksiyon veren oyuncuları getirir' })
  @ApiResponse({ status: 200, description: 'Oyuncu listesi' })
  async reaksiyonVerenOyuncular(
    @Param('mesajId') mesajId: string,
    @Param('emoji') emoji: string,
  ) {
    const oyuncular = await this.reaksiyonService.reaksiyonVerenOyunculariGetir(
      mesajId,
      decodeURIComponent(emoji),
    );
    return { oyuncular };
  }
}
