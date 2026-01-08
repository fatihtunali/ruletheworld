'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';

export default function KayitSayfasi() {
  const router = useRouter();
  const { kayitOl, yukleniyor, hata, hataTemizle } = useAuthStore();

  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [formHata, setFormHata] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    hataTemizle();
    setFormHata('');

    // Validasyonlar
    if (kullaniciAdi.length < 3) {
      setFormHata('Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }

    if (sifre.length < 6) {
      setFormHata('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (sifre !== sifreTekrar) {
      setFormHata('Şifreler eşleşmiyor');
      return;
    }

    const basarili = await kayitOl(kullaniciAdi, email, sifre);
    if (basarili) {
      router.push('/lobi');
    }
  };

  const gosterilenHata = formHata || hata;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <p className="text-gray-400 mt-2">Yeni bir yönetici doğuyor</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6">Kayıt Ol</h1>

          {gosterilenHata && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {gosterilenHata}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="kullaniciAdi" className="block text-sm font-medium text-gray-300 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="kullaniciAdi"
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="yonetici123"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">Oyun içinde görünecek isim</p>
            </div>

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
              <label htmlFor="sifre" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                id="sifre"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
            </div>

            <div>
              <label htmlFor="sifreTekrar" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre Tekrar
              </label>
              <input
                type="password"
                id="sifreTekrar"
                value={sifreTekrar}
                onChange={(e) => setSifreTekrar(e.target.value)}
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
                  Kayıt yapılıyor...
                </span>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Zaten hesabın var mı?{' '}
              <Link href="/giris" className="text-primary-400 hover:text-primary-300 font-medium">
                Giriş Yap
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
