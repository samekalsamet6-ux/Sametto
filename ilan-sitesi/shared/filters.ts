// Liste filtresi için saf yardımcılar: seçili filtre çipleri ve tür değişince şekil/renk daraltma.
import { CATALOG, OTHER_ID, speciesById } from './catalog.ts';
import { normalizeLFilter, gradeById } from './species-fields.ts';

export interface FilterValues { species?: string; form?: string; variant?: string; city?: string; district?: string; minPrice?: string; maxPrice?: string; lnum?: string; grade?: string }
/** `drop`: çip kaldırılınca sorgudan silinecek anahtarlar (URL adlarıyla). Tür kalkınca bağlı şekil ve renk de kalkar. */
export interface FilterChip { key: string; label: string; drop: string[] }

const nonEmpty = (s: string | undefined): s is string => typeof s === 'string' && s.trim() !== '';

export function filterChips(p: FilterValues): FilterChip[] {
  const out: FilterChip[] = [];
  const sp = nonEmpty(p.species) ? speciesById(p.species) : undefined;
  if (nonEmpty(p.species)) out.push({ key: 'tur', label: `Tür: ${p.species === OTHER_ID ? 'Diğer türler' : sp?.ad ?? p.species}`, drop: ['tur', 'sekil', 'renk', 'l', 'grade'] });
  if (nonEmpty(p.form)) out.push({ key: 'sekil', label: `Şekil: ${sp?.forms.find((x) => x.id === p.form)?.ad ?? p.form}`, drop: ['sekil'] });
  if (nonEmpty(p.variant)) out.push({ key: 'renk', label: `Renk: ${sp?.variants.find((x) => x.id === p.variant)?.ad ?? p.variant}`, drop: ['renk'] });
  const ln = normalizeLFilter(p.lnum);
  if (ln) out.push({ key: 'l', label: `L-numarası: ${ln}`, drop: ['l'] });
  const gr = gradeById(p.grade);
  if (gr) out.push({ key: 'grade', label: `Grade: ${gr.ad}`, drop: ['grade'] });
  if (nonEmpty(p.city)) out.push({ key: 'sehir', label: `Şehir: ${p.city}`, drop: ['sehir'] });
  if (nonEmpty(p.district)) out.push({ key: 'ilce', label: `İlçe: ${p.district.trim()}`, drop: ['ilce'] });
  if (nonEmpty(p.minPrice) && nonEmpty(p.maxPrice)) out.push({ key: 'fiyat', label: `Fiyat: ${p.minPrice.trim()}–${p.maxPrice.trim()} ₺`, drop: ['min', 'max'] });
  else if (nonEmpty(p.minPrice)) out.push({ key: 'min', label: `En az ${p.minPrice.trim()} ₺`, drop: ['min'] });
  else if (nonEmpty(p.maxPrice)) out.push({ key: 'max', label: `En çok ${p.maxPrice.trim()} ₺`, drop: ['max'] });
  return out;
}

/** Tür seçilince şekil ve renk seçenekleri o türe daralır; tür yoksa/bilinmiyorsa ikisi de boş (devre dışı). */
export function narrowOptions(speciesId: string): { forms: { id: string; ad: string }[]; variants: { id: string; ad: string }[] } {
  const sp = CATALOG.find((s) => s.id === speciesId);
  return { forms: sp ? sp.forms.map(({ id, ad }) => ({ id, ad })) : [], variants: sp ? sp.variants.map(({ id, ad }) => ({ id, ad })) : [] };
}
