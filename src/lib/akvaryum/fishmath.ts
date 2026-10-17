// Balık modelleri için ortak SAF geometri/renk yardımcıları (DOM ve three.js yok; birim testlenir).
// Koordinatlar: x gövde ekseni (burun -x, kuyruk sapı +x), y yukarı, z yanal (+z: kameranın "yan" görünümde baktığı yan).
// Birim keyfidir: gövde uzunluğu (burun ucu - kuyruk sapı ucu) 1 birimdir. Bu şematik bir modeldir, gerçek ölçüm değildir.
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Rgb = [number, number, number];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

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

export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function rgbToHex(c: Rgb): string {
  return '#' + c.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
}
export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const mixHex = (a: string, b: string, t: number): string => rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t));
export const luma = (hex: string): number => { const c = hexToRgb(hex); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

/** Tek biçimli (monoton) kübik ara değer: taşma yapmadan düzgün eğri */
export function spline(knots: [number, number][]): (x: number) => number {
  const n = knots.length;
  const xs = knots.map((k) => k[0]), ys = knots.map((k) => k[1]);
  const d = new Array<number>(n - 1), m = new Array<number>(n).fill(0);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = Math.hypot(a, b);
    if (h > 3) { m[i] = (3 * a / h) * d[i]; m[i + 1] = (3 * b / h) * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ------------------------------------------------------------------ gövde

export interface BodyShape {
  /** s: 0 (burun) .. 1 (kuyruk sapı ucu). Gövde üst/alt çizgisi (alt negatif) ve yarı genişlik */
  top: (s: number) => number;
  bot: (s: number) => number;
  hw: (s: number) => number;
  /** Kesit süper elips üsleri (2 = elips; büyüdükçe köşeli/düz) */
  nTop?: (s: number) => number;
  nBot?: (s: number) => number;
  /** Burun yuvarlama uzunluğu (s birimi) */
  nose?: number;
}

export interface Section { s: number; x: number; yTop: number; yBot: number; hw: number; nTop: number; nBot: number }

export interface Body { L: number; shape: BodyShape; section(s: number): Section }

export function makeBody(L: number, shape: BodyShape): Body {
  const s0 = shape.nose ?? 0.07;
  return {
    L, shape,
    section(s: number): Section {
      const ss = clamp(s, 0, 1);
      const cap = ss < s0 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - ss / s0, 2))) : 1;
      const top = shape.top(ss), bot = shape.bot(ss);
      const cy = (top + bot) / 2, ry = ((top - bot) / 2) * cap;
      return { s: ss, x: (ss - 0.5) * L, yTop: cy + ry, yBot: cy - ry, hw: shape.hw(ss) * cap, nTop: shape.nTop?.(ss) ?? 2, nBot: shape.nBot?.(ss) ?? 2 };
    },
  };
}

const sgnPow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

/** Kesit üzerindeki nokta: phi = 0 sırt orta çizgisi, π/2 = +z yan, π karın orta çizgisi, 3π/2 = −z yan */
export function sectionPoint(sec: Section, phi: number): Vec3 {
  const c = Math.cos(phi), s = Math.sin(phi);
  const n = c >= 0 ? sec.nTop : sec.nBot;
  const cy = (sec.yTop + sec.yBot) / 2, ry = (sec.yTop - sec.yBot) / 2;
  return [sec.x, cy + ry * sgnPow(c, 2 / n), sec.hw * sgnPow(s, 2 / n)];
}

export const bodyPoint = (b: Body, s: number, phi: number): Vec3 => sectionPoint(b.section(s), phi);

const sub = (a: Vec3, c: Vec3): Vec3 => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
const cross = (a: Vec3, c: Vec3): Vec3 => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
export const norm3 = (v: Vec3): Vec3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/** Gövde yüzeyinde (s, phi) noktası, dışa doğru birim normal ve isteğe bağlı dış ofset */
export function surfaceAt(b: Body, s: number, phi: number, off = 0): { pos: Vec3; normal: Vec3 } {
  const ss = clamp(s, 0.004, 0.996), e = 0.004;
  const p = bodyPoint(b, ss, phi);
  const ts = sub(bodyPoint(b, ss + e, phi), bodyPoint(b, ss - e, phi));
  const tp = sub(bodyPoint(b, ss, phi + e), bodyPoint(b, ss, phi - e));
  let n = norm3(cross(tp, ts));
  const sec = b.section(ss), cy = (sec.yTop + sec.yBot) / 2;
  if (n[0] * 0 + n[1] * (p[1] - cy) + n[2] * p[2] < 0) n = [-n[0], -n[1], -n[2]];
  if (Math.abs(p[1] - cy) < 1e-6 && Math.abs(p[2]) < 1e-6) n = [0, Math.cos(phi), Math.sin(phi)];
  return { pos: [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off], normal: n };
}

/** Gövde üzerinde s aralığında bir boylamsal çizgi (yüzgeç kökü vb.); inset > 0 gövdenin içine gömer */
export function lineOnBody(b: Body, s0: number, s1: number, phi: number, n: number, inset = 0): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const s = lerp(s0, s1, n === 1 ? 0 : i / (n - 1));
    const r = surfaceAt(b, s, phi, -inset);
    out.push(phi % Math.PI === 0 ? [r.pos[0], r.pos[1], 0] : r.pos);
  }
  return out;
}

/** Yan görünüş siluetinin çokgeni (sırttan başlayıp karından geri dönen) */
export function bodyOutline(b: Body, n = 40): Vec2[] {
  const top: Vec2[] = [], bot: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const sec = b.section(i / n);
    top.push([sec.x, sec.yTop]); bot.push([sec.x, sec.yBot]);
  }
  return [...top, ...bot.reverse()];
}

// ------------------------------------------------------------------ yüzme

export const SWIM = { power: 1.7, wavenumber: 6.5, speed: 5.5, amp: 0.05, flex: 0.9 };
/** Gövde dalgası: s (0 burun..1+ kuyruk) için z ötelemesi. Gölgelendirici ile aynı formül. */
export const swimZ = (s: number, t: number, amp: number, flex = 0): number =>
  amp * (Math.pow(clamp(s, 0, 1.25), SWIM.power) + flex * SWIM.flex) * Math.sin(SWIM.wavenumber * clamp(s, 0, 1.25) - t * SWIM.speed);

// ------------------------------------------------------------------ yüzgeç

export interface FinDef {
  id: string;
  /** Kök çizgisi (gövdeye yapışma noktaları) ve uç çizgisi; aynı sayıda nokta (+z yan için) */
  base: Vec3[];
  tip: Vec3[];
  /** Çift ise karşı yan da (z işareti çevrilerek) çizilir */
  paired: boolean;
  /** Dalgalanma ağırlığı (0 = sabit) */
  flex: number;
  /** Köke dik bükülme (z) için satır eğrisi: v 0..1 */
  cup?: number;
}

export interface FinGrid { pos: number[]; uv: number[]; flex: number[]; idx: number[] }

export function finGrid(f: FinDef, side: 1 | -1 = 1, rows = 6): FinGrid {
  const n = f.base.length;
  const pos: number[] = [], uv: number[] = [], flex: number[] = [], idx: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      const b = f.base[i], t = f.tip[i];
      pos.push(lerp(b[0], t[0], v), lerp(b[1], t[1], v), (lerp(b[2], t[2], v) + (f.cup ?? 0) * Math.sin(v * Math.PI) * 0.5) * side);
      uv.push(n === 1 ? 0 : i / (n - 1), v);
      flex.push(f.flex * Math.pow(v, 1.3));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let r = 0; r < rows; r++) {
    const a = i * (rows + 1) + r, b = a + 1, c = a + rows + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  return { pos, uv, flex, idx };
}

/** Yüzgeç yan görünüş çokgeni (SVG yedeği için) */
export function finOutline(f: FinDef): Vec2[] {
  return [...f.base.map((p): Vec2 => [p[0], p[1]]), ...f.tip.map((p): Vec2 => [p[0], p[1]]).reverse()];
}

/** Kök noktaları verilen bir yüzgeci, her noktadan "yön × uzunluk" ile uca uzat */
export function fanFin(id: string, base: Vec3[], tipFn: (u: number, b: Vec3) => Vec3, opts: { paired?: boolean; flex?: number; cup?: number } = {}): FinDef {
  const n = base.length;
  return { id, base, tip: base.map((b, i) => tipFn(n === 1 ? 0 : i / (n - 1), b)), paired: opts.paired ?? false, flex: opts.flex ?? 0.4, cup: opts.cup };
}

// ------------------------------------------------------------------ SVG yedeği

export interface Silhouette { body: Vec2[]; fins: { id: string; pts: Vec2[] }[]; eye: { c: Vec2; r: number } }

export function svgFigure(sil: Silhouette): { vb: string; body: string; fins: { id: string; d: string }[]; eye: { cx: number; cy: number; r: number } } {
  const all = [...sil.body, ...sil.fins.flatMap((f) => f.pts)];
  const minX = Math.min(...all.map((p) => p[0])) - 0.04, maxX = Math.max(...all.map((p) => p[0])) + 0.04;
  const minY = Math.min(...all.map((p) => p[1])) - 0.04, maxY = Math.max(...all.map((p) => p[1])) + 0.04;
  const path = (pts: Vec2[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)},${(-p[1]).toFixed(3)}`).join(' ') + ' Z';
  return {
    vb: `${minX.toFixed(3)} ${(-maxY).toFixed(3)} ${(maxX - minX).toFixed(3)} ${(maxY - minY).toFixed(3)}`,
    body: path(sil.body), fins: sil.fins.map((f) => ({ id: f.id, d: path(f.pts) })), eye: { cx: sil.eye.c[0], cy: -sil.eye.c[1], r: sil.eye.r },
  };
}
