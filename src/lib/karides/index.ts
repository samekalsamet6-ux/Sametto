// Neocaridina karidesi türü modülü: parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SpeciesModule, SpeciesPart, SpeciesVariant, SexId } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';
import { createKaridesGroup } from './group';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari,
});

export const species: SpeciesModule = {
  id: 'karides',
  ad: 'Neocaridina karidesi',
  latin: 'Neocaridina davidi',
  kisaAciklama: 'Neocaridina (cherry shrimp) karidesinin karapaks, karın halkaları, gözler, antenler, bacaklar, kuyruk yelpazesi, dişide eyer/yumurta ve 16 şematik renk varyetesi.',
  sexes: [
    { id: 'disi', ad: 'Dişi', not: 'Dişi daha büyük ve karnı daha yuvarlak çizilmiştir; sırtta eyer, karın altında yumurtalar (berry) gösterilebilir (şematik).' },
    { id: 'erkek', ad: 'Erkek', not: 'Erkek daha küçük, ince ve biraz daha soluk çizilmiştir; ikinci yüzme bacağında küçük bir çıkıntı (appendix masculina) şematik gösterilir.' },
  ],
  views: [
    { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'yan', ad: 'Yan' },
    { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik bir Neocaridina davidi gövdesi; belirli bir bireyin ölçüsü değildir. Renk varyeteleri yalnızca renk/desen farkıdır, ticaret adları satıcıya göre değişir ve “doğrulanmalı” işaretli olanlar belirsizdir. Caridina (ör. Crystal Red) bu listede yoktur. Bu sayfa bakım rehberi değildir.',
  partsFor: (sex: SexId) => partsFor(sex).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
  createFishGroup: createKaridesGroup,
};
