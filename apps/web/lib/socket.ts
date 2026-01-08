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

// Lobby states (from state machine)
export type ToplulukDurumu =
  | 'BEKLEME' | 'HAZIR' | 'GERI_SAYIM' | 'BOT_DOLDURMA'  // New states
  | 'LOBI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'TERK_EDILDI';  // Backward compat

// Round states (from state machine)
export type OyunAsamasi =
  | 'OLAY_GOSTERILDI' | 'ONERI_ACIK' | 'OYLAMA_ACIK' | 'HESAPLAMA' | 'SONUCLAR' | 'TUR_KAPANDI'  // New states
  | 'LOBI' | 'TUR_BASI' | 'OLAY_ACILISI' | 'TARTISMA' | 'OYLAMA' | 'TUR_SONU' | 'OYUN_SONU' | 'SONUC';  // Backward compat

// Game result (from state machine)
export type OyunSonucu =
  | 'PARLADI' | 'GELISTI' | 'DURAGAN' | 'GERILEDI' | 'COKTU'  // New states
  | 'HAYATTA_KALDI' | 'ZORLANDI';  // Backward compat

export interface OyunState {
  toplulukId: string | null;
  toplulukIsmi: string;
  toplulukKodu: string;
  durum: ToplulukDurumu;
  asama: OyunAsamasi;
  mevcutTur: number;
  toplamTur: number;
  kaynaklar: Kaynaklar;
  oyuncular: OyuncuDurumu[];
  mevcutOlay: Olay | null;
  oneriler: Oneri[];
  mesajlar: Mesaj[];
  sonuc: {
    durum: OyunSonucu;
    kaynaklar: Kaynaklar;
    ozet: string;
    carpan?: number;
  } | null;
  asamaBitisZamani: number | null;
  geriSayim: number | null;  // Countdown for lobby
  bagli: boolean;
  yukleniyor: boolean;
  hata: string | null;
}

interface OyunActions {
  baglan: (toplulukId: string) => void;
  kopat: () => void;
  hazirOl: () => void;
  oyunuBaslat: () => void;
  countdownBaslat: () => void;
  countdownIptal: () => void;
  oneriGonder: (secenekId: string, aciklama: string) => void;
  oyVer: (oneriId: string, secim: 'EVET' | 'HAYIR' | 'CEKIMSER') => void;
  mesajGonder: (icerik: string) => void;
  resetState: () => void;
}

const initialState: OyunState = {
  toplulukId: null,
  toplulukIsmi: '',
  toplulukKodu: '',
  durum: 'BEKLEME',
  asama: 'LOBI',
  mevcutTur: 0,
  toplamTur: 10,
  kaynaklar: { hazine: 50, refah: 50, istikrar: 50, altyapi: 50 },
  oyuncular: [],
  mevcutOlay: null,
  oneriler: [],
  mesajlar: [],
  sonuc: null,
  asamaBitisZamani: null,
  geriSayim: null,
  bagli: false,
  yukleniyor: false,
  hata: null,
};

// Track if listeners have been set up
let listenersSetUp = false;

export const useOyunStore = create<OyunState & OyunActions>((set, get) => ({
  ...initialState,

  baglan: (toplulukId: string) => {
    const currentState = get();

    // If already connected to this lobby, don't reconnect
    if (currentState.toplulukId === toplulukId && currentState.bagli) {
      return;
    }

    set({ yukleniyor: true, toplulukId, hata: null });
    const socket = connectSocket();

    // Remove all previous listeners to avoid duplicates
    if (listenersSetUp) {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('hata');
      socket.off('topluluk-durumu');
      socket.off('oyuncu-katildi');
      socket.off('oyuncu-ayrildi');
      socket.off('hazirlik-guncellendi');
      socket.off('durum-degisti');
      socket.off('geri-sayim-basladi');
      socket.off('geri-sayim-guncellendi');
      socket.off('geri-sayim-iptal');
      socket.off('bot-eklendi');
      socket.off('oyun-basladi');
      socket.off('yeni-tur');
      socket.off('tartisma-basladi');
      socket.off('yeni-oneri');
      socket.off('oylama-basladi');
      socket.off('oy-guncellendi');
      socket.off('tur-sonucu');
      socket.off('oyun-bitti');
      socket.off('yeni-mesaj');
      socket.off('bildirim');
    }

    // Event listeners
    socket.on('connect', () => {
      const state = get();
      set({ bagli: true });
      if (state.toplulukId) {
        socket.emit('topluluga-katil', { toplulukId: state.toplulukId });
      }
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

    listenersSetUp = true;

    // New state machine events
    socket.on('durum-degisti', (data: { durum: ToplulukDurumu }) => {
      set({ durum: data.durum });
    });

    socket.on('geri-sayim-basladi', (data: { kalanSure: number }) => {
      set({
        durum: 'GERI_SAYIM',
        geriSayim: data.kalanSure,
      });
    });

    socket.on('geri-sayim-guncellendi', (data: { kalanSure: number }) => {
      set({ geriSayim: data.kalanSure });
    });

    socket.on('geri-sayim-iptal', () => {
      set({
        durum: 'HAZIR',
        geriSayim: null,
      });
    });

    socket.on('bot-eklendi', (data: { oyuncu: OyuncuDurumu; oyuncuSayisi: number }) => {
      set((state) => ({
        durum: 'BOT_DOLDURMA',
        oyuncular: [...state.oyuncular.filter((o) => o.id !== data.oyuncu.id), data.oyuncu],
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

    // Gerçek zamanlı bildirimler
    socket.on('bildirim', (bildirim: {
      id?: string;
      tip: string;
      baslik: string;
      icerik: string;
      link?: string;
      olusturuldu: string;
    }) => {
      // Tarayıcı bildirimi göster (izin varsa)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(bildirim.baslik, {
          body: bildirim.icerik,
          icon: '/icon-192x192.png',
          tag: bildirim.id || 'bildirim',
        });
      }

      // Custom event dispatch et (toast için)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yeni-bildirim', { detail: bildirim }));
      }
    });

    // If socket is already connected, emit topluluga-katil immediately
    if (socket.connected) {
      set({ bagli: true });
      socket.emit('topluluga-katil', { toplulukId });
    }
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

  countdownBaslat: () => {
    const socket = getSocket();
    socket.emit('countdown-baslat');
  },

  countdownIptal: () => {
    const socket = getSocket();
    socket.emit('countdown-iptal');
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
