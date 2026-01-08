'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, TurnuvaDetay, TurnuvaDurumu } from '../../../lib/api';

export default function TurnuvaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [turnuva, setTurnuva] = useState<TurnuvaDetay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [islem, setIslem] = useState(false);
  const [islemMesaj, setIslemMesaj] = useState('');

  useEffect(() => {
    loadTurnuva();
  }, [id]);

  const loadTurnuva = async () => {
    setLoading(true);
    const res = await api.turnuva.detay(id);
    if (res.data?.turnuva) {
      setTurnuva(res.data.turnuva);
    } else {
      setError(res.error || 'Turnuva bulunamadi');
    }
    setLoading(false);
  };

  const katil = async () => {
    setIslem(true);
    setIslemMesaj('');
    const res = await api.turnuva.katil(id);
    if (res.data?.basarili) {
      setIslemMesaj('Turnuvaya basariyla katildiniz!');
      loadTurnuva();
    } else {
      setIslemMesaj(res.error || 'Katilamadsiniz');
    }
    setIslem(false);
  };

  const ayril = async () => {
    setIslem(true);
    setIslemMesaj('');
    const res = await api.turnuva.ayril(id);
    if (res.data?.basarili) {
      setIslemMesaj('Turnuvadan ayrildiniz');
      loadTurnuva();
    } else {
      setIslemMesaj(res.error || 'Ayrilamadsiniz');
    }
    setIslem(false);
  };

  const baslat = async () => {
    setIslem(true);
    setIslemMesaj('');
    const res = await api.turnuva.baslat(id);
    if (res.data?.basarili) {
      setIslemMesaj('Turnuva basladi!');
      loadTurnuva();
    } else {
      setIslemMesaj(res.error || 'Turnuva baslatilamadi');
    }
    setIslem(false);
  };

  const durumRenk = (d: TurnuvaDurumu) => {
    switch (d) {
      case 'KAYIT_ACIK':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'KAYIT_KAPALI':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DEVAM_EDIYOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TAMAMLANDI':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'IPTAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const durumText = (d: TurnuvaDurumu) => {
    switch (d) {
      case 'KAYIT_ACIK':
        return 'Kayit Acik';
      case 'KAYIT_KAPALI':
        return 'Kayit Kapali';
      case 'DEVAM_EDIYOR':
        return 'Devam Ediyor';
      case 'TAMAMLANDI':
        return 'Tamamlandi';
      case 'IPTAL':
        return 'Iptal';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !turnuva) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Turnuva bulunamadi'}</p>
          <Link href="/turnuva" className="text-indigo-600 hover:underline mt-4 block">
            Turnuvalara Don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/turnuva" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            &larr; Geri
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{turnuva.isim}</h1>
              {turnuva.aciklama && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{turnuva.aciklama}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full ${durumRenk(turnuva.durum)}`}>
              {durumText(turnuva.durum)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="text-gray-500 dark:text-gray-400">Katilimci</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {turnuva.mevcutKatilimci}/{turnuva.maxKatilimci}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="text-gray-500 dark:text-gray-400">Kayit Bitis</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(turnuva.kayitBitis).toLocaleDateString('tr-TR')}
              </div>
            </div>
            {turnuva.baslamaZamani && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-gray-500 dark:text-gray-400">Baslama</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(turnuva.baslamaZamani).toLocaleDateString('tr-TR')}
                </div>
              </div>
            )}
          </div>

          {/* Aksiyonlar */}
          {turnuva.durum === 'KAYIT_ACIK' && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={katil}
                disabled={islem}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {islem ? 'Isleniyor...' : 'Turnuvaya Katil'}
              </button>
              <button
                onClick={ayril}
                disabled={islem}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {islem ? 'Isleniyor...' : 'Turnuvadan Ayril'}
              </button>
              <button
                onClick={baslat}
                disabled={islem}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {islem ? 'Isleniyor...' : 'Turnuvayi Baslat'}
              </button>
            </div>
          )}

          {islemMesaj && (
            <div className={`mt-4 p-3 rounded ${islemMesaj.includes('basari') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {islemMesaj}
            </div>
          )}
        </div>

        {/* Katilimcilar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Katilimcilar ({turnuva.katilimcilar.length})
          </h2>
          {turnuva.katilimcilar.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Henuz katilimci yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-2">Sira</th>
                    <th className="pb-2">Oyuncu</th>
                    <th className="pb-2">Puan</th>
                    <th className="pb-2">Kazanilan</th>
                    <th className="pb-2">Kaybedilen</th>
                  </tr>
                </thead>
                <tbody>
                  {turnuva.katilimcilar.map((k, i) => (
                    <tr key={k.id} className="border-b dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">{k.sira || i + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium">
                            {k.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-gray-900 dark:text-white">{k.kullaniciAdi}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-900 dark:text-white font-semibold">{k.puan}</td>
                      <td className="py-3 text-green-600">{k.kazanilanMac}</td>
                      <td className="py-3 text-red-600">{k.kayipMac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Maclar */}
        {turnuva.maclar.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Maclar ({turnuva.maclar.length})
            </h2>
            <div className="space-y-4">
              {turnuva.maclar.map((mac) => (
                <div
                  key={mac.id}
                  className="border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Tur {mac.turNumarasi} - Mac {mac.macNumarasi}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      mac.durum === 'TAMAMLANDI'
                        ? 'bg-green-100 text-green-800'
                        : mac.durum === 'DEVAM_EDIYOR'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {mac.durum}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
