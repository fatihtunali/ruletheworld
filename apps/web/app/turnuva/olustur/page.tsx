'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function TurnuvaOlusturPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    isim: '',
    aciklama: '',
    maxKatilimci: 16,
    minKatilimci: 4,
    oyunBasinaOyuncu: 4,
    kayitBitis: '',
    baslamaZamani: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.isim.trim()) {
      setError('Turnuva ismi gerekli');
      setLoading(false);
      return;
    }

    if (!form.kayitBitis) {
      setError('Kayit bitis tarihi gerekli');
      setLoading(false);
      return;
    }

    const res = await api.turnuva.olustur({
      isim: form.isim,
      aciklama: form.aciklama || undefined,
      maxKatilimci: form.maxKatilimci,
      minKatilimci: form.minKatilimci,
      oyunBasinaOyuncu: form.oyunBasinaOyuncu,
      kayitBitis: new Date(form.kayitBitis).toISOString(),
      baslamaZamani: form.baslamaZamani ? new Date(form.baslamaZamani).toISOString() : undefined,
    });

    if (res.data?.turnuva) {
      router.push(`/turnuva/${res.data.turnuva.id}`);
    } else {
      setError(res.error || 'Turnuva olusturulamadi');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/turnuva" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            &larr; Geri
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Turnuva Olustur</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          {error && (
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Turnuva Ismi *
              </label>
              <input
                type="text"
                value={form.isim}
                onChange={(e) => setForm({ ...form, isim: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ornegin: Kış Sampiyonası 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aciklama
              </label>
              <textarea
                value={form.aciklama}
                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Turnuva hakkinda bilgi..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maksimum Katilimci
                </label>
                <input
                  type="number"
                  value={form.maxKatilimci}
                  onChange={(e) => setForm({ ...form, maxKatilimci: parseInt(e.target.value) || 16 })}
                  min={4}
                  max={64}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Katilimci
                </label>
                <input
                  type="number"
                  value={form.minKatilimci}
                  onChange={(e) => setForm({ ...form, minKatilimci: parseInt(e.target.value) || 4 })}
                  min={2}
                  max={32}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Oyun Basina Oyuncu
              </label>
              <input
                type="number"
                value={form.oyunBasinaOyuncu}
                onChange={(e) => setForm({ ...form, oyunBasinaOyuncu: parseInt(e.target.value) || 4 })}
                min={2}
                max={8}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kayit Bitis Tarihi *
              </label>
              <input
                type="datetime-local"
                value={form.kayitBitis}
                onChange={(e) => setForm({ ...form, kayitBitis: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Baslama Zamani (Opsiyonel)
              </label>
              <input
                type="datetime-local"
                value={form.baslamaZamani}
                onChange={(e) => setForm({ ...form, baslamaZamani: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Olusturuluyor...' : 'Turnuva Olustur'}
            </button>
            <Link
              href="/turnuva"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Iptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
