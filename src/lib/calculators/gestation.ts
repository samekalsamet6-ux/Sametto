export interface GestationInput {
  /** YYYY-MM-DD */
  startDate: string;
  minDays?: number;
  maxDays?: number;
}
export interface GestationResult {
  earliest: string;
  middle: string;
  latest: string;
}

const MS = 86_400_000;
function parse(d: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) throw new RangeError('Tarih YYYY-AA-GG biçiminde olmalı');
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (new Date(t).toISOString().slice(0, 10) !== d) throw new RangeError('Geçersiz tarih');
  return t;
}
export const addDays = (d: string, n: number): string => new Date(parse(d) + n * MS).toISOString().slice(0, 10);

/** Varsayılan aralık yaygın hobi bilgisidir (⚠ kaynakla doğrulanmalı) ve sıcaklığa göre değişir. */
export function gestationWindow(i: GestationInput): GestationResult {
  const min = i.minDays ?? 21;
  const max = i.maxDays ?? 30;
  if (!(min > 0) || !(max >= min)) throw new RangeError('Gün aralığı geçersiz');
  return { earliest: addDays(i.startDate, min), middle: addDays(i.startDate, Math.round((min + max) / 2)), latest: addDays(i.startDate, max) };
}
