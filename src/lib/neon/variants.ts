// Neon tetra renk varyeteleri (şematik yorumlar; saf veri). Yalnızca renk/desen biçimleri: uzun yüzgeçli ("longfin/veiltail") biçim bilerek yoktur.
import type { FinStyle } from '../akvaryum/fishtex';
import { hexToRgb, mixHex, mulberry32, seedOf } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32 };
export type VariantId = string;

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  /** Gövde: sırt, yan (gümüş), karın */
  body: { sirt: string; yan: string; karin: string };
  /** Mavi-yeşil şerit: merkez ve kenar renkleri; boy (0..1 = tam şerit), parıltı */
  serit: { merkez: string; kenar: string; boy: number; parilti: number };
  /** Kırmızı alt yarı (renk, yoğunluk 0..1) */
  kirmizi: { renk: string; yogunluk: number };
  /** Sırtta yansıtıcı parıltılı pullar (0..1) */
  sirtParilti: number;
  eye: { ball: string; iris: string; pupil: string };
  fin: FinStyle;
}

export const VARIANT_GROUPS = ['Doğal görünüm', 'Seçilmiş renk biçimleri'] as const;

const FIN_CLEAR: FinStyle = { stops: [[0, '#d9dfe0', 0.55], [1, '#cfd8da', 0.2]], rays: { n: 16, color: '#9aa5a8', alpha: 0.35 } };

export const VARIANTS: Variant[] = [
  { id: 'normal', grup: VARIANT_GROUPS[0], ad: 'Normal (doğal renk)', dogrulanmali: false,
    aciklama: 'Gözden kuyruk köküne uzanan parlak mavi-yeşil şerit, şeridin altında ve vücudun arka yarısında kırmızı bölge, sırtta zeytin-kahve ton, karında gümüşi beyaz. Şematik yorum: şeridin parıltısı ışığa ve açıya göre değişir.',
    body: { sirt: '#4a4a30', yan: '#a8b0a4', karin: '#e8ece6' }, serit: { merkez: '#1fd0ff', kenar: '#2a7bff', boy: 1, parilti: 1 }, kirmizi: { renk: '#e4202c', yogunluk: 1 }, sirtParilti: 0.1,
    eye: { ball: '#c8ccc4', iris: '#b8a060', pupil: '#050505' }, fin: FIN_CLEAR },
  { id: 'diamond', grup: VARIANT_GROUPS[1], ad: 'Diamond (pırlanta)', dogrulanmali: true,
    aciklama: 'Mavi şeridi başa doğru kısalmış, yalnızca baş bölgesinde bir leke gibi kalan; sırt ve üst yanlarda yansıtıcı, “pırıltılı” pullara sahip biçim olarak anlatılır. Kırmızı bölge sürer. Kaynaklarda tanımı değişir; şematik yorum.',
    body: { sirt: '#4a4a30', yan: '#a8b0a4', karin: '#e8ece6' }, serit: { merkez: '#2fd8ff', kenar: '#3a8cff', boy: 0.2, parilti: 1 }, kirmizi: { renk: '#e4202c', yogunluk: 1 }, sirtParilti: 1,
    eye: { ball: '#c8ccc4', iris: '#b8a060', pupil: '#050505' }, fin: FIN_CLEAR },
  { id: 'gold', grup: VARIANT_GROUPS[1], ad: 'Gold (altın; albino tipi)', dogrulanmali: true,
    aciklama: 'Albino bir biçim olarak anlatılan, sarımsı-altın tonlu soluk gövde; şerit ve kırmızılık belirgin biçimde sönük, gözler pembemsi. Bazı kaynaklarda albinoyla aynı biçim sayılır, bazılarında ayrı; doğrulanmalıdır. Şematik yorum.',
    body: { sirt: '#c6a85c', yan: '#e6d29a', karin: '#f6ecd0' }, serit: { merkez: '#bfe6e2', kenar: '#9cc8d8', boy: 0.9, parilti: 0.3 }, kirmizi: { renk: '#e88a52', yogunluk: 0.4 }, sirtParilti: 0.1,
    eye: { ball: '#d8a090', iris: '#d05a64', pupil: '#3a0a10' }, fin: { stops: [[0, '#efe2b0', 0.55], [1, '#f3e8c0', 0.22]], rays: { n: 16, color: '#c9b070', alpha: 0.35 } } },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}
export const seedFor = (v: Variant, sex: SexId): number => seedOf(`${v.id}:${sex}`);
export const tint = (hex: string, to: string, k: number) => mixHex(hex, to, k);
