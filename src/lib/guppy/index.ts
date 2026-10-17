// Lepistes türü modülü: mevcut parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SpeciesModule, SpeciesPart, SpeciesVariant, SexId } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, wiki: p.wiki,
});

export const species: SpeciesModule = {
  id: 'lepistes',
  ad: 'Lepistes',
  latin: 'Poecilia reticulata',
  kisaAciklama: 'Erkek ve dişi lepistesin anatomisi ve 29 şematik renk varyetesi.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Daha küçük ve ince gövde, uzun ve renkli sırt/kuyruk yüzgeci, anal yüzgecin yerinde gonopodium.' },
    { id: 'disi', ad: 'Dişi', not: 'Daha büyük ve yuvarlak gövde, kısa ve sönük yüzgeçler, yelpaze biçimli anal yüzgeç, karın arkasında gravid spot.' },
  ],
  views: [
    { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
    { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik model: oranlar, desenler ve renkler eğitim amaçlı bir yorumdur; gerçek bir bireyin ya da standardın ölçüsü değildir.',
  partsFor: (sex: SexId) => partsFor(sex).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
};
