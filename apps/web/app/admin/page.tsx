'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';
import { api, AdminIstatistikler, AdminKullanici, ModeasyonLog, ToplulukListesi } from '../../lib/api';

type Tab = 'genel' | 'kullanicilar' | 'topluluklar' | 'aktif-oyunlar' | 'loglar';

interface AktifOyun {
  id: string;
  isim: string;
  durum: string;
  oyunModu: string;
  olusturuldu: string;
  basladiAt: string | null;
  oyuncuSayisi: number;
  maxOyuncu: number;
  oyuncular: Array<{
    id: string;
    kullaniciAdi: string;
    rol: string;
    botMu: boolean;
  }>;
  oyunDurumu: {
    asama: string;
    mevcutTur: number;
    toplamTur: number;
    kaynaklar: {
      hazine: number;
      refah: number;
      istikrar: number;
      altyapi: number;
    };
  } | null;
}

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
  const [aktifOyunlar, setAktifOyunlar] = useState<AktifOyun[]>([]);
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

  const aktifOyunlariYukle = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/istatistikler/aktif-oyunlar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAktifOyunlar(data);
      }
    } catch (error) {
      console.error('Aktif oyunlar yüklenemedi:', error);
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
    if (yetkili && aktifTab === 'aktif-oyunlar') {
      aktifOyunlariYukle();
      // Her 10 saniyede bir yenile
      const interval = setInterval(aktifOyunlariYukle, 10000);
      return () => clearInterval(interval);
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
          <div className="flex gap-1 overflow-x-auto">
            {(['genel', 'kullanicilar', 'topluluklar', 'aktif-oyunlar', 'loglar'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setAktifTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  aktifTab === tab
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'genel' && 'Genel Bakış'}
                {tab === 'kullanicilar' && 'Kullanıcılar'}
                {tab === 'topluluklar' && 'Topluluklar'}
                {tab === 'aktif-oyunlar' && (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Aktif Oyunlar
                  </span>
                )}
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

        {/* Aktif Oyunlar Dashboard */}
        {aktifTab === 'aktif-oyunlar' && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400">🎮</span>
                  </div>
                  <span className="text-sm text-gray-400">Aktif Oyun</span>
                </div>
                <p className="text-3xl font-bold text-white">{aktifOyunlar.length}</p>
              </div>
              <div className="bg-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400">👥</span>
                  </div>
                  <span className="text-sm text-gray-400">Aktif Oyuncu</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {aktifOyunlar.reduce((sum, o) => sum + o.oyuncuSayisi, 0)}
                </p>
              </div>
              <div className="bg-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400">⏳</span>
                  </div>
                  <span className="text-sm text-gray-400">Lobide Bekleyen</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {aktifOyunlar.filter((o) => ['BEKLEME', 'HAZIR', 'LOBI'].includes(o.durum)).length}
                </p>
              </div>
            </div>

            {/* Oyun Listesi */}
            {aktifOyunlar.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎮</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Aktif Oyun Yok</h3>
                <p className="text-gray-400">Şu anda devam eden oyun bulunmuyor</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {aktifOyunlar.map((oyun) => (
                  <AktifOyunKarti key={oyun.id} oyun={oyun} />
                ))}
              </div>
            )}
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

function AktifOyunKarti({ oyun }: { oyun: AktifOyun }) {
  const router = useRouter();

  const durumRenkleri: Record<string, string> = {
    BEKLEME: 'bg-yellow-500',
    HAZIR: 'bg-green-500',
    GERI_SAYIM: 'bg-primary-500 animate-pulse',
    BOT_DOLDURMA: 'bg-blue-500',
    LOBI: 'bg-yellow-500',
    DEVAM_EDIYOR: 'bg-green-500',
  };

  const durumMetinleri: Record<string, string> = {
    BEKLEME: 'Oyuncu Bekliyor',
    HAZIR: 'Başlamaya Hazır',
    GERI_SAYIM: 'Başlıyor...',
    BOT_DOLDURMA: 'Bot Ekleniyor',
    LOBI: 'Lobide',
    DEVAM_EDIYOR: 'Devam Ediyor',
  };

  const asamaMetinleri: Record<string, string> = {
    LOBI: 'Lobi',
    TUR_BASI: 'Tur Başı',
    OLAY_GOSTERILDI: 'Olay Gösterildi',
    ONERI_ACIK: 'Öneri Aşaması',
    OYLAMA_ACIK: 'Oylama',
    HESAPLAMA: 'Hesaplanıyor',
    SONUCLAR: 'Sonuçlar',
    TUR_KAPANDI: 'Tur Kapandı',
    OYUN_SONU: 'Oyun Bitti',
  };

  return (
    <div
      onClick={() => router.push(`/oyun/${oyun.id}`)}
      className="bg-gray-800 rounded-2xl p-5 cursor-pointer hover:bg-gray-750 hover:ring-2 hover:ring-primary-500/50 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{oyun.isim}</h3>
          <p className="text-xs text-gray-500">{oyun.oyunModu}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${durumRenkleri[oyun.durum] || 'bg-gray-500'}`}>
          {durumMetinleri[oyun.durum] || oyun.durum}
        </span>
      </div>

      {/* Oyun Durumu (oyun başlamışsa) */}
      {oyun.oyunDurumu && oyun.durum === 'DEVAM_EDIYOR' && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Tur {oyun.oyunDurumu.mevcutTur}/{oyun.oyunDurumu.toplamTur}
            </span>
            <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
              {asamaMetinleri[oyun.oyunDurumu.asama] || oyun.oyunDurumu.asama}
            </span>
          </div>
          {/* Kaynaklar */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Hazine</p>
              <p className="text-sm font-medium text-yellow-400">{oyun.oyunDurumu.kaynaklar.hazine}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Refah</p>
              <p className="text-sm font-medium text-green-400">{oyun.oyunDurumu.kaynaklar.refah}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">İstikrar</p>
              <p className="text-sm font-medium text-blue-400">{oyun.oyunDurumu.kaynaklar.istikrar}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Altyapı</p>
              <p className="text-sm font-medium text-purple-400">{oyun.oyunDurumu.kaynaklar.altyapi}</p>
            </div>
          </div>
        </div>
      )}

      {/* Oyuncular */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Oyuncular ({oyun.oyuncuSayisi}/{oyun.maxOyuncu})</p>
        <div className="flex flex-wrap gap-1">
          {oyun.oyuncular.map((o) => (
            <span
              key={o.id}
              className={`px-2 py-1 text-xs rounded ${
                o.botMu
                  ? 'bg-blue-500/20 text-blue-400'
                  : o.rol === 'KURUCU'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-700 text-gray-300'
              }`}
            >
              {o.botMu ? '🤖 ' : o.rol === 'KURUCU' ? '👑 ' : ''}
              {o.kullaniciAdi}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {oyun.basladiAt
            ? `Başladı: ${new Date(oyun.basladiAt).toLocaleTimeString('tr-TR')}`
            : `Oluşturuldu: ${new Date(oyun.olusturuldu).toLocaleTimeString('tr-TR')}`}
        </span>
        <span className="text-primary-400">Detay →</span>
      </div>
    </div>
  );
}
