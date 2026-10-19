// Kaplan barb (Puntigrus tetrazona; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~0,92 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type PairedFinSpec, type FilamentSpec, type Pt,
} from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';
import { decorateKaplan } from './paint';

export * from '../akvaryum/yanal-model';

/** Tanınan şekil (form): standart ve seçmeli uzun yüzgeçli (long-fin / veil) hat */
export type FormId = 'standart' | 'uzun-yuzgec';
export const DEFAULT_FORM: FormId = 'standart';

/** Form parametreleri: yüzgeç ölçekleri (gövde aynıdır) */
export interface FormParams { dorsalH: number; dorsalBack: number; anal: number; caudal: number; pelvic: number; pect: number }
export const FORM_PARAMS: Record<FormId, FormParams> = {
  standart: { dorsalH: 1, dorsalBack: 1, anal: 1, caudal: 1, pelvic: 1, pect: 1 },
  'uzun-yuzgec': { dorsalH: 1.55, dorsalBack: 2.1, anal: 1.9, caudal: 1.75, pelvic: 1.7, pect: 1.25 },
};
export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];
export const SEXES: SexId[] = ['erkek', 'disi'];

/** Gövde: yüksek sırtlı (kambur), yanlardan basık; dişide karın daha dolgun ve gövde biraz iri */
export function bodyFor(sex: SexId): BodySpec {
  const f = sex === 'disi' ? 1 : 0;
  return {
    xs: -0.5, xe: 0.42,
    top: [[0, 0.0], [0.04, 0.04], [0.1, 0.1], [0.2, 0.172], [0.35, 0.214], [0.5, 0.2], [0.65, 0.15], [0.8, 0.092], [0.9, 0.062], [1, 0.046]],
    bot: [[0, 0.0], [0.04, -0.03], [0.1, -0.078], [0.2, -0.13 - 0.01 * f], [0.35, -0.166 - 0.026 * f], [0.5, -0.17 - 0.03 * f], [0.65, -0.13 - 0.018 * f], [0.8, -0.088], [0.9, -0.062], [1, -0.046]],
    width: [[0, 0], [0.08, 0.04], [0.25, 0.06], [0.45, 0.068 + 0.006 * f], [0.7, 0.05], [0.9, 0.028], [1, 0.02]],
    snoutY: -0.002, cap: 0.07, n: 2.3,
  };
}

const bodies = { erkek: bodyFor('erkek'), disi: bodyFor('disi') };
export const BODY: BodySpec = bodies.erkek;

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function ridgeFor(b: BodySpec, id: 'top' | 'bot', t0: number, t1: number, n = 28): Pt[] {
  const f = bodyFns(b);
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(b, t), f[id](t)] as Pt; });
}

function fin(b: BodySpec, id: 'top' | 'bot', t0: number, t1: number, h: (s: number) => number, back: (s: number) => number, n = 28): { base: Pt[]; edge: Pt[] } {
  const base = ridgeFor(b, id, t0, t1, n);
  const sign = id === 'top' ? 1 : -1;
  return { base, edge: base.map((p, i) => { const s = i / n; return [p[0] + back(s), p[1] + sign * h(s)] as Pt; }) };
}

/** Küçük, yuvarlak yelpaze göğüs yüzgeci (saydam) */
function pectoralFor(k: number): PairedFinSpec {
  const n = 8, base: Pt[] = [], edge: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = Math.PI * u;
    const y = -0.03 - 0.065 * u;
    base.push([-0.245, y]);
    edge.push([-0.245 + 0.075 * k * Math.sin(a) * (1 - 0.2 * u), y - 0.03 * k * u + 0.006 * Math.sin(a)]);
  }
  edge[0] = [-0.235, -0.028]; edge[n] = [-0.225 + 0.02 * k, -0.1 - 0.03 * k];
  return { base, edge };
}

const specCache = new Map<string, FishSpec>();
/** Forma ve cinsiyete göre tam geometri */
export function specFor(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): FishSpec {
  const fid: FormId = form in FORM_PARAMS ? (form as FormId) : DEFAULT_FORM;
  const sx: SexId = sex === 'disi' ? 'disi' : 'erkek';
  const key = `${fid}|${sx}`;
  let s = specCache.get(key);
  if (!s) {
    const P = FORM_PARAMS[fid];
    const body = bodies[sx];
    const f = bodyFns(body);
    // Sırt yüzgeci: ön ışınlar en uzun ve geriye eğik, arkaya doğru kısalır (üçgenimsi)
    const dorsal = fin(body, 'top', 0.4, 0.62,
      (u) => (0.04 + 0.145 * Math.pow(1 - u, 1.1)) * (0.55 + 0.45 * sm(0, 0.12, u)) * P.dorsalH,
      (u) => 0.075 * Math.pow(1 - u, 1.3) * P.dorsalBack + 0.012 * u);
    const anal = fin(body, 'bot', 0.6, 0.77,
      (u) => (0.03 + 0.075 * Math.pow(1 - u, 1.2)) * (0.55 + 0.45 * sm(0, 0.15, u)) * P.anal,
      (u) => 0.05 * (1 - u) * P.anal + 0.01 * u);
    // Kuyruk: orta derinlikte çatallı, sivrice loblar
    const x0 = 0.42, c = P.caudal, N = 40;
    const up: Pt[] = [[x0, 0.046], [x0 + 0.07, 0.075 + 0.01 * c], [x0 + 0.13 * c, 0.1 * (0.6 + 0.4 * c)], [x0 + 0.205 * c, 0.108 * (0.55 + 0.45 * c)], [x0 + 0.165 * c, 0.05], [x0 + 0.1 * Math.min(c, 1.3), 0.0]];
    const lo: Pt[] = up.slice(0, -1).map((p) => [p[0], -p[1]] as Pt).reverse();
    const caudalEdge = resample(smoothPath([...up, ...lo], 10), N);
    const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, 0.046 - 0.092 * (i / N)] as Pt);
    const fins: FinSpec[] = [
      { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
      { id: 'anal', ...anal, ripple: 0.006, flutter: 0.55 },
      { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
    ];
    // Karın yüzgeci: kısa, kırmızımsı; ince bir uç olarak gösterilir (iplik değil, gerçek yüzgeç kısa ve yelpazedir: şematik yaklaşım)
    const y0 = f.bot(0.36) + 0.012, xp = -0.17;
    const filaments: FilamentSpec[] = [{
      path: smoothPath([[xp, y0], [xp + 0.035, y0 - 0.025 * P.pelvic], [xp + 0.085 * P.pelvic, y0 - 0.048 * P.pelvic], [xp + 0.135 * P.pelvic, y0 - 0.058 * P.pelvic]], 8),
      radii: [0.02, 0.0155, 0.009, 0.003], z: 0.03,
    }];
    const pectoral = pectoralFor(P.pect);
    const mc = snoutFace(body, 0.017, 0.5);
    s = {
      body,
      atlas: atlasFor(body, fins, filaments, pectoral),
      swim: { x0: -0.05, x1: 0.56, amp: 0.045, k: 7, speed: 6 },
      eye: { x: -0.385, y: 0.05, r: 0.033 },
      fins, pectoral, filaments,
      mouth: [[-0.5, 0.0], [-0.472, -0.014], [-0.452, -0.022]],
      // küçük uç (terminal) ağız, dudaklı; bıyık (barbel) yok
      mouthGeom: { c: [mc[0] + 0.002, mc[1], 0], dir: [-0.99, 0.08, 0], hw: 0.0135, gap: 0.0048, lip: 0.0042, upper: 0.002, lower: 0.0026, drop: 1.4 },
      gill: smoothPath([[-0.305, 0.168], [-0.27, 0.085], [-0.257, 0.0], [-0.265, -0.08], [-0.29, -0.14]], 8),
      nostril: [-0.445, 0.05],
      lateral: [],
      skipFinBars: true,
      decorate: (tex, v) => decorateKaplan(s!, tex, v, sx),
    };
    specCache.set(key, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM, 'erkek');
export const FINS: FinSpec[] = SPEC.fins;
export { cornerPath };
