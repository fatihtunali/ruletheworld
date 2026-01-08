'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';

export default function GirisSayfasi() {
  const router = useRouter();
  const { girisYap, yukleniyor, hata, hataTemizle } = useAuthStore();

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    hataTemizle();

    const basarili = await girisYap(email, sifre);
    if (basarili) {
      router.push('/lobi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <p className="text-gray-400 mt-2">Topluluğunu yönetmeye başla</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6">Giriş Yap</h1>

          {hata && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {hata}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="sifre" className="block text-sm font-medium text-gray-300">
                  Şifre
                </label>
                <Link href="/sifremi-unuttum" className="text-sm text-primary-400 hover:text-primary-300">
                  Şifremi unuttum
                </Link>
              </div>
              <input
                type="password"
                id="sifre"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25"
            >
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Hesabın yok mu?{' '}
              <Link href="/kayit" className="text-primary-400 hover:text-primary-300 font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
