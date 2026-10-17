// Japon balığı tür modülü: ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'japon',
  ad: 'Japon balığı',
  latin: 'Carassius auratus',
  kisaAciklama: 'Common/comet tipi tek kuyruklu japon balığı: pullar, yan çizgi, uzun sırt yüzgeci; turuncu, sarasa, shubunkin ve daha fazla renk.',
  sexes: [
    { id: 'erkek', ad: 'Erkek (üreme dönemi)', not: 'Erkek: üreme mevsiminde solungaç kapağında ve göğüs yüzgecinde beyaz tüberküller çizilmiştir (şematik). Üreme dışında erkek ve dişi dışarıdan çok benzer; cinsiyet ayrımı güçtür.' },
    { id: 'disi', ad: 'Dişi (üreme dönemi)', not: 'Dişi: üreme döneminde yumurtalı dişinin karnı daha dolgun çizilmiştir (şematik). Üreme dışında erkek ve dişi dışarıdan çok benzer; cinsiyet ayrımı güçtür.' },
  ],
  views: VIEWS,
  not: 'Şematik model: yalnızca common/comet tipi tek kuyruklu gövde gösterilir; oranda, ryukin, telescope gibi süs biçimleri ve çift kuyruklu biçimler dahil değildir. Renk adları kaynağa göre değişir; “kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.',
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  createViewer,
};
