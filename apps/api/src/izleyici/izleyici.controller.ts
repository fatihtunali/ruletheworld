import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IzleyiciService } from './izleyici.service';

@ApiTags('Izleyici')
@Controller('izleyici')
export class IzleyiciController {
  constructor(private izleyiciService: IzleyiciService) {}

  @Get('oyunlar')
  @ApiOperation({ summary: 'İzlenebilir oyunları listele' })
  @ApiResponse({ status: 200, description: 'İzlenebilir oyun listesi' })
  async izlenebilirOyunlar() {
    return this.izleyiciService.izlenebilirOyunlar();
  }

  @Post(':toplulukId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bir oyunu izlemeye başla' })
  @ApiResponse({ status: 201, description: 'İzleme başladı' })
  async izlemeyeBasla(@Request() req, @Param('toplulukId') toplulukId: string) {
    return this.izleyiciService.izlemeyeBasla(req.user.id, toplulukId);
  }

  @Delete(':toplulukId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İzlemeyi bırak' })
  @ApiResponse({ status: 200, description: 'İzleme bırakıldı' })
  async izlemeyiBirak(@Request() req, @Param('toplulukId') toplulukId: string) {
    await this.izleyiciService.izlemeyiBirak(req.user.id, toplulukId);
    return { mesaj: 'İzleme bırakıldı' };
  }

  @Get(':toplulukId')
  @ApiOperation({ summary: 'Bir oyunun izleyicilerini getir' })
  @ApiResponse({ status: 200, description: 'İzleyici listesi' })
  async toplulukIzleyicileri(@Param('toplulukId') toplulukId: string) {
    return this.izleyiciService.toplulukIzleyicileri(toplulukId);
  }
}
