// Molly (Poecilia sphenops türü standart gövde; şematik) 3B modeli için SAF geometri parametreleri.
// Ortak canlı doğuran geometrisi livebearer/model.ts içindedir; burada yalnızca mollye özgü sayılar bulunur.
// Lepistesten daha iri, daha derin gövdeli; yuvarlak (dairesel) kuyruk; baş yassı, ağız yukarı bakar.
// Yelken (sailfin) sırt yüzgeci ve balon/lyretail gibi biçim varyetelerine bilerek yer verilmemiştir.
import { createModel, type LbConfig } from '../livebearer/model';

export * from '../livebearer/model';

export const CONFIG: LbConfig = {
  body: {
    erkek: { length: 3.3, height: 1.1, width: 0.7, peak: 0.42, peduncle: 0.38, belly: 0.04, bellyAt: 0.55, bellySpread: 0.2, eye: 0.112, lift: 0.24, frontPow: 0.45, shape: { nape: 0.1, back: 0.1, throat: 0.1, snout: 0.55, gill: 0.05, flank: 0.14, ridge: 0.2 } },
    disi: { length: 3.8, height: 1.2, width: 0.85, peak: 0.45, peduncle: 0.36, belly: 0.24, bellyAt: 0.55, bellySpread: 0.2, eye: 0.12, lift: 0.22, frontPow: 0.45, shape: { nape: 0.1, back: 0.1, throat: 0.1, snout: 0.55, gill: 0.05, flank: 0.14, ridge: 0.2 } },
  },
  // Yuvarlak kuyruk: arka kenar daire yayı (round=0.9)
  tail: {
    erkek: { rays: 19, reach: 0.98, halfAngle: 44, bulge: 0.1, round: 1 },
    disi: { rays: 17, reach: 0.88, halfAngle: 42, bulge: 0.1, round: 1 },
  },
  // Standart molly: sırt yüzgeci gövdeye göre belirgin, erkekte biraz daha yüksek (yelken biçimi değil)
  dorsal: {
    erkek: { t0: 0.38, t1: 0.6, rays: 14, phiFront: 78, phiRear: 38, lenFront: 0.6, lenRear: 0.95 },
    disi: { t0: 0.4, t1: 0.57, rays: 11, phiFront: 76, phiRear: 46, lenFront: 0.48, lenRear: 0.68 },
  },
  anal: { lenFront: 0.58, lenRear: 0.34 },
  gono: 0.82,
  paired: 1.1,
};

export const M = createModel(CONFIG);
export const { BODY, TAIL, DORSAL, bodyProfile, bodyX, bodySurfacePoint, envelope, tailFin, dorsalFin, analFin, pectoralFin, pelvicFin, gonopodium, eyeSpec, mouthLine, mouthT0, silhouette, swimOffsetZ } = M;
