// Form (şekil) varyeteleri: standart (doğal), uzun yüzgeçli ve balon (kısa, yuvarlak gövde). Her form her renkle birleşir.
// Kaynaklar (ör. Wikipedia "Ram cichlid"): uzun yüzgeçli ve iri/yüksek gövdeli "balon" biçimleri anılır; balon ve uzun yüzgeçli
// hatların ayrıntıları ve adlandırması hobi kaynaklarında tutarsızdır, bu yüzden "doğrulanmalı" işaretlidir.
// Başka (ör. “kısa gövdeli”, “veil”) adlar tanımlanamadığı için uydurulmamıştır.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORM_GROUPS = ['Doğal biçim', 'Seçmeli hatlar'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: FORM_GROUPS[0], ad: 'Standart', dogrulanmali: false,
    aciklama: 'Doğadaki biçime yakın: derin ama yanlardan basık gövde, dik alın, kısa dikenli sırt yüzgeci (erkekte 2. diken uzar), yuvarlak kuyruk ve uzun ilk ışınlı karın yüzgeçleri. Diğer formlara kıyas noktasıdır.' },
  { id: 'uzun-yuzgec', grup: FORM_GROUPS[1], ad: 'Uzun yüzgeçli (long-fin)', dogrulanmali: true,
    aciklama: 'Sırt, anal, kuyruk ve karın yüzgeçleri belirgin uzundur ve geriye akar; gövde standartla aynıdır. Kaynaklarda uzun yüzgeçli ramların özellikle Asya yetiştirmelerinden yayıldığı ve Avrupa “German blue” hatlarında nadir olduğu anlatılır; ayrıntılar kaynakla doğrulanmalıdır. Uzun yüzgeçli bireylerde yüzgeç uzunluğu tek başına cinsiyeti belli etmez. Şematik yorum.' },
  { id: 'balon', grup: FORM_GROUPS[1], ad: 'Balon (balloon)', dogrulanmali: true,
    aciklama: 'Daha kısa, yüksek ve yuvarlak gövde; yüzgeçler gövdeye göre küçük kalır. “Balloon ram” olarak satılır ve yaygın biçimde anılır; ancak ayrıntılı tanımı ve sağlık/üreme sorunları kaynaklarda tutarsızdır, kaynakla doğrulanmalıdır. Şematik yorum.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
