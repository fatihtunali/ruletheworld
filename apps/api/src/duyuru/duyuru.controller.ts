import { Controller, Get } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';

@Controller('duyurular')
export class DuyuruController {
  constructor(private adminService: AdminService) {}

  // Aktif duyuruları getir - Auth gerektirmez
  @Get()
  async aktifDuyurulariGetir() {
    return this.adminService.aktifDuyurulariGetir();
  }
}
