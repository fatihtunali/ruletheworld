import { OyunAsamasi, OyunSonucu } from './enums';
import { Kaynaklar } from './kaynaklar';
import { OyunOlayi } from './olaylar';
import { Oneri } from './oneriler';

// Oyun durumu
export interface OyunDurumu {
  id: string;
  toplulukId: string;
  asama: OyunAsamasi;
  mevcutTur: number;
  toplamTur: number;
  asamaBitisAt?: string;
  kaynaklar: Kaynaklar;
  toplulukSagligi: number;
  sonuc?: OyunSonucu;
}

// Oyun durumu (frontend için genişletilmiş)
export interface OyunDurumuDetay extends OyunDurumu {
  aktifOlay?: OyunOlayi;
  bekleyenOneriler: Oneri[];
}

// Tur bilgisi
export interface Tur {
  id: string;
  toplulukId: string;
  turNumarasi: number;
  basKaynaklar: Kaynaklar;
  olayId?: string;
  olayVerisi?: OyunOlayi;
  kazananOneriId?: string;
  uygulananSonuc?: KaynakSonucu;
  basladiAt: string;
  bittiAt?: string;
}

// Kaynak sonucu (tur sonunda)
export interface KaynakSonucu {
  onceki: Kaynaklar;
  sonra: Kaynaklar;
  degisim: Partial<Kaynaklar>;
  anlatim: string;
}

// Aşama süreleri (saniye)
export const ASAMA_SURELERI: Record<OyunAsamasi, number> = {
  [OyunAsamasi.LOBI]: 0,           // Sınırsız
  [OyunAsamasi.TUR_BASI]: 5,
  [OyunAsamasi.OLAY_ACILISI]: 10,
  [OyunAsamasi.TARTISMA]: 90,
  [OyunAsamasi.OYLAMA]: 60,
  [OyunAsamasi.TUR_SONU]: 10,
  [OyunAsamasi.OYUN_SONU]: 5,
  [OyunAsamasi.SONUC]: 0,          // Sınırsız
};

// Oyun sonucu metinleri
export const SONUC_METINLERI: Record<OyunSonucu, { baslik: string; aciklama: string; emoji: string }> = {
  [OyunSonucu.PARLADI]: {
    baslik: 'Topluluk Parladı!',
    aciklama: 'Birlikte aldığınız kararlar topluluğu güçlendirdi. Kaynaklar dengeli, halk mutlu, gelecek parlak.',
    emoji: '🌟',
  },
  [OyunSonucu.HAYATTA_KALDI]: {
    baslik: 'Topluluk Ayakta',
    aciklama: 'Zorlu kararlar aldınız. Her şey mükemmel değil ama topluluk ayakta. Bu da bir başarı.',
    emoji: '💪',
  },
  [OyunSonucu.ZORLANDI]: {
    baslik: 'Zor Günler Geçti',
    aciklama: 'Bazı kararlar beklendiği gibi gitmedi. Topluluk zorlandı ama dağılmadı. Dersler çıkarıldı.',
    emoji: '😓',
  },
  [OyunSonucu.COKTU]: {
    baslik: 'Topluluk Çöktü',
    aciklama: 'Kritik kararlar yanlış gitti veya zamanında alınamadı. Topluluk dağıldı. Ama bu da bir ders.',
    emoji: '💔',
  },
};
