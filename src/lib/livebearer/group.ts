// Molly ve platy için renderer'sız balık grubu: livebearer/viewer.buildFish'i şablon olarak sarar.
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from '../akvaryum/fishgroup';
import type { FishGroup, FishGroupOptions } from '../akvaryum/types';
import { SWIM } from './model';
import { buildFish, type LbDeps } from './viewer';

export function createLbGroup(species: string, D: LbDeps, opts: FishGroupOptions): FishGroup {
  return instantiate(species, opts, (lod): GroupTemplateSpec => {
    const form = opts.form || 'standart';
    const M = D.modelFor ? D.modelFor(form) : D.M;
    const cur: LbDeps = D.modelFor ? { ...D, M, partAnchors: D.anchorsFor ? D.anchorsFor(form) : D.partAnchors } : D;
    const u = { uTime: { value: 0 }, uAmp: { value: 0 }, uFlap: { value: 0 }, uLen: { value: M.BODY[opts.sex].length } };
    const built = buildFish(cur, opts.sex, opts.variant, u, LOD_SETTINGS[lod].tex, false);
    return {
      root: built.group, textures: built.textures, uniforms: u, swimOn: { uAmp: SWIM.amp, uFlap: 1 },
      drive: (t, k) => built.head.update(t, k), driveIsDetail: true, lengthRef: built.body,
    };
  });
}
