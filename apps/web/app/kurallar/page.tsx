'use client';

import Link from 'next/link';

export default function KurallarSayfasi() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Rule<span className="text-primary-400">The</span>World
          </Link>
          <Link
            href="/lobi"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
          >
            Oyuna Basla
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Oyun Kurallari</h1>

        {/* Oyunun Amaci */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span> Oyunun Amaci
          </h2>
          <p className="text-gray-300 leading-relaxed">
            RuleTheWorld, 4-8 oyuncunun bir toplulugu yonettigi stratejik bir karar oyunudur.
            Amac, 6 tur boyunca toplulugun kaynaklarini dengede tutarak en iyi sonuca ulasmaktir.
            Her tur, oneriler yapilir, oylanir ve sonuclar uygulanir.
          </p>
        </section>

        {/* Kaynaklar */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Kaynaklar
          </h2>
          <p className="text-gray-300 mb-4">
            Toplulugun 4 temel kaynagi vardir. Her kaynak 50 puanla baslar ve 0-100 arasinda degisir.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-semibold text-yellow-400">Hazine</h3>
              </div>
              <p className="text-sm text-gray-400">
                Toplulugun ekonomik gucu. Yatirimlar, vergiler ve ticaret etkileri ile degisir.
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">😊</span>
                <h3 className="font-semibold text-green-400">Refah</h3>
              </div>
              <p className="text-sm text-gray-400">
                Halkin mutlulugu ve yasam kalitesi. Sosyal politikalar ve olaylardan etkilenir.
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚖️</span>
                <h3 className="font-semibold text-blue-400">Istikrar</h3>
              </div>
              <p className="text-sm text-gray-400">
                Siyasi ve sosyal denge. Kararlar arasi tutarlilik ve guvenlik politikalari etkiler.
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏗️</span>
                <h3 className="font-semibold text-purple-400">Altyapi</h3>
              </div>
              <p className="text-sm text-gray-400">
                Fiziksel ve teknolojik gelisme. Insaat, yol ve iletisim yatirimlari etkiler.
              </p>
            </div>
          </div>
        </section>

        {/* Oyun Akisi */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔄</span> Oyun Akisi
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-white">Olay Acilir</h3>
                <p className="text-sm text-gray-400">Her turun basinda rastgele bir olay gosterilir. Olaylar toplulugu etkileyen durumlardir.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-white">Oneri Yapilir (60 saniye)</h3>
                <p className="text-sm text-gray-400">Oyuncular olaya karsi cozum onerileri sunar. Her oneri kaynaklari farkli etkiler.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-white">Oylama Yapilir (30 saniye)</h3>
                <p className="text-sm text-gray-400">Tum oyuncular onerilere oy verir: Evet, Hayir veya Cekimser.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-white">Sonuc Uygulanir</h3>
                <p className="text-sm text-gray-400">En cok oy alan oneri uygulanir. Kaynaklar guncellenir ve sonraki tura gecilir.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Oyun Sonuclari */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Oyun Sonuclari
          </h2>
          <p className="text-gray-300 mb-4">
            6 tur sonunda kaynaklarin durumuna gore 5 farkli sonuc olusabilir:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <span className="text-2xl">🌟</span>
              <div>
                <span className="font-semibold text-yellow-400">PARLADI</span>
                <span className="text-gray-400 ml-2">Tum kaynaklar 70+ (x1.5 puan)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <span className="text-2xl">📈</span>
              <div>
                <span className="font-semibold text-green-400">GELISTI</span>
                <span className="text-gray-400 ml-2">Min 45+, ortalama 60+ (x1.25 puan)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <span className="text-2xl">➡️</span>
              <div>
                <span className="font-semibold text-blue-400">DURAGAN</span>
                <span className="text-gray-400 ml-2">Min 25+, ortalama 40-60 (x1.0 puan)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <span className="text-2xl">📉</span>
              <div>
                <span className="font-semibold text-orange-400">GERILEDI</span>
                <span className="text-gray-400 ml-2">Min 25 alti veya ortalama 40 alti (x0.75 puan)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <span className="text-2xl">💔</span>
              <div>
                <span className="font-semibold text-red-400">COKTU</span>
                <span className="text-gray-400 ml-2">Herhangi kaynak 0'a dustu (x0.5 puan)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Oyun Modlari */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span> Oyun Modlari
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Normal</h3>
              <p className="text-sm text-gray-400">6 tur, 2 dakika tur suresi</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Hizli</h3>
              <p className="text-sm text-gray-400">4 tur, 1 dakika tur suresi</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Uzun</h3>
              <p className="text-sm text-gray-400">10 tur, 3 dakika tur suresi</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Maraton</h3>
              <p className="text-sm text-gray-400">15 tur, 5 dakika tur suresi</p>
            </div>
          </div>
        </section>

        {/* Ipuclari */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Ipuclari
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-1">•</span>
              <span>Kaynaklari dengeli tutmaya calisin. Tek bir kaynaga odaklanmak digerlerin dusmesine neden olabilir.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-1">•</span>
              <span>Diger oyuncularla iletisim kurun. Koordineli kararlar daha iyi sonuclar verir.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-1">•</span>
              <span>Olaylara dikkat edin. Her olay farkli kaynaklari etkiler.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-1">•</span>
              <span>Herhangi bir kaynagin 0'a dusmesi oyunu erken bitirir ve en kotu sonucu verir.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 mt-1">•</span>
              <span>En yuksek puan icin tum kaynaklari 70 uzerinde tutmaya calisin.</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/lobi"
            className="inline-block px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
          >
            Simdi Oyna
          </Link>
        </div>
      </main>
    </div>
  );
}
