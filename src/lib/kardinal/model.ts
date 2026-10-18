// Kardinal tetra (Paracheirodon axelrodi; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~0,92 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type PairedFinSpec, type FilamentSpec, type Pt,
} from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';
import { decorateKardinal } from './paint';

export * from '../akvaryum/yanal-model';

/** Tanınan şekil (form): standart ve seçmeli uzun yüzgeçli hat */
export type FormId = 'standart' | 'uzun-yuzgec';
export const DEFAULT_FORM: FormId = 'standart';

/** Form parametreleri: yüzgeç ölçekleri (gövde aynıdır) */
export interface FormParams { dorsalH: number; dorsalBack: number; anal: number; caudal: number; pelvic: number; pect: number; adipose: number }
export const FORM_PARAMS: Record<FormId, FormParams> = {
  standart: { dorsalH: 1, dorsalBack: 1, anal: 1, caudal: 1, pelvic: 1, pect: 1, adipose: 1 },
  'uzun-yuzgec': { dorsalH: 1.7, dorsalBack: 2.2, anal: 1.8, caudal: 1.75, pelvic: 1.8, pect: 1.25, adipose: 1.3 },
};
export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];
export const SEXES: SexId[] = ['erkek', 'disi'];

/** Gövde: nispeten derin, yanlardan basık torpido biçimi (neon tetradan biraz daha derin); dişide karın dolgun */
export function bodyFor(sex: SexId): BodySpec {
  const f = sex === 'disi' ? 1 : 0;
  return {
    xs: -0.5, xe: 0.42,
    top: [[0, 0.004], [0.04, 0.034], [0.1, 0.074], [0.2, 0.1], [0.35, 0.114], [0.5, 0.113], [0.65, 0.094], [0.8, 0.068], [0.9, 0.05], [1, 0.04]],
    bot: [[0, 0.0], [0.04, -0.034], [0.1, -0.074], [0.2, -0.103 - 0.008 * f], [0.35, -0.122 - 0.024 * f], [0.5, -0.122 - 0.03 * f], [0.65, -0.098 - 0.018 * f], [0.8, -0.068 - 0.005 * f], [0.9, -0.048], [1, -0.04]],
    width: [[0, 0], [0.08, 0.034], [0.25, 0.052], [0.45, 0.058 + 0.008 * f], [0.7, 0.047], [0.9, 0.027], [1, 0.018]],
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
    const y = -0.03 - 0.05 * u;
    base.push([-0.255, y]);
    edge.push([-0.255 + 0.075 * k * Math.sin(a) * (1 - 0.2 * u), y - 0.025 * k * u + 0.006 * Math.sin(a)]);
  }
  edge[0] = [-0.245, -0.028]; edge[n] = [-0.235 + 0.02 * k, -0.09 - 0.03 * k];
  return { base, edge };
}

const specCache = new Map<string, FishSpec>();
/** Forma ve cinsiyete göre tam geometri. Yüzgeç sırası: sırt, anal, kuyruk, yağ yüzgeci */
export function specFor(form: string = DEFAULT_FORM, sex: SexId = 'erkek'): FishSpec {
  const fid: FormId = form in FORM_PARAMS ? (form as FormId) : DEFAULT_FORM;
  const sx: SexId = sex === 'disi' ? 'disi' : 'erkek';
  const key = `${fid}|${sx}`;
  let s = specCache.get(key);
  if (!s) {
    const P = FORM_PARAMS[fid];
    const body = bodies[sx];
    const f = bodyFns(body);
    // Sırt yüzgeci: gövde ortasında, önü yüksek üçgenimsi
    const dorsal = fin(body, 'top', 0.43, 0.56,
      (u) => (0.02 + 0.062 * Math.pow(1 - u, 1.2) * (0.35 + 0.65 * sm(0, 0.18, u))) * P.dorsalH,
      (u) => 0.03 * (1 - u) * P.dorsalBack + 0.014 * u);
    // Anal yüzgeç: orta tabanlı, ön ışınlar daha uzun
    const anal = fin(body, 'bot', 0.5, 0.77,
      (u) => (0.02 + 0.04 * Math.pow(1 - u, 0.9)) * (0.5 + 0.5 * sm(0, 0.12, u)) * P.anal,
      (u) => 0.034 * (1 - u) * P.anal + 0.012 * u);
    // Kuyruk: orta derinlikte çatallı
    const x0 = 0.42, c = P.caudal, N = 40;
    const up: Pt[] = [[x0, 0.04], [x0 + 0.07, 0.062 + 0.01 * c], [x0 + 0.13 * c, 0.084 * (0.6 + 0.4 * c)], [x0 + 0.2 * c, 0.09 * (0.55 + 0.45 * c)], [x0 + 0.165 * c, 0.04], [x0 + 0.1 * Math.min(c, 1.3), 0.0]];
    const lo: Pt[] = up.slice(0, -1).map((p) => [p[0], -p[1]] as Pt).reverse();
    const caudalEdge = resample(smoothPath([...up, ...lo], 10), N);
    const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, 0.04 - 0.08 * (i / N)] as Pt);
    // Yağ yüzgeci: kuyruk köküne yakın, sırtta küçük, ışınsız yaprak
    const adip = fin(body, 'top', 0.83, 0.91,
      (u) => 0.036 * P.adipose * Math.sin(Math.PI * Math.pow(u, 0.8)) + 0.002,
      (u) => 0.016 * P.adipose * (1 - u), 12);
    const fins: FinSpec[] = [
      { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
      { id: 'anal', ...anal, ripple: 0.006, flutter: 0.55 },
      { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
      { id: 'yag', ...adip, ripple: 0.002, flutter: 0.2 },
    ];
    // Karın yüzgeci: küçük, kısa uç
    const y0 = f.bot(0.36) + 0.012, xp = -0.15;
    const mc = snoutFace(body, 0.017, 0.5);
    const filaments: FilamentSpec[] = [
      {
        path: smoothPath([[xp, y0], [xp + 0.03, y0 - 0.02 * P.pelvic], [xp + 0.075 * P.pelvic, y0 - 0.04 * P.pelvic], [xp + 0.12 * P.pelvic, y0 - 0.05 * P.pelvic]], 8),
        radii: [0.012, 0.009, 0.005, 0.002], z: 0.028,
      },
    ];
    const pectoral = pectoralFor(P.pect);
    const d = Math.hypot(0.95, 0.3);
    s = {
      body,
      atlas: atlasFor(body, fins, filaments, pectoral),
      swim: { x0: -0.05, x1: 0.56, amp: 0.045, k: 7, speed: 7 },
      eye: { x: -0.395, y: 0.016, r: 0.04 },
      fins, pectoral, filaments,
      mouth: [[-0.5, 0.0], [-0.478, 0.008], [-0.456, 0.0]],
      // küçük, uçta, hafif yukarı eğimli ağız; dudaklı
      mouthGeom: { c: [mc[0] + 0.002, mc[1], 0], dir: [-0.95 / d, 0.3 / d, 0], hw: 0.0125, gap: 0.0042, lip: 0.0042, upper: 0.002, lower: 0.0026, drop: 1.4 },
      gill: smoothPath([[-0.3, 0.09], [-0.268, 0.05], [-0.256, 0.0], [-0.262, -0.055], [-0.285, -0.105]], 8),
      nostril: [-0.45, 0.026],
      lateral: [],
      skipFinBars: true,
      decorate: (tex, v) => decorateKardinal(s!, tex, v, sx),
    };
    specCache.set(key, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM, 'erkek');
export const FINS: FinSpec[] = SPEC.fins;
export { cornerPath };
