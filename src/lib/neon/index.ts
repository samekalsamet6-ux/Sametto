// Neon tetra tür modülü: ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer, buildNeon } from './viewer';
import { createFish3dGroup } from '../akvaryum/fish3d-group';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'neon',
  ad: 'Neon tetra',
  latin: 'Paracheirodon innesi',
  kisaAciklama: 'Parlak mavi-yeşil şeritli, alt yarısı kırmızı küçük sürü balığı; normal, diamond ve gold renkleri; standart, uzun yüzgeçli ve balon formları.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: gövde daha ince, mavi şerit daha düz (şematik). Fark küçüktür; genç bireylerde ayrım zordur.' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: karın daha dolgun, mavi şerit karın bölgesinde aşağı bükülür (şematik). Fark küçüktür; genç bireylerde ayrım zordur.' },
  ],
  views: VIEWS,
  not: 'Şematik model: yalnızca kaynaklarda anlatılan renk (normal, diamond, gold) ve form (standart, uzun yüzgeçli, balon) biçimleri gösterilir. “Kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  forms: FORMS,
  createViewer,
  createFishGroup: (o) => createFish3dGroup('neon', buildNeon, o),
};
