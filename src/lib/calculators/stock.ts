export type Level3 = 'zayif' | 'orta' | 'guclu';
export interface StockInput {
  netLiters: number;
  filtration: Level3;
  plants: 'az' | 'orta' | 'yogun';
  waterChange: 'seyrek' | 'haftalik' | 'sik';
  fryPresent: boolean;
  /** Balık başına temel litre (hobi sezgisi, kullanıcı ayarlayabilir). */
  baseLitersPerFish?: number;
}
export interface StockResult {
  litersPerFish: number;
  recommended: number;
  upperLimit: number;
  warnings: string[];
}

const F: Record<Level3, number> = { zayif: 1.2, orta: 1, guclu: 0.85 };
const P = { az: 1.1, orta: 1, yogun: 0.9 } as const;
const W = { seyrek: 1.2, haftalik: 1, sik: 0.9 } as const;

/**
 * Sezgisel yetişkin balık kapasitesi. Bilimsel bir sabit DEĞİLDİR: temel litre değeri
 * ve çarpanlar hobi sezgisidir ve kaynakla doğrulanmalıdır.
 */
export function stockRange(i: StockInput): StockResult {
  const base = i.baseLitersPerFish ?? 4;
  if (!(i.netLiters > 0) || !(base > 0)) throw new RangeError('Hacim ve temel litre pozitif olmalı');
  const lpf = base * F[i.filtration] * P[i.plants] * W[i.waterChange] * (i.fryPresent ? 1.25 : 1);
  const recommended = Math.floor(i.netLiters / lpf);
  const upperLimit = Math.floor(recommended * 1.25);
  const warnings: string[] = [];
  if (i.netLiters < 20) warnings.push('Çok küçük hacimde su değerleri hızlı dalgalanır; üretim için uygun değildir.');
  if (i.fryPresent) warnings.push('Yavru yükü hesaba katıldı; yavrular büyüdükçe sayıyı yeniden hesaplayın.');
  if (recommended < 1) warnings.push('Bu hacim için önerilen sayı 1 balığın altında.');
  warnings.push('Sonuç bir sezgisel tahmindir; nitrat ve balık davranışını izleyerek ayarlayın.');
  return { litersPerFish: Math.round(lpf * 10) / 10, recommended, upperLimit, warnings };
}
