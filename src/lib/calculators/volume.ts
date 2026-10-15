export type Shape = 'dikdortgen' | 'silindir';

export interface VolumeInput {
  shape: Shape;
  /** cm. Silindirde length = çap. */
  length: number;
  width?: number;
  height: number;
  /** Zemin + dekor + cam payı: 0-100 (%) */
  displacementPct?: number;
}

export interface VolumeResult {
  grossLiters: number;
  netLiters: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function tankVolume(i: VolumeInput): VolumeResult {
  const { shape, length, height } = i;
  const width = i.width ?? 0;
  const pct = i.displacementPct ?? 0;
  if (![length, height].every((v) => Number.isFinite(v) && v > 0)) throw new RangeError('Ölçüler pozitif olmalı');
  if (shape === 'dikdortgen' && !(Number.isFinite(width) && width > 0)) throw new RangeError('Genişlik pozitif olmalı');
  if (!(pct >= 0 && pct < 100)) throw new RangeError('Pay %0-100 arasında olmalı');

  const cm3 = shape === 'silindir' ? Math.PI * (length / 2) ** 2 * height : length * width * height;
  const gross = cm3 / 1000;
  return { grossLiters: round1(gross), netLiters: round1(gross * (1 - pct / 100)) };
}
