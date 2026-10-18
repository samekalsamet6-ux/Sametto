// Karides için renderer'sız balık grubu: viewer.buildShrimp'i şablon olarak sarar. Gölgelendirici yüzmesi yok;
// antenler, bacaklar ve yüzme bacakları eklem dönüşleriyle canlanır (şablon sürülür, kopyaya aktarılır).
import { Sphere, type Mesh } from 'three';
import { LOD_SETTINGS, instantiate, type GroupTemplateSpec } from '../akvaryum/fishgroup';
import type { FishGroup, FishGroupOptions } from '../akvaryum/types';
import { ANIM } from './model';
import { buildShrimp } from './viewer';

/** 'low': gövde uzunluğunun %2'sinden küçük ayrıntılar (eklem küreleri, parmak uçları) çizilmez: çizim çağrısı azalır. */
const TINY = 0.02;

export function createKaridesGroup(opts: FishGroupOptions): FishGroup {
  return instantiate('karides', opts, (lod): GroupTemplateSpec => {
    const built = buildShrimp(opts.sex, opts.variant, LOD_SETTINGS[lod].tex);
    if (lod === 'low') {
      built.root.updateMatrixWorld(true);
      const tiny: Mesh[] = [], s = new Sphere();
      built.root.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh || built.occluders.includes(m)) return;
        m.geometry.computeBoundingSphere();
        if (s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld).radius < TINY) tiny.push(m);
      });
      for (const m of tiny) { m.removeFromParent(); m.geometry.dispose(); }
    }
    return { root: built.root, textures: built.textures, drive: (t, k) => built.pose(t, k * ANIM.amp), driveIsDetail: false, lengthRef: built.occluders };
  });
}
