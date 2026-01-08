'use client';

import { useEffect, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { PWARegister } from './PWARegister';
import { errorTracker } from '../lib/errorTracking';
import { analytics, usePageTracking } from '../lib/analytics';
import { useAuthStore } from '../lib/store';
import { I18nProvider } from '../lib/i18n';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { oyuncu } = useAuthStore();

  useEffect(() => {
    // Error tracker'i baslat
    errorTracker.init();

    // Analytics'i baslat
    analytics.init();

    // Sayfa izlemeyi baslat
    usePageTracking();
  }, []);

  useEffect(() => {
    // Kullanici bilgisini error tracker ve analytics'e set et
    if (oyuncu) {
      errorTracker.setUser({
        id: oyuncu.id,
        kullaniciAdi: oyuncu.kullaniciAdi,
        email: oyuncu.email,
      });
      analytics.setUserId(oyuncu.id);
    } else {
      errorTracker.setUser(null);
      analytics.setUserId(null);
    }
  }, [oyuncu]);

  return (
    <ErrorBoundary>
      <I18nProvider>
        {children}
        <PWARegister />
      </I18nProvider>
    </ErrorBoundary>
  );
}
