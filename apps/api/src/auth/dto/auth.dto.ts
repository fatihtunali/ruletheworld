import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class KayitDto {
  @IsString()
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  @MaxLength(20, { message: 'Kullanıcı adı en fazla 20 karakter olabilir' })
  kullaniciAdi: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  sifre: string;
}

export class GirisDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @IsString()
  sifre: string;
}

export class AuthResponse {
  accessToken: string;
  oyuncu: {
    id: string;
    kullaniciAdi: string;
    email: string;
    olusturulmaTarihi: Date;
  };
}
