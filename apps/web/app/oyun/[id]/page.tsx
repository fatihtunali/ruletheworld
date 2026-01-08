'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/store';
import { useOyunStore } from '../../../lib/socket';

// Components
import LobiEkrani from './LobiEkrani';
import OyunEkrani from './OyunEkrani';
import SonucEkrani from './SonucEkrani';

export default function OyunOdasiSayfasi() {
  const params = useParams();
  const router = useRouter();
  const toplulukId = params.id as string;

  const { token, oyuncu } = useAuthStore();
  const { baglan, kopat, durum, asama, yukleniyor, hata, bagli } = useOyunStore();

  useEffect(() => {
    if (!token) {
      router.push('/giris');
      return;
    }

    baglan(toplulukId);

    return () => {
      kopat();
    };
  }, [token, toplulukId, router, baglan, kopat]);

  if (!token || !oyuncu) {
    return null;
  }

  if (yukleniyor && !bagli) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Oyun odasına bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bağlantı Hatası</h2>
          <p className="text-gray-400 mb-6">{hata}</p>
          <Link href="/lobi" className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors">
            Lobiye Dön
          </Link>
        </div>
      </div>
    );
  }

  // Render based on game state
  if (durum === 'LOBI' || asama === 'LOBI') {
    return <LobiEkrani />;
  }

  if (durum === 'TAMAMLANDI' || asama === 'SONUC') {
    return <SonucEkrani />;
  }

  return <OyunEkrani />;
}
