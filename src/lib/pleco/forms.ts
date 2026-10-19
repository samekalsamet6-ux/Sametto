// Pleko (Ancistrus) form (şekil) varyetesi: renkten bağımsız, yalnızca yüzgeç geometrisini değiştirir (saf veri).
// Akvaryum ticaretinde Ancistrus için yaygın olarak tanınan tek şekil ayrımı normal (kısa yüzgeçli) ve tül/longfin (uzun yüzgeçli) biçimdir;
// başka bir şekil formu (ör. gövde değişimi) kaynaklarda doğrulanamadığı için eklenmedi.
import type { SpeciesForm } from '../akvaryum/types';

export const FORMS: SpeciesForm[] = [
  { id: 'normal', ad: 'Normal (kısa yüzgeç)', grup: 'Yüzgeç uzunluğu',
    aciklama: 'Doğal/standart yüzgeç uzunluğu: sırt yüzgeci yelken biçiminde ama orta boyda, kuyruk ve göğüs yüzgeçleri kısa. Ticarette “shortfin” olarak da anılır.' },
  { id: 'tul', ad: 'Tül (uzun yüzgeç / longfin)', grup: 'Yüzgeç uzunluğu',
    aciklama: 'Sırt, kuyruk, göğüs, karın ve anal yüzgeçler belirgin uzun, perde (tül) gibi akıcıdır. Tül, renkten bağımsız, seçilimle üretilmiş bir yüzgeç uzunluğu özelliğidir; her renk formuyla birleştirilebilir (ör. “L144 limon mavi göz longfin”). Uzunluk dereceleri bireyden bireye değişir; modeldeki oran şematiktir (kaynakla doğrulanmalı).', dogrulanmali: true },
];

export const DEFAULT_FORM = FORMS[0].id;
/** Form -> yüzgeç uzatma derecesi (0 = normal, 1 = tül) */
export const tulFor = (form?: string): number => (form === 'tul' ? 1 : 0);
export const formById = (id?: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
