import Image from 'next/image';
import Link from 'next/link';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/city.jpg"
            alt="Şehir manzarası"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        {/* Navigation */}
        <header className="relative z-10 container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Rule<span className="text-primary-400">The</span>World
            </h1>
            <div className="flex gap-3">
              <Link
                href="/giris"
                className="px-5 py-2.5 text-white/90 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-200"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-primary-500/25"
              >
                Kayıt Ol
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-3xl">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Yönet. Öğren.{' '}
                <span className="text-primary-400">Değiştir.</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
                Bir topluluğu arkadaşlarınla birlikte yönet. Krizlerle başa çık,
                kararlar al, sonuçlarıyla yüzleş.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/kayit"
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-medium rounded-xl transition-all duration-200 shadow-xl shadow-primary-500/30 text-center"
                >
                  Hemen Başla
                </Link>
                <Link
                  href="#nasil-oynanir"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-medium rounded-xl backdrop-blur-sm transition-all duration-200 text-center border border-white/20"
                >
                  Nasıl Oynanır?
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              4 Kaynak, Sonsuz Karar
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Her kararın bir bedeli var. Dengeyi korumak senin elinde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KaynakKarti
              isim="Hazine"
              aciklama="Topluluk bütçesi. Projeleri finanse et, acil durumlara müdahale et."
              resim="/images/resources/hazine.jpg"
              renk="from-amber-500 to-yellow-600"
            />
            <KaynakKarti
              isim="Refah"
              aciklama="Halkın mutluluğu. Düşerse göç başlar, güven azalır."
              resim="/images/resources/refah.jpg"
              renk="from-emerald-500 to-green-600"
            />
            <KaynakKarti
              isim="İstikrar"
              aciklama="Toplumsal düzen. Kararlar tartışmalıysa sarsılır."
              resim="/images/resources/istikrar.jpg"
              renk="from-blue-500 to-indigo-600"
            />
            <KaynakKarti
              isim="Altyapı"
              aciklama="Yollar, okullar, hastaneler. İhmal edilirse çöker."
              resim="/images/resources/altyapi.jpg"
              renk="from-orange-500 to-red-600"
            />
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="nasil-oynanir" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Nasıl Oynanır?
            </h3>
            <p className="text-xl text-gray-600">
              3 adımda topluluğunu yönetmeye başla
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AdimKarti
              numara={1}
              baslik="Topluluğa Katıl"
              aciklama="4-8 kişilik bir topluluk oluştur veya mevcut birine katıl. Arkadaşlarınla ya da yabancılarla oyna."
              ikon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <AdimKarti
              numara={2}
              baslik="Kararlar Al"
              aciklama="Her turda bir olay yaşanır. Tartış, öneri sun, oy kullan. Çoğunluk kazanır."
              ikon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
            <AdimKarti
              numara={3}
              baslik="Sonuçları Gör"
              aciklama="6 tur sonunda topluluğunun kaderi belli olur. Her karar iz bırakır."
              ikon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="py-24 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Gerçek Sorunlar, Gerçek Kararlar
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Her olay gerçek hayattan esinlenmiştir. Kolay cevap yok.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <OlayKarti
              tip="kriz"
              baslik="Fabrika Kapanıyor"
              aciklama="İlçedeki en büyük işveren iflas etti. 500 işçi işsiz kalacak. Ne yapacaksınız?"
              resim="/images/events/fabrika.jpg"
            />
            <OlayKarti
              tip="firsat"
              baslik="Güneş Enerjisi Teklifi"
              aciklama="Bir şirket güneş santrali kurmak istiyor. Ucuz elektrik ama tarım arazisi kullanılacak."
              resim="/images/events/gunes-enerjisi.jpg"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">~20dk</div>
              <div className="text-primary-200">Oyun Süresi</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">4-8</div>
              <div className="text-primary-200">Oyuncu</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">6</div>
              <div className="text-primary-200">Tur</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">12+</div>
              <div className="text-primary-200">Farklı Olay</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero/people-together.jpg"
            alt="İnsanlar bir arada"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Yönetmeye Hazır mısın?
          </h3>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Arkadaşlarınla veya yabancılarla oyna. Her oyun farklı bir hikaye.
          </p>
          <Link
            href="/kayit"
            className="inline-block px-10 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-medium rounded-xl transition-all duration-200 shadow-xl shadow-primary-500/30"
          >
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">
                Rule<span className="text-primary-400">The</span>World
              </h4>
              <p className="text-sm">&copy; 2024 Açık kaynak bir projedir.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/hakkinda" className="hover:text-white transition-colors">
                Hakkında
              </Link>
              <Link href="/gizlilik" className="hover:text-white transition-colors">
                Gizlilik
              </Link>
              <Link href="/iletisim" className="hover:text-white transition-colors">
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components
function KaynakKarti({
  isim,
  aciklama,
  resim,
  renk,
}: {
  isim: string;
  aciklama: string;
  resim: string;
  renk: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={resim}
          alt={isim}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${renk} opacity-60`} />
        <div className="absolute bottom-4 left-4">
          <h4 className="text-2xl font-bold text-white drop-shadow-lg">{isim}</h4>
        </div>
      </div>
      <div className="p-5">
        <p className="text-gray-600 leading-relaxed">{aciklama}</p>
      </div>
    </div>
  );
}

function AdimKarti({
  numara,
  baslik,
  aciklama,
  ikon,
}: {
  numara: number;
  baslik: string;
  aciklama: string;
  ikon: React.ReactNode;
}) {
  return (
    <div className="relative bg-gray-50 rounded-2xl p-8 hover:bg-gray-100 transition-colors duration-300">
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
        {numara}
      </div>
      <div className="pt-4">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-5">
          {ikon}
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-3">{baslik}</h4>
        <p className="text-gray-600 leading-relaxed">{aciklama}</p>
      </div>
    </div>
  );
}

function OlayKarti({
  tip,
  baslik,
  aciklama,
  resim,
}: {
  tip: 'kriz' | 'firsat';
  baslik: string;
  aciklama: string;
  resim: string;
}) {
  const config = {
    kriz: {
      etiket: 'Kriz',
      renkEtiket: 'bg-red-500',
      renkBorder: 'border-red-500/50',
    },
    firsat: {
      etiket: 'Fırsat',
      renkEtiket: 'bg-emerald-500',
      renkBorder: 'border-emerald-500/50',
    },
  };

  const { etiket, renkEtiket, renkBorder } = config[tip];

  return (
    <div className={`group relative bg-gray-800 rounded-2xl overflow-hidden border-2 ${renkBorder} hover:border-opacity-100 transition-all duration-300`}>
      <div className="relative h-56 overflow-hidden">
        <Image
          src={resim}
          alt={baslik}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        <span className={`absolute top-4 left-4 px-3 py-1 ${renkEtiket} text-white text-sm font-medium rounded-full`}>
          {etiket}
        </span>
      </div>
      <div className="p-6">
        <h4 className="text-xl font-semibold text-white mb-3">{baslik}</h4>
        <p className="text-gray-400 leading-relaxed">{aciklama}</p>
      </div>
    </div>
  );
}
