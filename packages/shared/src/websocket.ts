import { OyunAsamasi, OyunSonucu, OneriDurumu, OySecimi } from './enums';
import { Kaynaklar, KaynakDegisimi } from './kaynaklar';
import { OyuncuOzeti } from './oyuncu';
import { OyunDurumu } from './oyun';
import { OyunOlayi } from './olaylar';
import { Oneri } from './oneriler';
import { Mesaj } from './sohbet';

// ==================== Sunucu -> İstemci Olayları ====================

export interface SunucuOlaylari {
  // Bağlantı
  'baglandi': BaglandiOlayi;
  'hata': HataOlayi;

  // Varlık (Presence)
  'oyuncu:katildi': OyuncuKatildiOlayi;
  'oyuncu:ayrildi': OyuncuAyrildiOlayi;
  'oyuncu:afk': OyuncuAfkOlayi;
  'oyuncu:dondu': OyuncuDonduOlayi;

  // Oyun Akışı
  'oyun:basladi': OyunBasladiOlayi;
  'oyun:asamaDegisti': AsamaDegistiOlayi;
  'oyun:bitti': OyunBittiOlayi;

  // Tur
  'tur:basladi': TurBasladiOlayi;
  'tur:olayAcildi': OlayAcildiOlayi;
  'tur:bitti': TurBittiOlayi;

  // Kaynaklar
  'kaynaklar:degisti': KaynaklarDegistiOlayi;

  // Öneriler
  'oneri:olusturuldu': OneriOlusturulduOlayi;
  'oneri:oySayimi': OySayimiOlayi;
  'oneri:sonuclandi': OneriSonuclandiOlayi;

  // Sohbet
  'mesaj:yeni': YeniMesajOlayi;

  // Zamanlayıcı
  'zamanlayici:senkron': ZamanlayiciSenkronOlayi;
}

// Olay tipleri detayları
export interface BaglandiOlayi {
  oyuncuId: string;
  toplulukId: string;
}

export interface HataOlayi {
  kod: string;
  mesaj: string;
}

export interface OyuncuKatildiOlayi {
  oyuncu: OyuncuOzeti;
}

export interface OyuncuAyrildiOlayi {
  oyuncuId: string;
  sebep: 'ayrildi' | 'atildi' | 'baglanti_koptu';
}

export interface OyuncuAfkOlayi {
  oyuncuId: string;
}

export interface OyuncuDonduOlayi {
  oyuncuId: string;
}

export interface OyunBasladiOlayi {
  durum: OyunDurumu;
}

export interface AsamaDegistiOlayi {
  asama: OyunAsamasi;
  bitisAt: string;
  veri?: any;
}

export interface OyunBittiOlayi {
  sonuc: OyunSonucu;
  finalDurum: OyunDurumu;
}

export interface TurBasladiOlayi {
  turNumarasi: number;
  kaynaklar: Kaynaklar;
}

export interface OlayAcildiOlayi {
  olay: OyunOlayi;
}

export interface TurBittiOlayi {
  turNumarasi: number;
  kazananOneri?: Oneri;
  sonuc: {
    kaynakDegisimi: KaynakDegisimi;
    anlatim: string;
  };
  yeniKaynaklar: Kaynaklar;
  yeniSaglik: number;
}

export interface KaynaklarDegistiOlayi {
  kaynaklar: Kaynaklar;
  saglik: number;
  degisim: KaynakDegisimi;
}

export interface OneriOlusturulduOlayi {
  oneri: Oneri;
}

export interface OySayimiOlayi {
  oneriId: string;
  evet: number;
  hayir: number;
  cekimser: number;
}

export interface OneriSonuclandiOlayi {
  oneriId: string;
  durum: OneriDurumu;
}

export interface YeniMesajOlayi {
  mesaj: Mesaj;
}

export interface ZamanlayiciSenkronOlayi {
  asama: OyunAsamasi;
  kalanSaniye: number;
}

// ==================== İstemci -> Sunucu Olayları ====================

export interface IstemciOlaylari {
  // Varlık
  'nabiz': NabizOlayi;

  // Öneriler
  'oneri:olustur': OneriOlusturOlayi;
  'oneri:oyla': OneriOylaOlayi;

  // Sohbet
  'mesaj:gonder': MesajGonderOlayi;
}

export interface NabizOlayi {
  // Boş - sadece "hala buradayım" sinyali
}

export interface OneriOlusturOlayi {
  baslik: string;
  aciklama: string;
  eylemler: {
    tip: string;
    hedef?: string;
    miktar?: number;
    aciklama: string;
    tahminiEtki: KaynakDegisimi;
  }[];
}

export interface OneriOylaOlayi {
  oneriId: string;
  secim: OySecimi;
  gerekce?: string;
}

export interface MesajGonderOlayi {
  icerik: string;
  oneriId?: string;
}

// WebSocket sabitleri
export const WS_SABITLERI = {
  NABIZ_ARALIGI: 30000,        // 30 saniye
  YENIDEN_BAGLANMA_GECIKMESI: 1000,
  MAX_YENIDEN_BAGLANMA_DENEMESI: 5,
};
