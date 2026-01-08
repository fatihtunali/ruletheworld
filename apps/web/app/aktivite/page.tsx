'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';

interface Aktivite {
  id: string;
  oyuncuId: string;
  tip: string;
  baslik: string;
  detay: Record<string, any>;
  referansId?: string;
  referansTip?: string;
  goruldu: boolean;
  olusturuldu: string;
}

const AKTIVITE_IKONLARI: Record<string, string> = {
  OYUN_KAZANDI: '🏆',
  OYUN_KAYBETTI: '💔',
  OYUN_TAMAMLADI: '🎮',
  BASARIM_KAZANDI: '🏅',
  SEVIYE_ATLADI: '⬆️',
  ARKADAS_EKLEDI: '👋',
  ARKADAS_KABUL_ETTI: '🤝',
  TURNUVA_KATILDI: '🏟️',
  TURNUVA_KAZANDI: '👑',
  PREMIUM_OLDU: '⭐',
  SEZON_ODULU: '🎁',
};

const AKTIVITE_RENKLERI: Record<string, string> = {
  OYUN_KAZANDI: 'bg-yellow-500/20 text-yellow-400',
  OYUN_KAYBETTI: 'bg-red-500/20 text-red-400',
  OYUN_TAMAMLADI: 'bg-blue-500/20 text-blue-400',
  BASARIM_KAZANDI: 'bg-purple-500/20 text-purple-400',
  SEVIYE_ATLADI: 'bg-green-500/20 text-green-400',
  ARKADAS_EKLEDI: 'bg-cyan-500/20 text-cyan-400',
  ARKADAS_KABUL_ETTI: 'bg-cyan-500/20 text-cyan-400',
  TURNUVA_KATILDI: 'bg-orange-500/20 text-orange-400',
  TURNUVA_KAZANDI: 'bg-yellow-500/20 text-yellow-400',
  PREMIUM_OLDU: 'bg-primary-500/20 text-primary-400',
  SEZON_ODULU: 'bg-pink-500/20 text-pink-400',
};

export default function AktiviteSayfasi() {
  const { token } = useAuthStore();
  const [aktifTab, setAktifTab] = useState<'benim' | 'arkadaslar' | 'global'>('arkadaslar');
  const [aktiviteler, setAktiviteler] = useState<Aktivite[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  useEffect(() => {
    const aktiviteleriYukle = async () => {
      setYukleniyor(true);
      try {
        let endpoint = 'global';
        if (aktifTab === 'benim') endpoint = 'benim';
        else if (aktifTab === 'arkadaslar') endpoint = 'arkadaslar';

        const headers: Record<string, string> = {};
        if (token && aktifTab !== 'global') {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/aktivite/${endpoint}?sayfa=${sayfa}`, {
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          setAktiviteler(data.aktiviteler || []);
          setToplamSayfa(data.toplamSayfa || 1);
        }
      } catch (error) {
        console.error('Aktiviteler yüklenemedi:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    aktiviteleriYukle();
  }, [API_URL, token, aktifTab, sayfa]);

  const formatTarih = (tarih: string) => {
    const d = new Date(tarih);
    const simdi = new Date();
    const fark = Math.floor((simdi.getTime() - d.getTime()) / 1000);

    if (fark < 60) return 'Az önce';
    if (fark < 3600) return `${Math.floor(fark / 60)}dk önce`;
    if (fark < 86400) return `${Math.floor(fark / 3600)}sa önce`;
    if (fark < 604800) return `${Math.floor(fark / 86400)}g önce`;
    return d.toLocaleDateString('tr-TR');
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Aktivite Akışı</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['arkadaslar', 'benim', 'global'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setAktifTab(tab); setSayfa(1); }}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                aktifTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'arkadaslar' && 'Arkadaşlar'}
              {tab === 'benim' && 'Benim'}
              {tab === 'global' && 'Herkes'}
            </button>
          ))}
        </div>

        {/* Aktivite Listesi */}
        {yukleniyor ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : aktiviteler.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-white mb-2">Henüz aktivite yok</h2>
            <p className="text-gray-400">
              {aktifTab === 'arkadaslar'
                ? 'Arkadaşlarınız oyun oynadığında burada görünecek'
                : aktifTab === 'benim'
                  ? 'Oyun oynadığınızda aktiviteleriniz burada görünecek'
                  : 'Toplulukta aktivite olmadı'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {aktiviteler.map((aktivite) => (
              <div
                key={aktivite.id}
                className={`bg-gray-800 rounded-xl p-4 ${!aktivite.goruldu ? 'border-l-4 border-primary-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${AKTIVITE_RENKLERI[aktivite.tip] || 'bg-gray-700'}`}>
                    {AKTIVITE_IKONLARI[aktivite.tip] || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white">{aktivite.baslik}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatTarih(aktivite.olusturuldu)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setSayfa((s) => Math.max(1, s - 1))}
              disabled={sayfa === 1}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
            >
              Önceki
            </button>
            <span className="text-gray-400">{sayfa} / {toplamSayfa}</span>
            <button
              onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))}
              disabled={sayfa === toplamSayfa}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
