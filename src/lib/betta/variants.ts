// Betta renk varyeteleri (şematik yorumlar; saf veri). Hepsi aynı standart "plakat" (kısa yüzgeçli) gövde üzerindedir;
// uzun yüzgeçli biçimler (veiltail, halfmoon, crowntail vb.) bilerek dahil edilmemiştir. Ticaret adları standart değildir.
import type { FinStyle } from '../akvaryum/fishtex';
import { hexToRgb, mixHex, mulberry32, seedOf, type Rgb } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';

export { hexToRgb, mulberry32 };
export type VariantId = string;
export type Desen = 'duz' | 'koi' | 'mermer' | 'kelebek' | 'orkide' | 'ejder' | 'saydam';

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  dogrulanmali: boolean;
  /** Gövde: sırt, yan, karın ve baş tonu */
  body: { sirt: string; yan: string; karin: string; bas: string };
  /** Büyük yüzgeçler (sırt, anal, kuyruk): kökten uca durak listesi */
  fin: FinStyle;
  /** Göğüs yüzgeçleri: genellikle saydam */
  gogus: FinStyle;
  eye: { ball: string; iris: string; pupil: string };
  desen: Desen;
  /** Desen yamaları (koi, mermer) */
  yamalar: string[];
  /** 0..1 metalik/yansıtıcı parlaklık */
  parlak: number;
  /** 0..1 pul kabartması */
  pul: number;
}

export const VARIANT_GROUPS = ['Tek renk', 'Saydam ve soluk', 'Desenli ve çok renkli'] as const;

const clear = (c: string, a = 0.28): FinStyle => ({ stops: [[0, c, a + 0.2], [1, c, a]], rays: { n: 22, color: c, alpha: 0.35 } });
const solid = (base: string, tip: string, ray: string, a = 0.88): FinStyle => ({ stops: [[0, base, a + 0.08], [0.6, mixHex(base, tip, 0.6), a], [1, tip, a - 0.1]], rays: { n: 24, color: ray, alpha: 0.5 } });
const EYE = { ball: '#14110e', iris: '#4a3a24', pupil: '#000000' };

export const VARIANTS: Variant[] = [
  // ---------------- Tek renk ----------------
  { id: 'kirmizi', grup: VARIANT_GROUPS[0], ad: 'Kırmızı', dogrulanmali: false,
    aciklama: 'Gövde ve yüzgeçler koyu kırmızı; pul kenarlarında hafif koyulaşma. Şematik yorum: gerçek kırmızı tonlar bordodan parlak kırmızıya kadar değişir.',
    body: { sirt: '#7a0c18', yan: '#b3121f', karin: '#cf3a44', bas: '#8c0f1b' }, fin: solid('#9a0f1e', '#e2303c', '#5e0510'), gogus: clear('#f0b8b8'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.25, pul: 0.35 },
  { id: 'mavi', grup: VARIANT_GROUPS[0], ad: 'Mavi (kraliyet mavisi)', dogrulanmali: false,
    aciklama: 'Koyu, doygun mavi gövde; yüzgeçlerde daha açık mavi uç. Mavi/turkuaz/çelik tonları arasındaki sınır ticarette belirsizdir; kaynaklarda genetik atamalar da çelişir. Şematik yorum.',
    body: { sirt: '#0b1d6e', yan: '#1740b4', karin: '#3e72dd', bas: '#10268a' }, fin: solid('#13359f', '#4c8cf0', '#0a1c66'), gogus: clear('#b6cdf5'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.6, pul: 0.35 },
  { id: 'celik-mavi', grup: VARIANT_GROUPS[0], ad: 'Çelik mavisi (steel blue)', dogrulanmali: true,
    aciklama: 'Daha gri, soğuk ve soluk mavi; metalik yansımalı. Kaynaklarda “çelik”, “kraliyet” ve “turkuaz” arasındaki ayrım ve genetiği tutarsız anlatılır; şematik yorumdur.',
    body: { sirt: '#2a4c66', yan: '#5a8caa', karin: '#92b8cf', bas: '#2f566f' }, fin: solid('#4c809f', '#a9d2e8', '#274a62', 0.8), gogus: clear('#cfe3ee'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.8, pul: 0.35 },
  { id: 'turkuaz', grup: VARIANT_GROUPS[0], ad: 'Turkuaz (mavi-yeşil)', dogrulanmali: true,
    aciklama: 'Mavi ile yeşil arası, metalik turkuaz parıltılı gövde ve yüzgeçler. Işığa göre mavi ya da yeşile kayar; adlandırma ticarette değişkendir. Şematik yorum.',
    body: { sirt: '#07514f', yan: '#12968c', karin: '#4fc7b8', bas: '#0a5c58' }, fin: solid('#0e857f', '#52d3c1', '#054541', 0.82), gogus: clear('#bfeee6'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.75, pul: 0.35 },
  { id: 'sari', grup: VARIANT_GROUPS[0], ad: 'Sarı (kırmızısız sarı)', dogrulanmali: true,
    aciklama: 'Gövde ve yüzgeçler sarı; kırmızı pigment az ya da yok. “Yellow/non-red” gibi adlarla satılır; kesin tanım satıcıya göre değişir. Şematik yorum.',
    body: { sirt: '#c58f12', yan: '#f0c43a', karin: '#f8e188', bas: '#d9a41e' }, fin: solid('#eebb2c', '#fbe27a', '#b07b0a', 0.85), gogus: clear('#fdf0b4'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.2, pul: 0.3 },

  // ---------------- Saydam ve soluk ----------------
  { id: 'selofan', grup: VARIANT_GROUPS[1], ad: 'Selofan (cellophane)', dogrulanmali: true,
    aciklama: 'Renksiz, açık pembe-beyaz “et” rengi gövde ve saydam yüzgeçler; gözler koyu kalır. Gövde gerçekte yarı saydamdır, burada şematik olarak soluk pembe ve yarı saydam yüzgeçle gösterilmiştir.',
    body: { sirt: '#d9b6ac', yan: '#f1d9d0', karin: '#f8ece6', bas: '#e6c5ba' }, fin: clear('#f2e6e2', 0.22), gogus: clear('#f4eeee', 0.16), eye: { ball: '#1a1511', iris: '#3a2c20', pupil: '#000000' }, desen: 'saydam', yamalar: [], parlak: 0.45, pul: 0.2 },
  { id: 'opak-beyaz', grup: VARIANT_GROUPS[1], ad: 'Opak beyaz', dogrulanmali: true,
    aciklama: 'Sisli, mat süt beyazı gövde ve yüzgeçler; gözler de bulutlu görünebilir. Bazı kaynaklar opak geninin sağlık sorunlarıyla ilişkili olduğunu bildirir (kaynakla doğrulanmalı). Şematik yorum.',
    body: { sirt: '#cfd3dc', yan: '#eceef3', karin: '#f6f7fa', bas: '#dde0e8' }, fin: solid('#e6e9f0', '#f7f8fb', '#b8bdca', 0.82), gogus: clear('#eef0f6', 0.3), eye: { ball: '#3c3d44', iris: '#8e9098', pupil: '#16161a' }, desen: 'duz', yamalar: [], parlak: 0.1, pul: 0.25 },

  // ---------------- Desenli ve çok renkli ----------------
  { id: 'koi', grup: VARIANT_GROUPS[2], ad: 'Koi', dogrulanmali: true,
    aciklama: 'Pembemsi-beyaz gövdede kırmızı ve siyah yamalar (koi sazanını andırır); marble geninin özel bir görünümü olarak anlatılır. Yama düzeni bireye göre tamamen değişir; şematik yorumdur.',
    body: { sirt: '#e7d8d2', yan: '#f6ece6', karin: '#fbf4ef', bas: '#f0e2db' }, fin: { stops: [[0, '#f3e6e0', 0.85], [1, '#fbf2ee', 0.7]], rays: { n: 22, color: '#c9b6ae', alpha: 0.5 }, speckle: { n: 16, color: '#d8281e', alpha: 0.7, r: [0.03, 0.08], seed: 3 } }, gogus: clear('#f7efea'), eye: EYE, desen: 'koi', yamalar: ['#d8281e', '#111111'], parlak: 0.3, pul: 0.3 },
  { id: 'mermer', grup: VARIANT_GROUPS[2], ad: 'Mermer (marble)', dogrulanmali: true,
    aciklama: 'Yüksek kontrastlı leke ve yamalarla kaplı çok renkli gövde ve yüzgeçler; genç yaştan yetişkinliğe renk düzeni değişebilir. Burada mavi zeminde beyaz ve kırmızı yamalar şematik bir örnek olarak gösterilmiştir.',
    body: { sirt: '#12276e', yan: '#2650b8', karin: '#5c82d8', bas: '#1a3690' }, fin: { stops: [[0, '#2347a8', 0.85], [1, '#6c93e0', 0.7]], rays: { n: 24, color: '#122a70', alpha: 0.5 }, speckle: { n: 24, color: '#f2f2f2', alpha: 0.75, r: [0.03, 0.09], seed: 5 } }, gogus: clear('#cbd8f5'), eye: EYE, desen: 'mermer', yamalar: ['#f4f4f4', '#cc2430', '#e8c030'], parlak: 0.5, pul: 0.3 },
  { id: 'kelebek', grup: VARIANT_GROUPS[2], ad: 'Kelebek (butterfly)', dogrulanmali: false,
    aciklama: 'Yüzgeçlerde iç ve dış iki ayrı renkte bant (burada koyu kırmızı iç bant, beyaz-saydam dış bant); gövde tek renk. Desen adı yüzgeç bantlarına dayanır; gövde rengi değişkendir. Şematik yorum.',
    body: { sirt: '#7a0c18', yan: '#b3121f', karin: '#cf3a44', bas: '#8c0f1b' }, fin: { stops: [[0, '#9a0f1e', 0.95], [0.5, '#c11a28', 0.92], [0.56, '#f7f2ee', 0.8], [1, '#f7f2ee', 0.5]], rays: { n: 24, color: '#5e0510', alpha: 0.4 } }, gogus: clear('#f2dede'), eye: EYE, desen: 'kelebek', yamalar: [], parlak: 0.25, pul: 0.35 },
  { id: 'siyah-orkide', grup: VARIANT_GROUPS[2], ad: 'Siyah orkide (black orchid)', dogrulanmali: true,
    aciklama: 'Tamamen siyaha yakın gövde; sırt, anal ve kuyruk yüzgeçlerinde ışınlar arasında ince renkli (burada mor-mavi) vurgular. Bazı kaynaklarda bu ad farklı biçimde kullanılır; şematik yorum.',
    body: { sirt: '#050507', yan: '#111218', karin: '#1c1d26', bas: '#08080b' }, fin: { stops: [[0, '#0a0a10', 0.96], [0.7, '#14141f', 0.9], [1, '#2a2e6c', 0.75]], rays: { n: 24, color: '#4c3a9a', alpha: 0.55 }, speckle: { n: 28, color: '#5a46c8', alpha: 0.45, r: [0.02, 0.05], seed: 11 } }, gogus: clear('#6a6a88', 0.22), eye: { ball: '#0b0a09', iris: '#2c2417', pupil: '#000000' }, desen: 'orkide', yamalar: [], parlak: 0.5, pul: 0.3 },
  { id: 'ejder', grup: VARIANT_GROUPS[2], ad: 'Ejder (dragon scale)', dogrulanmali: true,
    aciklama: 'Kalın, metalik krem-beyaz pullar gövdeyi zırh gibi kaplar; yüzgeçler kırmızı kalır. Pullar baş bölgesine de uzanır. Şematik yorum.',
    body: { sirt: '#9c7f6a', yan: '#e4d3c0', karin: '#f1e6d6', bas: '#cdb8a2' }, fin: solid('#a80f1c', '#e03a3a', '#5c0510', 0.88), gogus: clear('#f2dede'), eye: EYE, desen: 'ejder', yamalar: ['#a80f1c'], parlak: 0.9, pul: 1 },
  { id: 'hardal-gazi', grup: VARIANT_GROUPS[2], ad: 'Hardal gazı (mustard gas)', dogrulanmali: true,
    aciklama: 'Koyu mavi-çelik gövde, sarı-turuncu yüzgeçler. Ad bir hat yetiştirme terimi olarak başlamış, ticarette gevşek kullanılır; birçok “mustard gas” aslında mavi-sarı iki renklidir. Şematik yorum.',
    body: { sirt: '#102a48', yan: '#1f4a78', karin: '#3c6c9a', bas: '#16365a' }, fin: solid('#f0b020', '#f58a1c', '#a85a08', 0.88), gogus: clear('#f6dca0'), eye: EYE, desen: 'duz', yamalar: [], parlak: 0.6, pul: 0.35 },
];

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];

export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((g) => ({ grup: g, items: VARIANTS.filter((v) => v.grup === g) })).filter((g) => g.items.length > 0);
}

/** Dişide renkler daha soluk ve gri-kahveye kayar (saydam/soluk/siyah tipler hariç değişim küçüktür) */
export function sexTone(hex: string, sex: SexId, v: Variant): string {
  if (sex !== 'disi') return hex;
  const k = v.desen === 'saydam' || v.id === 'opak-beyaz' ? 0.1 : v.desen === 'orkide' ? 0.18 : 0.36;
  return mixHex(hex, '#b4a590', k);
}

export const seedFor = (v: Variant, sex: SexId): number => seedOf(`${v.id}:${sex}`);
export type { Rgb };
