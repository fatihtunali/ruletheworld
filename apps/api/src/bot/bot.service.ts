import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Bot kişilikleri
export enum BotKisilik {
  DENGELI = 'DENGELI',       // Tüm kaynaklara eşit önem verir
  EKONOMIST = 'EKONOMIST',   // Hazineye öncelik verir
  POPULIST = 'POPULIST',     // Refaha öncelik verir
  MUHAFAZAKAR = 'MUHAFAZAKAR', // İstikrara öncelik verir
  KALKINMACI = 'KALKINMACI', // Altyapıya öncelik verir
  RISKCI = 'RISKCI',         // Yüksek risk/yüksek ödül tercih eder
  TEMKINLI = 'TEMKINLI',     // Düşük riskli seçenekleri tercih eder
}

// Bot isimleri
const BOT_ISIMLERI = [
  'Akıllı Ali', 'Bilge Ayşe', 'Stratejist Selim', 'Düşünceli Deniz',
  'Hesapçı Hakan', 'Planlı Pelin', 'Mantıklı Mert', 'Dikkatli Defne',
  'Zeki Zeynep', 'Akılcı Ahmet', 'Tedbirli Tuba', 'Uzgörülü Ufuk',
];

interface OyunDurumu {
  hazine: number;
  refah: number;
  istikrar: number;
  altyapi: number;
}

interface OneriEylemi {
  kaynak: string;
  miktar: number;
}

interface BotOneri {
  baslik: string;
  aciklama: string;
  eylemler: OneriEylemi[];
}

@Injectable()
export class BotService {
  constructor(private prisma: PrismaService) {}

  // Rastgele bot ismi oluştur
  rastgeleBotIsmi(): string {
    const index = Math.floor(Math.random() * BOT_ISIMLERI.length);
    const suffix = Math.floor(Math.random() * 1000);
    return `${BOT_ISIMLERI[index]}#${suffix}`;
  }

  // Rastgele kişilik seç
  rastgeleKisilik(): BotKisilik {
    const kisilikler = Object.values(BotKisilik);
    return kisilikler[Math.floor(Math.random() * kisilikler.length)];
  }

  // Bot oyuncu oluştur
  async botOlustur(kisilik?: BotKisilik): Promise<{ id: string; kullaniciAdi: string; kisilik: BotKisilik }> {
    const botKisilik = kisilik || this.rastgeleKisilik();
    const isim = this.rastgeleBotIsmi();
    const uniqueEmail = `bot_${Date.now()}_${Math.random().toString(36).substring(7)}@bot.ruletheworld.com`;

    const bot = await this.prisma.oyuncu.create({
      data: {
        kullaniciAdi: isim,
        email: uniqueEmail,
        sifreHash: 'BOT_ACCOUNT_NO_LOGIN',
        sistemRolu: 'KULLANICI',
        hesapDurumu: 'AKTIF',
        botMu: true,
        botKisilik: botKisilik,
      },
    });

    return { id: bot.id, kullaniciAdi: bot.kullaniciAdi, kisilik: botKisilik };
  }

  // Mevcut bot al veya yeni oluştur
  async botGetirVeyaOlustur(kisilik?: BotKisilik): Promise<{ id: string; kullaniciAdi: string; kisilik: BotKisilik }> {
    // Kullanılmayan bir bot bul
    const mevcutBot = await this.prisma.oyuncu.findFirst({
      where: {
        botMu: true,
        hesapDurumu: 'AKTIF',
        uyelikler: {
          none: {
            durum: 'AKTIF',
          },
        },
      },
    });

    if (mevcutBot) {
      return {
        id: mevcutBot.id,
        kullaniciAdi: mevcutBot.kullaniciAdi,
        kisilik: (mevcutBot.botKisilik as BotKisilik) || BotKisilik.DENGELI,
      };
    }

    return this.botOlustur(kisilik);
  }

  // Öneri oluştur (bot için)
  oneriOlustur(
    durum: OyunDurumu,
    olay: { baslik: string; secenekler: Array<{ baslik: string; etkiler: OneriEylemi[] }> },
    kisilik: BotKisilik,
  ): BotOneri {
    // Kişiliğe göre seçenek değerlendirmesi
    const degerliSecenekler = olay.secenekler.map((secenek) => {
      let puan = 0;

      for (const etki of secenek.etkiler) {
        const agirlik = this.kaynakAgirligi(etki.kaynak, kisilik);
        const degerDegisimi = etki.miktar;

        // Düşük kaynakları korumaya çalış
        const mevcutDeger = durum[etki.kaynak as keyof OyunDurumu] || 50;
        const kritikBonus = mevcutDeger < 30 && degerDegisimi > 0 ? 2 : 1;

        puan += degerDegisimi * agirlik * kritikBonus;
      }

      // Risk faktörü
      if (kisilik === BotKisilik.RISKCI) {
        puan *= 1 + Math.random() * 0.5; // Rastgelelik ekle
      } else if (kisilik === BotKisilik.TEMKINLI) {
        // Negatif etkileri daha ağır değerlendir
        const negatifEtkiler = secenek.etkiler.filter((e) => e.miktar < 0);
        puan -= negatifEtkiler.length * 10;
      }

      return { secenek, puan };
    });

    // En yüksek puanlı seçeneği seç
    degerliSecenekler.sort((a, b) => b.puan - a.puan);
    const secilenSecenek = degerliSecenekler[0]?.secenek || olay.secenekler[0];

    // Öneri metni oluştur
    const aciklamalar = this.oneriAciklamasi(secilenSecenek, kisilik);

    return {
      baslik: secilenSecenek.baslik,
      aciklama: aciklamalar,
      eylemler: secilenSecenek.etkiler,
    };
  }

  // Kaynak ağırlığı (kişiliğe göre)
  private kaynakAgirligi(kaynak: string, kisilik: BotKisilik): number {
    const agirliklar: Record<BotKisilik, Record<string, number>> = {
      [BotKisilik.DENGELI]: { hazine: 1, refah: 1, istikrar: 1, altyapi: 1 },
      [BotKisilik.EKONOMIST]: { hazine: 2, refah: 0.5, istikrar: 0.8, altyapi: 0.7 },
      [BotKisilik.POPULIST]: { hazine: 0.5, refah: 2, istikrar: 0.8, altyapi: 0.7 },
      [BotKisilik.MUHAFAZAKAR]: { hazine: 0.7, refah: 0.8, istikrar: 2, altyapi: 0.5 },
      [BotKisilik.KALKINMACI]: { hazine: 0.5, refah: 0.7, istikrar: 0.8, altyapi: 2 },
      [BotKisilik.RISKCI]: { hazine: 1.2, refah: 1.2, istikrar: 0.6, altyapi: 1.2 },
      [BotKisilik.TEMKINLI]: { hazine: 0.8, refah: 1, istikrar: 1.5, altyapi: 0.8 },
    };

    return agirliklar[kisilik]?.[kaynak] || 1;
  }

  // Öneri açıklaması oluştur
  private oneriAciklamasi(
    secenek: { baslik: string; etkiler: OneriEylemi[] },
    kisilik: BotKisilik,
  ): string {
    const aciklamalar: Record<BotKisilik, string[]> = {
      [BotKisilik.DENGELI]: [
        'Tüm faktörleri değerlendirdim, bu en mantıklı seçenek.',
        'Dengeli bir yaklaşım en iyisi olacaktır.',
        'Her açıdan makul bir tercih.',
      ],
      [BotKisilik.EKONOMIST]: [
        'Ekonomik açıdan en karlı seçenek bu.',
        'Hazineyi düşünmeliyiz öncelikle.',
        'Mali açıdan en sürdürülebilir yol.',
      ],
      [BotKisilik.POPULIST]: [
        'Halkın mutluluğu her şeyden önemli!',
        'Vatandaşlarımızın refahı önceliğimiz olmalı.',
        'İnsanların yüzünü güldürecek bir karar.',
      ],
      [BotKisilik.MUHAFAZAKAR]: [
        'İstikrar her şeyden önemli.',
        'Toplumsal huzuru korumalıyız.',
        'Dengeli ve güvenli bir yaklaşım.',
      ],
      [BotKisilik.KALKINMACI]: [
        'Altyapı yatırımları geleceğimizdir!',
        'Uzun vadeli düşünmeliyiz.',
        'Kalkınma olmadan refah olmaz.',
      ],
      [BotKisilik.RISKCI]: [
        'Büyük oynamalıyız! Risk almadan kazanılmaz.',
        'Cesur adımlar atmalıyız.',
        'Şans bizden yana!',
      ],
      [BotKisilik.TEMKINLI]: [
        'Dikkatli olmalıyız, riskli adımlar atmamalıyız.',
        'Güvenli yolu seçelim.',
        'Aceleci kararlar tehlikeli olabilir.',
      ],
    };

    const secenekAciklamalari = aciklamalar[kisilik] || aciklamalar[BotKisilik.DENGELI];
    return secenekAciklamalari[Math.floor(Math.random() * secenekAciklamalari.length)];
  }

  // Oy verme kararı
  oyVermeKarari(
    oneri: { eylemler: OneriEylemi[]; onericiBot: boolean },
    durum: OyunDurumu,
    kisilik: BotKisilik,
  ): 'EVET' | 'HAYIR' | 'CEKIMSER' {
    let puan = 0;

    for (const etki of oneri.eylemler) {
      const agirlik = this.kaynakAgirligi(etki.kaynak, kisilik);
      puan += etki.miktar * agirlik;

      // Kritik kaynakları koru
      const mevcutDeger = durum[etki.kaynak as keyof OyunDurumu] || 50;
      if (mevcutDeger < 25 && etki.miktar < 0) {
        puan -= 20; // Kritik kaynak düşüşü
      }
    }

    // Kendi önerisine genellikle evet der
    if (oneri.onericiBot) {
      puan += 15;
    }

    // Rastgelelik ekle
    puan += (Math.random() - 0.5) * 10;

    if (puan > 10) return 'EVET';
    if (puan < -10) return 'HAYIR';
    return 'CEKIMSER';
  }

  // Oy gerekçesi
  oyGerekcesi(
    secim: 'EVET' | 'HAYIR' | 'CEKIMSER',
    kisilik: BotKisilik,
  ): string {
    const gerekcelar: Record<string, Record<BotKisilik, string[]>> = {
      EVET: {
        [BotKisilik.DENGELI]: ['Makul bir öneri.', 'Destekliyorum.'],
        [BotKisilik.EKONOMIST]: ['Ekonomi için iyi.', 'Mali açıdan olumlu.'],
        [BotKisilik.POPULIST]: ['Halk için iyi!', 'Destekliyorum!'],
        [BotKisilik.MUHAFAZAKAR]: ['İstikrarı korur.', 'Güvenli bir seçim.'],
        [BotKisilik.KALKINMACI]: ['Kalkınmaya katkı sağlar.', 'İlerleme için evet!'],
        [BotKisilik.RISKCI]: ['Haydi yapalım!', 'Neden olmasın?'],
        [BotKisilik.TEMKINLI]: ['Kabul edilebilir.', 'Uygun görünüyor.'],
      },
      HAYIR: {
        [BotKisilik.DENGELI]: ['Riskli buluyorum.', 'Daha iyisini bulabiliriz.'],
        [BotKisilik.EKONOMIST]: ['Ekonomiye zarar verir.', 'Maliyetli.'],
        [BotKisilik.POPULIST]: ['Halk için kötü!', 'Kabul edilemez.'],
        [BotKisilik.MUHAFAZAKAR]: ['İstikrarı bozar.', 'Tehlikeli.'],
        [BotKisilik.KALKINMACI]: ['Kalkınmayı engeller.', 'Geriye adım.'],
        [BotKisilik.RISKCI]: ['Yeterince cesur değil.', 'Daha iyisini yapabiliriz.'],
        [BotKisilik.TEMKINLI]: ['Çok riskli.', 'Güvenli değil.'],
      },
      CEKIMSER: {
        [BotKisilik.DENGELI]: ['Kararsızım.', 'Emin değilim.'],
        [BotKisilik.EKONOMIST]: ['Ekonomik etkisi belirsiz.', 'Hesaplamam lazım.'],
        [BotKisilik.POPULIST]: ['Halkın görüşünü merak ediyorum.', 'Bekleyelim.'],
        [BotKisilik.MUHAFAZAKAR]: ['Dikkatli olmalıyız.', 'Daha fazla bilgi gerek.'],
        [BotKisilik.KALKINMACI]: ['Uzun vadeli etkisi belirsiz.', 'Düşünmem gerek.'],
        [BotKisilik.RISKCI]: ['İlginç ama...', 'Bakalım ne olacak.'],
        [BotKisilik.TEMKINLI]: ['Çekimser kalıyorum.', 'Risklerini değerlendirmeliyim.'],
      },
    };

    const kisilikGerekceler = gerekcelar[secim]?.[kisilik] || [''];
    return kisilikGerekceler[Math.floor(Math.random() * kisilikGerekceler.length)];
  }

  // Mesaj oluştur (sohbet için)
  sohbetMesaji(durum: 'oyun_basi' | 'tur_basi' | 'oylama' | 'oyun_sonu', kisilik: BotKisilik): string | null {
    // %30 ihtimalle mesaj gönder
    if (Math.random() > 0.3) return null;

    const mesajlar: Record<string, Record<BotKisilik, string[]>> = {
      oyun_basi: {
        [BotKisilik.DENGELI]: ['Herkese iyi oyunlar!', 'Hazırım.'],
        [BotKisilik.EKONOMIST]: ['Hazineyi koruyalım.', 'Ekonomi önemli.'],
        [BotKisilik.POPULIST]: ['Halk için çalışalım!', 'Birlikte başaracağız!'],
        [BotKisilik.MUHAFAZAKAR]: ['Dikkatli ilerleyelim.', 'İstikrar önemli.'],
        [BotKisilik.KALKINMACI]: ['Altyapıya yatırım yapalım!', 'Büyüme zamanı!'],
        [BotKisilik.RISKCI]: ['Heyecanlı olacak!', 'Büyük oynayalım!'],
        [BotKisilik.TEMKINLI]: ['Dikkatli olalım.', 'Planlı hareket edelim.'],
      },
      tur_basi: {
        [BotKisilik.DENGELI]: ['Bakalım ne gelecek.', 'Hazırım.'],
        [BotKisilik.EKONOMIST]: ['Bütçeye dikkat!', 'Harcamalara dikkat.'],
        [BotKisilik.POPULIST]: ['Halkı dinleyelim.', 'Ne istiyorlar acaba?'],
        [BotKisilik.MUHAFAZAKAR]: ['Temkinli olalım.', 'Aceleci olmayalım.'],
        [BotKisilik.KALKINMACI]: ['Fırsat arıyorum.', 'Yatırım zamanı mı?'],
        [BotKisilik.RISKCI]: ['Ne gelecek merak ediyorum!', 'Heyecanlıyım!'],
        [BotKisilik.TEMKINLI]: ['Dikkat edelim.', 'Her şeyi değerlendirelim.'],
      },
      oylama: {
        [BotKisilik.DENGELI]: ['Düşünüyorum...', 'Hmm...'],
        [BotKisilik.EKONOMIST]: ['Maliyetleri hesaplıyorum.', 'Rakamlar önemli.'],
        [BotKisilik.POPULIST]: ['Halk ne ister?', 'Refahı düşünmeliyiz.'],
        [BotKisilik.MUHAFAZAKAR]: ['Riskleri değerlendiriyorum.', 'Dikkatli olmalıyız.'],
        [BotKisilik.KALKINMACI]: ['Uzun vadeyi düşünüyorum.', 'Gelecek önemli.'],
        [BotKisilik.RISKCI]: ['Hızlı karar verelim!', 'Düşünmeye gerek yok!'],
        [BotKisilik.TEMKINLI]: ['Analiz ediyorum.', 'Acele etmeyelim.'],
      },
      oyun_sonu: {
        [BotKisilik.DENGELI]: ['İyi oyundu.', 'GG!'],
        [BotKisilik.EKONOMIST]: ['Ekonomiyi iyi yönettik.', 'Kârlı geçti.'],
        [BotKisilik.POPULIST]: ['Halk mutlu mu?', 'Umarım iyi yaptık.'],
        [BotKisilik.MUHAFAZAKAR]: ['İstikrarı koruduk.', 'Güvenli bitti.'],
        [BotKisilik.KALKINMACI]: ['Altyapıyı geliştirdik!', 'İlerleme kaydettik.'],
        [BotKisilik.RISKCI]: ['Eğlenceliydi!', 'Bir daha oynayalım!'],
        [BotKisilik.TEMKINLI]: ['Dikkatli olduk, iyi oldu.', 'Güzel geçti.'],
      },
    };

    const kisilikMesajlari = mesajlar[durum]?.[kisilik] || [''];
    return kisilikMesajlari[Math.floor(Math.random() * kisilikMesajlari.length)];
  }

  // Tepki süresi (ms) - daha doğal görünmesi için
  tepkiSuresi(): number {
    return 1000 + Math.random() * 3000; // 1-4 saniye
  }
}
