// Arama sorgusu kurucusu: saf fonksiyon; her değer parametre olarak bağlanır (SQL enjeksiyonu yok).
import { CITIES } from '../shared/cities.ts';
import { OTHER_ID, speciesById } from '../shared/catalog.ts';

export interface SearchParams { species?: string; form?: string; variant?: string; city?: string; minPrice?: string; maxPrice?: string; sort?: string; page?: string | number; userId?: number }
export const PAGE_SIZE = 12;
export const SORTS: Record<string, { ad: string; sql: string }> = {
  yeni: { ad: 'En yeni', sql: 'l.created_at DESC, l.id DESC' },
  ucuz: { ad: 'Fiyat: düşükten yükseğe', sql: 'l.price_kurus ASC, l.id DESC' },
  pahali: { ad: 'Fiyat: yüksekten düşüğe', sql: 'l.price_kurus DESC, l.id DESC' },
};

export interface BuiltSearch { where: string; args: (string | number)[]; orderBy: string; limit: number; offset: number; page: number }

const idOk = (s: unknown, max = 40): s is string => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s) && s.length <= max;

export function priceToKurus(v: unknown): number | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const s = v.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const k = Math.round(parseFloat(s) * 100);
  return Number.isSafeInteger(k) ? k : null;
}

export function buildSearch(p: SearchParams): BuiltSearch {
  const where: string[] = [`l.status = 'active'`];
  const args: (string | number)[] = [];
  if (idOk(p.species) && (p.species === OTHER_ID || speciesById(p.species))) { where.push('l.species_id = ?'); args.push(p.species); }
  if (idOk(p.form)) { where.push('l.form_id = ?'); args.push(p.form); }
  if (idOk(p.variant)) { where.push('l.variant_id = ?'); args.push(p.variant); }
  if (typeof p.city === 'string' && CITIES.includes(p.city)) { where.push('l.city = ?'); args.push(p.city); }
  const min = priceToKurus(p.minPrice), max = priceToKurus(p.maxPrice);
  if (min !== null) { where.push('l.price_kurus >= ?'); args.push(min); }
  if (max !== null) { where.push('l.price_kurus <= ?'); args.push(max); }
  if (typeof p.userId === 'number' && Number.isInteger(p.userId)) { where.push('l.user_id = ?'); args.push(p.userId); }
  const pageN = Math.min(10000, Math.max(1, Math.floor(Number(p.page)) || 1));
  const sort = SORTS[p.sort ?? ''] ?? SORTS.yeni;
  return { where: where.join(' AND '), args, orderBy: sort.sql, limit: PAGE_SIZE, offset: (pageN - 1) * PAGE_SIZE, page: pageN };
}
