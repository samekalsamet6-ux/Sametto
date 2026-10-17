// Japon balığı (Carassius auratus) 3B modeli için SAF geometri parametreleri; renkten bağımsız FORM (şekil) varyeteleriyle.
// Formlar: common, comet, Bristol shubunkin (tek kuyruklu); fantail, ryukin, oranda, lionhead, telescope (moor), bubble eye,
// pearlscale (çift kuyruklu süs biçimleri). Şematik: gerçek ırk standartları değildir.
// Koordinatlar: bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import { bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

export type Form = 'standart' | 'comet' | 'bristol' | 'fantail' | 'ryukin' | 'oranda' | 'lionhead' | 'teleskop' | 'balon-goz' | 'inci';
export const FORM_IDS: readonly Form[] = ['standart', 'comet', 'bristol', 'fantail', 'ryukin', 'oranda', 'lionhead', 'teleskop', 'balon-goz', 'inci'];

type Knots = [number, number][];
export interface FormSpec {
  top: Knots; bot: Knots; hw: Knots;
  /** Sırt yüzgeci: yok ya da boy, taban aralığı, dikliği (0 yatık .. 1 dik) */
  dorsal: null | { H: number; s0: number; s1: number; upright: number };
  /** Kuyruk: tek çatallı/yuvarlak ya da çift (iki ayrık lob) */
  tail: { double: boolean; len: number; spread: number; fork: number; droop: number };
  /** Çift anal yüzgeç */
  doubleAnal: boolean;
  pelvic: number; pect: number;
  /** Baş büyümesi (wen): 0 yok, 1 oranda başlığı, 2 lionhead */
  wen: 0 | 1 | 2;
  eyes: 'normal' | 'teleskop' | 'balon';
  /** Kubbeli (inci) pullar */
  inci: boolean;
}

const COMMON_TOP: Knots = [[0, 0.012], [0.08, 0.075], [0.2, 0.16], [0.4, 0.21], [0.6, 0.185], [0.8, 0.108], [1, 0.056]];
const COMMON_BOT: Knots = [[0, -0.022], [0.08, -0.07], [0.2, -0.125], [0.45, -0.152], [0.65, -0.125], [0.85, -0.07], [1, -0.045]];
const COMMON_HW: Knots = [[0, 0.03], [0.08, 0.08], [0.25, 0.12], [0.45, 0.135], [0.7, 0.092], [1, 0.03]];
const scaleK = (k: Knots, f: number): Knots => k.map(([s, v]) => [s, v * f]);

const FANTAIL: Pick<FormSpec, 'top' | 'bot' | 'hw'> = {
  top: [[0, 0.012], [0.08, 0.09], [0.2, 0.2], [0.4, 0.27], [0.6, 0.245], [0.82, 0.14], [1, 0.07]],
  bot: [[0, -0.025], [0.08, -0.085], [0.2, -0.165], [0.45, -0.215], [0.65, -0.19], [0.85, -0.1], [1, -0.05]],
  hw: [[0, 0.03], [0.08, 0.095], [0.25, 0.15], [0.45, 0.17], [0.7, 0.11], [1, 0.04]],
};
const DBL = (len: number, spread: number, droop: number) => ({ double: true, len, spread, fork: 0.3, droop });

export const FORM_SPECS: Record<Form, FormSpec> = {
  standart: { top: COMMON_TOP, bot: COMMON_BOT, hw: COMMON_HW, dorsal: { H: 0.185, s0: 0.3, s1: 0.7, upright: 0.3 }, tail: { double: false, len: 0.33, spread: 2.7, fork: 0.62, droop: 0 }, doubleAnal: false, pelvic: 1, pect: 1, wen: 0, eyes: 'normal', inci: false },
  comet: { top: scaleK(COMMON_TOP, 0.88), bot: scaleK(COMMON_BOT, 0.85), hw: scaleK(COMMON_HW, 0.9), dorsal: { H: 0.17, s0: 0.3, s1: 0.68, upright: 0.25 }, tail: { double: false, len: 0.6, spread: 2.2, fork: 0.5, droop: 0 }, doubleAnal: false, pelvic: 1.1, pect: 1.05, wen: 0, eyes: 'normal', inci: false },
  bristol: { top: COMMON_TOP, bot: COMMON_BOT, hw: COMMON_HW, dorsal: { H: 0.19, s0: 0.3, s1: 0.7, upright: 0.3 }, tail: { double: false, len: 0.36, spread: 3.5, fork: 1.35, droop: 0 }, doubleAnal: false, pelvic: 1.1, pect: 1.1, wen: 0, eyes: 'normal', inci: false },
  fantail: { ...FANTAIL, dorsal: { H: 0.26, s0: 0.3, s1: 0.66, upright: 0.8 }, tail: DBL(0.56, 3.0, 0.1), doubleAnal: true, pelvic: 1.25, pect: 1.15, wen: 0, eyes: 'normal', inci: false },
  ryukin: {
    top: [[0, 0.012], [0.08, 0.1], [0.2, 0.26], [0.33, 0.36], [0.5, 0.3], [0.75, 0.15], [1, 0.07]],
    bot: [[0, -0.025], [0.08, -0.09], [0.2, -0.17], [0.45, -0.225], [0.65, -0.2], [0.85, -0.1], [1, -0.05]],
    hw: [[0, 0.03], [0.08, 0.1], [0.25, 0.165], [0.45, 0.18], [0.7, 0.115], [1, 0.04]],
    dorsal: { H: 0.33, s0: 0.27, s1: 0.6, upright: 0.9 }, tail: DBL(0.6, 3.1, 0.12), doubleAnal: true, pelvic: 1.3, pect: 1.2, wen: 0, eyes: 'normal', inci: false,
  },
  oranda: { ...FANTAIL, dorsal: { H: 0.25, s0: 0.3, s1: 0.65, upright: 0.8 }, tail: DBL(0.66, 3.2, 0.14), doubleAnal: true, pelvic: 1.3, pect: 1.2, wen: 1, eyes: 'normal', inci: false },
  lionhead: {
    top: [[0, 0.012], [0.08, 0.1], [0.2, 0.2], [0.4, 0.235], [0.6, 0.22], [0.82, 0.13], [1, 0.065]],
    bot: [[0, -0.025], [0.08, -0.085], [0.2, -0.165], [0.45, -0.21], [0.65, -0.185], [0.85, -0.1], [1, -0.05]],
    hw: [[0, 0.03], [0.08, 0.1], [0.25, 0.15], [0.45, 0.17], [0.7, 0.11], [1, 0.04]],
    dorsal: null, tail: DBL(0.42, 2.7, 0.07), doubleAnal: true, pelvic: 1.2, pect: 1.15, wen: 2, eyes: 'normal', inci: false,
  },
  teleskop: { ...FANTAIL, dorsal: { H: 0.23, s0: 0.3, s1: 0.66, upright: 0.8 }, tail: DBL(0.56, 3.0, 0.1), doubleAnal: true, pelvic: 1.25, pect: 1.15, wen: 0, eyes: 'teleskop', inci: false },
  'balon-goz': {
    top: [[0, 0.012], [0.08, 0.085], [0.2, 0.18], [0.4, 0.235], [0.6, 0.215], [0.82, 0.125], [1, 0.065]],
    bot: [[0, -0.024], [0.08, -0.08], [0.2, -0.15], [0.45, -0.19], [0.65, -0.17], [0.85, -0.09], [1, -0.048]],
    hw: [[0, 0.03], [0.08, 0.09], [0.25, 0.14], [0.45, 0.155], [0.7, 0.1], [1, 0.036]],
    dorsal: null, tail: DBL(0.46, 2.8, 0.08), doubleAnal: true, pelvic: 1.2, pect: 1.15, wen: 0, eyes: 'balon', inci: false,
  },
  inci: {
    top: [[0, 0.012], [0.08, 0.12], [0.2, 0.27], [0.4, 0.32], [0.6, 0.3], [0.82, 0.17], [1, 0.08]],
    bot: [[0, -0.03], [0.08, -0.11], [0.2, -0.22], [0.45, -0.29], [0.65, -0.26], [0.85, -0.12], [1, -0.06]],
    hw: [[0, 0.03], [0.08, 0.11], [0.25, 0.18], [0.45, 0.205], [0.7, 0.14], [1, 0.045]],
    dorsal: { H: 0.22, s0: 0.3, s1: 0.64, upright: 0.75 }, tail: DBL(0.48, 2.8, 0.08), doubleAnal: true, pelvic: 1.25, pect: 1.15, wen: 0, eyes: 'normal', inci: true,
  },
};

export const specOf = (form: Form): FormSpec => FORM_SPECS[form];

/** Gövde: üreme dönemindeki dişide karın daha dolgun */
export function bodyFor(sex: Sex, form: Form = 'standart'): Body {
  const P = FORM_SPECS[form], f = sex === 'disi' ? 1 : 0;
  const top = spline(P.top), bot = spline(P.bot), hw = spline(P.hw);
  const belly = (s: number) => Math.exp(-Math.pow((s - 0.5) / 0.22, 2));
  return makeBody(1, {
    top: (s) => top(s),
    bot: (s) => bot(s) * (1 + 0.15 * f * belly(s)),
    hw: (s) => hw(s) * (1 + 0.11 * f * belly(s)),
    nTop: spline([[0, 2], [0.4, 2.2], [1, 2.1]]),
    nBot: spline([[0, 2], [0.45, 2.1], [1, 2.1]]),
    nose: 0.065,
  });
}

export const EYE = { s: 0.105, phi: 1.15, radius: 0.03 } as const;
export const OPERCULUM = { s: 0.2, phi0: 0.35, phi1: 2.3 } as const;
export const LATERAL = { s0: 0.22, s1: 0.97, w: 0.5 } as const;

export function eyeGeom(sex: Sex, form: Form = 'standart'): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex, form), kind = FORM_SPECS[form].eyes;
  if (kind === 'teleskop') {
    // gözler yanlara doğru koni gibi dışarı taşar
    const sf = surfaceAt(b, 0.1, 1.2, 0.0);
    return { center: [sf.pos[0] - 0.012, sf.pos[1] + 0.012, sf.pos[2] + 0.075], normal: norm3([-0.2, 0.1, 1]), radius: 0.046 };
  }
  if (kind === 'balon') {
    // gözler yukarı bakar; altlarında sıvı keseleri sarkar
    const sf = surfaceAt(b, 0.1, 0.62, 0.0);
    return { center: [sf.pos[0], sf.pos[1] - 0.004, sf.pos[2]], normal: norm3([-0.15, 1, 0.35]), radius: 0.04 };
  }
  const r = EYE.radius, sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.35);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.2, sf.normal[1] + 0.05, sf.normal[2]]), radius: r };
}

/** Göz ekleri: teleskopta göz sapı (koni), balon gözde sıvı kesesi (+z yanı için) */
export function eyeExtras(sex: Sex, form: Form = 'standart'): { stalk?: { path: Vec3[]; radii: number[] }; sac?: { center: Vec3; radii: Vec3 } } {
  const kind = FORM_SPECS[form].eyes;
  if (kind === 'normal') return {};
  const e = eyeGeom(sex, form), b = bodyFor(sex, form);
  if (kind === 'teleskop') {
    const sf = surfaceAt(b, 0.1, 1.2, -0.01).pos;
    return { stalk: { path: [[sf[0], sf[1] - 0.01, sf[2] - 0.01], [(sf[0] + e.center[0]) / 2, (sf[1] + e.center[1]) / 2 - 0.005, (sf[2] + e.center[2]) / 2], [e.center[0], e.center[1], e.center[2] - 0.01]], radii: [0.052, 0.046, 0.04] } };
  }
  return { sac: { center: [e.center[0] + 0.005, e.center[1] - 0.09, e.center[2] + 0.02], radii: [0.066, 0.092, 0.07] } };
}

/** Wen (baş büyümesi): oranda başlığı ya da lionhead; iç içe yumrulu elipsoit (merkez, yarıçaplar, yumru sayısı) */
export function wenSpec(sex: Sex, form: Form = 'standart'): null | { center: Vec3; radii: Vec3; bumps: number; amp: number } {
  const w = FORM_SPECS[form].wen;
  if (!w) return null;
  const b = bodyFor(sex, form);
  const top = b.section(0.1);
  if (w === 1) return { center: [top.x - 0.005, top.yTop - 0.01, 0], radii: [0.105, 0.078, 0.105], bumps: 7, amp: 0.12 };
  const sec = b.section(0.12);
  return { center: [sec.x - 0.01, sec.yTop - 0.045, 0], radii: [0.16, 0.13, sec.hw * 1.12], bumps: 9, amp: 0.15 };
}

export function mouthLine(sex: Sex, side: 1 | -1, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), c = b.section(0.004), q = b.section(0.055);
  const cy = (c.yTop + c.yBot) / 2;
  return [[c.x - 0.002, cy - 0.004, 0], [lerp(c.x, q.x, 0.5), cy - 0.01, side * q.hw * 0.3], [q.x, (q.yTop + q.yBot) / 2 - 0.018, side * q.hw * 0.52]];
}

export function nostrils(sex: Sex, form: Form = 'standart'): { pos: Vec3; r: number }[] {
  const b = bodyFor(sex, form);
  return [[0.045, 0.75], [0.065, 0.8]].map(([s, phi]) => ({ pos: surfaceAt(b, s, phi, 0.001).pos, r: 0.0042 }));
}

export function operculumArc(sex: Sex, side: 1 | -1, n = 16, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = surfaceAt(b, OPERCULUM.s + 0.035 * Math.sin(t * Math.PI) - 0.012 * t, lerp(OPERCULUM.phi0, OPERCULUM.phi1, t), 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

/** Üreme tüberkülleri (yalnızca erkekte) */
export function tubercles(sex: Sex, form: Form = 'standart'): Vec3[] {
  if (sex !== 'erkek') return [];
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < 9; i++) { const p = surfaceAt(b, 0.17 + 0.012 * (i % 3), 1.0 + 0.2 * Math.floor(i / 3) + 0.04 * (i % 2), 0.001).pos; out.push(p); }
  const pect = finsFor(sex, form).find((f) => f.id === 'gogus')!;
  for (let i = 0; i < 5; i++) { const t = 0.25 + 0.14 * i; out.push([lerp(pect.base[0][0], pect.tip[0][0], t), lerp(pect.base[0][1], pect.tip[0][1], t), lerp(pect.base[0][2], pect.tip[0][2], t) + 0.004]); }
  return out;
}

export function lateralLine(sex: Sex, n = 22, form: Form = 'standart'): Vec3[] {
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < n; i++) { const s = lerp(LATERAL.s0, LATERAL.s1, i / (n - 1)); out.push(surfaceAt(b, s, Math.PI * (LATERAL.w - 0.02 * (1 - s)), 0.0008).pos); }
  return out;
}

/** Yüzgeçler: forma göre sırt (yok olabilir), tek/çift anal, tek/çift kuyruk, karın ve göğüs çiftleri */
export function finsFor(sex: Sex, form: Form = 'standart'): FinDef[] {
  const b = bodyFor(sex, form), P = FORM_SPECS[form], fins: FinDef[] = [];
  if (P.dorsal) {
    const D = P.dorsal;
    const dB = lineOnBody(b, D.s0, D.s1, 0, 10, 0.012);
    fins.push({ id: 'sirt', paired: false, flex: 0.3, base: dB, tip: dB.map((p, i): Vec3 => { const u = i / 9; return [p[0] + lerp(0.03 + 0.12 * u, 0.02 + 0.07 * u, D.upright), p[1] + D.H * (1 - 0.65 * Math.pow(u, 1.1)) * (0.85 + 0.15 * Math.sin(Math.PI * Math.min(1, u * 1.2))), 0]; }) });
  }
  const T = P.tail;
  if (P.doubleAnal) {
    const nB = lineOnBody(b, 0.62, 0.78, Math.PI, 7, 0.012).map((p): Vec3 => [p[0], p[1], 0.014]);
    fins.push({ id: 'anal', paired: true, flex: 0.4, cup: 0.02, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 6; return [p[0] + 0.05 + 0.07 * u, p[1] - 0.13 * (1 - 0.6 * u), 0.05 + 0.03 * u]; }) });
  } else {
    const nB = lineOnBody(b, 0.63, 0.79, Math.PI, 7, 0.012);
    fins.push({ id: 'anal', paired: false, flex: 0.35, base: nB, tip: nB.map((p, i): Vec3 => { const u = i / 6; return [p[0] + 0.04 + 0.06 * u, p[1] - 0.115 * (1 - 0.65 * u), 0]; }) });
  }
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2, N = 11;
  const cB: Vec3[] = [];
  for (let i = 0; i < N; i++) cB.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), T.double ? 0.006 : 0]);
  fins.push({
    id: 'kuyruk', paired: T.double, flex: 0.9, cup: T.double ? 0.05 : 0, base: cB,
    tip: cB.map((p, i): Vec3 => {
      const v = Math.abs((2 * i) / (N - 1) - 1);
      const x = p[0] + T.len * (T.fork + (1 - T.fork) * Math.pow(v, 0.65));
      const y = cy + (p[1] - cy) * (1.1 + (T.spread - 1.1) * Math.pow(v, 0.8)) - T.droop * T.len * (1 - 0.4 * v);
      return [x, y, T.double ? 0.04 + 0.12 * (0.4 + 0.6 * (1 - v)) : 0];
    }),
  });
  const pB = [0.44, 0.455, 0.47, 0.485].map((s) => surfaceAt(b, s, Math.PI * 0.8, -0.006).pos);
  fins.push({ id: 'karin', paired: true, flex: 0.4, base: pB, tip: pB.map((p, i): Vec3 => [p[0] + 0.1 * P.pelvic * (1 - 0.4 * (i / 3)), p[1] - 0.1 * P.pelvic * (1 - 0.2 * (i / 3)), p[2] + 0.045]) });
  const gB = [0.03, 0.0, -0.03, -0.06].map((dy, i) => { const p = surfaceAt(b, 0.225 + i * 0.002, Math.PI * 0.58 + 0.03 * i, -0.006).pos; return [p[0], p[1] + dy, p[2]] as Vec3; });
  fins.push({ id: 'gogus', paired: true, flex: 0.7, base: gB, tip: gB.map((p, i): Vec3 => { const u = i / 3; return [p[0] + 0.13 * P.pect * (0.7 + 0.3 * Math.sin(Math.PI * (0.2 + 0.7 * (1 - u)))), p[1] - (0.045 + 0.05 * u) * P.pect, p[2] + 0.075]; }) });
  return fins;
}

export function silhouette(sex: Sex, form: Form = 'standart'): Silhouette {
  const e = eyeGeom(sex, form);
  return { body: bodyOutline(bodyFor(sex, form), 40), fins: finsFor(sex, form).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })), eye: { c: [e.center[0], e.center[1]], r: e.radius } };
}
