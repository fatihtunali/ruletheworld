// Mesaj
export interface Mesaj {
  id: string;
  toplulukId: string;
  oyuncuId: string;
  oyuncuAdi: string;
  icerik: string;
  turNumarasi?: number;
  oneriId?: string;
  olusturuldu: string;
}

// Mesaj gönderme isteği
export interface MesajGonderIstegi {
  icerik: string;
  oneriId?: string;
}

// Mesaj listesi (sayfalı)
export interface MesajListesi {
  items: Mesaj[];
  oncekiCursor?: string;
}

// Mesaj sabitleri
export const MESAJ_SABITLERI = {
  MAX_UZUNLUK: 500,
  SAYFA_BOYUTU: 50,
};
