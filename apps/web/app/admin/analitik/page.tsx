'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/store';
import { useRouter } from 'next/navigation';

interface GenelIstatistik {
  toplamOyuncu: number;
  toplamTopluluk: number;
  tamamlananOyun: number;
  toplamOneri: number;
  toplamOy: number;
  toplamMesaj: number;
  sonYediGunOyunlar: number;
}

interface SonucDagilimi {
  sonuc: string;
  sayi: number;
}

interface KuyrukIstatistik {
  toplamBekleyen: number;
  modlaraGore: Record<string, number>;
  ortalamaBekmeSuresi: number;
}

interface GunlukVeri {
  tarih: string;
  oyunSayisi: number;
  oyuncuSayisi: number;
}

const SONUC_RENKLERI: Record<string, string> = {
  PARLADI: '#eab308',
  GELISTI: '#22c55e',
  DURAGAN: '#3b82f6',
  GERILEDI: '#f97316',
  COKTU: '#ef4444',
  HAYATTA_KALDI: '#22c55e',
  ZORLANDI: '#f97316',
};

export default function AnalitikSayfasi() {
  const router = useRouter();
  const { token, oyuncu } = useAuthStore();
  const [genel, setGenel] = useState<GenelIstatistik | null>(null);
  const [sonucDagilimi, setSonucDagilimi] = useState<SonucDagilimi[]>([]);
  const [kuyruk, setKuyruk] = useState<KuyrukIstatistik | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  useEffect(() => {
    // Admin kontrolü
    if (oyuncu && oyuncu.sistemRolu !== 'ADMIN' && oyuncu.sistemRolu !== 'MODERATOR') {
      router.push('/');
      return;
    }

    const verileriYukle = async () => {
      try {
        const [genelRes, sonucRes, kuyrukRes] = await Promise.all([
          fetch(`${API_URL}/istatistikler/genel`),
          fetch(`${API_URL}/istatistikler/sonuc-dagilimi`),
          fetch(`${API_URL}/eslestirme/kuyruk/istatistikler`),
        ]);

        if (genelRes.ok) setGenel(await genelRes.json());
        if (sonucRes.ok) setSonucDagilimi(await sonucRes.json());
        if (kuyrukRes.ok) setKuyruk(await kuyrukRes.json());
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    verileriYukle();
  }, [API_URL, oyuncu, router]);

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const toplamSonuc = sonucDagilimi.reduce((acc, s) => acc + s.sayi, 0);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Admin Panel
          </Link>
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Analitik Dashboard</h1>

        {/* Genel İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Toplam Oyuncu"
            value={genel?.toplamOyuncu || 0}
            icon="👥"
            color="text-blue-400"
          />
          <StatCard
            label="Tamamlanan Oyun"
            value={genel?.tamamlananOyun || 0}
            icon="🎮"
            color="text-green-400"
          />
          <StatCard
            label="Son 7 Gün Oyun"
            value={genel?.sonYediGunOyunlar || 0}
            icon="📈"
            color="text-yellow-400"
          />
          <StatCard
            label="Toplam Öneri"
            value={genel?.toplamOneri || 0}
            icon="💡"
            color="text-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sonuç Dağılımı */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Oyun Sonuç Dağılımı</h2>
            {sonucDagilimi.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            ) : (
              <div className="space-y-4">
                {sonucDagilimi.map((s) => (
                  <div key={s.sonuc}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{s.sonuc}</span>
                      <span className="text-gray-400">
                        {s.sayi} ({toplamSonuc > 0 ? Math.round((s.sayi / toplamSonuc) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${toplamSonuc > 0 ? (s.sayi / toplamSonuc) * 100 : 0}%`,
                          backgroundColor: SONUC_RENKLERI[s.sonuc] || '#6b7280',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eşleştirme Kuyruğu */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Eşleştirme Kuyruğu</h2>
            {kuyruk ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-primary-400">{kuyruk.toplamBekleyen}</p>
                    <p className="text-sm text-gray-400">Bekleyen Oyuncu</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{kuyruk.ortalamaBekmeSuresi}sn</p>
                    <p className="text-sm text-gray-400">Ort. Bekleme</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Mod Dağılımı</h3>
                  <div className="space-y-2">
                    {Object.entries(kuyruk.modlaraGore).map(([mod, sayi]) => (
                      <div key={mod} className="flex justify-between items-center">
                        <span className="text-white">{mod}</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
                          {sayi} oyuncu
                        </span>
                      </div>
                    ))}
                    {Object.keys(kuyruk.modlaraGore).length === 0 && (
                      <p className="text-gray-500">Kuyrukta kimse yok</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Kuyruk verisi yüklenemedi</p>
            )}
          </div>
        </div>

        {/* Detaylı İstatistikler */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Platform Aktivitesi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{genel?.toplamTopluluk || 0}</p>
              <p className="text-sm text-gray-400">Toplam Topluluk</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{genel?.toplamOy || 0}</p>
              <p className="text-sm text-gray-400">Toplam Oy</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{genel?.toplamMesaj || 0}</p>
              <p className="text-sm text-gray-400">Toplam Mesaj</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {genel?.toplamOneri && genel?.tamamlananOyun
                  ? (genel.toplamOneri / genel.tamamlananOyun).toFixed(1)
                  : 0}
              </p>
              <p className="text-sm text-gray-400">Oyun Başına Öneri</p>
            </div>
          </div>
        </div>

        {/* Hızlı Linkler */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            Kullanıcı Yönetimi
          </Link>
          <Link
            href="/liderlik"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            Liderlik Tablosu
          </Link>
          <Link
            href="/tekrar"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            Oyun Arşivi
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</span>
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}
