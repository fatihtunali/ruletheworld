'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useLobiStore } from '../../lib/store';
import { Topluluk } from '../../lib/api';
import Bildirimler from '../../components/Bildirimler';
import TemaAyarlari from '../../components/TemaAyarlari';

export default function LobiSayfasi() {
  const router = useRouter();
  const { oyuncu, cikisYap, profilYukle, token } = useAuthStore();
  const { topluluklar, topluluklariYukle, toplulukOlustur, toplulugaKatil, yukleniyor } = useLobiStore();

  const [modalAcik, setModalAcik] = useState(false);
  const [modalTip, setModalTip] = useState<'olustur' | 'katil'>('olustur');
  const [toplulukIsmi, setToplulukIsmi] = useState('');
  const [katilimKodu, setKatilimKodu] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/giris');
      return;
    }
    profilYukle();
    topluluklariYukle();
  }, [token, router, profilYukle, topluluklariYukle]);

  const handleToplulukOlustur = async () => {
    if (!toplulukIsmi.trim()) return;
    const topluluk = await toplulukOlustur(toplulukIsmi);
    if (topluluk) {
      setModalAcik(false);
      setToplulukIsmi('');
      router.push(`/oyun/${topluluk.id}`);
    }
  };

  const handleToplulugaKatil = async () => {
    if (!katilimKodu.trim()) return;
    const topluluk = await toplulugaKatil(katilimKodu);
    if (topluluk) {
      setModalAcik(false);
      setKatilimKodu('');
      router.push(`/oyun/${topluluk.id}`);
    }
  };

  const handleCikis = () => {
    cikisYap();
    router.push('/');
  };

  if (!oyuncu) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/profil"
              className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Hos geldin, </span>
              <span className="text-white font-medium">{oyuncu.kullaniciAdi}</span>
            </Link>
            <TemaAyarlari />
            <Bildirimler />
            {oyuncu.sistemRolu === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs sm:text-sm transition-colors"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleCikis}
              className="px-2 sm:px-4 py-1.5 sm:py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <span className="sm:hidden">Cikis</span>
              <span className="hidden sm:inline">Cikis Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => {
              setModalTip('olustur');
              setModalAcik(true);
            }}
            className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Topluluk Oluştur
            </span>
          </button>
          <button
            onClick={() => {
              setModalTip('katil');
              setModalAcik(true);
            }}
            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Kod ile Katıl
            </span>
          </button>
        </div>

        {/* Topluluklar */}
        <div>
          <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Acik Topluluklar</h2>
          <Link
            href="/liderlik"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <span>🏆</span>
            <span>Liderlik Tablosu</span>
          </Link>
        </div>

          {yukleniyor ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : topluluklar.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Henüz Topluluk Yok</h3>
              <p className="text-gray-400 mb-6">İlk topluluğu sen oluştur veya bir koda katıl!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topluluklar.map((topluluk) => (
                <ToplulukKarti key={topluluk.id} topluluk={topluluk} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">
              {modalTip === 'olustur' ? 'Yeni Topluluk Oluştur' : 'Topluluğa Katıl'}
            </h3>

            {modalTip === 'olustur' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Topluluk İsmi
                  </label>
                  <input
                    type="text"
                    value={toplulukIsmi}
                    onChange={(e) => setToplulukIsmi(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Örn: Akdeniz Kasabası"
                    maxLength={30}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalAcik(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleToplulukOlustur}
                    disabled={!toplulukIsmi.trim()}
                    className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-xl transition-colors"
                  >
                    Oluştur
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Katılım Kodu
                  </label>
                  <input
                    type="text"
                    value={katilimKodu}
                    onChange={(e) => setKatilimKodu(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center text-2xl tracking-widest"
                    placeholder="ABC123"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Arkadaşından aldığın 6 haneli kodu gir
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalAcik(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleToplulugaKatil}
                    disabled={katilimKodu.length !== 6}
                    className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-xl transition-colors"
                  >
                    Katıl
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToplulukKarti({ topluluk }: { topluluk: Topluluk }) {
  const router = useRouter();

  const durumRenkleri: Record<string, string> = {
    // New states
    BEKLEME: 'bg-yellow-500',
    HAZIR: 'bg-green-500',
    GERI_SAYIM: 'bg-primary-500 animate-pulse',
    BOT_DOLDURMA: 'bg-blue-500',
    // Legacy states
    LOBI: 'bg-yellow-500',
    DEVAM_EDIYOR: 'bg-green-500',
    TAMAMLANDI: 'bg-gray-500',
    TERK_EDILDI: 'bg-red-500',
  };

  const durumMetinleri: Record<string, string> = {
    // New states
    BEKLEME: 'Oyuncu Bekliyor',
    HAZIR: 'Başlamaya Hazır',
    GERI_SAYIM: 'Başlıyor...',
    BOT_DOLDURMA: 'Bot Ekleniyor',
    // Legacy states
    LOBI: 'Oyuncu Bekliyor',
    DEVAM_EDIYOR: 'Oyun Devam Ediyor',
    TAMAMLANDI: 'Tamamlandı',
    TERK_EDILDI: 'Terk Edildi',
  };

  return (
    <div
      onClick={() => router.push(`/oyun/${topluluk.id}`)}
      className="bg-gray-800 rounded-2xl p-5 cursor-pointer hover:bg-gray-750 hover:ring-2 hover:ring-primary-500/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{topluluk.isim}</h3>
        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${durumRenkleri[topluluk.durum as keyof typeof durumRenkleri] || 'bg-gray-500'}`}>
          {durumMetinleri[topluluk.durum as keyof typeof durumMetinleri] || topluluk.durum}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{topluluk.liderAdi}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{topluluk.oyuncuSayisi}/{topluluk.maxOyuncu}</span>
        </div>
      </div>

      {['LOBI', 'BEKLEME', 'HAZIR', 'GERI_SAYIM', 'BOT_DOLDURMA'].includes(topluluk.durum) && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Katılım Kodu:</span>
            <span className="font-mono text-primary-400 font-medium">{topluluk.kod}</span>
          </div>
        </div>
      )}
    </div>
  );
}
