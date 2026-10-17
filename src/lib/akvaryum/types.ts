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
}
