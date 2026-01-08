import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Temizleme işlemi (test için)
  async temizle() {
    // Sıra önemli - foreign key'ler nedeniyle
    await this.oy.deleteMany();
    await this.oneri.deleteMany();
    await this.mesaj.deleteMany();
    await this.tur.deleteMany();
    await this.oyunDurumu.deleteMany();
    await this.toplulukUyesi.deleteMany();
    await this.topluluk.deleteMany();
    await this.yenilemeToken.deleteMany();
    await this.oyuncu.deleteMany();
  }
}
