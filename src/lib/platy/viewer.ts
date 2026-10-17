// three.js sahnesi: yalnızca Plati sayfasında, tembel (dynamic import) yüklenir. Sahne kodu livebearer/viewer.ts içindedir.
import { createLbViewer, type Viewer, type ViewerOptions } from '../livebearer/viewer';
import { M } from './model';
import { partAnchors, partsFor } from './parts';
import { paintBody } from './texture';
import { finColor, variantById } from './variants';

export type { Viewer, ViewerOptions };

export function createViewer(opts: ViewerOptions): Viewer {
  return createLbViewer({ M, cls: 'lb3', partsFor, partAnchors, variantById, finColor, paintBody }, opts);
}
