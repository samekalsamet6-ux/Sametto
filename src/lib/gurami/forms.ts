// Form (şekil) varyeteleri. Cüce gurami için kaynaklarda adlandırılmış, yaygın biçimde kabul gören ayrı bir şekil (form)
// varyetesi bulunamadı: ticarette ayrılan adlar (neon mavi, toz mavi, kobalt, alev, gün batımı ...) renk hatlarıdır ve aynı
// gövde ile yüzgeçleri paylaşır. Uzun yüzgeçli ya da balon gövdeli bir hat anlatan güvenilir kaynak bulunamadığı için uydurulmamıştır.
import type { SpeciesForm } from '../akvaryum/types';
import { DEFAULT_FORM, FORM_IDS } from './model';

export const FORMS: SpeciesForm[] = [
  { id: 'standart', ad: 'Standart (tek biçim)',
    aciklama: 'Cüce gurami için ayrı adlandırılmış, yaygın biçimde kabul gören bir şekil (form) varyetesi bulunamadı: tüm renk hatları aynı oval, yanlardan basık gövdeyi ve yuvarlak kuyruğu paylaşır. Gerçek fark erkek ile dişi arasındadır (erkekte sivri sırt yüzgeci); bu fark Cinsiyet seçicisinde gösterilir. Uzun yüzgeçli ya da balon gövdeli bir hat kaynaklarda doğrulanamadığı için eklenmemiştir.' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
export { DEFAULT_FORM, FORM_IDS };
