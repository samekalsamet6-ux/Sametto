// Corydoras (C. aeneus / C. paleatus tipi gövde; şematik) 3B modeli için SAF geometri parametreleri.
// Yüksek sırtlı, düz karınlı, zırh plakalı kedibalığı; farklı gövde biçimli türler (ör. uzun burunlu, Brochis) bilerek dahil değildir.
// Koordinatlar: bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: yüksek sırt, düz karın, geniş omuz; dişide gövde belirgin biçimde daha geniş/dolgun (özellikle üstten bakınca) */
export function bodyFor(sex: Sex): Body {
  const f = sex === 'disi' ? 1.14 : 1;
  return makeBody(1, {
    top: spline([[0, 0.012], [0.08, 0.078], [0.2, 0.165], [0.38, 0.228], [0.55, 0.2], [0.78, 0.115], [1, 0.062]]),
    bot: spline([[0, -0.02], [0.07, -0.058], [0.2, -0.095], [0.45, -0.112], [0.7, -0.092], [0.86, -0.068], [1, -0.046]]),
    hw: spline([[0, 0.03], [0.08, 0.085 * f], [0.25, 0.13 * f], [0.45, 0.14 * f], [0.7, 0.095 * f], [1, 0.032]]),
    nTop: spline([[0, 2], [0.4, 2.4], [1, 2.1]]),
    nBot: spline([[0, 2], [0.15, 3.2], [0.4, 4.2], [0.7, 3.6], [1, 2.4]]),
    nose: 0.07,
  });
}

export const EYE = { s: 0.115, phi: 0.95, radius: 0.027 } as const;
export const OPERCULUM = { s: 0.205, phi0: 0.35, phi1: 2.35 } as const;
/** Zırh: iki sıra kemikli levha (üst sıra sırt, alt sıra karın tarafı); s aralığı ve yan çizginin w'si */
export const ARMOR = { s0: 0.22, s1: 0.97, plates: 24, split: 0.5 } as const;

export function eyeGeom(sex: Sex): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex), r = EYE.radius;
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.35);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.2, sf.normal[1] + 0.35, sf.normal[2]]), radius: r };
}

/** Ağız: alt yüzde, burnun hemen gerisinde etli dudaklı emici halka (kapalı çevrim) */
export function lipsLoop(sex: Sex, n = 16): Vec3[] {
  const b = bodyFor(sex), c = b.section(0.045);
  const cy = c.yBot, out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([c.x + Math.cos(a) * 0.026, cy - 0.004 + Math.abs(Math.sin(a)) * 0.002, Math.sin(a) * c.hw * 0.42]);
  }
  return out;
}

/** Üç çift bıyık (+z yanı için); her biri nokta dizisi ve yarıçaplar */
export function barbels(sex: Sex): { id: string; path: Vec3[]; radii: number[] }[] {
  const b = bodyFor(sex), c = b.section(0.05), y = c.yBot;
  const z = c.hw * 0.4, x = c.x;
  return [
    { id: 'maksiller', path: [[x - 0.01, y + 0.004, z], [x - 0.05, y - 0.016, z + 0.03], [x - 0.085, y - 0.03, z + 0.05], [x - 0.1, y - 0.045, z + 0.045]], radii: [0.0055, 0.004, 0.0028, 0.002] },
    { id: 'mandibular-1', path: [[x + 0.006, y + 0.002, z * 0.55], [x - 0.03, y - 0.022, z * 0.8 + 0.01], [x - 0.06, y - 0.042, z * 0.9 + 0.02], [x - 0.072, y - 0.06, z * 0.9 + 0.02]], radii: [0.0045, 0.0034, 0.0024, 0.0017] },
    { id: 'mandibular-2', path: [[x + 0.014, y + 0.002, z * 0.45], [x - 0.012, y - 0.028, z * 0.55], [x - 0.036, y - 0.05, z * 0.65], [x - 0.044, y - 0.07, z * 0.66]], radii: [0.0042, 0.0031, 0.0022, 0.0016] },
  ];
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 14): Vec3[] {
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.03 * Math.sin(t * Math.PI) - 0.014 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

/** Yüzgeçler: büyük yuvarlak göğüs yüzgeçleri, yüksek üçgen sırt yüzgeci, küçük yağ yüzgeci, çatallı kuyruk */
export function finsFor(sex: Sex): FinDef[] {
  const b = bodyFor(sex), fins: FinDef[] = [];
  const dB = lineOnBody(b, 0.31, 0.47, 0, 7, 0.012);
  fins.push({ id: 'sirt', paired: false, flex: 0.3, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 6; return [p[0] + 0.02 + 0.075 * (1 - 0.5 * u) * (0.55 + 0.45 * u), p[1] + 0.215 * (1 - 0.82 * Math.pow(u, 0.9)), 0]; }) });
  const aB = lineOnBody(b, 0.69, 0.76, 0, 5, 0.008);
  fins.push({ id: 'yag', paired: false, flex: 0.15, base: aB, tip: aB.map((p, i): Vec3 => [p[0] + 0.02 + 0.03 * (i / 4), p[1] + 0.05 * (1 - 0.55 * (i / 4)) * Math.sin(Math.PI * (0.2 + 0.7 * (1 - i / 4))), 0]) });
  const nB = lineOnBody(b, 0.66, 0.77, Math.PI, 6, 0.01);
  fins.push({ id: 'anal', paired: false, flex: 0.35, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 5; return [p[0] + 0.03 + 0.04 * u, p[1] - 0.1 * (1 - 0.7 * u), 0]; }) });
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 9;
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
  fins.push({ id: 'kuyruk', paired: false, flex: 0.9, base: cB, tip: cB.map((p, i): Vec3 => { const v = Math.abs((2 * i) / (N - 1) - 1); return [p[0] + 0.19 * (0.45 + 0.55 * Math.pow(v, 0.7)), cy + (p[1] - cy) * (1.2 + 2.4 * Math.pow(v, 0.8)), 0]; }) });
  const pB = [0.455, 0.47, 0.485].map((s) => surfaceAt(b, s, Math.PI * 0.82, -0.006).pos);
  fins.push({ id: 'karin', paired: true, flex: 0.4, base: pB, tip: pB.map((p, i): Vec3 => [p[0] + 0.07 * (1 - 0.35 * (i / 2)), p[1] - 0.075, p[2] + 0.03]) });
  // göğüs yüzgeci: büyük, yuvarlak, kenarda kalın diken; karın tarafına yakın bağlanır
  const gB = [0.0, -0.025, -0.05, -0.075].map((dy, i) => { const p = surfaceAt(b, 0.235 + i * 0.001, Math.PI * 0.64 + 0.03 * i, -0.008).pos; return [p[0], p[1] + dy + 0.02, p[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.7, base: gB, tip: gB.map((p, i): Vec3 => { const u = i / 3; return [p[0] + 0.14 * (0.55 + 0.45 * Math.sin(Math.PI * (0.2 + 0.7 * (1 - u)))), p[1] - 0.04 - 0.035 * u, p[2] + 0.07 + 0.03 * (1 - u)]; }) });
  return fins;
}

/** Diken (sırt, yağ, göğüs yüzgeçlerinin ön ışını): +z yanı için yol ve taban yarıçapı */
export function spines(sex: Sex): { id: string; path: Vec3[]; r: number; paired: boolean }[] {
  const f = finsFor(sex), pick = (id: string) => f.find((x) => x.id === id)!;
  const lerp3 = (a: Vec3, c: Vec3, t: number): Vec3 => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
  const d = pick('sirt'), a = pick('yag'), p = pick('gogus');
  return [
    { id: 'sirt', path: [lerp3(d.base[0], d.tip[0], 0), lerp3(d.base[0], d.tip[0], 0.5), lerp3(d.base[0], d.tip[0], 1.0)], r: 0.0052, paired: false },
    { id: 'yag', path: [lerp3(a.base[0], a.tip[0], 0), lerp3(a.base[0], a.tip[0], 0.6), lerp3(a.base[0], a.tip[0], 1.1)], r: 0.003, paired: false },
    { id: 'gogus', path: [lerp3(p.base[0], p.tip[0], 0), lerp3(p.base[0], p.tip[0], 0.5), lerp3(p.base[0], p.tip[0], 1.0)], r: 0.005, paired: true },
  ];
}

export function silhouette(sex: Sex): Silhouette {
  const e = eyeGeom(sex);
  return { body: bodyOutline(bodyFor(sex), 40), fins: finsFor(sex).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
