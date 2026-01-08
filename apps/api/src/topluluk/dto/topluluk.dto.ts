import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class ToplulukOlusturDto {
  @IsString()
  @MinLength(3, { message: 'Topluluk ismi en az 3 karakter olmalıdır' })
  @MaxLength(30, { message: 'Topluluk ismi en fazla 30 karakter olabilir' })
  isim: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  aciklama?: string;
}
