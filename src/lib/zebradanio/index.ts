import type { SpeciesModule } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, VIEWS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { DEF, createViewer } from './viewer';
import { createYanalGroup } from '../akvaryum/yanal-group';

export const species: SpeciesModule = {
  id: 'zebradanio',
  ad: 'Zebra balığı (zebra danio)',
  latin: 'Danio rerio',
  kisaAciklama: 'İnce, mekik biçimli gövde; solungaç kapağından kuyruk yüzgecine uzanan yatay mavi çizgiler, yukarı bakan ağız, iki çift küçük bıyık; 5 şematik renk/desen ve 2 form (standart, uzun yüzgeçli).',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: daha ince ve torpido biçimli; mavi çizgiler arasındaki şeritler altın–sarımsı (şematik). Fark zayıf olabilir, gençlerde görülmeyebilir; doğrulanmalı.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: daha dolgun ve yuvarlak karınlı; karın gümüşi–sarımsı, çizgiler arası daha soluk (şematik). Fark zayıf olabilir, gençlerde görülmeyebilir; doğrulanmalı.' },
  ],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Çizgi sayısı, kalınlığı ve konumu bireye göre değişir. İki çift bıyık (rostral ve maksiller) çok küçüktür ve modelde ince kısa iplikler olarak gösterilmiştir. Karın yüzgeçleri şematik olarak kısa, tek parça gösterilmiştir. GloFish gibi floresan / genetiği değiştirilmiş balıklar kapsam dışıdır. Ticari renk ve form adları satıcıya göre değişir; “doğrulanmalı” işaretli kayıtlar tutarsız kaynaklara dayanır.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
  createFishGroup: (o) => createYanalGroup(DEF, o),
};
