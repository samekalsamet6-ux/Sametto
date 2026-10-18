// Lepistes için renderer'sız balık grubu: viewer.buildFish'i şablon olarak sarar (bkz. akvaryum/fishgroup.ts).
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from '../akvaryum/fishgroup';
import type { FishGroup, FishGroupOptions } from '../akvaryum/types';
import { BODY, SWIM } from './model';
import { buildFish } from './viewer';

export function createGuppyGroup(opts: FishGroupOptions): FishGroup {
  return instantiate('lepistes', opts, (lod): GroupTemplateSpec => {
    const u = { uTime: { value: 0 }, uAmp: { value: 0 }, uFlap: { value: 0 }, uLen: { value: BODY[opts.sex].length } };
    const built = buildFish(opts.sex, opts.variant, u, LOD_SETTINGS[lod].tex, opts.form || 'standart', false);
    return {
      root: built.group, textures: built.textures, uniforms: u, swimOn: { uAmp: SWIM.amp, uFlap: 1 },
      drive: (t, k) => built.head.update(t, k), driveIsDetail: true, lengthRef: built.body,
    };
  });
}
