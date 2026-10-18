// Ram çiklit (Mikrogeophagus ramirezi; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Standart gövde ~0,92 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type PairedFinSpec, type FilamentSpec, type Pt,
} from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';
import { decorateRam } from './paint';

export * from '../akvaryum/yanal-model';

/** Tanınan şekil (form): standart, uzun yüzgeçli ve balon (kısa, yuvarlak gövde) */
export type FormId = 'standart' | 'uzun-yuzgec' | 'balon';
export const DEFAULT_FORM: FormId = 'standart';

/** Form parametreleri: gövde derinlik katsayısı ve kuyruk sapı x'i, yüzgeç ölçekleri */
export interface FormParams { bodyK: number; xe: number; dorsalH: number; dorsalBack: number; anal: number; caudal: number; caudalPoint: number; pelvic: number; pect: number }
export const FORM_PARAMS: Record<FormId, FormParams> = {
  standart: { bodyK: 1, xe: 0.37, dorsalH: 1, dorsalBack: 1, anal: 1, caudal: 1, caudalPoint: 0, pelvic: 1, pect: 1 },
  'uzun-yuzgec': { bodyK: 1, xe: 0.37, dorsalH: 1.9, dorsalBack: 3.6, anal: 2.1, caudal: 1.75, caudalPoint: 1, pelvic: 1.7, pect: 1.2 },
  balon: { bodyK: 1.45, xe: 0.25, dorsalH: 0.95, dorsalBack: 0.9, anal: 0.9, caudal: 0.8, caudalPoint: 0, pelvic: 0.9, pect: 0.95 },
};
export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];
export const SEXES: SexId[] = ['erkek', 'disi'];
const fid = (form: string): FormId => (form in FORM_PARAMS ? (form as FormId) : DEFAULT_FORM);

/** Gövde: derin, yanlardan basık çiklit gövdesi; dik alın, küçük ağız; dişide karın daha dolgun, balon formda kısa ve yuvarlak */
export function bodyFor(sex: SexId, form: string = DEFAULT_FORM): BodySpec {
  const P = FORM_PARAMS[fid(form)];
  const f = sex === 'disi' ? 1 : 0, k = P.bodyK;
  const sc = (v: number, t: number) => (t > 0.04 && t < 0.97 ? v * (1 + (k - 1) * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.04) / 0.93))) ** 0.6) : v);
  const top: Pt[] = [[0, 0.01], [0.04, 0.095], [0.1, 0.165], [0.2, 0.2], [0.35, 0.215], [0.5, 0.205], [0.65, 0.185], [0.8, 0.145], [0.9, 0.108], [1, 0.08]].map(([t, y]) => [t, sc(y, t)] as Pt);
  const bot: Pt[] = [[0, 0.0], [0.04, -0.045], [0.1, -0.105], [0.2, -0.165 - 0.006 * f], [0.35, -0.205 - 0.018 * f], [0.5, -0.2 - 0.024 * f], [0.65, -0.172 - 0.012 * f], [0.8, -0.13], [0.9, -0.098], [1, -0.075]].map(([t, y]) => [t, sc(y, t)] as Pt);
  return {
    xs: -0.5, xe: P.xe,
    top, bot,
    width: [[0, 0], [0.08, 0.04], [0.25, 0.062], [0.45, 0.07 + 0.008 * f], [0.7, 0.056], [0.9, 0.03], [1, 0.02]],
    snoutY: 0.008, cap: 0.07, n: 2.3,
  };
}

const bodies = new Map<string, BodySpec>();
const bodyOf = (sex: SexId, form: FormId): BodySpec => {
  const key = `${form}|${sex}`;
  let b = bodies.get(key);
  if (!b) { b = bodyFor(sex, form); bodies.set(key, b); }
  return b;
};
export const BODY: BodySpec = bodyOf('erkek', DEFAULT_FORM);

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

function ridgeFor(b: BodySpec, id: 'top' | 'bot', t0: number, t1: number, n: number): Pt[] {
  const f = bodyFns(b);
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(b, t), f[id](t)] as Pt; });
}

function fin(b: BodySpec, id: 'top' | 'bot', t0: number, t1: number, h: (s: number) => number, back: (s: number) => number, n: number): { base: Pt[]; edge: Pt[] } {
  const base = ridgeFor(b, id, t0, t1, n);
  const sign = id === 'top' ? 1 : -1;
  return { base, edge: base.map((p, i) => { const s = i / n; return [p[0] + back(s), p[1] + sign * h(s)] as Pt; }) };
}

/** Yuvarlak yelpaze göğüs yüzgeci (saydam); gövdeye göre ölçeklenir */
function pectoralFor(k: number, bk: number): PairedFinSpec {
  const n = 8, base: Pt[] = [], edge: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = Math.PI * u;
    const y = (-0.01 - 0.09 * u) * bk;
    base.push([-0.27, y]);
    edge.push([-0.27 + 0.1 * k * Math.sin(a) * (1 - 0.2 * u), y - 0.03 * k * u + 0.008 * Math.sin(a)]);
  }
  edge[0] = [-0.255, -0.008 * bk]; edge[n] = [-0.245 + 0.02 * k, (-0.1 - 0.04 * k) * bk];
  return { base, edge };
}

const specCache = new Map<string, FishSpec>();
/** Forma ve cinsiyete göre tam geometri. Yüzgeç sırası: sırt (dikenli + yumuşak, tek yüzgeç), anal, kuyruk */
export function specFor(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): FishSpec {
  const fm = fid(form);
  const sx: SexId = sex === 'disi' ? 'disi' : 'erkek';
  const key = `${fm}|${sx}`;
  let s = specCache.get(key);
  if (!s) {
    const P = FORM_PARAMS[fm];
    const body = bodyOf(sx, fm);
    const f = bodyFns(body);
    const male = sx === 'erkek';
    const N = 40;
    // Sırt yüzgeci: ön yarı dikenli (2. diken erkekte belirgin uzar), arka yarı yumuşak ışınlı ve yuvarlak
    const spikeC = 0.1;
    const dorsal = fin(body, 'top', 0.2, 0.8,
      (u) => {
        const prof = (0.062 + 0.01 * sm(0, 0.12, u) - 0.012 * sm(0.12, 0.5, u)) * (1 - 0.5 * sm(0.5, 1, u)) * (0.4 + 0.6 * sm(0, 0.05, u));
        const spike = (male ? 0.085 : 0.004) * gauss(u, spikeC, 0.032) * (male ? 1 : 1);
        const round = Math.sqrt(Math.max(0, 1 - sm(0.9, 1, u) ** 2) * 0.85 + 0.15);
        return (prof * P.dorsalH + spike * P.dorsalH) * round;
      },
      (u) => (male ? 0.1 * gauss(u, spikeC, 0.03) * P.dorsalBack : 0.003) + 0.03 * sm(0.4, 1, u) * P.dorsalBack + 0.01 * u,
      N);
    // Anal yüzgeç: üç dikenli kısa ön, arkada yumuşak yuvarlak; erkekte sivri
    const anal = fin(body, 'bot', 0.5, 0.82,
      (u) => ((0.03 + 0.05 * (1 - sm(0, 1, u) ** 1.2) * (0.55 + 0.45 * sm(0, 0.15, u))) + (male ? 0.014 * gauss(u, 0.5, 0.3) : 0)) * P.anal,
      (u) => (0.03 * (1 - u) + (male ? 0.02 * sm(0.4, 1, u) : 0)) * P.anal + 0.01 * u,
      28);
    // Kuyruk: yuvarlak yelpaze (spatül); uzun yüzgeçli formda uçlar sivri uzar
    const x0 = body.xe, c = P.caudal, cp = P.caudalPoint;
    const y0 = f.top(1);
    const up: Pt[] = [[x0, y0], [x0 + 0.06, y0 + 0.03 + 0.012 * c], [x0 + 0.12 * c, 0.095 * (0.7 + 0.3 * c) + 0.03 * cp], [x0 + 0.17 * c + 0.05 * cp, 0.07 * c + 0.03 * cp], [x0 + 0.19 * c, 0.03], [x0 + 0.195 * c, 0]];
    const lo: Pt[] = up.slice(0, -1).map((p) => [p[0], -p[1]] as Pt).reverse();
    const caudalEdge = resample(smoothPath([...up, ...lo], 10), N);
    const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, y0 - 2 * y0 * sm(0.1, 0.9, i / N)] as Pt);
    const fins: FinSpec[] = [
      { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
      { id: 'anal', ...anal, ripple: 0.006, flutter: 0.55 },
      { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
    ];
    // Karın yüzgeci: ilk ışını uzun, öne-aşağı-geriye uzanan kalın "iplik"; erkekte biraz daha uzun
    const bk = P.bodyK;
    const px0 = -0.19, py0 = f.bot(0.3) + 0.012;
    const L = (male ? 1.1 : 0.92) * P.pelvic;
    const filaments: FilamentSpec[] = [{
      path: smoothPath([[px0, py0], [px0 + 0.02, py0 - 0.05 * L * bk ** 0.5], [px0 + 0.06 * L, py0 - 0.1 * L * bk ** 0.5], [px0 + 0.12 * L, py0 - 0.14 * L * bk ** 0.5]], 8),
      radii: [0.02, 0.015, 0.009, 0.003], z: 0.03,
    }];
    const pectoral = pectoralFor(P.pect, bk);
    const mc = snoutFace(body, 0.019, 0.5);
    const d = Math.hypot(0.9, 0.4);
    const eyeY = 0.045 * (bk > 1 ? 1.15 : 1);
    s = {
      body,
      atlas: atlasFor(body, fins, filaments, pectoral),
      swim: { x0: -0.05, x1: 0.56, amp: 0.04, k: 7, speed: 6 },
      eye: { x: -0.385, y: eyeY, r: 0.049 },
      fins, pectoral, filaments,
      mouth: [[-0.5, 0.004], [-0.475, 0.008], [-0.452, 0.0]],
      // küçük, uçta, hafif yukarı eğimli ağız; dudaklı
      mouthGeom: { c: [mc[0] + 0.002, mc[1], 0], dir: [-0.9 / d, 0.4 / d, 0], hw: 0.0145, gap: 0.005, lip: 0.0046, upper: 0.002, lower: 0.0028, drop: 1.4 },
      gill: smoothPath([[-0.31, 0.14 * bk], [-0.275, 0.07 * bk], [-0.262, 0.0], [-0.268, -0.07 * bk], [-0.29, -0.13 * bk]], 8),
      nostril: [-0.455, 0.045 * bk],
      lateral: [],
      skipFinBars: true,
      decorate: (tex, v) => decorateRam(s!, tex, v, sx),
    };
    specCache.set(key, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM, 'erkek');
export const FINS: FinSpec[] = SPEC.fins;
export { cornerPath };
