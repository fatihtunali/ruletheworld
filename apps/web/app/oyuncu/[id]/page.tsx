'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/store';

interface OyuncuProfil {
  oyuncu: {
    id: string;
    kullaniciAdi: string;
    oynananOyunlar: number;
    tamamlananOyunlar: number;
    yapilanOneriler: number;
    verilenOylar: number;
    toplamPuan: number;
    sezonPuani: number;
    haftalikPuan: number;
    olusturuldu: string;
    sonAktiflik: string;
  };
  sonOyunlar: Array<{
    toplulukId: string;
    toplulukIsmi: string;
    basladiAt: string;
    bittiAt: string;
    sonuc: string | null;
    kaynaklar: {
      hazine: number;
      refah: number;
      istikrar: number;
      altyapi: number;
    } | null;
  }>;
  sonucDagilimi: Record<string, number>;
  oneriBasariOrani: number;
  basarimlar: Array<{
    kod: string;
    isim: string;
    ikon: string;
    nadirlik: string;
    kazanildiAt: string;
  }>;
}

export default function OyuncuProfilSayfasi() {
  const params = useParams();
  const oyuncuId = params.id as string;
  const { token, oyuncu: mevcutOyuncu } = useAuthStore();
  const [profil, setProfil] = useState<OyuncuProfil | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [aktifTab, setAktifTab] = useState<'genel' | 'oyunlar' | 'basarimlar'>('genel');

  const benimProfilim = mevcutOyuncu?.id === oyuncuId;

  useEffect(() => {
    const profilYukle = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/istatistikler/oyuncu/${oyuncuId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) {
          throw new Error('Oyuncu bulunamadi');
        }

        const data = await res.json();
        setProfil(data);
      } catch (error: any) {
        setHata(error.message);
      } finally {
        setYukleniyor(false);
      }
    };

    profilYukle();
  }, [oyuncuId, token]);

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hata || !profil) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{hata || 'Oyuncu bulunamadi'}</p>
          <Link href="/lobi" className="text-primary-400 hover:underline">
            Lobiye Don
          </Link>
        </div>
      </div>
    );
  }

  const { oyuncu, sonOyunlar, sonucDagilimi, oneriBasariOrani, basarimlar } = profil;

  const sonucRenkleri: Record<string, string> = {
    PARLADI: 'text-yellow-400',
    GELISTI: 'text-green-400',
    DURAGAN: 'text-blue-400',
    GERILEDI: 'text-orange-400',
    COKTU: 'text-red-400',
  };

  const nadirlikRenkleri: Record<string, string> = {
    YAYGIN: 'border-gray-500',
    SEYREK: 'border-green-500',
    NADIR: 'border-blue-500',
    EFSANEVI: 'border-purple-500',
    MITIK: 'border-yellow-500',
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
        {/* Profil Header */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-primary-500/30 rounded-2xl flex items-center justify-center text-4xl font-bold text-primary-400">
              {oyuncu.kullaniciAdi?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{oyuncu.kullaniciAdi}</h1>
                {benimProfilim && (
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                    Sen
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Katilim: {new Date(oyuncu.olusturuldu).toLocaleDateString('tr-TR')} ·
                Son aktiflik: {new Date(oyuncu.sonAktiflik).toLocaleDateString('tr-TR')}
              </p>

              {/* Quick Stats */}
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-primary-400">{oyuncu.toplamPuan}</p>
                  <p className="text-xs text-gray-500">Toplam Puan</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{oyuncu.tamamlananOyunlar}</p>
                  <p className="text-xs text-gray-500">Oyun</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{oneriBasariOrani}%</p>
                  <p className="text-xs text-gray-500">Oneri Basarisi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['genel', 'oyunlar', 'basarimlar'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAktifTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                aktifTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'genel' && 'Genel'}
              {tab === 'oyunlar' && 'Son Oyunlar'}
              {tab === 'basarimlar' && 'Basarimlar'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {aktifTab === 'genel' && (
          <div className="space-y-6">
            {/* Istatistikler */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Istatistikler</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Oynanan Oyun" value={oyuncu.oynananOyunlar} />
                <StatCard label="Tamamlanan" value={oyuncu.tamamlananOyunlar} />
                <StatCard label="Yapilan Oneri" value={oyuncu.yapilanOneriler} />
                <StatCard label="Verilen Oy" value={oyuncu.verilenOylar} />
              </div>
            </div>

            {/* Puan Detaylari */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Puan Detaylari</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{oyuncu.haftalikPuan}</p>
                  <p className="text-sm text-gray-400">Bu Hafta</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{oyuncu.sezonPuani}</p>
                  <p className="text-sm text-gray-400">Bu Sezon</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-400">{oyuncu.toplamPuan}</p>
                  <p className="text-sm text-gray-400">Toplam</p>
                </div>
              </div>
            </div>

            {/* Sonuc Dagilimi */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Oyun Sonuclari</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(sonucDagilimi).map(([sonuc, sayi]) => (
                  <div key={sonuc} className="bg-gray-700/50 rounded-xl px-4 py-2">
                    <span className={`font-semibold ${sonucRenkleri[sonuc] || 'text-gray-400'}`}>
                      {sonuc}
                    </span>
                    <span className="text-gray-400 ml-2">x{sayi}</span>
                  </div>
                ))}
                {Object.keys(sonucDagilimi).length === 0 && (
                  <p className="text-gray-500">Henuz tamamlanan oyun yok</p>
                )}
              </div>
            </div>
          </div>
        )}

        {aktifTab === 'oyunlar' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Son 10 Oyun</h2>
            {sonOyunlar.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henuz oyun yok</p>
            ) : (
              <div className="space-y-3">
                {sonOyunlar.map((oyun) => (
                  <Link
                    key={oyun.toplulukId}
                    href={`/tekrar/${oyun.toplulukId}`}
                    className="block bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{oyun.toplulukIsmi}</p>
                        <p className="text-sm text-gray-400">
                          {oyun.bittiAt && new Date(oyun.bittiAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {oyun.sonuc && (
                        <span className={`font-semibold ${sonucRenkleri[oyun.sonuc] || 'text-gray-400'}`}>
                          {oyun.sonuc}
                        </span>
                      )}
                    </div>
                    {oyun.kaynaklar && (
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-yellow-400">H: {oyun.kaynaklar.hazine}</span>
                        <span className="text-green-400">R: {oyun.kaynaklar.refah}</span>
                        <span className="text-blue-400">I: {oyun.kaynaklar.istikrar}</span>
                        <span className="text-purple-400">A: {oyun.kaynaklar.altyapi}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {aktifTab === 'basarimlar' && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basarimlar ({basarimlar.length})</h2>
            {basarimlar.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henuz basarim yok</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {basarimlar.map((basarim) => (
                  <div
                    key={basarim.kod}
                    className={`bg-gray-700/50 rounded-xl p-4 border-2 ${nadirlikRenkleri[basarim.nadirlik] || 'border-gray-600'}`}
                  >
                    <div className="text-3xl mb-2">{basarim.ikon}</div>
                    <p className="font-medium text-white">{basarim.isim}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(basarim.kazanildiAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-700/50 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
