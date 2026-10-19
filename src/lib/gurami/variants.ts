// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) ayrıdır: bkz. forms.ts.
// Ticaret adları standart değildir: aynı renk satıcıya göre "Red", "Flame", "Sunset" gibi farklı adlarla satılabilir.
// Kaynaklarda doğrulanamayan ya da adı tutarsız kayıtlar "dogrulanmali" ile işaretlidir.
// Erkek tanımlıdır; dişi, erkek renginin soluk ve gümüşi bir türevidir (variantById(id, 'disi')).
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant, type Layer } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;

export const VARIANT_GROUPS = ['Mavi hatlar', 'Kırmızı hatlar', 'Açık renkler (adlar tutarsız)'] as const;

const GOZ = { iris: '#c4572a', halka: '#2a1a26', pupil: '#030303' };
/** Çapraz (üst arkadan alt öne eğik), gövdeden yüzgeçlere uzanan ince dikey/eğik şeritler */
const stripes = (renk: string, a: number, fin = true): Layer[] =>
  [0.2, 0.29, 0.37, 0.46, 0.53, 0.62, 0.7, 0.79, 0.87].map((nx, i) => ({ t: 'bar' as const, nx: nx + 0.012 * Math.sin(i * 2.3), w: 0.0085 + 0.0035 * Math.abs(Math.sin(i * 1.7)), renk, a: a * (0.6 + 0.35 * Math.abs(Math.sin(i * 3.1))), fin, slant: -0.3 + 0.08 * Math.sin(i * 1.3), soft: 0.45 }));

export const VARIANTS: Variant[] = [
  { id: 'neon', grup: VARIANT_GROUPS[0], ad: 'Neon mavi (Neon Blue)', dogrulanmali: false,
    aciklama: 'Metalik, doygun mavi gövde üzerinde, gövdeden yüzgeçlere uzanan kırık, çapraz kırmızı–turuncu şeritler. Ticarette en yaygın renk biçimlerinden biridir; “Turquoise”, “Rainbow” gibi adlarla da satılabilir.',
    govde: { sirt: '#1a4aa6', orta: '#2f7ad2', karin: '#79afe0' }, yuzgec: { renk: '#80b0e8', isin: '#d9503a', a: 0.4 }, iplik: '#ee6c3c', goz: GOZ, parlak: 0.9,
    katmanlar: [{ t: 'wash', nx: [0.05, 0.9], ny: [0.05, 0.5], renk: '#4a9bf0', a: 0.35 }, ...stripes('#dc4a2c', 0.82)] },
  { id: 'yabani', grup: VARIANT_GROUPS[0], ad: 'Yabani tipe yakın (Rainbow)', dogrulanmali: true,
    aciklama: 'Doğadaki erkeklerde anlatılan görünüme yakın: gümüşi turkuaz–mavi zemin üzerinde ince çapraz kırmızı–turuncu şeritler; neon mavi hattan daha soluk. Ticarette “Rainbow” gibi adlar farklı bireyler için kullanılabilir, kaynakla doğrulanmalıdır.',
    govde: { sirt: '#4a8aa0', orta: '#7db4bd', karin: '#c6dcd8' }, yuzgec: { renk: '#a6cdd0', isin: '#e0693a', a: 0.36 }, iplik: '#ee7a44', goz: GOZ, parlak: 0.7,
    katmanlar: stripes('#e06a38', 0.72) },
  { id: 'powder', grup: VARIANT_GROUPS[0], ad: 'Toz mavi (Powder Blue)', dogrulanmali: false,
    aciklama: 'Açık, pastel (“pudra”) tek tonlu mavi gövde ve yüzgeçler; kırmızı şeritler çok silik ya da yoktur.',
    govde: { sirt: '#76b0e4', orta: '#a6cff2', karin: '#dbecfa' }, yuzgec: { renk: '#b8d8f4', isin: '#7fa6cc', a: 0.36 }, iplik: '#f0a48e', goz: { iris: '#6a8ab0', halka: '#243040', pupil: '#030303' }, parlak: 0.8,
    katmanlar: stripes('#e0806a', 0.16) },
  { id: 'kobalt', grup: VARIANT_GROUPS[0], ad: 'Kobalt mavi (Cobalt)', dogrulanmali: true,
    aciklama: 'Koyu, doygun lacivert–kobalt mavi gövde; şeritler çok silik. Bu ad ticarette kullanılır ancak neon mavi ile sınırı net değildir; kaynakla doğrulanmalıdır.',
    govde: { sirt: '#0a2674', orta: '#1642ae', karin: '#3a6ccc' }, yuzgec: { renk: '#3a62c0', isin: '#2a4aa0', a: 0.42 }, iplik: '#d85a3a', goz: GOZ, parlak: 0.85,
    katmanlar: stripes('#b83a2e', 0.3) },
  { id: 'sunset', grup: VARIANT_GROUPS[1], ad: 'Gün batımı (Sunset / Red)', dogrulanmali: false,
    aciklama: 'Gövde neredeyse tamamen kırmızı–turuncu; mavi yalnızca sırtta ve yüzgeçlerde kalır. “Red” ya da “Robin” adıyla da satıldığı bildirilir.',
    govde: { sirt: '#3a62b4', orta: '#d8452a', karin: '#f27a4a' }, yuzgec: { renk: '#4470c4', isin: '#e45a34', a: 0.4 }, iplik: '#f26c3a', goz: GOZ, parlak: 0.65,
    katmanlar: [{ t: 'wash', nx: [0.1, 0.95], ny: [0, 0.3], renk: '#2f58b0', a: 0.75 }, ...stripes('#8e2014', 0.34)] },
  { id: 'alev', grup: VARIANT_GROUPS[1], ad: 'Alev (Flame / Red Fire)', dogrulanmali: true,
    aciklama: 'Koyu kırmızıya yakın, tek tonlu gövde ve yüzgeçler; mavi neredeyse hiç görünmez. Aynı kırmızı biçim “Red”, “Flame”, “Blood Red” gibi farklı adlarla satılabilir ve “Sunset” ile karışır; ayrıca kırmızı bal guramisi (T. chuna) ile karıştırıldığı bildirilir. Adlandırma kaynakla doğrulanmalıdır.',
    govde: { sirt: '#aa140c', orta: '#d62818', karin: '#f05c38' }, yuzgec: { renk: '#d83422', isin: '#a8160e', a: 0.42 }, iplik: '#f45a30', goz: { iris: '#d8602a', halka: '#2a1010', pupil: '#030303' }, parlak: 0.6,
    katmanlar: stripes('#760e0a', 0.26) },
  { id: 'altin', grup: VARIANT_GROUPS[2], ad: 'Altın / sarı (Gold)', dogrulanmali: true,
    aciklama: 'Sarı–altın gövde ve açık yüzgeçler, soluk turuncu şeritler. Bu renk bazı satıcılarda “gold” ya da “honey” diye geçer; bal guramisi (Trichogaster chuna) ise ayrı bir türdür ve burada gösterilmez. Cüce guramide altın biçimin varlığı ve adı kaynakla doğrulanmalıdır.',
    govde: { sirt: '#c8982c', orta: '#e8c25a', karin: '#f7e5ac' }, yuzgec: { renk: '#f0dc92', isin: '#c89a40', a: 0.38 }, iplik: '#f2b04a', goz: { iris: '#c8662a', halka: '#3a2210', pupil: '#030303' }, parlak: 0.6,
    katmanlar: stripes('#d98a2a', 0.34) },
  { id: 'albino', grup: VARIANT_GROUPS[2], ad: 'Albino', dogrulanmali: true,
    aciklama: 'Koyu pigmenti olmayan, krem–şeftali gövde, silik turuncu şeritler ve kırmızı/pembe göz. Cüce guramide albino bireyler hobi kaynaklarında anılır ancak ticari bir hat olarak yaygınlığı kaynakla doğrulanmalıdır.',
    govde: { sirt: '#f0d6ac', orta: '#f8e6c8', karin: '#fdf3e2' }, yuzgec: { renk: '#f8e6d6', isin: '#e0967a', a: 0.34 }, iplik: '#f4a888', goz: { iris: '#e0343e', halka: '#a02a38', pupil: '#4a0a14' }, parlak: 0.5,
    katmanlar: stripes('#e8896a', 0.38) },
];

const mix = (a: string, b: string, k: number): string => {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * k) * 255).toString(16).padStart(2, '0')).join('');
};

/** Dişi: erkeğin renginin soluk, gümüşi türevi; şeritler çok daha silik, yüzgeçler daha saydam */
export function femaleOf(v: Variant): Variant {
  const SILVER = '#b8bfc2', k = v.id === 'albino' ? 0.3 : 0.6;
  return {
    ...v,
    govde: { sirt: mix(v.govde.sirt, '#8f9a9e', k), orta: mix(v.govde.orta, SILVER, k), karin: mix(v.govde.karin, '#e6e8e4', k) },
    yuzgec: { renk: mix(v.yuzgec.renk, '#c8cfd0', k), isin: mix(v.yuzgec.isin, '#8a9498', k * 0.8), a: v.yuzgec.a * 0.85 },
    iplik: mix(v.iplik, '#d6d4c8', 0.45),
    parlak: (v.parlak ?? 0) * 0.75,
    katmanlar: v.katmanlar.map((l) => (l.t === 'bar' ? { ...l, a: l.a * 0.38, renk: mix(l.renk, '#9a8a80', 0.4) } : l.t === 'wash' ? { ...l, a: l.a * 0.55 } : l)),
  };
}

export const variantById = (id: string, sex: SexId = 'erkek'): Variant => {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  return sex === 'disi' ? femaleOf(v) : v;
};
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
