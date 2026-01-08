import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    const token = localStorage.getItem('token');
    s.auth = { token };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

// Types
export interface Kaynaklar {
  hazine: number;
  refah: number;
  istikrar: number;
  altyapi: number;
}

export interface OyuncuDurumu {
  id: string;
  kullaniciAdi: string;
  rol: 'KURUCU' | 'OYUNCU';
  hazir: boolean;
  bagli: boolean;
}

export interface Olay {
  id: string;
  baslik: string;
  aciklama: string;
  tip: 'KRIZ' | 'FIRSAT' | 'KARAR' | 'RASTGELE';
  kategori: string;
  secenekler: OlaySecenegi[];
}

export interface OlaySecenegi {
  id: string;
  baslik: string;
  aciklama: string;
  etkiler: Kaynaklar;
}

export interface Oneri {
  id: string;
  onericiId: string;
  onericiAdi: string;
  baslik: string;
  aciklama: string;
  secenekId: string;
  oylar: { oyuncuId: string; secim: 'EVET' | 'HAYIR' | 'CEKIMSER' }[];
}

export interface Mesaj {
  id: string;
  oyuncuId: string;
  oyuncuAdi: string;
  icerik: string;
  zaman: string;
}

export interface OyunState {
  toplulukId: string | null;
  toplulukIsmi: string;
  durum: 'LOBI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI';
  asama: 'LOBI' | 'TUR_BASI' | 'OLAY_ACILISI' | 'TARTISMA' | 'OYLAMA' | 'TUR_SONU' | 'OYUN_SONU' | 'SONUC';
  mevcutTur: number;
  toplamTur: number;
  kaynaklar: Kaynaklar;
  oyuncular: OyuncuDurumu[];
  mevcutOlay: Olay | null;
  oneriler: Oneri[];
  mesajlar: Mesaj[];
  sonuc: {
    durum: 'PARLADI' | 'HAYATTA_KALDI' | 'ZORLANDI' | 'COKTU';
    kaynaklar: Kaynaklar;
    ozet: string;
  } | null;
  asamaBitisZamani: number | null;
  bagli: boolean;
  yukleniyor: boolean;
  hata: string | null;
}

interface OyunActions {
  baglan: (toplulukId: string) => void;
  kopat: () => void;
  hazirOl: () => void;
  oyunuBaslat: () => void;
  oneriGonder: (secenekId: string, aciklama: string) => void;
  oyVer: (oneriId: string, secim: 'EVET' | 'HAYIR' | 'CEKIMSER') => void;
  mesajGonder: (icerik: string) => void;
  resetState: () => void;
}

const initialState: OyunState = {
  toplulukId: null,
  toplulukIsmi: '',
  durum: 'LOBI',
  asama: 'LOBI',
  mevcutTur: 0,
  toplamTur: 6,
  kaynaklar: { hazine: 1000, refah: 60, istikrar: 60, altyapi: 50 },
  oyuncular: [],
  mevcutOlay: null,
  oneriler: [],
  mesajlar: [],
  sonuc: null,
  asamaBitisZamani: null,
  bagli: false,
  yukleniyor: false,
  hata: null,
};

export const useOyunStore = create<OyunState & OyunActions>((set, get) => ({
  ...initialState,

  baglan: (toplulukId: string) => {
    set({ yukleniyor: true, toplulukId });
    const socket = connectSocket();

    // Event listeners
    socket.on('connect', () => {
      set({ bagli: true });
      socket.emit('topluluga-katil', { toplulukId });
    });

    socket.on('disconnect', () => {
      set({ bagli: false });
    });

    socket.on('hata', (data: { mesaj: string }) => {
      set({ hata: data.mesaj, yukleniyor: false });
    });

    socket.on('topluluk-durumu', (data: Partial<OyunState>) => {
      set({ ...data, yukleniyor: false });
    });

    socket.on('oyuncu-katildi', (oyuncu: OyuncuDurumu) => {
      set((state) => ({
        oyuncular: [...state.oyuncular.filter((o) => o.id !== oyuncu.id), oyuncu],
      }));
    });

    socket.on('oyuncu-ayrildi', (data: { oyuncuId: string }) => {
      set((state) => ({
        oyuncular: state.oyuncular.map((o) =>
          o.id === data.oyuncuId ? { ...o, bagli: false } : o
        ),
      }));
    });

    socket.on('hazirlik-guncellendi', (data: { oyuncuId: string; hazir: boolean }) => {
      set((state) => ({
        oyuncular: state.oyuncular.map((o) =>
          o.id === data.oyuncuId ? { ...o, hazir: data.hazir } : o
        ),
      }));
    });

    socket.on('oyun-basladi', (data: { kaynaklar: Kaynaklar }) => {
      set({
        durum: 'DEVAM_EDIYOR',
        asama: 'TUR_BASI',
        mevcutTur: 1,
        kaynaklar: data.kaynaklar,
      });
    });

    socket.on('yeni-tur', (data: { tur: number; olay: Olay; sure: number }) => {
      set({
        asama: 'OLAY_ACILISI',
        mevcutTur: data.tur,
        mevcutOlay: data.olay,
        oneriler: [],
        asamaBitisZamani: Date.now() + data.sure * 1000,
      });
    });

    socket.on('tartisma-basladi', (data: { sure: number }) => {
      set({
        asama: 'TARTISMA',
        asamaBitisZamani: Date.now() + data.sure * 1000,
      });
    });

    socket.on('yeni-oneri', (oneri: Oneri) => {
      set((state) => ({
        oneriler: [...state.oneriler.filter((o) => o.id !== oneri.id), oneri],
      }));
    });

    socket.on('oylama-basladi', (data: { sure: number }) => {
      set({
        asama: 'OYLAMA',
        asamaBitisZamani: Date.now() + data.sure * 1000,
      });
    });

    socket.on('oy-guncellendi', (data: { oneriId: string; oyuncuId: string; secim: string }) => {
      set((state) => ({
        oneriler: state.oneriler.map((o) =>
          o.id === data.oneriId
            ? {
                ...o,
                oylar: [
                  ...o.oylar.filter((oy) => oy.oyuncuId !== data.oyuncuId),
                  { oyuncuId: data.oyuncuId, secim: data.secim as 'EVET' | 'HAYIR' | 'CEKIMSER' },
                ],
              }
            : o
        ),
      }));
    });

    socket.on('tur-sonucu', (data: { kazananOneri: Oneri | null; yeniKaynaklar: Kaynaklar; aciklama: string }) => {
      set({
        asama: 'TUR_SONU',
        kaynaklar: data.yeniKaynaklar,
      });
    });

    socket.on('oyun-bitti', (data: { sonuc: OyunState['sonuc'] }) => {
      set({
        asama: 'SONUC',
        durum: 'TAMAMLANDI',
        sonuc: data.sonuc,
      });
    });

    socket.on('yeni-mesaj', (mesaj: Mesaj) => {
      set((state) => ({
        mesajlar: [...state.mesajlar, mesaj].slice(-100), // Son 100 mesaj
      }));
    });
  },

  kopat: () => {
    disconnectSocket();
    set(initialState);
  },

  hazirOl: () => {
    const socket = getSocket();
    socket.emit('hazir-ol');
  },

  oyunuBaslat: () => {
    const socket = getSocket();
    socket.emit('oyunu-baslat');
  },

  oneriGonder: (secenekId: string, aciklama: string) => {
    const socket = getSocket();
    socket.emit('oneri-gonder', { secenekId, aciklama });
  },

  oyVer: (oneriId: string, secim: 'EVET' | 'HAYIR' | 'CEKIMSER') => {
    const socket = getSocket();
    socket.emit('oy-ver', { oneriId, secim });
  },

  mesajGonder: (icerik: string) => {
    const socket = getSocket();
    socket.emit('mesaj-gonder', { icerik });
  },

  resetState: () => {
    set(initialState);
  },
}));
