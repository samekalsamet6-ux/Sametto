// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) ayrıdır: bkz. forms.ts.
// Göz çubuğu, gövde lekesi, parlak benekler ve sırt yüzgeci renkleri ortak boyayıcıdan sonra paint.ts içinde çizilir (STYLES, kimliklerle eşleşir).
// Kaynaklarda tutarsız tanımlanan kayıtlar "dogrulanmali" ile işaretlidir. Boyanmış / enjekte edilmiş balıklar kapsam dışıdır.
// "Bolivya ramı" (Mikrogeophagus altispinosus) AYRI bir türdür ve burada modellenmez.
// Erkek tanımlıdır; dişi, erkeğin renginin karın bölgesinde pembemsi, biraz daha soluk türevidir (variantById(id, 'disi')).
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;

export const VARIANT_GROUPS = ['Doğal görünüm', 'Seçilmiş hatlar'] as const;

const CLEAR = { renk: '#d8e2ea', isin: '#7f93a8', a: 0.2 };
const REDEYE = { iris: '#c8231e', halka: '#14090a', pupil: '#020202' };

export const VARIANTS: Variant[] = [
  { id: 'normal', grup: VARIANT_GROUPS[0], ad: 'Normal (yabani tip / “German blue”)', dogrulanmali: false,
    aciklama: 'Doğadaki ve “German blue ram” adıyla satılan klasik görünüm: sarımsı-zeytin gövde, sarı–turuncu baş ve göğüs, gözden geçen siyah çubuk, gövde ortasında siyah leke, yanlarda ve alında parlak mavi benekler, ilk sırt ışınları siyah ve kırmızı kenarlı, kırmızı göz. Şematik yorum; “German blue” aslında uzun süredir ticari olarak üretilen, yaban tipe yakın bir hat adıdır.',
    govde: { sirt: '#55502a', orta: '#cdb85c', karin: '#f0dc8c' }, yuzgec: CLEAR, iplik: '#1d2a44', goz: REDEYE, parlak: 0.8, katmanlar: [] },
  { id: 'gold', grup: VARIANT_GROUPS[1], ad: 'Altın (Gold ram)', dogrulanmali: true,
    aciklama: 'Siyah pigmenti azalmış (xanthic) altın-sarı hat; gövde parlak altın, benekler soluk mavi–beyaz, göz çubuğu ve gövde lekesi silik ya da kısmen kalır, göz kırmızıdır. Kaynaklarda “gold” ve “electric blue” hatları birbirine yakın anılır; sınır ve adlandırma tutarsızdır, kaynakla doğrulanmalı.',
    govde: { sirt: '#cfa535', orta: '#eacb55', karin: '#f8e8a0' }, yuzgec: { renk: '#f2ebc8', isin: '#c9ab55', a: 0.2 }, iplik: '#e9d27a', goz: REDEYE, parlak: 0.85, katmanlar: [] },
  { id: 'elektrik', grup: VARIANT_GROUPS[1], ad: 'Elektrik mavisi (Electric blue)', dogrulanmali: true,
    aciklama: 'Gövdesi daha doygun, neredeyse tek tonlu parlak mavi görünen hat olarak satılır; baş sarımsı kalır, gövde lekesi silik, siyah çubuk zayıftır. Adlandırma tutarsızdır: bazı kaynaklar bunu altın hatla aynı kümede anar, bazı satıcılar farklı bireyler için kullanır. Şematik yorum; kaynakla doğrulanmalı.',
    govde: { sirt: '#1c3c92', orta: '#3b78d6', karin: '#8fbcee' }, yuzgec: { renk: '#b6d0ee', isin: '#3d63a8', a: 0.22 }, iplik: '#1a2e64', goz: REDEYE, parlak: 0.95, katmanlar: [] },
  { id: 'siyah', grup: VARIANT_GROUPS[1], ad: 'Siyah (Black ram)', dogrulanmali: true,
    aciklama: 'Koyu, melaninden zengin (melanistik) görünümlü hat; gövde siyaha yakın, benekler soluk mavi, çubuk ve leke fark edilmez. Ticarette “black” adıyla geçer; kalıtımı ve adlandırması kaynaklarda net değildir, kaynakla doğrulanmalı.',
    govde: { sirt: '#0a0a0f', orta: '#23232b', karin: '#43424c' }, yuzgec: { renk: '#3a3b4a', isin: '#17171f', a: 0.34 }, iplik: '#10101a', goz: { iris: '#b02420', halka: '#0a0505', pupil: '#020202' }, parlak: 0.7, katmanlar: [] },
  { id: 'albino', grup: VARIANT_GROUPS[1], ad: 'Albino', dogrulanmali: true,
    aciklama: 'Koyu pigmenti (melanin) eksik; krem–şeftali gövde, siyah çubuk ve leke yok, kırmızı–pembe göz, açık turuncu sırt kenarı. Hobi kaynaklarında anılır; adlandırması tutarsız olabilir, kaynakla doğrulanmalı.',
    govde: { sirt: '#f1dba6', orta: '#f9e8bc', karin: '#fff5dc' }, yuzgec: { renk: '#fcf0dc', isin: '#e2b08a', a: 0.2 }, iplik: '#f1ccaa', goz: { iris: '#e0343e', halka: '#b02a3a', pupil: '#4a0a14' }, parlak: 0.55, katmanlar: [] },
];

const mix = (a: string, b: string, k: number): string => {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * k) * 255).toString(16).padStart(2, '0')).join('');
};

/** Dişi: biraz daha soluk, karın bölgesi sıcak (pembemsi) tonlu; pembe karın lekesi paint.ts'te çizilir */
export function femaleOf(v: Variant): Variant {
  return { ...v, govde: { sirt: v.govde.sirt, orta: mix(v.govde.orta, '#e8c8b0', 0.1), karin: mix(v.govde.karin, '#f6d4c4', 0.3) } };
}

export const variantById = (id: string, sex: SexId = 'erkek'): Variant => {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  return sex === 'disi' ? femaleOf(v) : v;
};
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
