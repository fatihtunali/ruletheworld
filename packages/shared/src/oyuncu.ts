import { UyeRolu, UyeDurumu } from './enums';

// Temel oyuncu bilgisi
export interface Oyuncu {
  id: string;
  kullaniciAdi: string;
  email: string;
  oynananOyunlar: number;
  tamamlananOyunlar: number;
  yapilanOneriler: number;
  verilenOylar: number;
  olusturuldu: string;
}

// Oyuncu özeti (liste görünümleri için)
export interface OyuncuOzeti {
  id: string;
  kullaniciAdi: string;
  cevrimiciMi: boolean;
}

// Topluluk üyesi bilgisi
export interface ToplulukUyesi {
  id: string;
  oyuncuId: string;
  toplulukId: string;
  rol: UyeRolu;
  durum: UyeDurumu;
  afkTurSayisi: number;
  katildiAt: string;
  oyuncu: OyuncuOzeti;
}

// Kayıt isteği
export interface KayitIstegi {
  kullaniciAdi: string;
  email: string;
  sifre: string;
}

// Giriş isteği
export interface GirisIstegi {
  email: string;
  sifre: string;
}

// Auth yanıtı
export interface AuthYaniti {
  accessToken: string;
  refreshToken: string;
  oyuncu: Oyuncu;
}

// Token yenileme isteği
export interface TokenYenileIstegi {
  refreshToken: string;
}
