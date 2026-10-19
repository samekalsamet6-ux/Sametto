// Türe özel, İSTEĞE BAĞLI ilan alanları (katalogdaki şekil/renk eksenlerinden ayrıdır; shared/catalog.json ve src/lib değişmez):
//  - Pleko/Ancistrus ilanı: "L-numarası" (ör. L144), satıcı beyanı.
//  - Neocaridina karidesi ilanı: "Grade" (ticari kalite/renk sınıfı adı), satıcı beyanı.
// Stok kartı eşleşmesi (shared/stock.ts) bu alanları KULLANMAZ.

export const L_SPECIES = 'pleco';
export const GRADE_SPECIES = 'karides'; // Neocaridina karidesi (Amano ayrı türdür: 'amano', grade yok)

/** "L144", "l 144", "L 46" -> "L144", "L46" (1-999). Geçersizse null. Baştaki sıfırlar atılır (L046 -> L46). */
export function normalizeLNumber(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^L\s?(\d{1,3})$/i.exec(v.trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 999 ? 'L' + n : null;
}
/** Filtre için gevşek giriş: "144" da kabul edilir. */
export function normalizeLFilter(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return normalizeLNumber(/^\d{1,3}$/.test(t) ? 'L' + t : t);
}

export interface Grade { id: string; ad: string; /** adlandırma/ayrım kaynaklarda tutarsız: kullanıcıya belirtilir */ dogrulanmali?: boolean }
/** Muhafazakâr liste. Kırmızı hat (Cherry < Sakura < Fire Red < Painted Fire Red), mavi, sarı, turuncu ve diğer yaygın adlar; kaynaklar (perakendeci/hobi) adlarda çelişebilir. */
export const GRADES: Grade[] = [
  { id: 'red-cherry', ad: 'Red Cherry (Cherry grade)' },
  { id: 'sakura', ad: 'Sakura' },
  { id: 'fire-red', ad: 'Fire Red' },
  { id: 'painted-fire-red', ad: 'Painted Fire Red' },
  { id: 'blue-dream', ad: 'Blue Dream' },
  { id: 'blue-velvet', ad: 'Blue Velvet', dogrulanmali: true },
  { id: 'yellow', ad: 'Yellow' },
  { id: 'yellow-goldenback', ad: 'Yellow Golden Back' },
  { id: 'orange-sakura', ad: 'Orange (Orange Sakura / Sunkist)', dogrulanmali: true },
  { id: 'green-jade', ad: 'Green Jade' },
  { id: 'chocolate', ad: 'Chocolate', dogrulanmali: true },
  { id: 'black-rose', ad: 'Black Rose', dogrulanmali: true },
  { id: 'carbon-rili', ad: 'Carbon Rili', dogrulanmali: true },
];
export const GRADE_NOTE = 'Grade adları satıcı ve kaynaklara göre değişebilir; satıcının beyanıdır.';
export const gradeById = (id: unknown): Grade | undefined => (typeof id === 'string' ? GRADES.find((g) => g.id === id) : undefined);
export const gradeLabel = (g: Grade): string => (g.dogrulanmali ? `${g.ad} (adı kaynaklarda tutarsız)` : g.ad);

/** Kartta/detayda gösterilecek kısa rozet metinleri (saf). */
export function specBadges(l: { species_id: string; l_number?: string | null; l_unverified?: number | null; grade?: string | null }): string[] {
  const out: string[] = [];
  if (l.species_id === L_SPECIES) {
    if (l.l_number) out.push(l.l_unverified ? `${l.l_number} (doğrulanmamış)` : l.l_number);
    else if (l.l_unverified) out.push('L-numarası bilinmiyor');
  }
  if (l.species_id === GRADE_SPECIES) { const g = gradeById(l.grade); if (g) out.push(`Grade: ${g.ad}`); }
  return out;
}
