// Amano karidesi (Caridina multidentata) için karides hattı profili: Neocaridina iskeletinden daha ince gövde, daha uzun/çok dişli rostrum,
// fırça kıskaçlar, Amano dokusu ve iki ek bağlantı noktası.
import { ringYZ, segRing, SEG, type BodyParams, type Sex } from '../karides/model';
import type { ShrimpProfile } from '../karides/profile';
import { partsFor } from './parts';
import { variantById } from './variants';
import { paintShell } from './texture';

export const AMANO_BODY: Record<Sex, BodyParams> = {
  disi: { scale: 1.34, width: 0.98, height: 0.96, flare: 0.9, colour: 1.0 },
  erkek: { scale: 1.04, width: 0.8, height: 0.82, flare: 0.4, colour: 0.9 },
};

export const AMANO_PROFILE: ShrimpProfile = {
  variantById,
  paintShell,
  partsFor,
  body: AMANO_BODY,
  rostrum: { len: 0.46, teethEvery: 2, toothH: 0.018, lift: 0.08 },
  brushChela: true,
  extraAnchors: ({ anchor, sex, segMeshes }) => {
    const B = AMANO_BODY[sex];
    const r3 = segRing(sex, 3, 0.5, B);
    for (const s of [1, -1] as const) {
      const [y, z] = ringYZ(-Math.PI / 2 + 0.2 * Math.PI * 2, r3.ry, r3.rz, B.flare);
      anchor('benek', segMeshes[3], [SEG.len[3] * 0.5, y, s * z * 1.02], [0, -0.35, s]);
    }
    anchor('sirt-cizgisi', segMeshes[4], [SEG.len[4] * 0.5, segRing(sex, 4, 0.5, B).ry * 1.0, 0], [0, 1, 0]);
  },
};
