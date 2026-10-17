// Neocaridina davidi renk varyeteleri (şematik yorumlar; saf veri). Hepsi aynı standart gövdeyi paylaşır, yalnızca renk/desen değişir.
// Ticaret adları satıcıdan satıcıya değişir ve sınıflama resmî değildir; belirsiz olanlar dogrulanmali ile işaretlidir.
// Caridina cinsi (ör. Crystal Red, Pure Red Line, Taiwan Bee) bu listeye ALINMAMIŞTIR; Neocaridina değildir.
import type { Sex } from './model';

export type VariantId = string;
export type Rgb = [number, number, number];

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  /** Adlandırma/varlık belirsiz mi */
  dogrulanmali: boolean;
  /** Sırt, yan, karın ve bacak/uzuv tonları */
  renk: { sirt: string; yan: string; karin: string; bacak: string };
  goz: string;
  stil: 'duz' | 'yabani' | 'rili';
  /** Sırt ortasında açık/koyu çizgi (ör. Golden back) */
  serit?: string;
  /** Küçük koyu/açık pigment noktaları: renk ve yoğunluk (0..1) */
  benek?: { renk: string; yogunluk: number };
  /** Düzensiz renk lekeleri / saydam bölgeler (düşük sınıf Red Cherry): 0..1 */
  lekeli?: number;
  /** Rili: saydam kalan karın halkaları (0..5) ve saydam ton */
  rili?: { acik: number[]; ton: string };
  /** 0 mat .. 1 parlak */
  parlak: number;
  /** Yumurta (berry) rengi */
  yumurta?: string;
}

export const VARIANT_GROUPS = ['Doğal tip', 'Kırmızı hat', 'Sarı ve turuncu', 'Mavi ve yeşil', 'Koyu ve beyaz', 'Rili (saydam + renk lekeli)'] as const;

export const VARIANTS: Variant[] = [
  { id: 'dogal', grup: VARIANT_GROUPS[0], ad: 'Doğal / yabani tip (kahve-yeşil)', dogrulanmali: false,
    renk: { sirt: '#5f5232', yan: '#82764c', karin: '#b6ad88', bacak: '#c8c4a4' }, goz: '#17110b', stil: 'yabani', benek: { renk: '#2a2415', yogunluk: 0.7 }, parlak: 0.35,
    aciklama: 'Doğadaki N. davidi’nin yeşilimsi-kahverengi, benekli ve yarı saydam görünümü; şematik. Diğer renk hatları bu tipten seçilerek ortaya çıkmıştır; renk hatları karışırsa yavrular bu tipe doğru geri dönebilir.' },

  { id: 'red-cherry', grup: VARIANT_GROUPS[1], ad: 'Red Cherry (düşük/orta sınıf, lekeli)', dogrulanmali: false,
    renk: { sirt: '#b53a2c', yan: '#c85641', karin: '#e0a18d', bacak: '#e6cbbd' }, goz: '#1a0d0b', stil: 'duz', lekeli: 0.55, parlak: 0.45,
    aciklama: 'Kırmızının düzensiz dağıldığı, saydam bölgelerin göründüğü giriş sınıfı Red Cherry; şematik. Sınıf adlandırması (ör. Cherry, Sakura, Fire Red, Painted Fire Red) satıcıya göre değişir.' },
  { id: 'sakura', grup: VARIANT_GROUPS[1], ad: 'Sakura (daha homojen kırmızı)', dogrulanmali: false,
    renk: { sirt: '#c4231f', yan: '#d23a2d', karin: '#e58c7e', bacak: '#e9ab9f' }, goz: '#1a0c0b', stil: 'duz', lekeli: 0.15, parlak: 0.5,
    aciklama: 'Kırmızının daha tam ve eşit yayıldığı sınıf; saydam alan azdır. Şematik.' },
  { id: 'fire-red', grup: VARIANT_GROUPS[1], ad: 'Fire Red (koyu, opak kırmızı)', dogrulanmali: false,
    renk: { sirt: '#a00a0c', yan: '#bf1315', karin: '#d84a40', bacak: '#d98c84' }, goz: '#150808', stil: 'duz', parlak: 0.55,
    aciklama: 'Gövdenin neredeyse tamamı koyu kırmızı ve opaktır; bacaklar daha açık kalabilir. Şematik.' },
  { id: 'painted-fire-red', grup: VARIANT_GROUPS[1], ad: 'Painted Fire Red (bacaklar da kırmızı)', dogrulanmali: false,
    renk: { sirt: '#7c0508', yan: '#a40b0e', karin: '#b81d1d', bacak: '#a8201f' }, goz: '#100606', stil: 'duz', parlak: 0.75,
    aciklama: 'Kırmızının bacaklara, antenlere ve kuyruk yelpazesine de işlediği en koyu kırmızı sınıf; şematik.' },

  { id: 'yellow', grup: VARIANT_GROUPS[2], ad: 'Yellow (sarı)', dogrulanmali: false,
    renk: { sirt: '#e4bd0c', yan: '#f0d13a', karin: '#f6e88c', bacak: '#f3e9a6' }, goz: '#1a140a', stil: 'duz', lekeli: 0.1, parlak: 0.5,
    aciklama: 'Gövdesi limon-sarı renkli Neocaridina; bazı satıcılar “Yellow Sakura” da der. Şematik.' },
  { id: 'yellow-goldenback', grup: VARIANT_GROUPS[2], ad: 'Yellow Goldenback (sırtta açık çizgi)', dogrulanmali: true,
    renk: { sirt: '#d6a406', yan: '#ecc82c', karin: '#f5e485', bacak: '#f1e5a0' }, goz: '#1a140a', stil: 'duz', serit: '#fff1a6', parlak: 0.55,
    aciklama: 'Sarı gövdede sırt boyunca uzanan açık altın çizgi (golden back). Adın ve çizginin tam görünümü satıcıya göre değişir. Şematik.' },
  { id: 'orange', grup: VARIANT_GROUPS[2], ad: 'Orange (Sunkist / Orange Pumpkin)', dogrulanmali: true,
    renk: { sirt: '#dd6410', yan: '#f08628', karin: '#f6b46c', bacak: '#f3c79a' }, goz: '#1a0f08', stil: 'duz', lekeli: 0.12, parlak: 0.5,
    aciklama: 'Turuncu gövde; ticarette Sunkist, Orange Pumpkin gibi adlar kullanılır ve aralarındaki fark net değildir. Şematik.' },

  { id: 'blue-dream', grup: VARIANT_GROUPS[3], ad: 'Blue Dream (parlak mavi)', dogrulanmali: false,
    renk: { sirt: '#1d4ea6', yan: '#2f6ec8', karin: '#74a3e2', bacak: '#93b6e6' }, goz: '#080b16', stil: 'duz', parlak: 0.7,
    aciklama: 'Parlak, orta-koyu mavi Neocaridina; bazı hatlar çikolata (chocolate) soyundan seçilmiştir. Mavi isimleri (Dream, Velvet, Jelly) satıcıya göre karışır. Şematik.' },
  { id: 'blue-velvet', grup: VARIANT_GROUPS[3], ad: 'Blue Velvet (koyu, mat mavi)', dogrulanmali: true,
    renk: { sirt: '#112368', yan: '#1a3688', karin: '#3b57a4', bacak: '#566fb0' }, goz: '#05070f', stil: 'duz', parlak: 0.05,
    aciklama: 'Daha koyu lacivert, kadife gibi mat görünen mavi hat olarak anlatılır; Blue Dream’den ayrımı tutarlı değildir. Şematik.' },
  { id: 'green-jade', grup: VARIANT_GROUPS[3], ad: 'Green Jade (yeşil)', dogrulanmali: true,
    renk: { sirt: '#2b8446', yan: '#47a45c', karin: '#a0d3a6', bacak: '#b5dcb8' }, goz: '#0a120b', stil: 'duz', parlak: 0.55,
    aciklama: 'Yeşil Neocaridina; görece yeni ve az yaygın bir hat olarak geçer. Şematik.' },

  { id: 'chocolate', grup: VARIANT_GROUPS[4], ad: 'Chocolate (çikolata kahve)', dogrulanmali: false,
    renk: { sirt: '#47261a', yan: '#693f27', karin: '#a07b5c', bacak: '#b89a80' }, goz: '#0d0806', stil: 'duz', parlak: 0.45,
    aciklama: 'Koyu kahverengi gövde; birçok mavi hat bu soydan seçilmiştir. Şematik.' },
  { id: 'black-rose', grup: VARIANT_GROUPS[4], ad: 'Black Rose (koyu bordo-siyah)', dogrulanmali: true,
    renk: { sirt: '#180f14', yan: '#2b1b23', karin: '#4a2f3a', bacak: '#4b3640' }, goz: '#050304', stil: 'duz', parlak: 0.6,
    aciklama: 'Çok koyu, hafif bordo yansımalı siyaha yakın gövde olarak anlatılır; ad ve renk satıcıya göre çok değişir. Şematik.' },
  { id: 'snowball', grup: VARIANT_GROUPS[4], ad: 'Snowball (beyaz, opak)', dogrulanmali: true,
    renk: { sirt: '#eeece4', yan: '#f6f4ee', karin: '#ffffff', bacak: '#f1f1ec' }, goz: '#16110d', stil: 'duz', parlak: 0.5,
    aciklama: 'Opak beyaz Neocaridina hattı. Adı bazı kaynaklarda farklı beyaz hatlar için de kullanılır; Caridina kar topu karidesinden ayrıdır. Şematik.' },

  { id: 'rili-kirmizi', grup: VARIANT_GROUPS[5], ad: 'Red Rili (saydam gövde, kırmızı lekeler)', dogrulanmali: false,
    renk: { sirt: '#c0151a', yan: '#d02a2a', karin: '#e68a80', bacak: '#e2d4d0' }, goz: '#1a0c0b', stil: 'rili', rili: { acik: [1, 2, 3], ton: '#d3dedb' }, parlak: 0.6,
    aciklama: 'Saydam bölgeler arasında baş kısmında ve kuyrukta kırmızı lekeler; Rili deseni. Lekelerin yeri bireyden bireye çok değişir. Şematik.' },
  { id: 'rili-mavi', grup: VARIANT_GROUPS[5], ad: 'Blue Rili (saydam gövde, mavi lekeler)', dogrulanmali: false,
    renk: { sirt: '#1d4fb0', yan: '#2f6ecf', karin: '#7ea6e4', bacak: '#d6dfe6' }, goz: '#080b16', stil: 'rili', rili: { acik: [1, 2, 3], ton: '#d3dedf' }, parlak: 0.6,
    aciklama: 'Rili deseninin mavi biçimi; saydam gövde üstünde mavi lekeler. Bazı kaynaklarda kırmızı Rili soyundan elde edildiği belirtilir (doğrulanmalı). Şematik.' },
];

export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seedFor = (v: Variant, sex: Sex): number => v.id.length * 977 + v.id.charCodeAt(0) * 31 + (sex === 'erkek' ? 11 : 29);

/** Cinsiyete göre doygunluk: erkekler biraz daha soluk (gri-beyaza doğru karışım) */
export function sexTone(c: Rgb, colour: number): Rgb {
  const l = (c[0] + c[1] + c[2]) / 3;
  return mixRgb([l, l, l], c, 0.55 + 0.45 * colour);
}
