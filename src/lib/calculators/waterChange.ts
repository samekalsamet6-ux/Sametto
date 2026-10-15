export interface WaterChangeInput {
  netLiters: number;
  /** mg/L */
  currentNitrate: number;
  /** mg/L, değişim suyundaki nitrat (çeşme suyu) */
  freshNitrate?: number;
  /** mg/L, hedef nitrat */
  targetNitrate: number;
}

export interface WaterChangeResult {
  /** 0-1 */
  fraction: number;
  liters: number;
}

/** Tek seferlik değişim: C1 = C0*(1-f) + Cf*f  =>  f = (C0 - C1) / (C0 - Cf) */
export function waterChange(i: WaterChangeInput): WaterChangeResult {
  const cf = i.freshNitrate ?? 0;
  if (!(i.netLiters > 0)) throw new RangeError('Hacim pozitif olmalı');
  if (i.currentNitrate < 0 || i.targetNitrate < 0 || cf < 0) throw new RangeError('Nitrat negatif olamaz');
  if (i.targetNitrate <= cf && i.currentNitrate > i.targetNitrate) throw new RangeError('Hedef, çeşme suyu nitratından yüksek olmalı');
  if (i.currentNitrate <= i.targetNitrate) return { fraction: 0, liters: 0 };
  const fraction = Math.min(1, (i.currentNitrate - i.targetNitrate) / (i.currentNitrate - cf));
  return { fraction: Math.round(fraction * 1000) / 1000, liters: Math.round(i.netLiters * fraction * 10) / 10 };
}
