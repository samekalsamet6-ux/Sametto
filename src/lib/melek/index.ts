import type { SpeciesModule } from '../akvaryum/types';
import { PARTS, VIEWS } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

export const species: SpeciesModule = {
  id: 'melek',
  ad: 'Melek balığı',
  latin: 'Pterophyllum scalare',
  kisaAciklama: 'Yanlardan basık disk gövde, uzun üçgen sırt ve anal yüzgeç, ince karın iplikleri; renk ve desen varyeteleri.',
  // Cinsiyeti dış görünüşten güvenilir ayırt etmek mümkün değildir; tek ve dürüst seçenek.
  sexes: [{ id: 'disi', ad: 'Ayrım yok / belirgin değil',
    not: 'Melek balıklarında erkek ve dişi dışarıdan güvenilir biçimde ayırt edilemez. Baş ya da gövde biçimi, yüzgeç uzunluğu gibi ipuçları bireye göre değişir ve kanıtlanmış değildir; yalnızca üreme döneminde, yumurtlama borusu (dişide daha geniş ve küt, erkekte daha ince ve sivri) fark edilebilir. Bu nedenle model tek biçimlidir.' }],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Evcil melek balıkları çoğunlukla yüzyıllarca seçmeli üretilmiş melezlerdir (Pterophyllum scalare ile yakın türlerin genleri karışmış olabilir); tür kimliği kaynakla doğrulanmalıdır. Uzun yüzgeçli “veil” formları ve gövde şekli farklı seçmeli formlar bu modelin dışındadır.',
  partsFor: () => PARTS,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
};
