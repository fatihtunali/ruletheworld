'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';

interface SezonBilgi {
  id: string;
  isim: string;
  aciklama?: string;
  baslangic: string;
  bitis: string;
  kalanGun: number;
  katilimciSayisi: number;
}

interface OyuncuDurum {
  sezonAktif: boolean;
  sezon?: {
    id: string;
    isim: string;
    bitis: string;
  };
  sira: number;
  puan: number;
  seviye: number;
  xp: number;
  xpYuzde: number;
  sonrakiSeviyeXP: number;
  tier: string;
}

interface SiralamaOyuncu {
  sira: number;
  oyuncu: {
    id: string;
    kullaniciAdi: string;
  };
  puan: number;
  seviye: number;
}

export default function SezonPage() {
  const { oyuncu, token } = useAuthStore();
  const router = useRouter();
  const [sezon, setSezon] = useState<SezonBilgi | null>(null);
  const [oyuncuDurum, setOyuncuDurum] = useState<OyuncuDurum | null>(null);
  const [siralama, setSiralama] = useState<SiralamaOyuncu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    verileriGetir();
  }, [token]);

  const verileriGetir = async () => {
    try {
      const [sezonRes, siralamaRes] = await Promise.all([
        api.sezonAktifGetir(),
        api.sezonSiralamaGetir(50),
      ]);

      if (sezonRes.data) setSezon(sezonRes.data);
      if (siralamaRes.data) setSiralama(siralamaRes.data);

      if (token) {
        const durumRes = await api.sezonDurumGetir();
        if (durumRes.data) setOyuncuDurum(durumRes.data);
      }
    } catch (error) {
      console.error('Sezon verileri alınamadı:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const getTierRenk = (tier: string) => {
    switch (tier) {
      case 'ELMAS': return 'from-cyan-400 to-blue-500';
      case 'ALTIN': return 'from-amber-400 to-yellow-500';
      case 'GUMUS': return 'from-gray-300 to-gray-400';
      case 'BRONZ': return 'from-orange-600 to-orange-700';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'ELMAS':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 8L12 22L22 8L12 2Z" fill="url(#diamond)" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="diamond" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#67E8F9" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
        );
      case 'ALTIN':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#gold)" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="gold" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        );
      case 'GUMUS':
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#silver)" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="silver" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D1D5DB" />
                <stop offset="1" stopColor="#9CA3AF" />
              </linearGradient>
            </defs>
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="url(#bronze)" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="bronze" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EA580C" />
                <stop offset="1" stopColor="#C2410C" />
              </linearGradient>
            </defs>
          </svg>
        );
    }
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!sezon) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-400 mb-4">Aktif Sezon Yok</h1>
          <p className="text-gray-500">Yakında yeni bir sezon başlayacak!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Sezon Başlığı */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-2">
            <span className="gradient-text-gold">{sezon.isim}</span>
          </h1>
          {sezon.aciklama && (
            <p className="text-gray-400 mb-4">{sezon.aciklama}</p>
          )}
          <div className="flex items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{sezon.kalanGun} gün kaldı</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{sezon.katilimciSayisi} katılımcı</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sol - Oyuncu Durumu */}
          {oyuncuDurum && oyuncuDurum.sezonAktif && (
            <div className="lg:col-span-1 animate-slide-in-left">
              <div className={`rounded-2xl p-6 bg-gradient-to-br ${getTierRenk(oyuncuDurum.tier)} relative overflow-hidden`}>
                {/* Dekoratif Elementler */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

                <div className="relative">
                  <div className="text-center mb-4">
                    <div className="inline-block animate-float">
                      {getTierIcon(oyuncuDurum.tier)}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-2">{oyuncuDurum.tier}</h2>
                    <p className="text-white/80 text-sm">Sıralama: #{oyuncuDurum.sira}</p>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4 space-y-4">
                    {/* Seviye */}
                    <div>
                      <div className="flex justify-between text-white/80 text-sm mb-1">
                        <span>Seviye {oyuncuDurum.seviye}</span>
                        <span>{oyuncuDurum.xp} / {oyuncuDurum.sonrakiSeviyeXP} XP</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/80 rounded-full progress-bar"
                          style={{ width: `${oyuncuDurum.xpYuzde}%` }}
                        />
                      </div>
                    </div>

                    {/* Puan */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">{oyuncuDurum.puan.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">Sezon Puanı</div>
                    </div>
                  </div>

                  {/* Tier Açıklaması */}
                  <div className="mt-4 text-center text-white/70 text-sm">
                    {oyuncuDurum.tier === 'ELMAS' && 'Top %5 - Efsanevi!'}
                    {oyuncuDurum.tier === 'ALTIN' && 'Top %15 - Harika!'}
                    {oyuncuDurum.tier === 'GUMUS' && 'Top %35 - İyi Gidiyorsun!'}
                    {oyuncuDurum.tier === 'BRONZ' && 'Yükselmeye devam et!'}
                  </div>
                </div>
              </div>

              {/* Ödüller Bilgisi */}
              <div className="mt-4 bg-gray-800 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">Sezon Sonu Ödülleri</h3>
                <div className="space-y-2">
                  {[
                    { tier: 'ELMAS', altin: 5000, puan: 1000 },
                    { tier: 'ALTIN', altin: 2500, puan: 500 },
                    { tier: 'GUMUS', altin: 1000, puan: 250 },
                    { tier: 'BRONZ', altin: 500, puan: 100 },
                  ].map((odul) => (
                    <div
                      key={odul.tier}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        oyuncuDurum.tier === odul.tier ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-gray-700/50'
                      }`}
                    >
                      <span className={`font-medium ${oyuncuDurum.tier === odul.tier ? 'text-primary-400' : 'text-gray-400'}`}>
                        {odul.tier}
                      </span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-amber-500">{odul.altin} Altın</span>
                        <span className="text-purple-500">+{odul.puan} Puan</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sağ - Sıralama */}
          <div className={`${oyuncuDurum && oyuncuDurum.sezonAktif ? 'lg:col-span-2' : 'lg:col-span-3'} animate-slide-in-right`}>
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Sezon Sıralaması</h2>
              </div>

              <div className="divide-y divide-gray-700/50">
                {siralama.map((oyuncuItem, index) => {
                  const isCurrentUser = oyuncu && oyuncuItem.oyuncu?.id === oyuncu.id;

                  return (
                    <div
                      key={oyuncuItem.oyuncu?.id || index}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        isCurrentUser ? 'bg-primary-500/10' : 'hover:bg-gray-700/30'
                      }`}
                    >
                      {/* Sıra */}
                      <div className="w-12 text-center">
                        {oyuncuItem.sira <= 3 ? (
                          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${
                            oyuncuItem.sira === 1 ? 'bg-amber-500 text-amber-900' :
                            oyuncuItem.sira === 2 ? 'bg-gray-300 text-gray-700' :
                            'bg-orange-600 text-orange-100'
                          }`}>
                            {oyuncuItem.sira}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-medium">{oyuncuItem.sira}</span>
                        )}
                      </div>

                      {/* Oyuncu Bilgisi */}
                      <div className="flex-1">
                        <div className={`font-medium ${isCurrentUser ? 'text-primary-400' : 'text-white'}`}>
                          {oyuncuItem.oyuncu?.kullaniciAdi || 'Bilinmeyen'}
                          {isCurrentUser && <span className="ml-2 text-xs text-primary-500">(Sen)</span>}
                        </div>
                        <div className="text-sm text-gray-500">Seviye {oyuncuItem.seviye}</div>
                      </div>

                      {/* Puan */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{oyuncuItem.puan.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">puan</div>
                      </div>
                    </div>
                  );
                })}

                {siralama.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Henüz sıralamada kimse yok
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
