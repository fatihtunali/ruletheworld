'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, LiderlikOyuncu, GenelIstatistikler, SonucDagilimi } from '../../lib/api';
import Bildirimler from '../../components/Bildirimler';
import { useAuthStore } from '../../lib/store';

export default function LiderlikSayfasi() {
  const { token } = useAuthStore();
  const [liderlik, setLiderlik] = useState<LiderlikOyuncu[]>([]);
  const [genel, setGenel] = useState<GenelIstatistikler | null>(null);
  const [sonuclar, setSonuclar] = useState<SonucDagilimi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    verileriYukle();
  }, []);

  const verileriYukle = async () => {
    setYukleniyor(true);

    const [liderlikRes, genelRes, sonucRes] = await Promise.all([
      api.istatistikler.liderlik(50),
      api.istatistikler.genel(),
      api.istatistikler.sonucDagilimi(),
    ]);

    if (liderlikRes.data) setLiderlik(liderlikRes.data);
    if (genelRes.data) setGenel(genelRes.data);
    if (sonucRes.data) setSonuclar(sonucRes.data);

    setYukleniyor(false);
  };

  const sonucRenkleri: Record<string, string> = {
    PARLADI: 'bg-yellow-500',
    HAYATTA_KALDI: 'bg-green-500',
    ZORLANDI: 'bg-orange-500',
    COKTU: 'bg-red-500',
  };

  const toplamSonuc = sonuclar.reduce((acc, s) => acc + s.sayi, 0);

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-white">Liderlik Tablosu</h1>
          </div>
          {token && <Bildirimler />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Genel Istatistikler */}
          {genel && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <StatKart baslik="Oyuncu" deger={genel.toplamOyuncu} ikon="👥" />
              <StatKart baslik="Topluluk" deger={genel.toplamTopluluk} ikon="🏘️" />
              <StatKart baslik="Tamamlanan" deger={genel.tamamlananOyun} ikon="🏁" />
              <StatKart baslik="Oneriler" deger={genel.toplamOneri} ikon="💡" />
              <StatKart baslik="Oylar" deger={genel.toplamOy} ikon="🗳️" />
              <StatKart baslik="Mesajlar" deger={genel.toplamMesaj} ikon="💬" />
              <StatKart baslik="Bu Hafta" deger={genel.sonYediGunOyunlar} ikon="📅" />
            </div>
          )}

          {/* Sonuc Dagilimi */}
          {sonuclar.length > 0 && (
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Oyun Sonuclari</h3>
              <div className="flex h-8 rounded-full overflow-hidden">
                {sonuclar.map((s) => {
                  const yuzde = (s.sayi / toplamSonuc) * 100;
                  return (
                    <div
                      key={s.sonuc}
                      className={`${sonucRenkleri[s.sonuc || ''] || 'bg-gray-600'} flex items-center justify-center text-xs text-white font-medium`}
                      style={{ width: `${yuzde}%` }}
                      title={`${s.sonuc}: ${s.sayi}`}
                    >
                      {yuzde > 10 && `${Math.round(yuzde)}%`}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                {sonuclar.map((s) => (
                  <div key={s.sonuc} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${sonucRenkleri[s.sonuc || ''] || 'bg-gray-600'}`} />
                    <span className="text-sm text-gray-400">
                      {s.sonuc === 'PARLADI' && 'Parladi'}
                      {s.sonuc === 'HAYATTA_KALDI' && 'Hayatta Kaldi'}
                      {s.sonuc === 'ZORLANDI' && 'Zorlandi'}
                      {s.sonuc === 'COKTU' && 'Coktu'}
                      : {s.sayi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liderlik Tablosu */}
          <div className="bg-gray-800 rounded-2xl overflow-x-auto">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">En Iyi Oyuncular</h3>
            </div>
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Oyuncu</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Oyunlar</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Tamamlanan</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Oneriler</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Oylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {liderlik.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Henuz oyuncu yok
                    </td>
                  </tr>
                ) : (
                  liderlik.map((oyuncu) => (
                    <tr key={oyuncu.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${
                          oyuncu.sira === 1 ? 'text-yellow-400' :
                          oyuncu.sira === 2 ? 'text-gray-400' :
                          oyuncu.sira === 3 ? 'text-orange-400' :
                          'text-gray-500'
                        }`}>
                          {oyuncu.sira === 1 && '🥇'}
                          {oyuncu.sira === 2 && '🥈'}
                          {oyuncu.sira === 3 && '🥉'}
                          {oyuncu.sira > 3 && oyuncu.sira}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-medium">{oyuncu.kullaniciAdi}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {oyuncu.oynananOyunlar}
                      </td>
                      <td className="px-4 py-3 text-center text-green-400 font-medium">
                        {oyuncu.tamamlananOyunlar}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {oyuncu.yapilanOneriler}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {oyuncu.verilenOylar}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatKart({ baslik, deger, ikon }: { baslik: string; deger: number; ikon: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{ikon}</div>
      <div className="text-xl font-bold text-white">{deger.toLocaleString('tr-TR')}</div>
      <div className="text-xs text-gray-500">{baslik}</div>
    </div>
  );
}
