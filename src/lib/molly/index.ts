// Molly türü modülü: parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SexId, SpeciesModule, SpeciesPart, SpeciesVariant } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { FORMS } from './forms';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari, wiki: p.wiki,
});

export const species: SpeciesModule = {
  id: 'molly',
  ad: 'Molly',
  latin: 'Poecilia sphenops / latipinna / velifera',
  kisaAciklama: 'Lepistesten iri, derin gövdeli molly: yuvarlak kuyruk, gonopodium, gravid spot, 5 form ve 9 renk varyetesi.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Daha ince; anal yüzgeci çubuk biçimli gonopodium; sırt yüzgeci biraz daha yüksek (şematik).' },
    { id: 'disi', ad: 'Dişi', not: 'Daha iri ve karnı dolgun; yelpaze biçimli anal yüzgeç; gravid spot yakınında (koyu bireylerde görünmez).' },
  ],
  views: [
    { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
    { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik, standart (yuvarlak kuyruklu, normal sırt yüzgeçli) bir molly gövdesi; belirli bir türün (sphenops, latipinna, velifera) ya da bireyin ölçüsü değildir. Form varyeteleri (sailfin, lyretail, veiltail, balon) renkten bağımsız seçilir; adlandırma satıcıya göre değişir, veiltail ve balon kaynakla doğrulanmalıdır. Renk adları satıcıya göre değişir.',
  forms: FORMS.map(({ id, ad, aciklama, grup, dogrulanmali }) => ({ id, ad, aciklama, grup, dogrulanmali })),
  partsFor: (sex: SexId, form?: string) => partsFor(sex, form).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
};
