// Form (şekil) varyeteleri: yalnızca yüzgeç ve iplik geometrisini değiştirir; gövde aynıdır, her form her renkle birleşir.
// Not: Altum (Pterophyllum altum) ayrı bir türdür; form olarak gösterilmez.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORM_GROUPS = ['Doğal biçim', 'Seçmeli uzun yüzgeç formları'] as const;

export const FORMS: SpeciesForm[] = [
  { id: 'standart', grup: FORM_GROUPS[0], ad: 'Standart (kısa yüzgeç)',
    aciklama: 'Doğadaki (yabani) biçime yakın: uzun üçgen ama kısa sayılan sırt ve anal yüzgeç, hafif çatallı kuyruk, uzun ince karın iplikleri. Bu sayfadaki diğer formlara kıyas noktasıdır.' },
  { id: 'veil', grup: FORM_GROUPS[1], ad: 'Veil / peçe (uzun yüzgeç)',
    aciklama: 'Uzun, akan sırt, anal ve kuyruk yüzgeçleri; yüzgeçler gövdenin arkasına sarkar. Yaklaşık 1950’lerin sonundan beri bilinen seçmeli bir hattır, tür yine Pterophyllum scalare’dir. Yetişkinlerde belirgindir, yavrularda fark edilmeyebilir. Uzun yüzgeçler yırtılmaya ve başka balıkların ısırmasına daha açıktır.' },
  { id: 'halfmoon', grup: FORM_GROUPS[1], ad: 'Halfmoon (yarım ay)', dogrulanmali: true,
    aciklama: 'Yüzgeçler açıldığında yarım daireye yakın, geniş ve yuvarlak hatlı görünüm (sırt ve anal yüzgeç arası yaklaşık 180°’ye varan yelpaze). Terimin kullanımı tutarsızdır; satıcıların “halfmoon” dediği balıkların çoğu veil genlerini de taşır, genetiği kaynaklarda çelişir. Şematik yorumdur, doğrulanmalıdır.' },
  { id: 'super-veil', grup: FORM_GROUPS[1], ad: 'Süper veil (çok uzun yüzgeç)', dogrulanmali: true,
    aciklama: 'Veil özelliğinin çift dozu olarak anlatılan, daha da uzun ve yumuşak yüzgeçler. Bu formdaki balıklar genellikle daha kırılgan anlatılır; genetik açıklama ve adlandırma kaynakla doğrulanmalıdır.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
