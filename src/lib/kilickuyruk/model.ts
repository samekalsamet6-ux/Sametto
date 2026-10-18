// Kılıçkuyruk (Xiphophorus hellerii; şematik) 3B modeli için SAF geometri parametreleri.
// Ortak canlı doğuran geometrisi livebearer/model.ts içindedir; burada yalnızca kılıçkuyruğa özgü sayılar bulunur.
// Plati/mollyden uzun, ince ve yanlardan basık gövde; sivri burun; erkekte kuyruk yüzgecinin alt kenarı uzun bir kılıca uzar,
// dişide kılıç yoktur. Erkekte anal yüzgeç gonopodiuma dönüşür.
import { createModel, type LbConfig } from '../livebearer/model';

export * from '../livebearer/model';

const SHAPE = { nape: 0.05, back: 0.04, throat: 0.07, snout: 0.62, gill: 0.045, flank: 0.17, ridge: 0.13 };

export const CONFIG: LbConfig = {
  body: {
    erkek: { length: 3.1, height: 0.9, width: 0.5, peak: 0.43, peduncle: 0.34, belly: 0.03, bellyAt: 0.55, bellySpread: 0.2, eye: 0.1, lift: 0.08, frontPow: 0.78, shape: SHAPE },
    disi: { length: 3.45, height: 1.2, width: 0.74, peak: 0.45, peduncle: 0.32, belly: 0.26, bellyAt: 0.56, bellySpread: 0.2, eye: 0.105, lift: 0.08, frontPow: 0.78, shape: SHAPE },
  },
  tail: {
    erkek: { rays: 22, reach: 0.74, halfAngle: 36, bulge: 0.08, round: 0.5, sword: 1.35, swordN: 3 },
    disi: { rays: 22, reach: 0.7, halfAngle: 36, bulge: 0.08, round: 0.5 },
  },
  dorsal: {
    erkek: { t0: 0.42, t1: 0.59, rays: 9, phiFront: 74, phiRear: 42, lenFront: 0.4, lenRear: 0.56 },
    disi: { t0: 0.43, t1: 0.58, rays: 8, phiFront: 74, phiRear: 46, lenFront: 0.36, lenRear: 0.5 },
  },
  anal: { lenFront: 0.46, lenRear: 0.3 },
  gono: 0.78,
  paired: 0.95,
};

export const M = createModel(CONFIG);
export const { BODY, TAIL, DORSAL, bodyProfile, bodyX, bodySurfacePoint, envelope, tailFin, dorsalFin, analFin, pectoralFin, pelvicFin, gonopodium, eyeSpec, mouthLine, mouthT0, silhouette, swimOffsetZ } = M;
