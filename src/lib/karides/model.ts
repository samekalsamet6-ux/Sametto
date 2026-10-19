// Neocaridina karidesi (N. davidi, "cherry shrimp" grubu; şematik) 3B modeli için SAF geometri/hareket parametreleri.
// DOM ve three.js kullanılmaz: böylece birim testlenebilir, SVG yedeği de aynı sayılardan üretilir.
//
// Koordinatlar (karapaks yerel çerçevesi): x gövde ekseni (baş/rostrum -x, kuyruk +x), y yukarı (sırt +y, karın -y), z yanal.
// Birim keyfidir (şematik model); gerçek ölçüm değildir. Karapaks uzunluğu ~0,8, tüm gövde (kuyruk yelpazesi dahil) ~2,3 birimdir.

export type Sex = 'erkek' | 'disi';
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const SEXES: readonly Sex[] = ['erkek', 'disi'];

export interface BodyParams {
  /** Genel ölçek (dişi daha büyük) */
  scale: number;
  /** Karın (pleon) genişlik ve yükseklik çarpanı: dişide daha yuvarlak */
  width: number;
  height: number;
  /** Plöron (karın yan plakası) taşma miktarı: dişide yumurtaları örtmek için daha dolgun */
  flare: number;
  /** Renk doygunluğu çarpanı (erkekler genelde daha soluk) */
  colour: number;
}

export const BODY: Record<Sex, BodyParams> = {
  disi: { scale: 1.14, width: 1.13, height: 1.1, flare: 1.0, colour: 1.0 },
  erkek: { scale: 0.9, width: 0.86, height: 0.88, flare: 0.5, colour: 0.82 },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

// ------------------------------------------------------------------ karapaks

export const CARAPACE = { x0: -0.4, len: 0.78, ry: 0.27, rz: 0.245 };
/** Karın birinci halkasının eklem noktası (karapaks yerel çerçevesinde) */
export const PLEON_PIVOT: Vec3 = [0.33, -0.015, 0];

export interface Ring { cx: number; cy: number; ry: number; rz: number }

/** Karapaksın u (0 = baş ucu, 1 = arka kenar) konumundaki kesit yarıçapları */
export function carapaceRing(sex: Sex, u: number, b: BodyParams = BODY[sex]): Ring {
  const prof = (0.3 + 0.7 * Math.pow(Math.sin(clamp(u / 0.6, 0, 1) * Math.PI / 2), 0.75)) * (1 - 0.1 * smooth((u - 0.7) / 0.3));
  return {
    cx: CARAPACE.x0 + CARAPACE.len * u,
    cy: 0.05 * (1 - u) - 0.01,
    ry: CARAPACE.ry * prof * Math.sqrt(b.height),
    rz: CARAPACE.rz * prof * Math.sqrt(b.width),
  };
}

// ------------------------------------------------------------------ karın (pleon)

export const SEG = {
  count: 6,
  len: [0.19, 0.21, 0.22, 0.21, 0.19, 0.21],
  ry: [0.2, 0.215, 0.22, 0.19, 0.15, 0.115],
  rz: [0.2, 0.215, 0.215, 0.185, 0.14, 0.105],
};
/** Dinlenme duruşunda eklem açıları (rad, z ekseni; + = yukarı). 6 halka + telson. Kuyruk yavaşça aşağı kıvrılır. */
export const REST_ANGLES = [0.12, 0.05, -0.1, -0.2, -0.24, -0.12, 0.0];
export const TELSON = { len: 0.26, halfWidth: 0.085 };
export const UROPOD = { len: 0.36, halfWidth: 0.115, spread: 0.34 };

/** Halka kesiti içindeki u konumunda yarıçaplar; plöron dolgunluğu cinsiyete bağlı */
export function segRing(sex: Sex, i: number, u: number, b: BodyParams = BODY[sex]): Ring {
  const groove = 1 - 0.07 * Math.exp(-Math.pow(u / 0.06, 2));
  const taper = 1 - 0.07 * u;
  return {
    cx: SEG.len[i] * u,
    cy: 0,
    ry: SEG.ry[i] * b.height * groove * taper,
    rz: SEG.rz[i] * b.width * groove * taper,
  };
}

/** Kesit çevresinde θ açısına karşılık gelen (y, z): alt yarıda yanlara taşan plöron */
export function ringYZ(theta: number, ry: number, rz: number, flare: number): Vec2 {
  const s = Math.sin(theta), c = Math.cos(theta);
  if (s >= 0) return [ry * s, rz * c];
  return [ry * s * (1 - 0.16 * flare), rz * c * (1 + 0.12 * flare * -s)];
}

// ------------------------------------------------------------------ hareket

export const ANIM = {
  /** Hareket açık: genlik çarpanı */
  amp: 1,
  curlFreq: 1.5,
  pleoFreq: 6.5,
  antFreq: 1.1,
};

/** Karın eklem açısı (i = 0..6; 6 = telson eklemi): dinlenme + yavaş kıvrılma dalgası */
export function jointAngle(i: number, t: number, amp: number): number {
  const w = 0.35 + 0.16 * i;
  const wave = 0.13 * Math.sin(t * ANIM.curlFreq - i * 0.6) * w + 0.07 * Math.sin(t * 0.55) * (i === 0 ? 0.3 : 1);
  return REST_ANGLES[i] + amp * wave;
}

/** Yüzme bacağı (pleopod) açısı: kıç yönüne yatık dinlenme + art arda (metakronal) çırpma */
export function pleopodAngle(i: number, t: number, amp: number): number {
  return 0.3 + amp * 0.5 * Math.sin(t * ANIM.pleoFreq - i * 0.95);
}

/** Anten halkası k (0..n-1) için ek yunuslama/sapma (rad) */
export function antennaSway(k: number, n: number, t: number, amp: number, phase: number): Vec2 {
  const f = (k + 1) / n;
  return [amp * 0.08 * f * Math.sin(t * ANIM.antFreq * 1.3 + phase - k * 0.35), amp * 0.1 * f * Math.sin(t * ANIM.antFreq + phase * 1.7 - k * 0.5)];
}

// ------------------------------------------------------------------ yürüme bacakları (pereiopod)

export interface LegSpec {
  /** Karapaks altında x konumu */
  x: number;
  /** Öne (>0) ya da arkaya (<0) doğru yatma (rad) */
  fwd: number;
  links: number[];
  /** Halka başına dinlenme eğimi (rad, yerel z) */
  pitch: number[];
  chela: boolean;
}

export const LEGS: LegSpec[] = [
  { x: -0.2, fwd: 0.75, links: [0.1, 0.12, 0.1, 0.08], pitch: [-0.35, -0.3, -0.3, -0.1], chela: true },
  { x: -0.09, fwd: 0.55, links: [0.11, 0.13, 0.11, 0.09], pitch: [-0.35, -0.3, -0.3, -0.1], chela: true },
  { x: 0.03, fwd: 0.2, links: [0.13, 0.17, 0.15, 0.13], pitch: [-0.4, -0.4, -0.4, -0.1], chela: false },
  { x: 0.15, fwd: -0.15, links: [0.13, 0.17, 0.15, 0.13], pitch: [-0.4, -0.4, -0.4, -0.1], chela: false },
  { x: 0.26, fwd: -0.5, links: [0.13, 0.17, 0.15, 0.13], pitch: [-0.4, -0.4, -0.4, -0.1], chela: false },
];
export const LEG_Y = -0.2;
export const LEG_Z = 0.1;

// ------------------------------------------------------------------ yumurtalar

/** Karın halkası i'nin altında (halka yerel çerçevesi) yumurta kümesi; deterministik */
export function eggPositions(i: number, n = 9): { p: Vec3; r: number }[] {
  const out: { p: Vec3; r: number }[] = [];
  let s = 1234 + i * 977;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let k = 0; k < n; k++) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
    out.push({
      p: [SEG.len[i] * (0.5 + 0.38 * Math.cos(a) * rr), -SEG.ry[i] * 0.86 - 0.02 - 0.03 * rr * Math.abs(Math.sin(a)), 0.1 * Math.sin(a) * rr * (rnd() > 0.5 ? 1 : 1)],
      r: 0.036 + rnd() * 0.008,
    });
  }
  return out;
}

// ------------------------------------------------------------------ düz kinematik (yandan)

export interface SegFrame { x: number; y: number; ang: number }

/** Her karın halkasının başlangıç noktası ve toplam açısı (karapaks çerçevesinde, 2B yandan görünüş). Son öğe telson. */
export function spineFrames(sex: Sex, angles: number[] = REST_ANGLES): SegFrame[] {
  void sex;
  const out: SegFrame[] = [];
  let x = PLEON_PIVOT[0], y = PLEON_PIVOT[1], ang = 0;
  for (let i = 0; i <= SEG.count; i++) {
    ang += angles[i];
    out.push({ x, y, ang });
    const len = i < SEG.count ? SEG.len[i] : TELSON.len;
    x += Math.cos(ang) * len;
    y += Math.sin(ang) * len;
  }
  return out;
}

/** Halka yerel (x,y) noktasını karapaks çerçevesine çevirir */
export function toBody(f: SegFrame, lx: number, ly: number): Vec2 {
  const c = Math.cos(f.ang), s = Math.sin(f.ang);
  return [f.x + lx * c - ly * s, f.y + lx * s + ly * c];
}

// ------------------------------------------------------------------ SVG yedeği için yandan siluet

export interface Silhouette {
  carapace: Vec2[];
  segments: Vec2[][];
  telson: Vec2[];
  uropod: Vec2[];
  rostrum: Vec2[];
  eye: { x: number; y: number; r: number };
  antennae: Vec2[][];
  legs: Vec2[][];
  pleopods: Vec2[][];
  eggs: { x: number; y: number; r: number }[];
}

export function silhouette(sex: Sex, b: BodyParams = BODY[sex]): Silhouette {
  const N = 14;
  const cp: Vec2[] = [];
  for (let k = 0; k <= N; k++) { const r = carapaceRing(sex, k / N, b); cp.push([r.cx, r.cy + r.ry]); }
  for (let k = N; k >= 0; k--) { const r = carapaceRing(sex, k / N, b); cp.push([r.cx, r.cy - r.ry]); }
  const frames = spineFrames(sex);
  const segments: Vec2[][] = [];
  for (let i = 0; i < SEG.count; i++) {
    const top: Vec2[] = [], bot: Vec2[] = [];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6, r = segRing(sex, i, u, b);
      top.push(toBody(frames[i], r.cx, r.ry));
      bot.push(toBody(frames[i], r.cx, -r.ry * (1 - 0.16 * b.flare)));
    }
    segments.push([...top, ...bot.reverse()]);
  }
  const tf = frames[SEG.count];
  const telson: Vec2[] = [toBody(tf, 0, 0.07), toBody(tf, TELSON.len * 0.8, 0.035), toBody(tf, TELSON.len, 0), toBody(tf, TELSON.len * 0.8, -0.035), toBody(tf, 0, -0.07)];
  const uf = frames[SEG.count - 1];
  const ue = toBody(uf, SEG.len[5], 0);
  const ua = uf.ang + REST_ANGLES[SEG.count];
  const uropod: Vec2[] = [];
  for (let k = 0; k <= 8; k++) {
    const u = k / 8, w = UROPOD.halfWidth * Math.sin(Math.PI * Math.pow(u, 0.7));
    uropod.push([ue[0] + Math.cos(ua) * UROPOD.len * u - Math.sin(ua) * w, ue[1] + Math.sin(ua) * UROPOD.len * u + Math.cos(ua) * w]);
  }
  const x0 = CARAPACE.x0;
  const rostrum: Vec2[] = [[x0 + 0.02, 0.1], [x0 - 0.1, 0.17], [x0 - 0.32, 0.2], [x0 - 0.3, 0.15], [x0 - 0.1, 0.08], [x0 + 0.02, 0.0]];
  const antennae: Vec2[][] = [
    [[x0 + 0.04, 0.0], [x0 - 0.25, 0.1], [x0 - 0.7, 0.05], [x0 - 1.1, -0.1]],
    [[x0 + 0.04, 0.03], [x0 - 0.2, 0.2], [x0 - 0.4, 0.28], [x0 - 0.55, 0.3]],
  ];
  const legs: Vec2[][] = LEGS.map((l) => {
    const pts: Vec2[] = [[l.x, LEG_Y]];
    let a = 0, x = l.x, y = LEG_Y;
    l.links.forEach((len, k) => {
      a += l.pitch[k];
      // yandan görünüşte bacak aşağı ve öne doğru yayılır: yaklaşık izdüşüm
      x += Math.sin(l.fwd) * len * Math.cos(a) * -1;
      y += Math.sin(a) * len * 0.85;
      pts.push([x, y]);
    });
    return pts;
  });
  const pleopods: Vec2[][] = [];
  for (let i = 0; i < 5; i++) pleopods.push([toBody(frames[i], SEG.len[i] * 0.5, -SEG.ry[i] * 0.9), toBody(frames[i], SEG.len[i] * 0.5 + 0.06, -SEG.ry[i] * 0.9 - 0.12)]);
  const eggs: { x: number; y: number; r: number }[] = [];
  if (sex === 'disi') for (let i = 1; i <= 3; i++) for (const e of eggPositions(i, 6)) { const q = toBody(frames[i], e.p[0], e.p[1]); eggs.push({ x: q[0], y: q[1], r: e.r }); }
  return { carapace: cp, segments, telson, uropod, rostrum, eye: { x: x0 + 0.03, y: 0.03, r: 0.055 }, antennae, legs, pleopods, eggs };
}

export { clamp, lerp, smooth };
