import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, Oyuncu, Topluluk } from './api';

interface AuthState {
  oyuncu: Oyuncu | null;
  token: string | null;
  yukleniyor: boolean;
  hata: string | null;
  _hasHydrated: boolean;

  girisYap: (email: string, sifre: string) => Promise<boolean>;
  kayitOl: (kullaniciAdi: string, email: string, sifre: string) => Promise<boolean>;
  cikisYap: () => void;
  profilYukle: () => Promise<void>;
  hataTemizle: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      oyuncu: null,
      token: null,
      yukleniyor: false,
      hata: null,
      _hasHydrated: false,

      girisYap: async (email, sifre) => {
        set({ yukleniyor: true, hata: null });
        const { data, error } = await api.girisYap({ email, sifre });

        if (error) {
          set({ yukleniyor: false, hata: error });
          return false;
        }

        if (data) {
          localStorage.setItem('token', data.accessToken);
          set({
            oyuncu: data.oyuncu,
            token: data.accessToken,
            yukleniyor: false,
          });
          return true;
        }

        return false;
      },

      kayitOl: async (kullaniciAdi, email, sifre) => {
        set({ yukleniyor: true, hata: null });
        const { data, error } = await api.kayitOl({ kullaniciAdi, email, sifre });

        if (error) {
          set({ yukleniyor: false, hata: error });
          return false;
        }

        if (data) {
          localStorage.setItem('token', data.accessToken);
          set({
            oyuncu: data.oyuncu,
            token: data.accessToken,
            yukleniyor: false,
          });
          return true;
        }

        return false;
      },

      cikisYap: () => {
        localStorage.removeItem('token');
        set({ oyuncu: null, token: null });
      },

      profilYukle: async () => {
        const token = get().token;
        if (!token) return;

        set({ yukleniyor: true });
        const { data, error } = await api.profilGetir();

        if (error) {
          // Token geçersiz, çıkış yap
          get().cikisYap();
        } else if (data) {
          set({ oyuncu: data });
        }

        set({ yukleniyor: false });
      },

      hataTemizle: () => set({ hata: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);

// Lobi Store
interface LobiState {
  topluluklar: Topluluk[];
  seciliTopluluk: Topluluk | null;
  yukleniyor: boolean;
  hata: string | null;

  topluluklariYukle: () => Promise<void>;
  toplulukOlustur: (isim: string, aciklama?: string) => Promise<Topluluk | null>;
  toplulugaKatil: (kod: string) => Promise<Topluluk | null>;
}

export const useLobiStore = create<LobiState>((set) => ({
  topluluklar: [],
  seciliTopluluk: null,
  yukleniyor: false,
  hata: null,

  topluluklariYukle: async () => {
    set({ yukleniyor: true, hata: null });
    const { data, error } = await api.topluluklariGetir();

    if (error) {
      set({ yukleniyor: false, hata: error });
      return;
    }

    set({ topluluklar: data || [], yukleniyor: false });
  },

  toplulukOlustur: async (isim, aciklama) => {
    set({ yukleniyor: true, hata: null });
    const { data, error } = await api.toplulukOlustur({ isim, aciklama });

    if (error) {
      set({ yukleniyor: false, hata: error });
      return null;
    }

    if (data) {
      set((state) => ({
        topluluklar: [...state.topluluklar, data],
        yukleniyor: false,
      }));
    }

    return data || null;
  },

  toplulugaKatil: async (kod) => {
    set({ yukleniyor: true, hata: null });
    const { data, error } = await api.toplulugaKatil(kod);

    if (error) {
      set({ yukleniyor: false, hata: error });
      return null;
    }

    set({ yukleniyor: false });
    return data || null;
  },
}));

// Tema Store
export type Tema = 'acik' | 'koyu' | 'sistem';

interface TemaState {
  tema: Tema;
  gercekTema: 'acik' | 'koyu';
  _hasHydrated: boolean;
  temaAyarla: (tema: Tema) => void;
  sistemTemasiGuncelle: () => void;
}

export const useTemaStore = create<TemaState>()(
  persist(
    (set, get) => ({
      tema: 'koyu',
      gercekTema: 'koyu',
      _hasHydrated: false,

      temaAyarla: (tema) => {
        set({ tema });
        const gercekTema = tema === 'sistem'
          ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik')
          : tema;
        set({ gercekTema });

        // DOM'a uygula
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', gercekTema === 'koyu');
          document.documentElement.classList.toggle('light', gercekTema === 'acik');
        }
      },

      sistemTemasiGuncelle: () => {
        const { tema } = get();
        if (tema === 'sistem') {
          const sistemKoyu = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
          const gercekTema = sistemKoyu ? 'koyu' : 'acik';
          set({ gercekTema });

          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', gercekTema === 'koyu');
            document.documentElement.classList.toggle('light', gercekTema === 'acik');
          }
        }
      },
    }),
    {
      name: 'tema-storage',
      partialize: (state) => ({ tema: state.tema }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          // Tema'yi uygula
          const tema = state.tema;
          const gercekTema = tema === 'sistem'
            ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik')
            : tema;
          state.gercekTema = gercekTema;

          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', gercekTema === 'koyu');
            document.documentElement.classList.toggle('light', gercekTema === 'acik');
          }
        }
      },
    }
  )
);
