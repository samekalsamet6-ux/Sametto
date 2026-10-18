// Betta (Betta splendens; standart "plakat" kısa yüzgeçli gövde, şematik) 3B modeli için SAF geometri parametreleri.
// DOM ve three.js kullanılmaz: birim testlenir, SVG yedeği de aynı sayılardan üretilir.
// Koordinatlar ve birimler için bkz. ../akvaryum/fishmath.ts (gövde uzunluğu 1; burun -x).
import {
  clamp, bodyOutline, finOutline, lerp, lineOnBody, makeBody, norm3, spline, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3,
} from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export type Sex = SexId;
export const SEXES: readonly Sex[] = ['erkek', 'disi'];

/** Gövde: uzun, yanlardan hafif basık; başı yassı; dişide karın daha dolgun, gövde biraz daha kısa/yuvarlak. Çift kuyrukta gövde biraz daha derin/kısa görünür. */
export function bodyFor(sex: Sex, form?: string): Body {
  const f = sex === 'disi';
  const d = formById(form).bodyDepth;
  // baş: yassı ve geniş (labirent balığı), alt çene biraz öne çıkık; ense hafif çukur, sonra gövde yükselir
  return makeBody(1, {
    top: spline([[0, 0.002], [0.025, 0.03], [0.07, 0.05], [0.14, 0.064], [0.21, 0.08], [0.3, 0.115 * d], [0.55, 0.114 * d], [0.78, 0.076 * d], [1, 0.05]]),
    bot: spline([[0, -0.03], [0.03, -0.058], [0.08, -0.072], [0.16, -0.095], [0.3, (f ? -0.145 : -0.116) * d], [0.55, (f ? -0.15 : -0.108) * d], [0.78, (f ? -0.08 : -0.064) * d], [1, -0.046]]),
    hw: spline([[0, 0.03], [0.06, 0.066], [0.14, 0.082], [0.22, 0.09], [0.3, (f ? 0.1 : 0.088) * d], [0.55, (f ? 0.095 : 0.078) * d], [0.78, 0.05], [1, 0.024]]),
    nTop: spline([[0, 2], [0.12, 2.8], [0.25, 2.5], [0.4, 2.2], [1, 2.1]]),
    nBot: spline([[0, 2], [0.12, 2.3], [0.3, 2.4], [0.6, 2.4], [1, 2.1]]),
    nose: 0.06,
  });
}

// ------------------------------------------------------------------ form (şekil) varyeteleri

/** Kuyruk yüzgeci biçimi. 'classic' = standart plakat kuyruğu; 'fan' = ışınları köke bağlı yelpaze; 'double' = üst ve alt iki lob */
export interface CaudalSpec {
  kind: 'classic' | 'fan' | 'double';
  /** Yelpazenin yarı açısı (rad); yarım ay = π/2 (toplam 180°) */
  half: number;
  /** Erkekte orta ışın uzunluğu (gövde boyu = 1) */
  len: number;
  /** 0 = yuvarlak (sabit yarıçap) … 1 = düz arka kenar (üçgen/delta) */
  flat: number;
  /** Tüm yelpazenin aşağı sarkması (rad) */
  droop: number;
  /** 0..1 ortadaki ışınlar daha uzun (sivri uç) */
  taper: number;
  /** Alt ışınlar ek uzunluk oranı */
  lowerBias: number;
  /** Işın sayısı */
  rays: number;
}

export type FinTexture = 'plain' | 'crown' | 'comb' | 'rose';

export interface FormSpec {
  id: string;
  caudal: CaudalSpec;
  /** Sırt/anal yüzgeç boy ve geriye uzanma çarpanları */
  dorsal: { k: number; sweep: number };
  anal: { k: number; sweep: number };
  pelvic: number;
  /** Göğüs yüzgeci çarpanı (fil kulak = büyük) */
  pectoral: number;
  /** Yüzgeç ışın dokusu: crown = zar ışınlar arasında çok geri çekilmiş (dikenli), comb = az geri çekilmiş, rose = kıvrımlı/dalgalı */
  tex: FinTexture;
  bodyDepth: number;
}

const classic: CaudalSpec = { kind: 'classic', half: 0.46 * Math.PI, len: 0.31, flat: 0, droop: 0, taper: 0, lowerBias: 0, rays: 11 };
const fan = (half: number, len: number, o: Partial<CaudalSpec> = {}): CaudalSpec => ({ kind: 'fan', half, len, flat: 0, droop: 0, taper: 0, lowerBias: 0, rays: 17, ...o });

const F = (id: string, caudal: CaudalSpec, o: Partial<Omit<FormSpec, 'id' | 'caudal'>> = {}): FormSpec => ({
  id, caudal, dorsal: { k: 1, sweep: 1 }, anal: { k: 1, sweep: 1 }, pelvic: 1, pectoral: 1, tex: 'plain', bodyDepth: 1, ...o,
});

/** Geometri tanımları (şematik). Sıra = arayüz sırası; ilki standart form. */
export const FORM_SPECS: FormSpec[] = [
  F('plakat', classic),
  F('veiltail', fan(0.82, 0.37, { droop: 0.38, taper: 0.4, lowerBias: 0.18 }), { dorsal: { k: 1.3, sweep: 1.2 }, anal: { k: 1.5, sweep: 1.1 }, pelvic: 1.1 }),
  F('spade', fan(0.74, 0.31, { taper: 0.7 }), { dorsal: { k: 1.2, sweep: 1.15 }, anal: { k: 1.3, sweep: 1.05 }, pelvic: 1.05 }),
  F('delta', fan(0.85, 0.265, { flat: 0.9 }), { dorsal: { k: 1.4, sweep: 1.3 }, anal: { k: 1.6, sweep: 1.2 }, pelvic: 1.1 }),
  F('super-delta', fan(1.22, 0.255, { flat: 0.2 }), { dorsal: { k: 1.55, sweep: 1.45 }, anal: { k: 1.75, sweep: 1.3 }, pelvic: 1.15 }),
  F('halfmoon', fan(Math.PI / 2, 0.335), { dorsal: { k: 1.75, sweep: 1.7 }, anal: { k: 1.95, sweep: 1.45 }, pelvic: 1.2 }),
  F('overhalfmoon', fan(1.8, 0.33), { dorsal: { k: 1.85, sweep: 1.8 }, anal: { k: 2.05, sweep: 1.5 }, pelvic: 1.2 }),
  F('crowntail', fan(1.05, 0.33, { flat: 0.35, rays: 23 }), { dorsal: { k: 1.35, sweep: 1.25 }, anal: { k: 1.5, sweep: 1.15 }, pelvic: 1.15, tex: 'crown' }),
  F('combtail', fan(1.0, 0.31, { flat: 0.3, rays: 23 }), { dorsal: { k: 1.3, sweep: 1.2 }, anal: { k: 1.45, sweep: 1.1 }, pelvic: 1.1, tex: 'comb' }),
  F('rosetail', fan(1.4, 0.33, { rays: 21 }), { dorsal: { k: 1.7, sweep: 1.6 }, anal: { k: 1.9, sweep: 1.4 }, pelvic: 1.2, tex: 'rose' }),
  F('double-tail', { kind: 'double', half: 1.4, len: 0.3, flat: 0.25, droop: 0, taper: 0, lowerBias: 0, rays: 10 }, { dorsal: { k: 1.95, sweep: 1.75 }, anal: { k: 1.6, sweep: 1.25 }, pelvic: 1.1, bodyDepth: 1.1 }),
  F('dumbo', classic, { pectoral: 2.7 }),
];

export const DEFAULT_FORM = 'plakat';
export const formById = (id?: string): FormSpec => FORM_SPECS.find((f) => f.id === id) ?? FORM_SPECS[0];

/** Her yüzgeç için ölçüler (erkekte belirgin biçimde daha büyük) */
export interface FinSizes {
  dorsal: number; caudalLen: number; caudalSpread: number; anal: number; analS0: number; pelvic: number; pectoral: number;
}
export const FIN_SIZES: Record<Sex, FinSizes> = {
  erkek: { dorsal: 0.14, caudalLen: 0.31, caudalSpread: 2.5, anal: 0.17, analS0: 0.45, pelvic: 0.27, pectoral: 0.085 },
  disi: { dorsal: 0.075, caudalLen: 0.18, caudalSpread: 1.9, anal: 0.075, analS0: 0.5, pelvic: 0.13, pectoral: 0.07 },
};

/** Dişide süslü formlar daha az dramatiktir: boy çarpanlarının yalnızca yarısı uygulanır, kuyruk yelpazesi daralır, ışın uzantıları kısalır */
export const FEMALE_FANCY = { caudalLen: 0.6, spread: 0.84, k: 0.5, web: 0.35 } as const;
const femK = (k: number, sex: Sex) => (sex === 'disi' ? 1 + (k - 1) * FEMALE_FANCY.k : k);

/** Işınlar arası zarın bittiği konum (yüzgeç boyunun oranı, 0..1); 1 = tam zar. Crowntail'de zar en çok geri çekilir. */
export function webFraction(form: string | undefined, sex: Sex): number {
  const t = formById(form).tex;
  const w = t === 'crown' ? 0.5 : t === 'comb' ? 0.74 : t === 'rose' ? 0.9 : 1;
  return sex === 'disi' ? w + (1 - w) * FEMALE_FANCY.web : w;
}

export const EYE = { s: 0.122, phi: 1.12, radius: { erkek: 0.029, disi: 0.0285 } } as const;
export const OPERCULUM = { s: 0.215, phi0: 0.2, phi1: 2.0 } as const;

export function eyeSpec(sex: Sex, form?: string): { center: Vec3; normal: Vec3; radius: number } {
  const b = bodyFor(sex, form), r = EYE.radius[sex];
  const sf = surfaceAt(b, EYE.s, EYE.phi, -r * 0.35);
  return { center: sf.pos, normal: norm3([sf.normal[0] - 0.25, sf.normal[1] + 0.05, sf.normal[2]]), radius: r };
}

/** Ağız: üste dönük (üst ağız) küçük yarık; çene ucundan geriye ve YUKARI doğru çıkar, alt çene öne çıkıktır */
export function mouthLine(sex: Sex, side: 1 | -1, form?: string): Vec3[] {
  const b = bodyFor(sex, form);
  const pt = (s: number, phi: number): Vec3 => { const p = surfaceAt(b, s, phi, 0.0008).pos; return [p[0], p[1], p[2] * side]; };
  return [pt(0.004, 1.5), pt(0.03, 1.2), pt(0.058, 0.85)];
}

/** Solungaç kapağı kenarı (operkulum): sırttan karına kavisli çizgi */
export function operculumArc(sex: Sex, side: 1 | -1, n = 14, form?: string): Vec3[] {
  const b = bodyFor(sex, form), out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const phi = lerp(OPERCULUM.phi0, OPERCULUM.phi1, t);
    const p = surfaceAt(b, OPERCULUM.s + 0.032 * Math.sin(t * Math.PI) - 0.012 * t, phi, 0.0015).pos;
    out.push([p[0], p[1], p[2] * side]);
  }
  return out;
}

// ------------------------------------------------------------------ yüzgeçler

/** Işın uzunluğu profili: a = yelpaze içindeki açı (−half..half); düz arka kenar (flat), sivri uç (taper) ve alt ışınlarda uzama */
export function rayLength(c: CaudalSpec, len: number, a: number): number {
  const ca = Math.max(0.28, Math.cos(Math.min(Math.abs(a), 1.25)));
  const flatK = Math.pow(1 / ca, c.flat);
  const tap = 1 + c.taper * (Math.pow(Math.max(0, Math.cos((a / Math.max(0.2, c.half)) * (Math.PI / 2))), 1.5) * 0.9 - 0.35);
  const low = 1 + c.lowerBias * Math.max(0, -Math.sin(a));
  return len * flatK * tap * low;
}

/** Kuyruk yüzgeci: yelpaze ışınları tabandan çıkar. Dişide daha kısa ve dar. */
function caudalFins(b: Body, sex: Sex, spec: FormSpec): FinDef[] {
  const c = spec.caudal, S = FIN_SIZES[sex];
  const sec = b.section(1), cy = (sec.yTop + sec.yBot) / 2;
  const fem = sex === 'disi';
  if (c.kind === 'classic') {
    const N = c.rays, cBase: Vec3[] = [];
    for (let i = 0; i < N; i++) cBase.push([sec.x - 0.004, lerp(sec.yTop - 0.004, sec.yBot + 0.004, i / (N - 1)), 0]);
    return [{
      id: 'kuyruk', paired: false, flex: 0.8, base: cBase,
      tip: cBase.map((p, i): Vec3 => { const a = (i / (N - 1) - 0.5) * Math.PI * 0.92; return [p[0] + S.caudalLen * (0.5 + 0.5 * Math.cos(a)), cy + (p[1] - cy) * S.caudalSpread * (0.75 + 0.25 * Math.cos(a)), 0]; }),
    }];
  }
  const len = c.len * (fem ? FEMALE_FANCY.caudalLen : 1), half = c.half * (fem ? FEMALE_FANCY.spread : 1);
  const rose = spec.tex === 'rose';
  const crownJag = spec.tex === 'crown';
  const mk = (id: string, N: number, yTop: number, yBot: number, a0: number, a1: number, zOff: number, flex: number): FinDef => {
    const base: Vec3[] = [], tip: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const u = N === 1 ? 0.5 : i / (N - 1);
      const y = lerp(yTop, yBot, u);
      const a = lerp(a1, a0, u); // üstteki ışın en yukarı bakar
      const aa = a - c.droop;
      let r = c.kind === 'double' ? len * (0.9 + 0.1 * Math.sin(Math.PI * clamp((Math.abs(a) - 0.34) / Math.max(0.1, half - 0.34), 0, 1))) : rayLength(c, len, a);
      if (crownJag) r *= i % 2 ? 0.93 : 1.07; // dikenlerin boyu tek-çift farklı
      if (rose) r *= i % 2 ? 0.95 : 1.05;
      const z = zOff + (rose ? (i % 2 ? -1 : 1) * 0.03 * (fem ? 0.6 : 1) : 0);
      base.push([sec.x - 0.004, y, 0]);
      tip.push([sec.x - 0.004 + r * Math.cos(aa), y + r * Math.sin(aa), z]);
    }
    return { id, paired: false, flex, base, tip };
  };
  const yT = sec.yTop - 0.004, yB = sec.yBot + 0.004;
  if (c.kind === 'double') {
    const n = c.rays, mid = (yT + yB) / 2;
    const zs = fem ? 0.014 : 0.022;
    return [
      mk('kuyruk', n, yT, mid + 0.006, 0.34, half, zs, 0.8),
      mk('kuyruk2', n, mid - 0.006, yB, -half, -0.34, -zs, 0.8),
    ];
  }
  return [mk('kuyruk', c.rays, yT, yB, -half, half, 0, 0.8)];
}

export function finsFor(sex: Sex, form?: string): FinDef[] {
  const spec = formById(form), b = bodyFor(sex, form), S = FIN_SIZES[sex];
  const fins: FinDef[] = [];
  const dk = femK(spec.dorsal.k, sex), ak = femK(spec.anal.k, sex);
  const fancy = spec.id !== 'plakat' && spec.id !== 'dumbo';
  const nD = spec.tex === 'crown' || spec.tex === 'comb' ? 16 : 8;
  const nA = spec.tex === 'crown' || spec.tex === 'comb' ? 22 : 12;
  const D = S.dorsal * dk, A = S.anal * ak;

  // sırt yüzgeci: gövdenin arka yarısında, arkaya doğru yükselen yuvarlak üçgen (fancy formda daha uzun tabanlı ve geniş)
  const dS0 = fancy ? 0.57 - 0.05 * Math.min(1, (dk - 1) / 0.9) : 0.57;
  const dBase = lineOnBody(b, dS0, 0.8, 0, nD, 0.012);
  fins.push({
    id: 'sirt', paired: false, flex: 0.35,
    base: dBase,
    tip: dBase.map((p, i): Vec3 => { const u = i / (nD - 1); return [p[0] + D * (0.22 + 0.5 * u) * spec.dorsal.sweep, p[1] + D * (0.5 + 0.5 * Math.pow(Math.sin(Math.PI * (0.12 + 0.62 * u)), 0.9)), 0]; }),
  });

  // anal yüzgeç: uzun kökü olan, arkaya doğru uzayan yelpaze
  const aBase = lineOnBody(b, S.analS0 - (fancy ? 0.03 : 0), 0.93, Math.PI, nA, 0.012);
  fins.push({
    id: 'anal', paired: false, flex: 0.5,
    base: aBase,
    tip: aBase.map((p, i): Vec3 => { const u = i / (nA - 1); return [p[0] + A * (0.25 + 0.65 * u) * spec.anal.sweep, p[1] - A * (0.35 + 0.65 * Math.sin(Math.PI * (0.1 + 0.8 * Math.pow(u, 0.8)))), 0]; }),
  });

  fins.push(...caudalFins(b, sex, spec));

  // karın (pelvik) yüzgeçleri: öne yerleşik, uzun ince, ilk ışını en uzun
  const P = S.pelvic * (sex === 'disi' ? 1 + (spec.pelvic - 1) * FEMALE_FANCY.k : spec.pelvic);
  const pBase = [0.265, 0.28, 0.295, 0.31, 0.325].map((s) => surfaceAt(b, s, Math.PI * 0.8, -0.006).pos);
  fins.push({
    id: 'karin', paired: true, flex: 0.45,
    base: pBase,
    tip: pBase.map((p, i): Vec3 => [p[0] + P * (0.95 - 0.55 * (i / 4)), p[1] - P * (0.6 - 0.2 * (i / 4)), p[2] + 0.04]),
  });

  // göğüs yüzgeçleri: solungaç kapağının arkasında küçük, saydam, hızlı çırpan (fil kulakta büyük kürek biçimli)
  const gBase = [0.03, 0.0, -0.03, -0.055].map((dy, i) => { const p = surfaceAt(b, 0.262 + i * 0.002, Math.PI / 2 - 0.02 * i, -0.004).pos; return [p[0], p[1] + dy + 0.01, p[2]] as Vec3; });
  const pk = sex === 'disi' ? 1 + (spec.pectoral - 1) * 0.85 : spec.pectoral;
  const G = S.pectoral * pk;
  if (spec.pectoral > 1.5) {
    fins.push({
      id: 'gogus', paired: true, flex: 0.9,
      base: gBase,
      tip: gBase.map((p, i): Vec3 => { const u = i / 3, r = 0.8 + 0.35 * Math.sin(Math.PI * (0.15 + 0.7 * u)); return [p[0] + G * r * 0.78, p[1] + G * (0.22 - 0.62 * u), p[2] + G * r * 0.62]; }),
    });
  } else {
    fins.push({
      id: 'gogus', paired: true, flex: 0.9,
      base: gBase,
      tip: gBase.map((p, i): Vec3 => [p[0] + G * (0.85 + 0.2 * Math.sin(Math.PI * (i / 3))), p[1] - G * (0.1 + 0.55 * (i / 3)), p[2] + G * 0.75]),
    });
  }
  return fins;
}

/** Dişide karın altında yumurta borusu (ovipozitör) noktasının yeri */
export function ovipositor(sex: Sex, form?: string): { pos: Vec3; r: number } | null {
  if (sex !== 'disi') return null;
  const p = surfaceAt(bodyFor(sex, form), 0.37, Math.PI, 0.0).pos;
  return { pos: [p[0], p[1] - 0.004, 0], r: 0.0085 };
}

export function silhouette(sex: Sex, form?: string): Silhouette {
  const e = eyeSpec(sex, form);
  return {
    body: bodyOutline(bodyFor(sex, form), 40),
    fins: finsFor(sex, form).filter((f) => f.id !== 'gogus').map((f) => ({ id: f.id, pts: finOutline(f) })),
    eye: { c: [e.center[0], e.center[1]], r: e.radius },
  };
}

/** Yan görünüşte kuyruk yüzgecinin kapladığı en yüksek dikey açıklık (gövde boyu = 1): formlar arası karşılaştırma için */
export function caudalExtent(sex: Sex, form?: string): { span: number; reach: number; back: number } {
  const ks = finsFor(sex, form).filter((f) => f.id.startsWith('kuyruk'));
  const pts = ks.flatMap((f) => f.tip);
  const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
  return { span: Math.max(...ys) - Math.min(...ys), reach: Math.max(...xs) - 0.5, back: Math.min(...xs) };
}
