// Betta tür modülü: ortak SpeciesModule sözleşmesini sağlar (3B paket bu dosya içe aktarılınca yüklenir).
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer, buildBetta } from './viewer';
import { createFish3dGroup } from '../akvaryum/fish3d-group';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'betta',
  ad: 'Betta',
  latin: 'Betta splendens',
  kisaAciklama: 'Betta: labirent organı, büyük yüzgeçler, 12 form (plakat, halfmoon, crowntail, fil kulak …) ve renk varyeteleri.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: yüzgeçler (sırt, anal, kuyruk, karın) belirgin büyük, renkler canlı çizilmiştir (şematik).' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: yüzgeçler kısa, renkler soluk, gövde daha dolgun; karın altında yumurta borusu noktası ve soluk dikey şeritler çizilmiştir (şematik). Genç bireylerde ayrım zordur.' },
  ],
  views: VIEWS,
  forms: FORMS,
  not: 'Şematik model: form (yüzgeç/kuyruk şekli) ve renk varyeteleri birbirinden bağımsızdır; delta/super delta/overhalfmoon açıları ve combtail/rosetail tanımları kaynaklarda tutarsızdır. Varyete adları ticarette standart değildir; “kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  createViewer,
  createFishGroup: (o) => createFish3dGroup('betta', buildBetta, o),
};
