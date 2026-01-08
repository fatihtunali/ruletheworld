'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, TurnuvaOzeti, TurnuvaDurumu } from '../../lib/api';

export default function TurnuvalarPage() {
  const [turnuvalar, setTurnuvalar] = useState<TurnuvaOzeti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [toplam, setToplam] = useState(0);
  const [durum, setDurum] = useState<TurnuvaDurumu | ''>('');
  const [aktifTab, setAktifTab] = useState<'tum' | 'aktif' | 'benim'>('tum');

  useEffect(() => {
    loadTurnuvalar();
  }, [sayfa, durum, aktifTab]);

  const loadTurnuvalar = async () => {
    setLoading(true);
    setError('');

    try {
      if (aktifTab === 'aktif') {
        const res = await api.turnuva.aktif();
        if (res.data) {
          setTurnuvalar(res.data.turnuvalar);
          setToplam(res.data.turnuvalar.length);
        } else {
          setError(res.error || 'Turnuvalar yüklenemedi');
        }
      } else if (aktifTab === 'benim') {
        const res = await api.turnuva.benim();
        if (res.data) {
          setTurnuvalar(res.data.turnuvalar);
          setToplam(res.data.turnuvalar.length);
        } else {
          setError(res.error || 'Turnuvalar yüklenemedi');
        }
      } else {
        const res = await api.turnuva.listele({
          sayfa,
          limit: 20,
          durum: durum || undefined,
        });
        if (res.data) {
          setTurnuvalar(res.data.turnuvalar);
          setToplam(res.data.toplam);
        } else {
          setError(res.error || 'Turnuvalar yüklenemedi');
        }
      }
    } catch {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
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

  const toplamSayfa = Math.ceil(toplam / 20);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Turnuvalar</h1>
          <Link
            href="/turnuva/olustur"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Turnuva Olustur
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAktifTab('tum')}
            className={`px-4 py-2 rounded-lg transition ${
              aktifTab === 'tum'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Tum Turnuvalar
          </button>
          <button
            onClick={() => setAktifTab('aktif')}
            className={`px-4 py-2 rounded-lg transition ${
              aktifTab === 'aktif'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Kayit Acik
          </button>
          <button
            onClick={() => setAktifTab('benim')}
            className={`px-4 py-2 rounded-lg transition ${
              aktifTab === 'benim'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Katildiklarim
          </button>
        </div>

        {/* Durum filtresi */}
        {aktifTab === 'tum' && (
          <div className="mb-6">
            <select
              value={durum}
              onChange={(e) => {
                setDurum(e.target.value as TurnuvaDurumu | '');
                setSayfa(1);
              }}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Tum Durumlar</option>
              <option value="KAYIT_ACIK">Kayit Acik</option>
              <option value="KAYIT_KAPALI">Kayit Kapali</option>
              <option value="DEVAM_EDIYOR">Devam Ediyor</option>
              <option value="TAMAMLANDI">Tamamlandi</option>
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Yukleniyor...</p>
          </div>
        ) : turnuvalar.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Henuz turnuva yok.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {turnuvalar.map((turnuva) => (
                <Link
                  key={turnuva.id}
                  href={`/turnuva/${turnuva.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {turnuva.isim}
                      </h2>
                      {turnuva.aciklama && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {turnuva.aciklama}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${durumRenk(turnuva.durum)}`}>
                      {durumText(turnuva.durum)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Katilimci:</span>{' '}
                      {turnuva.mevcutKatilimci}/{turnuva.maxKatilimci}
                    </div>
                    <div>
                      <span className="font-medium">Kayit Bitis:</span>{' '}
                      {new Date(turnuva.kayitBitis).toLocaleDateString('tr-TR')}
                    </div>
                    {turnuva.baslamaZamani && (
                      <div>
                        <span className="font-medium">Baslama:</span>{' '}
                        {new Date(turnuva.baslamaZamani).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Sayfalama */}
            {aktifTab === 'tum' && toplamSayfa > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setSayfa((p) => Math.max(1, p - 1))}
                  disabled={sayfa === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Onceki
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {sayfa} / {toplamSayfa}
                </span>
                <button
                  onClick={() => setSayfa((p) => Math.min(toplamSayfa, p + 1))}
                  disabled={sayfa === toplamSayfa}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
