'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';
import { api, AdminIstatistikler, AdminKullanici, ModeasyonLog, ToplulukListesi } from '../../lib/api';

type Tab = 'genel' | 'kullanicilar' | 'topluluklar' | 'loglar';

export default function AdminPaneli() {
  const router = useRouter();
  const { token, oyuncu, _hasHydrated } = useAuthStore();
  const [aktifTab, setAktifTab] = useState<Tab>('genel');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [yetkili, setYetkili] = useState(false);

  // Veri state'leri
  const [istatistikler, setIstatistikler] = useState<AdminIstatistikler | null>(null);
  const [kullanicilar, setKullanicilar] = useState<AdminKullanici[]>([]);
  const [topluluklar, setTopluluklar] = useState<ToplulukListesi['topluluklar']>([]);
  const [loglar, setLoglar] = useState<ModeasyonLog[]>([]);
  const [arama, setArama] = useState('');

  useEffect(() => {
    // Hydration tamamlanmadan kontrol yapma
    if (!_hasHydrated) return;

    if (!token) {
      router.push('/giris');
      return;
    }

    kontrolEt();
  }, [token, router, _hasHydrated]);

  const kontrolEt = async () => {
    setYukleniyor(true);
    const res = await api.admin.istatistikler();
    if (res.error) {
      if (res.error.includes('yetki')) {
        setYetkili(false);
        setHata('Bu sayfaya erişim yetkiniz yok');
      } else {
        setHata(res.error);
      }
    } else {
      setYetkili(true);
      setIstatistikler(res.data || null);
    }
    setYukleniyor(false);
  };

  const kullanicilariYukle = async () => {
    const res = await api.admin.kullanicilar({ arama });
    if (res.data) {
      setKullanicilar(res.data.kullanicilar);
    }
  };

  const loglariYukle = async () => {
    const res = await api.admin.loglar();
    if (res.data) {
      setLoglar(res.data.loglar);
    }
  };

  const topluklariYukle = async () => {
    const res = await api.admin.topluluklar();
    if (res.data) {
      setTopluluklar(res.data.topluluklar);
    }
  };

  const toplulukSil = async (id: string, sebep: string) => {
    const res = await api.admin.toplulukSil(id, { sebep });
    if (res.error) {
      alert(res.error);
    } else {
      topluklariYukle();
    }
  };

  useEffect(() => {
    if (yetkili && aktifTab === 'kullanicilar') {
      kullanicilariYukle();
    }
    if (yetkili && aktifTab === 'topluluklar') {
      topluklariYukle();
    }
    if (yetkili && aktifTab === 'loglar') {
      loglariYukle();
    }
  }, [aktifTab, yetkili]);

  const ilkAdminOlustur = async () => {
    const res = await api.admin.ilkAdmin();
    if (res.error) {
      alert(res.error);
    } else {
      alert('Admin yetkisi verildi! Sayfayı yenileyin.');
      window.location.reload();
    }
  };

  if (!_hasHydrated || yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!yetkili) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-400 mb-6">{hata || 'Bu sayfaya erişim yetkiniz yok'}</p>

          <div className="space-y-3">
            <button
              onClick={ilkAdminOlustur}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-xl transition-colors"
            >
              İlk Admin Ol (Sistemde admin yoksa)
            </button>
            <Link
              href="/lobi"
              className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              Lobiye Dön
            </Link>
          </div>
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
            <Link href="/lobi" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
          </div>
          <span className="text-sm text-gray-400">
            {oyuncu?.kullaniciAdi}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {(['genel', 'kullanicilar', 'topluluklar', 'loglar'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setAktifTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  aktifTab === tab
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'genel' && 'Genel Bakış'}
                {tab === 'kullanicilar' && 'Kullanıcılar'}
                {tab === 'topluluklar' && 'Topluluklar'}
                {tab === 'loglar' && 'Loglar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Genel Bakış */}
        {aktifTab === 'genel' && istatistikler && (
          <div className="space-y-6">
            {/* Kartlar */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatKart
                baslik="Toplam Kullanıcı"
                deger={istatistikler.kullanicilar.toplam}
                altMetin={`${istatistikler.kullanicilar.bugunKayit} bugün`}
                ikon="👥"
                renk="blue"
              />
              <StatKart
                baslik="Aktif Kullanıcı"
                deger={istatistikler.kullanicilar.aktif}
                altMetin={`${istatistikler.kullanicilar.banli} banlı`}
                ikon="✓"
                renk="green"
              />
              <StatKart
                baslik="Toplam Topluluk"
                deger={istatistikler.topluluklar.toplam}
                altMetin={`${istatistikler.topluluklar.aktif} aktif`}
                ikon="🏘️"
                renk="purple"
              />
              <StatKart
                baslik="Tamamlanan Oyun"
                deger={istatistikler.topluluklar.tamamlanan}
                altMetin={`${istatistikler.topluluklar.bugunOyun} bugün`}
                ikon="🎮"
                renk="yellow"
              />
            </div>

            {/* Son 7 Gün Grafiği */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Son 7 Gün Kayıtlar</h3>
              <div className="flex items-end gap-2 h-32">
                {istatistikler.sonYediGunKayit.map((gun, i) => {
                  const maxSayi = Math.max(...istatistikler.sonYediGunKayit.map(g => g.sayi), 1);
                  const yuzde = (gun.sayi / maxSayi) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{gun.sayi}</span>
                      <div
                        className="w-full bg-primary-500 rounded-t"
                        style={{ height: `${Math.max(yuzde, 5)}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {new Date(gun.tarih).toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcılar */}
        {aktifTab === 'kullanicilar' && (
          <div className="space-y-4">
            {/* Arama */}
            <div className="flex gap-4">
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={kullanicilariYukle}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
              >
                Ara
              </button>
            </div>

            {/* Liste */}
            <div className="bg-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Kullanıcı</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Rol</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Durum</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Oyunlar</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {kullanicilar.map((k) => (
                    <KullaniciSatir key={k.id} kullanici={k} onYenile={kullanicilariYukle} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loglar */}
        {aktifTab === 'loglar' && (
          <div className="bg-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Yetkili</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Aksiyon</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Hedef</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loglar.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(log.olusturuldu).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{log.yetkili.kullaniciAdi}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.aksiyon.includes('BAN') ? 'bg-red-500/20 text-red-400' :
                        log.aksiyon.includes('UNBAN') ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {log.aksiyon}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {log.hedefTip}: {log.hedefId.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Topluluklar */}
        {aktifTab === 'topluluklar' && (
          <div className="bg-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Topluluk</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Durum</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Uyeler</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Mesajlar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Islemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {topluluklar.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Henuz topluluk yok
                    </td>
                  </tr>
                ) : (
                  topluluklar.map((t) => (
                    <ToplulukSatir key={t.id} topluluk={t} onSil={toplulukSil} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatKart({
  baslik,
  deger,
  altMetin,
  ikon,
  renk,
}: {
  baslik: string;
  deger: number;
  altMetin: string;
  ikon: string;
  renk: string;
}) {
  const renkler: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${renkler[renk]}`}>
          {ikon}
        </div>
        <span className="text-sm text-gray-400">{baslik}</span>
      </div>
      <p className="text-3xl font-bold text-white">{deger.toLocaleString('tr-TR')}</p>
      <p className="text-sm text-gray-500 mt-1">{altMetin}</p>
    </div>
  );
}

function KullaniciSatir({
  kullanici,
  onYenile,
}: {
  kullanici: AdminKullanici;
  onYenile: () => void;
}) {
  const [islem, setIslem] = useState(false);

  const banla = async () => {
    const sebep = prompt('Ban sebebi:');
    if (!sebep) return;

    setIslem(true);
    const res = await api.admin.banla(kullanici.id, { sebep });
    if (res.error) {
      alert(res.error);
    } else {
      onYenile();
    }
    setIslem(false);
  };

  const banKaldir = async () => {
    setIslem(true);
    const res = await api.admin.banKaldir(kullanici.id);
    if (res.error) {
      alert(res.error);
    } else {
      onYenile();
    }
    setIslem(false);
  };

  const rolDegistir = async (yeniRol: string) => {
    setIslem(true);
    const res = await api.admin.rolDegistir(kullanici.id, { yeniRol });
    if (res.error) {
      alert(res.error);
    } else {
      onYenile();
    }
    setIslem(false);
  };

  const durumRenkleri: Record<string, string> = {
    AKTIF: 'bg-green-500/20 text-green-400',
    BANLANDI: 'bg-red-500/20 text-red-400',
    ASKIDA: 'bg-yellow-500/20 text-yellow-400',
  };

  const rolRenkleri: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-400',
    MODERATOR: 'bg-blue-500/20 text-blue-400',
    KULLANICI: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <tr className="hover:bg-gray-700/30">
      <td className="px-4 py-3">
        <div>
          <p className="text-white font-medium">{kullanici.kullaniciAdi}</p>
          <p className="text-xs text-gray-500">{kullanici.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={kullanici.sistemRolu}
          onChange={(e) => rolDegistir(e.target.value)}
          disabled={islem}
          className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${rolRenkleri[kullanici.sistemRolu] || 'bg-gray-500/20 text-gray-400'}`}
        >
          <option value="KULLANICI">KULLANICI</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded ${durumRenkleri[kullanici.hesapDurumu] || 'bg-gray-500/20 text-gray-400'}`}>
          {kullanici.hesapDurumu}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {kullanici.oynananOyunlar} / {kullanici.tamamlananOyunlar}
      </td>
      <td className="px-4 py-3">
        {kullanici.hesapDurumu === 'BANLANDI' ? (
          <button
            onClick={banKaldir}
            disabled={islem}
            className="text-xs px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
          >
            Ban Kaldır
          </button>
        ) : (
          <button
            onClick={banla}
            disabled={islem || kullanici.sistemRolu === 'ADMIN'}
            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors disabled:opacity-50"
          >
            Banla
          </button>
        )}
      </td>
    </tr>
  );
}

function ToplulukSatir({
  topluluk,
  onSil,
}: {
  topluluk: ToplulukListesi['topluluklar'][0];
  onSil: (id: string, sebep: string) => void;
}) {
  const [islem, setIslem] = useState(false);

  const handleSil = async () => {
    const sebep = prompt('Silme sebebi:');
    if (!sebep) return;

    setIslem(true);
    await onSil(topluluk.id, sebep);
    setIslem(false);
  };

  const durumRenkleri: Record<string, string> = {
    LOBI: 'bg-yellow-500/20 text-yellow-400',
    DEVAM_EDIYOR: 'bg-green-500/20 text-green-400',
    TAMAMLANDI: 'bg-blue-500/20 text-blue-400',
    TERK_EDILDI: 'bg-red-500/20 text-red-400',
  };

  return (
    <tr className="hover:bg-gray-700/30">
      <td className="px-4 py-3">
        <div>
          <p className="text-white font-medium">{topluluk.isim}</p>
          <p className="text-xs text-gray-500">Kod: {topluluk.kod || '-'}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded ${durumRenkleri[topluluk.durum] || 'bg-gray-500/20 text-gray-400'}`}>
          {topluluk.durum}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {topluluk._count?.uyeler || topluluk.oyuncuSayisi || 0}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {topluluk._count?.mesajlar || 0}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleSil}
          disabled={islem}
          className="text-xs px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors disabled:opacity-50"
        >
          Sil
        </button>
      </td>
    </tr>
  );
}
