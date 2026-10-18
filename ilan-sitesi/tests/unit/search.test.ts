import { describe, it, expect } from 'vitest';
import { buildSearch, priceToKurus, PAGE_SIZE } from '../../server/search.ts';

describe('buildSearch', () => {
  it('filtresiz: yalnızca aktif ilanlar, en yeni önce', () => {
    const q = buildSearch({});
    expect(q.where).toBe("l.status = 'active'"); expect(q.args).toEqual([]); expect(q.orderBy).toContain('created_at DESC'); expect(q.limit).toBe(PAGE_SIZE); expect(q.offset).toBe(0);
  });
  it('tür, şekil, renk, şehir ve fiyat aralığı parametre olarak bağlanır', () => {
    const q = buildSearch({ species: 'lepistes', form: 'delta', variant: 'mozaik', city: 'İzmir', minPrice: '50', maxPrice: '1.250,50' });
    expect(q.where).toContain('l.species_id = ?'); expect(q.where).toContain('l.price_kurus >= ?'); expect(q.where).toContain('l.price_kurus <= ?');
    expect(q.args).toEqual(['lepistes', 'delta', 'mozaik', 'İzmir', 5000, 125050]);
  });
  it('geçersiz değerler yok sayılır, SQL enjeksiyonu değere girmez', () => {
    const q = buildSearch({ species: "x'; DROP TABLE listings;--", form: 'A B', city: 'Atlantis', minPrice: 'abc', maxPrice: '-1' });
    expect(q.args).toEqual([]); expect(q.where).not.toContain('DROP');
  });
  it('sıralama beyaz liste, sayfalama sınırlı', () => {
    expect(buildSearch({ sort: 'ucuz' }).orderBy).toContain('price_kurus ASC');
    expect(buildSearch({ sort: 'x; DROP' }).orderBy).toContain('created_at DESC');
    expect(buildSearch({ page: 3 }).offset).toBe(2 * PAGE_SIZE);
    expect(buildSearch({ page: -4 }).page).toBe(1); expect(buildSearch({ page: 'abc' }).page).toBe(1);
  });
  it('diğer türü ve satıcı filtresi', () => {
    const q = buildSearch({ species: 'diger', userId: 7 });
    expect(q.args).toEqual(['diger', 7]);
  });
  it('priceToKurus', () => { expect(priceToKurus('10')).toBe(1000); expect(priceToKurus('')).toBeNull(); expect(priceToKurus(undefined)).toBeNull(); });
});
