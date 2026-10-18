// Corydoras tür modülü: ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer, buildCorydoras } from './viewer';
import { createFish3dGroup } from '../akvaryum/fish3d-group';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'corydoras',
  ad: 'Corydoras',
  latin: 'Corydoras aeneus / C. paleatus tipi',
  kisaAciklama: 'Zırh plakalı, bıyıklı, dikenli küçük dip kedibalığı; bronz, albino, benekli ve sterbai tipi renkler; standart, uzun yüzgeçli ve balon formları.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: gövde dişiden daha ince ve küçük çizilmiştir (şematik). Üstten bakınca fark daha belirgindir; genç bireylerde ayrım güvenilir değildir.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: gövde daha geniş ve dolgun çizilmiştir (şematik); üstten bakınca fark daha belirgindir. Genç bireylerde ayrım güvenilir değildir.' },
  ],
  views: VIEWS,
  not: 'Şematik model: C. aeneus/C. paleatus tipi gövde varsayılmıştır; Corydoras cinsi çok sayıda türden oluşur ve gövde biçimleri ayrışır. Tür kimliği kaynakla doğrulanmalıdır; “kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  forms: FORMS,
  createViewer,
  createFishGroup: (o) => createFish3dGroup('corydoras', buildCorydoras, o),
};
