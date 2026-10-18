// Yan görünüş atlas dokusu (gövde + yüzgeçler). Ortak boyayıcı: src/lib/akvaryum/yanal-texture.ts;
// melek balığına özgü ek boyama (yüzgeç ışınları, bantların silik yüzgeç uzantısı) spec.decorate ile paint.ts'dedir.
import { paintAtlas, type FishTextures } from '../akvaryum/yanal-texture';
import { SPEC } from './model';
import type { FishSpec } from '../akvaryum/yanal-model';
import type { Variant } from './variants';

export type { FishTextures };
export const paintMelek = (variant: Variant, w = 1024, spec: FishSpec = SPEC): FishTextures => paintAtlas(spec, variant, w);
