'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Gorev {
  id: string;
  kod: string;
  tip: 'GUNLUK' | 'HAFTALIK' | 'SEZONLUK' | 'OZEL';
  baslik: string;
  aciklama?: string;
  hedef: number;
  altinOdulu: number;
  xpOdulu: number;
  rozetKodu?: string;
  aktif: boolean;
}

interface GorevIlerleme {
  gorev: Gorev;
  ilerleme: number;
  tamamlandi: boolean;
  odul_alindi: boolean;
}

export default function GorevlerPage() {
  const { oyuncu, token, yukleniyor: authYukleniyor } = useAuthStore();
  const router = useRouter();
  const [gorevler, setGorevler] = useState<GorevIlerleme[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenTip, setSecilenTip] = useState<'GUNLUK' | 'HAFTALIK' | 'SEZONLUK' | 'HEPSI'>('HEPSI');
  const [odul_aliyor, setOdulAliyor] = useState<string | null>(null);

  useEffect(() => {
    if (!authYukleniyor && !token) {
      router.push('/giris');
    }
  }, [authYukleniyor, token, router]);

  useEffect(() => {
    if (token) {
      gorevleriGetir();
    }
  }, [token]);

  const gorevleriGetir = async () => {
    try {
      const { data } = await api.gorevleriGetir();
      if (data) setGorevler(data);
    } catch (error) {
      console.error('Görevler alınamadı:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const odulAl = async (gorevId: string) => {
    setOdulAliyor(gorevId);
    try {
      await api.gorevOdulAl(gorevId);
      await gorevleriGetir();
    } catch (error) {
      console.error('Ödül alınamadı:', error);
    } finally {
      setOdulAliyor(null);
    }
  };

  const filtrelenmisGorevler = secilenTip === 'HEPSI'
    ? gorevler
    : gorevler.filter(g => g.gorev.tip === secilenTip);

  const getTipRenk = (tip: string) => {
    switch (tip) {
      case 'GUNLUK': return 'from-green-500 to-emerald-600';
      case 'HAFTALIK': return 'from-blue-500 to-indigo-600';
      case 'SEZONLUK': return 'from-purple-500 to-pink-600';
      case 'OZEL': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTipIsim = (tip: string) => {
    switch (tip) {
      case 'GUNLUK': return 'Günlük';
      case 'HAFTALIK': return 'Haftalık';
      case 'SEZONLUK': return 'Sezonluk';
      case 'OZEL': return 'Özel';
      default: return tip;
    }
  };

  if (authYukleniyor || yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">Görevler</h1>
          <p className="text-gray-400">Görevleri tamamla, ödülleri topla!</p>
        </div>

        {/* Filtre Butonları */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-slide-up">
          {(['HEPSI', 'GUNLUK', 'HAFTALIK', 'SEZONLUK'] as const).map((tip) => (
            <button
              key={tip}
              onClick={() => setSecilenTip(tip)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                secilenTip === tip
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tip === 'HEPSI' ? 'Tümü' : getTipIsim(tip)}
            </button>
          ))}
        </div>

        {/* Görev Kartları */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrelenmisGorevler.map((gorevIlerleme, index) => {
            const { gorev, ilerleme, tamamlandi, odul_alindi } = gorevIlerleme;
            const yuzde = Math.min(100, Math.round((ilerleme / gorev.hedef) * 100));

            return (
              <div
                key={gorev.id}
                className={`relative rounded-2xl p-6 bg-gray-800 border-2 transition-all duration-300 hover-lift card-shine ${
                  tamamlandi && !odul_alindi
                    ? 'border-amber-500 animate-glow shadow-amber-500/30'
                    : odul_alindi
                    ? 'border-green-500/50 opacity-75'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Tip Badge */}
                <div className={`absolute -top-3 left-4 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTipRenk(gorev.tip)} text-white`}>
                  {getTipIsim(gorev.tip)}
                </div>

                {/* Tamamlandı Badge */}
                {odul_alindi && (
                  <div className="absolute -top-3 right-4 px-4 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                    Tamamlandı
                  </div>
                )}

                {/* İçerik */}
                <div className="mt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{gorev.baslik}</h3>
                  {gorev.aciklama && (
                    <p className="text-gray-400 text-sm mb-4">{gorev.aciklama}</p>
                  )}

                  {/* İlerleme Çubuğu */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">İlerleme</span>
                      <span className="text-white font-medium">{ilerleme} / {gorev.hedef}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tamamlandi
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-primary-500 to-primary-600 progress-bar'
                        }`}
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                  </div>

                  {/* Ödüller */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-9H9v4h4V7h-2z" />
                      </svg>
                      <span className="font-bold">+{gorev.altinOdulu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">+{gorev.xpOdulu} XP</span>
                    </div>
                    {gorev.rozetKodu && (
                      <div className="flex items-center gap-2 text-pink-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold">Rozet</span>
                      </div>
                    )}
                  </div>

                  {/* Ödül Al Butonu */}
                  {tamamlandi && !odul_alindi && (
                    <button
                      onClick={() => odulAl(gorev.id)}
                      disabled={odul_aliyor === gorev.id}
                      className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50"
                    >
                      {odul_aliyor === gorev.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Alınıyor...
                        </span>
                      ) : (
                        'Ödülü Al!'
                      )}
                    </button>
                  )}

                  {odul_alindi && (
                    <div className="text-center text-green-500 font-medium">
                      Ödül alındı
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtrelenmisGorevler.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p>Bu kategoride görev bulunamadı</p>
          </div>
        )}
      </main>
    </div>
  );
}
