'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Çeviri dosyalarını import et
import trCommon from '@/locales/tr/common.json';
import enCommon from '@/locales/en/common.json';

// Desteklenen diller
export type Locale = 'tr' | 'en';

export const SUPPORTED_LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Çeviri tipleri
type TranslationKeys = typeof trCommon;

// Çeviriler
const translations: Record<Locale, TranslationKeys> = {
  tr: trCommon,
  en: enCommon,
};

// Context
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  formatNumber: (num: number) => string;
  formatDate: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Provider
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr');

  // Sayfa yüklendiğinde dil tercihini localStorage'dan al
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && SUPPORTED_LOCALES.some((l) => l.code === savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // Tarayıcı dilini kontrol et
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (SUPPORTED_LOCALES.some((l) => l.code === browserLang)) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // Çeviri fonksiyonu - nokta notasyonu ile nested key erişimi
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  // Sayı formatlama
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US').format(num);
  };

  // Tarih formatlama
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatNumber, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Dil seçici component
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={`relative ${className}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-gray-700 text-white rounded-lg px-3 py-2 pr-8 border border-gray-600 appearance-none cursor-pointer hover:bg-gray-600 transition-colors"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
