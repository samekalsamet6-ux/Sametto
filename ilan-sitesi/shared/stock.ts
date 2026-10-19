// Satıcının aktif ilanlarından, sahnedeki bir balığa karşılık gelen stok ve fiyat özeti (saf işlev: sunucu ve tarayıcı ortak kullanır).
// Fiyat, ilanda saklandığı gibi gösterilir: ilanın TOPLAM fiyatıdır (adet > 1 ise satıcının o adet için beyanı); adet başına fiyat türetilmez.
export const UNKNOWN = 'bilinmiyor';

/** Sunucunun profil sayfasına koyduğu kısa ilan kaydı */
export interface StockListing { id: number; t: string; s: string; f: string; v: string; x: string; q: number; p: number }
export interface StockFish { species: string; form: string; variant: string; sex: string }
export interface StockSummary { count: number; quantity: number; minPrice: number; maxPrice: number; shown: StockListing[]; more: number }

/** Tür + şekil + renk eşleşmeli; cinsiyet yalnızca ikisi de belirli (erkek/dişi) ve farklıysa eler. */
export function matchesFish(l: StockListing, f: StockFish): boolean {
  if (l.s !== f.species) return false;
  if ((l.f || '') !== (f.form || '')) return false;
  if ((l.v || '') !== (f.variant || '')) return false;
  const known = (x: string) => x && x !== UNKNOWN;
  if (known(l.x) && known(f.sex) && l.x !== f.sex) return false;
  return true;
}

export function summarizeStock(listings: StockListing[], f: StockFish, max = 3): StockSummary | null {
  const m = listings.filter((l) => matchesFish(l, f));
  if (!m.length) return null;
  const sorted = [...m].sort((a, b) => a.p - b.p || a.id - b.id);
  return {
    count: m.length, quantity: m.reduce((s, l) => s + l.q, 0),
    minPrice: sorted[0].p, maxPrice: sorted[sorted.length - 1].p,
    shown: sorted.slice(0, max), more: Math.max(0, m.length - max),
  };
}

/** Sunucudaki formatPrice ile aynı çıktı (kuruş → "1.250 ₺") */
export function formatKurus(kurus: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: kurus % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(kurus / 100) + ' ₺';
}
/** Tek ilanın fiyat metni; ilan sayfasındakiyle aynı ifade */
export const priceText = (l: Pick<StockListing, 'p' | 'q'>): string => formatKurus(l.p) + (l.q > 1 ? ` (toplam, ${l.q} adet için satıcının beyanı)` : '');

export function parseStock(json: string | undefined): StockListing[] {
  try {
    const a = JSON.parse(json ?? '[]');
    if (!Array.isArray(a)) return [];
    return a.filter((x) => x && Number.isInteger(x.id) && typeof x.s === 'string' && Number.isFinite(x.q) && Number.isFinite(x.p)).map((x) => ({ id: x.id, t: String(x.t ?? ''), s: x.s, f: String(x.f ?? ''), v: String(x.v ?? ''), x: String(x.x ?? ''), q: x.q, p: x.p }));
  } catch { return []; }
}
