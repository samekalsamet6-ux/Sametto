// Renk / desen varyeteleri (şematik yorumlar; saf veri). Şekil (form) ayrıdır: bkz. forms.ts.
// Çizgi/benek desenini ortak boyayıcıdan sonra paint.ts çizer (STRIPES tablosu, kimliklerle eşleşir).
// Kaynaklarda doğrulanamayan ya da adı tutarsız kayıtlar "dogrulanmali" ile işaretlidir.
// GloFish gibi floresan / genetiği değiştirilmiş balıklar kapsam dışıdır.
// Erkek tanımlıdır; dişi, erkeğin çizgi arası daha gümüşi türevidir (variantById(id, 'disi')).
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant, type Layer } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;

export const VARIANT_GROUPS = ['Çizgili ve benekli', 'Açık renkli hatlar'] as const;

/** Solungaç kapağında gümüşi parlaklık, karında gümüşi ışıltı */
const sheen = (gill: string, belly: string): Layer[] => [
  { t: 'wash', nx: [0.1, 0.3], ny: [0.1, 0.8], renk: gill, a: 0.3 },
  { t: 'wash', nx: [0.25, 0.85], ny: [0.78, 1.05], renk: belly, a: 0.4 },
];

export const VARIANTS: Variant[] = [
  { id: 'normal', grup: VARIANT_GROUPS[0], ad: 'Normal (yabani tip, çizgili)', dogrulanmali: false,
    aciklama: 'Doğadaki ve en yaygın ticari biçim: altın–sarı zemin üzerinde solungaç kapağının arkasından kuyruk yüzgecine kesintisiz uzanan koyu mavi yatay çizgiler (şematik olarak beş), gümüşi karın, saydam yüzgeçler. Çizgi sayısı ve kalınlığı bireye göre değişir.',
    govde: { sirt: '#6d7858', orta: '#ecd070', karin: '#f2ecd6' }, yuzgec: { renk: '#dce6ea', isin: '#8fa2b0', a: 0.22 }, iplik: '#c8cdb8',
    goz: { iris: '#c9a948', halka: '#14120e', pupil: '#020202' }, parlak: 0.8,
    katmanlar: sheen('#f4f0d8', '#fff8e0') },
  { id: 'leopar', grup: VARIANT_GROUPS[0], ad: 'Leopar (benekli)', dogrulanmali: false,
    aciklama: 'Çizgilerin yerine gövde ve kuyruk yüzgecinde koyu mavi–siyah benekler taşıyan seçmeli desen (“leopard danio”). Aynı türün (Danio rerio) pigment mutasyonlu hattı olarak anlatılır; eskiden ayrı tür sanılıp Danio frankei adıyla satılmıştır. Benek sayısı ve boyutu bireye göre değişir.',
    govde: { sirt: '#8a8460', orta: '#e9d58f', karin: '#f4efdc' }, yuzgec: { renk: '#e2e8e4', isin: '#a3a89a', a: 0.22 }, iplik: '#cfd2c8',
    goz: { iris: '#c9a948', halka: '#14120e', pupil: '#020202' }, parlak: 0.8,
    katmanlar: sheen('#f6f0d8', '#fff8e0') },
  { id: 'hibrit', grup: VARIANT_GROUPS[0], ad: 'Çizgi–benek karışımı (leopar × zebra)', dogrulanmali: true,
    aciklama: 'Çizgilerin kesik kesik, kısmen benek gibi dağıldığı ara desen olarak anlatılır (çizgili ve leopar hatların melezlenmesiyle). Ticarette adı ve görünümü tutarsızdır; varlığı ve kesin tanımı kaynakla doğrulanmalıdır.',
    govde: { sirt: '#6f7a5a', orta: '#e8cb6c', karin: '#f2ecd6' }, yuzgec: { renk: '#dce6ea', isin: '#8fa2b0', a: 0.22 }, iplik: '#c8cdb8',
    goz: { iris: '#c9a948', halka: '#14120e', pupil: '#020202' }, parlak: 0.8,
    katmanlar: sheen('#f4f0d8', '#fff8e0') },
  { id: 'altin', grup: VARIANT_GROUPS[1], ad: 'Altın (Golden)', dogrulanmali: false,
    aciklama: 'Seçilim yoluyla koyu mavi çizgiler kaybolmuş; altın–sarı ve krem şeritlerden oluşan soluk çizgili hat (“golden zebra danio”). Yüzgeçleri saydam, gözleri koyudur. Albino ile karıştırıldığı olur.',
    govde: { sirt: '#c9a43a', orta: '#f6e6a0', karin: '#fcf5d6' }, yuzgec: { renk: '#f8f0cc', isin: '#d9bf6a', a: 0.2 }, iplik: '#ece0b0',
    goz: { iris: '#d6b24a', halka: '#16130e', pupil: '#020202' }, parlak: 0.85,
    katmanlar: sheen('#fff6d0', '#fffbe8') },
  { id: 'albino', grup: VARIANT_GROUPS[1], ad: 'Albino', dogrulanmali: true,
    aciklama: 'Siyah pigmenti (melanin) eksik; soluk krem–pembemsi gövde, çok silik bej çizgiler ve kırmızı gözler. Bazı satıcılar bu balığa “altın” da der; ad ve görünüm tutarsızdır, kaynakla doğrulanmalıdır.',
    govde: { sirt: '#e2c9a6', orta: '#f6e6c8', karin: '#fff5e4' }, yuzgec: { renk: '#fbf0e0', isin: '#e0b898', a: 0.2 }, iplik: '#f0d6bc',
    goz: { iris: '#e0343e', halka: '#b02a3a', pupil: '#4a0a14' }, parlak: 0.6,
    katmanlar: sheen('#fff0d8', '#fffaf0') },
];

const mix = (a: string, b: string, k: number): string => {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + [0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * k) * 255).toString(16).padStart(2, '0')).join('');
};

/** Dişi: çizgiler arası daha gümüşi, karın gümüşi–sarımsı ve dolgun (zayıf, doğrulanmalı fark) */
export function femaleOf(v: Variant): Variant {
  return {
    ...v,
    govde: { sirt: mix(v.govde.sirt, '#a0a496', 0.2), orta: mix(v.govde.orta, '#d6dbd6', 0.35), karin: mix(v.govde.karin, '#f6ecc8', 0.4) },
    parlak: Math.min(1, (v.parlak ?? 0) * 1.05),
  };
}

export const variantById = (id: string, sex: SexId = 'erkek'): Variant => {
  const v = VARIANTS.find((x) => x.id === id) ?? VARIANTS[0];
  return sex === 'disi' ? femaleOf(v) : v;
};
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
