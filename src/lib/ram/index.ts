import type { SpeciesModule } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, VIEWS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { DEF, createViewer } from './viewer';
import { createYanalGroup } from '../akvaryum/yanal-group';

export const species: SpeciesModule = {
  id: 'ram',
  ad: 'Ram çiklit (kelebek çiklit)',
  latin: 'Mikrogeophagus ramirezi',
  kisaAciklama: 'Küçük, derin gövdeli cüce çiklit; gözden geçen siyah çubuk, gövde ortasında siyah leke, parlak mavi benekler, dikenli sırt yüzgeci ve kırmızı göz; 5 şematik renk ve 3 form (standart, uzun yüzgeçli, balon).',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: biraz daha büyük; sırt yüzgecinin 2. dikeni/ışınları uzar (iplik gibi), sırt ve anal yüzgeç uçları sivri; gövde lekesi koyu (şematik). Fark gençlerde ve yetiştirme hatlarında zayıftır, yüzgeç uzunluğu tek başına güvenilir değildir; doğrulanmalı.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: biraz daha küçük; sırt yüzgeci daha kısa ve yuvarlak, üreme döneminde karında pembe–kırmızı leke (şematik). Fark zayıftır, kaynaklarda tutarsızdır; doğrulanmalı.' },
  ],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Bolivya ramı (Mikrogeophagus altispinosus) AYRI bir türdür ve burada modellenmemiştir. “German blue” ticari bir hat adıdır; altın, elektrik mavisi, siyah ve albino hatlarının adı ve sınırları kaynaklarda tutarsızdır. Boyanmış ya da enjekte edilmiş balıklar kapsam dışıdır. Uzun yüzgeçli ve balon formlar yaygın satılır ancak ayrıntıları kaynakla doğrulanmalıdır; bazı kaynaklar bu hatlarda sağlık ve üreme sorunlarına dikkat çeker. Model bakım ya da tedavi rehberi değildir.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
  createFishGroup: (o) => createYanalGroup(DEF, o),
};
