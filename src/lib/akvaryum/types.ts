// Tüm 3B akvaryum canlıları için ortak sözleşme. Her tür src/lib/<tur>/index.ts içinde
// `export const species: SpeciesModule` olarak bunu sağlar; tek dosyalık uygulama (kayıt defteri) bunları birleştirir.
export type SexId = 'erkek' | 'disi';

export interface SpeciesPart {
  id: string;
  ad: string;
  ozet: string;
  aciklama: string;
  /** Yalnızca bu cinsiyette görünür; yoksa ikisinde de */
  sex?: SexId;
  dogrulanmali?: boolean;
  uyari?: boolean;
  wiki?: string;
}

export interface SpeciesVariant {
  id: string;
  ad: string;
  aciklama: string;
  grup?: string;
  dogrulanmali?: boolean;
}

/**
 * Form (şekil) varyetesi: vücut/yüzgeç/kuyruk geometrisini değiştirir (ör. lepistes: delta, fil kulak, lyretail;
 * betta: plakat, halfmoon, crowntail). Renk varyetesinden bağımsızdır: her form her renkle birleştirilebilir.
 */
export interface SpeciesForm {
  id: string;
  ad: string;
  aciklama: string;
  grup?: string;
  dogrulanmali?: boolean;
}

export interface SpeciesViewerOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  sex: SexId;
  /** Form varyetesi kimliği (SpeciesModule.forms[].id); yoksa standart form */
  form?: string;
  variant: string;
  reducedMotion: boolean;
  onSelect: (id: string | null, fromUser: boolean) => void;
}

export interface SpeciesViewer {
  setSex(s: SexId): void;
  setVariant(v: string): void;
  /** Form (şekil) varyetesini değiştirir; renk varyetesi korunur. */
  setForm?(f: string): void;
  setAutoRotate(on: boolean): void;
  setSwim(on: boolean): void;
  /** Numaralı noktaları aç/kapat. Kapalıyken noktalar görünmez ve tıklanamaz; parça listesi çalışmaya devam eder. */
  setHotspots(on: boolean): void;
  setView(v: string): void;
  zoom(factor: number): void;
  rotate(dTheta: number, dPhi: number): void;
  reset(): void;
  select(id: string | null): void;
  isPartVisible(id: string): boolean;
  dispose(): void;
}

export interface SpeciesView { id: string; ad: string }

/** Ayrıntı düzeyi: 'low' = seyrek ağ, küçük doku, yalnızca gölgelendirici yüzmesi (kalabalık sahne); 'normal' = tam model. */
export type FishLod = 'low' | 'normal';

export interface FishGroupOptions {
  sex: SexId;
  /** Form varyetesi kimliği (SpeciesModule.forms[].id); yoksa standart form */
  form?: string;
  variant: string;
  /** true ise hiç animasyon yok (durağan poz) */
  reducedMotion: boolean;
  lod?: FishLod;
}

/** Bir balığın hafif, renderer'sız 3B nesnesi: bir paylaşımlı sahneye (tek WebGLRenderer) istenen sayıda eklenir. */
export interface FishGroup {
  /** Balık orijinde, burun +X, sırt +Y, gövde uzunluğu ~1 birim; konumlandırma/ölçekleme bu nesne üzerinden yapılır. */
  object: import('three').Object3D;
  /** Yüzme, kuyruk, yüzgeç ve ağız/solungaç animasyonu. swimTime verilirse mutlak yüzme zamanı (sn), yoksa dt biriktirilir. */
  update(dt: number, swimTime?: number): void;
  /** Nesneyi sahneden çıkarır; paylaşımlı geometri/malzeme/doku, son kullanıcı bırakınca (referans sayısı 0) serbest kalır. */
  dispose(): void;
  /** Orijin merkezli, normalleştirilmiş ölçekte kapsayan küre yarıçapı (yüzgeçler dahil). */
  boundingRadius: number;
  /**
   * Saydam yüzgeçlerin balıklar arası doğru sıralanması için: balığın tüm grup düğümlerinin renderOrder'ını ayarlar
   * (three, Group.renderOrder'ı çizim sırasında öncelikli sıralama anahtarı yapar). Uzaktan yakına artan sıra verin;
   * `sortFishGroups` bunu kameraya göre yapar.
   */
  setSortRank(rank: number): void;
  /** Bu balığın çizim bütçesi (aynı anahtarlı balıklar geometri ve dokuyu paylaşır). */
  budget: FishGroupBudget;
}

export interface FishGroupBudget {
  triangles: number;
  drawCalls: number;
  /** Bu balığın kullandığı doku sayısı ve toplam piksel (paylaşımlı; aynı anahtarlı balıklarda tekrar sayılmaz) */
  textures: number;
  texturePixels: number;
  /** Paylaşım anahtarı: tür|form|varyete|cinsiyet|lod */
  key: string;
}

export interface SpeciesModule {
  /** Kısa, URL'ye uygun kimlik: 'lepistes', 'vatoz', 'molly', 'melek', 'karides', ... */
  id: string;
  ad: string;
  latin: string;
  /** Seçicide gösterilen tek cümle */
  kisaAciklama: string;
  /** Cinsiyet seçenekleri; ayrım yoksa tek öğe. Her biri için kısa not */
  sexes: { id: SexId; ad: string; not: string }[];
  /** Kamera görünümleri (düğmeler) */
  views: SpeciesView[];
  /** Tür hakkında dürüstlük/güvenlik notu (şematik, tür kimliği, uyarı vb.) */
  not?: string;
  /** Standart (doğal) form ilk sırada olmalı. Şekil farkı olmayan türlerde tek öğe ya da boş bırakılabilir. */
  forms?: SpeciesForm[];
  partsFor(sex: SexId, form?: string): SpeciesPart[];
  parts: SpeciesPart[];
  variants: SpeciesVariant[];
  createViewer(opts: SpeciesViewerOptions): SpeciesViewer;
  /**
   * İsteğe bağlı, renderer'sız hafif balık nesnesi (paylaşımlı çok balıklı sahne, ör. satıcı akvaryumu için).
   * Tuval, renderer, hotspot ve arayüz içermez; aynı tür/form/varyete/cinsiyet geometri ve dokuyu paylaşır.
   */
  createFishGroup?(opts: FishGroupOptions): FishGroup;
}
