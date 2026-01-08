'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../lib/store';
import { useI18n, LanguageSelector } from '../lib/i18n';
import Bildirimler from './Bildirimler';
import TemaAyarlari from './TemaAyarlari';

export default function Navbar() {
  const router = useRouter();
  const { oyuncu, cikisYap, token } = useAuthStore();
  const [menuAcik, setMenuAcik] = useState(false);
  const isAuthenticated = !!token;

  const handleCikis = () => {
    cikisYap();
    router.push('/');
  };

  const navLinks = [
    { href: '/lobi', label: 'Lobi', icon: '🏠' },
    { href: '/nasil-oynanir', label: 'Nasıl Oynanır', icon: '❓' },
    { href: '/gorevler', label: 'Görevler', icon: '📋' },
    { href: '/basarimlar', label: 'Başarımlar', icon: '🏅' },
    { href: '/sezon', label: 'Sezon', icon: '🏆' },
    { href: '/altin', label: 'Altın', icon: '💰' },
    { href: '/liderlik', label: 'Liderlik', icon: '📊' },
    { href: '/turnuva', label: 'Turnuva', icon: '⚔️' },
  ];

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && oyuncu ? (
              <>
                <Link
                  href="/profil"
                  className="text-gray-400 hover:text-white transition-colors text-sm hidden sm:flex items-center gap-2"
                >
                  <span className="text-white font-medium">{oyuncu.kullaniciAdi}</span>
                </Link>
                <TemaAyarlari />
                <LanguageSelector className="hidden sm:block" />
                <Bildirimler />
                {oyuncu.sistemRolu === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs sm:text-sm transition-colors hidden sm:inline-block"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleCikis}
                  className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm hidden sm:inline-block"
                >
                  Çıkış
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMenuAcik(!menuAcik)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {menuAcik ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/giris"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Giriş
                </Link>
                <Link
                  href="/kayit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuAcik && (
          <nav className="lg:hidden mt-4 py-4 border-t border-gray-700 animate-slide-up">
            <div className="grid grid-cols-3 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAcik(false)}
                  className="flex flex-col items-center gap-1 p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-xs">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-700">
              <Link
                href="/profil"
                onClick={() => setMenuAcik(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Profil: {oyuncu?.kullaniciAdi}
              </Link>
              {oyuncu?.sistemRolu === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuAcik(false)}
                  className="text-red-400 text-sm"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleCikis}
                className="text-gray-400 hover:text-white text-sm"
              >
                Çıkış Yap
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
