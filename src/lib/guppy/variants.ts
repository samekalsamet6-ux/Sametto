// Renk varyeteleri (şematik yorumlar) ve yüzgeç renk fonksiyonları (saf).
import type { Sex } from './model';

import { finDetail } from '../livebearer/finpaint';

export type VariantId = string;

export interface Palette { sirt: string; yan: string; karin: string }

/** Gövde deseni katmanları (texture.ts çizer). Konumlar doku oranıdır: x 0=burun…1=kuyruk sapı, y 0=karın…1=sırt. */
export type BodyLayer =
  | { t: 'zemin'; renk: string; a: number }                                              // maske başlangıcından kuyruğa düz renk bloğu (yarı siyah, tek renk zemin)
  | { t: 'blob'; x: number; y: number; rx: number; ry: number; renk: string; a: number } // yumuşak leke (rx, ry piksel)
  | { t: 'leke'; n: number; renkler?: string[]; rx: [number, number]; ry: [number, number]; a: [number, number] } // rastgele yumuşak lekeler (mozaik)
  | { t: 'nokta'; n: number; renk: string; r: [number, number]; a: [number, number] }    // sık keskin noktalar (grass)
  | { t: 'halka'; renk: string; a: number; adim?: number; yaricap?: number }              // pul halkaları (cobra, snakeskin)
  | { t: 'cubuk'; x: number; y: number; rx: number; ry: number; renk: string; a: number } // dikey siyah çubuk (Endler)
  | { t: 'leopar'; n: number; renk: string; ic: string };                                 // halkalı rozet benekler

/** Yüzgeç deseni parametreleri (finColor okur). */
export interface FinDesen {
  nokta?: { esik: number; umin: number; umax: number; guc: number; aEk: number }; // rastgele benek: h > esik
  orta?: boolean;            // orta kısım saydam, kenarlar belirgin (Endler)
  ucKenar?: number;          // u bu değerin ötesinde koyu çerçeve
  cubuk?: boolean;           // kuyrukta dikey koyu çubuklar
}

export interface Variant {
  id: VariantId;
  grup: string;
  ad: string;
  aciklama: string;
  goz: { iris: string; halka: string; pupil: string };
  erkek: Palette;
  disi: Palette;
  yuzgec: { taban: string; uc: string; benek: string; opaklik: number; desen?: FinDesen };
  vurgu: string[];
  desen: BodyLayer[];
  /** [başlangıç, genişlik]: desenin göründüğü bölgenin gövde boyunca başlangıcı ve yumuşak geçiş genişliği (varsayılan [0.3, 0.45]) */
  maske?: [number, number];
  /** 0..1 metalik parlaklık (yalnızca malzeme parlaklığı; geometri değişmez) */
  metal?: number;
  wiki?: string;
}

export const VARIANT_GROUPS = ['Desenli', 'Tek renk', 'Soluk ve metalik', 'Yarı siyah (tuxedo)', 'Moskova'] as const;

const GOZ_ALTIN = { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' };
const GOZ_KOYU = { iris: '#8a6a3a', halka: '#3a2410', pupil: '#020202' };
const DOT = (esik: number, umin: number, umax: number, guc: number, aEk: number): FinDesen => ({ nokta: { esik, umin, umax, guc, aEk } });
const SIYAH_BLOK = (a = 0.95): BodyLayer[] => [{ t: 'zemin', renk: '#08080b', a }];
const SOLID = (vurgu: string): BodyLayer[] => [{ t: 'blob', x: 0.72, y: 0.5, rx: 230, ry: 80, renk: vurgu, a: 0.5 }];

/* Not: tüm tanımlar şematik yorumdur; hobi kaynaklarında adlandırma ve renk tarifleri değişebilir. */
export const VARIANTS: Variant[] = [
  // ---------------- Desenli ----------------
  { id: 'mozaik', grup: 'Desenli', ad: 'Mozaik', aciklama: 'Arka gövde ve kuyrukta parçalı, çok renkli (mavi, yeşil, turuncu) mozaik görünüm. Şematik bir yorumdur; gerçek hatlar çok çeşitlidir.',
    goz: { iris: '#c9a24a', halka: '#7a5a1f', pupil: '#050505' },
    erkek: { sirt: '#25414f', yan: '#5b92a6', karin: '#cfe0df' }, disi: { sirt: '#5d6b5c', yan: '#a3ad9c', karin: '#e3e2d2' },
    yuzgec: { taban: '#1d8fc0', uc: '#6a3fc0', benek: '#101820', opaklik: 0.8, desen: DOT(0.55, 0.12, 0.9, 0.85, 0.2) }, vurgu: ['#2aa6d8', '#1fbf9f', '#f08a24', '#7f5bd6', '#101820'],
    desen: [{ t: 'leke', n: 120, rx: [16, 46], ry: [12, 30], a: [0.5, 0.35] }] },
  { id: 'red-mosaic', grup: 'Desenli', ad: 'Red Mosaic (Kırmızı mozaik)', aciklama: 'Arka gövde ve kuyrukta kırmızı, turuncu ve koyu kırmızı parçalı mozaik; yer yer siyah benekler. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#4a1512', yan: '#b8403a', karin: '#f0cfc0' }, disi: { sirt: '#5f4a45', yan: '#b0988f', karin: '#e8dcd2' },
    yuzgec: { taban: '#c8281e', uc: '#f05a3a', benek: '#2a0a08', opaklik: 0.78, desen: DOT(0.55, 0.12, 0.9, 0.85, 0.2) }, vurgu: ['#d8321f', '#f07a24', '#7a1a14', '#101010', '#e8503a'],
    desen: [{ t: 'leke', n: 120, rx: [16, 46], ry: [12, 30], a: [0.5, 0.35] }] },
  { id: 'cobra', grup: 'Desenli', ad: 'Cobra', aciklama: 'Arka gövdede yılan derisine benzeyen halka/zincir deseni, genelde turuncu–sarı zemin. Şematik yorumdur.',
    goz: { iris: '#d8b04e', halka: '#6b4a14', pupil: '#050505' },
    erkek: { sirt: '#5a3a14', yan: '#d98a2c', karin: '#f1d9a0' }, disi: { sirt: '#6a6354', yan: '#b4aa8c', karin: '#e9e2cc' },
    yuzgec: { taban: '#e8622d', uc: '#f2a65a', benek: '#2a120a', opaklik: 0.66, desen: DOT(0.85, 0, 0.6, 0.8, 0) }, vurgu: ['#101010', '#8c2f12', '#f6c15a'], wiki: 'snakeskin-deseni',
    desen: [{ t: 'zemin', renk: '#d98a2c', a: 0.9 }, { t: 'blob', x: 0.62, y: 0.62, rx: 190, ry: 70, renk: '#f6c15a', a: 0.75 }, { t: 'halka', renk: '#101010', a: 0.62 }] },
  { id: 'red-cobra', grup: 'Desenli', ad: 'Red Cobra (Kırmızı cobra)', aciklama: 'Kırmızı–turuncu zemin üzerinde arka gövdede koyu halka/zincir (yılan derisi) deseni. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#4a1410', yan: '#c8321e', karin: '#f2c6a8' }, disi: { sirt: '#62504a', yan: '#b09a8c', karin: '#e9ddd0' },
    yuzgec: { taban: '#d8321f', uc: '#f27a3a', benek: '#2a0a08', opaklik: 0.74, desen: DOT(0.85, 0, 0.6, 0.8, 0) }, vurgu: ['#101010', '#7a1a10', '#ff9a4a'], wiki: 'snakeskin-deseni',
    desen: [{ t: 'zemin', renk: '#c8321e', a: 0.9 }, { t: 'blob', x: 0.62, y: 0.62, rx: 190, ry: 70, renk: '#ff9a4a', a: 0.7 }, { t: 'halka', renk: '#140806', a: 0.62 }] },
  { id: 'blue-cobra', grup: 'Desenli', ad: 'Blue Cobra (Mavi cobra)', aciklama: 'Mavi zemin üzerinde arka gövdede koyu lacivert halka/zincir (yılan derisi) deseni. Şematik yorumdur.',
    goz: { iris: '#8fb4d0', halka: '#1d3b57', pupil: '#020305' },
    erkek: { sirt: '#0c1e4a', yan: '#2f6fc8', karin: '#b4cdf0' }, disi: { sirt: '#4d5a68', yan: '#8a9cae', karin: '#dde4ea' },
    yuzgec: { taban: '#2060c0', uc: '#6aa0f0', benek: '#050a1e', opaklik: 0.7, desen: DOT(0.85, 0, 0.6, 0.8, 0) }, vurgu: ['#08162e', '#3f74e8', '#8fc0ff'], wiki: 'snakeskin-deseni',
    desen: [{ t: 'zemin', renk: '#2f6fc8', a: 0.9 }, { t: 'blob', x: 0.62, y: 0.62, rx: 190, ry: 70, renk: '#8fc0ff', a: 0.6 }, { t: 'halka', renk: '#08162e', a: 0.62 }] },
  { id: 'blue-grass', grup: 'Desenli', ad: 'Blue Grass', aciklama: 'Gövde ve kuyrukta sık, ince siyah benekli (çim görünümlü) mavi zemin. Şematik yorumdur.',
    goz: { iris: '#6fa2c8', halka: '#1d3b57', pupil: '#020305' },
    erkek: { sirt: '#12285f', yan: '#2753b8', karin: '#a8c4ec' }, disi: { sirt: '#4b5a68', yan: '#8a9cae', karin: '#dde4ea' },
    yuzgec: { taban: '#1f4fb8', uc: '#5d86e0', benek: '#050a1e', opaklik: 0.7, desen: DOT(0.3, 0, 0.78, 0.9, 0.25) }, vurgu: ['#060b22', '#3f74e8', '#7fb0ff'],
    desen: [{ t: 'zemin', renk: '#2753b8', a: 0.9 }, { t: 'blob', x: 0.7, y: 0.5, rx: 210, ry: 80, renk: '#3f74e8', a: 0.8 },
      { t: 'nokta', n: 1800, renk: '#060b22', r: [1.1, 2.1], a: [0.45, 0.5] }, { t: 'leke', n: 60, renkler: ['#9fc4ff'], rx: [10, 18], ry: [8, 10], a: [0.35, 0] }] },
  { id: 'red-grass', grup: 'Desenli', ad: 'Red Grass (Kırmızı grass)', aciklama: 'Kırmızı zemin üzerinde gövde ve kuyrukta sık, ince koyu benekler (çim görünümü). Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#4a1010', yan: '#b8281e', karin: '#f0c4b0' }, disi: { sirt: '#5f4a45', yan: '#ae968c', karin: '#e8dcd2' },
    yuzgec: { taban: '#b82418', uc: '#e8503a', benek: '#2a0606', opaklik: 0.72, desen: DOT(0.3, 0, 0.78, 0.9, 0.25) }, vurgu: ['#2a0606', '#e8503a', '#ff9a80'],
    desen: [{ t: 'zemin', renk: '#b8281e', a: 0.9 }, { t: 'blob', x: 0.7, y: 0.5, rx: 210, ry: 80, renk: '#e8503a', a: 0.75 },
      { t: 'nokta', n: 1800, renk: '#2a0606', r: [1.4, 2.2], a: [0.6, 0.4] }, { t: 'leke', n: 60, renkler: ['#ff9a80'], rx: [10, 18], ry: [8, 10], a: [0.3, 0] }] },
  { id: 'green-grass', grup: 'Desenli', ad: 'Green Grass (Yeşil grass)', aciklama: 'Yeşil zemin üzerinde gövde ve kuyrukta sık, ince koyu benekler (çim görünümü). Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#0e3a1a', yan: '#2f9a4a', karin: '#c4e8c0' }, disi: { sirt: '#4d5e4a', yan: '#92a88c', karin: '#dfe6d6' },
    yuzgec: { taban: '#1f8a3a', uc: '#5cc070', benek: '#04210c', opaklik: 0.7, desen: DOT(0.3, 0, 0.78, 0.9, 0.25) }, vurgu: ['#04210c', '#6fd070', '#b8f0a0'],
    desen: [{ t: 'zemin', renk: '#2f9a4a', a: 0.9 }, { t: 'blob', x: 0.7, y: 0.5, rx: 210, ry: 80, renk: '#6fd070', a: 0.7 },
      { t: 'nokta', n: 1800, renk: '#04210c', r: [1.4, 2.2], a: [0.6, 0.4] }, { t: 'leke', n: 60, renkler: ['#b8f0a0'], rx: [10, 18], ry: [8, 10], a: [0.3, 0] }] },
  { id: 'snakeskin', grup: 'Desenli', ad: 'Snakeskin', aciklama: 'Mavi–yeşilimsi zeminde gövdede ve yüzgeçlerde ağ/halka biçiminde ince yılan derisi deseni. Cobra\'dan daha sık ve ince çizilmiş şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#12383a', yan: '#4d9a9a', karin: '#d0e8de' }, disi: { sirt: '#555f5a', yan: '#98a8a0', karin: '#e0e6dc' },
    yuzgec: { taban: '#3a9a9a', uc: '#9ad0c0', benek: '#0a2a30', opaklik: 0.62, desen: DOT(0.42, 0, 0.95, 0.75, 0.1) }, vurgu: ['#0d2a33', '#2f7f86', '#bfe6d8'], wiki: 'snakeskin-deseni',
    desen: [{ t: 'zemin', renk: '#4d9a9a', a: 0.85 }, { t: 'blob', x: 0.62, y: 0.6, rx: 200, ry: 70, renk: '#bfe6d8', a: 0.45 }, { t: 'halka', renk: '#0d2a33', a: 0.7, adim: 26, yaricap: 9.5 }] },
  { id: 'leopard', grup: 'Desenli', ad: 'Leopard', aciklama: 'Altın–turuncu zeminde arka gövde ve kuyrukta koyu, halkalı leopar benekleri (rozetler). Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#5a3a10', yan: '#e0a83c', karin: '#f7e2a8' }, disi: { sirt: '#6b6450', yan: '#bdae88', karin: '#ece4cc' },
    yuzgec: { taban: '#e89a2a', uc: '#f6cc6a', benek: '#2a1408', opaklik: 0.72, desen: DOT(0.45, 0.1, 0.9, 0.85, 0.1) }, vurgu: ['#1a0f06', '#c46a1c', '#f6cc6a'],
    desen: [{ t: 'zemin', renk: '#e0a83c', a: 0.85 }, { t: 'leopar', n: 52, renk: '#1a0f06', ic: '#c46a1c' }] },
  { id: 'koi', grup: 'Desenli', ad: 'Koi', aciklama: 'Beyaz zeminde turuncu–kırmızı ve siyah iri lekeler (koi balığı görünümü). Şematik yorumdur; gerçek leke dağılımı bireyden bireye değişir.',
    goz: { iris: '#d8b04e', halka: '#6b4a14', pupil: '#050505' },
    erkek: { sirt: '#d8d2c6', yan: '#f6f1e6', karin: '#ffffff' }, disi: { sirt: '#d4cfc4', yan: '#ece8de', karin: '#faf8f2' },
    yuzgec: { taban: '#f3a060', uc: '#fff1de', benek: '#161010', opaklik: 0.66, desen: DOT(0.8, 0.05, 0.9, 0.85, 0.1) }, vurgu: ['#f06a1c', '#d42a14', '#161010'],
    maske: [0.2, 0.25],
    desen: [{ t: 'blob', x: 0.4, y: 0.66, rx: 150, ry: 60, renk: '#f06a1c', a: 0.97 }, { t: 'blob', x: 0.6, y: 0.36, rx: 120, ry: 52, renk: '#d42a14', a: 0.95 },
      { t: 'blob', x: 0.8, y: 0.66, rx: 140, ry: 56, renk: '#f06a1c', a: 0.97 }, { t: 'blob', x: 0.55, y: 0.8, rx: 80, ry: 36, renk: '#161010', a: 0.92 },
      { t: 'blob', x: 0.9, y: 0.36, rx: 70, ry: 38, renk: '#161010', a: 0.9 }, { t: 'blob', x: 0.7, y: 0.5, rx: 46, ry: 28, renk: '#161010', a: 0.9 }] },
  { id: 'endler', grup: 'Desenli', ad: 'Endler tipi', aciklama: 'Küçük gövdeli türlerde görülenlere benzeyen parlak turuncu–yeşil–siyah desenler (Endler tipi desen; şematik yorum).',
    goz: { iris: '#e0a02a', halka: '#7a4a10', pupil: '#050505' },
    erkek: { sirt: '#3b4a2b', yan: '#7fa05a', karin: '#e9eccb' }, disi: { sirt: '#5e6650', yan: '#a2aa88', karin: '#e8e8d2' },
    yuzgec: { taban: '#ff8a1f', uc: '#ffb35a', benek: '#0a0a0a', opaklik: 0.6, desen: { orta: true, ucKenar: 0.92, cubuk: true } }, vurgu: ['#ff7a12', '#2fd06a', '#0a0a0a', '#35c9e8'],
    desen: [{ t: 'blob', x: 0.62, y: 0.62, rx: 200, ry: 64, renk: '#ff7a12', a: 0.92 }, { t: 'blob', x: 0.8, y: 0.45, rx: 130, ry: 50, renk: '#ff8a1f', a: 0.85 },
      { t: 'blob', x: 0.46, y: 0.8, rx: 120, ry: 36, renk: '#2fd06a', a: 0.75 }, { t: 'blob', x: 0.55, y: 0.32, rx: 150, ry: 36, renk: '#35c9e8', a: 0.5 },
      { t: 'cubuk', x: 0.5, y: 0.7, rx: 9, ry: 0.34, renk: '#0a0a0a', a: 0.78 }, { t: 'cubuk', x: 0.63, y: 0.7, rx: 9, ry: 0.34, renk: '#0a0a0a', a: 0.78 },
      { t: 'cubuk', x: 0.76, y: 0.7, rx: 9, ry: 0.34, renk: '#0a0a0a', a: 0.78 }, { t: 'blob', x: 0.4, y: 0.62, rx: 24, ry: 22, renk: '#0a0a0a', a: 0.85 }] },

  // ---------------- Tek renk ----------------
  { id: 'full-red', grup: 'Tek renk', ad: 'Full Red (Tam kırmızı)', aciklama: 'Gövde ve yüzgeçlerin büyük bölümü koyu–parlak kırmızı; siyah desen yok. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#5c0c10', yan: '#d1222a', karin: '#f2b4a6' }, disi: { sirt: '#6b5a55', yan: '#b59a92', karin: '#e6d8d0' },
    yuzgec: { taban: '#b81420', uc: '#ef3a3a', benek: '#4a0608', opaklik: 0.95 }, vurgu: ['#e8302a', '#8a0c14'], desen: SOLID('#f0443a') },
  { id: 'neon-blue', grup: 'Tek renk', ad: 'Neon Blue (Parlak mavi)', aciklama: 'Parlak, elektrik mavisi gövde ve mavi yüzgeçler; hafif metalik parıltı. Şematik yorumdur.',
    goz: { iris: '#8fb4d0', halka: '#1d3b57', pupil: '#020305' },
    erkek: { sirt: '#06204f', yan: '#1a8cff', karin: '#bfe0ff' }, disi: { sirt: '#4b5a68', yan: '#8aa2b8', karin: '#dde6ee' },
    yuzgec: { taban: '#1a5fe0', uc: '#58b0ff', benek: '#061a48', opaklik: 0.92 }, vurgu: ['#3aa6ff', '#0a3aa8'], metal: 0.25, desen: SOLID('#4db4ff') },
  { id: 'emerald', grup: 'Tek renk', ad: 'Emerald / Yeşil', aciklama: 'Zümrüt yeşili gövde ve yeşil yüzgeçler. Şematik yorumdur; yeşil tonları hatlara göre değişir.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#04311c', yan: '#10a35a', karin: '#c6efd0' }, disi: { sirt: '#4a5e4c', yan: '#8da890', karin: '#dde6d8' },
    yuzgec: { taban: '#0d8a4a', uc: '#52d98a', benek: '#03220f', opaklik: 0.92 }, vurgu: ['#18c070', '#06582c'], metal: 0.2, desen: SOLID('#30d080') },
  { id: 'purple', grup: 'Tek renk', ad: 'Purple (Mor)', aciklama: 'Mor–menekşe gövde ve mor yüzgeçler. Şematik yorumdur; tonu mavimsi ya da kırmızımsı olabilir.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#2a0f52', yan: '#7a3fd0', karin: '#dccaf2' }, disi: { sirt: '#58506a', yan: '#a094b4', karin: '#e4dee8' },
    yuzgec: { taban: '#6a2fc0', uc: '#b07af0', benek: '#1c0a3c', opaklik: 0.92 }, vurgu: ['#9050e8', '#4a1a98'], metal: 0.15, desen: SOLID('#a068f0') },
  { id: 'yellow', grup: 'Tek renk', ad: 'Yellow / Golden (Sarı–altın)', aciklama: 'Sarı–altın gövde ve sarı yüzgeçler; siyah desen yok. Şematik yorumdur.',
    goz: GOZ_KOYU,
    erkek: { sirt: '#7a5410', yan: '#f2c21a', karin: '#fff0b0' }, disi: { sirt: '#6e6446', yan: '#c6b680', karin: '#efe8cc' },
    yuzgec: { taban: '#f5c814', uc: '#ffe680', benek: '#6a4a08', opaklik: 0.9 }, vurgu: ['#ffd428', '#c88a0a'], metal: 0.2, desen: SOLID('#ffd838') },

  // ---------------- Soluk ve metalik ----------------
  { id: 'albino', grup: 'Soluk ve metalik', ad: 'Albino', aciklama: 'Pigment azlığı: soluk krem/pembemsi gövde, saydam açık sarı yüzgeçler ve kırmızımsı göz.',
    goz: { iris: '#d23a3a', halka: '#8a1d24', pupil: '#3a0508' },
    erkek: { sirt: '#e8d9b8', yan: '#f5ead2', karin: '#fff7e6' }, disi: { sirt: '#e6d6b4', yan: '#f3e8d0', karin: '#fff7e8' },
    yuzgec: { taban: '#f7e7b8', uc: '#fbd9c2', benek: '#e7b99a', opaklik: 0.55 }, vurgu: ['#f6d9b0', '#f3c4b0'],
    desen: [{ t: 'blob', x: 0.72, y: 0.55, rx: 240, ry: 90, renk: '#f7dba8', a: 0.6 }, { t: 'blob', x: 0.55, y: 0.2, rx: 160, ry: 50, renk: '#f4c4b2', a: 0.35 }] },
  { id: 'platinum', grup: 'Soluk ve metalik', ad: 'Platinum', aciklama: 'Gümüş–beyaz, metalik parlak gövde ve beyazımsı yüzgeçler. Şematik yorumdur.',
    goz: { iris: '#b8b8b0', halka: '#4a4a46', pupil: '#050505' },
    erkek: { sirt: '#8d949c', yan: '#e6eaee', karin: '#ffffff' }, disi: { sirt: '#8e9298', yan: '#dcdfe2', karin: '#fafafa' },
    yuzgec: { taban: '#dfe6ee', uc: '#ffffff', benek: '#8a929c', opaklik: 0.6 }, vurgu: ['#ffffff', '#c8d0d8'], metal: 0.85,
    desen: [{ t: 'blob', x: 0.7, y: 0.55, rx: 230, ry: 80, renk: '#ffffff', a: 0.5 }] },
  { id: 'blonde', grup: 'Soluk ve metalik', ad: 'Blonde (Sarışın)', aciklama: 'Siyah pigmenti az, açık altın–krem gövde ve koyu göz (albinodan farkı). Şematik yorumdur; yüzgeç rengi hatlara göre değişir.',
    goz: GOZ_KOYU,
    erkek: { sirt: '#9a7430', yan: '#e8c46a', karin: '#fff0c8' }, disi: { sirt: '#a8956a', yan: '#e4d6b0', karin: '#fbf3dc' },
    yuzgec: { taban: '#e8c060', uc: '#ffe39a', benek: '#b88a40', opaklik: 0.75 }, vurgu: ['#f8e0a0', '#e8b860'], metal: 0.2,
    desen: [{ t: 'blob', x: 0.7, y: 0.55, rx: 230, ry: 80, renk: '#f2c850', a: 0.55 }] },
  { id: 'pastel', grup: 'Soluk ve metalik', ad: 'Pastel', aciklama: 'Soluk, yumuşak tonlar: açık mavi–gri gövde, şeftali–lila yüzgeçler. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#7a98b0', yan: '#8cbede', karin: '#e8f2f8' }, disi: { sirt: '#9aa4aa', yan: '#c8d2d8', karin: '#f2f5f6' },
    yuzgec: { taban: '#f8b898', uc: '#d0a8f0', benek: '#9a8aa8', opaklik: 0.78 }, vurgu: ['#f4c4a8', '#c8b0e8', '#a8d4ec'],
    desen: [{ t: 'blob', x: 0.7, y: 0.5, rx: 240, ry: 90, renk: '#f8b898', a: 0.75 }, { t: 'blob', x: 0.55, y: 0.75, rx: 160, ry: 46, renk: '#c8a0f0', a: 0.6 }] },
  { id: 'japan-blue', grup: 'Soluk ve metalik', ad: 'Japan Blue', aciklama: 'Koyu kobalt–kral mavisi gövde ve koyu mavi yüzgeçler, uçlarda koyu kenar. Adlandırma kaynaklara göre değişir; şematik yorumdur.',
    goz: { iris: '#8fb4d0', halka: '#1d3b57', pupil: '#020305' },
    erkek: { sirt: '#0a1c58', yan: '#2c5ccf', karin: '#a8c0f0' }, disi: { sirt: '#4a566a', yan: '#8898b0', karin: '#dce2ec' },
    yuzgec: { taban: '#0f2f9a', uc: '#3f6fe0', benek: '#040a28', opaklik: 0.92, desen: { ucKenar: 0.9 } }, vurgu: ['#2c5ccf', '#0a1c58'], metal: 0.3, desen: SOLID('#3a70e8') },

  // ---------------- Yarı siyah (tuxedo) ----------------
  { id: 'red-tuxedo', grup: 'Yarı siyah (tuxedo)', ad: 'Red Tuxedo (Kırmızı tuxedo)', aciklama: 'Ön gövde açık renk, arka yarı siyah; yüzgeçler kırmızı. Half Black Red ile çok yakın tanımlanır. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#4a3a3a', yan: '#d8c0b4', karin: '#f4e6dc' }, disi: { sirt: '#6a605c', yan: '#c4b8b0', karin: '#eee6de' },
    yuzgec: { taban: '#c81e22', uc: '#ff4a3a', benek: '#2a0608', opaklik: 0.96 }, vurgu: ['#08080b'], maske: [0.5, 0.1], desen: SIYAH_BLOK() },
  { id: 'half-black-blue', grup: 'Yarı siyah (tuxedo)', ad: 'Half Black Blue', aciklama: 'Arka yarı gövde siyah, ön gövde gri–mavimsi; kuyruk ve sırt yüzgeci mavi. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#3a4658', yan: '#b4c6d8', karin: '#eef3f8' }, disi: { sirt: '#5e666e', yan: '#b4bcc4', karin: '#eceff2' },
    yuzgec: { taban: '#0f3aa8', uc: '#4a8cff', benek: '#040a28', opaklik: 0.96 }, vurgu: ['#08080b'], maske: [0.5, 0.1], desen: SIYAH_BLOK() },
  { id: 'half-black-green', grup: 'Yarı siyah (tuxedo)', ad: 'Half Black Green', aciklama: 'Arka yarı gövde siyah, ön gövde gri–yeşilimsi; kuyruk ve sırt yüzgeci yeşil. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#3a4a3c', yan: '#b4ccb8', karin: '#eef5ee' }, disi: { sirt: '#5e685e', yan: '#b4bfb4', karin: '#edf1ed' },
    yuzgec: { taban: '#0d7a3c', uc: '#48d080', benek: '#03200f', opaklik: 0.96 }, vurgu: ['#08080b'], maske: [0.5, 0.1], desen: SIYAH_BLOK() },
  { id: 'half-black-purple', grup: 'Yarı siyah (tuxedo)', ad: 'Half Black Purple', aciklama: 'Arka yarı gövde siyah, ön gövde gri–leylak; kuyruk ve sırt yüzgeci mor. Şematik yorumdur.',
    goz: GOZ_ALTIN,
    erkek: { sirt: '#483a58', yan: '#cbbfd8', karin: '#f3eef8' }, disi: { sirt: '#645e6c', yan: '#bfb8c6', karin: '#eeebf1' },
    yuzgec: { taban: '#5a24b0', uc: '#a870f0', benek: '#1c0a3c', opaklik: 0.96 }, vurgu: ['#08080b'], maske: [0.5, 0.1], desen: SIYAH_BLOK() },

  // ---------------- Moskova ----------------
  { id: 'moscow-black', grup: 'Moskova', ad: 'Moscow Black (Moskova siyahı)', aciklama: 'Gövde ve yüzgeçlerin tamamına yayılmış yoğun siyah, metalik parlak renk. Şematik yorumdur.',
    goz: { iris: '#6a5a3a', halka: '#2a1c0c', pupil: '#000000' },
    erkek: { sirt: '#020203', yan: '#0d0d12', karin: '#2a2a32' }, disi: { sirt: '#26262a', yan: '#46464a', karin: '#78787c' },
    yuzgec: { taban: '#050507', uc: '#26262f', benek: '#000000', opaklik: 0.95 }, vurgu: ['#14141a'], metal: 0.5, desen: [{ t: 'blob', x: 0.7, y: 0.55, rx: 220, ry: 80, renk: '#2a2a38', a: 0.5 }] },
  { id: 'moscow-blue', grup: 'Moskova', ad: 'Moscow Blue (Moskova mavisi)', aciklama: 'Gövde ve yüzgeçlerin tamamı yoğun koyu mavi, metalik parlak (klasik Moskova). Şematik yorumdur.',
    goz: { iris: '#7a8aa0', halka: '#1d2b44', pupil: '#000000' },
    erkek: { sirt: '#050f40', yan: '#1030a8', karin: '#3c58b8' }, disi: { sirt: '#3a4358', yan: '#5a6680', karin: '#8a94aa' },
    yuzgec: { taban: '#0a1f80', uc: '#2a50d0', benek: '#020620', opaklik: 0.95 }, vurgu: ['#1840c8'], metal: 0.55, desen: [{ t: 'blob', x: 0.7, y: 0.55, rx: 220, ry: 80, renk: '#2a5ae0', a: 0.5 }] },
  { id: 'moscow-green', grup: 'Moskova', ad: 'Moscow Green (Moskova yeşili)', aciklama: 'Gövde ve yüzgeçlerin tamamı yoğun koyu yeşil, metalik parlak. Şematik yorumdur.',
    goz: { iris: '#7a9a6a', halka: '#1d3b24', pupil: '#000000' },
    erkek: { sirt: '#03200f', yan: '#0c6a2c', karin: '#3c8a58' }, disi: { sirt: '#3a4a3c', yan: '#5a7060', karin: '#8a9c8c' },
    yuzgec: { taban: '#0a5a28', uc: '#25a050', benek: '#021008', opaklik: 0.95 }, vurgu: ['#12a048'], metal: 0.55, desen: [{ t: 'blob', x: 0.7, y: 0.55, rx: 220, ry: 80, renk: '#20b058', a: 0.5 }] },
];

/** Seçici için gruplanmış liste (grup sırası VARIANT_GROUPS, grup içi sıra VARIANTS). */
export function groupedVariants(): { grup: string; items: Variant[] }[] {
  return VARIANT_GROUPS.map((grup) => ({ grup, items: VARIANTS.filter((v) => v.grup === grup) })).filter((g) => g.items.length > 0);
}

export const variantById = (id: string): Variant => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];

export type RGBA = [number, number, number, number];

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new RangeError(`Geçersiz renk: ${hex}`);
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

export const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Deterministik [0,1) sahte rastgele sayı üreteci */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cellHash = (x: number, y: number): number => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export type FinKind = 'kuyruk' | 'sirt' | 'anal' | 'gogus' | 'karin';

/**
 * Yüzgeç zar rengi. u: 0 taban → 1 uç, s: 0..1 ışınlar arası konum.
 * Dişilerde renkler soluk ve daha saydamdır.
 */
export function finColor(v: Variant, sex: Sex, kind: FinKind, u: number, s: number): RGBA {
  const base = hexToRgb(v.yuzgec.taban);
  const tip = hexToRgb(v.yuzgec.uc);
  const dot = hexToRgb(v.yuzgec.benek);
  let c = mixRgb(base, tip, Math.min(1, Math.max(0, u)));
  let a = v.yuzgec.opaklik * (1 - 0.4 * u * u);
  const big = kind === 'kuyruk' || kind === 'sirt';
  if (big) {
    const GU = 16, GS = 42;
    const gx = Math.floor(u * GU), gy = Math.floor(s * GS);
    const h = cellHash(gx + (v.id.length * 7), gy);
    const sx = ((u * GU) % 1) - 0.5, sy = ((s * GS) % 1) - 0.5;
    const inDot = sx * sx + sy * sy < 0.1;
    const d = v.yuzgec.desen;
    const n = d?.nokta;
    if (n && inDot && h > n.esik && u > n.umin && u < n.umax) { c = mixRgb(c, dot, n.guc); a = Math.min(1, a + n.aEk); }
    if (d?.orta) {
      // orta kısım daha saydam, kenar belirgin
      const edge = Math.abs(s - 0.5) * 2;
      a *= 0.45 + 0.55 * Math.max(edge, u * u);
    }
    if (d && ((d.ucKenar !== undefined && u > d.ucKenar) || (d.cubuk && kind === 'kuyruk' && Math.abs(((u * 6) % 1) - 0.5) < 0.09 && u > 0.35 && u < 0.8))) c = mixRgb(c, dot, 0.85);
  }
  if (sex === 'disi') {
    c = mixRgb(c, mixRgb(hexToRgb('#cfd8d0'), hexToRgb(v.yuzgec.uc), 0.2), 0.72);
    a *= 0.7;
  }
  if (!big) a *= 0.9;
  // gerçekçi zar: ışın demetleri boyunca renk/opaklık dalgalanması, taban pigmenti, uçta şeffaflık
  const [dc, da] = finDetail(c, a, big, u, s, v.id.length * 13 + (kind === 'kuyruk' ? 3 : kind === 'sirt' ? 5 : 1));
  return [dc[0], dc[1], dc[2], da];
}
