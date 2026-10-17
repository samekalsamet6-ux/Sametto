// Corydoras renk/desen varyeteleri (şematik yorumlar; saf veri). Hepsi aynı C. aeneus/paleatus tipi gövde üzerinde gösterilir.
// Sterbai tipi desen başka bir türe (C. sterbai) aittir; yalnızca desen/renk örneği olarak verilmiştir. Farklı gövde biçimli türler dahil değildir.
import type { FinStyle } from '../akvaryum/fishtex';
import { hexToRgb, mulberry32, seedOf } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32 };
export type VariantId = string;
export type Desen = 'bronz' | 'albino' | 'benekli' | 'sterbai';

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  /** Gövde: sırt, yan, karın */
  body: { sirt: string; yan: string; karin: string; bas: string };
  desen: Desen;
  /** Desen renkleri: koyu yamalar / açık benekler */
  yama: string;
  benek: string;
  /** Metalik yeşilimsi yan parıltısı rengi (0 = yok) ve şiddeti */
  parilti: { renk: string; yogunluk: number };
  eye: { ball: string; iris: string; pupil: string };
  fin: FinStyle;
  gogus: FinStyle;
  /** Plaka kenarı kabartması 0..1 */
  zirh: number;
}

export const VARIANT_GROUPS = ['Yaygın doğal/ticari renkler', 'Başka türlerin desen tipi'] as const;

const clear = (c: string, a = 0.3): FinStyle => ({ stops: [[0, c, a + 0.25], [1, c, a]], rays: { n: 14, color: c, alpha: 0.4 } });
const EYE_D = { ball: '#14110e', iris: '#6b5a2a', pupil: '#000000' };

export const VARIANTS: Variant[] = [
  { id: 'bronz', grup: VARIANT_GROUPS[0], ad: 'Bronz (C. aeneus normal)', dogrulanmali: false,
    aciklama: 'Metalik bronz-yeşil sırt ve yanlar (yeşilimsi parıltılı), açık pembemsi-krem karın; yüzgeçler saydam ve soluk. Şematik yorum: gerçek tonlar ışığa ve bireye göre kahverengi-bronzdan yeşile kayar.',
    body: { sirt: '#46431f', yan: '#94763a', karin: '#e6cdae', bas: '#6b5a2e' }, desen: 'bronz', yama: '#3e3a22', benek: '#d6b878', parilti: { renk: '#6fb080', yogunluk: 0.6 }, eye: EYE_D, fin: clear('#b9a780', 0.28), gogus: clear('#c4b48c', 0.35), zirh: 0.7 },
  { id: 'albino', grup: VARIANT_GROUPS[0], ad: 'Albino (kırmızı gözlü)', dogrulanmali: false,
    aciklama: 'Pigmentsiz, beyaz-pembe gövde ve saydam yüzgeçler; gözler kırmızı-pembe. Mağazalarda çok yaygın bir C. aeneus biçimi olarak anlatılır; kaynaklara göre gerçekte hangi türden türediği karışık olabilir. Şematik yorum.',
    body: { sirt: '#e9cfc4', yan: '#f6e4dc', karin: '#fbf1ec', bas: '#f0d6cc' }, desen: 'albino', yama: '#dca89c', benek: '#ffffff', parilti: { renk: '#ffffff', yogunluk: 0.25 }, eye: { ball: '#d8a0a0', iris: '#d83a4a', pupil: '#4a0a14' }, fin: clear('#f4e4e0', 0.26), gogus: clear('#f8ecea', 0.3), zirh: 0.55 },
  { id: 'benekli', grup: VARIANT_GROUPS[0], ad: 'Benekli / “peppered” (C. paleatus tipi)', dogrulanmali: false,
    aciklama: 'Zeytin-gri zemin üzerinde koyu, mermer gibi düzensiz lekeler; sırt ve kuyruk yüzgecinde koyu nokta sıraları; açık krem karın. C. paleatus için anlatılan desene dayanan şematik yorumdur; desen bireyden bireye değişir.',
    body: { sirt: '#6a6c4a', yan: '#9a9a70', karin: '#e6dcc0', bas: '#767858' }, desen: 'benekli', yama: '#2c2e1c', benek: '#d4cc9c', parilti: { renk: '#a8b890', yogunluk: 0.2 }, eye: EYE_D,
    fin: { stops: [[0, '#b8b090', 0.5], [1, '#c8c0a0', 0.25]], rays: { n: 14, color: '#3a3c24', alpha: 0.6 }, speckle: { n: 22, color: '#2c2e1c', alpha: 0.7, r: [0.012, 0.03], seed: 9 } }, gogus: clear('#cfc7a4', 0.3), zirh: 0.6 },
  { id: 'sterbai', grup: VARIANT_GROUPS[1], ad: 'Sterbai tipi (koyu zemin, beyaz benekler)', dogrulanmali: true,
    aciklama: 'Koyu kahve-siyah gövde üzerinde baştan kuyruğa sık krem-beyaz benekler, turuncu-sarı göğüs yüzgeçleri. Bu desen başka bir türe (C. sterbai) aittir; burada yalnızca desen örneği olarak, standart gövde üzerinde gösterilmiştir. Şematik yorum.',
    body: { sirt: '#1e1712', yan: '#33261c', karin: '#7a6454', bas: '#2a1f18' }, desen: 'sterbai', yama: '#120d0a', benek: '#f2ead8', parilti: { renk: '#8a7a68', yogunluk: 0.1 }, eye: EYE_D,
    fin: { stops: [[0, '#4a3a2c', 0.8], [1, '#5c4a38', 0.55]], rays: { n: 14, color: '#241a12', alpha: 0.5 }, speckle: { n: 26, color: '#f2ead8', alpha: 0.8, r: [0.01, 0.026], seed: 4 } },
    gogus: { stops: [[0, '#f09a1c', 0.92], [1, '#f6b84a', 0.75]], rays: { n: 14, color: '#b25a08', alpha: 0.5 } }, zirh: 0.6 },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}
export const seedFor = (v: Variant, sex: SexId): number => seedOf(`${v.id}:${sex}`);
