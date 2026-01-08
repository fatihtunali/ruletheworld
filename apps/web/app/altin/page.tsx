'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';

interface Cuzdan {
  bakiye: number;
  toplamKazanilan: number;
  toplamHarcanan: number;
  sonGunlukBonus?: string;
}

interface AltinIslem {
  id: string;
  tip: string;
  miktar: number;
  aciklama: string;
  olusturulma: string;
}

export default function AltinPage() {
  const { oyuncu, token, yukleniyor: authYukleniyor } = useAuthStore();
  const router = useRouter();
  const [cuzdan, setCuzdan] = useState<Cuzdan | null>(null);
  const [islemler, setIslemler] = useState<AltinIslem[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bonusAliyor, setBonusAliyor] = useState(false);
  const [bonusMesaji, setBonusMesaji] = useState<{ tip: 'basari' | 'hata'; mesaj: string } | null>(null);

  useEffect(() => {
    if (!authYukleniyor && !token) {
      router.push('/giris');
    }
  }, [authYukleniyor, token, router]);

  useEffect(() => {
    if (token) {
      verileriGetir();
    }
  }, [token]);

  const verileriGetir = async () => {
    try {
      const [cuzdanRes, islemlerRes] = await Promise.all([
        api.altinBakiyeGetir(),
        api.altinIslemlerGetir(20),
      ]);

      if (cuzdanRes.data) setCuzdan(cuzdanRes.data);
      if (islemlerRes.data) setIslemler(islemlerRes.data);
    } catch (error) {
      console.error('Altın verileri alınamadı:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const gunlukBonusAl = async () => {
    setBonusAliyor(true);
    setBonusMesaji(null);

    try {
      const response = await api.altinGunlukBonus();
      if (response.data) {
        setBonusMesaji({ tip: 'basari', mesaj: `${response.data.miktar} Altın kazandın!` });
      } else if (response.error) {
        setBonusMesaji({ tip: 'hata', mesaj: response.error });
      }
      await verileriGetir();
    } catch (error: any) {
      const mesaj = error.message || 'Bonus alınamadı';
      setBonusMesaji({ tip: 'hata', mesaj });
    } finally {
      setBonusAliyor(false);
    }
  };

  const gunlukBonusAlinabilirMi = () => {
    if (!cuzdan?.sonGunlukBonus) return true;
    const son = new Date(cuzdan.sonGunlukBonus);
    const simdi = new Date();
    return son.toDateString() !== simdi.toDateString();
  };

  const getIslemTipRenk = (tip: string) => {
    if (tip.includes('KAZANC') || tip.includes('BONUS') || tip.includes('ODUL')) {
      return 'text-green-500';
    }
    if (tip.includes('HARCAMA') || tip.includes('ALIS')) {
      return 'text-red-500';
    }
    if (tip.includes('HEDIYE')) {
      return 'text-pink-500';
    }
    return 'text-gray-400';
  };

  const getIslemIcon = (tip: string) => {
    if (tip.includes('KAZANC') || tip.includes('BONUS') || tip.includes('ODUL')) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      );
    }
    if (tip.includes('HARCAMA') || tip.includes('ALIS')) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
      </svg>
    );
  };

  if (authYukleniyor || yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text-gold mb-2">Altın Cüzdanı</h1>
          <p className="text-gray-400">Altınlarını yönet, harca veya biriktir!</p>
        </div>

        {/* Cüzdan Kartı */}
        <div className="max-w-2xl mx-auto mb-8 animate-slide-up">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 p-1">
            <div className="bg-gray-900 rounded-3xl p-6">
              {/* Dekoratif */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

              <div className="relative">
                {/* Bakiye */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 mb-4 animate-float shadow-lg shadow-amber-500/30">
                    <svg className="w-10 h-10 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                    </svg>
                  </div>
                  <div className="text-6xl font-bold text-white mb-2 counter">
                    {cuzdan?.bakiye.toLocaleString() || 0}
                  </div>
                  <div className="text-amber-300">Altın</div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">
                      +{cuzdan?.toplamKazanilan.toLocaleString() || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Toplam Kazanılan</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">
                      -{cuzdan?.toplamHarcanan.toLocaleString() || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Toplam Harcanan</div>
                  </div>
                </div>

                {/* Günlük Bonus */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Günlük Bonus</h3>
                      <p className="text-amber-300 text-sm">Her gün 100 Altın kazan!</p>
                    </div>
                    <button
                      onClick={gunlukBonusAl}
                      disabled={bonusAliyor || !gunlukBonusAlinabilirMi()}
                      className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                        gunlukBonusAlinabilirMi()
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 hover-lift'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {bonusAliyor ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </span>
                      ) : gunlukBonusAlinabilirMi() ? (
                        'Bonus Al!'
                      ) : (
                        'Alındı'
                      )}
                    </button>
                  </div>

                  {bonusMesaji && (
                    <div className={`mt-3 p-2 rounded-lg text-center text-sm ${
                      bonusMesaji.tip === 'basari' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {bonusMesaji.mesaj}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İşlem Geçmişi */}
        <div className="max-w-2xl mx-auto animate-slide-up">
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">İşlem Geçmişi</h2>
            </div>

            <div className="divide-y divide-gray-700/50">
              {islemler.map((islem) => (
                <div key={islem.id} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIslemTipRenk(islem.tip)} bg-current/10`}>
                    {getIslemIcon(islem.tip)}
                  </div>

                  {/* Bilgi */}
                  <div className="flex-1">
                    <div className="text-white font-medium">{islem.aciklama}</div>
                    <div className="text-gray-500 text-sm">
                      {new Date(islem.olusturulma).toLocaleString('tr-TR')}
                    </div>
                  </div>

                  {/* Miktar */}
                  <div className={`text-lg font-bold ${islem.miktar > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {islem.miktar > 0 ? '+' : ''}{islem.miktar.toLocaleString()}
                  </div>
                </div>
              ))}

              {islemler.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Henüz işlem yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Altın Kazanma Yolları */}
        <div className="max-w-2xl mx-auto mt-8 animate-slide-up">
          <h2 className="text-xl font-bold text-white mb-4">Altın Kazanma Yolları</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { baslik: 'Günlük Bonus', aciklama: 'Her gün 100 Altın', icon: '🎁' },
              { baslik: 'Oyun Oyna', aciklama: 'Oyun başına 10-50 Altın', icon: '🎮' },
              { baslik: 'Görevleri Tamamla', aciklama: 'Görev başına 50-500 Altın', icon: '📋' },
              { baslik: 'Sıralamada Yüksel', aciklama: 'Sezon sonu ödülleri', icon: '🏆' },
            ].map((yol, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-colors hover-lift"
              >
                <div className="text-3xl">{yol.icon}</div>
                <div>
                  <div className="font-medium text-white">{yol.baslik}</div>
                  <div className="text-gray-400 text-sm">{yol.aciklama}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
