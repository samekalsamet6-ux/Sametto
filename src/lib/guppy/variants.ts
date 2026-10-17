// Renk varyeteleri (şematik yorumlar) ve yüzgeç renk fonksiyonları (saf).
import type { Sex } from './model';

export type VariantId = 'mozaik' | 'cobra' | 'blue-grass' | 'albino' | 'endler';

export interface Palette { sirt: string; yan: string; karin: string }
export interface Variant {
  id: VariantId;
  ad: string;
  aciklama: string;
  goz: { iris: string; halka: string; pupil: string };
  erkek: Palette;
  disi: Palette;
  yuzgec: { taban: string; uc: string; benek: string; opaklik: number };
  vurgu: string[];
  wiki?: string;
}

export const VARIANTS: Variant[] = [
  { id: 'mozaik', ad: 'Mozaik', aciklama: 'Arka gövde ve kuyrukta parçalı, çok renkli (mavi, yeşil, turuncu) mozaik görünüm. Şematik bir yorumdur; gerçek hatlar çok çeşitlidir.',
    goz: { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' },
    erkek: { sirt: '#25414f', yan: '#5b92a6', karin: '#cfe0df' }, disi: { sirt: '#5d6b5c', yan: '#a3ad9c', karin: '#e3e2d2' },
    yuzgec: { taban: '#1d8fc0', uc: '#6a3fc0', benek: '#101820', opaklik: 0.8 }, vurgu: ['#2aa6d8', '#1fbf9f', '#f08a24', '#7f5bd6', '#101820'] },
  { id: 'cobra', ad: 'Cobra', aciklama: 'Arka gövdede yılan derisine benzeyen halka/zincir deseni, genelde turuncu–sarı zemin. Şematik yorumdur.',
    goz: { iris: '#d8b04e', halka: '#6b4a14', pupil: '#050505' },
    erkek: { sirt: '#5a3a14', yan: '#d98a2c', karin: '#f1d9a0' }, disi: { sirt: '#6a6354', yan: '#b4aa8c', karin: '#e9e2cc' },
    yuzgec: { taban: '#e8622d', uc: '#f2a65a', benek: '#2a120a', opaklik: 0.66 }, vurgu: ['#101010', '#8c2f12', '#f6c15a'], wiki: 'snakeskin-deseni' },
  { id: 'blue-grass', ad: 'Blue Grass', aciklama: 'Gövde ve kuyrukta sık, ince siyah benekli (çim görünümlü) mavi zemin. Şematik yorumdur.',
    goz: { iris: '#6fa2c8', halka: '#1d3b57', pupil: '#020305' },
    erkek: { sirt: '#12285f', yan: '#2753b8', karin: '#a8c4ec' }, disi: { sirt: '#4b5a68', yan: '#8a9cae', karin: '#dde4ea' },
    yuzgec: { taban: '#1f4fb8', uc: '#5d86e0', benek: '#050a1e', opaklik: 0.7 }, vurgu: ['#060b22', '#3f74e8', '#7fb0ff'] },
  { id: 'albino', ad: 'Albino', aciklama: 'Pigment azlığı: soluk krem/pembemsi gövde, saydam açık sarı yüzgeçler ve kırmızımsı göz.',
    goz: { iris: '#d23a3a', halka: '#8a1d24', pupil: '#3a0508' },
    erkek: { sirt: '#e8d9b8', yan: '#f5ead2', karin: '#fff7e6' }, disi: { sirt: '#e6d6b4', yan: '#f3e8d0', karin: '#fff7e8' },
    yuzgec: { taban: '#f7e7b8', uc: '#fbd9c2', benek: '#e7b99a', opaklik: 0.55 }, vurgu: ['#f6d9b0', '#f3c4b0'] },
  { id: 'endler', ad: 'Endler tipi', aciklama: 'Küçük gövdeli türlerde görülenlere benzeyen parlak turuncu–yeşil–siyah desenler (Endler tipi desen; şematik yorum).',
    goz: { iris: '#e0a02a', halka: '#7a4a10', pupil: '#050505' },
    erkek: { sirt: '#3b4a2b', yan: '#7fa05a', karin: '#e9eccb' }, disi: { sirt: '#5e6650', yan: '#a2aa88', karin: '#e8e8d2' },
    yuzgec: { taban: '#ff8a1f', uc: '#ffb35a', benek: '#0a0a0a', opaklik: 0.6 }, vurgu: ['#ff7a12', '#2fd06a', '#0a0a0a', '#35c9e8'] },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];

export type RGBA = [number, number, number, number];

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

export const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Deterministik [0,1) sahte rastgele sayı üreteci */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cellHash = (x: number, y: number): number => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export type FinKind = 'kuyruk' | 'sirt' | 'anal' | 'gogus' | 'karin';

/**
 * Yüzgeç zar rengi. u: 0 taban → 1 uç, s: 0..1 ışınlar arası konum.
 * Dişilerde renkler soluk ve daha saydamdır.
 */
export function finColor(v: Variant, sex: Sex, kind: FinKind, u: number, s: number): RGBA {
  const base = hexToRgb(v.yuzgec.taban);
  const tip = hexToRgb(v.yuzgec.uc);
  const dot = hexToRgb(v.yuzgec.benek);
  let c = mixRgb(base, tip, Math.min(1, Math.max(0, u)));
  let a = v.yuzgec.opaklik * (1 - 0.4 * u * u);
  const big = kind === 'kuyruk' || kind === 'sirt';
  if (big) {
    const GU = 16, GS = 42;
    const gx = Math.floor(u * GU), gy = Math.floor(s * GS);
    const h = cellHash(gx + (v.id.length * 7), gy);
    const sx = ((u * GU) % 1) - 0.5, sy = ((s * GS) % 1) - 0.5;
    const inDot = sx * sx + sy * sy < 0.1;
    if (v.id === 'mozaik' && inDot && h > 0.55 && u > 0.12 && u < 0.9) { c = mixRgb(c, dot, 0.85); a = Math.min(1, a + 0.2); }
    if (v.id === 'blue-grass' && inDot && h > 0.3 && u < 0.78) { c = mixRgb(c, dot, 0.9); a = Math.min(1, a + 0.25); }
    if (v.id === 'cobra' && inDot && h > 0.85 && u < 0.6) { c = mixRgb(c, dot, 0.8); }
    if (v.id === 'endler') {
      // orta kısım daha saydam, kenar turuncu; uçta siyah çerçeve ve dikey çubuklar
      const edge = Math.abs(s - 0.5) * 2;
      a *= 0.45 + 0.55 * Math.max(edge, u * u);
      if (u > 0.92 || (kind === 'kuyruk' && Math.abs(((u * 6) % 1) - 0.5) < 0.09 && u > 0.35 && u < 0.8)) c = mixRgb(c, dot, 0.85);
    }
  }
  if (sex === 'disi') {
    c = mixRgb(c, mixRgb(hexToRgb('#cfd8d0'), hexToRgb(v.yuzgec.uc), 0.2), 0.72);
    a *= 0.7;
  }
  if (!big) a *= 0.9;
  return [c[0], c[1], c[2], Math.min(1, Math.max(0, a))];
}
