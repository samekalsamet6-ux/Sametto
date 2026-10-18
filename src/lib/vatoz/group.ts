// Tatlı su vatozu için renderer'sız balık grubu: viewer.buildRay'i şablon olarak sarar.
import type { Material } from 'three';
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from '../akvaryum/fishgroup';
import type { FishGroup, FishGroupOptions } from '../akvaryum/types';
import { SWIM } from './model';
import { buildRay } from './viewer';

export function createVatozGroup(opts: FishGroupOptions): FishGroup {
  return instantiate('vatoz', opts, (lod): GroupTemplateSpec => {
    const u = { uTime: { value: 0 }, uAmp: { value: 0 } };
    const built = buildRay(opts.sex, opts.variant, u, LOD_SETTINGS[lod].tex);
    for (const p of built.proxy) { p.geometry.dispose(); (p.material as Material).dispose(); }
    return { root: built.group, textures: built.textures, uniforms: u, swimOn: { uAmp: SWIM.amp }, lengthRef: built.group.children[0] };
  });
}
