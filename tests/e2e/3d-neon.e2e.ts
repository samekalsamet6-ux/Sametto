import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'neon', h1: '3B neon tetra modeli', scope: 'Kapsam.', firstVariant: 'normal',
  variant: { id: 'diamond', ad: /Diamond/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 13 }, { label: 'Dişi', value: 'disi', parts: 13 }],
  sexPart: { id: 'serit-egri', sex: 'disi', ad: 'Şeridin eğriliği (dişide)' },
  verifyPart: { id: 'mavi-serit', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Gözler (iri)' },
  visibility: [
    { view: 'yan', shown: ['goz', 'mavi-serit', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'anal-yuzgec'], hidden: [] },
    { view: 'alt', shown: ['anal-yuzgec', 'karin-yuzgeci'], hidden: ['sirt-yuzgeci', 'yag-yuzgeci'] },
  ],
  svgCount: 2,
});
