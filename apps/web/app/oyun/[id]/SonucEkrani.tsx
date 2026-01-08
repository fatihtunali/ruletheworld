'use client';

import Link from 'next/link';
import { useOyunStore } from '../../../lib/socket';

export default function SonucEkrani() {
  const { toplulukIsmi, sonuc, kaynaklar, mevcutTur, oyuncular } = useOyunStore();

  if (!sonuc) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const durumBilgileri = {
    PARLADI: {
      baslik: 'Topluluk Parladı!',
      aciklama: 'Mükemmel liderlik! Topluluk refah içinde serpildi.',
      renk: 'text-yellow-400',
      bgRenk: 'bg-yellow-500/20',
      borderRenk: 'border-yellow-500/50',
      ikon: '🌟',
    },
    HAYATTA_KALDI: {
      baslik: 'Topluluk Hayatta Kaldı',
      aciklama: 'Zorluklara rağmen topluluk ayakta kalmayı başardı.',
      renk: 'text-green-400',
      bgRenk: 'bg-green-500/20',
      borderRenk: 'border-green-500/50',
      ikon: '✓',
    },
    ZORLANDI: {
      baslik: 'Topluluk Zorlandı',
      aciklama: 'Bazı kararlar toplulugu olumsuz etkiledi, ama umut hala var.',
      renk: 'text-orange-400',
      bgRenk: 'bg-orange-500/20',
      borderRenk: 'border-orange-500/50',
      ikon: '⚠️',
    },
    COKTU: {
      baslik: 'Topluluk Çöktü',
      aciklama: 'Ne yazık ki topluluk ayakta kalamadı. Bir dahaki sefere!',
      renk: 'text-red-400',
      bgRenk: 'bg-red-500/20',
      borderRenk: 'border-red-500/50',
      ikon: '💔',
    },
  };

  const durum = durumBilgileri[sonuc.durum];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white text-center">{toplulukIsmi}</h1>
          <p className="text-sm text-gray-400 text-center">Oyun Tamamlandı • {mevcutTur} Tur</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Sonuç Kartı */}
          <div className={`${durum.bgRenk} border ${durum.borderRenk} rounded-2xl p-8 text-center mb-8`}>
            <div className="text-6xl mb-4">{durum.ikon}</div>
            <h2 className={`text-3xl font-bold ${durum.renk} mb-2`}>{durum.baslik}</h2>
            <p className="text-gray-300">{durum.aciklama}</p>
          </div>

          {/* Özet */}
          {sonuc.ozet && (
            <div className="bg-gray-800 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Özet</h3>
              <p className="text-gray-300 leading-relaxed">{sonuc.ozet}</p>
            </div>
          )}

          {/* Final Kaynaklar */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Final Kaynaklar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KaynakKarti
                isim="Hazine"
                deger={sonuc.kaynaklar.hazine}
                baslangic={1000}
                ikon="💰"
              />
              <KaynakKarti
                isim="Refah"
                deger={sonuc.kaynaklar.refah}
                baslangic={60}
                ikon="😊"
              />
              <KaynakKarti
                isim="İstikrar"
                deger={sonuc.kaynaklar.istikrar}
                baslangic={60}
                ikon="⚖️"
              />
              <KaynakKarti
                isim="Altyapı"
                deger={sonuc.kaynaklar.altyapi}
                baslangic={50}
                ikon="🏗️"
              />
            </div>
          </div>

          {/* Oyuncular */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Oyuncular</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {oyuncular.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center text-sm font-medium text-primary-400">
                    {o.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-white">{o.kullaniciAdi}</span>
                  {o.rol === 'KURUCU' && (
                    <span className="text-xs text-yellow-400">👑</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/lobi"
              className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl text-center transition-colors"
            >
              Yeni Oyun Başlat
            </Link>
            <Link
              href="/"
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl text-center transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function KaynakKarti({
  isim,
  deger,
  baslangic,
  ikon,
}: {
  isim: string;
  deger: number;
  baslangic: number;
  ikon: string;
}) {
  const fark = deger - baslangic;
  const yuzde = ((deger - baslangic) / baslangic) * 100;

  return (
    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{ikon}</div>
      <p className="text-sm text-gray-400 mb-1">{isim}</p>
      <p className="text-2xl font-bold text-white">{deger}</p>
      <p className={`text-sm ${fark >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {fark >= 0 ? '+' : ''}{fark} ({yuzde >= 0 ? '+' : ''}{yuzde.toFixed(0)}%)
      </p>
    </div>
  );
}
