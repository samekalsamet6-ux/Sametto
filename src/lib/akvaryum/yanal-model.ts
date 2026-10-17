// Yanlardan basık "disk" balıklar (melek, diskus ...) için ortak SAF geometri ve veri türleri.
// DOM ve three.js yok: birim testlenebilir, SVG yedeği de aynı sayılardan üretilir.
//
// Koordinatlar: x gövde ekseni (burun -x, kuyruk +x), y yukarı, z yanal. Birim keyfidir (şematik model).

export type Pt = [number, number];
export type Vec3 = [number, number, number];

// ------------------------------------------------------------------ 1B eğri yardımcıları

/** Monoton kübik (Fritsch–Carlson) ara değer: taşma yapmaz. Noktalar x'e göre artan olmalı. */
export function pchip(pts: Pt[]): (x: number) => number {
  const n = pts.length;
  const h: number[] = [], d: number[] = [];
  for (let i = 0; i < n - 1; i++) { h.push(pts[i + 1][0] - pts[i][0]); d.push((pts[i + 1][1] - pts[i][1]) / h[i]); }
  const m: number[] = new Array(n).fill(0);
  if (n === 2) { m[0] = m[1] = d[0]; } else {
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    }
    m[0] = d[0]; m[n - 1] = d[n - 2];
  }
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0;
    while (i < n - 2 && x > pts[i + 1][0]) i++;
    const t = (x - pts[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

/** Düzgün Catmull-Rom ile kontrol noktalarından yoğun örnek yol */
export function smoothPath(ctrl: Pt[], per = 14): Pt[] {
  if (ctrl.length < 3) return ctrl.slice();
  const out: Pt[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** Çoklu çizgiyi yay uzunluğuna göre n+1 eşit aralıklı noktaya yeniden örnekler */
export function resample(path: Pt[], n: number): Pt[] {
  const len: number[] = [0];
  for (let i = 1; i < path.length; i++) len.push(len[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = len[len.length - 1] || 1;
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * total;
    while (j < path.length - 2 && len[j + 1] < s) j++;
    const seg = len[j + 1] - len[j] || 1;
    const t = Math.min(1, Math.max(0, (s - len[j]) / seg));
    out.push([path[j][0] + (path[j + 1][0] - path[j][0]) * t, path[j][1] + (path[j + 1][1] - path[j][1]) * t]);
  }
  return out;
}

/** Köşeleri korunan çok parçalı yol: her parça ayrı yumuşatılır, uçlar birleştirilir */
export function cornerPath(segments: Pt[][], per = 14): Pt[] {
  const out: Pt[] = [];
  segments.forEach((s, i) => { const p = smoothPath(s, per); out.push(...(i ? p.slice(1) : p)); });
  return out;
}

// ------------------------------------------------------------------ gövde

export interface BodySpec {
  /** Burun ucu ve gövde (kuyruk sapı) sonu x */
  xs: number; xe: number;
  /** (t, y) kontrol noktaları: sırt ve karın çizgisi; t = 0..1 */
  top: Pt[]; bot: Pt[];
  /** (t, yarı genişlik z) */
  width: Pt[];
  /** Burun ucunun y'si ve burun kapağının uzunluğu (t); cap 0 ise kapak yok */
  snoutY: number; cap: number;
  /** Kesit süper elips üssü (2 = elips) */
  n: number;
}

export interface BodyFns { top: (t: number) => number; bot: (t: number) => number; w: (t: number) => number }

const fnCache = new WeakMap<BodySpec, BodyFns>();
export function bodyFns(b: BodySpec): BodyFns {
  let f = fnCache.get(b);
  if (!f) {
    const st = pchip(b.top), sb = pchip(b.bot), sw = pchip(b.width);
    const capf = (t: number) => (b.cap > 0 && t < b.cap ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / b.cap, 2))) : 1);
    f = {
      top: (t) => b.snoutY + (st(t) - b.snoutY) * capf(t),
      bot: (t) => b.snoutY + (sb(t) - b.snoutY) * capf(t),
      w: (t) => sw(t) * Math.pow(capf(t), 0.8),
    };
    fnCache.set(b, f);
  }
  return f;
}

export const tOfX = (b: BodySpec, x: number) => (x - b.xs) / (b.xe - b.xs);
export const xOfT = (b: BodySpec, t: number) => b.xs + (b.xe - b.xs) * t;
export const yTop = (b: BodySpec, x: number) => bodyFns(b).top(Math.min(1, Math.max(0, tOfX(b, x))));
export const yBot = (b: BodySpec, x: number) => bodyFns(b).bot(Math.min(1, Math.max(0, tOfX(b, x))));

const sgnPow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

/** Gövde yüzeyinde nokta: t boyuna (0..1), a kesit açısı (a=π/2 sırt çizgisi, 3π/2 karın, a=0 +z yanı) */
export function bodyPoint(b: BodySpec, t: number, a: number): Vec3 {
  const f = bodyFns(b);
  const top = f.top(t), bot = f.bot(t), w = f.w(t);
  const yc = (top + bot) / 2, h = (top - bot) / 2;
  const e = 2 / b.n;
  return [xOfT(b, t), yc + h * sgnPow(Math.sin(a), e), w * sgnPow(Math.cos(a), e)];
}

/** (x, y) noktasında +z yan yüzeyinin z'si; gövde dışındaysa 0 */
export function bodySurfaceZ(b: BodySpec, x: number, y: number): number {
  const t = Math.min(1, Math.max(0, tOfX(b, x)));
  const f = bodyFns(b);
  const top = f.top(t), bot = f.bot(t), w = f.w(t);
  const h = (top - bot) / 2;
  if (h <= 1e-6) return 0;
  const u = Math.min(1, Math.abs((y - (top + bot) / 2) / h));
  return w * Math.pow(Math.max(0, 1 - Math.pow(u, b.n)), 1 / b.n);
}

/** Yan yüzeyde dışa bakan yaklaşık birim normal (+z yanı için) */
export function flankNormal(b: BodySpec, x: number, y: number): Vec3 {
  const e = 0.01;
  const dzx = (bodySurfaceZ(b, x + e, y) - bodySurfaceZ(b, x - e, y)) / (2 * e);
  const dzy = (bodySurfaceZ(b, x, y + e) - bodySurfaceZ(b, x, y - e)) / (2 * e);
  const l = Math.hypot(dzx, dzy, 1);
  return [-dzx / l, -dzy / l, 1 / l];
}

/** Gövde (sırt/karın kenarı) çizgisini kapalı çokgen olarak verir (SVG ve doku kırpması için) */
export function outline(b: BodySpec, n = 64): Pt[] {
  const f = bodyFns(b);
  const up: Pt[] = [], dn: Pt[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n; up.push([xOfT(b, t), f.top(t)]); dn.push([xOfT(b, t), f.bot(t)]); }
  return [...up, ...dn.reverse()];
}

// ------------------------------------------------------------------ yüzgeçler

export interface FinSpec {
  id: 'sirt' | 'anal' | 'kuyruk';
  /** Taban ve uç çizgisi: aynı sayıda nokta; ışınlar base[i] -> edge[i] */
  base: Pt[]; edge: Pt[];
  /** Zar dalgalanması (z) ve yüzerken uç çırpınması (0..1) */
  ripple: number; flutter: number;
}

export interface PairedFinSpec { base: Pt[]; edge: Pt[] }

export interface FilamentSpec {
  /** x,y yolu (kökten uca), yarıçaplar kökten uca */
  path: Pt[]; radii: number[]; z: number;
}

export interface FishSpec {
  body: BodySpec;
  /** Dokunun kapladığı x,y aralığı (yan görünüş atlas) */
  atlas: { x0: number; x1: number; y0: number; y1: number };
  swim: { x0: number; x1: number; amp: number; k: number; speed: number };
  eye: { x: number; y: number; r: number };
  fins: FinSpec[];
  pectoral: PairedFinSpec;
  filaments: FilamentSpec[];
  mouth: Pt[];
  gill: Pt[];
  nostril: Pt;
  lateral: Pt[];
}

/** s in [0,1] boyunca fin üzerinde nokta: r=0 taban, r=1 uç */
export function finPoint(f: { base: Pt[]; edge: Pt[] }, s: number, r: number): Pt {
  const n = f.base.length - 1;
  const fi = Math.min(n - 1e-9, Math.max(0, s * n));
  const i = Math.floor(fi), k = fi - i;
  const bx = f.base[i][0] + (f.base[i + 1][0] - f.base[i][0]) * k, by = f.base[i][1] + (f.base[i + 1][1] - f.base[i][1]) * k;
  const ex = f.edge[i][0] + (f.edge[i + 1][0] - f.edge[i][0]) * k, ey = f.edge[i][1] + (f.edge[i + 1][1] - f.edge[i][1]) * k;
  return [bx + (ex - bx) * r, by + (ey - by) * r];
}

export const finOutline = (f: { base: Pt[]; edge: Pt[] }): Pt[] => [...f.base, ...f.edge.slice().reverse()];

/** Sırt/karın kenarına oturan, kenardan dışa doğru h(s) kadar uzanan uzun taban yüzgeci (diskus gibi) */
export function ridgeFin(b: BodySpec, id: 'sirt' | 'anal', t0: number, t1: number, cx: number, h: (s: number) => number, lean: number, n = 28): { base: Pt[]; edge: Pt[] } {
  const f = bodyFns(b);
  const base: Pt[] = [], edge: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, t = t0 + (t1 - t0) * s;
    const x = xOfT(b, t), y = id === 'sirt' ? f.top(t) : f.bot(t);
    const dx = x - cx, dy = y, l = Math.hypot(dx, dy) || 1;
    base.push([x, y]);
    edge.push([x + (dx / l) * h(s) + lean * h(s), y + (dy / l) * h(s)]);
  }
  return { base, edge };
}

/** Yay uzunluğuna göre çizgi: taban `ridge` noktaları, uç `outlinePath` üzerinde aynı s ile (üçgen yüzgeçler) */
export function triFin(ridge: Pt[], outlinePath: Pt[], n = 30): { base: Pt[]; edge: Pt[] } {
  return { base: resample(ridge, n), edge: resample(outlinePath, n) };
}

// ------------------------------------------------------------------ yüzme dalgası (CPU yansıması; gölgelendirici ile aynı)

export function swimZ(sw: FishSpec['swim'], x: number, time: number, amp: number): number {
  const w = Math.pow(Math.min(1, Math.max(0, (x - sw.x0) / (sw.x1 - sw.x0))), 1.6);
  return amp * sw.amp * w * Math.sin(x * sw.k - time * sw.speed);
}

// ------------------------------------------------------------------ doku eşlemesi

export const atlasUV = (a: FishSpec['atlas'], x: number, y: number): Pt => [(x - a.x0) / (a.x1 - a.x0), (a.y1 - y) / (a.y1 - a.y0)];

// ------------------------------------------------------------------ varyete türleri (türden bağımsız)

/** Desen katmanları. Konumlar gövdeye oturur: nx = burundan kuyruk sapına 0..1; ny = sırttan karına 0..1. */
export type Layer =
  | { t: 'bar'; nx: number; w: number; renk: string; a: number; fin?: boolean; ny?: [number, number]; slant?: number; soft?: number }
  | { t: 'spot'; n: number; r: [number, number]; renk: string; a: number; nx: [number, number]; ny: [number, number]; halka?: string; fin?: boolean }
  | { t: 'blotch'; n: number; r: [number, number]; renk: string; a: number; nx: [number, number]; ny: [number, number]; fin?: boolean }
  | { t: 'streak'; n: number; len: [number, number]; w: [number, number]; renk: string; a: number; nx: [number, number]; ny: [number, number]; wave: number; fin?: boolean }
  | { t: 'cells'; renk: string; a: number; size: number; nx: [number, number]; ny: [number, number]; w?: number }
  | { t: 'wash'; nx: [number, number]; ny: [number, number]; renk: string; a: number };

export interface FishVariant {
  id: string;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  /** Gövde rengi: sırt, orta, karın */
  govde: { sirt: string; orta: string; karin: string };
  /** Yüzgeç: zar rengi, ışın rengi, zar saydamlığı (0..1) */
  yuzgec: { renk: string; isin: string; a: number };
  /** Karın yüzgeci iplikleri */
  iplik: string;
  goz: { iris: string; halka: string; pupil: string };
  katmanlar: Layer[];
  /** 0..1 parlaklık; 0..1 metalik yansıma */
  parlak?: number;
  /** İnci pullu: kabarık pul noktaları */
  inci?: boolean;
}

export type FishSex = 'erkek' | 'disi';

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255];
}

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

export function seedFor(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function groupedVariants<V extends { grup: string }>(vs: V[], groups: readonly string[]): { grup: string; items: V[] }[] {
  return groups.map((g) => ({ grup: g, items: vs.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}

// ------------------------------------------------------------------ parça bağlantı noktaları (türden bağımsız tür)

export interface Anchor {
  pos: Vec3;
  /** Yüzeye dik yön (+z yanı için); null = her yönden görünür */
  normal: Vec3 | null;
  /** z işareti, kameranın bulunduğu yana yansıtılır */
  mirror: boolean;
  /** Yüzme dalgası için gerçek x (pos[0]) kullanılır */
  swim: boolean;
}

export function flankAnchor(b: BodySpec, x: number, y: number, off = 0.012): Anchor {
  const n = flankNormal(b, x, y);
  const z = bodySurfaceZ(b, x, y) + off;
  return { pos: [x, y, z], normal: n, mirror: true, swim: true };
}

export function midAnchor(x: number, y: number, normal: Vec3 | null = null): Anchor {
  return { pos: [x, y, 0], normal, mirror: false, swim: true };
}

// ------------------------------------------------------------------ SVG yedeği için siluet

export interface Silhouette {
  body: Pt[]; fins: Pt[][]; pectoral: Pt[]; filaments: Pt[][]; eye: { x: number; y: number; r: number }; mouth: Pt[]; gill: Pt[];
  bbox: { x0: number; x1: number; y0: number; y1: number };
}

export function silhouette(s: FishSpec): Silhouette {
  return {
    body: outline(s.body, 48),
    fins: s.fins.map((f) => finOutline(f)),
    pectoral: finOutline(s.pectoral),
    filaments: s.filaments.map((f) => f.path),
    eye: s.eye, mouth: s.mouth, gill: s.gill,
    bbox: s.atlas,
  };
}

/** Gövde, yüzgeç ve iplik uçlarını kapsayan atlas sınırı (form değişince geometri büyüyebilir) */
export function atlasFor(body: BodySpec, fins: FinSpec[], filaments: FilamentSpec[], pectoral: PairedFinSpec, margin = 0.04): FishSpec['atlas'] {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const take = (p: Pt) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
  outline(body, 24).forEach(take);
  for (const f of fins) { f.base.forEach(take); f.edge.forEach(take); }
  pectoral.base.forEach(take); pectoral.edge.forEach(take);
  for (const f of filaments) f.path.forEach(take);
  return { x0: x0 - margin, x1: x1 + margin, y0: y0 - margin, y1: y1 + margin };
}
