// Oyun Olayları Veritabanı
// Her olay, topluluk kararlarını etkileyen bir senaryo içerir

export interface OlaySecenegi {
  id: string;
  baslik: string;
  aciklama: string;
  etkiler: {
    hazine: number;
    refah: number;
    istikrar: number;
    altyapi: number;
  };
}

export interface Olay {
  id: string;
  baslik: string;
  aciklama: string;
  tip: 'KRIZ' | 'FIRSAT' | 'KARAR' | 'RASTGELE';
  kategori: string;
  secenekler: OlaySecenegi[];
}

export const OLAYLAR: Olay[] = [
  // ============ KRİZ OLAYLARI ============
  {
    id: 'kriz-1',
    baslik: 'Su Kıtlığı',
    aciklama: 'Uzun süredir yağmur yağmadı ve su kaynakları azalıyor. Topluluk susuzluk tehdidiyle karşı karşıya. Halk endişeli ve çözüm bekliyor.',
    tip: 'KRIZ',
    kategori: 'Doğal Afet',
    secenekler: [
      {
        id: 'su-1',
        baslik: 'Kuyu Kaz',
        aciklama: 'Yeni kuyular açarak uzun vadeli çözüm sağla',
        etkiler: { hazine: -200, refah: 5, istikrar: 10, altyapi: 15 },
      },
      {
        id: 'su-2',
        baslik: 'Su Tayınlaması',
        aciklama: 'Suyu adil bir şekilde dağıt, tüketimi kısıtla',
        etkiler: { hazine: 0, refah: -15, istikrar: 5, altyapi: 0 },
      },
      {
        id: 'su-3',
        baslik: 'Komşu Köyden Al',
        aciklama: 'Komşu köyden yüksek fiyata su satın al',
        etkiler: { hazine: -300, refah: 0, istikrar: -5, altyapi: 0 },
      },
    ],
  },
  {
    id: 'kriz-2',
    baslik: 'Salgın Hastalık',
    aciklama: 'Toplulukta bilinmeyen bir hastalık yayılıyor. İnsanlar hasta düşüyor ve korku artıyor. Acil önlem alınması gerekiyor.',
    tip: 'KRIZ',
    kategori: 'Sağlık',
    secenekler: [
      {
        id: 'salgin-1',
        baslik: 'Karantina Uygula',
        aciklama: 'Hasta olanları izole et, yayılmayı önle',
        etkiler: { hazine: -50, refah: -10, istikrar: 15, altyapi: 0 },
      },
      {
        id: 'salgin-2',
        baslik: 'Şifacı Getir',
        aciklama: 'Uzak diyarlardan ünlü bir şifacı davet et',
        etkiler: { hazine: -250, refah: 15, istikrar: 10, altyapi: 0 },
      },
      {
        id: 'salgin-3',
        baslik: 'Geleneksel Tedavi',
        aciklama: 'Yerel otlarla tedavi dene, maliyetsiz ama riskli',
        etkiler: { hazine: 0, refah: -5, istikrar: -10, altyapi: 0 },
      },
    ],
  },
  {
    id: 'kriz-3',
    baslik: 'Haydut Saldırısı',
    aciklama: 'Haydutlar topluluğu tehdit ediyor. Haraç istiyorlar, aksi halde saldıracaklarını söylüyorlar.',
    tip: 'KRIZ',
    kategori: 'Güvenlik',
    secenekler: [
      {
        id: 'haydut-1',
        baslik: 'Savaş',
        aciklama: 'Köyü savunmak için silahlan ve direniş göster',
        etkiler: { hazine: -100, refah: -10, istikrar: 20, altyapi: -5 },
      },
      {
        id: 'haydut-2',
        baslik: 'Haraç Öde',
        aciklama: 'Barış için haraç öde, çatışmadan kaçın',
        etkiler: { hazine: -200, refah: -5, istikrar: -15, altyapi: 0 },
      },
      {
        id: 'haydut-3',
        baslik: 'Müzakere Et',
        aciklama: 'Haydutlara iş teklif et, onları topluma dahil et',
        etkiler: { hazine: -50, refah: 0, istikrar: 5, altyapi: 5 },
      },
    ],
  },
  {
    id: 'kriz-4',
    baslik: 'Kuraklık',
    aciklama: 'Tarlalar kuruyor, hasatlar yok oluyor. Açlık kapıda. Topluluk zor günler geçiriyor.',
    tip: 'KRIZ',
    kategori: 'Tarım',
    secenekler: [
      {
        id: 'kurak-1',
        baslik: 'Sulama Sistemi Kur',
        aciklama: 'Nehirden sulama kanalları inşa et',
        etkiler: { hazine: -300, refah: 10, istikrar: 15, altyapi: 20 },
      },
      {
        id: 'kurak-2',
        baslik: 'Gıda İthal Et',
        aciklama: 'Dışarıdan yüksek fiyata gıda satın al',
        etkiler: { hazine: -250, refah: 5, istikrar: 0, altyapi: 0 },
      },
      {
        id: 'kurak-3',
        baslik: 'Göç Et',
        aciklama: 'Bazı aileleri daha verimli topraklara gönder',
        etkiler: { hazine: -50, refah: -15, istikrar: -10, altyapi: 0 },
      },
    ],
  },

  // ============ FIRSAT OLAYLARI ============
  {
    id: 'firsat-1',
    baslik: 'Tüccar Kervanı',
    aciklama: 'Zengin bir tüccar kervanı topluluğunuzdan geçiyor. Ticaret yapmak veya başka anlaşmalar önermek istiyorlar.',
    tip: 'FIRSAT',
    kategori: 'Ticaret',
    secenekler: [
      {
        id: 'tuccar-1',
        baslik: 'Ticaret Yap',
        aciklama: 'Yerel ürünleri sat, ihtiyaçlarını karşıla',
        etkiler: { hazine: 150, refah: 5, istikrar: 5, altyapi: 0 },
      },
      {
        id: 'tuccar-2',
        baslik: 'Pazar Kur',
        aciklama: 'Kalıcı bir pazar yeri inşa et, uzun vadeli gelir sağla',
        etkiler: { hazine: -100, refah: 10, istikrar: 10, altyapi: 15 },
      },
      {
        id: 'tuccar-3',
        baslik: 'Geçiş Vergisi Al',
        aciklama: 'Kervanlardan geçiş ücreti al',
        etkiler: { hazine: 100, refah: 0, istikrar: -5, altyapi: 0 },
      },
    ],
  },
  {
    id: 'firsat-2',
    baslik: 'Maden Keşfi',
    aciklama: 'Dağlarda değerli bir maden yatağı keşfedildi. Zenginlik potansiyeli var ama çıkarma maliyetli.',
    tip: 'FIRSAT',
    kategori: 'Ekonomi',
    secenekler: [
      {
        id: 'maden-1',
        baslik: 'Maden Aç',
        aciklama: 'Yatırım yap ve madeni işlet',
        etkiler: { hazine: -200, refah: 5, istikrar: 0, altyapi: 10 },
      },
      {
        id: 'maden-2',
        baslik: 'Ortaklık Kur',
        aciklama: 'Dış yatırımcılarla ortaklık yap, riski paylaş',
        etkiler: { hazine: 50, refah: 0, istikrar: 5, altyapi: 5 },
      },
      {
        id: 'maden-3',
        baslik: 'Koruma Altına Al',
        aciklama: 'Doğayı koru, madeni beklet',
        etkiler: { hazine: 0, refah: 10, istikrar: 10, altyapi: 0 },
      },
    ],
  },
  {
    id: 'firsat-3',
    baslik: 'Yetenekli Göçmenler',
    aciklama: 'Başka diyarlardan yetenekli zanaatkarlar topluluğunuza yerleşmek istiyor. Farklı beceriler getiriyorlar.',
    tip: 'FIRSAT',
    kategori: 'Nüfus',
    secenekler: [
      {
        id: 'gocmen-1',
        baslik: 'Hoş Karşıla',
        aciklama: 'Göçmenleri kabul et, topluma kat',
        etkiler: { hazine: -50, refah: 10, istikrar: -5, altyapi: 10 },
      },
      {
        id: 'gocmen-2',
        baslik: 'Seçici Ol',
        aciklama: 'Sadece en yeteneklileri kabul et',
        etkiler: { hazine: 0, refah: 5, istikrar: 5, altyapi: 5 },
      },
      {
        id: 'gocmen-3',
        baslik: 'Reddet',
        aciklama: 'Yabancıları kabul etme, mevcut düzeni koru',
        etkiler: { hazine: 0, refah: -5, istikrar: 10, altyapi: 0 },
      },
    ],
  },

  // ============ KARAR OLAYLARI ============
  {
    id: 'karar-1',
    baslik: 'Yeni Yasalar',
    aciklama: 'Topluluk büyüyor ve yeni kurallar gerekiyor. Nasıl bir yönetim yapısı kurulmalı?',
    tip: 'KARAR',
    kategori: 'Yönetim',
    secenekler: [
      {
        id: 'yasa-1',
        baslik: 'Meclis Kur',
        aciklama: 'Herkesin oy kullanacağı demokratik bir meclis kur',
        etkiler: { hazine: -100, refah: 15, istikrar: 10, altyapi: 5 },
      },
      {
        id: 'yasa-2',
        baslik: 'Konsey Ata',
        aciklama: 'Bilge kişilerden oluşan bir konsey kur',
        etkiler: { hazine: -50, refah: 5, istikrar: 15, altyapi: 0 },
      },
      {
        id: 'yasa-3',
        baslik: 'Lider Seç',
        aciklama: 'Tek bir güçlü lider seç',
        etkiler: { hazine: 0, refah: -5, istikrar: 20, altyapi: 0 },
      },
    ],
  },
  {
    id: 'karar-2',
    baslik: 'Eğitim Sistemi',
    aciklama: 'Çocuklar büyüyor ve eğitim ihtiyacı artıyor. Nasıl bir eğitim sistemi kurulmalı?',
    tip: 'KARAR',
    kategori: 'Eğitim',
    secenekler: [
      {
        id: 'egitim-1',
        baslik: 'Okul İnşa Et',
        aciklama: 'Herkes için kalıcı bir okul yap',
        etkiler: { hazine: -200, refah: 20, istikrar: 10, altyapi: 15 },
      },
      {
        id: 'egitim-2',
        baslik: 'Çıraklık Sistemi',
        aciklama: 'Ustalar yanında öğrenme sistemini kur',
        etkiler: { hazine: -50, refah: 10, istikrar: 5, altyapi: 5 },
      },
      {
        id: 'egitim-3',
        baslik: 'Aile Sorumluluğu',
        aciklama: 'Eğitimi ailelere bırak, kaynakları başka işlere ayır',
        etkiler: { hazine: 50, refah: -10, istikrar: 0, altyapi: 0 },
      },
    ],
  },
  {
    id: 'karar-3',
    baslik: 'Festival Zamanı',
    aciklama: 'Hasat mevsimi geldi. Topluluk bir kutlama düzenlemek istiyor. Ne kadar kaynak ayırılmalı?',
    tip: 'KARAR',
    kategori: 'Kültür',
    secenekler: [
      {
        id: 'festival-1',
        baslik: 'Büyük Festival',
        aciklama: 'Muhteşem bir kutlama düzenle, herkes mutlu olsun',
        etkiler: { hazine: -150, refah: 25, istikrar: 10, altyapi: 0 },
      },
      {
        id: 'festival-2',
        baslik: 'Mütevazi Kutlama',
        aciklama: 'Basit ama anlamlı bir kutlama yap',
        etkiler: { hazine: -50, refah: 10, istikrar: 5, altyapi: 0 },
      },
      {
        id: 'festival-3',
        baslik: 'Biriktir',
        aciklama: 'Kutlamayı ertele, kaynakları sakla',
        etkiler: { hazine: 50, refah: -15, istikrar: -5, altyapi: 0 },
      },
    ],
  },

  // ============ RASTGELE OLAYLAR ============
  {
    id: 'rastgele-1',
    baslik: 'Kayıp Hazine',
    aciklama: 'Eski bir mağarada kayıp bir hazine bulundu! Ne yapılmalı?',
    tip: 'RASTGELE',
    kategori: 'Sürpriz',
    secenekler: [
      {
        id: 'hazine-1',
        baslik: 'Paylaş',
        aciklama: 'Hazineyi adil şekilde tüm toplulukla paylaş',
        etkiler: { hazine: 100, refah: 15, istikrar: 10, altyapi: 0 },
      },
      {
        id: 'hazine-2',
        baslik: 'Yatırım Yap',
        aciklama: 'Hazineyi topluluk projeleri için kullan',
        etkiler: { hazine: 50, refah: 5, istikrar: 5, altyapi: 20 },
      },
      {
        id: 'hazine-3',
        baslik: 'Sakla',
        aciklama: 'Zor günler için hazineyi gizli tut',
        etkiler: { hazine: 200, refah: -5, istikrar: -5, altyapi: 0 },
      },
    ],
  },
  {
    id: 'rastgele-2',
    baslik: 'Gezgin Bilge',
    aciklama: 'Yaşlı ve bilge bir gezgin topluluğunuzu ziyaret ediyor. Size tavsiye vermek istiyor.',
    tip: 'RASTGELE',
    kategori: 'Sürpriz',
    secenekler: [
      {
        id: 'bilge-1',
        baslik: 'Dinle ve Öğren',
        aciklama: 'Bilgenin öğretilerine kulak ver',
        etkiler: { hazine: 0, refah: 10, istikrar: 10, altyapi: 5 },
      },
      {
        id: 'bilge-2',
        baslik: 'Kalmasını İste',
        aciklama: 'Bilgeyi toplulukta kalmaya ikna et',
        etkiler: { hazine: -50, refah: 15, istikrar: 15, altyapi: 0 },
      },
      {
        id: 'bilge-3',
        baslik: 'Uğurla',
        aciklama: 'Nazikçe yoluna devam etmesini söyle',
        etkiler: { hazine: 0, refah: 0, istikrar: 0, altyapi: 0 },
      },
    ],
  },
  {
    id: 'rastgele-3',
    baslik: 'Bolluk Mevsimi',
    aciklama: 'Bu yıl hasat beklenenden çok daha iyi. Fazla ürünle ne yapılmalı?',
    tip: 'RASTGELE',
    kategori: 'Şans',
    secenekler: [
      {
        id: 'bolluk-1',
        baslik: 'Sat',
        aciklama: 'Fazla ürünü pazarda sat',
        etkiler: { hazine: 200, refah: 5, istikrar: 5, altyapi: 0 },
      },
      {
        id: 'bolluk-2',
        baslik: 'Depo Kur',
        aciklama: 'Depo inşa et ve gelecek için sakla',
        etkiler: { hazine: -50, refah: 10, istikrar: 15, altyapi: 10 },
      },
      {
        id: 'bolluk-3',
        baslik: 'Ziyafet Ver',
        aciklama: 'Büyük bir şölen düzenle, herkes yesin içsin',
        etkiler: { hazine: 0, refah: 20, istikrar: 10, altyapi: 0 },
      },
    ],
  },
];

// Rastgele olay seç
export function rastgeleOlayGetir(haricTut: string[] = []): Olay {
  const uygunOlaylar = OLAYLAR.filter((o) => !haricTut.includes(o.id));
  if (uygunOlaylar.length === 0) {
    // Tüm olaylar kullanıldıysa baştan başla
    return OLAYLAR[Math.floor(Math.random() * OLAYLAR.length)];
  }
  return uygunOlaylar[Math.floor(Math.random() * uygunOlaylar.length)];
}

// Olay ID'sine göre getir
export function olayGetir(id: string): Olay | undefined {
  return OLAYLAR.find((o) => o.id === id);
}
