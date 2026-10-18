import type { SpeciesModule } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, VIEWS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { DEF, createViewer } from './viewer';
import { createYanalGroup } from '../akvaryum/yanal-group';

export const species: SpeciesModule = {
  id: 'kaplanbarb',
  ad: 'Kaplan barb',
  latin: 'Puntigrus tetrazona',
  kisaAciklama: 'Yüksek sırtlı, yanlardan basık gövde; dört dikey siyah bant, kırmızı–turuncu kenarlı sırt yüzgeci, erkekte kırmızı burun; 6 şematik renk ve 2 form (standart, uzun yüzgeçli).',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: daha ince ve renkli; burun kırmızı–turuncu, sırt ve karın yüzgeçlerinde kırmızı kenar daha yoğun (şematik). Fark zayıf olabilir, gençlerde görülmeyebilir; doğrulanmalı.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: daha iri ve karnı daha dolgun; renkleri daha soluk, burun ve yüzgeç kenarı kırmızısı az (şematik). Fark zayıf olabilir, gençlerde görülmeyebilir; doğrulanmalı.' },
  ],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Tür adı kaynaklarda değişir (Puntigrus tetrazona, eski ad Barbus tetrazona; Sumatra barb adıyla da bilinir). Bıyık (barbel) yoktur. Karın yüzgeçleri şematik olarak kısa, tek parça gösterilmiştir. GloFish benzeri floresan / genetiği değiştirilmiş ve boyanmış balıklar kapsam dışıdır. Ticari renk ve form adları satıcıya göre değişir; “doğrulanmalı” işaretli kayıtlar tutarsız kaynaklara dayanır.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
  createFishGroup: (o) => createYanalGroup(DEF, o),
};
