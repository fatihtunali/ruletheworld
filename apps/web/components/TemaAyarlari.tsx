'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useTemaStore, Tema } from '../lib/store';

const TEMA_SECENEKLERI: { deger: Tema; etiket: string; ikon: ReactNode }[] = [
  {
    deger: 'acik',
    etiket: 'Acik',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    deger: 'koyu',
    etiket: 'Koyu',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    deger: 'sistem',
    etiket: 'Sistem',
    ikon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function TemaAyarlari() {
  const [acik, setAcik] = useState(false);
  const { tema, gercekTema, temaAyarla, sistemTemasiGuncelle, _hasHydrated } = useTemaStore();

  useEffect(() => {
    // Sistem tema degisikligini dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => sistemTemasiGuncelle();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [sistemTemasiGuncelle]);

  if (!_hasHydrated) return null;

  const mevcutSecenek = TEMA_SECENEKLERI.find((s) => s.deger === tema);

  return (
    <div className="relative">
      <button
        onClick={() => setAcik(!acik)}
        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700 dark:hover:bg-gray-700"
        title="Tema Ayarlari"
      >
        {gercekTema === 'koyu' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </button>

      {acik && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAcik(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 dark:bg-gray-800 light:bg-white rounded-xl shadow-xl border border-gray-700 dark:border-gray-700 light:border-gray-200 p-2 z-50">
            <h4 className="text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 px-2 py-1 mb-1">Tema</h4>
            {TEMA_SECENEKLERI.map((secenek) => (
              <button
                key={secenek.deger}
                onClick={() => {
                  temaAyarla(secenek.deger);
                  setAcik(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  tema === secenek.deger
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-100'
                }`}
              >
                {secenek.ikon}
                <span className="text-sm">{secenek.etiket}</span>
                {tema === secenek.deger && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
