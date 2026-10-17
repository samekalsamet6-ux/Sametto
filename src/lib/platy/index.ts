// Plati türü modülü: parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SexId, SpeciesModule, SpeciesPart, SpeciesVariant } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari, wiki: p.wiki,
});

export const species: SpeciesModule = {
  id: 'platy',
  ad: 'Plati',
  latin: 'Xiphophorus maculatus / variatus',
  kisaAciklama: 'Kısa, tıknaz plati: yuvarlak kuyruk, gonopodium, gravid spot ve 10 renk/desen varyetesi.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Daha küçük ve ince; anal yüzgeci kısa, çubuk biçimli gonopodium (şematik).' },
    { id: 'disi', ad: 'Dişi', not: 'Daha iri ve karnı dolgun; yelpaze biçimli anal yüzgeç; yakınında gravid spot (koyu renkli bireylerde belirgin olmayabilir).' },
  ],
  views: [
    { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
    { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik, standart gövdeli (kılıçsız, yuvarlak kuyruklu) bir plati; X. maculatus ve X. variatus ayrımı gösterilmemiştir, ticari platiler çoğunlukla bu iki türün melezleridir. Kılıç/hifin ve balon gibi biçim varyeteleri modellenmemiştir. Renk adları satıcıya göre değişir.',
  partsFor: (sex: SexId) => partsFor(sex).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
};
