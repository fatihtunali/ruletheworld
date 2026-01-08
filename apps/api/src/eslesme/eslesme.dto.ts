import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OyunModu } from '@prisma/client';

export class EslesmeKuyrugaGirDto {
  @ApiPropertyOptional({ enum: OyunModu, description: 'Oyun modu', default: 'NORMAL' })
  @IsOptional()
  @IsEnum(OyunModu)
  oyunModu?: OyunModu;

  @ApiPropertyOptional({ description: 'Minimum oyuncu sayısı', default: 4 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(8)
  minOyuncu?: number;

  @ApiPropertyOptional({ description: 'Maksimum oyuncu sayısı', default: 8 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(12)
  maxOyuncu?: number;
}
