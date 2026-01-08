'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function SifremiUnuttumSayfasi() {
  const [email, setEmail] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    const res = await api.sifreSifirlamaTalebi(email);

    if (res.error) {
      setHata(res.error);
    } else {
      setGonderildi(true);
      // Development modunda token'ı göster
      if (res.data?.token) {
        setDevToken(res.data.token);
      }
    }

    setYukleniyor(false);
  };

  if (gonderildi) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">E-posta Gonderildi</h2>
          <p className="text-gray-400 mb-6">
            Eger bu e-posta adresine kayitli bir hesap varsa, sifre sifirlama baglantisi gonderildi.
          </p>

          {devToken && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-yellow-400 text-sm font-medium mb-2">Development Token:</p>
              <p className="text-yellow-300 text-xs break-all font-mono">{devToken}</p>
              <Link
                href={`/sifre-sifirla?token=${devToken}`}
                className="mt-3 inline-block text-sm text-yellow-400 hover:text-yellow-300"
              >
                Sifirla sayfasina git →
              </Link>
            </div>
          )}

          <Link
            href="/giris"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Giris Sayfasina Don
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
          <h1 className="text-xl font-semibold text-white">Sifremi Unuttum</h1>
          <p className="text-gray-400 mt-2">E-posta adresini gir, sifirlama baglantisi gonderelim</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ornek@email.com"
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
            {yukleniyor ? 'Gonderiliyor...' : 'Sifirlama Baglantisi Gonder'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/giris" className="text-gray-400 hover:text-white transition-colors">
            Giris sayfasina don
          </Link>
        </div>
      </div>
    </div>
  );
}
