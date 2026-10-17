// Renk / desen varyeteleri (şematik yorumlar; saf veri).
// Önemli: Bu desen tiplerinin bir kısmı cüce türden çok başka (daha büyük) Potamotrygon türlerinde görülür;
// burada yalnızca "desen tipi" aynı standart gövde üzerinde gösterilir. Her kayıtta dogrulanmali alanı vardır.
import type { Sex } from './model';

export type VariantId = string;

/** Sırt deseni katmanları. Konumlar disk içinde normalleştirilmiş yarıçap (rho 0 = merkez, 1 = kenar) ile verilir; yarıçaplar disk birimidir. */
export type DesenLayer =
  | { t: 'benek'; n: number; renk: string; r: [number, number]; a: [number, number]; rho: [number, number] }                   // küçük keskin benekler
  | { t: 'ocellus'; n: number; halka: string; ic: string; r: [number, number]; rho: [number, number]; kalinlik: number }        // halkalı göz beneği
  | { t: 'leke'; n: number; renk: string; r: [number, number]; a: number; rho: [number, number] }                                // yumuşak, düzensiz koyu leke
  | { t: 'ag'; n: number; renk: string; w: [number, number]; uzunluk: number; a: number; rho: [number, number] };               // dolambaçlı çizgiler (retikülasyon)

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  /** Kaynakla doğrulanmalı mı (adlandırma / varlık belirsiz) */
  dogrulanmali: boolean;
  goz: { iris: string; halka: string; pupil: string };
  /** Sırt yüzü: merkez ve kenar zemin renkleri (dişide solgunluk/koyuluk farkı küçüktür) */
  sirt: { merkez: string; kenar: string };
  /** Karın yüzü: orta ve kenar rengi */
  karin: { orta: string; kenar: string };
  kuyruk: { taban: string; uc: string; bant?: boolean };
  diken: string;
  desen: DesenLayer[];
  /** 0..1 mat→hafif parlak mukus yansıması */
  parlak?: number;
}

export const VARIANT_GROUPS = ['Cüce türlerde anlatılan desenler', 'Başka türlerde görülen desen tipleri', 'Pigment varyasyonu'] as const;

const GOZ_KOYU = { iris: '#7a5a2a', halka: '#2a1a0c', pupil: '#050403' };

export const VARIANTS: Variant[] = [
  // ---------------- Cüce türlerde anlatılan desenler ----------------
  { id: 'wallacei', grup: VARIANT_GROUPS[0], ad: 'Cururu tipi (açık kahve, koyu merkez, kenarda göz benekleri)', dogrulanmali: false,
    aciklama: 'Açık kahverengi zemin; diskin ortasında koyu, düzensiz lekeler, kenara doğru halkalı göz benekleri (ocelli). P. wallacei için tür tanımında anlatılan desene dayanan şematik yorumdur; gerçek bireyler çok değişir.',
    goz: GOZ_KOYU, sirt: { merkez: '#9a7a52', kenar: '#c4a878' }, karin: { orta: '#f1e8d6', kenar: '#d8b98a' }, kuyruk: { taban: '#9a7a52', uc: '#3a2a1c', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'leke', n: 16, renk: '#3a2818', r: [0.07, 0.17], a: 0.82, rho: [0, 0.58] },
      { t: 'ocellus', n: 15, halka: '#e0cc98', ic: '#4a3422', r: [0.045, 0.085], rho: [0.55, 0.9], kalinlik: 0.3 },
      { t: 'benek', n: 70, renk: '#f0e2b6', r: [0.008, 0.016], a: [0.5, 0.4], rho: [0.15, 0.95] },
    ] },
  { id: 'koyu-benekli', grup: VARIANT_GROUPS[0], ad: 'Koyu kahve zemin, sık açık benekli (ticarette "hystrix" adıyla anılan tip)', dogrulanmali: true,
    aciklama: 'Koyu kahve–çikolata zemin üzerinde sık, küçük açık benekler. Küçük Rio Negro vatozları ticarette uzun süre "hystrix" adıyla satılmıştır; adlandırma karışıktır ve tür kimliği kaynakla doğrulanmalıdır. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#4a3524', kenar: '#7a5e40' }, karin: { orta: '#ece2cf', kenar: '#b99a6c' }, kuyruk: { taban: '#4a3524', uc: '#241810', bant: true }, diken: '#cfc4aa',
    desen: [
      { t: 'benek', n: 260, renk: '#e9dcb4', r: [0.012, 0.03], a: [0.55, 0.4], rho: [0.05, 0.96] },
      { t: 'ocellus', n: 7, halka: '#d8c18a', ic: '#2e2014', r: [0.05, 0.08], rho: [0.62, 0.88], kalinlik: 0.28 },
    ] },

  // ---------------- Başka türlerde görülen desen tipleri ----------------
  { id: 'motoro', grup: VARIANT_GROUPS[1], ad: 'Motoro tipi (turuncu halkalı göz benekleri)', dogrulanmali: true,
    aciklama: 'Kahverengi–zeytin zemin üzerinde dağınık, turuncu–sarı halkalı koyu merkezli göz benekleri. Bu desen P. motoro gibi daha büyük türlerle anılır; cüce türün olağan deseni değildir, yalnızca desen tipi olarak gösterilmiştir. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#6e5a3a', kenar: '#8f7a52' }, karin: { orta: '#f3ead7', kenar: '#d0a56c' }, kuyruk: { taban: '#6e5a3a', uc: '#2e2214', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'leke', n: 8, renk: '#3c2c1a', r: [0.06, 0.12], a: 0.45, rho: [0, 0.5] },
      { t: 'ocellus', n: 22, halka: '#f08a24', ic: '#3a2816', r: [0.05, 0.11], rho: [0.1, 0.92], kalinlik: 0.34 },
    ] },
  { id: 'leopoldi', grup: VARIANT_GROUPS[1], ad: 'Leopoldi tipi (siyah zemin, krem–beyaz benek ve ağ)', dogrulanmali: true,
    aciklama: 'Koyu, neredeyse siyah zemin üzerinde krem–beyaz benekler ve ince ağ çizgileri. P. leopoldi (Xingu) ile anılan bu desen daha büyük bir türe aittir; cüce türün olağan deseni değildir, yalnızca desen tipi olarak gösterilmiştir. Şematik yorum.',
    goz: { iris: '#6a5030', halka: '#1a1008', pupil: '#020202' }, sirt: { merkez: '#1c1713', kenar: '#2e261c' }, karin: { orta: '#f2eee4', kenar: '#a89a82' }, kuyruk: { taban: '#1c1713', uc: '#0c0a08', bant: false }, diken: '#cfc9bb',
    desen: [
      { t: 'ag', n: 40, renk: '#efe6cc', w: [0.01, 0.017], uzunluk: 0.25, a: 0.8, rho: [0.1, 0.95] },
      { t: 'benek', n: 160, renk: '#f4ecd4', r: [0.014, 0.034], a: [0.75, 0.25], rho: [0.05, 0.96] },
    ] },
  { id: 'retikule', grup: VARIANT_GROUPS[1], ad: 'Retikülasyon tipi (dolambaçlı ağ çizgileri)', dogrulanmali: true,
    aciklama: 'Krem–kahve zemin üzerinde koyu, dolambaçlı, birbirine bağlanan çizgiler. Retikülasyon, Potamotrygon cinsinin bazı türlerinde anlatılan bir desen tipidir; hangi cüce bireyde görüldüğü kaynakla doğrulanmalıdır. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#b79c72', kenar: '#cdb68c' }, karin: { orta: '#f4ecda', kenar: '#dcc59a' }, kuyruk: { taban: '#b79c72', uc: '#3a2a1c', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'ag', n: 60, renk: '#3a2a1a', w: [0.012, 0.022], uzunluk: 0.5, a: 0.82, rho: [0, 0.98] },
      { t: 'benek', n: 40, renk: '#3a2a1a', r: [0.01, 0.022], a: [0.5, 0.3], rho: [0.1, 0.95] },
    ] },

  // ---------------- Pigment varyasyonu ----------------
  { id: 'albino', grup: VARIANT_GROUPS[2], ad: 'Albino (açık krem–turuncu, kırmızımsı göz)', dogrulanmali: true,
    aciklama: 'Pigment eksikliği: krem–şeftali zemin, soluk turuncu halkalı göz benekleri ve kırmızımsı göz. Ticarette albino vatozlar anılır; hangi türde ve ne sıklıkta görüldüğü kaynakla doğrulanmalıdır. Şematik yorum.',
    goz: { iris: '#d23a46', halka: '#8a1d28', pupil: '#4a0610' }, sirt: { merkez: '#e6cba2', kenar: '#f0dcb8' }, karin: { orta: '#fbf4e6', kenar: '#f0d8b4' }, kuyruk: { taban: '#e6cba2', uc: '#d4a878', bant: false }, diken: '#efe6d0',
    desen: [
      { t: 'leke', n: 8, renk: '#d9a870', r: [0.08, 0.16], a: 0.4, rho: [0, 0.6] },
      { t: 'ocellus', n: 14, halka: '#f4a860', ic: '#e8b888', r: [0.045, 0.09], rho: [0.3, 0.9], kalinlik: 0.3 },
      { t: 'benek', n: 40, renk: '#fff3d8', r: [0.008, 0.016], a: [0.5, 0.3], rho: [0.1, 0.95] },
    ], parlak: 0.5 },
];

export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((grup) => ({ grup, items: VARIANTS.filter((v) => v.grup === grup) })).filter((g) => g.items.length > 0);
}

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

export const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Deterministik [0,1) sahte rastgele sayı üreteci */
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

/** Dişi/erkek sırt rengi farkı yok sayılır (gerçek bir renk ikili biçimliliği kaynakta doğrulanmadı); yalnızca tohum farklıdır. */
export const seedFor = (v: Variant, sex: Sex): number => v.id.length * 977 + v.id.charCodeAt(0) * 31 + (sex === 'erkek' ? 11 : 29);

/** Kuyruk dibinden ucuna renk (u: 0..1); bant: koyu halkalar */
export function tailColor(v: Variant, u: number): [number, number, number] {
  const base = mixRgb(hexToRgb(v.kuyruk.taban), hexToRgb(v.kuyruk.uc), Math.min(1, Math.max(0, (u - 0.1) / 0.9)));
  if (v.kuyruk.bant && u > 0.38) {
    const band = Math.sin(u * 46) > 0.35 ? 0.55 : 1;
    return [base[0] * band, base[1] * band, base[2] * band];
  }
  return base;
}
