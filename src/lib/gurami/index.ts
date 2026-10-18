import type { SpeciesModule } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, VIEWS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { DEF, createViewer } from './viewer';
import { createYanalGroup } from '../akvaryum/yanal-group';

export const species: SpeciesModule = {
  id: 'gurami',
  ad: 'Cüce gurami',
  latin: 'Trichogaster lalius',
  kisaAciklama: 'Yanlardan basık oval gövde, uzun “dokunma” iplikleri ve kesintisiz anal yüzgeç; erkekte sivri sırt yüzgeci ve çapraz şeritler; 8 şematik renk (neon mavi, toz mavi, kobalt, gün batımı, alev ...).',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: daha renkli ve ince gövdeli; sırt yüzgeci uzun ve sivri uçlu, anal yüzgeç daha uzun; mavi zemin üzerinde belirgin kırmızı–turuncu çapraz şeritler (şematik). Gençlerde fark belirgin olmayabilir.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: daha soluk, gümüşi renkli; şeritler çok silik; sırt yüzgeci kısa ve yuvarlak, karın daha dolgun (şematik). Gençlerde fark belirgin olmayabilir.' },
  ],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Tür adı kaynaklarda değişir (Trichogaster lalius, eski ad Colisa lalia; 2022 revizyonunda T. fasciata önerisi, kabulü doğrulanmalı). Ticarette satılan renkler seçmeli üretilmiş biçimlerdir ve adlar satıcıya göre değişir. Bu türde tanınan ayrı bir şekil (form) varyetesi bulunamadığı için yalnızca standart biçim vardır.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
  createFishGroup: (o) => createYanalGroup(DEF, o),
};
