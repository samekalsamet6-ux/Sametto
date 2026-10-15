export type Dist = Record<string, number>;

/** Alelleri büyük harf önce olacak biçimde sıralar: "bB" -> "Bb". */
export function normGenotype(a: string, b: string): string {
  return [a, b].sort((x, y) => (x === x.toUpperCase() ? 0 : 1) - (y === y.toUpperCase() ? 0 : 1) || x.localeCompare(y)).join('');
}

function add(d: Dist, k: string, p: number) { d[k] = (d[k] ?? 0) + p; }

function checkAllele(a: string) { if (!a || a.length !== 1) throw new RangeError('Alel tek harf olmalı'); }

/** Tek lokus, otozomal: ebeveyn başına iki alel. */
export function autosomal(p1: [string, string], p2: [string, string]): Dist {
  [...p1, ...p2].forEach(checkAllele);
  const d: Dist = {};
  for (const a of p1) for (const b of p2) add(d, normGenotype(a, b), 0.25);
  return d;
}

export interface SexLinkedResult { daughters: Dist; sons: Dist }

/** X-bağlantılı: anne iki X alelli, baba tek X alelli. Yavrunun yarısı dişi, yarısı erkek. */
export function xLinked(mother: [string, string], fatherX: string): SexLinkedResult {
  [...mother, fatherX].forEach(checkAllele);
  const daughters: Dist = {}; const sons: Dist = {};
  for (const m of mother) { add(daughters, normGenotype(m, fatherX), 0.5); add(sons, `${m}Y`, 0.5); }
  return { daughters, sons };
}

/** Y-bağlantılı (ideal, rekombinasyonsuz): erkek yavrular babanın Y alelini taşır. */
export function yLinked(fatherY: string): SexLinkedResult {
  checkAllele(fatherY);
  return { daughters: { XX: 1 }, sons: { [`XY${fatherY}`]: 1 } };
}

export function expectedCounts(d: Dist, n: number): Dist {
  if (!(n > 0)) throw new RangeError('Yavru sayısı pozitif olmalı');
  return Object.fromEntries(Object.entries(d).map(([k, p]) => [k, Math.round(p * n * 10) / 10]));
}
