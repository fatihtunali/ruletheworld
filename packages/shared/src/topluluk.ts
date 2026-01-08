import { ToplulukDurumu } from './enums';
import { ToplulukUyesi } from './oyuncu';

// Temel topluluk bilgisi
export interface Topluluk {
  id: string;
  isim: string;
  durum: ToplulukDurumu;
  maxOyuncu: number;
  minOyuncu: number;
  gizliMi: boolean;
  davetKodu?: string;
  kurucuId: string;
  oyuncuSayisi: number;
  olusturuldu: string;
}

// Topluluk detayı (üyelerle birlikte)
export interface ToplulukDetay extends Topluluk {
  uyeler: ToplulukUyesi[];
}

// Topluluk oluşturma isteği
export interface ToplulukOlusturIstegi {
  isim: string;
  maxOyuncu?: number;
  gizliMi?: boolean;
}

// Topluluk katılma isteği
export interface ToplulukKatilIstegi {
  davetKodu?: string;
}

// Topluluk listesi yanıtı (sayfalı)
export interface ToplulukListesi {
  items: Topluluk[];
  sonrakiCursor?: string;
}

// Oyun sabitleri
export const OYUN_SABITLERI = {
  MIN_OYUNCU: 4,
  MAX_OYUNCU: 8,
  VARSAYILAN_MAX_OYUNCU: 8,
  TOPLAM_TUR: 6,
};
