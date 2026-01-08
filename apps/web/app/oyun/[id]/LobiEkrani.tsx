'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/store';
import { useOyunStore } from '../../../lib/socket';

export default function LobiEkrani() {
  const { oyuncu } = useAuthStore();
  const { toplulukIsmi, oyuncular, hazirOl, oyunuBaslat } = useOyunStore();
  const [kopyalandi, setKopyalandi] = useState(false);

  const benimDurumum = oyuncular.find((o) => o.id === oyuncu?.id);
  const benKurucuMuyum = benimDurumum?.rol === 'KURUCU';
  const hazirOyuncuSayisi = oyuncular.filter((o) => o.hazir).length;
  const minOyuncu = 4;
  const baslayabilir = oyuncular.length >= minOyuncu && hazirOyuncuSayisi === oyuncular.length;

  const davetKodu = oyuncular.length > 0 ? 'ABC123' : ''; // TODO: Get from server

  const kodKopyala = () => {
    navigator.clipboard.writeText(davetKodu);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

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
            <div>
              <h1 className="text-xl font-bold text-white">{toplulukIsmi || 'Oyun Lobisi'}</h1>
              <p className="text-sm text-gray-400">Oyuncular toplanıyor...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{oyuncular.length}/8</span>
            <div className="flex -space-x-2">
              {oyuncular.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 border-gray-800 ${
                    o.hazir ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                  title={o.kullaniciAdi}
                >
                  {o.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
              {oyuncular.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-gray-400 border-2 border-gray-800">
                  +{oyuncular.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Davet Kodu */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Arkadaşlarını Davet Et</h3>
                <p className="text-gray-400 text-sm">Bu kodu paylaşarak arkadaşlarını oyuna davet edebilirsin</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl text-primary-400 tracking-widest">{davetKodu || '------'}</span>
                <button
                  onClick={kodKopyala}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Kopyala"
                >
                  {kopyalandi ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Oyuncular Listesi */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Oyuncular ({oyuncular.length}/{minOyuncu} minimum)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {oyuncular.map((o) => (
                <div
                  key={o.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    o.hazir
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-gray-700/50 border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${
                        o.hazir ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {o.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{o.kullaniciAdi}</p>
                      <p className="text-xs text-gray-400">
                        {o.rol === 'KURUCU' ? 'Kurucu' : 'Oyuncu'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${o.bagli ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="text-xs text-gray-400">
                      {o.hazir ? 'Hazır' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Boş slotlar */}
              {Array.from({ length: Math.max(0, minOyuncu - oyuncular.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-4 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">Bekleniyor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hazırlık Durumu */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Hazırlık Durumu</h3>
                <p className="text-gray-400 text-sm">
                  {hazirOyuncuSayisi}/{oyuncular.length} oyuncu hazır
                </p>
              </div>
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(hazirOyuncuSayisi / Math.max(oyuncular.length, 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              {!benimDurumum?.hazir ? (
                <button
                  onClick={hazirOl}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
                >
                  Hazırım
                </button>
              ) : (
                <button
                  onClick={hazirOl}
                  className="flex-1 py-4 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-xl transition-colors"
                >
                  Hazır Değilim
                </button>
              )}

              {benKurucuMuyum && (
                <button
                  onClick={oyunuBaslat}
                  disabled={!baslayabilir}
                  className={`flex-1 py-4 font-medium rounded-xl transition-colors ${
                    baslayabilir
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {baslayabilir ? 'Oyunu Başlat' : `${minOyuncu - oyuncular.length} oyuncu daha gerekli`}
                </button>
              )}
            </div>

            {!benKurucuMuyum && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Kurucu oyunu başlatana kadar bekleyin
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
