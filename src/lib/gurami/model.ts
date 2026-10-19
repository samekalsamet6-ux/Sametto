// Cüce gurami (Trichogaster lalius; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~0,92 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type Pt,
} from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';
import { decorateGurami } from './paint';

export * from '../akvaryum/yanal-model';

/** Tanınan şekil (form) varyetesi yoktur: tek ve standart biçim (bkz. forms.ts). */
export type FormId = 'standart';
export const DEFAULT_FORM: FormId = 'standart';
export const FORM_IDS: FormId[] = ['standart'];
export const SEXES: SexId[] = ['erkek', 'disi'];

/** Gövde: yanlardan basık oval; dişide karın daha dolgun, erkekte daha ince */
export function bodyFor(sex: SexId): BodySpec {
  const f = sex === 'disi' ? 1 : 0;
  return {
    xs: -0.5, xe: 0.42,
    top: [[0, 0.015], [0.04, 0.045], [0.1, 0.085], [0.2, 0.14], [0.35, 0.185], [0.5, 0.197 - 0.004 * f], [0.65, 0.18], [0.8, 0.128], [0.9, 0.088], [1, 0.062]],
    bot: [[0, 0.015], [0.04, -0.02], [0.1, -0.07], [0.2, -0.145 - 0.008 * f], [0.35, -0.205 - 0.02 * f], [0.5, -0.217 - 0.028 * f], [0.65, -0.19 - 0.02 * f], [0.8, -0.135 - 0.01 * f], [0.9, -0.088], [1, -0.062]],
    width: [[0, 0], [0.08, 0.04], [0.25, 0.062], [0.5, 0.068 + 0.006 * f], [0.7, 0.056], [0.9, 0.03], [1, 0.02]],
    snoutY: 0.02, cap: 0.08, n: 2.4,
  };
}

const bodies = { erkek: bodyFor('erkek'), disi: bodyFor('disi') };
export const BODY: BodySpec = bodies.erkek;

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

interface FinShape {
  /** Taban t aralığı */
  t0: number; t1: number;
  /** Yükseklik profili (s: 0 ön .. 1 arka) ve arkaya doğru eğim/uzantı */
  h: (s: number) => number;
  back: (s: number) => number;
}

/** Cinsiyete göre sırt ve anal yüzgeç: erkekte sırt sivri ve uzun (son ışınlar uzar), dişide kısa ve yuvarlak. */
function shapes(sex: SexId): { dorsal: FinShape; anal: FinShape } {
  const m = sex === 'erkek';
  return {
    dorsal: {
      t0: 0.54, t1: 0.9,
      h: m ? (s) => 0.02 + 0.14 * Math.pow(sm(0, 0.93, s), 1.3) * (1 - 0.95 * sm(0.93, 1, s)) : (s) => 0.015 + 0.07 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.85)), 0.7),
      back: m ? (s) => 0.115 * sm(0.45, 0.94, s) * (1 - sm(0.94, 1, s)) : (s) => 0.01 * s,
    },
    anal: {
      t0: 0.36, t1: 0.94,
      h: m ? (s) => 0.012 + 0.085 * Math.pow(sm(0, 0.35, s), 0.8) * (1 - 0.25 * sm(0.55, 1, s)) + 0.025 * sm(0.8, 0.96, s) * (1 - sm(0.96, 1, s)) : (s) => 0.01 + 0.062 * Math.pow(sm(0, 0.4, s), 0.8) * (1 - 0.5 * sm(0.55, 1, s)),
      back: m ? (s) => 0.07 * sm(0.5, 1, s) : (s) => 0.03 * sm(0.5, 1, s),
    },
  };
}

function ridgeFor(b: BodySpec, id: 'top' | 'bot', t0: number, t1: number, n = 28): Pt[] {
  const f = bodyFns(b);
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(b, t), f[id](t)] as Pt; });
}

function fin(b: BodySpec, id: 'top' | 'bot', sh: FinShape, n = 28): { base: Pt[]; edge: Pt[] } {
  const base = ridgeFor(b, id, sh.t0, sh.t1, n);
  const sign = id === 'top' ? 1 : -1;
  const edge = base.map((p, i) => { const s = i / n; return [p[0] + sh.back(s), p[1] + sign * sh.h(s)] as Pt; });
  return { base, edge };
}

// Küçük, yuvarlak yelpaze göğüs yüzgeci: taban dikey bir çizgi, uç yarım elips
const PECTORAL = (() => {
  const n = 8, base: Pt[] = [], edge: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = Math.PI * u;
    const y = 0.02 - 0.075 * u;
    base.push([-0.215, y]);
    edge.push([-0.215 + 0.062 * Math.sin(a) * (1 - 0.25 * u), y + 0.004 * Math.sin(a) - 0.0 ]);
  }
  edge[0] = [-0.205, 0.022]; edge[n] = [-0.2, -0.055];
  return { base, edge };
})();

const specCache = new Map<string, FishSpec>();
/** Cinsiyete göre tam geometri (form tek olduğundan formdan bağımsız) */
export function specFor(_form: string = DEFAULT_FORM, sex: SexId = 'erkek'): FishSpec {
  const sx: SexId = sex === 'disi' ? 'disi' : 'erkek';
  let s = specCache.get(sx);
  if (!s) {
    const body = bodies[sx];
    const f = bodyFns(body);
    const sh = shapes(sx);
    const dorsal = fin(body, 'top', sh.dorsal), anal = fin(body, 'bot', sh.anal);
    // Kuyruk: küçük, yuvarlak (hafif kesik) yelpaze
    const x0 = 0.412;
    const caudalEdge = resample(smoothPath([[x0, 0.058], [x0 + 0.07, 0.092], [x0 + 0.145, 0.076], [x0 + 0.178, 0.0], [x0 + 0.145, -0.076], [x0 + 0.07, -0.092], [x0, -0.058]], 12), 40);
    const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, 0.058 - 0.116 * sm(0.28, 0.72, i / 40)]);
    const fins: FinSpec[] = [
      { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
      { id: 'anal', ...anal, ripple: 0.007, flutter: 0.55 },
      { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
    ];
    // Karın yüzgeçleri: boğaz altından çıkan, çok uzamış iki ince "dokunma ipliği"; ucu geriye ve aşağıya
    const f0: Pt = [-0.23, f.bot(0.2) + 0.012];
    const filaments = [{
      path: smoothPath([f0, [-0.19, f0[1] - 0.09], [-0.1, f0[1] - 0.2], [0.02, f0[1] - 0.285], [0.1 + (sx === 'erkek' ? 0.03 : 0), f0[1] - 0.34]], 8),
      radii: [0.0125, 0.0082, 0.0052, 0.0028, 0.0012], z: 0.026,
    }];
    const mc = snoutFace(body, 0.017, 0.5);
    const d = Math.hypot(0.78, 0.62);
    s = {
      body,
      atlas: atlasFor(body, fins, filaments, PECTORAL),
      swim: { x0: -0.05, x1: 0.56, amp: 0.045, k: 7, speed: 6 },
      eye: { x: -0.372, y: 0.052, r: 0.031 },
      fins, pectoral: PECTORAL, filaments,
      mouth: [[-0.498, 0.03], [-0.47, 0.012], [-0.452, -0.005]],
      // küçük, belirgin biçimde yukarı bakan ağız; burun düz kesilip ağız bu yüze oturur
      mouthGeom: { c: [mc[0] + 0.002, mc[1], 0], dir: [-0.78 / d, 0.62 / d, 0], hw: 0.0135, gap: 0.0048, lip: 0.0042, upper: 0.002, lower: 0.0026, drop: 1.4 },
      gill: smoothPath([[-0.302, 0.115], [-0.255, 0.06], [-0.24, -0.0], [-0.248, -0.075], [-0.275, -0.14]], 8),
      nostril: [-0.46, 0.062],
      // Yan çizgi bu türde eksik/kesintilidir: çizilmez
      lateral: [],
      skipFinBars: false,
      decorate: (tex, v) => decorateGurami(s!, tex, v),
    };
    specCache.set(sx, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM, 'erkek');
export const FINS: FinSpec[] = SPEC.fins;
export { cornerPath };
