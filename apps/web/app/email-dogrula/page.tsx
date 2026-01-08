'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

function EmailDogrulamaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [durum, setDurum] = useState<'yukleniyor' | 'basarili' | 'hata'>('yukleniyor');
  const [mesaj, setMesaj] = useState('');

  useEffect(() => {
    if (!token) {
      setDurum('hata');
      setMesaj('Gecersiz dogrulama linki');
      return;
    }

    dogrula();
  }, [token]);

  const dogrula = async () => {
    if (!token) return;

    const res = await api.emailDogrula(token);

    if (res.data?.basarili) {
      setDurum('basarili');
      setMesaj(res.data.mesaj || 'Email adresiniz basariyla dogrulandi!');

      // 3 saniye sonra lobiye yonlendir
      setTimeout(() => {
        router.push('/lobi');
      }, 3000);
    } else {
      setDurum('hata');
      setMesaj(res.error || 'Email dogrulanamadi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {durum === 'yukleniyor' && (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Dogrulaniyor...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lutfen bekleyin
            </p>
          </>
        )}

        {durum === 'basarili' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Basarili!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {mesaj}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Birkaç saniye içinde yönlendirileceksiniz...
            </p>
            <Link
              href="/lobi"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Lobiye Git
            </Link>
          </>
        )}

        {durum === 'hata' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dogrulama Basarisiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {mesaj}
            </p>
            <div className="space-y-3">
              <Link
                href="/giris"
                className="block w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Giris Yap
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Ana Sayfa
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EmailDogrulamaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <EmailDogrulamaContent />
    </Suspense>
  );
}
