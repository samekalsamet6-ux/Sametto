// Molly renk varyeteleri (şematik yorumlar). Yalnızca standart gövdede renk/desen farkı olan, yaygın bilinen formlar.
// Balon, lira kuyruklu (lyretail) ve yelken (sailfin) gibi BİÇİM varyeteleri bilerek dışarıda bırakılmıştır.
import { variantHelpers, type Variant, type Palette } from '../livebearer/variants';

export { finColor, hexToRgb, mixRgb, mulberry32, type FinKind, type RGBA, type Variant } from '../livebearer/variants';

export const VARIANT_GROUPS = ['Doğal ve gümüş', 'Koyu', 'Altın ve turuncu', 'Benekli ve alacalı'] as const;

const GOZ_ALTIN = { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' };
const GOZ_KOYU = { iris: '#6b5230', halka: '#2a1c0c', pupil: '#020202' };
const GOZ_GUMUS = { iris: '#c8ccc4', halka: '#6b6f66', pupil: '#050505' };
// Dişiler genellikle biraz daha soluk çizilir (şematik); erkek paleti esas alınır.
const fem = (p: Palette): Palette => ({ sirt: p.sirt, yan: p.yan, karin: p.karin });

const P = (erkek: Palette, disi: Palette = fem(erkek)) => ({ erkek, disi });

/* Not: tüm tanımlar şematik yorumdur; hobi kaynaklarında adlandırma ve renk tarifleri değişebilir. */
export const VARIANTS: Variant[] = [
  { id: 'dogal', grup: 'Doğal ve gümüş', ad: 'Doğal form (P. sphenops)', aciklama: 'Zeytin–gri yeşil gövde, pul sıraları boyunca dizilen koyu noktalar ve hafif mavi–yeşil yansıma; yüzgeçler sönük. Doğadaki sphenops’a yakın bir yorumdur.',
    goz: GOZ_ALTIN, ...P({ sirt: '#2c3a2f', yan: '#7c9372', karin: '#d9dcc4' }), metal: 0.45,
    yuzgec: { taban: '#9fb0a0', uc: '#c6cfc2', benek: '#1d2a20', opaklik: 0.6, desen: { nokta: { esik: 0.7, umin: 0.1, umax: 0.9, guc: 0.8, aEk: 0.2 } } },
    desen: [{ t: 'sira', renk: '#1e2b21', a: 0.6, p: 0.6, x: [0.25, 0.97] }, { t: 'sira', renk: '#46c2b6', a: 0.5, p: 0.14, x: [0.22, 0.97], r: 4 }] },
  { id: 'silver', grup: 'Doğal ve gümüş', ad: 'Silver (Gümüş)', aciklama: 'Açık gümüşi, parlak gövde; dikkat çeken bir leke ya da koyu desen yok. Yüzgeçler berrak gri–beyaz. Şematik yorum.',
    goz: GOZ_GUMUS, ...P({ sirt: '#58696f', yan: '#bcc8cd', karin: '#f0f4f4' }), metal: 0.85,
    yuzgec: { taban: '#cdd6d8', uc: '#e9eff0', benek: '#4b5a5f', opaklik: 0.5 },
    desen: [{ t: 'sira', renk: '#42525a', a: 0.28, p: 0.3, x: [0.25, 0.97] }] },
  { id: 'black', grup: 'Koyu', ad: 'Black (Siyah / karbon)', aciklama: 'Tamamen koyu (melanin bakımından zengin) gövde ve yüzgeçler; ışıkta hafif mavi–mor parlaklık. Koyu gövdede gravid spot görünmeyebilir.',
    goz: GOZ_KOYU, ...P({ sirt: '#040406', yan: '#0c0d12', karin: '#1b1c24' }), metal: 0.3, gravid: 0.08,
    yuzgec: { taban: '#0a0a0e', uc: '#1c1c26', benek: '#000000', opaklik: 0.85 },
    desen: [{ t: 'blob', x: 0.5, y: 0.55, rx: 330, ry: 70, renk: '#35456a', a: 0.28 }] },
  { id: 'chocolate', grup: 'Koyu', ad: 'Chocolate (Çikolata)', aciklama: 'Siyahtan açık, sıcak kahverengi bir gövde. Ticari adı ve tam tonu satıcıya göre değişir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_KOYU, ...P({ sirt: '#24150c', yan: '#6a4225', karin: '#b58a5c' }), metal: 0.2, gravid: 0.5,
    yuzgec: { taban: '#5a3a22', uc: '#8d6644', benek: '#1d1108', opaklik: 0.78 },
    desen: [{ t: 'sira', renk: '#1b0f08', a: 0.4, p: 0.25, x: [0.25, 0.97] }] },
  { id: 'gold', grup: 'Altın ve turuncu', ad: 'Gold (Altın)', aciklama: 'Düz altın–sarı gövde, sarı yüzgeçler (karotenoid renk). Koyu leke yok. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#a06c10', yan: '#e8b52c', karin: '#fbebb0' }), metal: 0.4,
    yuzgec: { taban: '#eec03c', uc: '#f8e08a', benek: '#7a5410', opaklik: 0.88 },
    desen: [{ t: 'blob', x: 0.65, y: 0.6, rx: 260, ry: 80, renk: '#ffd860', a: 0.35 }] },
  { id: 'gold-dust', grup: 'Altın ve turuncu', ad: 'Gold Dust (Altın tozu)', aciklama: 'Altın zemin üzerinde pullarda serpilmiş siyah benekler (“toz”) ve koyu uçlu yüzgeçler. Şematik yorum; benek miktarı bireyden bireye çok değişir.',
    goz: GOZ_ALTIN, ...P({ sirt: '#76500e', yan: '#d9a526', karin: '#f6e3a0' }), metal: 0.4,
    yuzgec: { taban: '#e2b232', uc: '#f3d680', benek: '#1a1308', opaklik: 0.88, desen: { nokta: { esik: 0.58, umin: 0.1, umax: 0.95, guc: 0.9, aEk: 0.25 } } },
    desen: [{ t: 'sira', renk: '#15100a', a: 0.9, p: 0.34, x: [0.22, 0.97], r: 4 }, { t: 'benek', n: 10, renk: '#15100a', r: [5, 11], a: 0.8, x: [0.25, 0.95], sert: true }] },
  { id: 'orange', grup: 'Altın ve turuncu', ad: 'Orange (Turuncu)', aciklama: 'Canlı turuncu gövde ve turuncu–sarımsı yüzgeçler (karotenoid renk); karında daha açık. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#a63e0e', yan: '#ee7a20', karin: '#ffd8a0' }), metal: 0.25,
    yuzgec: { taban: '#f28a2c', uc: '#ffc47a', benek: '#8a3008', opaklik: 0.9 },
    desen: [{ t: 'blob', x: 0.6, y: 0.6, rx: 280, ry: 80, renk: '#ffa040', a: 0.35 }] },
  { id: 'dalmatian', grup: 'Benekli ve alacalı', ad: 'Dalmatian (Dalmaçyalı)', aciklama: 'Açık gümüş–beyaz zemin üzerinde dağınık, iri ve düzensiz siyah benekler; yüzgeçlerde de benek bulunur. Şematik yorum; benek sayısı ve dağılımı bireye göre değişir.',
    goz: GOZ_GUMUS, ...P({ sirt: '#60666b', yan: '#d4d7d8', karin: '#f3f3f0' }), metal: 0.55,
    yuzgec: { taban: '#d9dcdc', uc: '#eeeeea', benek: '#101010', opaklik: 0.62, desen: { nokta: { esik: 0.6, umin: 0.05, umax: 0.95, guc: 0.95, aEk: 0.3 } } },
    desen: [{ t: 'benek', n: 34, renk: '#0b0b0d', r: [9, 24], a: 0.93, x: [0.2, 0.97], y: [0.04, 0.97] }] },
  { id: 'marble', grup: 'Benekli ve alacalı', ad: 'Marble (Mermer)', aciklama: 'Beyaz–krem zemin üzerinde büyük, düzensiz siyah ve yer yer turuncu “mermer” lekeler. Desen her bireyde farklıdır; şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#2e2f33', yan: '#cdc8bc', karin: '#f1ede2' }), metal: 0.3,
    yuzgec: { taban: '#cfc9bb', uc: '#ece7da', benek: '#141414', opaklik: 0.62, desen: { nokta: { esik: 0.65, umin: 0.05, umax: 0.9, guc: 0.9, aEk: 0.25 } } },
    desen: [
      { t: 'benek', n: 10, renk: '#e0792a', r: [18, 34], a: 0.6, x: [0.22, 0.97], y: [0.1, 0.9] },
      { t: 'benek', n: 11, renk: '#0b0b0d', r: [24, 46], uzun: 1.5, a: 0.86, x: [0.2, 0.97], y: [0.05, 0.98] },
    ] },
];

export const { variantById, groupedVariants } = variantHelpers(VARIANTS, VARIANT_GROUPS);
