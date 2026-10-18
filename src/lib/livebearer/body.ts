// Canlı doğuran balıklar (lepistes, molly, plati) için ortak, SAF gövde biçimlendirme.
// Gövde zarfı (envelope) tepe noktası ve uçları belirler; burada ona doğal bir balık gövdesinin ince ayrıntıları eklenir:
// alın eğimi ve ensede hafif çukur, sırtta kambur, çenede düz boğaz hattı, solungaç kapağı şişkinliği, sırtta daralan ve
// yanlarda daha düz kesit ve yuvarlak kuyruk sapı kapanışı. DOM ve three.js yoktur.

export interface BodyShape {
  /** Ensede (baş-sırt geçişi) sırt çizgisinin çukur derinliği (0..~0.15) */
  nape: number;
  /** Sırt kamburu (gövde ortasında sırt çizgisinin ek yüksekliği) */
  back: number;
  /** Boğaz/çene altının düzleşmesi */
  throat: number;
  /** Burun ucunun sivriliği (0 = küt, 1 = çok sivri) */
  snout: number;
  /** Solungaç kapağının dışarı şişkinliği (genişlik oranı) */
  gill: number;
  /** Kesit yanlarının düzleşmesi (0 = elips) ve sırt sırtının daralması */
  flank: number;
  ridge: number;
}

export const DEFAULT_SHAPE: BodyShape = { nape: 0.06, back: 0.03, throat: 0.1, snout: 0.5, gill: 0.04, flank: 0.12, ridge: 0.16 };

const g = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ss = (a: number, b: number, x: number) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

export interface ShapeMul { up: number; down: number; w: number }

/** t boyunca sırt/karın/genişlik çarpanları (1 civarı); zarfı ve belly tümseğini bozmaz. */
export function bodyShape(t: number, s: Partial<BodyShape> | undefined): ShapeMul {
  const p = { ...DEFAULT_SHAPE, ...s };
  const snout = 1 - 0.3 * p.snout * (1 - ss(0, 0.11, t));
  const up = snout * (1 - p.nape * g(t, 0.175, 0.05) + p.back * g(t, 0.4, 0.12));
  const down = (1 - 0.28 * p.snout * 0.5 * (1 - ss(0, 0.09, t))) * (1 - p.throat * g(t, 0.075, 0.07));
  const w = (0.72 + 0.28 * ss(0, 0.1, t)) * (1 + p.gill * ss(0.15, 0.225, t) * (1 - ss(0.265, 0.33, t)));
  return { up, down, w };
}

/** Halka açısı a (0 karın, π/2 +z yan, π sırt) için yanal çıkıntı: düz yanlar, daralan sırt. */
export function flankProfile(a: number, s: Partial<BodyShape> | undefined): number {
  const p = { ...DEFAULT_SHAPE, ...s };
  const sn = Math.sin(a);
  const k = Math.sign(sn) * Math.pow(Math.abs(sn), 1 - p.flank);
  const back = Math.max(0, -Math.cos(a));
  return k * (1 - p.ridge * back * back);
}
