// Lepistes türü modülü: mevcut parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SpeciesModule, SpeciesForm, SpeciesPart, SpeciesVariant, SexId } from '../akvaryum/types';
import { FORM_PARTS, PARTS, partsFor } from './parts';
import { FORMS } from './forms';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';
import { createGuppyGroup } from './group';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, wiki: p.wiki,
});

export const species: SpeciesModule = {
  id: 'lepistes',
  ad: 'Lepistes',
  latin: 'Poecilia reticulata',
  kisaAciklama: 'Erkek ve dişi lepistesin anatomisi ve 29 şematik renk varyetesi ile 15 form (şekil) varyetesi: delta, veiltail, lyretail, kılıç kuyruk, fil kulak ve diğerleri.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Daha küçük ve ince gövde, uzun ve renkli sırt/kuyruk yüzgeci, anal yüzgecin yerinde gonopodium.' },
    { id: 'disi', ad: 'Dişi', not: 'Daha büyük ve yuvarlak gövde, kısa ve sönük yüzgeçler, yelpaze biçimli anal yüzgeç, karın arkasında gravid spot.' },
  ],
  views: [
    { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
    { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik model: oranlar, desenler ve renkler eğitim amaçlı bir yorumdur; gerçek bir bireyin ya da standardın ölçüsü değildir.',
  forms: FORMS.map((f): SpeciesForm => ({ id: f.id, ad: f.ad, aciklama: f.aciklama, grup: f.grup, dogrulanmali: f.dogrulanmali })),
  partsFor: (sex: SexId, form?: string) => partsFor(sex, form).map(toPart),
  parts: [...PARTS, ...FORM_PARTS].map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
  createFishGroup: createGuppyGroup,
};
