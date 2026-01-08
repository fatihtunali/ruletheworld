'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Basarim, BasarimOzeti, BasarimKategori, BasarimNadirlik } from '../../lib/api';
import Navbar from '../../components/Navbar';

const KATEGORI_ISIMLER: Record<BasarimKategori, string> = {
  OYUN: 'Oyun',
  OYLAMA: 'Oylama',
  ONERI: 'Öneri',
  SOSYAL: 'Sosyal',
  LIDERLIK: 'Liderlik',
  OZEL: 'Özel',
};

const NADIRLIK_RENKLERI: Record<BasarimNadirlik, { bg: string; text: string; border: string }> = {
  YAYGIN: { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-600' },
  SEYREK: { bg: 'bg-green-900', text: 'text-green-300', border: 'border-green-600' },
  NADIR: { bg: 'bg-blue-900', text: 'text-blue-300', border: 'border-blue-600' },
  EFSANEVI: { bg: 'bg-purple-900', text: 'text-purple-300', border: 'border-purple-600' },
  MITIK: { bg: 'bg-orange-900', text: 'text-orange-300', border: 'border-orange-500' },
};

const NADIRLIK_ISIMLER: Record<BasarimNadirlik, string> = {
  YAYGIN: 'Yaygın',
  SEYREK: 'Seyrek',
  NADIR: 'Nadir',
  EFSANEVI: 'Efsanevi',
  MITIK: 'Mitik',
};

export default function BasarimlarPage() {
  const router = useRouter();
  const [basarimlar, setBasarimlar] = useState<Basarim[]>([]);
  const [ozet, setOzet] = useState<BasarimOzeti | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenKategori, setSecilenKategori] = useState<BasarimKategori | 'TUMU'>('TUMU');
  const [secilenNadirlik, setSecilenNadirlik] = useState<BasarimNadirlik | 'TUMU'>('TUMU');
  const [sadeceSahip, setSadeceSahip] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/giris');
      return;
    }

    verileriYukle();
  }, [router]);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const [basarimlarRes, ozetRes] = await Promise.all([
        api.basarimlar.getir(),
        api.basarimlar.ozet(),
      ]);

      if (basarimlarRes.data?.basarimlar) {
        setBasarimlar(basarimlarRes.data.basarimlar);
      }
      if (ozetRes.data) {
        setOzet(ozetRes.data);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const basarimKontrolEt = async () => {
    const sonuc = await api.basarimlar.kontrol();
    if (sonuc.data?.yeniBasarimlar && sonuc.data.yeniBasarimlar.length > 0) {
      alert(sonuc.data.mesaj);
      verileriYukle();
    } else {
      alert('Henüz yeni başarım yok');
    }
  };

  const filtrelenmisBasarimlar = basarimlar.filter((b) => {
    if (secilenKategori !== 'TUMU' && b.kategori !== secilenKategori) return false;
    if (secilenNadirlik !== 'TUMU' && b.nadirlik !== secilenNadirlik) return false;
    if (sadeceSahip && !b.kazanildiMi) return false;
    return true;
  });

  const kategorilereGoreGrupla = () => {
    const gruplar: Record<string, Basarim[]> = {};
    filtrelenmisBasarimlar.forEach((b) => {
      if (!gruplar[b.kategori]) {
        gruplar[b.kategori] = [];
      }
      gruplar[b.kategori].push(b);
    });
    return gruplar;
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  const gruplar = kategorilereGoreGrupla();

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Başarımlar</h1>
            <p className="text-gray-400">Oyun oynarken kazanabileceğin rozetler ve ödüller</p>
          </div>

          <button
            onClick={basarimKontrolEt}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Başarımları Kontrol Et
          </button>
        </div>

        {/* Özet Kartı */}
        {ozet && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{ozet.kazanilan}</div>
                <div className="text-gray-400">Kazanılan</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-500">{ozet.toplam}</div>
                <div className="text-gray-400">Toplam</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500">{ozet.yuzde}%</div>
                <div className="text-gray-400">Tamamlama</div>
              </div>
              {ozet.sonKazanilan && (
                <div className="text-center">
                  <div className="text-4xl">{ozet.sonKazanilan.ikon}</div>
                  <div className="text-gray-400">Son Kazanılan</div>
                </div>
              )}
            </div>

            {/* İlerleme Çubuğu */}
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${ozet.yuzde}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filtreler */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Kategori</label>
              <select
                value={secilenKategori}
                onChange={(e) => setSecilenKategori(e.target.value as BasarimKategori | 'TUMU')}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="TUMU">Tümü</option>
                {Object.entries(KATEGORI_ISIMLER).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-1">Nadirlik</label>
              <select
                value={secilenNadirlik}
                onChange={(e) => setSecilenNadirlik(e.target.value as BasarimNadirlik | 'TUMU')}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="TUMU">Tümü</option>
                {Object.entries(NADIRLIK_ISIMLER).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="sadeceSahip"
                checked={sadeceSahip}
                onChange={(e) => setSadeceSahip(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="sadeceSahip" className="text-gray-300">
                Sadece kazanılanlar
              </label>
            </div>
          </div>
        </div>

        {/* Başarım Listesi */}
        {Object.keys(gruplar).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Filtrelere uygun başarım bulunamadı
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(gruplar).map(([kategori, basarimListesi]) => (
              <div key={kategori}>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="bg-gray-700 px-3 py-1 rounded-lg">
                    {KATEGORI_ISIMLER[kategori as BasarimKategori]}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({basarimListesi.filter(b => b.kazanildiMi).length}/{basarimListesi.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {basarimListesi.map((basarim) => {
                    const renkler = NADIRLIK_RENKLERI[basarim.nadirlik];
                    return (
                      <div
                        key={basarim.id}
                        className={`relative rounded-xl p-4 border-2 transition-all ${
                          basarim.kazanildiMi
                            ? `${renkler.bg} ${renkler.border}`
                            : 'bg-gray-800 border-gray-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`text-4xl ${
                              basarim.kazanildiMi ? '' : 'grayscale'
                            }`}
                          >
                            {basarim.ikon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold ${basarim.kazanildiMi ? 'text-white' : 'text-gray-400'}`}>
                                {basarim.isim}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${renkler.bg} ${renkler.text}`}>
                                {NADIRLIK_ISIMLER[basarim.nadirlik]}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {basarim.aciklama}
                            </p>
                            {basarim.kazanildiAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Kazanıldı: {new Date(basarim.kazanildiAt).toLocaleDateString('tr-TR')}
                              </p>
                            )}
                          </div>
                        </div>

                        {basarim.kazanildiMi && (
                          <div className="absolute top-2 right-2 text-green-400">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
