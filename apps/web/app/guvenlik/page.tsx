'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, IkiFADurum, IkiFAKurulum } from '../../lib/api';
import Navbar from '../../components/Navbar';

type Adim = 'durum' | 'kurulum' | 'dogrulama' | 'yedek-kodlar';

export default function GuvenlikPage() {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [durum, setDurum] = useState<IkiFADurum | null>(null);
  const [kurulum, setKurulum] = useState<IkiFAKurulum | null>(null);
  const [yedekKodlar, setYedekKodlar] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [hata, setHata] = useState('');
  const [adim, setAdim] = useState<Adim>('durum');
  const [islem, setIslem] = useState(false);

  useEffect(() => {
    const tokenLocal = localStorage.getItem('token');
    if (!tokenLocal) {
      router.push('/giris');
      return;
    }

    durumYukle();
  }, [router]);

  const durumYukle = async () => {
    setYukleniyor(true);
    try {
      const res = await api.ikiFA.durum();
      if (res.data) {
        setDurum(res.data);
      }
    } catch (error) {
      console.error('2FA durum hatası:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const kurulumBaslat = async () => {
    setIslem(true);
    setHata('');
    try {
      const res = await api.ikiFA.kurulumBaslat();
      if (res.data) {
        setKurulum(res.data);
        setAdim('kurulum');
      } else if (res.error) {
        setHata(res.error);
      }
    } catch (error) {
      setHata('Kurulum başlatılamadı');
    } finally {
      setIslem(false);
    }
  };

  const kurulumTamamla = async () => {
    if (token.length !== 6) {
      setHata('Doğrulama kodu 6 haneli olmalıdır');
      return;
    }

    setIslem(true);
    setHata('');
    try {
      const res = await api.ikiFA.kurulumTamamla(token);
      if (res.data?.yedekKodlar) {
        setYedekKodlar(res.data.yedekKodlar);
        setAdim('yedek-kodlar');
        setDurum({ aktif: true, kalanYedekKod: res.data.yedekKodlar.length });
      } else if (res.error) {
        setHata(res.error);
      }
    } catch (error) {
      setHata('Kurulum tamamlanamadı');
    } finally {
      setIslem(false);
    }
  };

  const deaktifEt = async () => {
    if (token.length < 6) {
      setHata('Doğrulama kodu veya yedek kod girin');
      return;
    }

    setIslem(true);
    setHata('');
    try {
      const res = await api.ikiFA.deaktif(token);
      if (res.data?.basarili) {
        setDurum({ aktif: false, kalanYedekKod: 0 });
        setAdim('durum');
        setToken('');
        alert('2FA başarıyla kapatıldı');
      } else if (res.error) {
        setHata(res.error);
      }
    } catch (error) {
      setHata('2FA kapatılamadı');
    } finally {
      setIslem(false);
    }
  };

  const yedekKodlariYenile = async () => {
    if (token.length < 6) {
      setHata('Doğrulama kodu girin');
      return;
    }

    setIslem(true);
    setHata('');
    try {
      const res = await api.ikiFA.yedekKodlariYenile(token);
      if (res.data?.yedekKodlar) {
        setYedekKodlar(res.data.yedekKodlar);
        setAdim('yedek-kodlar');
        setDurum((prev) => prev ? { ...prev, kalanYedekKod: res.data!.yedekKodlar.length } : null);
        setToken('');
      } else if (res.error) {
        setHata(res.error);
      }
    } catch (error) {
      setHata('Yedek kodlar yenilenemedi');
    } finally {
      setIslem(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Güvenlik Ayarları</h1>
        <p className="text-gray-400 mb-8">Hesabını iki faktörlü doğrulama ile koru</p>

        {/* Ana Durum Kartı */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                durum?.aktif ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {durum?.aktif ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">İki Faktörlü Doğrulama</h2>
                <p className={durum?.aktif ? 'text-green-400' : 'text-gray-400'}>
                  {durum?.aktif ? 'Aktif' : 'Kapalı'}
                </p>
              </div>
            </div>

            {!durum?.aktif && adim === 'durum' && (
              <button
                onClick={kurulumBaslat}
                disabled={islem}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {islem ? 'Başlatılıyor...' : 'Aktifleştir'}
              </button>
            )}
          </div>

          {durum?.aktif && (
            <div className="text-sm text-gray-400">
              Kalan yedek kod: <span className="text-white font-medium">{durum.kalanYedekKod}</span>
            </div>
          )}
        </div>

        {/* Hata mesajı */}
        {hata && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {hata}
          </div>
        )}

        {/* Kurulum Adımı */}
        {adim === 'kurulum' && kurulum && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">1. QR Kodu Tara</h3>
            <p className="text-gray-400 mb-4">
              Google Authenticator, Authy veya benzeri bir uygulama ile QR kodu tarayın.
            </p>

            <div className="flex justify-center mb-4">
              <img
                src={kurulum.qrCodeUrl}
                alt="2FA QR Code"
                className="rounded-lg"
                width={200}
                height={200}
              />
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-sm mb-2">Manuel giriş için secret key:</p>
              <code className="text-green-400 font-mono text-sm break-all">{kurulum.secret}</code>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">2. Doğrulama Kodu</h3>
            <p className="text-gray-400 mb-4">
              Uygulamadaki 6 haneli kodu girin:
            </p>

            <div className="flex gap-4">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 bg-gray-700 text-white text-center text-2xl font-mono tracking-widest rounded-lg px-4 py-3 border border-gray-600 focus:border-green-500 focus:outline-none"
                maxLength={6}
              />
              <button
                onClick={kurulumTamamla}
                disabled={islem || token.length !== 6}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {islem ? 'Doğrulanıyor...' : 'Doğrula'}
              </button>
            </div>

            <button
              onClick={() => {
                setAdim('durum');
                setKurulum(null);
                setToken('');
                setHata('');
              }}
              className="mt-4 text-gray-400 hover:text-white transition-colors"
            >
              İptal
            </button>
          </div>
        )}

        {/* Yedek Kodlar */}
        {adim === 'yedek-kodlar' && yedekKodlar.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Yedek Kodlarınız</h3>
            <p className="text-gray-400 mb-4">
              Bu kodları güvenli bir yere kaydedin. Her kod sadece bir kez kullanılabilir.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {yedekKodlar.map((kod, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg px-4 py-2 font-mono text-center text-white"
                >
                  {kod}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const text = yedekKodlar.join('\n');
                navigator.clipboard.writeText(text);
                alert('Yedek kodlar panoya kopyalandı!');
              }}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mb-4"
            >
              Kodları Kopyala
            </button>

            <button
              onClick={() => {
                setAdim('durum');
                setYedekKodlar([]);
              }}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Tamam
            </button>
          </div>
        )}

        {/* Aktif ise yönetim seçenekleri */}
        {durum?.aktif && adim === 'durum' && (
          <div className="space-y-4">
            {/* Yedek Kodları Yenile */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Yedek Kodları Yenile</h3>
              <p className="text-gray-400 mb-4 text-sm">
                Tüm eski kodlar geçersiz olur, yeni 10 kod oluşturulur.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Doğrulama kodu"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={yedekKodlariYenile}
                  disabled={islem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Yenile
                </button>
              </div>
            </div>

            {/* 2FA Kapat */}
            <div className="bg-gray-800 rounded-xl p-6 border border-red-900">
              <h3 className="text-lg font-semibold text-red-400 mb-2">2FA Kapat</h3>
              <p className="text-gray-400 mb-4 text-sm">
                İki faktörlü doğrulamayı kapatmak hesabınızı daha az güvenli hale getirir.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Kod veya yedek kod"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={deaktifEt}
                  disabled={islem}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bilgi kutusu */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-xl p-4">
          <h4 className="text-blue-400 font-medium mb-2">2FA Nasıl Çalışır?</h4>
          <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
            <li>Giriş yaparken şifrenize ek olarak 6 haneli bir kod istenir</li>
            <li>Kod, telefonunuzdaki uygulamadan alınır (30 saniyede bir değişir)</li>
            <li>Yedek kodlar, telefonunuz kaybolursa kullanılır</li>
            <li>Google Authenticator, Authy gibi uygulamaları kullanabilirsiniz</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
