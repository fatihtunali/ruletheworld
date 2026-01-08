'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OyuncuSonuc {
  id: string;
  kullaniciAdi: string;
  toplamPuan: number;
  oyunSayisi: number;
  kayitTarihi: string;
}

export default function AraSayfasi() {
  const searchParams = useSearchParams();
  const [arama, setArama] = useState(searchParams.get('q') || '');
  const [sonuclar, setSonuclar] = useState<OyuncuSonuc[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aramaTamamlandi, setAramaTamamlandi] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  const oyuncuAra = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSonuclar([]);
      setAramaTamamlandi(false);
      return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/istatistikler/oyuncu-ara?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSonuclar(data.oyuncular || []);
      setAramaTamamlandi(true);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  }, [API_URL]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (arama.length >= 2) {
        oyuncuAra(arama);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [arama, oyuncuAra]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/lobi" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Geri
          </Link>
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Oyuncu Ara</h1>

        {/* Arama Kutusu */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kullanıcı adı ara..."
            className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            autoFocus
          />
          {yukleniyor && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Sonuçlar */}
        {arama.length < 2 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aramak için en az 2 karakter yazın</p>
          </div>
        ) : aramaTamamlandi && sonuclar.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-white mb-2">Sonuç bulunamadı</h2>
            <p className="text-gray-400">"{arama}" ile eşleşen oyuncu yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sonuclar.map((oyuncu) => (
              <Link
                key={oyuncu.id}
                href={`/oyuncu/${oyuncu.id}`}
                className="block bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-400">
                      {oyuncu.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{oyuncu.kullaniciAdi}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{oyuncu.toplamPuan} puan</span>
                      <span>{oyuncu.oyunSayisi} oyun</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Hızlı Linkler */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-medium text-white mb-3">Hızlı Erişim</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/liderlik"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Liderlik Tablosu
            </Link>
            <Link
              href="/arkadaslar"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Arkadaşlarım
            </Link>
            <Link
              href="/aktivite"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Aktivite Akışı
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
