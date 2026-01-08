import { OlayTipi, OlayKategorisi } from './enums';
import { KaynakDegisimi } from './kaynaklar';

// Önerilen eylem yapısı
export interface OnerilenEylem {
  id: string;
  etiket: string;
  maliyet: KaynakDegisimi;
  sonuc: KaynakDegisimi;
  risk?: number;  // 0-1 arası, kısmi başarısızlık şansı
  aciklama: string;
}

// Gerçek dünya paraleli
export interface GercekDunyaParaleli {
  ornek: string;      // "Zonguldak, 2019"
  aciklama: string;   // Detaylı açıklama
  kaynak?: string;    // URL
}

// Olay kısıtlamaları
export interface OlayKisitlamalari {
  minTur?: number;
  maxTur?: number;
  gerekliKaynaklar?: {
    hazine?: { min?: number; max?: number };
    refah?: { min?: number; max?: number };
    istikrar?: { min?: number; max?: number };
    altyapi?: { min?: number; max?: number };
  };
}

// Varsayılan sonuç (hiçbir öneri geçmezse)
export interface VarsayilanSonuc {
  kaynakDegisimi: KaynakDegisimi;
  anlatim: string;
}

// Oyun olayı (template)
export interface OyunOlayiSablonu {
  id: string;
  tip: OlayTipi;
  kategori: OlayKategorisi;
  baslik: string;
  aciklama: string;
  siddet: 1 | 2 | 3;
  varsayilanSonuc: VarsayilanSonuc;
  onerilenEylemler: OnerilenEylem[];
  gercekDunya: GercekDunyaParaleli;
  kisitlamalar?: OlayKisitlamalari;
}

// Oyun içi olay (instance)
export interface OyunOlayi {
  id: string;
  sablonId: string;
  toplulukId: string;
  turNumarasi: number;
  tip: OlayTipi;
  kategori: OlayKategorisi;
  baslik: string;
  aciklama: string;
  siddet: 1 | 2 | 3;
  varsayilanSonuc: VarsayilanSonuc;
  onerilenEylemler: OnerilenEylem[];
  gercekDunya: GercekDunyaParaleli;
  olusturuldu: string;
}

// Olay durumu
export interface OlayDurumu {
  olay: OyunOlayi;
  cozulduMu: boolean;
  kazananOneriId?: string;
}
