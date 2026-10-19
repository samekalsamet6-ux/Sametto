// Japon balığı tür modülü: ortak SpeciesModule sözleşmesini sağlar.
import type { SpeciesModule, SpeciesView } from '../akvaryum/types';
import { FORMS } from './forms';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { createViewer, buildJapon } from './viewer';
import { createFish3dGroup } from '../akvaryum/fish3d-group';

export const VIEWS: SpeciesView[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'alt', ad: 'Alt' }, { id: 'on', ad: 'Ön' }, { id: 'arka', ad: 'Arka' }, { id: 'capraz', ad: 'Çapraz' },
];

export const species: SpeciesModule = {
  id: 'japon',
  ad: 'Japon balığı',
  latin: 'Carassius auratus',
  kisaAciklama: 'Japon balığı: common, comet, fantail, ryukin, oranda, lionhead, telescope, bubble eye ve pearlscale formları; turuncu, sarasa, shubunkin ve daha fazla renk.',
  sexes: [
    { id: 'erkek', ad: 'Erkek (üreme dönemi)', not: 'Erkek: üreme mevsiminde solungaç kapağında ve göğüs yüzgecinde beyaz tüberküller çizilmiştir (şematik). Üreme dışında erkek ve dişi dışarıdan çok benzer; cinsiyet ayrımı güçtür.' },
    { id: 'disi', ad: 'Dişi (üreme dönemi)', not: 'Dişi: üreme döneminde yumurtalı dişinin karnı daha dolgun çizilmiştir (şematik). Üreme dışında erkek ve dişi dışarıdan çok benzer; cinsiyet ayrımı güçtür.' },
  ],
  views: VIEWS,
  not: `Şematik model: ${FORMS.length} form (${FORMS.map((f) => f.ad).join(', ')}) gerçek ırk standartları değil, şematik yorumdur; tosakin, jikin gibi diğer biçimler modellenmemiştir. Renk adları kaynağa göre değişir; “kaynakla doğrulanmalı” işaretli kayıtlar belirsizdir.`,
  partsFor,
  parts: PARTS,
  variants: VARIANTS,
  forms: FORMS,
  createViewer,
  createFishGroup: (o) => createFish3dGroup('japon', buildJapon, o),
};
