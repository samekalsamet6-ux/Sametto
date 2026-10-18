// Plati (Xiphophorus maculatus / variatus; şematik) 3B modeli için SAF geometri parametreleri.
// Ortak canlı doğuran geometrisi livebearer/model.ts içindedir; burada yalnızca platiye özgü sayılar bulunur.
// Kısa, tıknaz ve derin gövde; kalın kuyruk sapı; kısa yuvarlak kuyruk, kısa sırt yüzgeci, kısa gonopodium.
// Kılıç/tepe (hifin, swordtail benzeri) ve balon gibi biçim varyetelerine bilerek yer verilmemiştir.
import { createModel, type LbConfig } from '../livebearer/model';

export * from '../livebearer/model';

export const CONFIG: LbConfig = {
  body: {
    erkek: { length: 2.55, height: 0.86, width: 0.52, peak: 0.42, peduncle: 0.4, belly: 0.04, bellyAt: 0.55, bellySpread: 0.2, eye: 0.13, lift: 0.1, frontPow: 0.62, shape: { nape: 0.05, back: 0.05, throat: 0.06, snout: 0.4, gill: 0.045, flank: 0.16, ridge: 0.12 } },
    disi: { length: 3.0, height: 1.2, width: 0.82, peak: 0.45, peduncle: 0.36, belly: 0.28, bellyAt: 0.55, bellySpread: 0.2, eye: 0.14, lift: 0.1, frontPow: 0.62, shape: { nape: 0.05, back: 0.05, throat: 0.06, snout: 0.4, gill: 0.045, flank: 0.16, ridge: 0.12 } },
  },
  tail: {
    erkek: { rays: 15, reach: 0.78, halfAngle: 40, bulge: 0.06, round: 0.7 },
    disi: { rays: 15, reach: 0.74, halfAngle: 38, bulge: 0.06, round: 0.7 },
  },
  dorsal: {
    erkek: { t0: 0.4, t1: 0.57, rays: 9, phiFront: 72, phiRear: 44, lenFront: 0.4, lenRear: 0.58 },
    disi: { t0: 0.41, t1: 0.56, rays: 8, phiFront: 72, phiRear: 48, lenFront: 0.38, lenRear: 0.52 },
  },
  anal: { lenFront: 0.48, lenRear: 0.3 },
  gono: 0.62,
  paired: 0.95,
};

export const M = createModel(CONFIG);
export const { BODY, TAIL, DORSAL, bodyProfile, bodyX, bodySurfacePoint, envelope, tailFin, dorsalFin, analFin, pectoralFin, pelvicFin, gonopodium, eyeSpec, mouthLine, silhouette, swimOffsetZ } = M;
