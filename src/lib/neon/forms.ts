// Neon tetra form (şekil) varyeteleri: yalnızca ticarette gerçekten bilinen biçimler. Renk varyetelerinden bağımsızdır.
import type { SpeciesForm } from '../akvaryum/types';

export const FORMS: SpeciesForm[] = [
  { id: 'standart', ad: 'Standart (doğal form)', dogrulanmali: false,
    aciklama: 'Doğal görünüm: ince, torpido biçimli gövde; küçük, saydam, kısa yüzgeçler ve çatallı kuyruk. Şematik yorum; oranlar gerçek bir bireyin ölçüsü değildir.' },
  { id: 'uzun-yuzgec', ad: 'Uzun yüzgeçli (longfin)', dogrulanmali: true,
    aciklama: 'Sırt, anal, kuyruk ve karın yüzgeçleri uzamış yetiştirme biçimi; bazı kaynaklarda “longfin/veiltail” adlarıyla anılır, adlandırma ve ayrıntı kaynağa göre değişir. Gövde standartla aynıdır; yalnızca yüzgeç uzunlukları şematik olarak büyütülmüştür.' },
  { id: 'balon', ad: 'Balon (ballon)', dogrulanmali: true,
    aciklama: 'Gövdesi, özellikle karın bölgesi, yuvarlak ve şişkin olan yetiştirme biçimi; omurga eğriliği gibi iç yapı değişiklikleri ve olası sağlık/yüzme sorunları anlatılır (kaynakla doğrulanmalı). Bu modelde yalnızca gövde yuvarlaklığı şematik olarak gösterilmiştir; omurga eğriliği modellenmemiştir.' },
];
