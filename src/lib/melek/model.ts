// Melek balığı (Pterophyllum scalare; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~1,14 birim uzunluktadır.
import {
  atlasFor, cornerPath, resample, smoothPath, snoutFace, triFin, xOfT, bodyFns,
  type BodySpec, type FinSpec, type FishSpec, type Pt,
} from '../akvaryum/yanal-model';

import { decorateMelek } from './paint';

export * from '../akvaryum/yanal-model';

export const BODY: BodySpec = {
  xs: -0.62, xe: 0.52,
  // Yüksek, yuvarlak hatlı disk: alın hafif çukur, en yüksek nokta ortada, kuyruk sapına doğru yumuşak daralır
  top: [[0, 0.02], [0.04, 0.07], [0.1, 0.14], [0.18, 0.24], [0.28, 0.35], [0.4, 0.43], [0.5, 0.46], [0.6, 0.44], [0.7, 0.36], [0.8, 0.24], [0.9, 0.13], [0.95, 0.092], [1, 0.075]],
  bot: [[0, 0.02], [0.04, -0.04], [0.1, -0.12], [0.18, -0.24], [0.28, -0.35], [0.4, -0.435], [0.5, -0.465], [0.6, -0.445], [0.7, -0.36], [0.8, -0.24], [0.9, -0.13], [0.95, -0.092], [1, -0.075]],
  width: [[0, 0], [0.08, 0.05], [0.25, 0.09], [0.5, 0.1], [0.7, 0.085], [0.9, 0.045], [1, 0.03]],
  snoutY: 0.02, cap: 0.1, n: 2.4,
};

// ------------------------------------------------------------------ formlar (şekil varyeteleri)
// Form yalnızca yüzgeç/iplik geometrisini değiştirir; gövde aynıdır. Her form her renkle birleşir.

export type FormId = 'standart' | 'veil' | 'halfmoon' | 'super-veil';
export const DEFAULT_FORM: FormId = 'standart';

/** Üçgen yüzgeç (sırt ya da anal; sırt koordinatlarıyla, anal için y aynalanır) */
interface TriParams {
  /** Taban (gövde sırt çizgisi üzerinde) t aralığı */
  t0: number; t1: number;
  /** Uç noktası (x, yükseklik) */
  tip: Pt;
  /** Ön kenar dışbükeyliği (+ dışa) ve arka kenar bükeyi (− içbükey) */
  bowL: number; bowT: number;
  /** Arka kenar bitişi: tabanın sonundan x kadar geride */
  trailX: number;
}

interface FormParams {
  dorsal: TriParams; anal: TriParams;
  /** Kuyruk: üst köşe, alt köşe, çentik derinliği (x), dış kenarın yuvarlaklığı */
  cx: number; cy: number; notch: number; round: number;
  /** Karın ipliğinin ucu (x, y) */
  filEnd: Pt;
  ripple: number;
}

const FORM_PARAMS: Record<FormId, FormParams> = {
  // Doğal biçim: yüksek gövde, ona yakın boyda sivri üçgen yüzgeçler, hafif çatallı yelpaze kuyruk
  standart: {
    dorsal: { t0: 0.34, t1: 0.94, tip: [0.2, 0.93], bowL: 0.02, bowT: -0.05, trailX: 0 },
    anal: { t0: 0.42, t1: 0.94, tip: [0.14, -0.93], bowL: 0.02, bowT: -0.05, trailX: 0 },
    cx: 0.99, cy: 0.33, notch: 0.915, round: 0, filEnd: [-0.17, -0.88], ripple: 0.006,
  },
  // Veil: tabanı geniş, uzun akan yüzgeçler; arka kenar gövdenin üzerinden kuyruk köküne dek sarkar
  veil: {
    dorsal: { t0: 0.27, t1: 0.96, tip: [0.3, 1.18], bowL: 0.05, bowT: 0.0, trailX: 0.05 },
    anal: { t0: 0.33, t1: 0.96, tip: [0.26, -1.2], bowL: 0.05, bowT: 0.0, trailX: 0.05 },
    cx: 1.34, cy: 0.42, notch: 1.1, round: 0, filEnd: [-0.13, -1.08], ripple: 0.012,
  },
  // Halfmoon: yüzgeçler açıldığında yarım daireye yakın, geniş ve yuvarlak hatlı; veil kadar uzun değil
  halfmoon: {
    dorsal: { t0: 0.27, t1: 0.96, tip: [0.28, 1.04], bowL: 0.1, bowT: 0.1, trailX: 0.1 },
    anal: { t0: 0.33, t1: 0.96, tip: [0.26, -1.05], bowL: 0.1, bowT: 0.1, trailX: 0.1 },
    cx: 1.2, cy: 0.6, notch: 1.2, round: 1, filEnd: [-0.14, -0.98], ripple: 0.009,
  },
  // Süper veil: veil geninin çift dozu; daha uzun ve yumuşak
  'super-veil': {
    dorsal: { t0: 0.25, t1: 0.97, tip: [0.36, 1.38], bowL: 0.06, bowT: 0.02, trailX: 0.08 },
    anal: { t0: 0.31, t1: 0.97, tip: [0.32, -1.4], bowL: 0.06, bowT: 0.02, trailX: 0.08 },
    cx: 1.56, cy: 0.48, notch: 1.24, round: 0, filEnd: [-0.1, -1.3], ripple: 0.014,
  },
};

export const FORM_IDS = Object.keys(FORM_PARAMS) as FormId[];

const f = bodyFns(BODY);
const ridge = (id: 'top' | 'bot', t0: number, t1: number, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(BODY, t), f[id](t)] as Pt; });
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Ön kenar ve arka kenar: ridge uçlarından uca; arka kenar kuyruk köküne dönük içbükey/dışbükey eğri */
function triOutline(ridgePts: Pt[], p: TriParams, sign: 1 | -1): Pt[] {
  const S = ridgePts[0], E = ridgePts[ridgePts.length - 1];
  const T: Pt = [p.tip[0], p.tip[1]];
  const E2: Pt = [E[0] + p.trailX, E[1]];
  const curve = (A: Pt, B: Pt, bow: number): Pt[] => {
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
    // sırt için normal (-dy, dx)/l; anal için y aynalı olduğundan işaret çevrilir
    const nx = (-dy / l) * sign, ny = (dx / l) * sign;
    return [0, 0.25, 0.5, 0.75, 1].map((u) => {
      const k = Math.sin(Math.PI * u) * bow;
      return [A[0] + dx * u + nx * k, A[1] + dy * u + ny * k] as Pt;
    });
  };
  return cornerPath([curve(S, T, p.bowL), curve(T, E2, p.bowT)]);
}

function finsFor(p: FormParams): FinSpec[] {
  const rd = ridge('top', p.dorsal.t0, p.dorsal.t1), ra = ridge('bot', p.anal.t0, p.anal.t1);
  const dorsal = triFin(rd, triOutline(rd, p.dorsal, 1));
  const anal = triFin(ra, triOutline(ra, p.anal, -1));
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
  edge: [[-0.09, 0.06], [-0.02, -0.01], [-0.03, -0.11], [-0.12, -0.19]] as Pt[],
};

const MOUTH = (() => {
  const c = snoutFace(BODY, 0.022, 0.5);
  const d = Math.hypot(0.93, 0.37);
  return { c: [c[0] + 0.003, c[1], 0] as [number, number, number], dir: [-0.93 / d, 0.37 / d, 0] as [number, number, number], hw: 0.0165, gap: 0.006, lip: 0.0046, upper: 0.002, lower: 0.0026, drop: 1.6 };
})();

const specCache = new Map<string, FishSpec>();
/** Forma göre tam geometri (gövde aynı; yüzgeçler, iplik ve atlas değişir) */
export function specFor(form: string = DEFAULT_FORM): FishSpec {
  const id = (form in FORM_PARAMS ? form : DEFAULT_FORM) as FormId;
  let s = specCache.get(id);
  if (!s) {
    const p = FORM_PARAMS[id];
    const fins = finsFor(p);
    // Karın ipliği: boğaz altından başlayan, düz ve uca doğru incelen tek iplik (kanca yok); hafifçe geriye eğik
    const f0: Pt = [-0.265, f.bot(0.31) + 0.03], f1 = p.filEnd;
    const filaments = [{
      path: smoothPath([0, 0.3, 0.62, 1].map((u) => [f0[0] + (f1[0] - f0[0]) * u + 0.012 * Math.sin(Math.PI * u), f0[1] + (f1[1] - f0[1]) * u] as Pt), 8),
      radii: [0.016, 0.0105, 0.0062, 0.002], z: 0.03,
    }];
    s = {
      body: BODY,
      atlas: atlasFor(BODY, fins, filaments, PECTORAL),
      swim: { x0: -0.1, x1: 1.0, amp: 0.055, k: 5.2, speed: 6 },
      eye: { x: -0.43, y: 0.075, r: 0.048 },
      fins,
      pectoral: PECTORAL,
      filaments,
      mouth: [[-0.617, 0.03], [-0.58, 0.005], [-0.55, -0.02]],
      // küçük, eğik (hafif yukarı bakan) uç ağız; burun düz kesilip ağız bu yüze oturur
      mouthGeom: MOUTH,
      gill: smoothPath([[-0.34, 0.3], [-0.285, 0.15], [-0.265, 0.0], [-0.28, -0.15], [-0.325, -0.29]], 8),
      nostril: [-0.54, 0.1],
      lateral: smoothPath([[-0.25, 0.22], [0.0, 0.2], [0.25, 0.14], [0.42, 0.06]], 8),
      skipFinBars: true,
      decorate: (tex, v) => decorateMelek(s!, tex, v),
    };
    specCache.set(id, s);
  }
  return s;
}

export const SPEC: FishSpec = specFor(DEFAULT_FORM);
export const FINS: FinSpec[] = SPEC.fins;
