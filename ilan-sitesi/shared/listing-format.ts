// İlan kartı/detayı için saf biçimlendirme işlevleri (sunucu ve testler ortak kullanır).
// Fiyat, satıcının o adet için beyan ettiği TOPLAM tutardır ve öyle saklanır; "tanesi" yalnızca türetilmiş bir gösterimdir.

export const UNIT_NOTE = 'yaklaşık, toplam fiyatın adede bölünmesi';

/** Adet başına fiyat (kuruş, tam sayıya yuvarlanır); adet 1 ya da geçersizse null. */
export function unitPriceKurus(totalKurus: number, quantity: number): number | null {
  if (!Number.isFinite(totalKurus) || !Number.isInteger(quantity) || quantity <= 1) return null;
  return Math.round(totalKurus / quantity);
}

/** Makul yuvarlama: 100 ₺ ve üstü tam liraya, altı kuruşa (en çok 2 hane) yuvarlanır. Örn. 83,33 ₺ -> "83,33 ₺", 166,67 ₺ -> "167 ₺". */
export function unitPriceText(totalKurus: number, quantity: number): string | null {
  const u = unitPriceKurus(totalKurus, quantity);
  if (u === null) return null;
  const kurus = u >= 10000 ? Math.round(u / 100) * 100 : u;
  const s = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: kurus % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(kurus / 100) + ' ₺';
  return s;
}

const DAY = 86_400_000, TR_OFFSET = 3 * 3_600_000; // Türkiye: UTC+3, yaz saati yok
const dayIndex = (ms: number) => Math.floor((ms + TR_OFFSET) / DAY);

/** "bugün", "dün", "N gün önce", "N hafta önce", "N ay önce", "N yıl önce" (takvim günü farkı, Türkiye saati). */
export function relativeDay(createdMs: number, nowMs: number): string {
  const d = dayIndex(nowMs) - dayIndex(createdMs);
  if (d <= 0) return 'bugün';
  if (d === 1) return 'dün';
  if (d < 7) return `${d} gün önce`;
  if (d < 30) return `${Math.floor(d / 7)} hafta önce`;
  if (d < 365) return `${Math.floor(d / 30)} ay önce`;
  return `${Math.floor(d / 365)} yıl önce`;
}

export const absoluteDate = (ms: number): string => new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
