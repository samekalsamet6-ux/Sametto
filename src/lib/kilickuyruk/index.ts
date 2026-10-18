// Kılıçkuyruk türü modülü: parça/varyete/görüntüleyici verilerini ortak SpeciesModule sözleşmesine uyarlar.
import type { SexId, SpeciesModule, SpeciesPart, SpeciesVariant } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { FORMS } from './forms';
import { VARIANTS } from './variants';
import { LB_DEPS, createViewer } from './viewer';
import { createLbGroup } from '../livebearer/group';

const toPart = (p: (typeof PARTS)[number]): SpeciesPart => ({
  id: p.id, ad: p.ad, ozet: p.ozet, aciklama: p.aciklama, sex: p.sex, dogrulanmali: p.dogrulanmali, uyari: p.uyari, wiki: p.wiki,
});

export const species: SpeciesModule = {
  id: 'kilickuyruk',
  ad: 'Kılıçkuyruk',
  latin: 'Xiphophorus hellerii',
  kisaAciklama: 'Uzun, ince kılıçkuyruk: erkekte kuyruk yüzgecinin alt kenarında kılıç, gonopodium; dişide gravid spot; 5 form ve 10 renk/desen varyetesi.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Daha küçük ve ince; kuyruk yüzgecinin alt kenarı uzun bir kılıca uzar; anal yüzgeç çubuk biçimli gonopodiumdur (şematik).' },
    { id: 'disi', ad: 'Dişi', not: 'Daha iri ve karnı dolgun; kılıç yoktur; yelpaze biçimli anal yüzgeç ve yakınında gravid spot (koyu renkli bireylerde belirgin olmayabilir).' },
  ],
  views: [
    { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
    { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
  ],
  not: 'Şematik, yeşil kılıçkuyruk (Xiphophorus hellerii) yorumu; ticari kılıçkuyrukların çoğu hellerii ağırlıklı melezlerdir ve bu model ayırt etmez. Kılıç yalnızca erkekte bulunur ve her formda vardır. Form varyeteleri (hifin, lyretail, Simpson hifin lyretail, hifin delta) renkten bağımsız seçilir; Simpson ve delta kaynakla doğrulanmalıdır. “Wagtail”, “tuxedo”, “koi”, “pineapple” biçim değil renk desenidir. Renk adları satıcıya göre değişir.',
  forms: FORMS.map(({ id, ad, aciklama, grup, dogrulanmali }) => ({ id, ad, aciklama, grup, dogrulanmali })),
  partsFor: (sex: SexId, form?: string) => partsFor(sex, form).map(toPart),
  parts: PARTS.map(toPart),
  variants: VARIANTS.map((v): SpeciesVariant => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer: (o) => createViewer(o as Parameters<typeof createViewer>[0]) as unknown as ReturnType<SpeciesModule['createViewer']>,
  createFishGroup: (o) => createLbGroup('kilickuyruk', LB_DEPS, o),
};
