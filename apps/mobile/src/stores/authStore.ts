import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

interface Kullanici {
  id: string;
  kullaniciAdi: string;
  email: string;
  sistemRolu: string;
  oynananOyunlar: number;
  tamamlananOyunlar: number;
  toplamPuan: number;
}

interface AuthState {
  kullanici: Kullanici | null;
  yukleniyor: boolean;
  girisYapildi: boolean;

  // Actions
  giris: (email: string, sifre: string) => Promise<void>;
  kayit: (kullaniciAdi: string, email: string, sifre: string) => Promise<void>;
  cikis: () => Promise<void>;
  kullaniciBilgileriniYukle: () => Promise<void>;
  tokenKontrol: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  kullanici: null,
  yukleniyor: true,
  girisYapildi: false,

  giris: async (email: string, sifre: string) => {
    set({ yukleniyor: true });
    try {
      const response = await authApi.giris(email, sifre);
      const { accessToken, refreshToken, oyuncu } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({
        kullanici: oyuncu,
        girisYapildi: true,
        yukleniyor: false,
      });
    } catch (error) {
      set({ yukleniyor: false });
      throw error;
    }
  },

  kayit: async (kullaniciAdi: string, email: string, sifre: string) => {
    set({ yukleniyor: true });
    try {
      const response = await authApi.kayit(kullaniciAdi, email, sifre);
      const { accessToken, refreshToken, oyuncu } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({
        kullanici: oyuncu,
        girisYapildi: true,
        yukleniyor: false,
      });
    } catch (error) {
      set({ yukleniyor: false });
      throw error;
    }
  },

  cikis: async () => {
    try {
      await authApi.cikis();
    } catch (error) {
      // Ignore errors on logout
    }

    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');

    set({
      kullanici: null,
      girisYapildi: false,
    });
  },

  kullaniciBilgileriniYukle: async () => {
    try {
      const response = await authApi.ben();
      set({ kullanici: response.data });
    } catch (error) {
      // Token might be invalid
      await get().cikis();
    }
  },

  tokenKontrol: async () => {
    set({ yukleniyor: true });
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ yukleniyor: false, girisYapildi: false });
        return false;
      }

      const response = await authApi.ben();
      set({
        kullanici: response.data,
        girisYapildi: true,
        yukleniyor: false,
      });
      return true;
    } catch (error) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({
        kullanici: null,
        girisYapildi: false,
        yukleniyor: false,
      });
      return false;
    }
  },
}));
