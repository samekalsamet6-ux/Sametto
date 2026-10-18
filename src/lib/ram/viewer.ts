// three.js sahnesi: yalnızca 3B ram çiklit sayfasında, tembel (dynamic import) yüklenir.
import type { SpeciesViewer, SpeciesViewerOptions } from '../akvaryum/types';
import { createFishViewer, type FishDef } from '../akvaryum/yanal-viewer';
import { DEFAULT_FORM, SPEC, specFor } from './model';
import { PARTS, partAnchors } from './parts';
import { variantById } from './variants';

export const DEF: FishDef = {
  id: 'ram',
  spec: SPEC,
  partIds: PARTS.map((p) => ({ id: p.id, ad: p.ad })),
  anchors: partAnchors(),
  variantById,
  sexed: true,
  // [yatay, düşey]: yatay 0 = +z yanı kameraya bakar, burun solda.
  views: { yan: [0, Math.PI / 2 - 0.03], capraz: [-0.75, 1.28], on: [-Math.PI / 2, Math.PI / 2 - 0.03], ust: [0, 0.02], alt: [0, Math.PI - 0.02], arka: [Math.PI / 2, Math.PI / 2 - 0.03] },
  defaultView: 'capraz',
  forms: { defaultForm: DEFAULT_FORM, specFor, anchorsFor: (f, s) => partAnchors(f, s) },
};

export const createViewer = (opts: SpeciesViewerOptions): SpeciesViewer => createFishViewer(DEF, opts);
