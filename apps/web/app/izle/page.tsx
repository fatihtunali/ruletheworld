'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface IzlenebilirOyun {
  id: string;
  isim: string;
  oyunModu: string;
  mevcutTur: number;
  toplamTur: number;
  oyuncuSayisi: number;
  izleyiciSayisi: number;
  basladiAt: string;
}

const MOD_RENKLERI: Record<string, string> = {
  NORMAL: 'bg-blue-500/20 text-blue-400',
  HIZLI: 'bg-yellow-500/20 text-yellow-400',
  UZUN: 'bg-green-500/20 text-green-400',
  MARATON: 'bg-purple-500/20 text-purple-400',
  EGITIM: 'bg-gray-500/20 text-gray-400',
};

export default function IzleSayfasi() {
  const [oyunlar, setOyunlar] = useState<IzlenebilirOyun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  useEffect(() => {
    const oyunlariYukle = async () => {
      try {
        const res = await fetch(`${API_URL}/izleyici/oyunlar`);
        const data = await res.json();
        setOyunlar(data);
      } catch (error) {
        console.error('Oyunlar yüklenemedi:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    oyunlariYukle();
    const interval = setInterval(oyunlariYukle, 10000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const formatSure = (tarih: string) => {
    const baslangic = new Date(tarih);
    const simdi = new Date();
    const fark = Math.floor((simdi.getTime() - baslangic.getTime()) / 60000);
    return fark < 60 ? `${fark}dk` : `${Math.floor(fark / 60)}sa ${fark % 60}dk`;
  };

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Canli Oyunlar</h1>
            <p className="text-gray-400 mt-1">Devam eden oyunlari izle</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">Canli</span>
          </div>
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : oyunlar.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-xl font-bold text-white mb-2">Şu an canlı oyun yok</h2>
            <p className="text-gray-400 mb-6">Yeni oyunlar başladığında burada görünecek</p>
            <Link
              href="/eslestirme"
              className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              Oyun Başlat
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {oyunlar.map((oyun) => (
              <Link
                key={oyun.id}
                href={`/izle/${oyun.id}`}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                      {oyun.isim}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${MOD_RENKLERI[oyun.oyunModu] || MOD_RENKLERI.NORMAL}`}>
                        {oyun.oyunModu}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatSure(oyun.basladiAt)} önce başladı
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Canlı</span>
                  </div>
                </div>

                {/* İlerleme */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Tur {oyun.mevcutTur}/{oyun.toplamTur}</span>
                    <span className="text-gray-400">
                      {Math.round((oyun.mevcutTur / oyun.toplamTur) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(oyun.mevcutTur / oyun.toplamTur) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {oyun.oyuncuSayisi} oyuncu
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {oyun.izleyiciSayisi} izleyici
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bilgi */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-medium text-white mb-2">İzleyici Modu Hakkında</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Devam eden oyunları gerçek zamanlı izleyebilirsiniz</li>
            <li>• İzleyiciler oyuna müdahale edemez</li>
            <li>• Tüm oyuncu kararlarını ve oylama sonuçlarını görebilirsiniz</li>
            <li>• Kaynak değişimlerini canlı takip edebilirsiniz</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
