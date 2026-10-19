// Yan görünüş atlas dokusu (gövde + yüzgeçler). Ortak boyayıcı: src/lib/akvaryum/yanal-texture.ts
import { paintAtlas, type FishTextures } from '../akvaryum/yanal-texture';
import { SPEC } from './model';
import type { Variant } from './variants';

export type { FishTextures };
export const paintDiskus = (variant: Variant, w = 1024): FishTextures => paintAtlas(SPEC, variant, w);
