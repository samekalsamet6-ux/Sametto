// Corydoras form (şekil) varyeteleri: yalnızca ticarette gerçekten bilinen biçimler. Renk varyetelerinden bağımsızdır.
import type { SpeciesForm } from '../akvaryum/types';

export const FORMS: SpeciesForm[] = [
  { id: 'standart', ad: 'Standart (doğal form)', dogrulanmali: false,
    aciklama: 'Doğal görünüm: yüksek sırtlı, düz karınlı, zırh plakalı gövde; yüzgeçler normal uzunlukta. Şematik yorum; oranlar türe göre değişir.' },
  { id: 'uzun-yuzgec', ad: 'Uzun yüzgeçli (longfin)', dogrulanmali: true,
    aciklama: 'Sırt, kuyruk, anal ve diğer yüzgeçleri uzamış yetiştirme biçimi; C. aeneus için “longfin” biçimi kaynaklarda anılır. Gövde standartla aynıdır, yalnızca yüzgeç uzunlukları şematik olarak büyütülmüştür; uzun yüzgeçler dikenleri ve kuyruğu da kapsayabilir, ayrıntı kaynakla doğrulanmalıdır.' },
  { id: 'balon', ad: 'Balon (balloon)', dogrulanmali: true,
    aciklama: 'Gövdesi kısa, yuvarlak ve şişkin olan yetiştirme biçimi; kaynaklarda “balloon” gövdeli corydoras olarak anılır, bu biçimin omurga ve sağlık sorunlarıyla ilişkilendirildiği anlatılır (kaynakla doğrulanmalı). Bu modelde yalnızca gövde yuvarlaklığı şematik gösterilmiştir.' },
];
