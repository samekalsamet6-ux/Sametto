// Zebra danio (Danio rerio; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~0,92 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type PairedFinSpec, type FilamentSpec, type Pt,
} from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';
import { decorateZebra } from './paint';

export * from '../akvaryum/yanal-model';

/** Tanınan şekil (form): standart ve seçmeli uzun yüzgeçli (long-fin / veil) hat */
export type FormId = 'standart' | 'uzun-yuzgec';
export const DEFAULT_FORM: FormId = 'standart';

/** Form parametreleri: yüzgeç ölçekleri (gövde aynıdır) */
export interface FormParams { dorsalH: number; dorsalBack: number; anal: number; caudal: number; pelvic: number; pect: number }
export const FORM_PARAMS: Record<FormId, FormParams> = {
  standart: { dorsalH: 1, dorsalBack: 1, anal: 1, caudal: 1, pelvic: 1, pect: 1 },
  'uzun-yuzgec': { dorsalH: 1.6, dorsalBack: 2.2, anal: 1.8, caudal: 1.8, pelvic: 1.8, pect: 1.25 },
};
export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];
export const SEXES: SexId[] = ['erkek', 'disi'];

/** Gövde: ince, mekik (fusiform) biçimli, hafif yanlardan basık; dişide karın daha dolgun */
export function bodyFor(sex: SexId): BodySpec {
  const f = sex === 'disi' ? 1 : 0;
  return {
    xs: -0.5, xe: 0.42,
    top: [[0, 0.004], [0.04, 0.03], [0.1, 0.064], [0.2, 0.086], [0.35, 0.098], [0.5, 0.098], [0.65, 0.085], [0.8, 0.064], [0.9, 0.047], [1, 0.037]],
    bot: [[0, 0.0], [0.04, -0.03], [0.1, -0.064], [0.2, -0.09 - 0.008 * f], [0.35, -0.104 - 0.02 * f], [0.5, -0.106 - 0.026 * f], [0.65, -0.09 - 0.016 * f], [0.8, -0.064 - 0.004 * f], [0.9, -0.046], [1, -0.037]],
    width: [[0, 0], [0.08, 0.034], [0.25, 0.05], [0.45, 0.056 + 0.008 * f], [0.7, 0.045], [0.9, 0.026], [1, 0.018]],
    snoutY: 0.006, cap: 0.06, n: 2.3,
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
    const y = -0.02 - 0.05 * u;
    base.push([-0.245, y]);
    edge.push([-0.245 + 0.07 * k * Math.sin(a) * (1 - 0.2 * u), y - 0.025 * k * u + 0.006 * Math.sin(a)]);
  }
  edge[0] = [-0.235, -0.018]; edge[n] = [-0.225 + 0.02 * k, -0.08 - 0.03 * k];
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
    // Sırt yüzgeci: küçük, gövdenin arka yarısında (anal yüzgecin biraz önünde başlar), yamuk/yuvarlak
    const dorsal = fin(body, 'top', 0.5, 0.67,
      (u) => (0.03 + 0.05 * Math.sin(Math.PI * Math.pow(u, 0.7))) * P.dorsalH,
      (u) => 0.03 * (1 - u) * P.dorsalBack + 0.012 * u);
    // Anal yüzgeç: uzun tabanlı; ön ışınlar daha uzun
    const anal = fin(body, 'bot', 0.52, 0.8,
      (u) => (0.022 + 0.04 * Math.pow(1 - u, 0.9)) * (0.5 + 0.5 * sm(0, 0.12, u)) * P.anal,
      (u) => 0.035 * (1 - u) * P.anal + 0.012 * u);
    // Kuyruk: orta derinlikte çatallı, sivrice loblar
    const x0 = 0.42, c = P.caudal, N = 40;
    const up: Pt[] = [[x0, 0.037], [x0 + 0.07, 0.06 + 0.01 * c], [x0 + 0.13 * c, 0.082 * (0.6 + 0.4 * c)], [x0 + 0.2 * c, 0.09 * (0.55 + 0.45 * c)], [x0 + 0.165 * c, 0.04], [x0 + 0.1 * Math.min(c, 1.3), 0.0]];
    const lo: Pt[] = up.slice(0, -1).map((p) => [p[0], -p[1]] as Pt).reverse();
    const caudalEdge = resample(smoothPath([...up, ...lo], 10), N);
    const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, 0.037 - 0.074 * (i / N)] as Pt);
    const fins: FinSpec[] = [
      { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
      { id: 'anal', ...anal, ripple: 0.006, flutter: 0.55 },
      { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
    ];
    // Karın yüzgeci: küçük; kısa bir uç olarak gösterilir (şematik yaklaşım)
    const y0 = f.bot(0.36) + 0.012, xp = -0.16;
    const mc = snoutFace(body, 0.017, 0.5);
    const filaments: FilamentSpec[] = [
      {
        path: smoothPath([[xp, y0], [xp + 0.03, y0 - 0.02 * P.pelvic], [xp + 0.075 * P.pelvic, y0 - 0.04 * P.pelvic], [xp + 0.12 * P.pelvic, y0 - 0.05 * P.pelvic]], 8),
        radii: [0.012, 0.009, 0.005, 0.002], z: 0.026,
      },
      // iki çift bıyık (barbel): rostral (burun üstü) ve maksiller (ağız köşesi); çok küçük, ince
      { path: smoothPath([[mc[0] + 0.004, mc[1] + 0.01], [mc[0] - 0.008, mc[1] + 0.008], [mc[0] - 0.021, mc[1] - 0.004]], 6), radii: [0.0028, 0.002, 0.0009], z: 0.011 },
      { path: smoothPath([[mc[0] + 0.012, mc[1] - 0.012], [mc[0] + 0.0, mc[1] - 0.019], [mc[0] - 0.014, mc[1] - 0.026]], 6), radii: [0.0026, 0.0018, 0.0009], z: 0.02 },
    ];
    const pectoral = pectoralFor(P.pect);
    const d = Math.hypot(0.8, 0.6);
    s = {
      body,
      atlas: atlasFor(body, fins, filaments, pectoral),
      swim: { x0: -0.05, x1: 0.56, amp: 0.045, k: 7, speed: 7 },
      eye: { x: -0.395, y: 0.03, r: 0.03 },
      fins, pectoral, filaments,
      mouth: [[-0.5, 0.0], [-0.478, 0.012], [-0.456, 0.0]],
      // küçük, yukarı bakan (üst konumlu) ağız, dudaklı
      mouthGeom: { c: [mc[0] + 0.002, mc[1], 0], dir: [-0.8 / d, 0.6 / d, 0], hw: 0.0125, gap: 0.0045, lip: 0.004, upper: 0.002, lower: 0.0026, drop: 1.4 },
      gill: smoothPath([[-0.3, 0.085], [-0.268, 0.045], [-0.258, 0.0], [-0.265, -0.05], [-0.288, -0.095]], 8),
      nostril: [-0.45, 0.032],
      lateral: [],
      skipFinBars: true,
      decorate: (tex, v) => decorateZebra(s!, tex, v, sx),
    };
    specCache.set(key, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM, 'erkek');
export const FINS: FinSpec[] = SPEC.fins;
export { cornerPath };
