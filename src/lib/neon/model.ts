// Neon tetra (Paracheirodon innesi; şematik) 3B modeli için SAF geometri parametreleri.
// DOM ve three.js kullanılmaz: birim testlenir, SVG yedeği de aynı sayılardan üretilir. Koordinatlar: bkz. ../akvaryum/fishmath.ts
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export type Form = 'standart' | 'uzun-yuzgec' | 'balon';
export const FORM_IDS: readonly Form[] = ['standart', 'uzun-yuzgec', 'balon'];

/** Form parametreleri: gövde çarpanları (orta bölgede vurgulu) ve yüzgeç ölçekleri */
export interface FormParams { top: number; bot: number; hw: number; fin: { dorsal: number; anal: number; caudal: number; pelvic: number; pect: number } }
export const FORM_PARAMS: Record<Form, FormParams> = {
  standart: { top: 1, bot: 1, hw: 1, fin: { dorsal: 1, anal: 1, caudal: 1, pelvic: 1, pect: 1 } },
  'uzun-yuzgec': { top: 1, bot: 1, hw: 1, fin: { dorsal: 1.9, anal: 2.0, caudal: 1.8, pelvic: 1.8, pect: 1.4 } },
  balon: { top: 1.3, bot: 1.9, hw: 1.4, fin: { dorsal: 0.85, anal: 0.85, caudal: 0.9, pelvic: 0.9, pect: 1 } },
};
const bump = (s: number) => Math.exp(-Math.pow((s - 0.5) / 0.27, 2));
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: ince, torpido biçimli, yanlardan basık; dişide karın daha dolgun */
export function bodyFor(sex: Sex, form: Form = 'standart'): Body {
  const f = sex === 'disi', P = FORM_PARAMS[form];
  const top = spline([[0, 0.012], [0.08, 0.06], [0.3, 0.112], [0.46, 0.118], [0.7, 0.074], [1, 0.036]]);
  const bot = spline([[0, -0.016], [0.08, -0.056], [0.3, f ? -0.115 : -0.1], [0.46, f ? -0.14 : -0.105], [0.7, f ? -0.08 : -0.062], [1, -0.03]]);
  const hw = spline([[0, 0.02], [0.08, 0.042], [0.3, f ? 0.062 : 0.054], [0.46, f ? 0.066 : 0.054], [0.7, 0.034], [1, 0.012]]);
  return makeBody(1, {
    top: (s) => top(s) * (1 + (P.top - 1) * bump(s)),
    bot: (s) => bot(s) * (1 + (P.bot - 1) * bump(s)),
    hw: (s) => hw(s) * (1 + (P.hw - 1) * bump(s)),
    nose: 0.06,
  });
}

export const EYE = { s: 0.088, phi: 1.3, radius: 0.034 } as const;
export const OPERCULUM = { s: 0.195, phi0: 0.25, phi1: 2.1 } as const;

/** Mavi şeridin gövdedeki aralığı (s) ve ortası (w: 0 sırt orta çizgisi .. 1 karın orta çizgisi). Dişide şerit karnın dolgunluğuyla aşağı bükülür. */
export const STRIPE = { s0: 0.055, s1: 0.84, half: 0.07 } as const;
export function stripeW(sex: Sex, s: number): number {
  const base = 0.4;
  if (sex === 'erkek') return base + 0.004 * Math.sin(s * 3);
  const bend = Math.exp(-Math.pow((s - 0.55) / 0.2, 2));
  return base + 0.085 * bend;
}
/** Kırmızı bölgenin başladığı s ve üst kenarı (w) */
export const RED = { s0: 0.34 } as const;

export function eyeSpec(): { s: number; radius: number } { return { s: EYE.s, radius: EYE.radius }; }
export function eyeGeom(sex: Sex, form: Form = 'standart'): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex, form), r = EYE.radius;
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.3);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.2, sf.normal[1], sf.normal[2]]), radius: r };
}

export function mouthLine(sex: Sex, side: 1 | -1, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), c = b.section(0.004), q = b.section(0.05);
  return [[c.x - 0.002, (c.yTop + c.yBot) / 2 - 0.002, 0], [lerp(c.x, q.x, 0.5), (c.yTop + c.yBot) / 2 - 0.006, side * q.hw * 0.3], [q.x, (q.yTop + q.yBot) / 2 - 0.016, side * q.hw * 0.5]];
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 14, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.03 * Math.sin(t * Math.PI) - 0.012 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.001).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

/** Yüzgeçler: hepsi küçük ve saydam; kuyruk çatallı, sırtta yağ yüzgeci var */
export function finsFor(sex: Sex, form: Form = 'standart'): FinDef[] {
  const b = bodyFor(sex, form), F = FORM_PARAMS[form].fin, fins: FinDef[] = [];
  const dB = lineOnBody(b, 0.42, 0.57, 0, 6, 0.01);
  fins.push({ id: 'sirt', paired: false, flex: 0.3 * F.dorsal, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 5; return [p[0] + 0.07 * F.dorsal * (0.2 + 0.8 * u), p[1] + 0.105 * F.dorsal * (1 - 0.55 * u) * (0.6 + 0.4 * Math.sin(Math.PI * (0.15 + 0.7 * (1 - u)))), 0]; }) });
  const aB = lineOnBody(b, 0.77, 0.83, 0, 4, 0.006);
  fins.push({ id: 'yag', paired: false, flex: 0.15, base: aB, tip: aB.map((p, i): Vec3 => [p[0] + 0.03 * (0.4 + 0.6 * (i / 3)), p[1] + 0.036 * Math.sin(Math.PI * (0.12 + 0.76 * (i / 3))), 0]) });
  const nB = lineOnBody(b, 0.56, 0.75, Math.PI, 8, 0.01);
  fins.push({ id: 'anal', paired: false, flex: 0.35 * F.anal, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 7; return [p[0] + 0.05 * F.anal * (0.3 + 0.7 * u), p[1] - 0.085 * F.anal * (1 - 0.75 * u), 0]; }) });
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 9;
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.003, sec.yBot + 0.003, i / (N - 1)), 0]);
  fins.push({ id: 'kuyruk', paired: false, flex: 0.9, base: cB, tip: cB.map((p, i): Vec3 => { const v = Math.abs((2 * i) / (N - 1) - 1); return [p[0] + 0.2 * F.caudal * (0.3 + 0.7 * Math.pow(v, 0.8)), cy + (p[1] - cy) * (1 + 2.5 * Math.pow(v, 0.7) * (0.7 + 0.3 * F.caudal)), 0]; }) });
  const pB = [0.43, 0.445, 0.46].map((s) => surfaceAt(b, s, Math.PI * 0.78, -0.005).pos);
  fins.push({ id: 'karin', paired: true, flex: 0.4, base: pB, tip: pB.map((p, i): Vec3 => [p[0] + 0.07 * F.pelvic * (1 - 0.3 * (i / 2)), p[1] - 0.06 * F.pelvic, p[2] + 0.02]) });
  const gB = [0.04, 0.0, -0.035].map((dy, i) => { const p = surfaceAt(b, 0.23 + i * 0.002, Math.PI / 2, -0.004).pos; return [p[0], p[1] + dy - 0.015, p[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.8, base: gB, tip: gB.map((p, i): Vec3 => [p[0] + 0.075 * F.pect * (0.9 + 0.1 * (i / 2)), p[1] - 0.012 - 0.03 * (i / 2), p[2] + 0.04]) });
  return fins;
}

export function silhouette(sex: Sex, form: Form = 'standart'): Silhouette {
  const e = eyeGeom(sex, form);
  return { body: bodyOutline(bodyFor(sex, form), 40), fins: finsFor(sex, form).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
