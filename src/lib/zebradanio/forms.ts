// Form (şekil) varyeteleri: yalnızca yüzgeç geometrisini değiştirir; gövde aynıdır, her form her renkle birleşir.
// Uzun yüzgeçli (long-fin) zebra danio ticarette yaygın, kalıtsal bir hattır; "veil" adıyla da anılır, adlandırma satıcıya göre değişir.
// Başka (balon gövde, çatallı vb.) tanınmış bir form kaynaklarda bulunamadığı için eklenmemiştir.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORM_GROUPS = ['Doğal biçim', 'Seçmeli hat'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: FORM_GROUPS[0], ad: 'Standart (kısa yüzgeç)',
    aciklama: 'Doğadaki biçime yakın: ince, mekik biçimli gövde, gövdenin arka yarısına yerleşmiş küçük sırt yüzgeci, uzun tabanlı anal yüzgeç ve orta derinlikte çatallı kuyruk. Diğer forma kıyas noktasıdır.' },
  { id: 'uzun-yuzgec', grup: FORM_GROUPS[1], ad: 'Uzun yüzgeçli (long-fin / veil)',
    aciklama: 'Sırt, anal, karın ve kuyruk yüzgeçleri belirgin uzundur ve akıcıdır; gövde ve çizgi deseni standartla aynıdır. Zebra danioda hem normal çizgili hem altın renkte uzun yüzgeçli hatlar satılır; adı satıcıya göre değişebilir (“longfin”, “veil”). Şematik yorumdur; uzun yüzgeçler başka balıkların ısırmasına açıktır.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
