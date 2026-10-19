// Amano karidesi türü modülü (Caridina multidentata): karides hattının eklem zinciri iskeletini kullanır, ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesPart, SpeciesVariant, SexId } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { FORMS } from './forms';
import { createViewer } from './viewer';
import { createAmanoGroup } from './group';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari,
});

export const species: SpeciesModule = {
  id: 'amano',
  ad: 'Amano karidesi (Yamato karidesi)',
  latin: 'Caridina multidentata',
  kisaAciklama: 'Amano (Yamato) karidesinin yarı saydam gri-yeşil gövdesi, yan benek sırası (erkekte nokta, dişide çizgi), sırt çizgisi, çok dişli rostrum, fırça kıskaçlar, antenler, kuyruk yelpazesi ve dişide eyer/yumurta; tanınan ayrı renk hattı ya da şekil varyetesi yok.',
  sexes: [
    { id: 'disi', ad: 'Dişi', not: 'Dişi daha büyük çizilmiştir; yan işaretler uzamış tire biçimindedir, sırtta eyer, karın altında yumurtalar (berry) gösterilebilir (şematik).' },
    { id: 'erkek', ad: 'Erkek', not: 'Erkek daha küçük ve ince çizilmiştir; yan işaretler yuvarlak küçük noktalardır; ikinci yüzme bacağında küçük bir çıkıntı (appendix masculina) şematik gösterilir.' },
  ],
  views: [
    { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'yan', ad: 'Yan' },
    { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik bir Caridina multidentata gövdesidir (eski adı C. japonica); belirli bir bireyin ölçüsü değildir. Tanınan ayrı bir renk hattı ya da şekil varyetesi yoktur; erkekte nokta / dişide tire ayrımı yaygın bir anlatımdır ve bireyde kesin değildir (doğrulanmalı). Larvalar acı su ister, bu yüzden tatlı suda genellikle üremez. Bu sayfa bakım rehberi değildir.',
  forms: FORMS.map((f) => ({ id: f.id, ad: f.ad, aciklama: f.aciklama, grup: f.grup, dogrulanmali: f.dogrulanmali })),
  partsFor: (sex: SexId) => partsFor(sex).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
  createFishGroup: createAmanoGroup,
};
