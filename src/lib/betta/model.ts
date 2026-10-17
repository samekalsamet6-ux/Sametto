// Betta (Betta splendens; standart "plakat" kısa yüzgeçli gövde, şematik) 3B modeli için SAF geometri parametreleri.
// DOM ve three.js kullanılmaz: birim testlenir, SVG yedeği de aynı sayılardan üretilir.
// Koordinatlar ve birimler için bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import {
  bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3,
} from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: uzun, yanlardan hafif basık; başı yassı; dişide karın daha dolgun, gövde biraz daha kısa/yuvarlak */
export function bodyFor(sex: Sex): Body {
  const f = sex === 'disi';
  return makeBody(1, {
    top: spline([[0, 0.014], [0.08, 0.06], [0.3, 0.118], [0.55, 0.114], [0.78, 0.076], [1, 0.05]]),
    bot: spline([[0, -0.024], [0.08, -0.068], [0.3, f ? -0.145 : -0.116], [0.55, f ? -0.15 : -0.108], [0.78, f ? -0.08 : -0.064], [1, -0.046]]),
    hw: spline([[0, 0.03], [0.08, 0.062], [0.3, f ? 0.1 : 0.086], [0.55, f ? 0.095 : 0.078], [0.78, 0.05], [1, 0.024]]),
    nTop: spline([[0, 2], [0.3, 2.2], [1, 2.1]]),
    nBot: spline([[0, 2], [0.3, 2.4], [0.6, 2.4], [1, 2.1]]),
    nose: 0.06,
  });
}

/** Her yüzgeç için ölçüler (erkekte belirgin biçimde daha büyük) */
export interface FinSizes {
  dorsal: number; caudalLen: number; caudalSpread: number; anal: number; analS0: number; pelvic: number; pectoral: number;
}
export const FIN_SIZES: Record<Sex, FinSizes> = {
  erkek: { dorsal: 0.14, caudalLen: 0.31, caudalSpread: 2.5, anal: 0.17, analS0: 0.45, pelvic: 0.27, pectoral: 0.085 },
  disi: { dorsal: 0.075, caudalLen: 0.18, caudalSpread: 1.9, anal: 0.075, analS0: 0.5, pelvic: 0.13, pectoral: 0.07 },
};

export const EYE = { s: 0.118, phi: 1.28, radius: { erkek: 0.025, disi: 0.0245 } } as const;
export const OPERCULUM = { s: 0.215, phi0: 0.2, phi1: 2.0 } as const;

export function eyeSpec(sex: Sex): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex), r = EYE.radius[sex];
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.35);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.25, sf.normal[1] + 0.05, sf.normal[2]]), radius: r };
}

/** Ağız: üste dönük küçük çatlak (burun ucundan geriye ve aşağıya) */
export function mouthLine(sex: Sex, side: 1 | -1): Vec3[] {
  const b = bodyFor(sex), c = b.section(0.004);
  const cy = (c.yTop + c.yBot) / 2;
  const q = b.section(0.055);
  return [
    [c.x - 0.002, cy + 0.006, 0],
    [lerp(c.x, q.x, 0.5), cy - 0.002, side * q.hw * 0.28],
    [q.x, (q.yTop + q.yBot) / 2 - 0.012, side * q.hw * 0.52],
  ];
}

/** Solungaç kapağı kenarı (operkulum): sırttan karına kavisli çizgi */
export function operculumArc(sex: Sex, side: 1 | -1, n = 14): Vec3[] {
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const phi = lerp(OPERCULUM.phi0, OPERCULUM.phi1, t);
    const p = surfaceAt(b, OPERCULUM.s + 0.032 * Math.sin(t * Math.PI) - 0.012 * t, phi, 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

// ------------------------------------------------------------------ yüzgeçler

export function finsFor(sex: Sex): FinDef[] {
  const b = bodyFor(sex), S = FIN_SIZES[sex];
  const fins: FinDef[] = [];

  // sırt yüzgeci: gövdenin arka yarısında, arkaya doğru yükselen yuvarlak üçgen
  const dBase = lineOnBody(b, 0.57, 0.8, 0, 8, 0.012);
  fins.push({
    id: 'sirt', paired: false, flex: 0.35,
    base: dBase,
    tip: dBase.map((p, i): Vec3 => { const u = i / 7; return [p[0] + S.dorsal * (0.22 + 0.5 * u), p[1] + S.dorsal * (0.5 + 0.5 * Math.pow(Math.sin(Math.PI * (0.12 + 0.62 * u)), 0.9)), 0]; }),
  });

  // anal yüzgeç: uzun kökü olan, arkaya doğru uzayan yelpaze
  const aBase = lineOnBody(b, S.analS0, 0.93, Math.PI, 12, 0.012);
  fins.push({
    id: 'anal', paired: false, flex: 0.5,
    base: aBase,
    tip: aBase.map((p, i): Vec3 => { const u = i / 11; return [p[0] + S.anal * (0.25 + 0.65 * u), p[1] - S.anal * (0.35 + 0.65 * Math.sin(Math.PI * (0.1 + 0.8 * Math.pow(u, 0.8)))), 0]; }),
  });

  // kuyruk yüzgeci: kuyruk sapının ucunda yuvarlak yelpaze
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 11;
  const cBase: Vec3[] = [];
  for (let i = 0; i < N; i++) cBase.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
  fins.push({
    id: 'kuyruk', paired: false, flex: 0.8,
    base: cBase,
    tip: cBase.map((p, i): Vec3 => { const a = (i / (N - 1) - 0.5) * Math.PI * 0.92; return [p[0] + S.caudalLen * (0.5 + 0.5 * Math.cos(a)), cy + (p[1] - cy) * S.caudalSpread * (0.75 + 0.25 * Math.cos(a)) , 0]; }),
  });

  // karın (pelvik) yüzgeçleri: öne yerleşik, uzun ince, ilk ışını en uzun
  const pBase = [0.265, 0.28, 0.295, 0.31, 0.325].map((s) => surfaceAt(b, s, Math.PI * 0.8, -0.006).pos);
  fins.push({
    id: 'karin', paired: true, flex: 0.45,
    base: pBase,
    tip: pBase.map((p, i): Vec3 => [p[0] + S.pelvic * (0.95 - 0.55 * (i / 4)), p[1] - S.pelvic * (0.6 - 0.2 * (i / 4)), p[2] + 0.04]),
  });

  // göğüs yüzgeçleri: solungaç kapağının arkasında küçük, saydam, hızlı çırpan
  const gBase = [0.03, 0.0, -0.03, -0.055].map((dy, i) => { const p = surfaceAt(b, 0.262 + i * 0.002, Math.PI / 2 - 0.02 * i, -0.004).pos; return [p[0], p[1] + dy + 0.01, p[2]] as Vec3; });
  fins.push({
    id: 'gogus', paired: true, flex: 0.9,
    base: gBase,
    tip: gBase.map((p, i): Vec3 => [p[0] + S.pectoral * (0.85 + 0.2 * Math.sin(Math.PI * (i / 3))), p[1] - S.pectoral * (0.1 + 0.55 * (i / 3)), p[2] + S.pectoral * 0.75]),
  });
  return fins;
}

/** Dişide karın altında yumurta borusu (ovipozitör) noktasının yeri */
export function ovipositor(sex: Sex): { pos: Vec3; r: number } | null {
  if (sex !== 'disi') return null;
  const p = surfaceAt(bodyFor(sex), 0.37, Math.PI, 0.0).pos;
  return { pos: [p[0], p[1] - 0.004, 0], r: 0.0085 };
}

export function silhouette(sex: Sex): Silhouette {
  const e = eyeSpec(sex);
  return {
    body: bodyOutline(bodyFor(sex), 40),
    fins: finsFor(sex).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })),
    eye: { c: [e.center[0], e.center[1]], r: e.radius },
  };
}
