// Form (şekil) varyeteleri. Diskus için kaynaklarda adlandırılmış, yaygın biçimde kabul gören ayrı yüzgeç/gövde formu bulunamadı:
// ticarette ayrılan adlar (royal blue, pigeon blood, snakeskin vb.) renk/desen hatlarıdır ve aynı gövdeyi paylaşır.
// Üreticiler “yuvarlak ve yüksek gövde” ile uzun, dolgun yüzgeçleri kalite ölçütü sayar, ama bu ayrı bir form adı değildir.
import type { SpeciesForm } from '../akvaryum/types';

export const FORMS: SpeciesForm[] = [
  { id: 'standart', ad: 'Standart (yuvarlak, yüksek gövde)',
    aciklama: 'Diskus için ayrı adlandırılmış, yaygın biçimde kabul gören bir şekil (form) varyetesi bulunamadı: tüm renk hatları aynı yaklaşık dairesel gövdeyi paylaşır. Üreticiler yuvarlak ve yüksek gövdeyi ve dolgun yüzgeçleri kalite ölçütü sayar; bu ayrı bir form değil, birey/hat farkıdır. Bu yüzden yalnızca standart biçim gösterilir (uzun yüzgeçli “long fin” gibi etiketler yetkili kaynakla doğrulanamadı).' },
];

export const formById = (id: string): SpeciesForm => FORMS.find((f) => f.id === id) ?? FORMS[0];
