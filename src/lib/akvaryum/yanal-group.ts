// Yanlardan basık balıklar (melek, diskus) için renderer'sız balık grubu: yanal-viewer.buildFish'i şablon olarak sarar.
import type { Material } from 'three';
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from './fishgroup';
import { buildFish, type FishDef } from './yanal-viewer';
import type { FishGroup, FishGroupOptions } from './types';

export function createYanalGroup(def: FishDef, opts: FishGroupOptions): FishGroup {
  return instantiate(def.id, { ...opts, form: opts.form ?? def.forms?.defaultForm }, (lod): GroupTemplateSpec => {
    const spec = def.forms ? def.forms.specFor(opts.form ?? def.forms.defaultForm, def.sexed ? opts.sex : undefined) : def.spec;
    const u = { uTime: { value: 0 }, uAmp: { value: 0 } };
    const built = buildFish(def, opts.variant, u, lod === 'low' ? LOD_SETTINGS.low.tex : 640, spec, def.sexed ? opts.sex : undefined);
    built.proxy.geometry.dispose(); (built.proxy.material as Material).dispose();
    const face = built.face;
    return {
      root: built.group, textures: built.textures, uniforms: u, swimOn: { uAmp: 1 },
      drive: (t, k) => face.update(t, k), driveIsDetail: true,
      lengthRef: built.group.children[0],
    };
  });
}
