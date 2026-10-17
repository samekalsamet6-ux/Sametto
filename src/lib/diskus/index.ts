import type { SpeciesModule } from '../akvaryum/types';
import { PARTS, VIEWS } from './parts';
import { VARIANTS } from './variants';
import { createViewer } from './viewer';

export const species: SpeciesModule = {
  id: 'diskus',
  ad: 'Diskus',
  latin: 'Symphysodon spp.',
  kisaAciklama: 'Yaklaşık dairesel, yanlardan basık disk gövde, kısa yuvarlak yüzgeçler, iri göz; yabani ve seçmeli renk hatları.',
  // Cinsiyeti dış görünüşten güvenilir ayırt etmek mümkün değildir; tek ve dürüst seçenek.
  sexes: [{ id: 'disi', ad: 'Ayrım yok / belirgin değil',
    not: 'Diskusta erkek ve dişi dışarıdan güvenilir biçimde ayırt edilemez. Baş biçimi, renk ya da yüzgeç gibi ipuçları bireye ve hatta göre değişir, kanıtlanmış değildir; yalnızca üreme döneminde yumurtlama papili (dişide daha geniş ve küt, erkekte daha ince ve sivri) fark edilebilir. Bu nedenle model tek biçimlidir.' }],
  views: VIEWS,
  not: 'Şematik, yorumlanmış bir modeldir; gerçek bir bireyin ölçüsü ya da oranı değildir. Diskus sınıflaması (Symphysodon discus, S. aequifasciatus, S. haraldi vb.) tartışmalıdır ve evcil hatların çoğu melezdir; tür kimliği kaynakla doğrulanmalıdır. Ticaret adları standart değildir.',
  partsFor: () => PARTS,
  parts: PARTS,
  variants: VARIANTS.map((v) => ({ id: v.id, ad: v.ad, aciklama: v.aciklama, grup: v.grup, dogrulanmali: v.dogrulanmali })),
  createViewer,
};
