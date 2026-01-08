import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SiralamaService } from './siralama.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('siralama')
export class SiralamaController {
  constructor(private siralamaService: SiralamaService) {}

  // Genel sıralama (public)
  @Get('genel')
  async genelSiralama(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.siralamaService.genelSiralama(
      parseInt(limit || '100'),
      parseInt(offset || '0'),
    );
  }

  // Haftalık sıralama (public)
  @Get('haftalik')
  async haftalikSiralama(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.siralamaService.haftalikSiralama(
      parseInt(limit || '100'),
      parseInt(offset || '0'),
    );
  }

  // Sezon sıralaması (public)
  @Get('sezon')
  async sezonSiralama(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.siralamaService.sezonSiralama(
      parseInt(limit || '100'),
      parseInt(offset || '0'),
    );
  }

  // En iyi oyuncular özeti (public)
  @Get('en-iyiler')
  async enIyiOyuncular() {
    return this.siralamaService.enIyiOyuncular();
  }

  // Kullanıcının kendi sıralaması
  @Get('benim')
  @UseGuards(JwtAuthGuard)
  async kullaniciSiralama(@Request() req: { user: { id: string } }) {
    return this.siralamaService.kullaniciSiralama(req.user.id);
  }

  // Arkadaşlar arası sıralama
  @Get('arkadaslar')
  @UseGuards(JwtAuthGuard)
  async arkadasSiralama(@Request() req: { user: { id: string } }) {
    return this.siralamaService.arkadasSiralama(req.user.id);
  }
}
