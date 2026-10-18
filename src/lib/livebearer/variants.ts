// Canlı doğuran balıklar için ortak renk/desen tipleri ve yüzgeç renk fonksiyonu (saf).
import type { Sex } from './model';
import { finDetail } from './finpaint';

export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

export function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

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

export interface Palette { sirt: string; yan: string; karin: string }

/**
 * Gövde deseni katmanları (texture.ts çizer). Konum oranları: x 0=burun…1=kuyruk sapı, y 0=karın…1=sırt (yan çizgi ≈ 0.5).
 * Doku sol-sağ aynalı olduğundan desen iki yanda simetriktir (şematik).
 */
export type BodyLayer =
  | { t: 'zemin'; renk: string; a: number; x: [number, number]; y?: [number, number]; yum?: number }       // kenarı yumuşak dikdörtgen blok
  | { t: 'gradyan'; renk0: string; renk1: string; a: number; x: [number, number] }                          // yatay renk geçişi (x aralığında)
  | { t: 'blob'; x: number; y: number; rx: number; ry: number; renk: string; a: number }                    // yumuşak leke (rx, ry piksel)
  | { t: 'benek'; n: number; renk: string; r: [number, number]; uzun?: number; a: number; x: [number, number]; y?: [number, number]; sert?: boolean; renkler?: string[] } // düzensiz benekler
  | { t: 'sira'; renk: string; a: number; p: number; x: [number, number]; r?: number }                       // pul merkezlerinde noktalar (p = olasılık)
  | { t: 'serit'; x: number; w: number; renk: string; a: number };                                            // dikey bant

/** Yüzgeç deseni. u: tabandan uca 0..1, s: ışınlar arası 0..1 */
export interface FinDesen {
  nokta?: { esik: number; umin: number; umax: number; guc: number; aEk: number };
  /** Kuyruk tabanında daireler (Mickey Mouse): merkez (u, s), yarıçap (u biriminde; s ekseni ~1.15 ile ölçeklenir) */
  daireler?: { u: number; s: number; r: number }[];
  /** Uç kenarında koyu çerçeve (u bu değerin ötesi) */
  ucKenar?: number;
}

export interface FinPal { taban: string; uc: string; benek: string; opaklik: number; desen?: FinDesen }

export interface Variant {
  id: string;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali?: boolean;
  goz: { iris: string; halka: string; pupil: string };
  erkek: Palette;
  disi: Palette;
  yuzgec: FinPal;
  /** Göğüs ve karın yüzgeçleri için ayrı renk (yoksa yuzgec) */
  cift?: { taban: string; uc: string; opaklik: number };
  desen: BodyLayer[];
  /** 0..1 metalik parlaklık (yalnızca malzeme) */
  metal?: number;
  /** Dişide gravid spot görünürlüğü 0..1 (varsayılan 0.85; koyu gövdede örtülür) */
  gravid?: number;
  wiki?: string;
}

export type FinKind = 'kuyruk' | 'sirt' | 'anal' | 'gogus' | 'karin';

/** Yüzgeç zar rengi. u: 0 taban → 1 uç, s: 0..1 ışınlar arası konum. */
export function finColor(v: Variant, _sex: Sex, kind: FinKind, u: number, s: number): RGBA {
  const paired = kind === 'gogus' || kind === 'karin';
  const pal = paired && v.cift ? { ...v.yuzgec, ...v.cift, desen: undefined } : v.yuzgec;
  const base = hexToRgb(pal.taban), tip = hexToRgb(pal.uc), dot = hexToRgb(v.yuzgec.benek);
  let c = mixRgb(base, tip, Math.min(1, Math.max(0, u)));
  let a = pal.opaklik * (1 - 0.35 * u * u);
  const big = kind === 'kuyruk' || kind === 'sirt';
  const d = pal.desen;
  if (big && d) {
    const GU = 16, GS = 42;
    const gx = Math.floor(u * GU), gy = Math.floor(s * GS);
    const h = cellHash(gx + v.id.length * 7, gy);
    const sx = ((u * GU) % 1) - 0.5, sy = ((s * GS) % 1) - 0.5;
    const n = d.nokta;
    if (n && sx * sx + sy * sy < 0.1 && h > n.esik && u > n.umin && u < n.umax) { c = mixRgb(c, dot, n.guc); a = Math.min(1, a + n.aEk); }
    if (d.ucKenar !== undefined && u > d.ucKenar) c = mixRgb(c, dot, 0.8);
    if (kind === 'kuyruk' && d.daireler) {
      for (const q of d.daireler) {
        const du = u - q.u, ds = (s - q.s) * 1.15;
        const dist = Math.hypot(du, ds);
        if (dist < q.r) { c = mixRgb(c, dot, 0.95); a = Math.max(a, 0.97); }
        else if (dist < q.r * 1.25) { const k = (1 - (dist - q.r) / (q.r * 0.25)) * 0.6; c = mixRgb(c, dot, k); a = Math.max(a, 0.6 * k + a * (1 - k)); }
      }
    }
  }
  if (!big) a *= 0.9;
  // gerçekçi zar: ışın demetleri boyunca renk/opaklık dalgalanması, taban pigmenti, uçta şeffaflık
  const [dc, da] = finDetail(c, a, big, u, s, v.id.length * 13 + (kind === 'kuyruk' ? 3 : kind === 'sirt' ? 5 : 1));
  return [dc[0], dc[1], dc[2], da];
}

/** Bir tür için gruplu varyete yardımcıları üretir. */
export function variantHelpers(variants: Variant[], groups: readonly string[]) {
  const byId = (id: string): Variant => variants.find((v) => v.id === id) ?? variants[0];
  const grouped = () => groups.map((g) => ({ grup: g, items: variants.filter((v) => v.grup === g) })).filter((g) => g.items.length);
  return { variantById: byId, groupedVariants: grouped };
}
