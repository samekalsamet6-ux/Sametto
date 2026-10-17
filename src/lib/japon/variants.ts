// Japon balığı (common/comet tek kuyruklu gövde) renk varyeteleri (şematik yorumlar; saf veri).
// Oranda, ryukin, telescope gibi süs biçimleri ve çift kuyruklu biçimler bilerek dahil değildir; yalnızca renk/desen gösterilir.
import type { FinStyle } from '../akvaryum/fishtex';
import { hexToRgb, mulberry32, seedOf } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32 };
export type VariantId = string;
export type Desen = 'duz' | 'sarasa' | 'shubunkin' | 'panda';

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  /** Gövde: sırt, yan, karın */
  body: { sirt: string; yan: string; karin: string };
  desen: Desen;
  /** Desen yamaları (sarasa: kırmızı; shubunkin: kırmızı/turuncu/siyah/mavi; panda: siyah) */
  yamalar: string[];
  /** 0..1 metalik parlaklık (nacreous tiplerde düşük, sedefli) */
  parlak: number;
  /** Sedefimsi (nacreous) pullar: soluk mavi-gri ve yarı saydam */
  sedef: boolean;
  eye: { ball: string; iris: string; pupil: string };
  fin: FinStyle;
  gogus: FinStyle;
}

export const VARIANT_GROUPS = ['Tek renk', 'Çok renkli (desenli)'] as const;

const sol = (base: string, tip: string, ray: string, a = 0.82): FinStyle => ({ stops: [[0, base, a + 0.1], [0.6, base, a - 0.05], [1, tip, a - 0.25]], rays: { n: 20, color: ray, alpha: 0.4 } });
const EYE = { ball: '#15110c', iris: '#b88a3c', pupil: '#000000' };

export const VARIANTS: Variant[] = [
  { id: 'turuncu', grup: VARIANT_GROUPS[0], ad: 'Turuncu (ortak “common” renk)', dogrulanmali: false,
    aciklama: 'En bilinen altın-turuncu renk; gövde metalik parlak, yüzgeçler biraz daha açık ve yarı saydam. Şematik yorum: ton kırmızımsı-turuncudan sarımsı-turuncuya kadar değişir.',
    body: { sirt: '#d8561a', yan: '#f08a22', karin: '#f8c070' }, desen: 'duz', yamalar: [], parlak: 0.7, sedef: false, eye: EYE, fin: sol('#f08a28', '#f8b060', '#b8520a'), gogus: sol('#f4a040', '#fac880', '#b8520a', 0.6) },
  { id: 'kirmizi', grup: VARIANT_GROUPS[0], ad: 'Kırmızı', dogrulanmali: false,
    aciklama: 'Derin kırmızı gövde ve yüzgeçler. Kırmızı ile turuncu arasındaki sınır bireye, beslenmeye ve ışığa göre değişir; şematik yorum.',
    body: { sirt: '#a8160c', yan: '#d4261a', karin: '#ee6a4c' }, desen: 'duz', yamalar: [], parlak: 0.55, sedef: false, eye: EYE, fin: sol('#d02a1c', '#ea6a4a', '#7a0c06'), gogus: sol('#e04a34', '#f08c70', '#7a0c06', 0.6) },
  { id: 'limon', grup: VARIANT_GROUPS[0], ad: 'Sarı / limon', dogrulanmali: true,
    aciklama: 'Limon sarısı, daha soluk bir sarı gövde ve yüzgeçler; kaynaklarda nadir ya da seçilmiş bir renk olarak anılır, ad ve tanım kaynağa göre değişir. Şematik yorum.',
    body: { sirt: '#d4b214', yan: '#f2d62c', karin: '#faea8a' }, desen: 'duz', yamalar: [], parlak: 0.5, sedef: false, eye: EYE, fin: sol('#f2d634', '#faeb94', '#a8900a'), gogus: sol('#f6e060', '#fcf0b0', '#a8900a', 0.6) },
  { id: 'beyaz', grup: VARIANT_GROUPS[0], ad: 'Beyaz', dogrulanmali: false,
    aciklama: 'Süt beyazı, hafif sedefli gövde ve beyaz-saydam yüzgeçler; gözler koyu. Albinodan farklı olarak gözler pigmentlidir; şematik yorum.',
    body: { sirt: '#d4d4d2', yan: '#f2f1ee', karin: '#fbfaf7' }, desen: 'duz', yamalar: [], parlak: 0.35, sedef: false, eye: EYE, fin: sol('#f4f3ef', '#ffffff', '#b8b6ae', 0.7), gogus: sol('#f6f5f1', '#ffffff', '#b8b6ae', 0.5) },
  { id: 'siyah', grup: VARIANT_GROUPS[0], ad: 'Siyah', dogrulanmali: false,
    aciklama: 'Koyu siyah-kahve gövde ve yüzgeçler. Bazı japon balıkları yaşla ya da çevre koşullarıyla renk değiştirir; koyu pigment (melanin) artışı bunlardan biridir. Şematik yorum.',
    body: { sirt: '#07080a', yan: '#14161a', karin: '#2c2824' }, desen: 'duz', yamalar: [], parlak: 0.5, sedef: false, eye: { ball: '#0a0907', iris: '#6a5028', pupil: '#000000' }, fin: sol('#161820', '#34363e', '#050607', 0.85), gogus: sol('#22242c', '#4a4c54', '#050607', 0.6) },
  { id: 'bronz', grup: VARIANT_GROUPS[0], ad: 'Bronz / kahverengi', dogrulanmali: true,
    aciklama: 'Yabani sazan renginde zeytin-bronz, kahverengimsi gövde; yüzgeçler koyu gri-kahve. Gençlerde ve bazı hatlarda görülen bu renk, “common” soyunun doğal rengine yakın anlatılır; adlandırma kaynağa göre değişir. Şematik yorum.',
    body: { sirt: '#4a3c1c', yan: '#8a6e34', karin: '#d6c28a' }, desen: 'duz', yamalar: [], parlak: 0.55, sedef: false, eye: EYE, fin: sol('#7a6232', '#a89058', '#3a2c10', 0.8), gogus: sol('#8c7440', '#bca470', '#3a2c10', 0.55) },
  { id: 'sarasa', grup: VARIANT_GROUPS[1], ad: 'Sarasa (kırmızı-beyaz)', dogrulanmali: false,
    aciklama: 'Beyaz zeminde kırmızı (bazı kaynaklarda turuncu) yamalar; kafa ve sırtta geniş kırmızı alanlar. Sarasa comet adıyla anılan kırmızı-beyaz biçim olarak anlatılır. Yama düzeni bireye göre değişir; şematik yorum.',
    body: { sirt: '#e4e2df', yan: '#f6f4f1', karin: '#fdfcfa' }, desen: 'sarasa', yamalar: ['#d8301c', '#e44a28'], parlak: 0.45, sedef: false, eye: EYE, fin: { stops: [[0, '#f0ede8', 0.85], [0.6, '#f6f4f0', 0.65], [1, '#fafaf8', 0.5]], rays: { n: 20, color: '#c8c4bc', alpha: 0.4 }, speckle: { n: 8, color: '#e03a22', alpha: 0.55, r: [0.03, 0.08], seed: 6 } }, gogus: sol('#f8f6f2', '#ffffff', '#c8c4bc', 0.5) },
  { id: 'shubunkin', grup: VARIANT_GROUPS[1], ad: 'Shubunkin (calico, alaca)', dogrulanmali: false,
    aciklama: 'Sedefli (nacreous), soluk mavi-gri zeminde üst üste binen kırmızı, turuncu, siyah ve mavi yamalardan oluşan “calico” deseni. Pullar sedef gibi yarı saydamdır; London, Bristol vb. gövde biçimleri bu modelde yoktur. Yama düzeni bireye göre değişir; şematik yorum.',
    body: { sirt: '#4f6a86', yan: '#8aa6c0', karin: '#d6dde6' }, desen: 'shubunkin', yamalar: ['#d8301c', '#f08a22', '#101216', '#2e5fb0'], parlak: 0.2, sedef: true, eye: EYE, fin: { stops: [[0, '#bcd0e0', 0.6], [1, '#d4e0ec', 0.28]], rays: { n: 20, color: '#6a7e94', alpha: 0.4 }, speckle: { n: 14, color: '#d8301c', alpha: 0.5, r: [0.02, 0.06], seed: 12 } }, gogus: sol('#cfdce8', '#e8f0f6', '#6a7e94', 0.4) },
  { id: 'panda', grup: VARIANT_GROUPS[1], ad: 'Panda (siyah-beyaz)', dogrulanmali: true,
    aciklama: 'Beyaz zeminde siyah yamalar; bazı kaynaklarda nadir bir renk olarak anılır, oluşumu ve adı kaynağa göre değişir. Yama düzeni bireye göre değişir; şematik yorum.',
    body: { sirt: '#e6e4e0', yan: '#f6f4f1', karin: '#fdfcfa' }, desen: 'panda', yamalar: ['#0c0d10'], parlak: 0.4, sedef: false, eye: EYE, fin: { stops: [[0, '#eeece8', 0.85], [1, '#f8f7f4', 0.55]], rays: { n: 20, color: '#b0aca4', alpha: 0.4 }, speckle: { n: 8, color: '#0c0d10', alpha: 0.6, r: [0.03, 0.07], seed: 8 } }, gogus: sol('#f6f4f0', '#ffffff', '#b0aca4', 0.5) },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}
export const seedFor = (v: Variant, sex: SexId): number => seedOf(`${v.id}:${sex}`);
