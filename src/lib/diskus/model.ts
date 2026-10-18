// Diskus (Symphysodon cinsi; şematik) için SAF geometri parametreleri.
// Ortak mantık src/lib/akvaryum/yanal-model.ts içindedir. Birim keyfidir; gerçek ölçüm değildir.
// Koordinatlar: x gövde ekseni (burun -x), y yukarı, z yanal. Gövde ~1,0 birim uzunlukta, yaklaşık daire biçimlidir.
import { cornerPath, resample, ridgeFin, smoothPath, snoutFace, type BodySpec, type FinSpec, type FishSpec, type Pt } from '../akvaryum/yanal-model';

export * from '../akvaryum/yanal-model';

const XC = -0.02, R = 0.5, HS = 0.97;
const TS = [0, 0.02, 0.05, 0.1, 0.18, 0.28, 0.4, 0.5, 0.6, 0.72, 0.82, 0.9, 0.95, 0.98, 1];
const circ = (t: number): number => { const x = -0.52 + t; const u = Math.min(1, Math.abs((x - XC) / R)); return R * HS * Math.sqrt(Math.max(0, 1 - u * u)); };

export const BODY: BodySpec = {
  xs: -0.52, xe: 0.48,
  top: TS.map((t) => [t, circ(t)] as Pt),
  bot: TS.map((t) => [t, -circ(t) * 0.99] as Pt),
  width: [[0, 0], [0.06, 0.06], [0.2, 0.11], [0.4, 0.125], [0.6, 0.12], [0.8, 0.09], [0.93, 0.05], [1, 0]],
  snoutY: 0, cap: 0, n: 2.3,
};

// Sırt ve anal yüzgeç: gövde kenarı boyunca uzanan, yuvarlak hatlı uzun tabanlı yüzgeçler
const hDorsal = (s: number) => 0.05 + 0.14 * Math.pow(Math.sin(Math.PI * s), 0.8);
const hAnal = (s: number) => 0.045 + 0.12 * Math.pow(Math.sin(Math.PI * s), 0.8);
const dorsal = ridgeFin(BODY, 'sirt', 0.2, 0.93, XC, hDorsal, 0.35);
const anal = ridgeFin(BODY, 'anal', 0.24, 0.93, XC, hAnal, 0.35);

const caudalEdge = resample(cornerPath([[[0.47, 0.085], [0.55, 0.16], [0.63, 0.13], [0.655, 0.05], [0.655, -0.05], [0.63, -0.13], [0.55, -0.16], [0.47, -0.085]]]), 36);
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const caudalBase: Pt[] = caudalEdge.map((_, i) => [0.47, 0.085 - 0.17 * sm(0.2, 0.8, i / 36)]);

export const FINS: FinSpec[] = [
  { id: 'sirt', ...dorsal, ripple: 0.005, flutter: 0.6 },
  { id: 'anal', ...anal, ripple: 0.005, flutter: 0.6 },
  { id: 'kuyruk', base: caudalBase, edge: caudalEdge, ripple: 0.006, flutter: 1 },
];

export const SPEC: FishSpec = {
  body: BODY,
  atlas: { x0: -0.58, x1: 0.72, y0: -0.72, y1: 0.72 },
  swim: { x0: -0.05, x1: 0.7, amp: 0.045, k: 6, speed: 5.5 },
  eye: { x: -0.3, y: 0.07, r: 0.046 },
  fins: FINS,
  pectoral: {
    base: [[-0.17, 0.0], [-0.17, -0.04], [-0.17, -0.09], [-0.17, -0.14]],
    edge: [[-0.04, 0.0], [0.0, -0.06], [-0.02, -0.15], [-0.09, -0.22]],
  },
  filaments: [{ path: smoothPath([[-0.22, -0.455], [-0.205, -0.52], [-0.18, -0.6]], 8), radii: [0.024, 0.015, 0.006], z: 0.03 }],
  mouth: [[-0.517, 0.0], [-0.49, -0.015], [-0.465, -0.03]],
  // küçük uç ağız; burun düz kesilip ağız bu yüze oturur
  mouthGeom: (() => { const c = snoutFace(BODY, 0.03, 0.5); return { c: [c[0] + 0.003, c[1], 0] as [number, number, number], dir: [-1, 0.08, 0] as [number, number, number], hw: 0.0145, gap: 0.0056, lip: 0.0042, upper: 0.0016, lower: 0.0022, drop: 1.6 }; })(),
  gill: smoothPath([[-0.12, 0.33], [-0.08, 0.16], [-0.075, 0.0], [-0.09, -0.16], [-0.14, -0.3]], 8),
  nostril: [-0.44, 0.08],
  lateral: smoothPath([[-0.07, 0.2], [0.12, 0.2], [0.28, 0.12]], 8),
};
