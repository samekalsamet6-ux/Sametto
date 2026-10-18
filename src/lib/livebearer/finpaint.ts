// Yüzgeç zarı ince ayrıntısı (saf): ışın boyunca renk/opaklık dalgalanması, tabanda yoğun pigment, uçta şeffaflaşma
// ve zar renginde doygunluk geçişi. finColor çıktısına uygulanır; deterministik ve sonludur.

type RGB = [number, number, number];

const cellHash = (x: number, y: number): number => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** s boyunca pürüzsüz değer gürültüsü (-1..1); kafes kafes ışın demetlerini taklit eder. */
export function streak(s: number, seed: number, cells: number): number {
  const f = clamp01(s) * cells, i = Math.floor(f), t = smooth(f - i);
  const a = cellHash(i + seed, 11), b = cellHash(i + 1 + seed, 11);
  return (a + (b - a) * t) * 2 - 1;
}

/**
 * Zar rengine gerçekçi ayrıntı ekler.
 * big: kuyruk/sırt gibi geniş yüzgeçler; u taban(0) → uç(1); s ışınlar arası konum.
 */
export function finDetail(c: RGB, a: number, big: boolean, u: number, s: number, seed: number): [RGB, number] {
  const n1 = streak(s, seed, big ? 38 : 14), n2 = streak(s, seed + 97, big ? 11 : 5);
  const k = 1 + 0.1 * n1 + 0.07 * n2;
  // doygunluk: tabanda yüksek, uçta düşük (zar incelir)
  const grey = (c[0] + c[1] + c[2]) / 3, sat = 1.5 - 0.45 * u;
  let r = grey + (c[0] - grey) * sat, g = grey + (c[1] - grey) * sat, b = grey + (c[2] - grey) * sat;
  // taban: koyu pigment yoğunluğu
  const baseDark = 1 - 0.3 * Math.pow(1 - clamp01(u * 2.4), 2);
  r *= k * baseDark; g *= k * baseDark; b *= k * baseDark;
  // uç: hafif açılma
  const tip = smooth(clamp01((u - 0.82) / 0.18));
  r += (1 - r) * 0.12 * tip; g += (1 - g) * 0.12 * tip; b += (1 - b) * 0.12 * tip;
  const aa = a * 1.08 * (1 + 0.14 * n1) * (1 + 0.28 * Math.pow(1 - clamp01(u * 3), 2)) * (1 - 0.28 * tip);
  return [[clamp01(r), clamp01(g), clamp01(b)], clamp01(aa)];
}
