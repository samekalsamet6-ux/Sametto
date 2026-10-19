// Lepistesin (Poecilia reticulata) 3B modeli için SAF geometri parametreleri.
// DOM ve three.js kullanılmaz: böylece birim testlenebilir, SVG yedeği de aynı sayılardan üretilir.
//
// Koordinatlar: x gövde ekseni (burun -x, kuyruk +x), y yukarı, z yanal (kamera varsayılan olarak +z'den bakar).
// Birim keyfidir (şematik model); gerçek ölçüm değildir.

import { bodyShape, flankProfile, mouthStation, type BodyShape } from '../livebearer/body';
import { EYE_DEPTH } from '../livebearer/model';

export { EYE_DEPTH };

export type Sex = 'erkek' | 'disi';
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const SEXES: readonly Sex[] = ['erkek', 'disi'];

export interface BodyParams {
  /** Burun ucundan kuyruk sapı sonuna uzunluk */
  length: number;
  /** En derin yerdeki toplam gövde yüksekliği */
  height: number;
  /** En geniş yerdeki toplam gövde genişliği (yanlar arası) */
  width: number;
  /** En yüksek kesitin gövde boyunca konumu (0..1) */
  peak: number;
  /** Kuyruk sapı yüksekliğinin tepe yüksekliğine oranı */
  peduncle: number;
  /** Karın şişkinliği (dişide belirgin) */
  belly: number;
  bellyAt: number;
  bellySpread: number;
  /** Göz yarıçapı */
  eye: number;
  /** Doğal gövde ince ayarı (bkz. livebearer/body.ts) */
  shape?: Partial<BodyShape>;
}

export const BODY: Record<Sex, BodyParams> = {
  erkek: { length: 2.7, height: 0.62, width: 0.4, peak: 0.36, peduncle: 0.3, belly: 0.03, bellyAt: 0.55, bellySpread: 0.2, eye: 0.098, shape: { nape: 0.07, back: 0.02, throat: 0.09, snout: 0.7, gill: 0.035, flank: 0.1, ridge: 0.14 } },
  disi: { length: 3.1, height: 0.96, width: 0.66, peak: 0.45, peduncle: 0.28, belly: 0.3, bellyAt: 0.55, bellySpread: 0.2, eye: 0.112, shape: { nape: 0.06, back: 0.05, throat: 0.08, snout: 0.6, gill: 0.04, flank: 0.12, ridge: 0.16 } },
};

/** Gövde kesit zarfı: t=0 burun, t=1 kuyruk sapı sonu; 0..1 arası ölçek. */
export function envelope(sex: Sex, t: number): number {
  const p = BODY[sex];
  if (t <= 0 || t >= 1) return 0;
  let f: number;
  if (t < p.peak) {
    f = Math.pow(Math.sin((t / p.peak) * Math.PI * 0.5), 0.6);
  } else {
    const k = Math.pow((t - p.peak) / (1 - p.peak), 0.85);
    f = p.peduncle + (1 - p.peduncle) * 0.5 * (1 + Math.cos(Math.PI * k));
  }
  // yuvarlak kuyruk sapı kapanışı: son %5'te dairesel daralma (düz kapak görünümü olmasın)
  if (t > 0.95) f *= Math.sqrt(Math.max(0, 1 - ((t - 0.95) / 0.05) ** 2));
  return f;
}

export interface Profile {
  /** Merkez çizgisinin y konumu */
  cy: number;
  /** Merkezden sırta yarı yükseklik */
  up: number;
  /** Merkezden karına yarı yükseklik */
  down: number;
  /** Yarı genişlik */
  rz: number;
}

export function bodyProfile(sex: Sex, t: number): Profile {
  const p = BODY[sex];
  const e = envelope(sex, t);
  const half = p.height / 2;
  const bump = Math.exp(-(((t - p.bellyAt) / p.bellySpread) ** 2));
  // Ağız hafif yukarı bakar (üst konumlu ağız): baş bölgesinde merkez çizgisi yukarı kayar.
  const lift = half * 0.16 * Math.pow(Math.max(0, 1 - t / 0.2), 1.6);
  const sh = bodyShape(t, p.shape);
  return {
    cy: lift,
    up: half * e * sh.up,
    down: half * e * (1 + p.belly * bump * 1.6) * sh.down,
    rz: (p.width / 2) * Math.pow(e, 0.95) * (1 + 0.25 * p.belly * bump) * (1 + 0.32 * Math.exp(-(((t - 0.13) / 0.09) ** 2))) * sh.w,
  };
}

export const bodyX = (sex: Sex, t: number): number => (t - 0.5) * BODY[sex].length;

/**
 * Gövde yüzeyinde nokta. a: halka açısı; 0 = karın orta çizgisi, π/2 = +z yan, π = sırt, 3π/2 = -z yan.
 * offset > 0 ise yüzeyden dışarı (yaklaşık dik) kaydırır.
 */
export function bodySurfacePoint(sex: Sex, t: number, a: number, offset = 0): Vec3 {
  const pr = bodyProfile(sex, t);
  const mid = (pr.up + pr.down) / 2;
  const off = (pr.up - pr.down) / 2;
  const c = Math.cos(a);
  const y = pr.cy + off - c * (mid + offset);
  const z = pr.rz * flankProfile(a, BODY[sex].shape) + offset * Math.sin(a);
  return [bodyX(sex, t), y, z];
}

// ---------------------------------------------------------------- yüzgeçler

export interface Fin {
  /** Her ışın, tabandan uca nokta dizisidir */
  rays: Vec3[][];
  /** Işın uçlarında dallanan ince ışınlar (yalnızca çizgi olarak çizilir) */
  branches: Vec3[][];
}

interface FanSpec {
  base: Vec3[];
  dir: Vec3[];
  len: number[];
  curl?: Vec3[];
  segments?: number;
  branch?: number; // 0 = dallanma yok; aksi halde dallanma u konumu
  tipSpread?: number;
}

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** Tabandan yelpaze gibi açılan ışınlar: P(u) = B + D·len·u + C·u² */
export function fanFin(s: FanSpec): Fin {
  const K = s.segments ?? 8;
  const rays: Vec3[][] = [];
  for (let i = 0; i < s.base.length; i++) {
    const b = s.base[i];
    const d = s.dir[i];
    const c = s.curl?.[i] ?? [0, 0, 0];
    const pts: Vec3[] = [];
    for (let k = 0; k <= K; k++) {
      const u = k / K;
      pts.push([b[0] + d[0] * s.len[i] * u + c[0] * u * u, b[1] + d[1] * s.len[i] * u + c[1] * u * u, b[2] + d[2] * s.len[i] * u + c[2] * u * u]);
    }
    rays.push(pts);
  }
  const branches: Vec3[][] = [];
  if (s.branch) {
    const kb = Math.round(K * s.branch);
    for (let i = 0; i < rays.length; i++) {
      const from = rays[i][kb];
      const tip = rays[i][K];
      const nb = rays[Math.min(rays.length - 1, i + 1)][K];
      const pb = rays[Math.max(0, i - 1)][K];
      const sp = s.tipSpread ?? 0.3;
      for (const nbTip of [nb, pb]) {
        const target: Vec3 = [tip[0] + (nbTip[0] - tip[0]) * sp, tip[1] + (nbTip[1] - tip[1]) * sp, tip[2] + (nbTip[2] - tip[2]) * sp];
        branches.push([from, [(from[0] + target[0]) / 2, (from[1] + target[1]) / 2, (from[2] + target[2]) / 2], target]);
      }
    }
  }
  return { rays, branches };
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface TailSpec { rays: number; reach: number; halfAngle: number; bulge: number }
export const TAIL: Record<Sex, TailSpec> = {
  erkek: { rays: 21, reach: 1.6, halfAngle: 33, bulge: 0.07 },
  disi: { rays: 15, reach: 0.9, halfAngle: 31, bulge: 0.14 },
};

export const TAIL_BASE_T = 0.955;

// ---------------------------------------------------------------- form (şekil) varyeteleri

export type FormId = string;
export const DEFAULT_FORM: FormId = 'standart';

/** Formun geometri belirtimi: kuyruk ışın uçlarını üreten işlev + diğer yüzgeç ölçekleri. Meta veri (ad, açıklama) forms.ts'te. */
export interface FormShape {
  /** Kuyruk ışın sayısı (yoksa cinsiyet varsayılanı) */
  rays?: number;
  /** Sırt yüzgeci uzunluk çarpanı */
  dorsal: number;
  /** Göğüs yüzgeci uzunluk çarpanı (fil kulak) */
  pectoral: number;
  /** Kuyrukta kılıç: yalnızca erkekte uzar */
  sword?: 'ust' | 'alt' | 'cift';
}

export const FORM_SHAPES: Record<string, FormShape> = {
  standart: { dorsal: 1, pectoral: 1 },
  dogal: { dorsal: 0.6, pectoral: 1, rays: 13 },
  delta: { dorsal: 1.15, pectoral: 1 },
  fantail: { dorsal: 0.9, pectoral: 1 },
  veiltail: { dorsal: 1.3, pectoral: 1 },
  lyretail: { dorsal: 1.1, pectoral: 1, rays: 25 },
  'kilic-ust': { dorsal: 1, pectoral: 1, rays: 31, sword: 'ust' },
  'kilic-alt': { dorsal: 1, pectoral: 1, rays: 31, sword: 'alt' },
  'kilic-cift': { dorsal: 1, pectoral: 1, rays: 31, sword: 'cift' },
  pintail: { dorsal: 0.9, pectoral: 1 },
  round: { dorsal: 0.85, pectoral: 1, rays: 19 },
  spade: { dorsal: 0.9, pectoral: 1, rays: 19 },
  flag: { dorsal: 1, pectoral: 1 },
  ribbon: { dorsal: 1.9, pectoral: 1 },
  dumbo: { dorsal: 1, pectoral: 2.4 },
};

export const formShape = (form?: FormId): FormShape => FORM_SHAPES[form ?? DEFAULT_FORM] ?? FORM_SHAPES[DEFAULT_FORM];
export const hasSword = (sex: Sex, form?: FormId): boolean => sex === 'erkek' && !!formShape(form).sword;

interface TailTip { dx: number; dy: number; cx?: number; cy?: number }
const tn = Math.tan;
const fanTip = (s: number, R: number, halfDeg: number, bulge: number): TailTip => {
  const dx = R * (1 + bulge * (1 - s * s));
  return { dx, dy: tn(rad(halfDeg) * s) * dx };
};
const smooth = (x: number) => Math.pow(Math.max(0, Math.min(1, x)), 1.4);

/** Işın ucunun, ışın tabanına göre konumu (s: -1 alt .. +1 üst). 'standart' özgün biçimle birebir aynıdır. */
function tailTip(form: FormId, sex: Sex, s: number): TailTip {
  const sp = TAIL[sex];
  const R = sp.reach;
  const w = Math.abs(s);
  const male = sex === 'erkek';
  switch (form) {
    case 'dogal': return fanTip(s, R * 0.5, 30, 0.14);
    case 'delta': return fanTip(s, R * 1.2, 41, 0.02);
    case 'fantail': return fanTip(s, R * 0.85, 36, 0.3);
    case 'veiltail': { const t = fanTip(s, R * 1.35, 26, 0.1); return { ...t, cy: -0.22 * t.dx * (1 - 0.3 * w) }; }
    case 'lyretail': {
      const dx = R * (0.5 + 1.0 * Math.pow(w, 2.2));
      return { dx, dy: tn(rad(30) * s) * dx, cy: -s * 0.24 * dx * w };
    }
    case 'kilic-ust': case 'kilic-alt': case 'kilic-cift': {
      const t = fanTip(s, R * 0.9, 30, 0.08);
      const sw = formShape(form).sword;
      const L = male ? 1.05 : 0;
      const gUp = sw === 'ust' || sw === 'cift' ? smooth(1 - (1 - s) / 0.16) : 0;
      const gDn = sw === 'alt' || sw === 'cift' ? smooth(1 - (1 + s) / 0.16) : 0;
      return { dx: t.dx + L * Math.max(gUp, gDn), dy: t.dy };
    }
    case 'pintail': return { dx: R * (0.45 + 0.85 * (1 - Math.pow(w, 1.4))), dy: R * 0.26 * s };
    case 'round': { const ph = rad(72) * s; return { dx: R * 0.95 * Math.cos(ph) + 0.05, dy: R * 0.7 * Math.sin(ph) }; }
    case 'spade': { const ph = rad(68) * s; return { dx: R * 0.85 * Math.cos(ph) + 0.4 * R * Math.exp(-((s / 0.2) ** 2)), dy: R * 0.6 * Math.sin(ph) }; }
    case 'flag': return { dx: R * 1.1 * (1 + 0.02 * (1 - s * s)), dy: R * 0.13 * s };
    case 'ribbon': { const t = fanTip(s, R * 1.9, 15, 0.06); return { dx: t.dx, dy: t.dy * 0.7, cy: -0.35 * t.dx * (1 - 0.5 * w) }; }
    default: return fanTip(s, R, sp.halfAngle, sp.bulge);
  }
}

/** Büyük kuyruk yüzgeci: biçimi `form` belirler (varsayılan: özgün delta benzeri kuyruk). */
export function tailFin(sex: Sex, form: FormId = DEFAULT_FORM): Fin {
  const sp = TAIL[sex];
  const n = formShape(form).rays ?? sp.rays;
  const pr = bodyProfile(sex, TAIL_BASE_T);
  const x0 = bodyX(sex, TAIL_BASE_T);
  const base: Vec3[] = [];
  const dir: Vec3[] = [];
  const len: number[] = [];
  const curl: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * 2 - 1;
    const y = pr.cy + s * 0.85 * (s > 0 ? pr.up : pr.down);
    const t = tailTip(form, sex, s);
    base.push([x0, y, 0]);
    const l = Math.hypot(t.dx, t.dy);
    dir.push([t.dx / l, t.dy / l, 0]);
    len.push(l);
    curl.push([t.cx ?? 0, t.cy ?? 0, 0]);
  }
  return fanFin({ base, dir, len, curl, segments: 22, branch: 0.62, tipSpread: 0.32 });
}

/** Kuyruk (ve kılıç) en uç x konumu: sınır ve test hesapları için */
export function tailReach(sex: Sex, form: FormId = DEFAULT_FORM): number {
  return Math.max(...tailFin(sex, form).rays.map((r) => r[r.length - 1][0])) - bodyX(sex, TAIL_BASE_T);
}

export interface DorsalSpec { t0: number; t1: number; rays: number; phiFront: number; phiRear: number; lenFront: number; lenRear: number }
export const DORSAL: Record<Sex, DorsalSpec> = {
  erkek: { t0: 0.4, t1: 0.57, rays: 12, phiFront: 80, phiRear: 34, lenFront: 0.5, lenRear: 1.05 },
  disi: { t0: 0.42, t1: 0.55, rays: 9, phiFront: 76, phiRear: 52, lenFront: 0.42, lenRear: 0.62 },
};

export function dorsalFin(sex: Sex, form: FormId = DEFAULT_FORM): Fin {
  const d = DORSAL[sex];
  const k = formShape(form).dorsal;
  const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
  for (let i = 0; i < d.rays; i++) {
    const f = i / (d.rays - 1);
    const phi = rad(lerp(d.phiFront, d.phiRear, f));
    const L = lerp(d.lenFront, d.lenRear, Math.pow(f, 0.8)) * k;
    base.push(bodySurfacePoint(sex, lerp(d.t0, d.t1, f), Math.PI, -0.03));
    dir.push([Math.cos(phi), Math.sin(phi), 0]);
    len.push(L);
    curl.push([0.06 * L, -0.1 * L * (k > 1.5 ? 2.2 : 1), 0]);
  }
  return fanFin({ base, dir, len, curl, segments: 16, branch: 0.7, tipSpread: 0.28 });
}

/** Dişide yelpaze biçimli anal yüzgeç. Erkekte yoktur: yerini gonopodium alır. */
export function analFin(sex: Sex): Fin | null {
  if (sex === 'erkek') return null;
  const n = 8;
  const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const phi = rad(lerp(-74, -34, f));
    const L = lerp(0.52, 0.3, f);
    base.push(bodySurfacePoint(sex, lerp(0.63, 0.72, f), 0, -0.03));
    dir.push([Math.cos(phi), Math.sin(phi), 0]);
    len.push(L);
    curl.push([0.05 * L, 0, 0]);
  }
  return fanFin({ base, dir, len, curl, segments: 7, branch: 0.7, tipSpread: 0.25 });
}

/** side: +1 = +z (kameraya bakan) yan, -1 = karşı yan */
export function pectoralFin(sex: Sex, side: 1 | -1, form: FormId = DEFAULT_FORM): Fin {
  const n = 9;
  const k = formShape(form).pectoral;
  const big = k > 1.2;
  const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const a = side > 0 ? 1.18 + 0.62 * f : 2 * Math.PI - (1.18 + 0.62 * f);
    const phi = big ? rad(lerp(42, -28, f)) : rad(lerp(48, -38, f));
    const L = (sex === 'erkek' ? 0.46 : 0.5) * (1 - 0.35 * Math.abs(f - 0.4) * 2) * k;
    base.push(bodySurfacePoint(sex, 0.292, a, -0.015));
    dir.push(norm([Math.cos(phi), Math.sin(phi) * 0.9, (big ? 0.7 : 0.34) * side]));
    len.push(L);
    curl.push([0.04 * k, -0.03 * k, 0.05 * side * k]);
  }
  return fanFin({ base, dir, len, curl, segments: 6 });
}

export function pelvicFin(sex: Sex, side: 1 | -1): Fin {
  const n = 5;
  const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
  const a = side > 0 ? 0.42 : 2 * Math.PI - 0.42;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const phi = rad(lerp(-78, -32, f));
    const L = lerp(0.3, 0.36, 1 - Math.abs(f - 0.5) * 2) * (sex === 'erkek' ? 1 : 0.95);
    base.push(bodySurfacePoint(sex, lerp(0.37, 0.41, f), a, -0.02));
    dir.push(norm([Math.cos(phi), Math.sin(phi), 0.28 * side]));
    len.push(L);
    curl.push([0.03, 0, 0]);
  }
  return fanFin({ base, dir, len, curl, segments: 5 });
}

export interface GonopodiumSpec { path: Vec3[]; radii: number[] }

/** Erkeğin anal yüzgecinden dönüşen çubuk biçimli üreme organı (uçta küçük kanca). */
export function gonopodium(sex: Sex): GonopodiumSpec | null {
  if (sex !== 'erkek') return null;
  // karın çizgisini izleyen çubuk: gövdeye yakın uzanır, ucu hafifçe aşağı kıvrılır (kanca)
  const dt = 0.62 / BODY[sex].length;
  const path: Vec3[] = [0, 0.2, 0.42, 0.64, 0.84, 1].map((f) => {
    const p = bodySurfacePoint(sex, 0.585 + dt * f, 0, -0.02 + 0.07 * Math.sin(f * Math.PI * 0.5));
    return [p[0], p[1] - 0.05 * f * f * f, 0] as Vec3;
  });
  return { path, radii: [0.04, 0.034, 0.026, 0.019, 0.013, 0.008] };
}

// ---------------------------------------------------------------- ağız, solungaç kapağı, göz

/** Solungaç kapağının arka kenarı: gövde yüzeyinde (t, a) çiftleri */
export const OPERCULUM_A: Vec2 = [0.8, 2.5];
export const operculumEdgeT = (a: number): number => 0.285 - 0.045 * ((a - 1.65) / 0.9) ** 2;
export function operculumEdge(n = 14): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const a = lerp(OPERCULUM_A[0], OPERCULUM_A[1], i / (n - 1));
    out.push([operculumEdgeT(a), a]);
  }
  return out;
}

/** Solungaç kapağı yamasının ön sınırı (göz çevresi) */
export const operculumFront = (a: number): number => 0.178 + 0.03 * ((a - 1.65) / 0.9) ** 2;

export interface EyeSpec { center: Vec3; normal: Vec3; radius: number }
export const EYE_T = 0.118;
export const EYE_A = Math.PI / 2 + 0.14;
export function eyeSpec(sex: Sex): EyeSpec {
  const R = BODY[sex].eye;
  const s = bodySurfacePoint(sex, EYE_T, EYE_A, -EYE_DEPTH * R);
  const pr = bodyProfile(sex, EYE_T);
  const axis: Vec3 = [s[0], pr.cy + (pr.up - pr.down) / 2, 0];
  const n = norm([s[0] - axis[0] - 0.22 * R, s[1] - axis[1], s[2] - axis[2]]);
  return { center: s, normal: n, radius: R };
}

/** Ağız halkasının orta konumu (t); gövde burada kesilir ve dudaklar bu halkaya oturur */
export const mouthT0 = (sex: Sex): number => mouthStation((t) => bodyProfile(sex, t).rz, BODY[sex].width);

/** Ağız yarığı: burundan geriye, yüzeyde iki yana uzanan eğri (her yan için nokta dizisi) */
export function mouthLine(sex: Sex, side: 1 | -1): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = 0.004 + (i / 6) * 0.052;
    const a = side > 0 ? 1.28 - 0.1 * (i / 6) : 2 * Math.PI - (1.28 - 0.1 * (i / 6));
    pts.push(bodySurfacePoint(sex, t, a, 0.004));
  }
  return pts;
}

// ---------------------------------------------------------------- yüzme dalgası

export const SWIM = { amp: 0.055, wavenumber: 3.2, speed: 5.0, flapSpeed: 9.0 };

/** Gövde boyunca yanal dalga: baş sabit, kuyruğa doğru artan genlik. GLSL ile aynı formül. */
export function swimOffsetZ(x: number, length: number, time: number, amp = SWIM.amp): number {
  const sw = Math.min(1.8, Math.max(0, x / length + 0.5));
  return amp * sw * sw * Math.sin(x * SWIM.wavenumber - time * SWIM.speed);
}

// ---------------------------------------------------------------- SVG yedeği için siluet

export interface Silhouette {
  body: Vec2[];
  tail: Vec2[];
  dorsal: Vec2[];
  anal: Vec2[];
  pelvic: Vec2[];
  pectoral: Vec2[];
  gono: Vec2[];
  eye: { x: number; y: number; r: number };
  spot: { x: number; y: number; rx: number; ry: number } | null;
}

const finPoly = (f: Fin | null): Vec2[] => {
  if (!f) return [];
  const tip = f.rays.map((r) => r[r.length - 1]);
  const base = f.rays.map((r) => r[0]);
  return [...base, ...tip.reverse()].map((p) => [p[0], p[1]] as Vec2);
};

export function silhouette(sex: Sex, form: FormId = DEFAULT_FORM): Silhouette {
  const top: Vec2[] = [], bottom: Vec2[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = 0.5 * (1 - Math.cos((Math.PI * i) / N));
    const pr = bodyProfile(sex, t);
    const x = bodyX(sex, t);
    top.push([x, pr.cy + pr.up]);
    bottom.push([x, pr.cy - pr.down]);
  }
  const g = gonopodium(sex);
  const eye = eyeSpec(sex);
  const spotC = bodySurfacePoint(sex, 0.6, 0.75);
  return {
    body: [...top, ...bottom.reverse()],
    tail: finPoly(tailFin(sex, form)),
    dorsal: finPoly(dorsalFin(sex, form)),
    anal: finPoly(analFin(sex)),
    pelvic: finPoly(pelvicFin(sex, 1)),
    pectoral: finPoly(pectoralFin(sex, 1, form)),
    gono: g ? g.path.map((p) => [p[0], p[1]] as Vec2) : [],
    eye: { x: eye.center[0], y: eye.center[1], r: eye.radius },
    spot: sex === 'disi' ? { x: spotC[0], y: spotC[1], rx: 0.17, ry: 0.1 } : null,
  };
}
