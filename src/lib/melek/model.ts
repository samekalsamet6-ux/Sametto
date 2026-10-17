// Melek balığı (Pterophyllum scalare; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~1,14 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, triFin, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type Pt,
} from '../akvaryum/yanal-model';

export * from '../akvaryum/yanal-model';

export const BODY: BodySpec = {
  xs: -0.62, xe: 0.52,
  top: [[0, 0.02], [0.05, 0.07], [0.12, 0.13], [0.2, 0.22], [0.3, 0.32], [0.42, 0.39], [0.55, 0.4], [0.7, 0.31], [0.85, 0.17], [0.94, 0.095], [1, 0.075]],
  bot: [[0, 0.02], [0.05, -0.04], [0.12, -0.11], [0.2, -0.2], [0.3, -0.3], [0.42, -0.39], [0.55, -0.4], [0.7, -0.3], [0.85, -0.17], [0.94, -0.095], [1, -0.075]],
  width: [[0, 0], [0.1, 0.05], [0.3, 0.085], [0.5, 0.09], [0.7, 0.075], [0.9, 0.04], [1, 0.03]],
  snoutY: 0.02, cap: 0.1, n: 2.4,
};

// ------------------------------------------------------------------ formlar (şekil varyeteleri)
// Form yalnızca yüzgeç/iplik geometrisini değiştirir; gövde aynıdır. Her form her renkle birleşir.

export type FormId = 'standart' | 'veil' | 'halfmoon' | 'super-veil';
export const DEFAULT_FORM: FormId = 'standart';

interface FormParams {
  /** Sırt yüzgeci: ön kenar ve arka kenar kontrol noktaları (uçta birleşir) */
  dLead: Pt[]; dTrail: Pt[];
  aLead: Pt[]; aTrail: Pt[];
  /** Kuyruk: üst köşe, alt köşe, çentik derinliği (x), dış kenarın yuvarlaklığı */
  cx: number; cy: number; notch: number; round: number;
  /** Karın ipliğinin ucu */
  filEnd: Pt;
  ripple: number;
}

const FORM_PARAMS: Record<FormId, FormParams> = {
  standart: {
    dLead: [[-0.232, 0.355], [-0.2, 0.55], [-0.1, 0.8], [0.05, 0.97], [0.18, 1.05]],
    dTrail: [[0.18, 1.05], [0.22, 0.78], [0.27, 0.5], [0.34, 0.28], [0.44, 0.1]],
    aLead: [[-0.118, -0.4], [-0.1, -0.62], [-0.04, -0.82], [0.04, -0.95], [0.1, -1.0]],
    aTrail: [[0.1, -1.0], [0.16, -0.76], [0.23, -0.5], [0.33, -0.27], [0.44, -0.1]],
    cx: 0.985, cy: 0.31, notch: 0.905, round: 0, filEnd: [-0.15, -1.02], ripple: 0.006,
  },
  // Veil: uzun akan yüzgeçler; sırt/anal yüzgeç gövdenin arkasına sarkar, kuyruk uzun ve çatallı
  veil: {
    dLead: [[-0.232, 0.355], [-0.2, 0.6], [-0.12, 0.95], [0.0, 1.25], [0.18, 1.45]],
    dTrail: [[0.18, 1.45], [0.28, 1.1], [0.4, 0.75], [0.52, 0.45], [0.64, 0.22]],
    aLead: [[-0.118, -0.4], [-0.11, -0.7], [-0.06, -1.0], [0.04, -1.25], [0.12, -1.4]],
    aTrail: [[0.12, -1.4], [0.22, -1.05], [0.34, -0.72], [0.5, -0.42], [0.64, -0.2]],
    cx: 1.4, cy: 0.42, notch: 1.12, round: 0, filEnd: [-0.1, -1.5], ripple: 0.012,
  },
  // Halfmoon: yüzgeçler açıldığında yarım daireye yakın, geniş ve yuvarlak hatlı; veil kadar uzun değil
  halfmoon: {
    dLead: [[-0.232, 0.355], [-0.19, 0.62], [-0.08, 0.92], [0.08, 1.12], [0.3, 1.2]],
    dTrail: [[0.3, 1.2], [0.42, 1.02], [0.54, 0.74], [0.62, 0.44], [0.62, 0.2]],
    aLead: [[-0.118, -0.4], [-0.1, -0.68], [-0.02, -0.96], [0.14, -1.14], [0.34, -1.2]],
    aTrail: [[0.34, -1.2], [0.46, -1.02], [0.57, -0.74], [0.63, -0.44], [0.62, -0.2]],
    cx: 1.2, cy: 0.62, notch: 1.2, round: 1, filEnd: [-0.12, -1.3], ripple: 0.009,
  },
  // Süper veil: veil geninin çift dozu; daha uzun ve yumuşak
  'super-veil': {
    dLead: [[-0.232, 0.355], [-0.2, 0.65], [-0.12, 1.05], [0.0, 1.4], [0.2, 1.68]],
    dTrail: [[0.2, 1.68], [0.32, 1.25], [0.46, 0.85], [0.6, 0.5], [0.76, 0.24]],
    aLead: [[-0.118, -0.4], [-0.11, -0.75], [-0.06, -1.15], [0.05, -1.45], [0.15, -1.65]],
    aTrail: [[0.15, -1.65], [0.27, -1.2], [0.42, -0.8], [0.58, -0.45], [0.76, -0.22]],
    cx: 1.62, cy: 0.5, notch: 1.28, round: 0, filEnd: [-0.08, -1.75], ripple: 0.014,
  },
};

export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];

const f = bodyFns(BODY);
const ridge = (id: 'top' | 'bot', t0: number, t1: number, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(BODY, t), f[id](t)] as Pt; });
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function finsFor(p: FormParams): FinSpec[] {
  const dorsal = triFin(ridge('top', 0.34, 0.93), cornerPath([p.dLead, p.dTrail]));
  const anal = triFin(ridge('bot', 0.44, 0.93), cornerPath([p.aLead, p.aTrail]));
  // Kuyruk: çatallı yelpaze (round=1 ise dış kenar dışbükey, yarım ay)
  const x0 = 0.515, mid = (x0 + p.cx) / 2;
  const rear: Pt[] = p.round
    ? [[p.cx, p.cy], [p.cx + 0.07, p.cy * 0.55], [p.cx + 0.09, 0], [p.cx + 0.07, -p.cy * 0.55], [p.cx, -p.cy]]
    : [[p.cx, p.cy], [p.cx - 0.05, p.cy * 0.52], [p.notch, 0], [p.cx - 0.05, -p.cy * 0.52], [p.cx, -p.cy]];
  const caudalEdge = resample(cornerPath([
    [[x0, 0.075], [mid, 0.075 + (p.cy - 0.075) * 0.45], p.round ? [p.cx - 0.1, p.cy * 0.95] : [p.cx, p.cy]],
    p.round ? [[p.cx - 0.1, p.cy * 0.95], ...rear.slice(0, 4), [p.cx - 0.1, -p.cy * 0.95]] : rear,
    [p.round ? [p.cx - 0.1, -p.cy * 0.95] : [p.cx, -p.cy], [mid, -0.075 - (p.cy - 0.075) * 0.45], [x0, -0.075]],
  ]), 40);
  const caudalBase: Pt[] = caudalEdge.map((_, i) => [x0, 0.075 - 0.15 * sm(0.28, 0.72, i / 40)]);
  return [
    { id: 'sirt', ...dorsal, ripple: p.ripple, flutter: 0.5 },
    { id: 'anal', ...anal, ripple: p.ripple, flutter: 0.5 },
    { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: p.ripple + 0.002, flutter: 1 },
  ];
}

const PECTORAL = {
  base: [[-0.235, 0.04], [-0.235, 0.0], [-0.235, -0.05], [-0.235, -0.1]] as Pt[],
  edge: [[-0.09, 0.05], [-0.03, -0.02], [-0.04, -0.1], [-0.12, -0.17]] as Pt[],
};

const specCache = new Map<string, FishSpec>();
/** Forma göre tam geometri (gövde aynı; yüzgeçler, iplik ve atlas değişir) */
export function specFor(form: string = DEFAULT_FORM): FishSpec {
  const id = (form in FORM_PARAMS ? form : DEFAULT_FORM) as FormId;
  let s = specCache.get(id);
  if (!s) {
    const p = FORM_PARAMS[id];
    const fins = finsFor(p);
    const filaments = [{ path: smoothPath([[-0.27, -0.315], [-0.255, (-0.315 + p.filEnd[1]) * 0.38], [-0.215 + (p.filEnd[0] + 0.15) * 0.3, (-0.315 + p.filEnd[1]) * 0.76], p.filEnd], 8), radii: [0.02, 0.014, 0.008, 0.004], z: 0.03 }];
    s = {
      body: BODY,
      atlas: atlasFor(BODY, fins, filaments, PECTORAL),
      swim: { x0: -0.1, x1: 1.0, amp: 0.055, k: 5.2, speed: 6 },
      eye: { x: -0.43, y: 0.075, r: 0.068 },
      fins,
      pectoral: PECTORAL,
      filaments,
      mouth: [[-0.617, 0.03], [-0.58, 0.005], [-0.55, -0.02]],
      gill: smoothPath([[-0.32, 0.27], [-0.27, 0.14], [-0.255, 0.0], [-0.27, -0.14], [-0.31, -0.26]], 8),
      nostril: [-0.54, 0.1],
      lateral: smoothPath([[-0.25, 0.22], [0.0, 0.2], [0.25, 0.14], [0.42, 0.06]], 8),
    };
    specCache.set(id, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM);
export const FINS: FinSpec[] = SPEC.fins;
