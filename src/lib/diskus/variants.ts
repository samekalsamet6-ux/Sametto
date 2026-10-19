// Renk / desen varyeteleri (şematik yorumlar; saf veri). Hepsi aynı standart (daire biçimli) gövde üzerinde gösterilir.
// Diskus ticaret adları standart değildir: aynı ad farklı satıcılarda farklı hatlar için kullanılabilir ve çoğu hat melezdir.
// Adı ya da tarifi belirsiz kayıtlar "dogrulanmali" ile işaretlenmiştir.
import { groupedVariants as groupBy, hexToRgb, mulberry32, seedFor, type FishVariant } from '../akvaryum/yanal-model';

export { hexToRgb, mulberry32, seedFor };
export type Variant = FishVariant;
export type VariantId = string;

export const VARIANT_GROUPS = ['Yabani tipler', 'Mavi ve turkuaz hatlar', 'Kırmızı ve turuncu hatlar', 'Desenli hatlar', 'Açık ve albino hatlar'] as const;

const GOZ = { iris: '#d8322a', halka: '#3a0e0a', pupil: '#050303' };
// Dikey bantlar ve turkuaz dalgalı çizgiler katman olarak değil, hat başına desen tablosuyla (paint.ts: PATTERNS) boyanır.

export const VARIANTS: Variant[] = [
  // ---------------- Yabani tipler
  { id: 'heckel', grup: VARIANT_GROUPS[0], ad: 'Heckel tipi (yabani, belirgin orta bant)', dogrulanmali: true,
    aciklama: 'Kırmızımsı kahve–turuncu zemin, başta ve karında ince turkuaz çizgiler; ortadaki (5.) koyu bant geniş ve belirgin. Yabani diskus türleri arasındaki ayrım ve adlandırma tartışmalıdır; bu yüzden tür adı kaynakla doğrulanmalıdır.',
    govde: { sirt: '#7a3a22', orta: '#b8643a', karin: '#d9946a' }, yuzgec: { renk: '#b44a2c', isin: '#e0805a', a: 0.6 }, iplik: '#cf7e56', goz: GOZ, parlak: 0.3,
    katmanlar: [] },
  { id: 'kahverengi', grup: VARIANT_GROUPS[0], ad: 'Yabani kahverengi', dogrulanmali: false,
    aciklama: 'Kahverengi–bej zemin, dokuz silik dikey bant ve başta/karında seyrek turkuaz çizgiler. Yabani formlarda kahverengi ton sudaki taninlere bağlı olarak değişir.',
    govde: { sirt: '#7e5328', orta: '#b88652', karin: '#dcc094' }, yuzgec: { renk: '#a56a3a', isin: '#d29a62', a: 0.6 }, iplik: '#c99468', goz: GOZ, parlak: 0.25,
    katmanlar: [] },
  { id: 'yabani-yesil', grup: VARIANT_GROUPS[0], ad: 'Yabani yeşil', dogrulanmali: true,
    aciklama: 'Zeytin–yeşilimsi zemin, gövdeye yayılmış yeşil–turkuaz çizgiler ve silik bantlar. “Yeşil” ad bu formu tarif etmek için kullanılır; sınıflaması ve adı kaynaklarda değişir.',
    govde: { sirt: '#5e6030', orta: '#989650', karin: '#c9c58a' }, yuzgec: { renk: '#7a7e46', isin: '#b8c08a', a: 0.6 }, iplik: '#b5b87c', goz: GOZ, parlak: 0.35,
    katmanlar: [] },

  // ---------------- Mavi / turkuaz
  { id: 'royal-blue', grup: VARIANT_GROUPS[1], ad: 'Royal blue', dogrulanmali: true,
    aciklama: 'Mavi–turkuaz zemin üzerinde gövde boyunca yoğun, neredeyse kesintisiz yatay turkuaz çizgiler. “Royal blue” adı farklı hatlar için kullanılır; belirli bir standardı yoktur.',
    govde: { sirt: '#1f5878', orta: '#3f9bb0', karin: '#a6d6d8' }, yuzgec: { renk: '#2a86a2', isin: '#5be0e8', a: 0.62 }, iplik: '#78bcc8', goz: GOZ, parlak: 0.75,
    katmanlar: [] },
  { id: 'blue-diamond', grup: VARIANT_GROUPS[1], ad: 'Blue diamond', dogrulanmali: false,
    aciklama: 'Neredeyse bantsız, parlak turkuaz–mavi gövde; koyu bantlar seçmeyle bastırılmıştır. Renk yoğunluğu ve çizgilerin miktarı bireyde değişir.',
    govde: { sirt: '#1992ac', orta: '#46c6d4', karin: '#a2e6ec' }, yuzgec: { renk: '#2fb4c8', isin: '#8af0f4', a: 0.62 }, iplik: '#7cd8e0', goz: GOZ, parlak: 0.95,
    katmanlar: [] },
  { id: 'kobalt', grup: VARIANT_GROUPS[1], ad: 'Kobalt (Cobalt)', dogrulanmali: false,
    aciklama: 'Derin kobalt–lacivert zemin, silik dikey bantlar ve açık mavi çizgiler. Bantlar “blue diamond”a göre daha çok korunmuş olabilir.',
    govde: { sirt: '#12336e', orta: '#285fae', karin: '#6c98d6' }, yuzgec: { renk: '#2858a6', isin: '#6aa2f0', a: 0.62 }, iplik: '#6b94d0', goz: GOZ, parlak: 0.85,
    katmanlar: [] },

  // ---------------- Kırmızı / turuncu
  { id: 'kirmizi-turkuaz', grup: VARIANT_GROUPS[2], ad: 'Kırmızı turkuaz (Red turquoise)', dogrulanmali: false,
    aciklama: 'Kırmızı zemin üzerinde gövde ve yüzgeçlerde yoğun yatay turkuaz çizgiler. Kırmızı ve turkuaz oranı bireyden bireye çok değişir.',
    govde: { sirt: '#a02418', orta: '#d4452a', karin: '#f08a68' }, yuzgec: { renk: '#c4301c', isin: '#46d8dc', a: 0.65 }, iplik: '#e8785a', goz: GOZ, parlak: 0.7,
    katmanlar: [] },
  { id: 'red-melon', grup: VARIANT_GROUPS[2], ad: 'Red melon', dogrulanmali: true,
    aciklama: 'Parlak turuncu–kırmızı, neredeyse bantsız gövde; yüzgeç ve baş kenarlarında az sayıda turkuaz çizgi. Bu ad satıcılar arasında farklı hatlar için kullanılır, doğrulanmalıdır.',
    govde: { sirt: '#c63818', orta: '#ee6a30', karin: '#f9a878' }, yuzgec: { renk: '#e04c24', isin: '#f0a070', a: 0.65 }, iplik: '#f5986a', goz: GOZ, parlak: 0.6,
    katmanlar: [] },
  { id: 'pigeon-blood', grup: VARIANT_GROUPS[2], ad: 'Pigeon blood', dogrulanmali: false,
    aciklama: 'Krem–şeftali zemin, sırtta turuncu–kırmızımsı ton, bantlar bastırılmış, kırmızı göz ve yüzgeçlerde/sırtta birkaç koyu benek. Ad, güvercin kanı rengini andırdığı için verilmiştir.',
    govde: { sirt: '#e08a56', orta: '#f1c192', karin: '#fbe6cf' }, yuzgec: { renk: '#f5ad78', isin: '#d9764a', a: 0.72 }, iplik: '#f0b88a', goz: { iris: '#e0303a', halka: '#7a1824', pupil: '#2a0508' }, parlak: 0.45,
    katmanlar: [
      { t: 'wash', nx: [0.1, 0.95], ny: [0.0, 0.5], renk: '#e8602a', a: 0.5 },
      { t: 'spot', n: 16, r: [0.007, 0.016], renk: '#201410', a: 0.85, nx: [0.05, 0.6], ny: [0.05, 0.7], fin: true },
    ] },

  // ---------------- Desenli
  { id: 'yilan-derisi', grup: VARIANT_GROUPS[3], ad: 'Yılan derisi (Snakeskin)', dogrulanmali: false,
    aciklama: 'Gövdede yılan derisini andıran, hücreli (ağ biçimli) kırmızı–turuncu çizgiler. Hücre boyutu ve renk, alt hatta göre (ör. kırmızı, mavi) değişir; modelde kırmızı tonlu bir yorum gösterilmiştir.',
    govde: { sirt: '#c0623a', orta: '#eba074', karin: '#f8d8b8' }, yuzgec: { renk: '#e08a58', isin: '#a82c1c', a: 0.62 }, iplik: '#eeb08a', goz: GOZ, parlak: 0.5,
    katmanlar: [{ t: 'cells', renk: '#aa2a1a', a: 0.8, size: 0.075, nx: [0.1, 0.97], ny: [0.04, 0.96], w: 0.008 }] },
  { id: 'leopar', grup: VARIANT_GROUPS[3], ad: 'Leopar (Leopard)', dogrulanmali: false,
    aciklama: 'Turuncu–sarı zemin üzerinde bütün gövdeye yayılmış küçük koyu kırmızı–kahverengi benekler. Benek sıklığı ve büyüklüğü bireyde değişir (halkalı “ring leopard” benekleri bu modelde gösterilmemiştir).',
    govde: { sirt: '#d58f26', orta: '#f1bf62', karin: '#fae2a8' }, yuzgec: { renk: '#f0c070', isin: '#c07a20', a: 0.62 }, iplik: '#f4d494', goz: GOZ, parlak: 0.5,
    katmanlar: [{ t: 'spot', n: 90, r: [0.008, 0.022], renk: '#9a2a10', a: 0.8, nx: [0.05, 0.95], ny: [0.04, 0.96], fin: true }] },
  { id: 'panda', grup: VARIANT_GROUPS[3], ad: 'Panda', dogrulanmali: true,
    aciklama: 'Krem–beyaz zemin üzerinde iri, düzensiz siyah lekeler (panda benzetmesi). “Panda” adı satıcılara göre farklı leke desenleri için kullanılır; doğrulanmalıdır.',
    govde: { sirt: '#ece6d4', orta: '#f6f1e4', karin: '#fbf9f1' }, yuzgec: { renk: '#f0ead8', isin: '#c8c0a8', a: 0.55 }, iplik: '#f6f1e4', goz: GOZ, parlak: 0.5,
    katmanlar: [{ t: 'blotch', n: 5, r: [0.07, 0.16], renk: '#16181a', a: 0.93, nx: [0.1, 0.95], ny: [0.1, 0.9], fin: true }, { t: 'spot', n: 1, r: [0.07, 0.07], renk: '#16181a', a: 0.95, nx: [0.22, 0.22], ny: [0.3, 0.3] }] },

  // ---------------- Açık / albino
  { id: 'albino', grup: VARIANT_GROUPS[4], ad: 'Albino', dogrulanmali: false,
    aciklama: 'Koyu pigment (melanin) yoktur: sarımsı–şeftali gövde, bantsız, kırmızı/pembe göz. Renk tonu hatta göre değişir. Albinolar ışığa daha duyarlı olabilir.',
    govde: { sirt: '#f1d078', orta: '#f7e2a8', karin: '#fdf3d6' }, yuzgec: { renk: '#f7e0a0', isin: '#e6bc70', a: 0.55 }, iplik: '#fbecc2', goz: { iris: '#e8353d', halka: '#a02a38', pupil: '#4a0a14' }, parlak: 0.45,
    katmanlar: [{ t: 'wash', nx: [0.1, 0.9], ny: [0.0, 0.5], renk: '#f0a040', a: 0.25 }] },
  { id: 'altin', grup: VARIANT_GROUPS[4], ad: 'Altın (Golden)', dogrulanmali: false,
    aciklama: 'Bantsız, düz altın–sarı gövde ve yüzgeçler. Ton bireye ve ışığa göre değişir.',
    govde: { sirt: '#d49614', orta: '#efbf3e', karin: '#f9dc84' }, yuzgec: { renk: '#f2c860', isin: '#c8961c', a: 0.58 }, iplik: '#f6d57a', goz: GOZ, parlak: 0.6,
    katmanlar: [] },
  { id: 'beyaz', grup: VARIANT_GROUPS[4], ad: 'Beyaz (White / ghost)', dogrulanmali: true,
    aciklama: 'Sütümsü beyaz–krem, çok silik izli gövde. “White”, “ghost” veya “alpine” gibi adlar satıcıya göre değişir ve aynı hattı göstermez; doğrulanmalıdır.',
    govde: { sirt: '#e4e1d6', orta: '#f2f0ea', karin: '#fbfaf7' }, yuzgec: { renk: '#eeece4', isin: '#c8c4b8', a: 0.5 }, iplik: '#f6f4ee', goz: GOZ, parlak: 0.55,
    katmanlar: [] },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export const groupedVariants = () => groupBy(VARIANTS, VARIANT_GROUPS);
