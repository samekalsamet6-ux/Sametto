// Tatlı su vatozu türü modülü: mevcut parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SpeciesModule, SpeciesPart, SpeciesVariant, SexId } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';
import { createVatozGroup } from './group';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari,
});

export const species: SpeciesModule = {
  id: 'vatoz',
  ad: 'Tatlı su vatozu',
  latin: 'Potamotrygon spp.',
  kisaAciklama: 'Akvaryumda tutulan tatlı su vatozunun (Potamotrygon) üst/alt yüz anatomisi, klasper, kuyruk dikeni ve 6 şematik desen.',
  sexes: [
    { id: 'disi', ad: 'Dişi', not: 'Klasper yoktur; disk biraz daha büyük ve dolgun çizilmiştir (şematik).' },
    { id: 'erkek', ad: 'Erkek', not: 'Pelvik yüzgeçlerin iç kenarında iki klasper (eşleşme organı) bulunur; disk biraz daha küçük çizilmiştir (şematik).' },
  ],
  views: [
    { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'yan', ad: 'Yan' },
    { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik, genel Potamotrygon benzeri bir disk; belirli bir türün ölçüsü değildir. Tür kimliği kaynakla doğrulanmalı. Kuyruk dikeni zehirlidir; sayfa bakım ya da müdahale rehberi değildir.',
  partsFor: (sex: SexId) => partsFor(sex).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
  createFishGroup: createVatozGroup,
};
