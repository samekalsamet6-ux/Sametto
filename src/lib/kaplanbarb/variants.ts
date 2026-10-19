// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) ayrıdır: bkz. forms.ts.
// Kaynaklarda doğrulanamayan ya da adı tutarsız kayıtlar "dogrulanmali" ile işaretlidir.
// GloFish benzeri floresan / genetiği değiştirilmiş ve boyanmış balıklar kapsam dışıdır.
// Erkek tanımlıdır; dişi, erkeğin daha soluk, kırmızısı az bir türevidir (variantById(id, 'disi')).
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant, type Layer } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;

export const VARIANT_GROUPS = ['Doğal ve yeşil', 'Açık renkli (pigmentsiz) hatlar'] as const;

/** Dört dikey bant: gözden geçen, sırt yüzgeci önü, sırt yüzgeci arkası, kuyruk sapı */
const bars = (renk: string, a: number): Layer[] => [
  { t: 'bar', nx: 0.125, w: 0.03, renk, a, ny: [0, 0.8], soft: 0.25 },
  { t: 'bar', nx: 0.36, w: 0.034, renk, a, ny: [0, 0.88], soft: 0.25 },
  { t: 'bar', nx: 0.68, w: 0.031, renk, a, ny: [0, 0.84], soft: 0.25 },
  { t: 'bar', nx: 0.9, w: 0.028, renk, a, soft: 0.25 },
];
/** Erkekte kırmızı–turuncu burun (üreme/olgunluk döneminde belirginleşir) */
const snout = (renk: string, a: number): Layer => ({ t: 'wash', nx: [0, 0.2], ny: [0.2, 0.85], renk, a });
const GILL = (renk: string, a: number): Layer => ({ t: 'wash', nx: [0.1, 0.28], ny: [0.05, 0.7], renk, a });

export const VARIANTS: Variant[] = [
  { id: 'normal', grup: VARIANT_GROUPS[0], ad: 'Normal (yabani tip, dört bantlı)', dogrulanmali: false,
    aciklama: 'Doğadaki ve en yaygın ticari biçim: sarı–altın gövde, dört dikey siyah bant (gözden, sırt yüzgeci önünden, sırt yüzgeci arkasından ve kuyruk sapından), kırmızı–turuncu sırt yüzgeci kenarı ve erkekte kırmızı burun.',
    govde: { sirt: '#8e6b1c', orta: '#e2ac3c', karin: '#f6dc98' }, yuzgec: { renk: '#f0b27a', isin: '#d6402a', a: 0.3 }, iplik: '#dc4a2c',
    goz: { iris: '#d4a23a', halka: '#1c1812', pupil: '#020202' }, parlak: 0.65,
    katmanlar: [GILL('#f2c040', 0.3), ...bars('#0b0907', 0.94), snout('#e3401e', 0.85)] },
  { id: 'yesil', grup: VARIANT_GROUPS[0], ad: 'Yeşil (moss green)', dogrulanmali: false,
    aciklama: 'Koyu zümrüt yeşili, metalik gövde; bantlar korunur ama koyu zeminde çoğu zaman daha az belirgindir (bazı bireyler neredeyse siyah görünür). Yeşil yoğunluğu bireyden bireye çok değişir; sırt yüzgeci kenarı kırmızı–turuncu kalır.',
    govde: { sirt: '#0d2a14', orta: '#1f6130', karin: '#4a9552' }, yuzgec: { renk: '#8fc08a', isin: '#cc4224', a: 0.28 }, iplik: '#cf4a2a',
    goz: { iris: '#c8b04a', halka: '#10140c', pupil: '#020202' }, parlak: 0.8,
    katmanlar: [{ t: 'wash', nx: [0.1, 0.9], ny: [0.1, 0.65], renk: '#7ad47f', a: 0.28 }, ...bars('#040a05', 0.62), snout('#e0481c', 0.75)] },
  { id: 'albino', grup: VARIANT_GROUPS[1], ad: 'Albino', dogrulanmali: false,
    aciklama: 'Koyu pigmenti olmayan krem–sarımsı, pembemsi beyaz gövde; bantlar çok silik krem tonundadır, gözler kırmızıdır, sırt yüzgeci kenarı soluk turuncudur.',
    govde: { sirt: '#f1dcab', orta: '#f9ecd2', karin: '#fff7e8' }, yuzgec: { renk: '#fbe8d6', isin: '#f0a070', a: 0.26 }, iplik: '#f5a07e',
    goz: { iris: '#e8343e', halka: '#b02a3a', pupil: '#4a0a14' }, parlak: 0.5,
    katmanlar: [GILL('#f6c8a0', 0.25), ...bars('#e2cfa8', 0.5), snout('#f29060', 0.5)] },
  { id: 'altin', grup: VARIANT_GROUPS[1], ad: 'Altın (Gold)', dogrulanmali: true,
    aciklama: 'Parlak altın–sarı gövde; siyah bantlar yok ya da çok silik olarak anlatılır. Yüzgeçler sarımsı–turuncudur. Adlandırma satıcıya göre değişir (“gold”, “golden”); platin ve albinoyla karışabilir, kaynakla doğrulanmalıdır.',
    govde: { sirt: '#c29420', orta: '#f2c444', karin: '#fce8a6' }, yuzgec: { renk: '#f8dc90', isin: '#e5742a', a: 0.28 }, iplik: '#ee8a3a',
    goz: { iris: '#c8a040', halka: '#1c1810', pupil: '#020202' }, parlak: 0.7,
    katmanlar: [...bars('#8a6a1a', 0.12), snout('#ee7a28', 0.6)] },
  { id: 'platin', grup: VARIANT_GROUPS[1], ad: 'Platin (Platinum)', dogrulanmali: true,
    aciklama: 'Albinoya benzer ama gümüşi–platin ya da altın parlaklığı daha belirgin, soluk gövde; bantlar çok silik grimsi. Bu ad ticarette “gold”, “albino” ve “platinum” için tutarsız kullanılır; varlığı ve tam görünümü kaynakla doğrulanmalıdır.',
    govde: { sirt: '#bdb090', orta: '#ece6d2', karin: '#faf7ee' }, yuzgec: { renk: '#f4eada', isin: '#e08a60', a: 0.26 }, iplik: '#eda080',
    goz: { iris: '#bba070', halka: '#1a1814', pupil: '#020202' }, parlak: 0.85,
    katmanlar: [{ t: 'wash', nx: [0.1, 0.9], ny: [0.1, 0.6], renk: '#f1d890', a: 0.3 }, ...bars('#6c675c', 0.26), snout('#ec8658', 0.5)] },
  { id: 'cam', grup: VARIANT_GROUPS[1], ad: 'Cam / ksantik (Glass)', dogrulanmali: true,
    aciklama: 'Siyah pigmenti bulunmayan, soluk sarı ve yarı saydam görünümlü ksantik biçim olarak anlatılır; bantlar silik kahverengimsi. Yalnızca tek tük satıcı kaynağında geçtiği için varlığı ve adı kaynakla doğrulanmalıdır.',
    govde: { sirt: '#e8d890', orta: '#f5edba', karin: '#fbf8e0' }, yuzgec: { renk: '#f8f0c8', isin: '#e0905a', a: 0.2 }, iplik: '#ec9c68',
    goz: { iris: '#c8b078', halka: '#1c1a14', pupil: '#020202' }, parlak: 0.45,
    katmanlar: [...bars('#9c8e60', 0.34), snout('#ea9060', 0.45)] },
];

const mix = (a: string, b: string, k: number): string => {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * k) * 255).toString(16).padStart(2, '0')).join('');
};

/** Dişi: daha soluk, burun kırmızısı ve yüzgeç kenarı kırmızısı çok daha az (zayıf, doğrulanmalı fark) */
export function femaleOf(v: Variant): Variant {
  return {
    ...v,
    govde: { sirt: mix(v.govde.sirt, '#8a8470', 0.22), orta: mix(v.govde.orta, '#d8cfae', 0.22), karin: mix(v.govde.karin, '#f0ece0', 0.25) },
    yuzgec: { renk: v.yuzgec.renk, isin: mix(v.yuzgec.isin, '#e8b088', 0.5), a: v.yuzgec.a },
    iplik: mix(v.iplik, '#e8b898', 0.5),
    parlak: (v.parlak ?? 0) * 0.9,
    katmanlar: v.katmanlar.map((l) => (l.t === 'wash' && l.nx[0] === 0 ? { ...l, a: l.a * 0.12 } : l)),
  };
}

export const variantById = (id: string, sex: SexId = 'erkek'): Variant => {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  return sex === 'disi' ? femaleOf(v) : v;
};
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
