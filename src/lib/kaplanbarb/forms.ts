// Form (şekil) varyeteleri: yalnızca yüzgeç geometrisini değiştirir; gövde aynıdır, her form her renkle birleşir.
// Uzun yüzgeçli (long-fin / veil) kaplan barb ticarette satılan seçmeli bir hattır; adlandırma satıcıya göre değişir.
// Başka (balon gövde, çatallı vb.) tanınmış bir form kaynaklarda bulunamadığı için eklenmemiştir.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORM_GROUPS = ['Doğal biçim', 'Seçmeli hat'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: FORM_GROUPS[0], ad: 'Standart (kısa yüzgeç)',
    aciklama: 'Doğadaki biçime yakın: yüksek sırtlı gövde, üçgenimsi kısa sırt yüzgeci, kısa anal yüzgeç ve orta derinlikte çatallı kuyruk. Bu sayfadaki diğer forma kıyas noktasıdır.' },
  { id: 'uzun-yuzgec', grup: FORM_GROUPS[1], ad: 'Uzun yüzgeçli (long-fin / veil)',
    aciklama: 'Sırt, anal, karın ve kuyruk yüzgeçleri belirgin uzundur; gövde standartla aynıdır. Satıcılarda “longfin” ya da “veil(tail)” adıyla geçen seçmeli bir hattır, tür yine Puntigrus tetrazona’dır; ad ve ayrıntılar satıcıya göre değişebilir. Uzun yüzgeçler başka balıkların ısırmasına açıktır; kaplan barbın kendisi de yüzgeç ısıran bir türdür. Şematik yorumdur.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
