'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, TamamlananOyun } from '../../lib/api';

const SONUC_RENKLERI: Record<string, string> = {
  PARLADI: 'bg-yellow-500/20 text-yellow-400',
  HAYATTA_KALDI: 'bg-green-500/20 text-green-400',
  ZORLANDI: 'bg-orange-500/20 text-orange-400',
  COKTU: 'bg-red-500/20 text-red-400',
};

const SONUC_ISIMLERI: Record<string, string> = {
  PARLADI: 'Parladi',
  HAYATTA_KALDI: 'Hayatta Kaldi',
  ZORLANDI: 'Zorlandi',
  COKTU: 'Coktu',
};

export default function TekrarListesiSayfasi() {
  const [oyunlar, setOyunlar] = useState<TamamlananOyun[]>([]);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    yukle();
  }, [sayfa]);

  const yukle = async () => {
    setYukleniyor(true);
    const res = await api.tekrar.oyunlar(sayfa, 20);
    if (res.data) {
      setOyunlar(res.data.oyunlar);
      setToplam(res.data.toplam);
    }
    setYukleniyor(false);
  };

  const toplamSayfa = Math.ceil(toplam / 20);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lobi" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">Oyun Arsivi</h1>
          </div>
          <div className="text-sm text-gray-400">
            {toplam} tamamlanan oyun
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : oyunlar.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-white mb-2">Henuz tamamlanan oyun yok</h2>
            <p className="text-gray-400 mb-6">Ilk oyununu tamamla ve burada gor!</p>
            <Link
              href="/lobi"
              className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              Lobiye Git
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oyunlar.map((oyun) => (
                <Link
                  key={oyun.id}
                  href={`/tekrar/${oyun.id}`}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {oyun.isim}
                    </h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${SONUC_RENKLERI[oyun.sonuc] || 'bg-gray-600 text-gray-300'}`}>
                      {SONUC_ISIMLERI[oyun.sonuc] || oyun.sonuc}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {oyun.oyuncuSayisi} oyuncu
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(oyun.tarih).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Sayfalama */}
            {toplamSayfa > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setSayfa((s) => Math.max(1, s - 1))}
                  disabled={sayfa === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Onceki
                </button>
                <span className="text-gray-400">
                  {sayfa} / {toplamSayfa}
                </span>
                <button
                  onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))}
                  disabled={sayfa === toplamSayfa}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
