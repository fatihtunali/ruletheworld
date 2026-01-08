'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';

interface KuyrukDurumu {
  id: string;
  durum: 'BEKLIYOR' | 'ESLESTI' | 'IPTAL' | 'ZAMAN_ASIMI';
  beklemeSuresi: number;
  kuyrukSirasi: number;
  tahminiSure: number;
  eslesilenToplulukId?: string;
}

interface KuyrukIstatistik {
  toplamBekleyen: number;
  modlaraGore: Record<string, number>;
  ortalamaBekmeSuresi: number;
}

const OYUN_MODLARI = [
  { value: 'NORMAL', label: 'Normal', aciklama: '6 tur, standart süre' },
  { value: 'HIZLI', label: 'Hızlı', aciklama: '4 tur, kısa süre' },
  { value: 'UZUN', label: 'Uzun', aciklama: '10 tur, detaylı oyun' },
  { value: 'MARATON', label: 'Maraton', aciklama: '15 tur, uzun strateji' },
  { value: 'EGITIM', label: 'Eğitim', aciklama: 'Öğrenme modu' },
];

export default function EslestirmeSayfasi() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [kuyrukta, setKuyrukta] = useState(false);
  const [kuyrukDurumu, setKuyrukDurumu] = useState<KuyrukDurumu | null>(null);
  const [istatistikler, setIstatistikler] = useState<KuyrukIstatistik | null>(null);
  const [secilenMod, setSecilenMod] = useState('NORMAL');
  const [yukleniyor, setYukleniyor] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  // Kuyruk durumunu kontrol et
  const kuyrukDurumuKontrol = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/eslestirme/kuyruk/durum`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.kuyrukta === false) {
        setKuyrukta(false);
        setKuyrukDurumu(null);
      } else {
        setKuyrukta(true);
        setKuyrukDurumu(data);

        // Eşleşme bulundu mu?
        if (data.durum === 'ESLESTI' && data.eslesilenToplulukId) {
          router.push(`/oyun/${data.eslesilenToplulukId}`);
        }
      }
    } catch (error) {
      console.error('Kuyruk durumu kontrolü hatası:', error);
    }
  }, [token, API_URL, router]);

  // İstatistikleri getir
  const istatistikGetir = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/eslestirme/kuyruk/istatistikler`);
      const data = await res.json();
      setIstatistikler(data);
    } catch (error) {
      console.error('İstatistik hatası:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    kuyrukDurumuKontrol();
    istatistikGetir();

    // Periyodik kontrol
    const interval = setInterval(() => {
      if (kuyrukta) {
        kuyrukDurumuKontrol();
      }
      istatistikGetir();
    }, 3000);

    return () => clearInterval(interval);
  }, [kuyrukta, kuyrukDurumuKontrol, istatistikGetir]);

  // Kuyruğa gir
  const kuyrugaGir = async () => {
    if (!token) {
      router.push('/giris');
      return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/eslestirme/kuyruk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oyunModu: secilenMod }),
      });

      if (res.ok) {
        const data = await res.json();
        setKuyrukta(true);
        setKuyrukDurumu(data);
      }
    } catch (error) {
      console.error('Kuyruğa girme hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  // Kuyruktan çık
  const kuyrukdanCik = async () => {
    setYukleniyor(true);
    try {
      await fetch(`${API_URL}/eslestirme/kuyruk`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setKuyrukta(false);
      setKuyrukDurumu(null);
    } catch (error) {
      console.error('Kuyruktan çıkma hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const formatSure = (saniye: number) => {
    const dk = Math.floor(saniye / 60);
    const sn = saniye % 60;
    return dk > 0 ? `${dk}dk ${sn}sn` : `${sn}sn`;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/lobi" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Geri
          </Link>
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Hızlı Eşleştirme
        </h1>

        {/* Kuyruk İstatistikleri */}
        {istatistikler && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-400">{istatistikler.toplamBekleyen}</p>
                <p className="text-sm text-gray-400">Bekleyen Oyuncu</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatSure(istatistikler.ortalamaBekmeSuresi)}</p>
                <p className="text-sm text-gray-400">Ort. Bekleme</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {Object.keys(istatistikler.modlaraGore).length}
                </p>
                <p className="text-sm text-gray-400">Aktif Mod</p>
              </div>
            </div>
          </div>
        )}

        {kuyrukta && kuyrukDurumu ? (
          /* Kuyrukta Bekleme */
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {kuyrukDurumu.kuyrukSirasi}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Eşleşme Aranıyor...</h2>
              <p className="text-gray-400">Sıra: {kuyrukDurumu.kuyrukSirasi}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <p className="text-xl font-bold text-white">{formatSure(kuyrukDurumu.beklemeSuresi)}</p>
                <p className="text-sm text-gray-400">Bekleme Süresi</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4">
                <p className="text-xl font-bold text-primary-400">~{formatSure(kuyrukDurumu.tahminiSure)}</p>
                <p className="text-sm text-gray-400">Tahmini Süre</p>
              </div>
            </div>

            <button
              onClick={kuyrukdanCik}
              disabled={yukleniyor}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {yukleniyor ? 'İptal Ediliyor...' : 'İptal Et'}
            </button>
          </div>
        ) : (
          /* Mod Seçimi */
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Oyun Modu Seç</h2>

            <div className="space-y-3 mb-6">
              {OYUN_MODLARI.map((mod) => (
                <button
                  key={mod.value}
                  onClick={() => setSecilenMod(mod.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    secilenMod === mod.value
                      ? 'bg-primary-500/20 border-2 border-primary-500'
                      : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{mod.label}</p>
                      <p className="text-sm text-gray-400">{mod.aciklama}</p>
                    </div>
                    {istatistikler?.modlaraGore[mod.value] && (
                      <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        {istatistikler.modlaraGore[mod.value]} bekliyor
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={kuyrugaGir}
              disabled={yukleniyor}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {yukleniyor ? 'Kuyruğa Giriliyor...' : 'Eşleşme Bul'}
            </button>

            <p className="text-center text-gray-500 text-sm mt-4">
              En az 4 oyuncu bulunduğunda oyun başlar
            </p>
          </div>
        )}

        {/* Bilgi */}
        <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-medium text-white mb-2">Nasıl Çalışır?</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Bir oyun modu seçin ve eşleşme kuyruğuna girin</li>
            <li>• Sistem benzer seviyede oyuncularla sizi eşleştirir</li>
            <li>• En az 4 oyuncu bulunduğunda lobi otomatik oluşturulur</li>
            <li>• Premium üyeler öncelikli eşleştirme avantajına sahiptir</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
