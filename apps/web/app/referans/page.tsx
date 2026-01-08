'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';

interface ReferansKodu {
  kod: string;
  kullanilanSayi: number;
  kazanilanAltin: number;
}

interface ReferansIstatistik {
  kod: string;
  toplamKullanim: number;
  kazanilanAltin: number;
  sonKullanimlar: { tarih: string; odulVerildi: boolean }[];
}

export default function ReferansSayfasi() {
  const { token, oyuncu } = useAuthStore();
  const [referansKodu, setReferansKodu] = useState<ReferansKodu | null>(null);
  const [istatistikler, setIstatistikler] = useState<ReferansIstatistik | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopyalandi, setKopyalandi] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  useEffect(() => {
    const verileriYukle = async () => {
      if (!token) return;

      try {
        const [kodRes, istatRes] = await Promise.all([
          fetch(`${API_URL}/referans/kodum`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/referans/istatistikler`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (kodRes.ok) {
          setReferansKodu(await kodRes.json());
        }
        if (istatRes.ok) {
          setIstatistikler(await istatRes.json());
        }
      } catch (error) {
        console.error('Veriler yüklenemedi:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    verileriYukle();
  }, [API_URL, token]);

  const kopyala = () => {
    if (referansKodu) {
      navigator.clipboard.writeText(referansKodu.kod);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }
  };

  const paylas = () => {
    if (referansKodu) {
      const url = `${window.location.origin}/kayit?ref=${referansKodu.kod}`;
      const text = `RuleTheWorld'e katıl ve birlikte oynayalım! Referans kodum: ${referansKodu.kod}`;

      if (navigator.share) {
        navigator.share({ title: 'RuleTheWorld', text, url });
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`);
        setKopyalandi(true);
        setTimeout(() => setKopyalandi(false), 2000);
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Referans kodunuzu görmek için giriş yapın</p>
          <Link href="/giris" className="text-primary-400 hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-white text-center mb-2">Arkadaşlarını Davet Et</h1>
        <p className="text-gray-400 text-center mb-8">Her davetinden 100 altın kazan!</p>

        {yukleniyor ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Referans Kodu */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Referans Kodun</h2>

              <div className="bg-gray-900 rounded-xl p-4 mb-4 flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-primary-400 tracking-wider">
                  {referansKodu?.kod || '---'}
                </span>
                <button
                  onClick={kopyala}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    kopyalandi
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {kopyalandi ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              </div>

              <button
                onClick={paylas}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Paylaş
              </button>
            </div>

            {/* İstatistikler */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">İstatistikler</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{istatistikler?.toplamKullanim || 0}</p>
                  <p className="text-sm text-gray-400">Davet Edilen</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">{istatistikler?.kazanilanAltin || 0}</p>
                  <p className="text-sm text-gray-400">Kazanılan Altın</p>
                </div>
              </div>

              {istatistikler?.sonKullanimlar && istatistikler.sonKullanimlar.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Son Davetler</h3>
                  <div className="space-y-2">
                    {istatistikler.sonKullanimlar.slice(0, 5).map((k, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {new Date(k.tarih).toLocaleDateString('tr-TR')}
                        </span>
                        <span className={k.odulVerildi ? 'text-green-400' : 'text-yellow-400'}>
                          {k.odulVerildi ? '+100 altın' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nasıl Çalışır */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Nasıl Çalışır?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium">Kodunu Paylaş</p>
                    <p className="text-sm text-gray-400">Referans kodunu arkadaşlarınla paylaş</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium">Arkadaşın Kayıt Olur</p>
                    <p className="text-sm text-gray-400">Arkadaşın kodunla kayıt olur</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium">İlk Oyunu Tamamlar</p>
                    <p className="text-sm text-gray-400">Arkadaşın ilk oyununu tamamladığında ödüller verilir</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    🎁
                  </div>
                  <div>
                    <p className="text-white font-medium">Ödüller</p>
                    <p className="text-sm text-gray-400">
                      Sen <span className="text-yellow-400">100 altın</span>, arkadaşın <span className="text-yellow-400">50 altın</span> kazanır!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
