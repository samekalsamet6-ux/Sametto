// fish3d ailesi (betta, neon, corydoras, japon, pleko) için renderer'sız balık grubu: mevcut buildX kurucularını şablon olarak sarar.
import type { Mesh } from 'three';
import type { Material } from 'three';
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from './fishgroup';
import { SWIM } from './fishmath';
import type { FishBuilt, SwimUniforms } from './fish3d';
import type { FishGroup, FishGroupOptions, SexId } from './types';

export type Fish3dBuild = (sex: SexId, variant: string, u: SwimUniforms, texW: number, form?: string) => FishBuilt;

/** Gizlenme sınaması vekilleri sahneye girmez; hemen serbest bırakılır. */
export function freeProxy(proxy: { mesh: Mesh }[]) {
  for (const p of proxy) { p.mesh.geometry.dispose(); (p.mesh.material as Material).dispose(); }
}

export function createFish3dGroup(species: string, build: Fish3dBuild, opts: FishGroupOptions): FishGroup {
  return instantiate(species, opts, (lod): GroupTemplateSpec => {
    const u: SwimUniforms = { uTime: { value: 0 }, uAmp: { value: 0 } };
    const built = build(opts.sex, opts.variant, u, LOD_SETTINGS[lod].tex, opts.form);
    freeProxy(built.proxy);
    const face = built.face;
    return {
      root: built.group, textures: built.textures, uniforms: u, swimOn: { uAmp: SWIM.amp },
      drive: face ? (t, k) => face.update(t, k) : undefined, driveIsDetail: true,
      lengthRef: built.group.children[0],
    };
  });
}
