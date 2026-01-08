import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { SistemRolu, BanTipi, DuyuruTipi } from '@prisma/client';

export class BanOyuncuDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  sebep: string;

  @IsEnum(BanTipi)
  @IsOptional()
  tip?: BanTipi = BanTipi.GECICI;

  @IsDateString()
  @IsOptional()
  bitis?: string; // Geçici ban için bitiş tarihi
}

export class UnbanOyuncuDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  sebep?: string;
}

export class RolDegistirDto {
  @IsEnum(SistemRolu)
  yeniRol: SistemRolu;
}

export class ToplulukDondurDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  sebep: string;
}

export class MesajSilDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  sebep: string;
}

export class KullaniciAraDto {
  @IsString()
  @IsOptional()
  arama?: string;

  @IsEnum(SistemRolu)
  @IsOptional()
  rol?: SistemRolu;

  @IsString()
  @IsOptional()
  hesapDurumu?: string;

  @IsOptional()
  sayfa?: number = 1;

  @IsOptional()
  limit?: number = 20;
}

// ============ DUYURU DTOları ============

export class DuyuruOlusturDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  baslik: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  icerik: string;

  @IsEnum(DuyuruTipi)
  @IsOptional()
  tip?: DuyuruTipi = DuyuruTipi.BILGI;

  @IsDateString()
  @IsOptional()
  baslangic?: string;

  @IsDateString()
  @IsOptional()
  bitis?: string;
}

export class DuyuruGuncelleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  baslik?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @IsOptional()
  icerik?: string;

  @IsEnum(DuyuruTipi)
  @IsOptional()
  tip?: DuyuruTipi;

  @IsBoolean()
  @IsOptional()
  aktif?: boolean;

  @IsDateString()
  @IsOptional()
  baslangic?: string;

  @IsDateString()
  @IsOptional()
  bitis?: string;
}
