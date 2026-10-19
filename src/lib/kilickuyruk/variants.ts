// Kılıçkuyruk renk varyeteleri (şematik yorumlar). Yalnızca standart gövdede renk/desen farkı olan, yaygın bilinen ticari formlar.
// Hifin, lyretail gibi BİÇİM varyeteleri bilerek dışarıda bırakılmıştır (bkz. forms.ts). Erkek kılıcının rengi yuzgec.kilic ile verilir.
import { variantHelpers, type Variant, type Palette, type KilicPal } from '../livebearer/variants';

export { finColor, hexToRgb, mixRgb, mulberry32, type FinKind, type RGBA, type Variant } from '../livebearer/variants';

export const VARIANT_GROUPS = ['Doğal', 'Düz renk', 'Siyah yüzgeçli ve siyah desenli', 'Alacalı ve özel'] as const;

const GOZ_ALTIN = { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' };
const GOZ_KIRMIZI = { iris: '#d6405a', halka: '#7a1530', pupil: '#4a0a18' };
const P = (erkek: Palette, disi: Palette = erkek) => ({ erkek, disi });
const KILIC = (renk: string, kenar = '#0a0a0a'): KilicPal => ({ renk, kenar, n: 3, rays: 22 });

/* Not: tüm tanımlar şematik yorumdur; ticari adlandırma ve renk tarifleri satıcıya göre değişir. */
export const VARIANTS: Variant[] = [
  { id: 'green', grup: 'Doğal', ad: 'Green (Yeşil / doğal tip)', aciklama: 'Zeytin–yeşil gövde, yan çizgi boyunca kırmızımsı–kahverengi yatay şerit; kılıç sarımsı yeşil, üst ve alt kenarı koyu. Doğal formdur; şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#2d3f22', yan: '#7d9a4a', karin: '#d8e0b4' }), metal: 0.45,
    yuzgec: { taban: '#9bb060', uc: '#dfe6a8', benek: '#2a3520', opaklik: 0.62, kilic: KILIC('#d6d25a') },
    desen: [{ t: 'zemin', renk: '#b8452a', a: 0.7, x: [0.2, 0.97], y: [0.44, 0.56], yum: 0.35 }, { t: 'sira', renk: '#1d2a15', a: 0.4, p: 0.3, x: [0.25, 0.97], r: 3.4 }] },
  { id: 'red', grup: 'Düz renk', ad: 'Red (Kırmızı)', aciklama: 'Düz kırmızı–turuncu gövde ve gövdeyle uyumlu yüzgeçler; kılıç sarımsı turuncu, kenarları koyu. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#d6301e', karin: '#f6bfa6' }), metal: 0.25,
    yuzgec: { taban: '#d8382a', uc: '#f08a6a', benek: '#5a0f0a', opaklik: 0.72, kilic: KILIC('#f2b24a') },
    desen: [{ t: 'blob', x: 0.6, y: 0.62, rx: 300, ry: 80, renk: '#ff6a4a', a: 0.3 }] },
  { id: 'lemon', grup: 'Düz renk', ad: 'Lemon (Limon sarısı)', aciklama: 'Düz limon–sarı gövde ve açık sarı yüzgeçler. Ticari ad ve ton satıcıya göre değişir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#a58a14', yan: '#ecd23a', karin: '#fcf4be' }), metal: 0.3,
    yuzgec: { taban: '#f0d848', uc: '#fbefa0', benek: '#756010', opaklik: 0.68, kilic: KILIC('#f6e064', '#6a5a14') },
    desen: [{ t: 'blob', x: 0.6, y: 0.62, rx: 280, ry: 80, renk: '#fff08a', a: 0.35 }] },
  { id: 'albino', grup: 'Düz renk', ad: 'Albino (kırmızı gözlü)', aciklama: 'Açık turuncu–şeftali gövde, soluk yüzgeçler ve pembe–kırmızı gözler (pigment eksikliği). Şematik yorum.',
    goz: GOZ_KIRMIZI, ...P({ sirt: '#b78a64', yan: '#f0a878', karin: '#fde8d6' }), metal: 0.15,
    yuzgec: { taban: '#f2b28c', uc: '#fde0c8', benek: '#8a4a30', opaklik: 0.6, kilic: KILIC('#f6c890', '#c0805a') },
    desen: [{ t: 'blob', x: 0.55, y: 0.6, rx: 300, ry: 90, renk: '#ffd2b0', a: 0.3 }] },
  { id: 'red-wag', grup: 'Siyah yüzgeçli ve siyah desenli', ad: 'Red Wagtail (Kırmızı, siyah yüzgeçli)', aciklama: 'Parlak kırmızı gövde; sırt, anal ve kuyruk yüzgeçleri siyah (“wagtail”). Erkekte kılıç da koyudur. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#d82a1c', karin: '#f4b49c' }), metal: 0.2,
    yuzgec: { taban: '#06060a', uc: '#25252d', benek: '#000000', opaklik: 0.92, kilic: KILIC('#2a2a30', '#000000') }, cift: { taban: '#c8402e', uc: '#e8907a', opaklik: 0.6 },
    desen: [{ t: 'blob', x: 0.6, y: 0.65, rx: 280, ry: 80, renk: '#ff5a3a', a: 0.28 }] },
  { id: 'tuxedo', grup: 'Siyah yüzgeçli ve siyah desenli', ad: 'Tuxedo (Smokin)', aciklama: 'Gövdenin ön yarısı yeşil–kırmızı, arka–alt kısmı siyah; sırt ve kuyruk yüzgeçleri koyu. Şematik yorum; siyah alanın genişliği bireye göre değişir.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#c8322a', karin: '#f0b09a' }), metal: 0.15, gravid: 0.15,
    yuzgec: { taban: '#0c0c10', uc: '#3a1c1a', benek: '#000000', opaklik: 0.9, kilic: KILIC('#3a2a1a', '#000000') }, cift: { taban: '#b8402e', uc: '#e8907a', opaklik: 0.6 },
    desen: [{ t: 'zemin', renk: '#050507', a: 0.97, x: [0.42, 1], y: [0, 0.62], yum: 0.1 }, { t: 'zemin', renk: '#050507', a: 0.6, x: [0.55, 1], y: [0.55, 1], yum: 0.12 }] },
  { id: 'koi', grup: 'Alacalı ve özel', ad: 'Koi (Kırmızı–beyaz–siyah alaca)', aciklama: 'Beyaz–krem zemin üzerinde turuncu–kırmızı büyük lekeler ve dağınık siyah benekler (japon koisi benzeri). Leke düzeni her bireyde farklıdır; şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#a8a090', yan: '#f0e8dc', karin: '#fffaf0' }), metal: 0.3,
    yuzgec: { taban: '#f4ece0', uc: '#fffaf0', benek: '#6a1a10', opaklik: 0.58, kilic: KILIC('#f0a070', '#c04020') },
    desen: [{ t: 'benek', n: 4, renk: '#e0481e', r: [34, 60], a: 0.9, x: [0.18, 0.95], y: [0.25, 0.85], sert: false }, { t: 'benek', n: 5, renk: '#0a0a0c', r: [8, 16], a: 0.88, x: [0.2, 0.95], sert: true }] },
  { id: 'pineapple', grup: 'Alacalı ve özel', ad: 'Pineapple (Ananas)', aciklama: 'Sarı–altın gövde üzerinde pul kenarlarında koyu “ananas” ağ deseni; yüzgeçler sarımsı. Ticari ad ve desen yoğunluğu satıcıya göre değişir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#7a5a10', yan: '#e6b428', karin: '#fcec9a' }), metal: 0.4,
    yuzgec: { taban: '#eeb830', uc: '#fbe08a', benek: '#3a2808', opaklik: 0.66, desen: { nokta: { esik: 0.66, umin: 0.1, umax: 0.85, guc: 0.7, aEk: 0.15 } }, kilic: KILIC('#f6d060', '#3a2808') },
    desen: [{ t: 'sira', renk: '#2a1c06', a: 0.8, p: 0.85, x: [0.2, 0.97], r: 4.4 }, { t: 'blob', x: 0.6, y: 0.62, rx: 260, ry: 80, renk: '#ffe070', a: 0.3 }] },
  { id: 'neon', grup: 'Alacalı ve özel', ad: 'Neon (Neon mavi–kırmızı)', aciklama: 'Metalik mavi–turkuaz parıltılı kırmızı gövde ve koyu yüzgeçler (“neon wagtail” hatlarında); ışığa göre değişir. Ticari adlandırma tutarsızdır, şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#3a1228', yan: '#d4383c', karin: '#f4b4a8' }), metal: 0.85,
    yuzgec: { taban: '#1a1230', uc: '#4a2a5a', benek: '#000000', opaklik: 0.82, kilic: KILIC('#3a4a8a', '#000000') }, cift: { taban: '#a83450', uc: '#e08aa0', opaklik: 0.6 },
    desen: [{ t: 'sira', renk: '#6ad0ff', a: 0.55, p: 0.32, x: [0.22, 0.97], r: 3.6 }, { t: 'gradyan', renk0: '#d4383c', renk1: '#2a62d0', a: 0.28, x: [0.6, 0.99] }] },
  { id: 'tricolor', grup: 'Alacalı ve özel', ad: 'Tricolor (Üç renkli)', aciklama: 'Kırmızı, sarı ve siyah alanların karıştığı alaca gövde. Ad ve leke düzeni satıcıya göre değişir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#6a2a12', yan: '#e8742a', karin: '#fbd9a4' }), metal: 0.25,
    yuzgec: { taban: '#e8902c', uc: '#fbd890', benek: '#080808', opaklik: 0.7, desen: { nokta: { esik: 0.7, umin: 0.1, umax: 0.9, guc: 0.85, aEk: 0.2 } }, kilic: KILIC('#f0b048', '#0a0a0a') },
    desen: [{ t: 'gradyan', renk0: '#e03a20', renk1: '#f6d03a', a: 0.7, x: [0.2, 0.7] }, { t: 'zemin', renk: '#060608', a: 0.95, x: [0.68, 1], y: [0, 0.62], yum: 0.12 }, { t: 'benek', n: 5, renk: '#0a0a0c', r: [6, 13], a: 0.8, x: [0.25, 0.7], sert: true }] },
];

export const { variantById, groupedVariants } = variantHelpers(VARIANTS, VARIANT_GROUPS);
