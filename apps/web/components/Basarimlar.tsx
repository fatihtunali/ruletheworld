'use client';

import { useState, useEffect } from 'react';
import { api, Basarim, BasarimOzeti, BasarimKategori, BasarimNadirlik } from '../lib/api';

const KATEGORI_ISIMLERI: Record<BasarimKategori, string> = {
  OYUN: 'Oyun',
  OYLAMA: 'Oylama',
  ONERI: 'Oneri',
  SOSYAL: 'Sosyal',
  LIDERLIK: 'Liderlik',
  OZEL: 'Ozel',
};

const NADIRLIK_RENKLERI: Record<BasarimNadirlik, string> = {
  YAYGIN: 'bg-gray-500',
  SEYREK: 'bg-green-500',
  NADIR: 'bg-blue-500',
  EFSANEVI: 'bg-purple-500',
  MITIK: 'bg-yellow-500',
};

const NADIRLIK_ISIMLERI: Record<BasarimNadirlik, string> = {
  YAYGIN: 'Yaygin',
  SEYREK: 'Seyrek',
  NADIR: 'Nadir',
  EFSANEVI: 'Efsanevi',
  MITIK: 'Mitik',
};

interface BasarimlarProps {
  kompakt?: boolean;
}

export default function Basarimlar({ kompakt = false }: BasarimlarProps) {
  const [basarimlar, setBasarimlar] = useState<Basarim[]>([]);
  const [ozet, setOzet] = useState<BasarimOzeti | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState<BasarimKategori | 'TUMU'>('TUMU');

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    const [basarimRes, ozetRes] = await Promise.all([
      api.basarimlar.getir(),
      api.basarimlar.ozet(),
    ]);

    if (basarimRes.data) {
      setBasarimlar(basarimRes.data.basarimlar);
    }
    if (ozetRes.data) {
      setOzet(ozetRes.data);
    }
    setYukleniyor(false);
  };

  const filtrelenmisBasarimlar = seciliKategori === 'TUMU'
    ? basarimlar
    : basarimlar.filter((b) => b.kategori === seciliKategori);

  const kategoriler: (BasarimKategori | 'TUMU')[] = ['TUMU', ...Object.keys(KATEGORI_ISIMLERI) as BasarimKategori[]];

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (kompakt) {
    // Kompakt gorunum - sadece ozet ve son kazanilanlar
    const sonKazanilanlar = basarimlar
      .filter((b) => b.kazanildiMi)
      .sort((a, b) => new Date(b.kazanildiAt!).getTime() - new Date(a.kazanildiAt!).getTime())
      .slice(0, 5);

    return (
      <div className="space-y-4">
        {/* Ozet */}
        {ozet && (
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
            <div className="text-4xl font-bold text-primary-400">
              {ozet.kazanilan}/{ozet.toplam}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${ozet.yuzde}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">%{ozet.yuzde} tamamlandi</p>
            </div>
          </div>
        )}

        {/* Son Kazanilanlar */}
        {sonKazanilanlar.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Son Kazanilanlar</h4>
            <div className="flex flex-wrap gap-2">
              {sonKazanilanlar.map((basarim) => (
                <div
                  key={basarim.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
                  title={basarim.aciklama}
                >
                  <span className="text-2xl">{basarim.ikon}</span>
                  <span className="text-sm text-white">{basarim.isim}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ozet */}
      {ozet && (
        <div className="p-6 bg-gradient-to-r from-primary-900/50 to-purple-900/50 rounded-xl border border-primary-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Basarimlar</h3>
              <p className="text-gray-400">Oyun icinde kazandigin rozetler</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary-400">
                {ozet.kazanilan}<span className="text-gray-500">/{ozet.toplam}</span>
              </div>
              <p className="text-sm text-gray-400">%{ozet.yuzde} tamamlandi</p>
            </div>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
              style={{ width: `${ozet.yuzde}%` }}
            />
          </div>
        </div>
      )}

      {/* Kategori Filtreleri */}
      <div className="flex flex-wrap gap-2">
        {kategoriler.map((kategori) => (
          <button
            key={kategori}
            onClick={() => setSeciliKategori(kategori)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              seciliKategori === kategori
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {kategori === 'TUMU' ? 'Tumu' : KATEGORI_ISIMLERI[kategori]}
          </button>
        ))}
      </div>

      {/* Basarim Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrelenmisBasarimlar.map((basarim) => (
          <div
            key={basarim.id}
            className={`relative p-4 rounded-xl border transition-all ${
              basarim.kazanildiMi
                ? 'bg-gray-800 border-primary-500/50'
                : 'bg-gray-800/50 border-gray-700 opacity-60'
            }`}
          >
            {/* Nadirlik Etiketi */}
            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white ${NADIRLIK_RENKLERI[basarim.nadirlik]}`}>
              {NADIRLIK_ISIMLERI[basarim.nadirlik]}
            </div>

            <div className="flex items-start gap-4">
              <div className={`text-4xl ${basarim.kazanildiMi ? '' : 'grayscale'}`}>
                {basarim.ikon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{basarim.isim}</h4>
                <p className="text-sm text-gray-400 mt-1">{basarim.aciklama}</p>
                {basarim.kazanildiMi && basarim.kazanildiAt && (
                  <p className="text-xs text-primary-400 mt-2">
                    Kazanildi: {new Date(basarim.kazanildiAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </div>

            {/* Kazanildi Isareti */}
            {basarim.kazanildiMi && (
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtrelenmisBasarimlar.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Bu kategoride basarim bulunamadi
        </div>
      )}
    </div>
  );
}
