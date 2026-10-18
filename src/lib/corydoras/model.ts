// Corydoras (C. aeneus / C. paleatus tipi gövde; şematik) 3B modeli için SAF geometri parametreleri.
// Yüksek sırtlı, düz karınlı, zırh plakalı kedibalığı; farklı gövde biçimli türler (ör. uzun burunlu, Brochis) bilerek dahil değildir.
// Koordinatlar: bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, snoutFace, spline, surfaceAt, type Body, type FinDef, type MouthGeom, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export type Form = 'standart' | 'uzun-yuzgec' | 'balon';
export const FORM_IDS: readonly Form[] = ['standart', 'uzun-yuzgec', 'balon'];

/** Form parametreleri: gövde çarpanları (orta bölgede vurgulu) ve yüzgeç ölçekleri */
export interface FormParams { top: number; bot: number; hw: number; fin: { dorsal: number; anal: number; caudal: number; pelvic: number; pect: number; adipose: number } }
export const FORM_PARAMS: Record<Form, FormParams> = {
  standart: { top: 1, bot: 1, hw: 1, fin: { dorsal: 1, anal: 1, caudal: 1, pelvic: 1, pect: 1, adipose: 1 } },
  'uzun-yuzgec': { top: 1, bot: 1, hw: 1, fin: { dorsal: 1.6, anal: 1.9, caudal: 1.8, pelvic: 1.7, pect: 1.5, adipose: 1.5 } },
  balon: { top: 1.3, bot: 2.0, hw: 1.35, fin: { dorsal: 0.9, anal: 0.9, caudal: 0.95, pelvic: 0.95, pect: 0.95, adipose: 1 } },
};
const bump = (s: number) => Math.exp(-Math.pow((s - 0.47) / 0.26, 2));
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: yüksek sırt, düz karın, geniş omuz; dişide gövde belirgin biçimde daha geniş/dolgun (özellikle üstten bakınca) */
export function bodyFor(sex: Sex, form: Form = 'standart'): Body {
  const f = sex === 'disi' ? 1.14 : 1, P = FORM_PARAMS[form];
  // sırt: kısa ve dik burun/ense eğimi, dorsal yüzgeç kökünde (s ≈ 0.37) belirgin tepe (hörgüç), ardından arkaya doğru düz inen çizgi
  const top = spline([[0, 0.004], [0.035, 0.04], [0.09, 0.105], [0.17, 0.178], [0.27, 0.228], [0.36, 0.246], [0.45, 0.232], [0.6, 0.178], [0.78, 0.118], [0.9, 0.092], [1, 0.074]]);
  // karın: çeneden karın yüzgecine kadar neredeyse düz; kuyruk sapı derin
  const bot = spline([[0, -0.02], [0.045, -0.058], [0.11, -0.09], [0.22, -0.105], [0.45, -0.108], [0.62, -0.1], [0.78, -0.08], [0.9, -0.066], [1, -0.058]]);
  // omuz (göğüs kuşağı) geniş, geriye doğru yanlardan basık kuyruk sapı
  const hw = spline([[0, 0.03], [0.06, 0.08], [0.15, 0.122 * f], [0.28, 0.146 * f], [0.45, 0.132 * f], [0.7, 0.088 * f], [0.88, 0.05], [1, 0.034]]);
  return makeBody(1, {
    top: (s) => top(s) * (1 + (P.top - 1) * bump(s)),
    bot: (s) => bot(s) * (1 + (P.bot - 1) * bump(s)),
    hw: (s) => hw(s) * (1 + (P.hw - 1) * bump(s)),
    nTop: spline([[0, 2], [0.1, 2.0], [0.37, 1.75], [0.7, 1.9], [1, 2.1]]),
    nBot: spline([[0, 2], [0.15, 3.2], [0.4, 4.2], [0.7, 3.6], [1, 2.4]]),
    nose: 0.07,
  });
}

export const EYE = { s: 0.118, phi: 0.92, radius: 0.03 } as const;
export const OPERCULUM = { s: 0.205, phi0: 0.35, phi1: 2.35 } as const;
/** Zırh: iki sıra kemikli levha (üst sıra sırt, alt sıra karın tarafı); s aralığı ve yan çizginin w'si */
export const ARMOR = { s0: 0.22, s1: 0.97, plates: 24, split: 0.5 } as const;

export function eyeGeom(sex: Sex, form: Form = 'standart'): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex, form), r = EYE.radius;
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.55);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.2, sf.normal[1] + 0.35, sf.normal[2]]), radius: r };
}

/** Ağız: alt yüzde, burnun hemen gerisinde etli dudaklı emici halka (kapalı çevrim) */
export function lipsLoop(sex: Sex, n = 16, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), c = b.section(0.045);
  const cy = c.yBot, out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([c.x + Math.cos(a) * 0.026, cy - 0.004 + Math.abs(Math.sin(a)) * 0.002, Math.sin(a) * c.hw * 0.42]);
  }
  return out;
}

/** Alt (ventral) ağız: burnun eğik kesilmiş alt yüzünde, kalın etli dudaklar; bıyıklar dudak köşelerine oturur */
export function mouthSpec(sex: Sex, form: Form = 'standart'): MouthGeom {
  const b = bodyFor(sex, form), dir = norm3([-0.42, -0.9, 0]), c = snoutFace(b, 0.036, 0.88);
  return { c: [c[0] + 0.005, c[1] + 0.003, 0], dir, hw: 0.024, gap: 0.0052, lip: 0.0068, upper: 0.0025, lower: 0.0035, drop: 0.9, corner: 0.8 };
}

/** Üç çift bıyık (+z yanı için); her biri nokta dizisi ve yarıçaplar. Maksiller bıyık üst dudak köşesinden, mandibulerler alt dudaktan çıkar. */
export function barbels(sex: Sex, form: Form = 'standart'): { id: string; path: Vec3[]; radii: number[] }[] {
  const m = mouthSpec(sex, form), x = m.c[0], y = m.c[1], z = m.hw;
  const rel = (p: Vec3[], ox: number, oy: number, oz: number): Vec3[] => p.map((q): Vec3 => [x + ox + q[0], y + oy + q[1], oz + q[2]]);
  return [
    { id: 'maksiller', path: rel([[0, 0, 0], [-0.03, -0.012, 0.016], [-0.058, -0.03, 0.034], [-0.076, -0.05, 0.036]], 0.004, 0.003, z * 0.92), radii: [0.0058, 0.0042, 0.003, 0.002] },
    { id: 'mandibular-1', path: rel([[0, 0, 0], [-0.026, -0.016, 0.006], [-0.052, -0.036, 0.016], [-0.064, -0.056, 0.018]], 0.012, -0.001, z * 0.55), radii: [0.0045, 0.0034, 0.0024, 0.0017] },
    { id: 'mandibular-2', path: rel([[0, 0, 0], [-0.012, -0.022, 0.004], [-0.03, -0.046, 0.012], [-0.04, -0.068, 0.014]], 0.02, -0.002, z * 0.3), radii: [0.0042, 0.0031, 0.0022, 0.0016] },
  ];
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 14, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.03 * Math.sin(t * Math.PI) - 0.014 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

/** Yüzgeçler: büyük yuvarlak göğüs yüzgeçleri, yüksek üçgen sırt yüzgeci, küçük yağ yüzgeci, çatallı kuyruk */
export function finsFor(sex: Sex, form: Form = 'standart'): FinDef[] {
  const b = bodyFor(sex, form), F = FORM_PARAMS[form].fin, fins: FinDef[] = [];
  const dB = lineOnBody(b, 0.3, 0.45, 0, 7, 0.012);
  fins.push({ id: 'sirt', paired: false, flex: 0.3 * F.dorsal, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 6; return [p[0] + F.dorsal * (0.02 + 0.075 * (1 - 0.5 * u) * (0.55 + 0.45 * u)), p[1] + 0.235 * F.dorsal * (1 - 0.84 * Math.pow(u, 0.85)), 0]; }) });
  const aB = lineOnBody(b, 0.69, 0.76, 0, 5, 0.008);
  fins.push({ id: 'yag', paired: false, flex: 0.15, base: aB, tip: aB.map((p, i): Vec3 => [p[0] + F.adipose * (0.02 + 0.03 * (i / 4)), p[1] + 0.05 * F.adipose * (1 - 0.55 * (i / 4)) * Math.sin(Math.PI * (0.2 + 0.7 * (1 - i / 4))), 0]) });
  const nB = lineOnBody(b, 0.66, 0.77, Math.PI, 6, 0.01);
  fins.push({ id: 'anal', paired: false, flex: 0.35 * F.anal, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 5; return [p[0] + F.anal * (0.03 + 0.04 * u), p[1] - 0.1 * F.anal * (1 - 0.7 * u), 0]; }) });
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 9;
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
  fins.push({ id: 'kuyruk', paired: false, flex: 0.9, base: cB, tip: cB.map((p, i): Vec3 => { const v = Math.abs((2 * i) / (N - 1) - 1); return [p[0] + 0.19 * F.caudal * (0.45 + 0.55 * Math.pow(v, 0.7)), cy + (p[1] - cy) * (1.2 + 2.4 * Math.pow(v, 0.8) * (0.7 + 0.3 * F.caudal)), 0]; }) });
  const pB = [0.455, 0.47, 0.485].map((s) => surfaceAt(b, s, Math.PI * 0.82, -0.006).pos);
  fins.push({ id: 'karin', paired: true, flex: 0.4, base: pB, tip: pB.map((p, i): Vec3 => [p[0] + 0.07 * F.pelvic * (1 - 0.35 * (i / 2)), p[1] - 0.075 * F.pelvic, p[2] + 0.03]) });
  const gB = [0.0, -0.025, -0.05, -0.075].map((dy, i) => { const p = surfaceAt(b, 0.235 + i * 0.001, Math.PI * 0.64 + 0.03 * i, -0.008).pos; return [p[0], p[1] + dy + 0.02, p[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.7, base: gB, tip: gB.map((p, i): Vec3 => { const u = i / 3; return [p[0] + 0.14 * F.pect * (0.55 + 0.45 * Math.sin(Math.PI * (0.2 + 0.7 * (1 - u)))), p[1] - (0.04 + 0.035 * u) * F.pect, p[2] + 0.07 + 0.03 * (1 - u)]; }) });
  return fins;
}

/** Diken (sırt, yağ, göğüs yüzgeçlerinin ön ışını): +z yanı için yol ve taban yarıçapı */
export function spines(sex: Sex, form: Form = 'standart'): { id: string; path: Vec3[]; r: number; paired: boolean }[] {
  const f = finsFor(sex, form), pick = (id: string) => f.find((x) => x.id === id)!;
  const lerp3 = (a: Vec3, c: Vec3, t: number): Vec3 => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
  const d = pick('sirt'), a = pick('yag'), p = pick('gogus');
  return [
    { id: 'sirt', path: [lerp3(d.base[0], d.tip[0], 0), lerp3(d.base[0], d.tip[0], 0.5), lerp3(d.base[0], d.tip[0], 1.0)], r: 0.0068, paired: false },
    { id: 'yag', path: [lerp3(a.base[0], a.tip[0], 0), lerp3(a.base[0], a.tip[0], 0.6), lerp3(a.base[0], a.tip[0], 1.1)], r: 0.003, paired: false },
    { id: 'gogus', path: [lerp3(p.base[0], p.tip[0], 0), lerp3(p.base[0], p.tip[0], 0.5), lerp3(p.base[0], p.tip[0], 1.0)], r: 0.0062, paired: true },
  ];
}

export function silhouette(sex: Sex, form: Form = 'standart'): Silhouette {
  const e = eyeGeom(sex, form);
  return { body: bodyOutline(bodyFor(sex, form), 40), fins: finsFor(sex, form).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
