// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) varyeteleri ayrıdır: bkz. forms.ts. Her renk her formla birleşir.
// Ticaret adları standart değildir; bir kısmı satıcıdan satıcıya değişir, bu kayıtlar "dogrulanmali" ile işaretlenmiştir.
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant } from '../akvaryum/yanal-model';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;
export type VariantId = string;

export const VARIANT_GROUPS = ['Bantlı (yabani tipe yakın)', 'Tek renk ve açık tonlar', 'Benekli ve mermer desenler', 'Pul yapısı'] as const;

const GOZ = { iris: '#c2432a', halka: '#2a1010', pupil: '#040404' };
const BAR = '#1b2023';
const bars = (a: number, fin = true): FishVariant['katmanlar'] => [
  { t: 'bar', nx: 0.167, w: 0.05, renk: BAR, a },
  { t: 'bar', nx: 0.36, w: 0.06, renk: BAR, a, fin },
  { t: 'bar', nx: 0.645, w: 0.06, renk: BAR, a, fin, slant: -0.05 },
  { t: 'bar', nx: 0.93, w: 0.04, renk: BAR, a },
];

export const VARIANTS: Variant[] = [
  // ---------------- Bantlı
  { id: 'gumus', grup: VARIANT_GROUPS[0], ad: 'Gümüş (Silver)', dogrulanmali: false,
    aciklama: 'Yabani tipe en yakın görünüm: gümüşi, hafif zeytin sırtlı gövde ve baştan kuyruk köküne dört koyu dikey bant (göz bandı dâhil).',
    govde: { sirt: '#7b8784', orta: '#c4cbcc', karin: '#ebe8df' }, yuzgec: { renk: '#cdd5d6', isin: '#8a9496', a: 0.42 }, iplik: '#e9eef0', goz: GOZ, parlak: 0.5,
    katmanlar: bars(0.82) },
  { id: 'zebra', grup: VARIANT_GROUPS[0], ad: 'Zebra', dogrulanmali: false,
    aciklama: 'Gümüş zemin üzerinde yabani tipten daha çok sayıda, daha ince koyu dikey bant; bantlar yüzgeçlere de uzanır. Bant sayısı bireye göre değişir.',
    govde: { sirt: '#7f8b88', orta: '#c8cfd0', karin: '#ece9e0' }, yuzgec: { renk: '#cdd5d6', isin: '#8a9496', a: 0.42 }, iplik: '#e9eef0', goz: GOZ, parlak: 0.5,
    katmanlar: [0.13, 0.24, 0.35, 0.46, 0.57, 0.68, 0.79, 0.91].map((nx, i) => ({ t: 'bar' as const, nx, w: 0.028, renk: BAR, a: 0.82, fin: i > 0 && i < 7, slant: i > 3 && i < 7 ? -0.05 : 0 })) },
  { id: 'mavi', grup: VARIANT_GROUPS[0], ad: 'Mavi (Blue)', dogrulanmali: true,
    aciklama: 'Gümüş gövdede mavimsi metalik yansıma ve silik bantlar. Ticarette “blue” adı farklı mavi–gri tonlar için kullanılır; adlandırma tutarlı değildir.',
    govde: { sirt: '#5d7da0', orta: '#9fb8d2', karin: '#dde6ee' }, yuzgec: { renk: '#a9bdd6', isin: '#5f7799', a: 0.45 }, iplik: '#dfe8f2', goz: GOZ, parlak: 0.8,
    katmanlar: bars(0.42) },
  { id: 'dumanli', grup: VARIANT_GROUPS[0], ad: 'Dumanlı (Smokey)', dogrulanmali: false,
    aciklama: 'Ön yarı gümüş–açık, arka yarı dumanlı koyu gri/siyah. Koyu pigment ön tarafa kadar yayılmaz; sırt yüzgecinin ortasından başlayarak arkaya doğru koyulaşır. Koyuluk bireyde değişir.',
    govde: { sirt: '#808b88', orta: '#c4cbcc', karin: '#ebe8df' }, yuzgec: { renk: '#cdd5d6', isin: '#7e888a', a: 0.42 }, iplik: '#e9eef0', goz: GOZ, parlak: 0.5,
    katmanlar: [{ t: 'bar', nx: 0.167, w: 0.05, renk: BAR, a: 0.6 }, { t: 'bar', nx: 0.86, w: 0.34, renk: '#16191b', a: 0.9, fin: true, soft: 0.48 }] },

  // ---------------- Tek renk
  { id: 'siyah', grup: VARIANT_GROUPS[1], ad: 'Siyah (Black)', dogrulanmali: false,
    aciklama: 'Melanizm sonucu gövde ve yüzgeçler koyu siyaha yakındır; bantlar seçilmez. Siyah renk yaşa, ışığa ve beslenmeye göre bir miktar solabilir ya da açılabilir (kaynakla doğrulanmalı).',
    govde: { sirt: '#121416', orta: '#202426', karin: '#2c3033' }, yuzgec: { renk: '#17191b', isin: '#3a3f42', a: 0.7 }, iplik: '#2e3336', goz: { iris: '#b8541f', halka: '#1a0c08', pupil: '#020202' }, parlak: 0.55,
    katmanlar: [] },
  { id: 'altin', grup: VARIANT_GROUPS[1], ad: 'Altın (Gold)', dogrulanmali: false,
    aciklama: 'Koyu bantları olmayan, sarı–altın gövde ve açık yüzgeçler. Altın tonu bireyden bireye değişir.',
    govde: { sirt: '#d8a52f', orta: '#efcb62', karin: '#fbeebd' }, yuzgec: { renk: '#f6e4a0', isin: '#c8a24a', a: 0.42 }, iplik: '#fdf3cf', goz: { iris: '#d83a2a', halka: '#4a1810', pupil: '#050303' }, parlak: 0.5,
    katmanlar: [{ t: 'wash', nx: [0.5, 1], ny: [0, 0.6], renk: '#c88a20', a: 0.2 }] },
  { id: 'platin', grup: VARIANT_GROUPS[1], ad: 'Platin (Platinum)', dogrulanmali: false,
    aciklama: 'Bantsız, parlak beyaz–gümüş (platin) gövde ve açık yüzgeçler; metalik pul parlaklığı öne çıkar. Adlandırma satıcıya göre değişebilir.',
    govde: { sirt: '#cdd3d6', orta: '#eef1f2', karin: '#fbfbfa' }, yuzgec: { renk: '#e4eaec', isin: '#aeb8bc', a: 0.4 }, iplik: '#f6f8f9', goz: GOZ, parlak: 0.95,
    katmanlar: [] },
  { id: 'albino', grup: VARIANT_GROUPS[1], ad: 'Albino', dogrulanmali: false,
    aciklama: 'Koyu pigment (melanin) yoktur: krem–sarımsı gövde, kırmızı/pembe göz. Bantlar silik turuncumsu görünür. Albinolar ışığa daha duyarlı olabilir.',
    govde: { sirt: '#f1d9a8', orta: '#f7e8c9', karin: '#fdf6e8' }, yuzgec: { renk: '#f6e3d6', isin: '#d9a98f', a: 0.4 }, iplik: '#fbeee8', goz: { iris: '#e8353d', halka: '#a02a38', pupil: '#4a0a14' }, parlak: 0.45,
    katmanlar: [{ t: 'bar', nx: 0.167, w: 0.05, renk: '#e0a05c', a: 0.35 }, { t: 'bar', nx: 0.36, w: 0.06, renk: '#e0a05c', a: 0.3, fin: true }, { t: 'bar', nx: 0.645, w: 0.06, renk: '#e0a05c', a: 0.3, fin: true }] },
  { id: 'hayalet', grup: VARIANT_GROUPS[1], ad: 'Hayalet (Ghost)', dogrulanmali: true,
    aciklama: 'Soluk, kremsi–gri gövde ve çok silik bantlar. “Ghost” adı satıcıdan satıcıya farklı soluk formlar için kullanılır; ne olduğu net değildir, doğrulanmalıdır.',
    govde: { sirt: '#a8a79a', orta: '#d4d3c8', karin: '#efeee6' }, yuzgec: { renk: '#dedfd6', isin: '#a3a49a', a: 0.38 }, iplik: '#f1f1ea', goz: GOZ, parlak: 0.35,
    katmanlar: bars(0.2) },
  { id: 'pembe-yanak', grup: VARIANT_GROUPS[1], ad: 'Pembe yanaklı (Blushing)', dogrulanmali: true,
    aciklama: 'Saydamımsı inci–gümüş gövde, solungaç kapağı ve baş çevresinde pembe “allık”. Bu ad, solungaç renginin dışarıdan görünmesinden gelir; adlandırma ve genetik kaynakla doğrulanmalıdır.',
    govde: { sirt: '#d3d6d2', orta: '#eceeea', karin: '#fbf9f6' }, yuzgec: { renk: '#e9eceb', isin: '#b8c0c0', a: 0.34 }, iplik: '#f7f5f3', goz: GOZ, parlak: 0.6,
    katmanlar: [{ t: 'wash', nx: [0.08, 0.42], ny: [0.12, 0.95], renk: '#e8707e', a: 0.55 }] },

  // ---------------- Benekli / mermer
  { id: 'koi', grup: VARIANT_GROUPS[2], ad: 'Koi', dogrulanmali: false,
    aciklama: 'Beyazımsı zemin üzerinde turuncu–kırmızı büyük lekeler ve birkaç siyah benek (koi sazanının renklerine benzetildiği için bu ad verilir). Leke dağılımı her bireyde farklıdır; modeldeki yerleşim şematiktir.',
    govde: { sirt: '#e4e0d6', orta: '#f1eee6', karin: '#faf8f3' }, yuzgec: { renk: '#f2eee6', isin: '#c9c3b6', a: 0.36 }, iplik: '#fbf8f3', goz: GOZ, parlak: 0.55,
    katmanlar: [
      { t: 'blotch', n: 6, r: [0.07, 0.15], renk: '#ee6418', a: 0.93, nx: [0.05, 0.9], ny: [0.1, 0.9], fin: true },
      { t: 'spot', n: 5, r: [0.015, 0.035], renk: '#16181a', a: 0.9, nx: [0.2, 0.9], ny: [0.1, 0.8] },
    ] },
  { id: 'mermer', grup: VARIANT_GROUPS[2], ad: 'Mermer (Marble)', dogrulanmali: false,
    aciklama: 'Açık zemin üzerinde düzensiz, büyük koyu (siyah) lekeler; her bireyin leke düzeni farklıdır. Bazı bireylerde sarı/turuncu tonlar da bulunur; modelde yalnızca siyah–açık leke gösterilmiştir.',
    govde: { sirt: '#b9bab0', orta: '#dcdcd2', karin: '#f1f0e8' }, yuzgec: { renk: '#dcdcd4', isin: '#9a9c94', a: 0.4 }, iplik: '#f1f0e8', goz: GOZ, parlak: 0.45,
    katmanlar: [
      { t: 'blotch', n: 9, r: [0.07, 0.17], renk: '#15181a', a: 0.93, nx: [0.05, 0.95], ny: [0.05, 0.95], fin: true },
      { t: 'bar', nx: 0.167, w: 0.05, renk: BAR, a: 0.3 },
    ] },
  { id: 'altin-mermer', grup: VARIANT_GROUPS[2], ad: 'Altın mermer (Gold marble)', dogrulanmali: true,
    aciklama: 'Altın–sarı zemin üzerinde koyu mermer lekeleri. Ticarette ad ve leke miktarı çok değişir; kaynakla doğrulanmalıdır.',
    govde: { sirt: '#d1a233', orta: '#ebc765', karin: '#f9ebbb' }, yuzgec: { renk: '#f2de98', isin: '#b8903c', a: 0.4 }, iplik: '#fbf0c8', goz: { iris: '#d83a2a', halka: '#4a1810', pupil: '#050303' }, parlak: 0.5,
    katmanlar: [{ t: 'blotch', n: 6, r: [0.05, 0.12], renk: '#1b1a18', a: 0.9, nx: [0.1, 0.95], ny: [0.1, 0.9], fin: true }] },
  { id: 'panda', grup: VARIANT_GROUPS[2], ad: 'Panda', dogrulanmali: true,
    aciklama: 'Beyaz–krem gövde, göz çevresinde ve gövdede birkaç yuvarlak siyah leke (panda benzetmesi). Bu ad farklı satıcılarca farklı leke desenleri için kullanılır; doğrulanmalıdır.',
    govde: { sirt: '#e7e5dc', orta: '#f3f1ea', karin: '#fbfaf6' }, yuzgec: { renk: '#f2f0ea', isin: '#c4c2b8', a: 0.34 }, iplik: '#faf9f5', goz: GOZ, parlak: 0.5,
    katmanlar: [
      { t: 'spot', n: 1, r: [0.085, 0.085], renk: '#141618', a: 0.95, nx: [0.17, 0.17], ny: [0.33, 0.33] },
      { t: 'blotch', n: 2, r: [0.09, 0.13], renk: '#141618', a: 0.95, nx: [0.55, 0.8], ny: [0.1, 0.7], fin: true },
    ] },
  { id: 'siyah-dantel', grup: VARIANT_GROUPS[2], ad: 'Siyah dantel (Black lace)', dogrulanmali: true,
    aciklama: 'Koyu gövdede arka yarıda ve yüzgeçlerde dantel benzeri açık ağ görünümü. Adın tam tarifi kaynaklarda değişir; şematik yorumdur ve doğrulanmalıdır.',
    govde: { sirt: '#161819', orta: '#25292b', karin: '#363b3d' }, yuzgec: { renk: '#3b4043', isin: '#6d7479', a: 0.5 }, iplik: '#424749', goz: { iris: '#b8541f', halka: '#1a0c08', pupil: '#020202' }, parlak: 0.5,
    katmanlar: [{ t: 'cells', renk: '#7a8083', a: 0.5, size: 0.06, nx: [0.3, 0.98], ny: [0.03, 0.97], w: 0.004 }] },

  // ---------------- Pul yapısı
  { id: 'inci-pul', grup: VARIANT_GROUPS[3], ad: 'İnci pullu (Pearlscale)', dogrulanmali: false,
    aciklama: 'Pulları kabarık, boncuk gibi parlayan bir pul mutasyonudur; renk zemini gümüş–altın olabilir. Bu model, aynı standart gövde üzerinde yalnızca kabartma dokusunu gösterir; gerçek bireylerde gövde de biraz dolgun görünür.',
    govde: { sirt: '#bfa965', orta: '#e0d29c', karin: '#f4ecd0' }, yuzgec: { renk: '#ebe2bc', isin: '#b2a26a', a: 0.4 }, iplik: '#f6f0d8', goz: GOZ, parlak: 0.7, inci: true,
    katmanlar: bars(0.3) },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
