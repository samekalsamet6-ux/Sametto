// Pleko (Ancistrus / bristlenose) renk formları ve tül (uzun yüzgeç) biçimleri (şematik yorumlar; saf veri).
// ÖNEMLİ: "L144" gibi L-numaraları ticari/kataloglama kodlarıdır; ticarette "L144" diye satılan balık çoğunlukla seçilimle üretilmiş
// limon renkli Ancistrus'tur ve gerçek L144 ile aynı olmayabilir (kaynaklara göre belirsiz). Renk formları şekilden (normal/tül) bağımsızdır.
import type { FinStyle } from '../akvaryum/fishtex';
import { hexToRgb, mulberry32, seedOf } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32 };
export type VariantId = string;
export type Desen = 'benekli' | 'duz' | 'calico';

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  body: { sirt: string; yan: string; karin: string; bas: string };
  desen: Desen;
  /** Benek rengi, sıklık (0..1) ve boyut çarpanı */
  benek: { renk: string; yogunluk: number; boyut: number };
  /** Calico yamaları (koyu / turuncu / beyaz) */
  yamalar: string[];
  eye: { ball: string; iris: string; pupil: string };
  fin: FinStyle;
  gogus: FinStyle;
  /** Plaka çizgileri/kabartma 0..1 */
  zirh: number;
}

export const VARIANT_GROUPS = ['L144 / limon mavi göz', 'Diğer renk formları'] as const;

const rays = (c: string, a = 0.4, n = 20) => ({ n, color: c, alpha: a });
const EYE_D = { ball: '#15110c', iris: '#7a5a28', pupil: '#000000' };
const EYE_BLUE = { ball: '#a9c8e6', iris: '#82b2dc', pupil: '#05080c' };
const EYE_PINK = { ball: '#e4aeb2', iris: '#d84a5a', pupil: '#3a0a14' };

type Base = Omit<Variant, 'grup' | 'id' | 'ad' | 'aciklama' | 'dogrulanmali'>;

const COMMON: Base = {
  body: { sirt: '#2a2418', yan: '#4a3d27', karin: '#a39578', bas: '#3b3120' }, desen: 'benekli', benek: { renk: '#cdbf8f', yogunluk: 0.9, boyut: 1 }, yamalar: [],
  eye: EYE_D,
  fin: { stops: [[0, '#3c3322', 0.92], [1, '#4f4430', 0.75]], rays: rays('#1d170d', 0.5), speckle: { n: 34, color: '#cdbf8f', alpha: 0.75, r: [0.01, 0.024], seed: 3 }, edge: { color: '#e5dcb8', alpha: 0.85 } },
  gogus: { stops: [[0, '#3c3322', 0.9], [1, '#554a33', 0.7]], rays: rays('#1d170d', 0.5), speckle: { n: 20, color: '#cdbf8f', alpha: 0.7, r: [0.01, 0.022], seed: 5 }, edge: { color: '#d8cfaa', alpha: 0.7 } },
  zirh: 0.9,
};
const ALBINO: Base = {
  body: { sirt: '#e8d19a', yan: '#f1e0b4', karin: '#f8eed4', bas: '#ecd9a6' }, desen: 'duz', benek: { renk: '#fbf3da', yogunluk: 0.35, boyut: 0.8 }, yamalar: [],
  eye: EYE_PINK,
  fin: { stops: [[0, '#f0e0b0', 0.86], [1, '#f7edcc', 0.5]], rays: rays('#c9b27a', 0.5), edge: { color: '#ffffff', alpha: 0.7 } },
  gogus: { stops: [[0, '#f0e0b0', 0.8], [1, '#f7edcc', 0.45]], rays: rays('#c9b27a', 0.45), edge: { color: '#ffffff', alpha: 0.6 } },
  zirh: 0.55,
};
const LEMON: Base = {
  body: { sirt: '#e8b52c', yan: '#f2cb48', karin: '#f8e79c', bas: '#eec138' }, desen: 'duz', benek: { renk: '#fff4b8', yogunluk: 0.3, boyut: 0.8 }, yamalar: [],
  eye: EYE_BLUE,
  fin: { stops: [[0, '#f0c540', 0.9], [0.8, '#f6dc7a', 0.6], [1, '#fbf0b8', 0.45]], rays: rays('#c28f10', 0.5), edge: { color: '#ffffff', alpha: 0.85 } },
  gogus: { stops: [[0, '#f0c540', 0.85], [1, '#fbf0b8', 0.45]], rays: rays('#c28f10', 0.45), edge: { color: '#ffffff', alpha: 0.75 } },
  zirh: 0.6,
};
const RED: Base = {
  body: { sirt: '#8e2a12', yan: '#c4461c', karin: '#e8a47c', bas: '#a8341a' }, desen: 'duz', benek: { renk: '#f09a6a', yogunluk: 0.35, boyut: 0.9 }, yamalar: [],
  eye: { ball: '#1a0d08', iris: '#a05a2a', pupil: '#000000' },
  fin: { stops: [[0, '#b83c18', 0.92], [1, '#e07a48', 0.7]], rays: rays('#6a1a08', 0.5), edge: { color: '#fbd8b8', alpha: 0.8 } },
  gogus: { stops: [[0, '#b83c18', 0.88], [1, '#e07a48', 0.6]], rays: rays('#6a1a08', 0.45), edge: { color: '#fbd8b8', alpha: 0.7 } },
  zirh: 0.7,
};
const CALICO: Base = {
  body: { sirt: '#d9d0bc', yan: '#e9e1cf', karin: '#f3ede0', bas: '#ddd3be' }, desen: 'calico', benek: { renk: '#2a241c', yogunluk: 0.45, boyut: 1.1 }, yamalar: ['#1c1814', '#e0a35a', '#f7f2e6'],
  eye: EYE_D,
  fin: { stops: [[0, '#d8cdb4', 0.8], [1, '#ebe3d0', 0.55]], rays: rays('#4a4030', 0.5), speckle: { n: 26, color: '#2a241c', alpha: 0.7, r: [0.014, 0.034], seed: 11 }, edge: { color: '#ffffff', alpha: 0.7 } },
  gogus: { stops: [[0, '#d8cdb4', 0.78], [1, '#ebe3d0', 0.5]], rays: rays('#4a4030', 0.45), speckle: { n: 14, color: '#2a241c', alpha: 0.6, r: [0.014, 0.03], seed: 13 }, edge: { color: '#ffffff', alpha: 0.65 } },
  zirh: 0.8,
};
const RED_CALICO: Base = {
  body: { sirt: '#7a2410', yan: '#c05a28', karin: '#ecc7a0', bas: '#9a3418' }, desen: 'calico', benek: { renk: '#241410', yogunluk: 0.4, boyut: 1.1 }, yamalar: ['#1c110c', '#d85a24', '#f6e8d6'],
  eye: { ball: '#1a0d08', iris: '#9a5a2a', pupil: '#000000' },
  fin: { stops: [[0, '#c4501e', 0.9], [1, '#e89868', 0.62]], rays: rays('#5a1808', 0.5), speckle: { n: 24, color: '#241410', alpha: 0.7, r: [0.014, 0.032], seed: 17 }, edge: { color: '#fbe4cc', alpha: 0.75 } },
  gogus: { stops: [[0, '#c4501e', 0.86], [1, '#e89868', 0.55]], rays: rays('#5a1808', 0.45), speckle: { n: 12, color: '#241410', alpha: 0.6, r: [0.014, 0.03], seed: 19 }, edge: { color: '#fbe4cc', alpha: 0.65 } },
  zirh: 0.75,
};
const SNOW: Base = {
  body: { sirt: '#d9dadc', yan: '#f1f2f2', karin: '#fbfbfb', bas: '#e6e7e8' }, desen: 'duz', benek: { renk: '#9aa0a6', yogunluk: 0.35, boyut: 0.7 }, yamalar: [],
  eye: { ball: '#14110e', iris: '#4a3a24', pupil: '#000000' },
  fin: { stops: [[0, '#e8eaeb', 0.78], [1, '#f6f7f7', 0.5]], rays: rays('#9a9fa4', 0.45), edge: { color: '#ffffff', alpha: 0.8 } },
  gogus: { stops: [[0, '#e8eaeb', 0.74], [1, '#f6f7f7', 0.45]], rays: rays('#9a9fa4', 0.4), edge: { color: '#ffffff', alpha: 0.7 } },
  zirh: 0.5,
};

interface Row { id: string; grup: number; ad: string; aciklama: string; dogrulanmali: boolean; base: Base }

const ROWS: Row[] = [
  { id: 'limon-mavi-goz', grup: 0, ad: 'L144 “Limon mavi göz”', dogrulanmali: true, base: LEMON,
    aciklama: 'Limon sarısı gövde, soluk mavi gözler, beyaz kenarlı yüzgeçler. Ticarette “L144 / Blue Eye Lemon Bristlenose” diye satılan, seçilimle üretilmiş bir Ancistrus formu olarak anlatılır; “L144” bir ticari/katalog kodudur ve ticaretteki balığın gerçek L144 ile aynı olduğu belirsizdir. Kırmızı gözlüyse albino ortak formdur. Uzun yüzgeçli (tül) hâli ayrı bir şekil (form) olarak seçilir. Şematik yorum; renk bireyden bireye değişir (kaynakla doğrulanmalı).' },
  { id: 'ortak', grup: 1, ad: 'Ortak / yabani tip (kahverengi, benekli)', dogrulanmali: false, base: COMMON,
    aciklama: 'Koyu kahverengi-zeytin zemin üzerinde krem-sarımsı küçük benekler; yüzgeçlerde benek sıraları ve açık kenar. Doğal Ancistrus görünümüne dayanan şematik yorum; benek yoğunluğu ve ton türe, yaşa ve bireye göre çok değişir.' },
  { id: 'albino', grup: 1, ad: 'Albino (pembe gözlü)', dogrulanmali: false, base: ALBINO,
    aciklama: 'Soluk sarımsı-beyaz gövde, pembe-kırmızı gözler. Hobi dünyasında erken yerleşmiş renk formlarından biridir; ışığa duyarlı olabilir. Albino Ancistrus sık sık “L144” olarak yanlış etiketlenir; gözü pembe-kırmızıysa albino, mavi/siyahsa limon formdur. Şematik yorum.' },
  { id: 'super-kirmizi', grup: 1, ad: 'Süper kırmızı', dogrulanmali: true, base: RED,
    aciklama: 'Turuncu-kırmızı gövde ve yüzgeçler, koyu gözler. Seçilimle üretilmiş ticari bir renk formu olarak anlatılır; adı ve renk derinliği satıcıya göre değişir ve kaynakla doğrulanmalıdır. Şematik yorum.' },
  { id: 'calico', grup: 1, ad: 'Calico (alacalı)', dogrulanmali: true, base: CALICO,
    aciklama: 'Krem-beyaz zemin üzerinde siyah ve turuncumsu düzensiz yamalar. “Calico” ve “marble” adlarının aynı şeyi anlatıp anlatmadığı hobi kaynaklarında tartışmalıdır; yama düzeni bireyden bireye değişir. Şematik yorum (kaynakla doğrulanmalı).' },
  { id: 'kirmizi-calico', grup: 1, ad: 'Süper kırmızı calico (kırmızı mermer)', dogrulanmali: true, base: RED_CALICO,
    aciklama: 'Koyu kırmızı-turuncu zemin üzerinde siyah ve krem yamalar; satıcılar “süper kırmızı ile calico” karışımı olarak tarif eder. Ticari ad kaynakla doğrulanmalı; yama düzeni bireyden bireye değişir. Şematik yorum.' },
  { id: 'kar-topu', grup: 1, ad: 'Kar topu / beyaz (snowball)', dogrulanmali: true, base: SNOW,
    aciklama: 'Neredeyse beyaz gövde, koyu gözler. “Snowball / beyaz” adı ve albinodan farkı kaynaklarda net değildir; görünüm şematik bir yorumdur ve kaynakla doğrulanmalıdır.' },
];

export const VARIANTS: Variant[] = ROWS.map((r) => ({
  id: r.id, grup: VARIANT_GROUPS[r.grup], ad: r.ad, aciklama: r.aciklama, dogrulanmali: r.dogrulanmali, ...r.base,
}));

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}
export const seedFor = (v: Variant, sex: SexId): number => seedOf(`${v.id}:${sex}`);
