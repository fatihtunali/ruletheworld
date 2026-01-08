'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

function SifreSifirlaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [yeniSifre, setYeniSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dogruluyor, setDogruluyor] = useState(true);
  const [tokenGecerli, setTokenGecerli] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);

  useEffect(() => {
    if (!token) {
      setDogruluyor(false);
      return;
    }

    const dogrula = async () => {
      const res = await api.sifreSifirlamaDogrula(token);
      if (res.data?.gecerli) {
        setTokenGecerli(true);
      }
      setDogruluyor(false);
    };

    dogrula();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);

    if (yeniSifre.length < 6) {
      setHata('Sifre en az 6 karakter olmali');
      return;
    }

    if (yeniSifre !== sifreTekrar) {
      setHata('Sifreler eslesmiyor');
      return;
    }

    if (!token) return;

    setYukleniyor(true);

    const res = await api.sifreyiSifirla(token, yeniSifre);

    if (res.error) {
      setHata(res.error);
    } else {
      setBasarili(true);
    }

    setYukleniyor(false);
  };

  if (dogruluyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token || !tokenGecerli) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Gecersiz veya Suresi Dolmus Baglanti</h2>
          <p className="text-gray-400 mb-6">
            Bu sifre sifirlama baglantisi gecersiz veya suresi dolmus. Lutfen yeni bir talep olusturun.
          </p>
          <Link
            href="/sifremi-unuttum"
            className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
          >
            Yeni Talep Olustur
          </Link>
        </div>
      </div>
    );
  }

  if (basarili) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sifre Basariyla Degistirildi</h2>
          <p className="text-gray-400 mb-6">
            Yeni sifrenizle giris yapabilirsiniz.
          </p>
          <Link
            href="/giris"
            className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
          >
            Giris Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white inline-block mb-4">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <h1 className="text-xl font-semibold text-white">Yeni Sifre Belirle</h1>
          <p className="text-gray-400 mt-2">Hesabin icin yeni bir sifre olustur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yeni Sifre
            </label>
            <input
              type="password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="En az 6 karakter"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sifre Tekrar
            </label>
            <input
              type="password"
              value={sifreTekrar}
              onChange={(e) => setSifreTekrar(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Sifreyi tekrar gir"
              required
            />
          </div>

          {hata && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-xl transition-colors"
          >
            {yukleniyor ? 'Sifre Degistiriliyor...' : 'Sifreyi Degistir'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SifreSifirlaSayfasi() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SifreSifirlaContent />
    </Suspense>
  );
}
