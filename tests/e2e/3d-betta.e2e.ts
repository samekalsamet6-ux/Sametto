import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'betta', h1: '3B betta modeli', scope: 'Kapsam.', firstVariant: 'kirmizi',
  variant: { id: 'koi', ad: /Koi/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 11 }, { label: 'Dişi', value: 'disi', parts: 12 }],
  sexPart: { id: 'yumurta-borusu', sex: 'disi', ad: 'Yumurta borusu noktası (ovipozitör)' },
  verifyPart: { id: 'govde', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Gözler' },
  visibility: [
    { view: 'yan', shown: ['goz', 'solungac-kapagi', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'anal-yuzgec'], hidden: [] },
    { view: 'alt', shown: ['anal-yuzgec', 'karin-yuzgeci'], hidden: ['sirt-yuzgeci'] },
  ],
  svgCount: 2,
});
