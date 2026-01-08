import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://haydihepberaber.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/yenile`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await SecureStore.setItemAsync('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Logout user
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  giris: (email: string, sifre: string) =>
    api.post('/auth/giris', { email, sifre }),

  kayit: (kullaniciAdi: string, email: string, sifre: string) =>
    api.post('/auth/kayit', { kullaniciAdi, email, sifre }),

  ben: () => api.get('/auth/ben'),

  cikis: () => api.post('/auth/cikis'),
};

// Game API
export const oyunApi = {
  lobiler: () => api.get('/topluluk/lobiler'),

  lobiOlustur: (isim: string, oyunModu?: string) =>
    api.post('/topluluk/olustur', { isim, oyunModu }),

  lobiKatil: (toplulukId: string) =>
    api.post(`/topluluk/${toplulukId}/katil`),

  lobiAyril: (toplulukId: string) =>
    api.post(`/topluluk/${toplulukId}/ayril`),

  toplulukDetay: (toplulukId: string) =>
    api.get(`/topluluk/${toplulukId}`),
};

// Leaderboard API
export const siralamaApi = {
  genel: () => api.get('/siralama/genel'),
  haftalik: () => api.get('/siralama/haftalik'),
  sezonluk: () => api.get('/siralama/sezonluk'),
};

// Friend API
export const arkadaslikApi = {
  liste: () => api.get('/arkadaslik'),
  istekGonder: (kullaniciAdi: string) =>
    api.post('/arkadaslik/istek', { kullaniciAdi }),
  istekKabul: (arkadaslikId: string) =>
    api.post(`/arkadaslik/${arkadaslikId}/kabul`),
  istekReddet: (arkadaslikId: string) =>
    api.post(`/arkadaslik/${arkadaslikId}/reddet`),
};

// Premium API
export const premiumApi = {
  paketler: () => api.get('/premium/paketler'),
  durum: () => api.get('/premium/durum'),
  promosyonKullan: (kod: string) =>
    api.post('/premium/promosyon', { kod }),
};

// Notifications API
export const bildirimApi = {
  liste: () => api.get('/bildirim'),
  okunduIsaretle: (bildirimId: string) =>
    api.post(`/bildirim/${bildirimId}/okundu`),
  tumunuOkunduIsaretle: () =>
    api.post('/bildirim/tumunu-okundu-isaretle'),
};

// Stats API
export const istatistikApi = {
  genel: () => api.get('/istatistikler/genel'),
  benimIstatistiklerim: () => api.get('/istatistikler/ben'),
};

export default api;
