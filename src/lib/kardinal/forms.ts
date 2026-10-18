// Form (şekil) varyeteleri: yalnızca yüzgeç geometrisini değiştirir; gövde aynıdır, her form her renkle birleşir.
// Uzun yüzgeçli (long-finned) hat, tetralar için seçmeli yetiştirme biçimleri arasında sayılır (örn. Seriously Fish tür listesi);
// kardinalde ne kadar yaygın olduğu kaynaklarda net değildir, bu yüzden "doğrulanmalı" işaretlidir.
// "Kısa gövdeli" gibi başka biçimler anlatılsa da tanımı belirsiz olduğundan modellenmemiştir.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORM_GROUPS = ['Doğal biçim', 'Seçmeli hat'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: FORM_GROUPS[0], ad: 'Standart (kısa yüzgeç)', dogrulanmali: false,
    aciklama: 'Doğadaki biçime yakın: yanlardan basık, torpido biçimli gövde (neondan biraz daha derin), kısa saydam yüzgeçler, küçük yağ yüzgeci ve orta derinlikte çatallı kuyruk. Diğer forma kıyas noktasıdır.' },
  { id: 'uzun-yuzgec', grup: FORM_GROUPS[1], ad: 'Uzun yüzgeçli (long-finned)', dogrulanmali: true,
    aciklama: 'Sırt, anal, karın ve kuyruk yüzgeçleri belirgin uzundur ve akıcıdır; gövde ve renk deseni standartla aynıdır. Tetralarda seçmeli bir yetiştirme hattı olarak anlatılır; kardinal tetrada ne kadar yaygın olduğu ve adı kaynakla doğrulanmalıdır. Şematik yorumdur.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
