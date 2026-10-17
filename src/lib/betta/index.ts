// Betta tür modülü: ortak SpeciesModule sözleşmesini sağlar (3B paket bu dosya içe aktarılınca yüklenir).
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'betta',
  ad: 'Betta',
  latin: 'Betta splendens',
  kisaAciklama: 'Standart (plakat) gövdeli betta: labirent organı, büyük yüzgeçler ve renk varyeteleri.',
  sexes: [
    { id: 'erkek', ad: 'Erkek', not: 'Erkek: yüzgeçler (sırt, anal, kuyruk, karın) belirgin büyük, renkler canlı çizilmiştir (şematik).' },
    { id: 'disi', ad: 'Dişi', not: 'Dişi: yüzgeçler kısa, renkler soluk, gövde daha dolgun; karın altında yumurta borusu noktası ve soluk dikey şeritler çizilmiştir (şematik). Genç bireylerde ayrım zordur.' },
  ],
  views: VIEWS,
  not: 'Şematik model: veiltail/halfmoon/crowntail gibi uzun yüzgeçli biçimler dahil değildir. Varyete adları ticarette standart değildir; “kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  createViewer,
};
