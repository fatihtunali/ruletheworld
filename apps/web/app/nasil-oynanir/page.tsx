'use client';

import { useState } from 'react';
import Link from 'next/link';

// Oyun akış adımları
const oyunAkisi = [
  {
    id: 1,
    baslik: 'Lobi Olustur veya Katil',
    aciklama: 'Yeni bir lobi olustur ya da arkadaslarinin lobisine kod ile katil. 4-8 oyuncu gerekli.',
    ikon: '🏠',
    renk: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    baslik: 'Oyun Baslar',
    aciklama: 'Yeterli oyuncu olunca lider oyunu baslatir. Topluluk 50 kaynak ile baslar.',
    ikon: '🎮',
    renk: 'from-green-500 to-green-600',
  },
  {
    id: 3,
    baslik: 'Olay Gelir',
    aciklama: 'Her turda toplulugu etkileyen rastgele bir olay ortaya cikar.',
    ikon: '⚡',
    renk: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 4,
    baslik: 'Oneri Yap',
    aciklama: 'Olaya karsi cozum oner. Seceneklerden birini sec ve aciklama yaz.',
    ikon: '💡',
    renk: 'from-orange-500 to-orange-600',
  },
  {
    id: 5,
    baslik: 'Oylama',
    aciklama: 'Tum oyuncular onerilere oy verir: Evet, Hayir veya Cekimser.',
    ikon: '🗳️',
    renk: 'from-purple-500 to-purple-600',
  },
  {
    id: 6,
    baslik: 'Sonuc',
    aciklama: 'Kazanan oneri uygulanir, kaynaklar guncellenir. Yeni tura gecilir.',
    ikon: '📊',
    renk: 'from-pink-500 to-pink-600',
  },
];

// Kaynaklar
const kaynaklar = [
  {
    isim: 'Hazine',
    ikon: '💰',
    aciklama: 'Toplulugun ekonomik gucu. Ticaret, vergiler ve harcamalarla degisir.',
    renk: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    ornekler: ['Vergi toplama +15', 'Festival duzenleme -10', 'Ticaret anlasması +20'],
  },
  {
    isim: 'Refah',
    ikon: '😊',
    aciklama: 'Halkin mutlulugu ve yasam kalitesi. Sosyal kararlardan etkilenir.',
    renk: 'bg-green-500/20 border-green-500/50 text-green-400',
    ornekler: ['Park yapimi +10', 'Calisma saatleri artisi -15', 'Festival +20'],
  },
  {
    isim: 'Istikrar',
    ikon: '🛡️',
    aciklama: 'Toplumsal duzen ve guvenlik. Catisma ve huzursuzluklardan etkilenir.',
    renk: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    ornekler: ['Guvenlik guclendirme +15', 'Protesto -20', 'Adalet reformu +10'],
  },
  {
    isim: 'Altyapi',
    ikon: '🏗️',
    aciklama: 'Fiziksel gelismislik. Insaat ve bakim kararlariyla degisir.',
    renk: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    ornekler: ['Yol yapimi +15', 'Deprem hasari -25', 'Okul insaati +10'],
  },
];

// Olay tipleri
const olayTipleri = [
  {
    tip: 'Kriz',
    ikon: '🚨',
    aciklama: 'Acil mudahale gerektiren olumsuz durumlar',
    renk: 'bg-red-500/20 border-red-500/50',
    ornekler: ['Salgin hastalik', 'Ekonomik cokus', 'Dogal afet'],
  },
  {
    tip: 'Firsat',
    ikon: '🌟',
    aciklama: 'Degerlendirilmesi gereken olumlu durumlar',
    renk: 'bg-green-500/20 border-green-500/50',
    ornekler: ['Yatirimci ilgisi', 'Kultur festivali', 'Teknoloji atilimi'],
  },
  {
    tip: 'Karar',
    ikon: '⚖️',
    aciklama: 'Toplulugu etkileyen rutin kararlar',
    renk: 'bg-blue-500/20 border-blue-500/50',
    ornekler: ['Butce dagilimi', 'Yeni yasa', 'Dis politika'],
  },
  {
    tip: 'Ozel',
    ikon: '✨',
    aciklama: 'Nadir gorulen ozel olaylar',
    renk: 'bg-purple-500/20 border-purple-500/50',
    ornekler: ['Ejderha saldirisi', 'Uzayli ziyareti', 'Zaman yolculugu'],
  },
];

// Puanlama sistemi
const puanlamaSistemi = [
  { aralik: '90-100', carpan: '3x', renk: 'text-green-400', aciklama: 'Mukemmel yonetim' },
  { aralik: '70-89', carpan: '2x', renk: 'text-blue-400', aciklama: 'Iyi yonetim' },
  { aralik: '50-69', carpan: '1.5x', renk: 'text-yellow-400', aciklama: 'Ortalama' },
  { aralik: '30-49', carpan: '1x', renk: 'text-orange-400', aciklama: 'Zayif' },
  { aralik: '1-29', carpan: '0.5x', renk: 'text-red-400', aciklama: 'Kritik' },
  { aralik: '0', carpan: '0x', renk: 'text-gray-400', aciklama: 'Cokus - Oyun biter!' },
];

// Strateji ipuclari
const stratejiler = [
  {
    baslik: 'Denge Kur',
    aciklama: 'Tek bir kaynaga odaklanma. 4 kaynagi dengede tutmak en iyi strateji.',
    ikon: '⚖️',
  },
  {
    baslik: 'Ikna Et',
    aciklama: 'Onerilerinde aciklama yaz. Diger oyunculari ikna etmen gerekiyor.',
    ikon: '🗣️',
  },
  {
    baslik: 'Isbirligi Yap',
    aciklama: 'Diger oyuncularla anlasarak ortak kararlar alin.',
    ikon: '🤝',
  },
  {
    baslik: 'Risk Yonet',
    aciklama: 'Kaynaklar 30un altina dustugunde dikkatli ol, cokus riski var.',
    ikon: '📉',
  },
  {
    baslik: 'Firsat Kolla',
    aciklama: 'Olumlu olaylarda cesur kararlar al, buyuk puanlar kazan.',
    ikon: '🎯',
  },
  {
    baslik: 'Zamani Kullan',
    aciklama: 'Oneri ve oylama surelerini iyi degerlendir, aceleci olma.',
    ikon: '⏱️',
  },
];

// SSS
const sss = [
  {
    soru: 'Minimum kac kisi ile oynanir?',
    cevap: 'En az 4 oyuncu gereklidir. Maksimum 8 oyuncu olabilir.',
  },
  {
    soru: 'Bir oyun ne kadar surer?',
    cevap: 'Normal modda 6 tur oynanir, yaklasik 15-20 dakika surer. Hizli mod 3 tur, Uzun mod 12 tur.',
  },
  {
    soru: 'Kaynak 0a duserse ne olur?',
    cevap: 'Herhangi bir kaynak 0a duserse topluluk coker ve oyun erken biter. Herkes daha az puan alir.',
  },
  {
    soru: 'Oylamada esitlik olursa?',
    cevap: 'Esitlikte en cok onerici puani olan oneri kazanir. Hala esitse rastgele secilir.',
  },
  {
    soru: 'Premium uyelik ne saglar?',
    cevap: 'Premium uyeler oncelikli eslestirme, ozel rozetler ve puan carpani bonusu alir.',
  },
  {
    soru: 'Arkadaslarimi nasil davet ederim?',
    cevap: 'Lobi kodunu paylas veya Referans sayfasindan ozel davet linkini gonder.',
  },
];

export default function NasilOynanirPage() {
  const [activeTab, setActiveTab] = useState<'akis' | 'kaynaklar' | 'olaylar' | 'puanlama' | 'strateji' | 'sss'>('akis');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <Link
            href="/lobi"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Oynamaya Basla
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-800 to-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Nasil Oynanir?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            RuleTheWorld, arkadaslarinla birlikte bir toplulugu yonettigin
            stratejik bir karar oyunu. Her kararin toplulugunu etkiler!
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="bg-gray-800/50 border-b border-gray-700 sticky top-[72px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 scrollbar-hide">
            {[
              { id: 'akis', label: 'Oyun Akisi', ikon: '🎮' },
              { id: 'kaynaklar', label: 'Kaynaklar', ikon: '📊' },
              { id: 'olaylar', label: 'Olaylar', ikon: '⚡' },
              { id: 'puanlama', label: 'Puanlama', ikon: '🏆' },
              { id: 'strateji', label: 'Strateji', ikon: '🧠' },
              { id: 'sss', label: 'SSS', ikon: '❓' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{tab.ikon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Oyun Akisi */}
        {activeTab === 'akis' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Oyun Akisi</h2>

            {/* Flow Chart */}
            <div className="relative">
              {oyunAkisi.map((adim, index) => (
                <div key={adim.id} className="relative flex items-start gap-4 mb-8">
                  {/* Connector Line */}
                  {index < oyunAkisi.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-16 bg-gradient-to-b from-gray-600 to-gray-700" />
                  )}

                  {/* Step Number */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${adim.renk} flex items-center justify-center text-3xl flex-shrink-0 shadow-lg`}>
                    {adim.ikon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-gray-700 text-xs text-gray-400 flex items-center justify-center">
                        {adim.id}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{adim.baslik}</h3>
                    </div>
                    <p className="text-gray-400">{adim.aciklama}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Loop Indicator */}
            <div className="bg-gray-800 rounded-xl p-6 text-center mt-8">
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-white mb-2">6 Tur Tekrarla</h3>
              <p className="text-gray-400">
                Bu dongu 6 tur boyunca tekrarlar. Her turda yeni bir olay gelir
                ve topluluk kaynaklari degisir.
              </p>
            </div>

            {/* Quick Start */}
            <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-3">Hizli Baslangic</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Lobi sayfasina git ve yeni lobi olustur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Lobi kodunu arkadaslarinla paylas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>4+ oyuncu olunca "Oyunu Baslat" butonuna tikla</span>
                </li>
              </ol>
              <Link
                href="/lobi"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                <span>Simdi Oyna</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Kaynaklar */}
        {activeTab === 'kaynaklar' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Kaynaklar</h2>
            <p className="text-gray-400 text-center mb-8">
              Her topluluk 4 temel kaynakla yonetilir. Hepsini dengede tutmak basarinin anahtari.
            </p>

            {/* Resource Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {kaynaklar.map((kaynak) => (
                <div key={kaynak.isim} className={`rounded-xl p-6 border ${kaynak.renk}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{kaynak.ikon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{kaynak.isim}</h3>
                      <p className="text-sm text-gray-400">Baslangic: 50</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{kaynak.aciklama}</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">Ornek etkiler:</p>
                    {kaynak.ornekler.map((ornek, i) => (
                      <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        {ornek}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Resource Bar Example */}
            <div className="bg-gray-800 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Kaynak Gostergesi</h3>
              <div className="space-y-4">
                {kaynaklar.map((kaynak, i) => {
                  const degerler = [75, 45, 60, 30];
                  return (
                    <div key={kaynak.isim} className="flex items-center gap-4">
                      <span className="text-2xl w-10">{kaynak.ikon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{kaynak.isim}</span>
                          <span className={degerler[i] < 30 ? 'text-red-400' : degerler[i] < 50 ? 'text-yellow-400' : 'text-green-400'}>
                            {degerler[i]}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              degerler[i] < 30 ? 'bg-red-500' : degerler[i] < 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${degerler[i]}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Kirmizi bolge (0-29) tehlike! Kaynak 0a duserse oyun biter.
              </p>
            </div>
          </div>
        )}

        {/* Olaylar */}
        {activeTab === 'olaylar' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Olay Tipleri</h2>
            <p className="text-gray-400 text-center mb-8">
              Her turda farkli tipte olaylarla karsilasirsin. Her olayda secenekler sunulur.
            </p>

            {/* Event Type Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {olayTipleri.map((olay) => (
                <div key={olay.tip} className={`rounded-xl p-6 border ${olay.renk}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{olay.ikon}</span>
                    <h3 className="text-xl font-bold text-white">{olay.tip}</h3>
                  </div>
                  <p className="text-gray-300 mb-4">{olay.aciklama}</p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">Ornekler:</p>
                    {olay.ornekler.map((ornek, i) => (
                      <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        {ornek}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Example Event */}
            <div className="bg-gray-800 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Ornek Olay</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚨</span>
                  <span className="text-red-400 text-sm font-medium">KRiz</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Salgin Hastalik!</h4>
                <p className="text-gray-400 text-sm">
                  Toplulukta hizla yayilan bir hastalik ortaya cikti.
                  Halk panik icinde ve saglik sistemi yetersiz kaliyor.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">Secenekler:</p>
                <div className="grid gap-2">
                  <div className="bg-gray-900 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Karantina uygula</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400">Istikrar +10</span>
                      <span className="text-red-400">Refah -15</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Hastane yap</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400">Altyapi +10</span>
                      <span className="text-red-400">Hazine -20</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-300">Hicbir sey yapma</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-red-400">Refah -20</span>
                      <span className="text-red-400">Istikrar -10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Puanlama */}
        {activeTab === 'puanlama' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Puanlama Sistemi</h2>
            <p className="text-gray-400 text-center mb-8">
              Oyun sonunda kaynaklarin durumuna gore puan hesaplanir. Her kaynak icin carpan uygulanir.
            </p>

            {/* Score Multipliers */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Puan Carpanlari</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b border-gray-700">
                      <th className="pb-3">Kaynak Araligi</th>
                      <th className="pb-3">Carpan</th>
                      <th className="pb-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puanlamaSistemi.map((satir, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className={`py-3 font-mono ${satir.renk}`}>{satir.aralik}</td>
                        <td className={`py-3 font-bold ${satir.renk}`}>{satir.carpan}</td>
                        <td className="py-3 text-gray-400">{satir.aciklama}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-gray-800 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ornek Hesaplama</h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-xl font-bold text-yellow-400">75</div>
                    <div className="text-xs text-gray-500">x2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">😊</div>
                    <div className="text-xl font-bold text-green-400">82</div>
                    <div className="text-xs text-gray-500">x2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="text-xl font-bold text-blue-400">45</div>
                    <div className="text-xs text-gray-500">x1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏗️</div>
                    <div className="text-xl font-bold text-red-400">28</div>
                    <div className="text-xs text-gray-500">x0.5</div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Toplam Puan</p>
                    <p className="text-3xl font-bold text-white">
                      (75×2) + (82×2) + (45×1) + (28×0.5) = <span className="text-primary-400">373</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Tum kaynaklar 70+ olsaydi, toplam 2x bonus uygulanirdi!
              </p>
            </div>

            {/* Bonus Info */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-5">
                <div className="text-2xl mb-2">🏆</div>
                <h4 className="font-semibold text-white mb-2">Mukemmel Yonetim Bonusu</h4>
                <p className="text-sm text-gray-400">
                  Tum kaynaklar 70+ olursa toplam puana 2x carpan uygulanir!
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-5">
                <div className="text-2xl mb-2">⭐</div>
                <h4 className="font-semibold text-white mb-2">Premium Bonus</h4>
                <p className="text-sm text-gray-400">
                  Premium uyeler ekstra puan carpani kazanir (VIP: 1.2x, Gold: 1.5x, Diamond: 2x)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Strateji */}
        {activeTab === 'strateji' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Strateji Rehberi</h2>
            <p className="text-gray-400 text-center mb-8">
              Oyunu kazanmak icin bu ipuclarini takip et.
            </p>

            {/* Strategy Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stratejiler.map((strateji, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition-colors">
                  <div className="text-3xl mb-3">{strateji.ikon}</div>
                  <h3 className="font-semibold text-white mb-2">{strateji.baslik}</h3>
                  <p className="text-sm text-gray-400">{strateji.aciklama}</p>
                </div>
              ))}
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>💎</span> Pro Ipuclari
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>Kriz olaylarinda savunmaci oyna, firsat olaylarinda cesur ol.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>Diger oyuncularin oylarini tahmin et ve ona gore strateji kur.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>Son turlarda yuksek riskli hamleler yap, kaybedecek bir seyin kalmaz.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-400 mt-1">•</span>
                  <span>Lobiyi lider olarak baslatirsan ilk onerici olursun - avantaj!</span>
                </li>
              </ul>
            </div>

            {/* Common Mistakes */}
            <div className="bg-gray-800 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>⚠️</span> Sik Yapilan Hatalar
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-400">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Tek kaynaga odaklanip digerlerini ihmal etmek</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Oneriye aciklama yazmadan gondermek</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Kaynak 30un altindayken riskli kararlar almak</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Diger oyuncularla iletisim kurmamak</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* SSS */}
        {activeTab === 'sss' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Sikca Sorulan Sorular</h2>
            <p className="text-gray-400 text-center mb-8">
              Merak ettigin her seyin cevabi burada.
            </p>

            {/* FAQ Accordion */}
            <div className="space-y-3">
              {sss.map((item, i) => (
                <div key={i} className="bg-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-white">{item.soru}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-400">{item.cevap}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still have questions */}
            <div className="bg-gray-800 rounded-xl p-6 mt-8 text-center">
              <div className="text-4xl mb-3">🤔</div>
              <h3 className="text-lg font-semibold text-white mb-2">Hala sorun var mi?</h3>
              <p className="text-gray-400 mb-4">Discord sunucumuza katil, topluluktan yardim al!</p>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord'a Katil
              </a>
            </div>
          </div>
        )}
      </main>

      {/* CTA Footer */}
      <section className="bg-gradient-to-t from-gray-800 to-gray-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Hazir misin?</h2>
          <p className="text-gray-400 mb-6">Simdi bir oyuna katil ve ogrendiklerini uygula!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/eslestirme"
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              Hizli Eslestirme
            </Link>
            <Link
              href="/lobi"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              Lobi Olustur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
