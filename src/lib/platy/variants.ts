// Plati renk varyeteleri (şematik yorumlar). Yalnızca standart gövdede renk/desen farkı olan, yaygın bilinen ticari formlar.
// Kılıç/tepe (hifin), balon gibi BİÇİM varyeteleri bilerek dışarıda bırakılmıştır.
import { variantHelpers, type Variant, type Palette } from '../livebearer/variants';

export { finColor, hexToRgb, mixRgb, mulberry32, type FinKind, type RGBA, type Variant } from '../livebearer/variants';

export const VARIANT_GROUPS = ['Düz renk', 'Siyah yüzgeçli ve siyah desenli', 'Alacalı ve geçişli', 'Doğal formlar'] as const;

const GOZ_ALTIN = { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' };
const P = (erkek: Palette, disi: Palette = erkek) => ({ erkek, disi });

/* Not: tüm tanımlar şematik yorumdur; ticari adlandırma ve renk tarifleri satıcıya göre değişir. */
export const VARIANTS: Variant[] = [
  { id: 'red', grup: 'Düz renk', ad: 'Red (Kırmızı)', aciklama: 'Düz kırmızı gövde ve gövdeyle aynı renkte yüzgeçler. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#d32a1e', karin: '#f4b9a2' }), metal: 0.2,
    yuzgec: { taban: '#d8382a', uc: '#f08a6a', benek: '#5a0f0a', opaklik: 0.72 },
    desen: [{ t: 'blob', x: 0.6, y: 0.65, rx: 280, ry: 80, renk: '#ff6a4a', a: 0.3 }] },
  { id: 'gold', grup: 'Düz renk', ad: 'Gold (Altın / sarı)', aciklama: 'Düz sarı–altın gövde; yüzgeçler gövdeyle aynı renkte. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#a77a14', yan: '#efc02e', karin: '#fcefb8' }), metal: 0.3,
    yuzgec: { taban: '#f2c63e', uc: '#fbe48c', benek: '#7a5410', opaklik: 0.7 },
    desen: [{ t: 'blob', x: 0.6, y: 0.62, rx: 260, ry: 80, renk: '#ffe070', a: 0.35 }] },
  { id: 'blue', grup: 'Düz renk', ad: 'Blue (Mavi)', aciklama: 'Mavi–çelik mavisi, metalik parlak gövde; yüzgeçler gövdeyle uyumlu mavimsi. Ticari “mavi” tonu bireye ve ışığa göre değişir; şematik yorum.',
    goz: { iris: '#b4c4d0', halka: '#40505c', pupil: '#020305' }, ...P({ sirt: '#13284a', yan: '#3f78c4', karin: '#bcd3ee' }), metal: 0.7,
    yuzgec: { taban: '#4a82cc', uc: '#9bc0ee', benek: '#0d1c36', opaklik: 0.62 },
    desen: [{ t: 'sira', renk: '#9fd0ff', a: 0.4, p: 0.2, x: [0.25, 0.97], r: 3.4 }] },
  { id: 'red-wag', grup: 'Siyah yüzgeçli ve siyah desenli', ad: 'Red Wag (Kırmızı siyah yüzgeçli)', aciklama: 'Parlak kırmızı gövde; sırt, anal ve kuyruk yüzgeçleri siyah (“wagtail”). Göğüs ve karın yüzgeçleri kırmızımsı. Gövde rengi başka renkte de olabilir; şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#d82a1c', karin: '#f4b49c' }), metal: 0.2,
    yuzgec: { taban: '#06060a', uc: '#25252d', benek: '#000000', opaklik: 0.92 }, cift: { taban: '#c8402e', uc: '#e8907a', opaklik: 0.6 },
    desen: [{ t: 'blob', x: 0.6, y: 0.65, rx: 280, ry: 80, renk: '#ff5a3a', a: 0.28 }] },
  { id: 'tuxedo', grup: 'Siyah yüzgeçli ve siyah desenli', ad: 'Tuxedo (Smokin)', aciklama: 'Gövdenin ön yarısı kırmızı (turuncu ya da sarı da olabilir), arka yarısı siyah; sırt ve kuyruk yüzgeçleri koyu. Şematik yorum.',
    goz: GOZ_ALTIN, ...P({ sirt: '#7a1710', yan: '#d82a1c', karin: '#f4b49c' }), metal: 0.15, gravid: 0.15,
    yuzgec: { taban: '#0c0c10', uc: '#4a1c1a', benek: '#000000', opaklik: 0.9 }, cift: { taban: '#c8402e', uc: '#e8907a', opaklik: 0.6 },
    desen: [{ t: 'zemin', renk: '#050507', a: 0.97, x: [0.5, 1], yum: 0.08 }] },
  { id: 'mickey', grup: 'Siyah yüzgeçli ve siyah desenli', ad: 'Mickey Mouse', aciklama: 'Sarı–turuncu gövde; kuyruk tabanında Mickey Mouse’un başını ve kulaklarını andıran siyah lekeler. Yüzgeçler genellikle gövdeyle aynı renktedir. Şematik yorum; leke düzeni bireye göre değişir.',
    goz: GOZ_ALTIN, ...P({ sirt: '#a55a12', yan: '#f09a24', karin: '#fddca0' }), metal: 0.25,
    yuzgec: { taban: '#f2a232', uc: '#fcd488', benek: '#050505', opaklik: 0.74, desen: { daireler: [{ u: 0.3, s: 0.5, r: 0.2 }, { u: 0.17, s: 0.12, r: 0.11 }, { u: 0.17, s: 0.88, r: 0.11 }] } },
    desen: [{ t: 'blob', x: 0.65, y: 0.6, rx: 260, ry: 80, renk: '#ffc060', a: 0.3 }, { t: 'benek', n: 1, renk: '#050505', r: [15, 16], a: 0.92, x: [0.925, 0.926], y: [0.5, 0.51], sert: true }] },
  { id: 'sunset', grup: 'Alacalı ve geçişli', ad: 'Sunset (Gün batımı)', aciklama: 'Önde kırmızı–turuncudan arkaya doğru sarıya geçen “gün batımı” renkli gövde; yüzgeçler sarı–turuncu. Ticari ad ve renk geçişi satıcıya göre değişir.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#8a3a10', yan: '#ee7a20', karin: '#fde0a8' }), metal: 0.25,
    yuzgec: { taban: '#f2b030', uc: '#fbe08a', benek: '#7a3a08', opaklik: 0.7 },
    desen: [{ t: 'gradyan', renk0: '#e02a1a', renk1: '#ffd24a', a: 0.7, x: [0.22, 0.98] }] },
  { id: 'salt-pepper', grup: 'Alacalı ve geçişli', ad: 'Salt & Pepper (Tuz ve biber)', aciklama: 'Gri–gümüşi zemin üzerinde küçük siyah ve beyaz benek serpintisi. Tam görünüm ticari kaynaklara göre değişir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#3a3c3a', yan: '#a4a79f', karin: '#e6e6de' }), metal: 0.5,
    yuzgec: { taban: '#b8bab2', uc: '#dcddd4', benek: '#0c0c0c', opaklik: 0.6, desen: { nokta: { esik: 0.6, umin: 0.05, umax: 0.9, guc: 0.9, aEk: 0.25 } } },
    desen: [{ t: 'sira', renk: '#0c0c0e', a: 0.85, p: 0.3, x: [0.2, 0.97], r: 3.8 }, { t: 'sira', renk: '#ffffff', a: 0.7, p: 0.16, x: [0.2, 0.97], r: 3.4 }, { t: 'benek', n: 8, renk: '#0c0c0e', r: [4, 8], a: 0.8, x: [0.25, 0.95], sert: true }] },
  { id: 'dogal-maculatus', grup: 'Doğal formlar', ad: 'Doğal form (X. maculatus)', aciklama: 'Zeytin–gri yeşilimsi gövde; kuyruk sapı tabanında küçük koyu leke (“ay”) ve soluk yüzgeçler. Doğadaki form çok değişkendir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#2f3d2c', yan: '#8b9a72', karin: '#dcdcc2' }), metal: 0.35,
    yuzgec: { taban: '#a8b49a', uc: '#ced3c0', benek: '#1c2418', opaklik: 0.55 },
    desen: [{ t: 'sira', renk: '#22301f', a: 0.45, p: 0.35, x: [0.25, 0.97] }, { t: 'benek', n: 1, renk: '#0a0c0a', r: [14, 15], a: 0.9, x: [0.9, 0.91], y: [0.5, 0.52], sert: true }] },
  { id: 'variatus', grup: 'Doğal formlar', ad: 'Variatus (çok renkli)', aciklama: 'X. variatus’a dayanan çok renkli form: mavi–yeşil ön gövde, turuncu–kırmızı arka gövde ve kuyruk, dağınık siyah benekler. Ticari “variatus” formları çok çeşitlidir; şematik yorum.', dogrulanmali: true,
    goz: GOZ_ALTIN, ...P({ sirt: '#1d3a48', yan: '#4fa09a', karin: '#d8ead8' }), metal: 0.5,
    yuzgec: { taban: '#e0562a', uc: '#f6b050', benek: '#0c0c0c', opaklik: 0.72, desen: { nokta: { esik: 0.72, umin: 0.1, umax: 0.9, guc: 0.85, aEk: 0.2 } } },
    cift: { taban: '#e0562a', uc: '#f6b050', opaklik: 0.55 },
    desen: [{ t: 'gradyan', renk0: '#38b0b0', renk1: '#f0552a', a: 0.75, x: [0.35, 0.98] }, { t: 'benek', n: 12, renk: '#0b0b0d', r: [4, 9], a: 0.8, x: [0.3, 0.97], sert: true }] },
];

export const { variantById, groupedVariants } = variantHelpers(VARIANTS, VARIANT_GROUPS);
