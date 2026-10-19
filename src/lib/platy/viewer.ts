// three.js sahnesi: yalnızca Plati sayfasında, tembel (dynamic import) yüklenir. Sahne kodu livebearer/viewer.ts içindedir.
import { createLbViewer, type LbDeps, type Viewer, type ViewerOptions } from '../livebearer/viewer';
import { M } from './model';
import { partAnchors, partsFor } from './parts';
import { kit } from './forms';
import { paintBody } from './texture';
import { finColor, variantById } from './variants';

export type { Viewer, ViewerOptions };

export const LB_DEPS: LbDeps = { M, modelFor: kit.modelFor, anchorsFor: kit.anchorsFor, cls: 'lb3', partsFor, partAnchors, variantById, finColor, paintBody };

export function createViewer(opts: ViewerOptions): Viewer {
  return createLbViewer(LB_DEPS, opts);
}
