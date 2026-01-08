const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'Bir hata oluştu' };
    }

    return { data };
  } catch {
    return { error: 'Sunucuya bağlanılamadı' };
  }
}

export const api = {
  // Auth
  kayitOl: (data: { kullaniciAdi: string; email: string; sifre: string }) =>
    request<{ accessToken: string; oyuncu: Oyuncu }>('/auth/kayit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  girisYap: (data: { email: string; sifre: string }) =>
    request<{ accessToken: string; oyuncu: Oyuncu }>('/auth/giris', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  profilGetir: () => request<Oyuncu>('/auth/profil'),

  profilDetayGetir: () => request<ProfilDetay>('/auth/profil/detay'),

  // Şifre işlemleri
  sifreSifirlamaTalebi: (email: string) =>
    request<{ mesaj: string; token?: string }>('/auth/sifre-sifirlama/talep', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  sifreSifirlamaDogrula: (token: string) =>
    request<{ gecerli: boolean }>('/auth/sifre-sifirlama/dogrula', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  sifreyiSifirla: (token: string, yeniSifre: string) =>
    request<{ basarili: boolean }>('/auth/sifre-sifirlama/sifirla', {
      method: 'POST',
      body: JSON.stringify({ token, yeniSifre }),
    }),

  sifreDegistir: (eskiSifre: string, yeniSifre: string) =>
    request<{ basarili: boolean }>('/auth/sifre-degistir', {
      method: 'POST',
      body: JSON.stringify({ eskiSifre, yeniSifre }),
    }),

  // Email dogrulama
  emailDogrula: (token: string) =>
    request<{ basarili: boolean; mesaj: string }>('/auth/email-dogrula', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  emailDogrulamaDurumu: () =>
    request<{ dogrulandi: boolean }>('/auth/email-dogrulama/durum'),

  emailDogrulamaYenidenGonder: () =>
    request<{ mesaj: string; token?: string }>('/auth/email-dogrulama/yeniden-gonder', {
      method: 'POST',
    }),

  // Topluluklar
  topluluklariGetir: () => request<Topluluk[]>('/topluluklar'),

  toplulukOlustur: (data: { isim: string; aciklama?: string }) =>
    request<Topluluk>('/topluluklar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toplulugaKatil: (kod: string) =>
    request<Topluluk>(`/topluluklar/katil/${kod}`, {
      method: 'POST',
    }),

  toplulukDetay: (id: string) => request<ToplulukDetay>(`/topluluklar/${id}`),

  // Admin
  admin: {
    istatistikler: () => request<AdminIstatistikler>('/admin/istatistikler'),

    kullanicilar: (params?: { arama?: string; rol?: string; hesapDurumu?: string; sayfa?: number }) => {
      const query = new URLSearchParams();
      if (params?.arama) query.set('arama', params.arama);
      if (params?.rol) query.set('rol', params.rol);
      if (params?.hesapDurumu) query.set('hesapDurumu', params.hesapDurumu);
      if (params?.sayfa) query.set('sayfa', params.sayfa.toString());
      return request<KullaniciListesi>(`/admin/kullanicilar?${query.toString()}`);
    },

    kullaniciDetay: (id: string) => request<KullaniciDetay>(`/admin/kullanicilar/${id}`),

    banla: (id: string, data: { sebep: string; tip?: string; bitis?: string }) =>
      request(`/admin/kullanicilar/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    banKaldir: (id: string, data?: { sebep?: string }) =>
      request(`/admin/kullanicilar/${id}/unban`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),

    rolDegistir: (id: string, data: { yeniRol: string }) =>
      request(`/admin/kullanicilar/${id}/rol`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    topluluklar: (sayfa?: number) =>
      request<ToplulukListesi>(`/admin/topluluklar?sayfa=${sayfa || 1}`),

    toplulukSil: (id: string, data: { sebep: string }) =>
      request(`/admin/topluluklar/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(data),
      }),

    loglar: (sayfa?: number) =>
      request<ModeasyonLogListesi>(`/admin/loglar?sayfa=${sayfa || 1}`),

    ilkAdmin: () =>
      request('/admin/ilk-admin', { method: 'POST' }),
  },

  // Istatistikler
  istatistikler: {
    liderlik: (limit?: number) =>
      request<LiderlikOyuncu[]>(`/istatistikler/liderlik?limit=${limit || 20}`),

    genel: () => request<GenelIstatistikler>('/istatistikler/genel'),

    sonucDagilimi: () => request<SonucDagilimi[]>('/istatistikler/sonuc-dagilimi'),
  },

  // Bildirimler
  bildirimler: {
    getir: (sayfa?: number) =>
      request<BildirimListesi>(`/bildirimler?sayfa=${sayfa || 1}`),

    okunmamisSayisi: () =>
      request<{ sayi: number }>('/bildirimler/okunmamis-sayisi'),

    okunduIsaretle: (id: string) =>
      request(`/bildirimler/${id}/okundu`, { method: 'POST' }),

    tumunuOku: () =>
      request<{ okunan: number }>('/bildirimler/tumunu-oku', { method: 'POST' }),
  },

  // Basarimlar
  basarimlar: {
    getir: () => request<{ basarimlar: Basarim[] }>('/basarimlar'),

    liste: () => request<{ basarimlar: Basarim[] }>('/basarimlar/liste'),

    ozet: () => request<BasarimOzeti>('/basarimlar/ozet'),

    kontrol: () =>
      request<{ yeniBasarimlar: Basarim[]; mesaj: string }>('/basarimlar/kontrol', {
        method: 'POST',
      }),

    istatistikler: () =>
      request<{ istatistikler: BasarimIstatistik[] }>('/basarimlar/istatistikler'),

    seed: () => request<{ mesaj: string }>('/basarimlar/seed', { method: 'POST' }),
  },

  // Tekrar (Oyun Replay)
  tekrar: {
    oyunlar: (sayfa?: number, limit?: number) =>
      request<TamamlananOyunlarResponse>(`/tekrar/oyunlar?sayfa=${sayfa || 1}&limit=${limit || 20}`),

    getir: (id: string) => request<{ tekrar: OyunTekrari }>(`/tekrar/${id}`),

    ozet: (id: string) => request<OyunOzeti>(`/tekrar/${id}/ozet`),

    turOlaylari: (id: string, turNumarasi: number) =>
      request<{ olaylar: TekrarOlayi[] }>(`/tekrar/${id}/tur/${turNumarasi}`),
  },

  // Turnuvalar
  turnuva: {
    listele: (params?: { sayfa?: number; limit?: number; durum?: TurnuvaDurumu }) => {
      const query = new URLSearchParams();
      if (params?.sayfa) query.set('sayfa', params.sayfa.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.durum) query.set('durum', params.durum);
      return request<TurnuvaListesiResponse>(`/turnuvalar?${query.toString()}`);
    },

    aktif: () => request<{ turnuvalar: TurnuvaOzeti[] }>('/turnuvalar/aktif'),

    benim: () => request<{ turnuvalar: TurnuvaOzeti[] }>('/turnuvalar/benim'),

    detay: (id: string) => request<{ turnuva: TurnuvaDetay }>(`/turnuvalar/${id}`),

    olustur: (data: {
      isim: string;
      aciklama?: string;
      maxKatilimci?: number;
      minKatilimci?: number;
      oyunBasinaOyuncu?: number;
      kayitBitis: string;
      baslamaZamani?: string;
    }) =>
      request<{ turnuva: TurnuvaOzeti }>('/turnuvalar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    katil: (id: string) =>
      request<{ basarili: boolean; mesaj: string }>(`/turnuvalar/${id}/katil`, {
        method: 'POST',
      }),

    ayril: (id: string) =>
      request<{ basarili: boolean; mesaj: string }>(`/turnuvalar/${id}/ayril`, {
        method: 'DELETE',
      }),

    baslat: (id: string) =>
      request<{ basarili: boolean; mesaj: string }>(`/turnuvalar/${id}/baslat`, {
        method: 'POST',
      }),
  },
};

// Types
export interface Oyuncu {
  id: string;
  kullaniciAdi: string;
  email: string;
  olusturulmaTarihi: string;
  sistemRolu?: string;
  hesapDurumu?: string;
}

export interface Topluluk {
  id: string;
  isim: string;
  aciklama?: string;
  kod: string;
  durum: string;
  oyuncuSayisi: number;
  maxOyuncu: number;
  liderAdi: string;
}

export interface ToplulukDetay extends Topluluk {
  oyuncular: { id: string; kullaniciAdi: string; hazir: boolean }[];
  oyunDurumu?: OyunDurumu;
}

export interface OyunDurumu {
  id: string;
  mevcutTur: number;
  asama: string;
  kaynaklar: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  };
}

// Admin Types
export interface AdminIstatistikler {
  kullanicilar: {
    toplam: number;
    aktif: number;
    banli: number;
    bugunKayit: number;
  };
  topluluklar: {
    toplam: number;
    aktif: number;
    tamamlanan: number;
    bugunOyun: number;
  };
  sonYediGunKayit: { tarih: string; sayi: number }[];
}

export interface AdminKullanici {
  id: string;
  kullaniciAdi: string;
  email: string;
  sistemRolu: string;
  hesapDurumu: string;
  banSebebi?: string;
  banBitisi?: string;
  oynananOyunlar: number;
  tamamlananOyunlar: number;
  olusturuldu: string;
  sonAktiflik: string;
}

export interface KullaniciListesi {
  kullanicilar: AdminKullanici[];
  sayfalama: {
    toplam: number;
    sayfa: number;
    limit: number;
    toplamSayfa: number;
  };
}

export interface KullaniciDetay extends AdminKullanici {
  alinanBanlar: {
    id: string;
    sebep: string;
    tip: string;
    baslangic: string;
    bitis?: string;
    iptalEdildi: boolean;
    yetkili: { kullaniciAdi: string };
  }[];
  uyelikler: {
    katildiAt: string;
    topluluk: { isim: string; durum: string };
  }[];
  _count: {
    mesajlar: number;
    oneriler: number;
    oylar: number;
  };
}

export interface ToplulukListesi {
  topluluklar: (Topluluk & {
    _count: { uyeler: number; mesajlar: number };
  })[];
  sayfalama: {
    toplam: number;
    sayfa: number;
    limit: number;
    toplamSayfa: number;
  };
}

export interface ModeasyonLog {
  id: string;
  aksiyon: string;
  hedefTip: string;
  hedefId: string;
  detay?: Record<string, unknown>;
  olusturuldu: string;
  yetkili: { kullaniciAdi: string };
}

export interface ModeasyonLogListesi {
  loglar: ModeasyonLog[];
  sayfalama: {
    toplam: number;
    sayfa: number;
    limit: number;
    toplamSayfa: number;
  };
}

// Bildirim Types
export type BildirimTipi =
  | 'OYUN_BASLADI'
  | 'OYUN_BITTI'
  | 'TUR_BASLADI'
  | 'OYLAMA_BASLADI'
  | 'ONERI_KABUL_EDILDI'
  | 'ONERI_REDDEDILDI'
  | 'TOPLULUGA_DAVET'
  | 'TOPLULUKTAN_ATILDI'
  | 'YENI_MESAJ'
  | 'SISTEM';

export interface Bildirim {
  id: string;
  tip: BildirimTipi;
  baslik: string;
  icerik: string;
  link?: string;
  okundu: boolean;
  olusturuldu: string;
}

export interface BildirimListesi {
  bildirimler: Bildirim[];
  okunmamisSayisi: number;
  toplam: number;
}

// Istatistik Types
export interface LiderlikOyuncu {
  sira: number;
  id: string;
  kullaniciAdi: string;
  oynananOyunlar: number;
  tamamlananOyunlar: number;
  yapilanOneriler: number;
  verilenOylar: number;
  kayitTarihi: string;
}

export interface GenelIstatistikler {
  toplamOyuncu: number;
  toplamTopluluk: number;
  tamamlananOyun: number;
  toplamOneri: number;
  toplamOy: number;
  toplamMesaj: number;
  sonYediGunOyunlar: number;
}

export interface SonucDagilimi {
  sonuc: string;
  sayi: number;
}

// Profil Types
export interface ProfilDetay {
  id: string;
  kullaniciAdi: string;
  email: string;
  sistemRolu: string;
  olusturulmaTarihi: string;
  sonAktiflik: string;
  istatistikler: {
    oynananOyunlar: number;
    tamamlananOyunlar: number;
    yapilanOneriler: number;
    verilenOylar: number;
    toplamMesaj: number;
  };
  sonOyunlar: {
    toplulukId: string;
    toplulukIsmi: string;
    durum: string;
    sonuc: string | null;
    katildiAt: string;
    basladiAt: string | null;
    bittiAt: string | null;
  }[];
}

// Basarim Types
export type BasarimKategori = 'OYUN' | 'OYLAMA' | 'ONERI' | 'SOSYAL' | 'LIDERLIK' | 'OZEL';
export type BasarimNadirlik = 'YAYGIN' | 'SEYREK' | 'NADIR' | 'EFSANEVI' | 'MITIK';

export interface Basarim {
  id: string;
  kod: string;
  isim: string;
  aciklama: string;
  ikon: string;
  kategori: BasarimKategori;
  nadirlik: BasarimNadirlik;
  kazanildiMi: boolean;
  kazanildiAt?: string;
}

export interface BasarimOzeti {
  toplam: number;
  kazanilan: number;
  yuzde: number;
  sonKazanilan?: Basarim;
}

export interface BasarimIstatistik {
  kod: string;
  isim: string;
  kazananSayisi: number;
  yuzde: number;
}

// Tekrar (Replay) Types
export type OlayTipi =
  | 'OYUN_BASLADI'
  | 'TUR_BASLADI'
  | 'OLAY_ACILDI'
  | 'ONERI_YAPILDI'
  | 'OY_KULLANILDI'
  | 'OYLAMA_TAMAMLANDI'
  | 'TUR_BITTI'
  | 'KAYNAK_DEGISTI'
  | 'OYUN_BITTI'
  | 'OYUNCU_KATILDI'
  | 'OYUNCU_AYRILDI';

export interface TekrarOlayi {
  id: string;
  tip: OlayTipi;
  turNumarasi?: number;
  veri: Record<string, unknown>;
  kaynaklar?: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  };
  zaman: string;
}

export interface OyunTekrari {
  toplulukId: string;
  toplulukIsmi: string;
  baslangic: string;
  bitis?: string;
  sonuc?: string;
  oyuncular: { id: string; kullaniciAdi: string }[];
  turSayisi: number;
  olaylar: TekrarOlayi[];
}

export interface TamamlananOyun {
  id: string;
  isim: string;
  sonuc: string;
  tarih: string;
  oyuncuSayisi: number;
}

export interface TamamlananOyunlarResponse {
  oyunlar: TamamlananOyun[];
  toplam: number;
}

export interface OyunOzeti {
  toplamOneri: number;
  toplamOy: number;
  toplamMesaj: number;
  enAktifOyuncu?: {
    kullaniciAdi: string;
    oneriSayisi: number;
  };
}

// Turnuva Types
export type TurnuvaDurumu = 'KAYIT_ACIK' | 'KAYIT_KAPALI' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';
export type MacDurumu = 'BEKLIYOR' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL';

export interface TurnuvaOzeti {
  id: string;
  isim: string;
  aciklama?: string;
  durum: TurnuvaDurumu;
  maxKatilimci: number;
  mevcutKatilimci: number;
  kayitBitis: string;
  baslamaZamani?: string;
}

export interface TurnuvaKatilimci {
  id: string;
  kullaniciAdi: string;
  puan: number;
  kazanilanMac: number;
  kayipMac: number;
  sira?: number;
}

export interface TurnuvaMac {
  id: string;
  turNumarasi: number;
  macNumarasi: number;
  durum: string;
  kazananId?: string;
}

export interface TurnuvaDetay extends TurnuvaOzeti {
  katilimcilar: TurnuvaKatilimci[];
  maclar: TurnuvaMac[];
}

export interface TurnuvaListesiResponse {
  turnuvalar: TurnuvaOzeti[];
  toplam: number;
}
