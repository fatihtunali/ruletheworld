'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { api, ProfilDetay } from '../../lib/api';
import Bildirimler from '../../components/Bildirimler';
import Basarimlar from '../../components/Basarimlar';
import TemaAyarlari from '../../components/TemaAyarlari';

function ProfilIcerigi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, oyuncu, _hasHydrated } = useAuthStore();
  const [profil, setProfil] = useState<ProfilDetay | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifSekme, setAktifSekme] = useState<'oyunlar' | 'basarimlar'>(
    searchParams.get('tab') === 'basarimlar' ? 'basarimlar' : 'oyunlar'
  );

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!token) {
      router.push('/giris');
      return;
    }

    profilYukle();
  }, [token, router, _hasHydrated]);

  const profilYukle = async () => {
    setYukleniyor(true);
    const res = await api.profilDetayGetir();
    if (res.data) {
      setProfil(res.data);
    }
    setYukleniyor(false);
  };

  if (!_hasHydrated || yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white mb-2">Profil yuklenemedi</h2>
          <Link href="/lobi" className="text-primary-400 hover:text-primary-300">
            Lobiye don
          </Link>
        </div>
      </div>
    );
  }

  const sonucRenkleri: Record<string, string> = {
    PARLADI: 'text-yellow-400',
    HAYATTA_KALDI: 'text-green-400',
    ZORLANDI: 'text-orange-400',
    COKTU: 'text-red-400',
  };

  const durumRenkleri: Record<string, string> = {
    LOBI: 'bg-yellow-500/20 text-yellow-400',
    DEVAM_EDIYOR: 'bg-green-500/20 text-green-400',
    TAMAMLANDI: 'bg-blue-500/20 text-blue-400',
    TERK_EDILDI: 'bg-red-500/20 text-red-400',
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
            <h1 className="text-xl font-bold text-white">Profilim</h1>
          </div>
          <div className="flex items-center gap-4">
            <TemaAyarlari />
            <Bildirimler />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profil Karti */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shrink-0">
                {profil.kullaniciAdi?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Bilgiler */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{profil.kullaniciAdi}</h2>
                  {profil.sistemRolu !== 'KULLANICI' && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      profil.sistemRolu === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {profil.sistemRolu}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mb-4 text-sm sm:text-base">{profil.email}</p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-500">
                  <span>Katilim: {new Date(profil.olusturulmaTarihi).toLocaleDateString('tr-TR')}</span>
                  <span>Son Aktiflik: {new Date(profil.sonAktiflik).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Istatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatKart
              baslik="Oynanan"
              deger={profil.istatistikler.oynananOyunlar}
              ikon="🎮"
            />
            <StatKart
              baslik="Tamamlanan"
              deger={profil.istatistikler.tamamlananOyunlar}
              ikon="🏁"
            />
            <StatKart
              baslik="Oneriler"
              deger={profil.istatistikler.yapilanOneriler}
              ikon="💡"
            />
            <StatKart
              baslik="Oylar"
              deger={profil.istatistikler.verilenOylar}
              ikon="🗳️"
            />
            <StatKart
              baslik="Mesajlar"
              deger={profil.istatistikler.toplamMesaj}
              ikon="💬"
            />
          </div>

          {/* Sekmeler */}
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setAktifSekme('oyunlar')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                aktifSekme === 'oyunlar'
                  ? 'text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Son Oyunlar
              {aktifSekme === 'oyunlar' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
            <button
              onClick={() => setAktifSekme('basarimlar')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                aktifSekme === 'basarimlar'
                  ? 'text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Basarimlar
              {aktifSekme === 'basarimlar' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          </div>

          {/* Son Oyunlar */}
          {aktifSekme === 'oyunlar' && (
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Son Oyunlar</h3>
              {profil.sonOyunlar.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Henuz oyun oynamamis</p>
                  <Link href="/lobi" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                    Ilk oyununu baslat
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {profil.sonOyunlar.map((oyun) => (
                    <Link
                      key={oyun.toplulukId}
                      href={`/oyun/${oyun.toplulukId}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors gap-2 sm:gap-4"
                    >
                      <div>
                        <h4 className="font-medium text-white">{oyun.toplulukIsmi}</h4>
                        <p className="text-xs sm:text-sm text-gray-400">
                          Katilim: {new Date(oyun.katildiAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {oyun.sonuc && (
                          <span className={`text-sm font-medium ${sonucRenkleri[oyun.sonuc] || 'text-gray-400'}`}>
                            {oyun.sonuc === 'PARLADI' && 'Parladi'}
                            {oyun.sonuc === 'HAYATTA_KALDI' && 'Hayatta Kaldi'}
                            {oyun.sonuc === 'ZORLANDI' && 'Zorlandi'}
                            {oyun.sonuc === 'COKTU' && 'Coktu'}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${durumRenkleri[oyun.durum] || 'bg-gray-500/20 text-gray-400'}`}>
                          {oyun.durum === 'LOBI' && 'Lobi'}
                          {oyun.durum === 'DEVAM_EDIYOR' && 'Devam Ediyor'}
                          {oyun.durum === 'TAMAMLANDI' && 'Tamamlandi'}
                          {oyun.durum === 'TERK_EDILDI' && 'Terk Edildi'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Basarimlar */}
          {aktifSekme === 'basarimlar' && (
            <Basarimlar />
          )}
        </div>
      </main>
    </div>
  );
}

function StatKart({ baslik, deger, ikon }: { baslik: string; deger: number; ikon: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className="text-2xl mb-2">{ikon}</div>
      <div className="text-2xl font-bold text-white">{deger}</div>
      <div className="text-xs text-gray-500">{baslik}</div>
    </div>
  );
}

export default function ProfilSayfasi() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ProfilIcerigi />
    </Suspense>
  );
}
