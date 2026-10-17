import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'corydoras', h1: '3B corydoras modeli', scope: 'Tür varsayımı.', firstVariant: 'bronz',
  variant: { id: 'sterbai', ad: /Sterbai/ },
  sexes: [{ label: 'Dişi', value: 'disi', parts: 15 }, { label: 'Erkek', value: 'erkek', parts: 15 }],
  sexPart: { id: 'govde-genis', sex: 'disi', ad: 'Geniş, dolgun gövde (dişi)' },
  verifyPart: { id: 'dikenler', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Gözler' },
  visibility: [
    { view: 'yan', shown: ['goz', 'zirh', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'gogus-yuzgeci'], hidden: ['agiz'] },
    { view: 'alt', shown: ['agiz', 'biyik', 'karin-yuzgeci'], hidden: ['goz', 'sirt-yuzgeci', 'yag-yuzgeci'] },
  ],
  turnTo: { from: 'yan', part: 'agiz', to: 'alt' },
  svgCount: 2,
});
