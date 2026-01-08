import { OneriDurumu, OySecimi, EylemTipi } from './enums';
import { KaynakDegisimi } from './kaynaklar';
import { OyuncuOzeti } from './oyuncu';

// Öneri eylemi
export interface OneriEylemi {
  id: string;
  tip: EylemTipi;
  hedef?: string;
  miktar?: number;
  aciklama: string;
  tahminiEtki: KaynakDegisimi;
}

// Öneri
export interface Oneri {
  id: string;
  turId: string;
  onericiId: string;
  onericiAdi: string;
  baslik: string;
  aciklama: string;
  eylemler: OneriEylemi[];
  durum: OneriDurumu;
  evetOylari: number;
  hayirOylari: number;
  cekimserOylar: number;
  olusturuldu: string;
  sonuclandi?: string;
}

// Öneri detayı (oylarla birlikte)
export interface OneriDetay extends Oneri {
  oylar: OyDetay[];
  onerici: OyuncuOzeti;
}

// Oy detayı
export interface OyDetay {
  id: string;
  oneriId: string;
  oyuncuId: string;
  oyuncuAdi: string;
  secim: OySecimi;
  gerekce?: string;
  otomatikMi: boolean;
  oylandiAt: string;
}

// Öneri oluşturma isteği
export interface OneriOlusturIstegi {
  baslik: string;
  aciklama: string;
  eylemler: Omit<OneriEylemi, 'id'>[];
  olayId?: string;  // Hangi olaya yanıt olarak
}

// Oy verme isteği
export interface OyVerIstegi {
  secim: OySecimi;
  gerekce?: string;
}

// Oy sonucu
export interface OySonucu {
  oneriId: string;
  seninOyun: OySecimi;
  mevcutSayim: {
    evet: number;
    hayir: number;
    cekimser: number;
  };
  durum?: OneriDurumu;
}

// Oylama kuralları
export const OYLAMA_KURALLARI = {
  YETER_SAYI: 0.5,              // %50 katılım gerekli
  ESIK: 0.5,                    // Salt çoğunluk
  TUR_BASINA_MAX_ONERI: 3,
  OYUNCU_BASINA_MAX_ONERI: 1,   // Tur başına
};
