// Kılıçkuyruk gövde dokusu (tarayıcıya özgü; birim testi yok). Ortak çizici livebearer/texture.ts içindedir.
import { paintBody as paint, type BodyTextures } from '../livebearer/texture';
import { BODY, type Sex } from './model';
import type { Variant } from './variants';

export type { BodyTextures };
export const paintBody = (variant: Variant, sex: Sex, W = 1024): BodyTextures => paint(variant, sex, W, { scaleW: 23, scaleH: 19, eye: (s) => ({ r: BODY[s].eye, length: BODY[s].length, height: BODY[s].height }) });
