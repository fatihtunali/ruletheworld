'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api, OyunTekrari, TekrarOlayi, OyunOzeti } from '../../../lib/api';

const OLAY_ISIMLERI: Record<string, string> = {
  OYUN_BASLADI: 'Oyun Basladi',
  TUR_BASLADI: 'Tur Basladi',
  OLAY_ACILDI: 'Olay Acildi',
  ONERI_YAPILDI: 'Oneri Yapildi',
  OY_KULLANILDI: 'Oy Kullanildi',
  OYLAMA_TAMAMLANDI: 'Oylama Tamamlandi',
  TUR_BITTI: 'Tur Bitti',
  KAYNAK_DEGISTI: 'Kaynaklar Degisti',
  OYUN_BITTI: 'Oyun Bitti',
  OYUNCU_KATILDI: 'Oyuncu Katildi',
  OYUNCU_AYRILDI: 'Oyuncu Ayrildi',
};

const OLAY_IKONLARI: Record<string, string> = {
  OYUN_BASLADI: '🎮',
  TUR_BASLADI: '🔄',
  OLAY_ACILDI: '📢',
  ONERI_YAPILDI: '💡',
  OY_KULLANILDI: '🗳️',
  OYLAMA_TAMAMLANDI: '✅',
  TUR_BITTI: '🏁',
  KAYNAK_DEGISTI: '📊',
  OYUN_BITTI: '🏆',
  OYUNCU_KATILDI: '👋',
  OYUNCU_AYRILDI: '👋',
};

const SONUC_RENKLERI: Record<string, string> = {
  PARLADI: 'text-yellow-400',
  HAYATTA_KALDI: 'text-green-400',
  ZORLANDI: 'text-orange-400',
  COKTU: 'text-red-400',
};

const SONUC_ISIMLERI: Record<string, string> = {
  PARLADI: 'Parladi',
  HAYATTA_KALDI: 'Hayatta Kaldi',
  ZORLANDI: 'Zorlandi',
  COKTU: 'Coktu',
};

export default function TekrarSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tekrar, setTekrar] = useState<OyunTekrari | null>(null);
  const [ozet, setOzet] = useState<OyunOzeti | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliTur, setSeciliTur] = useState<number | null>(null);
  const [oynatiliyor, setOynatiliyor] = useState(false);
  const [oynatmaIndeksi, setOynatmaIndeksi] = useState(0);

  useEffect(() => {
    yukle();
  }, [id]);

  const yukle = async () => {
    setYukleniyor(true);
    const [tekrarRes, ozetRes] = await Promise.all([
      api.tekrar.getir(id),
      api.tekrar.ozet(id),
    ]);

    if (tekrarRes.data?.tekrar) {
      setTekrar(tekrarRes.data.tekrar);
    }
    if (ozetRes.data) {
      setOzet(ozetRes.data);
    }
    setYukleniyor(false);
  };

  // Oynatma
  useEffect(() => {
    if (!oynatiliyor || !tekrar) return;

    const interval = setInterval(() => {
      setOynatmaIndeksi((prev) => {
        if (prev >= tekrar.olaylar.length - 1) {
          setOynatiliyor(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [oynatiliyor, tekrar]);

  const filtrelenmisOlaylar = seciliTur !== null
    ? tekrar?.olaylar.filter((o) => o.turNumarasi === seciliTur)
    : tekrar?.olaylar;

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!tekrar) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Oyun bulunamadi</h2>
          <Link href="/liderlik" className="text-primary-400 hover:text-primary-300">
            Liderlik tablosuna don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/liderlik" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{tekrar.toplulukIsmi}</h1>
              <p className="text-sm text-gray-400">Oyun Tekrari</p>
            </div>
          </div>
          {tekrar.sonuc && (
            <div className={`text-lg font-bold ${SONUC_RENKLERI[tekrar.sonuc] || 'text-gray-400'}`}>
              {SONUC_ISIMLERI[tekrar.sonuc] || tekrar.sonuc}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol - Ozet */}
          <div className="space-y-6">
            {/* Oyun Bilgileri */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Oyun Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Baslangic</span>
                  <span className="text-white">{new Date(tekrar.baslangic).toLocaleString('tr-TR')}</span>
                </div>
                {tekrar.bitis && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bitis</span>
                    <span className="text-white">{new Date(tekrar.bitis).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Tur Sayisi</span>
                  <span className="text-white">{tekrar.turSayisi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Oyuncu Sayisi</span>
                  <span className="text-white">{tekrar.oyuncular.length}</span>
                </div>
              </div>
            </div>

            {/* Oyuncular */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Oyuncular</h3>
              <div className="space-y-2">
                {tekrar.oyuncular.map((oyuncu) => (
                  <div key={oyuncu.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 font-medium">
                      {oyuncu.kullaniciAdi?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-white">{oyuncu.kullaniciAdi}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Istatistikler */}
            {ozet && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Istatistikler</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-400">{ozet.toplamOneri}</div>
                    <div className="text-xs text-gray-400">Oneri</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{ozet.toplamOy}</div>
                    <div className="text-xs text-gray-400">Oy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{ozet.toplamMesaj}</div>
                    <div className="text-xs text-gray-400">Mesaj</div>
                  </div>
                  {ozet.enAktifOyuncu && (
                    <div>
                      <div className="text-sm font-bold text-yellow-400">{ozet.enAktifOyuncu.kullaniciAdi}</div>
                      <div className="text-xs text-gray-400">En Aktif</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sag - Olay Akisi */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6">
              {/* Kontroller */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Olay Akisi</h3>
                <div className="flex items-center gap-4">
                  {/* Tur Filtresi */}
                  <select
                    value={seciliTur ?? ''}
                    onChange={(e) => setSeciliTur(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Tum Turlar</option>
                    {Array.from({ length: tekrar.turSayisi }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Tur {i + 1}</option>
                    ))}
                  </select>

                  {/* Oynat/Durdur */}
                  <button
                    onClick={() => {
                      if (!oynatiliyor) {
                        setOynatmaIndeksi(0);
                      }
                      setOynatiliyor(!oynatiliyor);
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {oynatiliyor ? 'Durdur' : 'Oynat'}
                  </button>
                </div>
              </div>

              {/* Olay Listesi */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {(filtrelenmisOlaylar || []).map((olay, index) => (
                  <div
                    key={olay.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                      oynatiliyor && index === oynatmaIndeksi
                        ? 'bg-primary-500/20 border border-primary-500'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="text-2xl">{OLAY_IKONLARI[olay.tip] || '📌'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {OLAY_ISIMLERI[olay.tip] || olay.tip}
                        </span>
                        {olay.turNumarasi && (
                          <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                            Tur {olay.turNumarasi}
                          </span>
                        )}
                      </div>
                      {olay.veri && Object.keys(olay.veri).length > 0 && (
                        <div className="text-sm text-gray-400">
                          {'baslik' in olay.veri && <span>{String(olay.veri.baslik)}</span>}
                          {'oyuncu' in olay.veri && <span>{String(olay.veri.oyuncu)}</span>}
                          {'secim' in olay.veri && <span> - {String(olay.veri.secim)}</span>}
                        </div>
                      )}
                      {olay.kaynaklar && (
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-yellow-400">Hazine: {olay.kaynaklar.hazine}</span>
                          <span className="text-green-400">Refah: {olay.kaynaklar.refah}</span>
                          <span className="text-blue-400">Istikrar: {olay.kaynaklar.istikrar}</span>
                          <span className="text-purple-400">Altyapi: {olay.kaynaklar.altyapi}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(olay.zaman).toLocaleTimeString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}

                {(!filtrelenmisOlaylar || filtrelenmisOlaylar.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    Bu oyun icin kayitli olay bulunamadi
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
