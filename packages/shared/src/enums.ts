// Topluluk durumları
export enum ToplulukDurumu {
  LOBI = 'LOBI',
  DEVAM_EDIYOR = 'DEVAM_EDIYOR',
  TAMAMLANDI = 'TAMAMLANDI',
  TERK_EDILDI = 'TERK_EDILDI',
}

// Üye rolleri
export enum UyeRolu {
  KURUCU = 'KURUCU',
  OYUNCU = 'OYUNCU',
}

// Üye durumları
export enum UyeDurumu {
  AKTIF = 'AKTIF',
  AFK = 'AFK',
  AYRILDI = 'AYRILDI',
  ATILDI = 'ATILDI',
}

// Oyun aşamaları
export enum OyunAsamasi {
  LOBI = 'LOBI',
  TUR_BASI = 'TUR_BASI',
  OLAY_ACILISI = 'OLAY_ACILISI',
  TARTISMA = 'TARTISMA',
  OYLAMA = 'OYLAMA',
  TUR_SONU = 'TUR_SONU',
  OYUN_SONU = 'OYUN_SONU',
  SONUC = 'SONUC',
}

// Oyun sonuçları
export enum OyunSonucu {
  PARLADI = 'PARLADI',         // Sağlık >= 80
  HAYATTA_KALDI = 'HAYATTA_KALDI', // Sağlık 50-79
  ZORLANDI = 'ZORLANDI',       // Sağlık 25-49
  COKTU = 'COKTU',             // Sağlık < 25 veya kaynak 0
}

// Öneri durumları
export enum OneriDurumu {
  OYLAMADA = 'OYLAMADA',
  GECTI = 'GECTI',
  REDDEDILDI = 'REDDEDILDI',
  SURESI_DOLDU = 'SURESI_DOLDU',
}

// Oy seçimleri
export enum OySecimi {
  EVET = 'EVET',
  HAYIR = 'HAYIR',
  CEKIMSER = 'CEKIMSER',
}

// Olay tipleri
export enum OlayTipi {
  KRIZ = 'KRIZ',
  FIRSAT = 'FIRSAT',
}

// Olay kategorileri
export enum OlayKategorisi {
  EKONOMIK = 'EKONOMIK',
  SOSYAL = 'SOSYAL',
  CEVRESEL = 'CEVRESEL',
  ALTYAPI = 'ALTYAPI',
}

// Eylem tipleri
export enum EylemTipi {
  KAYNAK_AYIR = 'KAYNAK_AYIR',
  INSA_ET = 'INSA_ET',
  POLITIKA_DEGISIKLIGI = 'POLITIKA_DEGISIKLIGI',
  ACIL_EYLEM = 'ACIL_EYLEM',
}
