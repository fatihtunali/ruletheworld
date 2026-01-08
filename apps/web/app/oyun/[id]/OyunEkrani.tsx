'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../lib/store';
import { useOyunStore, Olay, OlaySecenegi, Oneri } from '../../../lib/socket';
import { SoundEffects } from '../../../lib/sounds';
import SesAyarlari from '../../../components/SesAyarlari';

export default function OyunEkrani() {
  const { oyuncu } = useAuthStore();
  const {
    toplulukIsmi,
    mevcutTur,
    toplamTur,
    kaynaklar,
    oyuncular,
    mevcutOlay,
    oneriler,
    mesajlar,
    asama,
    asamaBitisZamani,
    oneriGonder,
    oyVer,
    mesajGonder,
  } = useOyunStore();

  const [secilenSecenek, setSecilenSecenek] = useState<string | null>(null);
  const [oneriAciklama, setOneriAciklama] = useState('');
  const [mesajInput, setMesajInput] = useState('');
  const [kalanSure, setKalanSure] = useState<number>(0);
  const mesajlarRef = useRef<HTMLDivElement>(null);

  // Süre sayacı
  useEffect(() => {
    if (!asamaBitisZamani) return;

    const interval = setInterval(() => {
      const kalan = Math.max(0, Math.floor((asamaBitisZamani - Date.now()) / 1000));
      setKalanSure(kalan);
    }, 1000);

    return () => clearInterval(interval);
  }, [asamaBitisZamani]);

  // Mesajları aşağı kaydır
  useEffect(() => {
    if (mesajlarRef.current) {
      mesajlarRef.current.scrollTop = mesajlarRef.current.scrollHeight;
    }
  }, [mesajlar]);

  // Yeni mesaj sesi
  const prevMesajSayisi = useRef(mesajlar.length);
  useEffect(() => {
    if (mesajlar.length > prevMesajSayisi.current) {
      const sonMesaj = mesajlar[mesajlar.length - 1];
      if (sonMesaj && sonMesaj.oyuncuId !== oyuncu?.id) {
        SoundEffects.message();
      }
    }
    prevMesajSayisi.current = mesajlar.length;
  }, [mesajlar, oyuncu?.id]);

  // Aşama değişikliği sesi
  const prevAsama = useRef(asama);
  useEffect(() => {
    if (asama !== prevAsama.current) {
      if (asama === 'TUR_BASI' || asama === 'OLAY_GOSTERILDI') {
        SoundEffects.turnStart();
      } else if (asama === 'OYLAMA' || asama === 'OYLAMA_ACIK') {
        SoundEffects.voteStart();
      } else if (asama === 'TUR_SONU' || asama === 'SONUCLAR' || asama === 'TUR_KAPANDI') {
        SoundEffects.success();
      }
      prevAsama.current = asama;
    }
  }, [asama]);

  const handleOneriGonder = () => {
    if (!secilenSecenek) return;
    oneriGonder(secilenSecenek, oneriAciklama);
    setSecilenSecenek(null);
    setOneriAciklama('');
  };

  const handleMesajGonder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesajInput.trim()) return;
    mesajGonder(mesajInput);
    setMesajInput('');
  };

  const formatSure = (saniye: number) => {
    const dk = Math.floor(saniye / 60);
    const sn = saniye % 60;
    return `${dk}:${sn.toString().padStart(2, '0')}`;
  };

  const asamaMetinleri: Record<string, string> = {
    // New states from state machine
    OLAY_GOSTERILDI: 'Olay İnceleniyor',
    ONERI_ACIK: 'Öneri Zamanı',
    OYLAMA_ACIK: 'Oylama Zamanı',
    HESAPLAMA: 'Sonuç Hesaplanıyor',
    SONUCLAR: 'Sonuçlar',
    TUR_KAPANDI: 'Tur Tamamlandı',
    // Backward compatibility
    TUR_BASI: 'Tur Başlıyor',
    OLAY_ACILISI: 'Olay İnceleniyor',
    TARTISMA: 'Tartışma',
    OYLAMA: 'Oylama',
    TUR_SONU: 'Tur Sonucu',
    OYUN_SONU: 'Oyun Bitti',
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">{toplulukIsmi}</h1>
              <p className="text-sm text-gray-400">
                Tur {mevcutTur}/{toplamTur} • {asamaMetinleri[asama] || asama}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Ses Ayarları */}
              <SesAyarlari />
              {/* Süre */}
              <div className={`px-3 sm:px-4 py-2 rounded-lg ${kalanSure <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
                <span className="font-mono text-base sm:text-lg">{formatSure(kalanSure)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Kaynaklar */}
      <div className="bg-gray-800/50 border-b border-gray-700 overflow-x-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3 sm:gap-6 min-w-max sm:min-w-0">
            <KaynakGostergesi
              isim="Hazine"
              deger={kaynaklar.hazine}
              max={2000}
              renk="yellow"
              ikon="💰"
            />
            <KaynakGostergesi
              isim="Refah"
              deger={kaynaklar.refah}
              max={100}
              renk="green"
              ikon="😊"
            />
            <KaynakGostergesi
              isim="Istikrar"
              deger={kaynaklar.istikrar}
              max={100}
              renk="blue"
              ikon="⚖️"
            />
            <KaynakGostergesi
              isim="Altyapi"
              deger={kaynaklar.altyapi}
              max={100}
              renk="purple"
              ikon="🏗️"
            />
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Sol Panel - Olay ve Seçenekler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Olay Kartı */}
            {mevcutOlay && (
              <OlayKarti olay={mevcutOlay} />
            )}

            {/* Seçenekler veya Öneriler */}
            {(asama === 'TARTISMA' || asama === 'ONERI_ACIK') && mevcutOlay && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Öneri Yap</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {mevcutOlay.secenekler.map((secenek) => (
                    <SecenekKarti
                      key={secenek.id}
                      secenek={secenek}
                      secili={secilenSecenek === secenek.id}
                      onClick={() => setSecilenSecenek(secenek.id)}
                    />
                  ))}
                </div>
                {secilenSecenek && (
                  <div className="space-y-4">
                    <textarea
                      value={oneriAciklama}
                      onChange={(e) => setOneriAciklama(e.target.value)}
                      placeholder="Önerinizi açıklayın (opsiyonel)..."
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleOneriGonder}
                      className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
                    >
                      Öneriyi Gönder
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Oylama */}
            {(asama === 'OYLAMA' || asama === 'OYLAMA_ACIK') && oneriler.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Önerileri Oyla</h3>
                <div className="space-y-4">
                  {oneriler.map((oneri) => (
                    <OneriKarti
                      key={oneri.id}
                      oneri={oneri}
                      oyuncuId={oyuncu?.id || ''}
                      onOyVer={(secim) => oyVer(oneri.id, secim)}
                      oyuncular={oyuncular}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hesaplama */}
            {asama === 'HESAPLAMA' && (
              <div className="bg-gray-800 rounded-2xl p-6 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Hesaplanıyor</h3>
                <p className="text-gray-400">Oylar değerlendiriliyor...</p>
              </div>
            )}

            {/* Sonuçlar / Tur Sonu */}
            {(asama === 'TUR_SONU' || asama === 'SONUCLAR' || asama === 'TUR_KAPANDI') && (
              <div className="bg-gray-800 rounded-2xl p-6 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Tur Tamamlandı</h3>
                <p className="text-gray-400">Sonraki tur hazırlanıyor...</p>
              </div>
            )}
          </div>

          {/* Sağ Panel - Sohbet */}
          <div className="bg-gray-800 rounded-2xl flex flex-col h-[500px] lg:h-auto">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold text-white">Tartışma</h3>
              <p className="text-xs text-gray-400">{oyuncular.length} oyuncu aktif</p>
            </div>

            {/* Mesajlar */}
            <div
              ref={mesajlarRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {mesajlar.length === 0 ? (
                <p className="text-center text-gray-500 text-sm">
                  Henüz mesaj yok. Tartışmayı başlat!
                </p>
              ) : (
                mesajlar.map((mesaj) => (
                  <div key={mesaj.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-300 flex-shrink-0">
                      {mesaj.oyuncuAdi?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white text-sm">{mesaj.oyuncuAdi}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(mesaj.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm break-words">{mesaj.icerik}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mesaj Gönder */}
            <form onSubmit={handleMesajGonder} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mesajInput}
                  onChange={(e) => setMesajInput(e.target.value)}
                  placeholder="Mesaj yaz..."
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!mesajInput.trim()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alt bileşenler
function KaynakGostergesi({
  isim,
  deger,
  max,
  renk,
  ikon,
}: {
  isim: string;
  deger: number;
  max: number;
  renk: string;
  ikon: string;
}) {
  const yuzde = (deger / max) * 100;
  const renkSinifi = {
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  }[renk];

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{ikon}</span>
      <div className="min-w-[100px]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">{isim}</span>
          <span className="text-white font-medium">{deger}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${renkSinifi} transition-all duration-300`}
            style={{ width: `${Math.min(100, yuzde)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function OlayKarti({ olay }: { olay: Olay }) {
  const tipRenkleri = {
    KRIZ: 'bg-red-500/20 text-red-400 border-red-500/50',
    FIRSAT: 'bg-green-500/20 text-green-400 border-green-500/50',
    KARAR: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    RASTGELE: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  };

  const tipIkonlari = {
    KRIZ: '🔥',
    FIRSAT: '🌟',
    KARAR: '📋',
    RASTGELE: '🎲',
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-2 sm:gap-4">
        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${tipRenkleri[olay.tip]}`}>
          <span className="mr-1">{tipIkonlari[olay.tip]}</span>
          {olay.tip}
        </div>
        <span className="text-xs sm:text-sm text-gray-500">{olay.kategori}</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mt-3 sm:mt-4">{olay.baslik}</h2>
      <p className="text-gray-300 mt-2 leading-relaxed text-sm sm:text-base">{olay.aciklama}</p>
    </div>
  );
}

function SecenekKarti({
  secenek,
  secili,
  onClick,
}: {
  secenek: OlaySecenegi;
  secili: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
        secili
          ? 'bg-primary-500/20 border-primary-500'
          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
      }`}
    >
      <h4 className="font-medium text-white text-sm sm:text-base">{secenek.baslik}</h4>
      <p className="text-xs sm:text-sm text-gray-400 mt-1">{secenek.aciklama}</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
        {Object.entries(secenek.etkiler).map(([key, value]) => {
          if (value === 0) return null;
          const isPositive = value > 0;
          return (
            <span
              key={key}
              className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {key}: {isPositive ? '+' : ''}{value}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function OneriKarti({
  oneri,
  oyuncuId,
  onOyVer,
  oyuncular,
}: {
  oneri: Oneri;
  oyuncuId: string;
  onOyVer: (secim: 'EVET' | 'HAYIR' | 'CEKIMSER') => void;
  oyuncular: { id: string; kullaniciAdi: string }[];
}) {
  const benimOyum = oneri.oylar.find((o) => o.oyuncuId === oyuncuId);
  const evetSayisi = oneri.oylar.filter((o) => o.secim === 'EVET').length;
  const hayirSayisi = oneri.oylar.filter((o) => o.secim === 'HAYIR').length;
  const cekimserSayisi = oneri.oylar.filter((o) => o.secim === 'CEKIMSER').length;

  return (
    <div className="bg-gray-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-white">{oneri.baslik}</h4>
          <p className="text-sm text-gray-400">
            Öneren: {oneri.onericiAdi}
          </p>
        </div>
      </div>
      {oneri.aciklama && (
        <p className="text-sm text-gray-300 mb-4">{oneri.aciklama}</p>
      )}

      {/* Oy Durumu */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-green-400">✓ {evetSayisi}</span>
        <span className="text-sm text-red-400">✗ {hayirSayisi}</span>
        <span className="text-sm text-gray-400">○ {cekimserSayisi}</span>
      </div>

      {/* Oy Butonları */}
      {!benimOyum ? (
        <div className="flex gap-2">
          <button
            onClick={() => onOyVer('EVET')}
            className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
          >
            Evet
          </button>
          <button
            onClick={() => onOyVer('HAYIR')}
            className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Hayır
          </button>
          <button
            onClick={() => onOyVer('CEKIMSER')}
            className="flex-1 py-2 bg-gray-600/50 hover:bg-gray-600/70 text-gray-400 rounded-lg transition-colors"
          >
            Çekimser
          </button>
        </div>
      ) : (
        <p className="text-sm text-center text-gray-500">
          Oyunuz: <span className={
            benimOyum.secim === 'EVET' ? 'text-green-400' :
            benimOyum.secim === 'HAYIR' ? 'text-red-400' : 'text-gray-400'
          }>
            {benimOyum.secim === 'EVET' ? 'Evet' : benimOyum.secim === 'HAYIR' ? 'Hayır' : 'Çekimser'}
          </span>
        </p>
      )}
    </div>
  );
}
