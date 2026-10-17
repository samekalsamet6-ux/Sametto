import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'japon', h1: '3B japon balığı modeli', scope: 'Kapsam.', firstVariant: 'turuncu',
  variant: { id: 'shubunkin', ad: /Shubunkin/ },
  sexes: [{ label: 'Erkek (üreme dönemi)', value: 'erkek', parts: 13 }, { label: 'Dişi (üreme dönemi)', value: 'disi', parts: 13 }],
  sexPart: { id: 'tuberkul', sex: 'erkek', ad: 'Üreme tüberkülleri (erkek)' },
  verifyPart: { id: 'govde', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'pullar', ad: 'Pullar' },
  visibility: [
    { view: 'yan', shown: ['goz', 'pullar', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'anal-yuzgec', 'gogus-yuzgeci'], hidden: [] },
    { view: 'alt', shown: ['anal-yuzgec', 'karin-yuzgeci'], hidden: ['sirt-yuzgeci'] },
  ],
  svgCount: 2,
});
