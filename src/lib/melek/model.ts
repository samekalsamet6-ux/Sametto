// Melek balığı (Pterophyllum scalare; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~1,14 birim uzunluktadır.
import {
  cornerPath, resample, smoothPath, triFin, xOfT, bodyFns,
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

const f = bodyFns(BODY);
const ridge = (id: 'top' | 'bot', t0: number, t1: number, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [xOfT(BODY, t), f[id](t)] as Pt; });

// Sırt yüzgeci: sivri uçlu uzun üçgen (ön kenar düze yakın, arka kenar içbükey)
const dorsal = triFin(
  ridge('top', 0.34, 0.93),
  cornerPath([
    [[-0.232, 0.355], [-0.2, 0.55], [-0.1, 0.8], [0.05, 0.97], [0.18, 1.05]],
    [[0.18, 1.05], [0.22, 0.78], [0.27, 0.5], [0.34, 0.28], [0.44, 0.1]],
  ]),
);
// Anal yüzgeç: sırt yüzgecinin aynası gibi, biraz daha geride ve kısa
const anal = triFin(
  ridge('bot', 0.44, 0.93),
  cornerPath([
    [[-0.118, -0.4], [-0.1, -0.62], [-0.04, -0.82], [0.04, -0.95], [0.1, -1.0]],
    [[0.1, -1.0], [0.16, -0.76], [0.23, -0.5], [0.33, -0.27], [0.44, -0.1]],
  ]),
);
// Kuyruk yüzgeci: hafif çatallı yelpaze
const caudalEdge = resample(cornerPath([
  [[0.515, 0.075], [0.75, 0.19], [0.985, 0.31]],
  [[0.985, 0.31], [0.935, 0.16], [0.905, 0], [0.935, -0.16], [0.985, -0.31]],
  [[0.985, -0.31], [0.75, -0.19], [0.515, -0.075]],
]), 40);
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const caudalBase: Pt[] = caudalEdge.map((_, i) => [0.515, 0.075 - 0.15 * sm(0.28, 0.72, i / 40)]);

export const FINS: FinSpec[] = [
  { id: 'sirt', ...dorsal, ripple: 0.006, flutter: 0.5 },
  { id: 'anal', ...anal, ripple: 0.006, flutter: 0.5 },
  { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.008, flutter: 1 },
];

export const SPEC: FishSpec = {
  body: BODY,
  atlas: { x0: -0.7, x1: 1.04, y0: -1.12, y1: 1.12 },
  swim: { x0: -0.1, x1: 1.0, amp: 0.055, k: 5.2, speed: 6 },
  eye: { x: -0.43, y: 0.075, r: 0.068 },
  fins: FINS,
  pectoral: {
    base: [[-0.235, 0.04], [-0.235, 0.0], [-0.235, -0.05], [-0.235, -0.1]],
    edge: [[-0.09, 0.05], [-0.03, -0.02], [-0.04, -0.1], [-0.12, -0.17]],
  },
  filaments: [{ path: smoothPath([[-0.27, -0.315], [-0.255, -0.52], [-0.215, -0.78], [-0.15, -1.02]], 8), radii: [0.02, 0.014, 0.008, 0.004], z: 0.03 }],
  mouth: [[-0.617, 0.03], [-0.58, 0.005], [-0.55, -0.02]],
  gill: smoothPath([[-0.32, 0.27], [-0.27, 0.14], [-0.255, 0.0], [-0.27, -0.14], [-0.31, -0.26]], 8),
  nostril: [-0.54, 0.1],
  lateral: smoothPath([[-0.25, 0.22], [0.0, 0.2], [0.25, 0.14], [0.42, 0.06]], 8),
};
