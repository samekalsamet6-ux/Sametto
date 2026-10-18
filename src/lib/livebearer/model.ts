// Canlı doğuran (Poeciliidae) balıklar için ortak, SAF parametrik geometri: molly ve platy bu fabrikayı kendi sayılarıyla çağırır.
// DOM ve three.js kullanılmaz; birim testlenebilir ve SVG yedeği aynı sayılardan üretilir.
//
// Koordinatlar: x gövde ekseni (burun -x, kuyruk +x), y yukarı, z yanal (kamera varsayılan olarak +z'den bakar).
// Birim keyfidir (şematik model); gerçek ölçüm değildir.

import { bodyShape, flankProfile, type BodyShape } from './body';

export type Sex = 'erkek' | 'disi';
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

export interface BodyParams {
  length: number; height: number; width: number;
  /** En yüksek kesitin gövde boyunca konumu (0..1) */
  peak: number;
  /** Kuyruk sapı yüksekliğinin tepe yüksekliğine oranı */
  peduncle: number;
  belly: number; bellyAt: number; bellySpread: number;
  eye: number;
  /** Ağız/burun bölgesinin yukarı kayması (yarı yüksekliğe oranı) */
  lift: number;
  /** Ön gövde dolgunluğu: küçük üs = daha küt/dolgun baş (guppy 0.6) */
  frontPow: number;
  /** Doğal gövde ince ayarı (alın/ense/kamburluk/solungaç/kesit); yoksa ortak varsayılan (bkz. body.ts) */
  shape?: Partial<BodyShape>;
}

export interface TailSpec {
  rays: number; reach: number; halfAngle: number; bulge: number; /** 0 = düz arka kenar, 1 = daire yayı */ round: number;
  /** Lira: dış (üst/alt) ışınların ek uzaması (|s|³ ile artar) */
  lyre?: number;
  /** Orta ışınların kısalması (lira çatalı) */
  fork?: number;
  /** Pintail: orta ışınların ek uzaması ve genişliği (s biriminde) */
  pin?: number; pinWidth?: number;
}
export interface DorsalSpec { t0: number; t1: number; rays: number; phiFront: number; phiRear: number; lenFront: number; lenRear: number }

export interface LbConfig {
  body: Record<Sex, BodyParams>;
  tail: Record<Sex, TailSpec>;
  dorsal: Record<Sex, DorsalSpec>;
  /** Dişide anal yüzgeç ışın uzunlukları (ön, arka) */
  anal: { lenFront: number; lenRear: number };
  /** Gonopodium uzunluk ölçeği (1 = lepistes) */
  gono: number;
  /** Göğüs ve karın yüzgeçleri uzunluk ölçeği */
  paired: number;
}

export interface Fin { rays: Vec3[][]; branches: Vec3[][] }
export interface FanSpec { base: Vec3[]; dir: Vec3[]; len: number[]; curl?: Vec3[]; segments?: number; branch?: number; tipSpread?: number }
export interface Profile { cy: number; up: number; down: number; rz: number }
export interface EyeSpec { center: Vec3; normal: Vec3; radius: number }
export interface GonopodiumSpec { path: Vec3[]; radii: number[] }
export interface Silhouette {
  body: Vec2[]; tail: Vec2[]; dorsal: Vec2[]; anal: Vec2[]; pelvic: Vec2[]; pectoral: Vec2[]; gono: Vec2[];
  eye: { x: number; y: number; r: number };
  spot: { x: number; y: number; rx: number; ry: number } | null;
}

const norm = (v: Vec3): Vec3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Tabandan yelpaze gibi açılan ışınlar: P(u) = B + D·len·u + C·u² */
export function fanFin(s: FanSpec): Fin {
  const K = s.segments ?? 8;
  const rays: Vec3[][] = [];
  for (let i = 0; i < s.base.length; i++) {
    const b = s.base[i], d = s.dir[i], c = s.curl?.[i] ?? [0, 0, 0];
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
      const from = rays[i][kb], tip = rays[i][K];
      const nb = rays[Math.min(rays.length - 1, i + 1)][K], pb = rays[Math.max(0, i - 1)][K];
      const sp = s.tipSpread ?? 0.3;
      for (const nbTip of [nb, pb]) {
        const target: Vec3 = [tip[0] + (nbTip[0] - tip[0]) * sp, tip[1] + (nbTip[1] - tip[1]) * sp, tip[2] + (nbTip[2] - tip[2]) * sp];
        branches.push([from, [(from[0] + target[0]) / 2, (from[1] + target[1]) / 2, (from[2] + target[2]) / 2], target]);
      }
    }
  }
  return { rays, branches };
}

/** Solungaç kapağı sabitleri (gövde t, halka açısı a). Tüm türlerde aynı bölgede durur. */
export const OPERCULUM_A: Vec2 = [0.8, 2.5];
export const operculumEdgeT = (a: number): number => 0.285 - 0.045 * ((a - 1.65) / 0.9) ** 2;
export const operculumFront = (a: number): number => 0.178 + 0.03 * ((a - 1.65) / 0.9) ** 2;
export function operculumEdge(n = 14): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) { const a = lerp(OPERCULUM_A[0], OPERCULUM_A[1], i / (n - 1)); out.push([operculumEdgeT(a), a]); }
  return out;
}
export const EYE_T = 0.118;
export const EYE_A = Math.PI / 2 + 0.14;
export const TAIL_BASE_T = 0.955;
export const SWIM = { amp: 0.055, wavenumber: 3.2, speed: 5.0, flapSpeed: 9.0 };

/** Gövde boyunca yanal dalga: baş sabit, kuyruğa doğru artan genlik. GLSL ile aynı formül. */
export function swimOffsetZ(x: number, length: number, time: number, amp = SWIM.amp): number {
  const sw = Math.min(1.8, Math.max(0, x / length + 0.5));
  return amp * sw * sw * Math.sin(x * SWIM.wavenumber - time * SWIM.speed);
}

export function createModel(cfg: LbConfig) {
  const BODY = cfg.body, TAIL = cfg.tail, DORSAL = cfg.dorsal;

  function envelope(sex: Sex, t: number): number {
    const p = BODY[sex];
    if (t <= 0 || t >= 1) return 0;
    let f: number;
    if (t < p.peak) f = Math.pow(Math.sin((t / p.peak) * Math.PI * 0.5), p.frontPow);
    else {
      const k = Math.pow((t - p.peak) / (1 - p.peak), 0.85);
      f = p.peduncle + (1 - p.peduncle) * 0.5 * (1 + Math.cos(Math.PI * k));
    }
    // yuvarlak kuyruk sapı kapanışı: son %5'te dairesel daralma (düz kapak görünümü olmasın)
    if (t > 0.95) f *= Math.sqrt(Math.max(0, 1 - ((t - 0.95) / 0.05) ** 2));
    return f;
  }

  function bodyProfile(sex: Sex, t: number): Profile {
    const p = BODY[sex];
    const e = envelope(sex, t);
    const half = p.height / 2;
    const bump = Math.exp(-(((t - p.bellyAt) / p.bellySpread) ** 2));
    const lift = half * p.lift * Math.pow(Math.max(0, 1 - t / 0.2), 1.6);
    const sh = bodyShape(t, p.shape);
    return {
      cy: lift,
      up: half * e * sh.up,
      down: half * e * (1 + p.belly * bump * 1.6) * sh.down,
      rz: (p.width / 2) * Math.pow(e, 0.95) * (1 + 0.25 * p.belly * bump) * (1 + 0.32 * Math.exp(-(((t - 0.13) / 0.09) ** 2))) * sh.w,
    };
  }
  const bodyX = (sex: Sex, t: number): number => (t - 0.5) * BODY[sex].length;

  /** a: 0 = karın orta çizgisi, π/2 = +z yan, π = sırt, 3π/2 = -z yan. offset > 0 yüzeyden dışarı. */
  function bodySurfacePoint(sex: Sex, t: number, a: number, offset = 0): Vec3 {
    const pr = bodyProfile(sex, t);
    const mid = (pr.up + pr.down) / 2, off = (pr.up - pr.down) / 2;
    return [bodyX(sex, t), pr.cy + off - Math.cos(a) * (mid + offset), pr.rz * flankProfile(a, BODY[sex].shape) + offset * Math.sin(a)];
  }

  function tailFin(sex: Sex): Fin {
    const sp = TAIL[sex];
    const pr = bodyProfile(sex, TAIL_BASE_T);
    const x0 = bodyX(sex, TAIL_BASE_T);
    const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [];
    for (let i = 0; i < sp.rays; i++) {
      const s = (i / (sp.rays - 1)) * 2 - 1;
      const th = rad(sp.halfAngle) * s;
      base.push([x0, pr.cy + s * 0.85 * (s > 0 ? pr.up : pr.down), 0]);
      dir.push([Math.cos(th), Math.sin(th), 0]);
      // round=0: düz arka kenar (reach/cosθ); round=1: daire yayı (sabit uzunluk)
      let L = sp.reach * Math.pow(Math.cos(th), -(1 - sp.round)) * (1 + sp.bulge * (1 - s * s));
      if (sp.lyre) L *= 1 + sp.lyre * Math.pow(Math.abs(s), 3);
      if (sp.fork) L *= 1 - sp.fork * Math.exp(-((s / 0.4) ** 2));
      if (sp.pin) L *= 1 + sp.pin * Math.exp(-((s / (sp.pinWidth ?? 0.18)) ** 2));
      len.push(L);
    }
    return fanFin({ base, dir, len, segments: 22, branch: 0.62, tipSpread: 0.32 });
  }

  function dorsalFin(sex: Sex): Fin {
    const d = DORSAL[sex];
    const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
    for (let i = 0; i < d.rays; i++) {
      const f = i / (d.rays - 1);
      const phi = rad(lerp(d.phiFront, d.phiRear, f));
      const L = lerp(d.lenFront, d.lenRear, Math.pow(f, 0.8));
      base.push(bodySurfacePoint(sex, lerp(d.t0, d.t1, f), Math.PI, -0.03));
      dir.push([Math.cos(phi), Math.sin(phi), 0]);
      len.push(L);
      curl.push([0.06 * L, -0.1 * L, 0]);
    }
    return fanFin({ base, dir, len, curl, segments: 16, branch: 0.7, tipSpread: 0.28 });
  }

  /** Dişide yelpaze biçimli anal yüzgeç. Erkekte yoktur: yerini gonopodium alır. */
  function analFin(sex: Sex): Fin | null {
    if (sex === 'erkek') return null;
    const n = 8;
    const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const phi = rad(lerp(-74, -34, f));
      const L = lerp(cfg.anal.lenFront, cfg.anal.lenRear, f);
      base.push(bodySurfacePoint(sex, lerp(0.63, 0.72, f), 0, -0.03));
      dir.push([Math.cos(phi), Math.sin(phi), 0]);
      len.push(L);
      curl.push([0.05 * L, 0, 0]);
    }
    return fanFin({ base, dir, len, curl, segments: 7, branch: 0.7, tipSpread: 0.25 });
  }

  function pectoralFin(sex: Sex, side: 1 | -1): Fin {
    const n = 9;
    const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const a = side > 0 ? 1.18 + 0.62 * f : 2 * Math.PI - (1.18 + 0.62 * f);
      const phi = rad(lerp(48, -38, f));
      const L = (sex === 'erkek' ? 0.46 : 0.5) * cfg.paired * (1 - 0.35 * Math.abs(f - 0.4) * 2);
      base.push(bodySurfacePoint(sex, 0.292, a, -0.015));
      dir.push(norm([Math.cos(phi), Math.sin(phi) * 0.9, 0.34 * side]));
      len.push(L);
      curl.push([0.04, -0.03, 0.05 * side]);
    }
    return fanFin({ base, dir, len, curl, segments: 6 });
  }

  function pelvicFin(sex: Sex, side: 1 | -1): Fin {
    const n = 5;
    const base: Vec3[] = [], dir: Vec3[] = [], len: number[] = [], curl: Vec3[] = [];
    const a = side > 0 ? 0.42 : 2 * Math.PI - 0.42;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const phi = rad(lerp(-78, -32, f));
      const L = lerp(0.3, 0.36, 1 - Math.abs(f - 0.5) * 2) * (sex === 'erkek' ? 1 : 0.95) * cfg.paired;
      base.push(bodySurfacePoint(sex, lerp(0.37, 0.41, f), a, -0.02));
      dir.push(norm([Math.cos(phi), Math.sin(phi), 0.28 * side]));
      len.push(L);
      curl.push([0.03, 0, 0]);
    }
    return fanFin({ base, dir, len, curl, segments: 5 });
  }

  /** Erkeğin anal yüzgecinden dönüşen çubuk biçimli üreme organı. */
  function gonopodium(sex: Sex): GonopodiumSpec | null {
    if (sex !== 'erkek') return null;
    const k = cfg.gono;
    // karın çizgisini izleyen çubuk: gövdeye yakın uzanır, ucu hafifçe aşağı kıvrılır (kanca)
    const dt = (0.62 * k) / BODY[sex].length;
    const path: Vec3[] = [0, 0.2, 0.42, 0.64, 0.84, 1].map((f) => {
      const p = bodySurfacePoint(sex, 0.585 + dt * f, 0, -0.02 + 0.075 * Math.sin(f * Math.PI * 0.5));
      return [p[0], p[1] - 0.05 * k * f * f * f, 0] as Vec3;
    });
    return { path, radii: [0.04, 0.034, 0.026, 0.019, 0.013, 0.008].map((r, i) => (i === 0 ? r : r * Math.max(0.8, k))) };
  }

  function eyeSpec(sex: Sex): EyeSpec {
    const R = BODY[sex].eye;
    const s = bodySurfacePoint(sex, EYE_T, EYE_A, -0.5 * R);
    const pr = bodyProfile(sex, EYE_T);
    const axis: Vec3 = [s[0], pr.cy + (pr.up - pr.down) / 2, 0];
    return { center: s, normal: norm([s[0] - axis[0] - 0.22 * R, s[1] - axis[1], s[2] - axis[2]]), radius: R };
  }

  function mouthLine(sex: Sex, side: 1 | -1): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = 0.004 + (i / 6) * 0.052;
      const a = side > 0 ? 1.28 - 0.1 * (i / 6) : 2 * Math.PI - (1.28 - 0.1 * (i / 6));
      pts.push(bodySurfacePoint(sex, t, a, 0.004));
    }
    return pts;
  }

  const finPoly = (f: Fin | null): Vec2[] => {
    if (!f) return [];
    const tip = f.rays.map((r) => r[r.length - 1]), base = f.rays.map((r) => r[0]);
    return [...base, ...tip.reverse()].map((p) => [p[0], p[1]] as Vec2);
  };

  function silhouette(sex: Sex): Silhouette {
    const top: Vec2[] = [], bottom: Vec2[] = [];
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = 0.5 * (1 - Math.cos((Math.PI * i) / N));
      const pr = bodyProfile(sex, t), x = bodyX(sex, t);
      top.push([x, pr.cy + pr.up]); bottom.push([x, pr.cy - pr.down]);
    }
    const g = gonopodium(sex), eye = eyeSpec(sex), spotC = bodySurfacePoint(sex, 0.6, 0.75);
    return {
      body: [...top, ...bottom.reverse()], tail: finPoly(tailFin(sex)), dorsal: finPoly(dorsalFin(sex)), anal: finPoly(analFin(sex)),
      pelvic: finPoly(pelvicFin(sex, 1)), pectoral: finPoly(pectoralFin(sex, 1)), gono: g ? g.path.map((p) => [p[0], p[1]] as Vec2) : [],
      eye: { x: eye.center[0], y: eye.center[1], r: eye.radius },
      spot: sex === 'disi' ? { x: spotC[0], y: spotC[1], rx: 0.17, ry: 0.1 } : null,
    };
  }

  return {
    BODY, TAIL, DORSAL, SEXES, SWIM, envelope, bodyProfile, bodyX, bodySurfacePoint, tailFin, dorsalFin, analFin, pectoralFin, pelvicFin,
    gonopodium, eyeSpec, mouthLine, silhouette, swimOffsetZ, operculumEdge, operculumEdgeT, operculumFront, OPERCULUM_A, fanFin,
  };
}
export type LbModel = ReturnType<typeof createModel>;
