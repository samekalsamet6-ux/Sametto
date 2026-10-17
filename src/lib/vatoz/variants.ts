// Renk / desen varyeteleri (şematik yorumlar; saf veri).
// Hepsi aynı genel Potamotrygon benzeri disk üzerinde gösterilir; yalnızca renk ve desen değişir.
// Kaynak özeti (WebSearch ile doğrulandı): FishBase / Wikipedia (P. motoro), FishKeeper UK (P. leopoldi "Black Diamond", P. wallacei "cururu"), FAPESP haberi (P. wallacei tanımı).
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

export const VARIANT_GROUPS = ['Akvaryumda sık görülen türlerin desenleri', 'Ticari desen formları', 'Pigment varyasyonu'] as const;

const GOZ_KOYU = { iris: '#7a5a2a', halka: '#2a1a0c', pupil: '#050403' };

export const VARIANTS: Variant[] = [
  // ---------------- Akvaryumda sık görülen türlerin desenleri ----------------
  { id: 'motoro', grup: VARIANT_GROUPS[0], ad: 'Motoro (P. motoro): turuncu halkalı göz benekleri', dogrulanmali: false,
    aciklama: 'Zemin açık kahve, zeytin-gri ya da koyu kahve olabilir; üzerinde siyah dış halkalı, turuncu-sarı benekler (ocelli) bulunur. Akvaryumda en yaygın ithal edilen tatlı su vatozlarından biridir (yetişkin disk genişliği kaynaklara göre yaklaşık 50 cm). Desen bireyler ve bölgeler arasında çok değişir. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#6e5a3a', kenar: '#8f7a52' }, karin: { orta: '#f3ead7', kenar: '#d0a56c' }, kuyruk: { taban: '#6e5a3a', uc: '#2e2214', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'leke', n: 8, renk: '#3c2c1a', r: [0.06, 0.12], a: 0.45, rho: [0, 0.5] },
      { t: 'ocellus', n: 22, halka: '#f08a24', ic: '#3a2816', r: [0.05, 0.11], rho: [0.1, 0.92], kalinlik: 0.34 },
    ] },
  { id: 'leopoldi', grup: VARIANT_GROUPS[0], ad: 'Leopoldi / "Black Diamond" (P. leopoldi): siyah zemin, krem-beyaz benekler', dogrulanmali: false,
    aciklama: 'Siyah ya da çok koyu zemin üzerinde sarımsı-beyaz benekler; Xingu Nehri havzasına özgü, disk genişliği yaklaşık 60 cm\'e ulaşabilen bir türdür ve ticarette "Black Diamond", "Polka-dot" adlarıyla da satılır. Benek yoğunluğu bireyler arasında değişir. Şematik yorum.',
    goz: { iris: '#6a5030', halka: '#1a1008', pupil: '#020202' }, sirt: { merkez: '#1c1713', kenar: '#2e261c' }, karin: { orta: '#f2eee4', kenar: '#a89a82' }, kuyruk: { taban: '#1c1713', uc: '#0c0a08', bant: false }, diken: '#cfc9bb',
    desen: [
      { t: 'ag', n: 40, renk: '#efe6cc', w: [0.01, 0.017], uzunluk: 0.25, a: 0.8, rho: [0.1, 0.95] },
      { t: 'benek', n: 160, renk: '#f4ecd4', r: [0.014, 0.034], a: [0.75, 0.25], rho: [0.05, 0.96] },
    ] },
  { id: 'wallacei', grup: VARIANT_GROUPS[0], ad: 'Cururu (P. wallacei): açık-koyu kahve zemin, halkalı iri lekeler', dogrulanmali: false,
    aciklama: 'Zemin açık ile koyu kahve arasındadır; üzerinde koyu kahve ya da siyah halkalı, büyük ve düzensiz lekeler görülür (adı "cururu", sırt görünümünün kurbağaya benzetilmesinden gelir). Rio Negro havzasının küçük bir türüdür (disk yaklaşık 40 cm) ve uzun süre ticarette yanlışlıkla "hystrix" adıyla satılmıştır; hystrix adıyla satılan bireylerin kimliği bu yüzden karışıktır. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#9a7a52', kenar: '#c4a878' }, karin: { orta: '#f1e8d6', kenar: '#d8b98a' }, kuyruk: { taban: '#9a7a52', uc: '#3a2a1c', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'leke', n: 16, renk: '#3a2818', r: [0.07, 0.17], a: 0.82, rho: [0, 0.58] },
      { t: 'ocellus', n: 15, halka: '#e0cc98', ic: '#4a3422', r: [0.045, 0.085], rho: [0.55, 0.9], kalinlik: 0.3 },
      { t: 'benek', n: 70, renk: '#f0e2b6', r: [0.008, 0.016], a: [0.5, 0.4], rho: [0.15, 0.95] },
    ] },
  { id: 'retikule', grup: VARIANT_GROUPS[0], ad: 'Retikülasyon tipi (Reticulata / ağ desenli)', dogrulanmali: true,
    aciklama: 'Krem-kahve zemin üzerinde koyu, dolambaçlı, birbirine bağlanan çizgiler. Genç bireylerde motoroya benzer görünebildiği ve kuyruk yanındaki çizgiyle ayırt edildiği belirtilir; ağ desenli ("vermiculate") tipin hangi türe ait olduğu ve ticaret adı kaynaklara göre değişir, bu yüzden kaynakla doğrulanmalıdır. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#b79c72', kenar: '#cdb68c' }, karin: { orta: '#f4ecda', kenar: '#dcc59a' }, kuyruk: { taban: '#b79c72', uc: '#3a2a1c', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'ag', n: 60, renk: '#3a2a1a', w: [0.012, 0.022], uzunluk: 0.5, a: 0.82, rho: [0, 0.98] },
      { t: 'benek', n: 40, renk: '#3a2a1a', r: [0.01, 0.022], a: [0.5, 0.3], rho: [0.1, 0.95] },
    ] },

  // ---------------- Ticari desen formları ----------------
  { id: 'marmorlu', grup: VARIANT_GROUPS[1], ad: 'Marmorlu motoro (ticari form)', dogrulanmali: true,
    aciklama: 'Motoro içinde ticarette "marbled" (mermer desenli) diye anılan, ocelli yerine kıvrımlı, bulutsu çizgi ve lekelerin baskın olduğu form. Ticari adlar standart değildir ve tek bir kaynakta anıldığı için kaynakla doğrulanmalıdır. Şematik yorum.',
    goz: GOZ_KOYU, sirt: { merkez: '#7b6544', kenar: '#a08a5e' }, karin: { orta: '#f3ead7', kenar: '#d0a56c' }, kuyruk: { taban: '#7b6544', uc: '#2e2214', bant: true }, diken: '#d8cdb4',
    desen: [
      { t: 'leke', n: 18, renk: '#2e2214', r: [0.06, 0.14], a: 0.55, rho: [0, 0.9] },
      { t: 'ag', n: 30, renk: '#e9d9a8', w: [0.014, 0.026], uzunluk: 0.45, a: 0.7, rho: [0, 0.95] },
      { t: 'ocellus', n: 6, halka: '#f08a24', ic: '#3a2816', r: [0.04, 0.07], rho: [0.3, 0.9], kalinlik: 0.3 },
    ] },

  // ---------------- Pigment varyasyonu ----------------
  { id: 'albino', grup: VARIANT_GROUPS[2], ad: 'Albino (açık krem-turuncu, kırmızımsı göz)', dogrulanmali: true,
    aciklama: 'Pigment eksikliği: krem-şeftali zemin, soluk turuncu halkalı göz benekleri ve kırmızımsı göz. Ticarette albino vatozlar anılır; hangi türde ve ne sıklıkta görüldüğü arama sonuçlarında doğrulanamadı, kaynakla doğrulanmalıdır. Şematik yorum.',
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
