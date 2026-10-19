import type { SpeciesModule } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, VIEWS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { DEF, createViewer } from './viewer';
import { createYanalGroup } from '../akvaryum/yanal-group';

export const species: SpeciesModule = {
  id: 'kardinal',
  ad: 'Kardinal tetra',
  latin: 'Paracheirodon axelrodi',
  kisaAciklama: 'İri gözlü küçük sürü balığı; gözden yağ yüzgecine mavi-yeşil iridofor şerit ve gövdenin TÜM boyunca uzanan kırmızı alt şerit (neondan farkı); 4 şematik renk ve 2 form (standart, uzun yüzgeçli).',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: daha ince ve küçük; mavi şerit daha düz (şematik). Olgun erkekte karın/anal yüzgeçte küçük kancalar anlatılır, modellenmemiştir. Fark zayıftır, gençlerde görülmeyebilir; doğrulanmalı.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: biraz daha büyük, geniş ve dolgun karınlı (şematik). Fark zayıftır, gençlerde görülmeyebilir; doğrulanmalı.' },
  ],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Kırmızı şeridin gövde boyunca uzanması ve mavi şeridin yağ yüzgecine dek sürmesi, benzer görünen neon tetradan ayırmada kullanılır; yaban popülasyonlara göre şerit uzunluğu ve rengi değişebilir. Boyanmış, enjekte edilmiş ya da GloFish gibi floresan balıklar kapsam dışıdır. Ticari renk ve form adları satıcıya göre değişir; “doğrulanmalı” işaretli kayıtlar tutarsız kaynaklara dayanır.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
  createFishGroup: (o) => createYanalGroup(DEF, o),
};
