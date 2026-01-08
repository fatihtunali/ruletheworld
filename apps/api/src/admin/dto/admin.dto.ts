import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { SistemRolu, BanTipi } from '@prisma/client';

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
