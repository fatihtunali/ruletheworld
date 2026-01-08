// API yanıt yapısı
export interface ApiYaniti<T> {
  basarili: boolean;
  veri?: T;
  hata?: ApiHatasi;
}

// API hatası
export interface ApiHatasi {
  kod: string;
  mesaj: string;
  detaylar?: Record<string, any>;
}

// Doğrulama hatası
export interface DogrulamaHatasi extends ApiHatasi {
  kod: 'DOGRULAMA_HATASI';
  alanlar: {
    alan: string;
    mesaj: string;
  }[];
}

// Sayfalı yanıt
export interface SayfalıYanit<T> {
  items: T[];
  toplam?: number;
  sonrakiCursor?: string;
  oncekiCursor?: string;
}

// Hata kodları
export const HATA_KODLARI = {
  // Genel
  SUNUCU_HATASI: 'SUNUCU_HATASI',
  GECERSIZ_ISTEK: 'GECERSIZ_ISTEK',
  DOGRULAMA_HATASI: 'DOGRULAMA_HATASI',

  // Auth
  YETKISIZ: 'YETKISIZ',
  ERISIM_ENGELLENDI: 'ERISIM_ENGELLENDI',
  TOKEN_GECERSIZ: 'TOKEN_GECERSIZ',
  TOKEN_SURESI_DOLDU: 'TOKEN_SURESI_DOLDU',
  KULLANICI_BULUNAMADI: 'KULLANICI_BULUNAMADI',
  EMAIL_KULLANILIYOR: 'EMAIL_KULLANILIYOR',
  KULLANICI_ADI_KULLANILIYOR: 'KULLANICI_ADI_KULLANILIYOR',
  YANLIS_SIFRE: 'YANLIS_SIFRE',

  // Topluluk
  TOPLULUK_BULUNAMADI: 'TOPLULUK_BULUNAMADI',
  TOPLULUK_DOLU: 'TOPLULUK_DOLU',
  ZATEN_UYE: 'ZATEN_UYE',
  UYE_DEGIL: 'UYE_DEGIL',
  DAVET_KODU_HATALI: 'DAVET_KODU_HATALI',
  SADECE_KURUCU: 'SADECE_KURUCU',

  // Oyun
  OYUN_BASLAMAMIS: 'OYUN_BASLAMAMIS',
  OYUN_DEVAM_EDIYOR: 'OYUN_DEVAM_EDIYOR',
  OYUN_BITMIS: 'OYUN_BITMIS',
  YETERSIZ_OYUNCU: 'YETERSIZ_OYUNCU',
  YANLIS_ASAMA: 'YANLIS_ASAMA',

  // Öneri
  ONERI_BULUNAMADI: 'ONERI_BULUNAMADI',
  ONERI_LIMITI_ASILDI: 'ONERI_LIMITI_ASILDI',
  ZATEN_OY_VERILDI: 'ZATEN_OY_VERILDI',
  OYLAMA_KAPALI: 'OYLAMA_KAPALI',

  // Genel
  BULUNAMADI: 'BULUNAMADI',
  CATISMA: 'CATISMA',
} as const;

export type HataKodu = typeof HATA_KODLARI[keyof typeof HATA_KODLARI];
