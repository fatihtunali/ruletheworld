// Analytics Utility
// Google Analytics veya baska bir servis eklenebilir

type EventParams = Record<string, string | number | boolean | undefined>;

interface PageViewData {
  path: string;
  title?: string;
  referrer?: string;
}

interface AnalyticsConfig {
  googleAnalyticsId?: string;
  debug?: boolean;
}

class Analytics {
  private gaId: string | null = null;
  private debug = false;
  private isClient = typeof window !== 'undefined';

  init(config?: AnalyticsConfig) {
    this.gaId = config?.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID || null;
    this.debug = config?.debug || process.env.NODE_ENV === 'development';

    if (this.gaId && this.isClient) {
      // Google Analytics script'ini yukle
      this.loadGoogleAnalytics();
    }

    if (this.debug) {
      console.log('[Analytics] Initialized', { gaId: this.gaId ? '***' : null });
    }
  }

  private loadGoogleAnalytics() {
    if (!this.gaId || !this.isClient) return;

    // gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    // gtag init
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', this.gaId);
  }

  // Sayfa goruntulemesi
  pageView(data: PageViewData) {
    if (this.debug) {
      console.log('[Analytics] PageView:', data);
    }

    if (this.gaId && this.isClient && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: data.path,
        page_title: data.title,
        page_referrer: data.referrer,
      });
    }

    // Backend'e de gonder (opsiyonel)
    this.sendToBackend('pageview', data);
  }

  // Olay takibi
  event(eventName: string, params?: EventParams) {
    if (this.debug) {
      console.log('[Analytics] Event:', eventName, params);
    }

    if (this.gaId && this.isClient && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }

    this.sendToBackend('event', { eventName, ...params });
  }

  // Kullanici tanimlama
  setUserId(userId: string | null) {
    if (this.gaId && this.isClient && (window as any).gtag) {
      (window as any).gtag('config', this.gaId, {
        user_id: userId,
      });
    }
  }

  // Oyun olaylari
  oyunBasladi(toplulukId: string, oyuncuSayisi: number) {
    this.event('oyun_basladi', {
      topluluk_id: toplulukId,
      oyuncu_sayisi: oyuncuSayisi,
    });
  }

  oyunBitti(toplulukId: string, sonuc: string, turSayisi: number) {
    this.event('oyun_bitti', {
      topluluk_id: toplulukId,
      sonuc,
      tur_sayisi: turSayisi,
    });
  }

  oneriYapildi(toplulukId: string) {
    this.event('oneri_yapildi', { topluluk_id: toplulukId });
  }

  oyKullanildi(toplulukId: string, secim: string) {
    this.event('oy_kullanildi', {
      topluluk_id: toplulukId,
      secim,
    });
  }

  toplulukOlusturuldu(toplulukId: string) {
    this.event('topluluk_olusturuldu', { topluluk_id: toplulukId });
  }

  toplulugaKatildi(toplulukId: string) {
    this.event('topluluga_katildi', { topluluk_id: toplulukId });
  }

  private async sendToBackend(type: string, data: unknown) {
    if (!this.isClient) return;

    try {
      // Basit analytics backend'e gonderim (opsiyonel)
      const token = localStorage.getItem('token');
      if (token) {
        // Backend endpoint varsa gonder
        // await fetch('/api/analytics', { ... });
      }
    } catch {
      // Sessizce basarisiz ol
    }
  }
}

export const analytics = new Analytics();

// Sayfa degisikliklerini otomatik izle
export function usePageTracking() {
  if (typeof window === 'undefined') return;

  // Initial page view
  analytics.pageView({
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
  });
}
