// Görünüm düğmelerinin tek biçimli sırası ve etiketleri (three.js içermez; .astro sayfaları da kullanır).
export const STANDARD_VIEWS: { id: string; ad: string }[] = [
  { id: 'yan', ad: 'Yan' }, { id: 'ust', ad: 'Üst' }, { id: 'on', ad: 'Ön' },
  { id: 'arka', ad: 'Arka' }, { id: 'alt', ad: 'Alt' }, { id: 'capraz', ad: 'Çapraz' },
];

/**
 * Bir türün görünüm listesini standart sıra ve etiketlere çevirir; tür listesinde olmayan standart görünümler de eklenir
 * (her türde Alt dahil 6 düğme bulunur). Standart dışı kimlikler korunur ve sona eklenir.
 */
export function standardViews(views: { id: string; ad: string }[] = []): { id: string; ad: string }[] {
  const std = new Set(STANDARD_VIEWS.map((v) => v.id));
  return [...STANDARD_VIEWS, ...views.filter((v) => !std.has(v.id))];
}
