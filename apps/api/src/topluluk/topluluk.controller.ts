import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ToplulukService } from './topluluk.service';
import { ToplulukOlusturDto } from './dto/topluluk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('topluluklar')
@UseGuards(JwtAuthGuard)
export class ToplulukController {
  constructor(private toplulukService: ToplulukService) {}

  @Get()
  async tumTopluluklariGetir() {
    return this.toplulukService.tumTopluluklariGetir();
  }

  @Post()
  async toplulukOlustur(
    @Request() req: { user: { id: string } },
    @Body() dto: ToplulukOlusturDto,
  ) {
    return this.toplulukService.toplulukOlustur(req.user.id, dto);
  }

  @Post('katil/:kod')
  async toplulugaKatil(
    @Request() req: { user: { id: string } },
    @Param('kod') kod: string,
  ) {
    return this.toplulukService.toplulugaKatil(req.user.id, kod);
  }

  @Get(':id')
  async toplulukDetayGetir(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.toplulukService.toplulukDetayGetir(id, req.user.id);
  }
}
