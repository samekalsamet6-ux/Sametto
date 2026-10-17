// Pleko / Ancistrus tür modülü: ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt (ağız)' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'pleco',
  ad: 'Pleko / Ancistrus (L144)',
  latin: 'Ancistrus sp. (bristlenose; “L144” ticari kod)',
  kisaAciklama: 'Kemikli plakalı, vantuz ağızlı, erkeğinde dallı burun tentakleri olan Ancistrus; L144 limon mavi göz rengi; Normal ve Tül (uzun yüzgeç) şekil formları.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: burun kenarında büyük, dallı bristle’lar; baş biraz geniş çizilmiştir (şematik). Genç bireylerde ayrım güvenilir değildir.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: bristle yok ya da yalnızca birkaç küçük çıkıntı; orta gövde daha dolgun çizilmiştir (şematik). Genç bireylerde ayrım güvenilir değildir.' },
  ],
  views: VIEWS,
  not: 'Şematik model. L144 gibi L-numaraları bilimsel tür adı değil ticari/katalog kodlarıdır; ticarette “L144” diye satılan balığın gerçek L144 ile aynı olduğu belirsizdir (albino Ancistrus sık yanlış etiketlenir). Şekil (form) renkten bağımsızdır: Normal ve Tül (uzun yüzgeç) her renk formuyla birleşir; tül yalnızca yüzgeç boyunu uzatır. “Kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  forms: FORMS,
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  createViewer,
};
