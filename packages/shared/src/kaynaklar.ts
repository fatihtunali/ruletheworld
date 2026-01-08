// Kaynak yapısı
export interface Kaynaklar {
  hazine: number;      // Para (başlangıç: 1000)
  refah: number;       // Halkın mutluluğu (başlangıç: 60)
  istikrar: number;    // Toplumsal düzen (başlangıç: 60)
  altyapi: number;     // Fiziksel sistemler (başlangıç: 50)
}

// Kaynak değişimi (delta)
export interface KaynakDegisimi {
  hazine?: number;
  refah?: number;
  istikrar?: number;
  altyapi?: number;
}

// Başlangıç kaynakları
export const BASLANGIC_KAYNAKLARI: Kaynaklar = {
  hazine: 1000,
  refah: 60,
  istikrar: 60,
  altyapi: 50,
};

// Kaynak limitleri
export const KAYNAK_LIMITLERI = {
  hazine: { min: 0, max: 9999 },
  refah: { min: 0, max: 100 },
  istikrar: { min: 0, max: 100 },
  altyapi: { min: 0, max: 100 },
};

// Topluluk sağlığı hesaplama ağırlıkları
export const SAGLIK_AGIRLIKLARI = {
  hazine: 0.1,    // Hazine 1000 üzerinden, normalize edilecek
  refah: 0.35,
  istikrar: 0.35,
  altyapi: 0.2,
};
