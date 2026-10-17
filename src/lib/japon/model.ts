// Japon balığı (Carassius auratus; "common/comet" tek kuyruklu gövde, şematik) 3B modeli için SAF geometri parametreleri.
// Süs/fancy biçimler (oranda, ryukin, telescope, çift kuyruk vb.) bilerek dahil değildir: tek sırt, tek anal, tek kuyruk yüzgeci.
// Koordinatlar: bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: orta derinlikli, yanlardan basık, sırt kemerli; üreme dönemindeki dişide karın daha dolgun */
export function bodyFor(sex: Sex): Body {
  const f = sex === 'disi';
  return makeBody(1, {
    top: spline([[0, 0.012], [0.08, 0.075], [0.2, 0.16], [0.4, 0.21], [0.6, 0.185], [0.8, 0.108], [1, 0.056]]),
    bot: spline([[0, -0.022], [0.08, -0.07], [0.2, -0.125], [0.45, f ? -0.175 : -0.152], [0.65, f ? -0.145 : -0.125], [0.85, -0.07], [1, -0.045]]),
    hw: spline([[0, 0.03], [0.08, 0.08], [0.25, 0.12], [0.45, f ? 0.15 : 0.135], [0.7, 0.092], [1, 0.03]]),
    nTop: spline([[0, 2], [0.4, 2.2], [1, 2.1]]),
    nBot: spline([[0, 2], [0.45, 2.1], [1, 2.1]]),
    nose: 0.065,
  });
}

export const EYE = { s: 0.105, phi: 1.15, radius: 0.03 } as const;
export const OPERCULUM = { s: 0.2, phi0: 0.35, phi1: 2.3 } as const;
/** Yan çizgi: operkulumdan kuyruk sapına, gövde ortasının biraz üstünde (w: 0 sırt .. 1 karın) */
export const LATERAL = { s0: 0.22, s1: 0.97, w: 0.5 } as const;

export function eyeGeom(sex: Sex): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex), r = EYE.radius;
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.35);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.2, sf.normal[1] + 0.05, sf.normal[2]]), radius: r };
}

/** Ağız: küçük, burun ucunda, hafif üste dönük; bıyık yoktur */
export function mouthLine(sex: Sex, side: 1 | -1): Vec3[] {
  const b = bodyFor(sex), c = b.section(0.004), q = b.section(0.055);
  const cy = (c.yTop + c.yBot) / 2;
  return [[c.x - 0.002, cy - 0.004, 0], [lerp(c.x, q.x, 0.5), cy - 0.01, side * q.hw * 0.3], [q.x, (q.yTop + q.yBot) / 2 - 0.018, side * q.hw * 0.52]];
}

/** Burun delikleri: gözün önünde, her yanda iki küçük delik (ön ve arka) */
export function nostrils(sex: Sex): { pos: Vec3; r: number }[] {
  const b = bodyFor(sex);
  return [[0.045, 0.75], [0.065, 0.8]].map(([s, phi]) => ({ pos: surfaceAt(b, s, phi, 0.001).pos, r: 0.0042 }));
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 16): Vec3[] {
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.035 * Math.sin(t * Math.PI) - 0.012 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

/** Üreme tüberkülleri (yalnızca erkekte): solungaç kapağında ve göğüs yüzgecinin ön ışınlarında küçük beyaz noktalar */
export function tubercles(sex: Sex): Vec3[] {
  if (sex !== 'erkek') return [];
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < 9; i++) { const p = surfaceAt(b, 0.17 + 0.012 * (i % 3), 1.0 + 0.2 * Math.floor(i / 3) + 0.04 * (i % 2), 0.001).pos; out.push(p); }
  const pect = finsFor(sex).find((f) => f.id === 'gogus')!;
  for (let i = 0; i < 5; i++) { const t = 0.25 + 0.14 * i; out.push([lerp(pect.base[0][0], pect.tip[0][0], t), lerp(pect.base[0][1], pect.tip[0][1], t), lerp(pect.base[0][2], pect.tip[0][2], t) + 0.004]); }
  return out;
}

/** Yan çizgi: pullar boyunca hafif kavisli çizgi (+z yanı için) */
export function lateralLine(sex: Sex, n = 22): Vec3[] {
  const b = bodyFor(sex), out: Vec3[] = [];
  for (let i = 0; i < n; i++) { const s = lerp(LATERAL.s0, LATERAL.s1, i / (n - 1)); out.push(surfaceAt(b, s, Math.PI * (LATERAL.w - 0.02 * (1 - s)), 0.0008).pos); }
  return out;
}

/** Yüzgeçler: uzun tabanlı sırt (ön ışını sert), tek anal, tek çatallı kuyruk, karın ve göğüs çiftleri */
export function finsFor(sex: Sex): FinDef[] {
  const b = bodyFor(sex), fins: FinDef[] = [];
  const dB = lineOnBody(b, 0.3, 0.7, 0, 10, 0.012);
  fins.push({ id: 'sirt', paired: false, flex: 0.3, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 9; return [p[0] + 0.03 + 0.12 * u, p[1] + 0.185 * (1 - 0.65 * Math.pow(u, 1.1)) * (0.85 + 0.15 * Math.sin(Math.PI * Math.min(1, u * 1.2))), 0]; }) });
  const nB = lineOnBody(b, 0.63, 0.79, Math.PI, 7, 0.012);
  fins.push({ id: 'anal', paired: false, flex: 0.35, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 6; return [p[0] + 0.04 + 0.06 * u, p[1] - 0.115 * (1 - 0.65 * u), 0]; }) });
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 11;
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
  fins.push({ id: 'kuyruk', paired: false, flex: 0.9, base: cB, tip: cB.map((p, i): Vec3 => { const v = Math.abs((2 * i) / (N - 1) - 1); return [p[0] + 0.33 * (0.38 + 0.62 * Math.pow(v, 0.65)), cy + (p[1] - cy) * (1.1 + 2.7 * Math.pow(v, 0.8)), 0]; }) });
  const pB = [0.44, 0.455, 0.47, 0.485].map((s) => surfaceAt(b, s, Math.PI * 0.8, -0.006).pos);
  fins.push({ id: 'karin', paired: true, flex: 0.4, base: pB, tip: pB.map((p, i): Vec3 => [p[0] + 0.1 * (1 - 0.4 * (i / 3)), p[1] - 0.1 * (1 - 0.2 * (i / 3)), p[2] + 0.045]) });
  const gB = [0.03, 0.0, -0.03, -0.06].map((dy, i) => { const p = surfaceAt(b, 0.225 + i * 0.002, Math.PI * 0.58 + 0.03 * i, -0.006).pos; return [p[0], p[1] + dy, p[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.7, base: gB, tip: gB.map((p, i): Vec3 => { const u = i / 3; return [p[0] + 0.13 * (0.7 + 0.3 * Math.sin(Math.PI * (0.2 + 0.7 * (1 - u)))), p[1] - 0.045 - 0.05 * u, p[2] + 0.075]; }) });
  return fins;
}

export function silhouette(sex: Sex): Silhouette {
  const e = eyeGeom(sex);
  return { body: bodyOutline(bodyFor(sex), 40), fins: finsFor(sex).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
