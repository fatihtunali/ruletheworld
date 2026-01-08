import { OyunSonucu } from './enums';

// Karar özeti (sonuç ekranı için)
export interface KararOzeti {
  turNumarasi: number;
  olayBasligi: string;
  karar: string;          // "Acil Yardım Paketi uygulandı" veya "Hareketsiz kalındı"
  etki: string;           // "Refah +10, Hazine -200"
  gercekDunyaParaleli?: string;
}

// Sonuç ekranı içeriği
export interface SonucIcerigi {
  toplulukId: string;
  toplulukIsmi: string;
  sonuc: OyunSonucu;
  finalSaglik: number;
  oynananTur: number;
  toplamOyuncu: number;

  // Özet
  ozet: string;

  // Kritik kararlar
  kararlar: KararOzeti[];

  // Çıkarılan dersler
  dersler: string[];

  // Gerçek dünya örnekleri
  gercekDunyaOrnekleri: GercekDunyaOrnegi[];

  // Eylem çağrısı
  eylemCagrisi: EylemCagrisi;

  // Oyuncu istatistikleri
  oyuncuIstatistikleri: OyuncuSonucIstatistigi[];
}

// Gerçek dünya örneği
export interface GercekDunyaOrnegi {
  baslik: string;
  aciklama: string;
  link?: string;
}

// Eylem çağrısı
export interface EylemCagrisi {
  mesaj: string;
  kaynaklar: EylemKaynagi[];
}

// Eylem kaynağı
export interface EylemKaynagi {
  baslik: string;
  aciklama: string;
  tip: 'yerel_orgutlenme' | 'araclar' | 'okuma' | 'topluluk';
  url?: string;
}

// Oyuncu sonuç istatistiği
export interface OyuncuSonucIstatistigi {
  oyuncuId: string;
  oyuncuAdi: string;
  yapilanOneriler: number;
  verilenOylar: number;
  gecenOneriler: number;
}

// Oyun geçmişi özeti
export interface OyunGecmisiOzeti {
  toplulukId: string;
  toplulukIsmi: string;
  sonuc: OyunSonucu;
  finalSaglik: number;
  oynananTur: number;
  seninOnerilerin: number;
  seninOylarin: number;
  oynandi: string;
}

// Varsayılan eylem çağrısı
export const VARSAYILAN_EYLEM_CAGRISI: EylemCagrisi = {
  mesaj: 'Az önce bir topluluğu yönettiniz. Gerçek hayatta da yapabilirsiniz.',
  kaynaklar: [
    {
      baslik: 'Mahalle Meclisleri',
      aciklama: 'Bulunduğunuz mahallede karar süreçlerine katılın',
      tip: 'yerel_orgutlenme',
    },
    {
      baslik: 'Katılımcı Bütçe',
      aciklama: 'Belediyenizin katılımcı bütçe süreçlerini takip edin',
      tip: 'araclar',
    },
    {
      baslik: 'TEMA Vakfı',
      aciklama: 'Çevre konularında gönüllü olun',
      tip: 'topluluk',
      url: 'https://tema.org.tr',
    },
    {
      baslik: 'Toplum Gönüllüleri',
      aciklama: 'Sosyal projelerde yer alın',
      tip: 'topluluk',
      url: 'https://tog.org.tr',
    },
  ],
};
