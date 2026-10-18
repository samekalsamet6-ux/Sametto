// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) ayrıdır: bkz. forms.ts.
// Mavi-yeşil ve kırmızı şeritleri ortak boyayıcıdan sonra paint.ts çizer (STRIPES tablosu, kimliklerle eşleşir).
// Kaynaklarda tutarsız tanımlanan kayıtlar "dogrulanmali" ile işaretlidir.
// Boyanmış / enjekte edilmiş / GloFish benzeri floresan balıklar kapsam dışıdır.
// Erkek tanımlıdır; dişi, erkeğin hafif daha dolgun ve gümüşi karınlı türevidir (variantById(id, 'disi')).
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant, type Layer } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;

export const VARIANT_GROUPS = ['Doğal görünüm', 'Seçilmiş hatlar'] as const;

const sheen = (gill: string, belly: string): Layer[] => [
  { t: 'wash', nx: [0.1, 0.3], ny: [0.1, 0.8], renk: gill, a: 0.3 },
  { t: 'wash', nx: [0.25, 0.95], ny: [0.8, 1.05], renk: belly, a: 0.5 },
];

const CLEAR = { renk: '#dfe5e6', isin: '#98a6ae', a: 0.2 };

export const VARIANTS: Variant[] = [
  { id: 'normal', grup: VARIANT_GROUPS[0], ad: 'Normal (yabani tip)', dogrulanmali: false,
    aciklama: 'Doğadaki görünüm: gözden yağ yüzgecine uzanan parlak mavi-yeşil (iridofor) şerit; şeridin altında solungaç kapağından kuyruk köküne gövdenin TÜM boyunca uzanan koyu kırmızı bölge; sırtta zeytin–kahve ton, karında gümüşi beyaz. Şematik yorum: şerit parıltısı ışığa ve açıya göre değişir; yaban popülasyonlar arasında şeridin uzunluğu farklı olabilir.',
    govde: { sirt: '#4a4a30', orta: '#a8b0a4', karin: '#eef0e8' }, yuzgec: CLEAR, iplik: '#cdd3d0',
    goz: { iris: '#bba35f', halka: '#14120e', pupil: '#020202' }, parlak: 0.85,
    katmanlar: sheen('#e8ece6', '#f6f6ee') },
  { id: 'diamond', grup: VARIANT_GROUPS[1], ad: 'Diamond (pırlanta)', dogrulanmali: true,
    aciklama: 'Sırt ve üst yanlarda yansıtıcı, pırıltılı pullar taşıyan seçmeli hat olarak anlatılır; şerit desenleri normalle aynıdır. Ad ve tanım kaynağa göre değişir; şematik yorum, kaynakla doğrulanmalı.',
    govde: { sirt: '#555a3c', orta: '#aeb6ac', karin: '#eef0e8' }, yuzgec: CLEAR, iplik: '#cdd3d0',
    goz: { iris: '#bba35f', halka: '#14120e', pupil: '#020202' }, parlak: 1,
    katmanlar: sheen('#eef2ee', '#f8f8f0') },
  { id: 'gold', grup: VARIANT_GROUPS[1], ad: 'Gold (altın)', dogrulanmali: true,
    aciklama: 'Sırtı daha altın, mavi şeridi belirgin soluk gümüşi–mavi olan; kırmızı şeridi koruyan seçmeli hat olarak anlatılır (ilk kez bir yetiştiricinin ürettiği haberi yapılmıştır). Albino ile karıştırıldığı olur; adlandırma tutarsızdır, kaynakla doğrulanmalı.',
    govde: { sirt: '#b89a48', orta: '#e6d49c', karin: '#f7f0d6' }, yuzgec: { renk: '#f3ecd0', isin: '#c9b070', a: 0.2 }, iplik: '#eadfb8',
    goz: { iris: '#c9a050', halka: '#16130e', pupil: '#020202' }, parlak: 0.8,
    katmanlar: sheen('#fff6d8', '#fffbea') },
  { id: 'albino', grup: VARIANT_GROUPS[1], ad: 'Albino', dogrulanmali: true,
    aciklama: 'Koyu pigmenti (melanin) eksik; beyazımsı–pembemsi, neredeyse saydam gövde, kırmızı gözler. Kaynaklarda bazı bireylerin kırmızı şeridi koruduğu, bazılarında silikleştiği anlatılır; “altın” ile aynı ya da ayrı sayılabilir. Şematik yorum; kaynakla doğrulanmalı.',
    govde: { sirt: '#e8d2c2', orta: '#f6e8dc', karin: '#fff6ec' }, yuzgec: { renk: '#fbf0e6', isin: '#e0b8a0', a: 0.18 }, iplik: '#f0d8c8',
    goz: { iris: '#e0343e', halka: '#b02a3a', pupil: '#4a0a14' }, parlak: 0.6,
    katmanlar: sheen('#fff0e4', '#fffaf2') },
];

const mix = (a: string, b: string, k: number): string => {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * k) * 255).toString(16).padStart(2, '0')).join('');
};

/** Dişi: karın daha gümüşi ve dolgun (zayıf, doğrulanmalı fark) */
export function femaleOf(v: Variant): Variant {
  return {
    ...v,
    govde: { sirt: v.govde.sirt, orta: mix(v.govde.orta, '#dfe4de', 0.2), karin: mix(v.govde.karin, '#fbf6e4', 0.35) },
  };
}

export const variantById = (id: string, sex: SexId = 'erkek'): Variant => {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  return sex === 'disi' ? femaleOf(v) : v;
};
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
