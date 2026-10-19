import { describe, it, expect } from 'vitest';
import { matchesFish, summarizeStock, priceText, formatKurus, parseStock, type StockListing } from '../../shared/stock.ts';
import { formatPrice } from '../../server/validation.ts';

const L = (id: number, o: Partial<StockListing> = {}): StockListing => ({ id, t: 'T' + id, s: 'betta', f: 'plakat', v: 'mavi', x: 'erkek', q: 1, p: 10000, ...o });
const FISH = { species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek' };

describe('stok eşleştirme', () => {
  it('tür + şekil + renk eşleşmeli', () => {
    expect(matchesFish(L(1), FISH)).toBe(true);
    expect(matchesFish(L(1, { s: 'neon' }), FISH)).toBe(false);
    expect(matchesFish(L(1, { f: 'halfmoon' }), FISH)).toBe(false);
    expect(matchesFish(L(1, { v: 'kirmizi' }), FISH)).toBe(false);
    expect(matchesFish(L(1, { s: 'karides', f: '', v: 'kirmizi' }), { species: 'karides', form: '', variant: 'kirmizi', sex: 'bilinmiyor' })).toBe(true);
  });
  it('cinsiyet yalnızca ikisi de belirliyse ve farklıysa eler', () => {
    expect(matchesFish(L(1, { x: 'disi' }), FISH)).toBe(false);
    expect(matchesFish(L(1, { x: 'bilinmiyor' }), FISH)).toBe(true);
    expect(matchesFish(L(1, { x: 'disi' }), { ...FISH, sex: 'bilinmiyor' })).toBe(true);
  });
  it('özet: toplam adet, en düşük/en yüksek fiyat, en çok 3 ilan, kalan sayısı', () => {
    const ls = [L(1, { q: 3, p: 45000 }), L(2, { q: 1, p: 30000 }), L(3, { q: 2, p: 30000 }), L(4, { q: 5, p: 90000 }), L(5, { s: 'neon' })];
    const s = summarizeStock(ls, FISH)!;
    expect(s.count).toBe(4); expect(s.quantity).toBe(11); expect(s.minPrice).toBe(30000); expect(s.maxPrice).toBe(90000);
    expect(s.shown.map((x) => x.id)).toEqual([2, 3, 1]); expect(s.more).toBe(1);
  });
  it('eşleşme yoksa null', () => { expect(summarizeStock([L(1, { s: 'neon' })], FISH)).toBeNull(); expect(summarizeStock([], FISH)).toBeNull(); });
  it('fiyat metni ilan sayfasındaki ifadeyle aynı: adet > 1 ise toplam beyanı, adet başı fiyat türetilmez', () => {
    expect(priceText(L(1, { q: 3, p: 45000 }))).toBe('450 ₺ (toplam, 3 adet için satıcının beyanı)');
    expect(priceText(L(1, { q: 1, p: 45050 }))).toBe('450,50 ₺');
  });
  it('formatKurus sunucudaki formatPrice ile aynıdır', () => { for (const k of [0, 5, 100, 12345, 99999900]) expect(formatKurus(k)).toBe(formatPrice(k)); });
  it('parseStock bozuk girdiyi güvenle boş sayar', () => {
    expect(parseStock('{bozuk')).toEqual([]); expect(parseStock(undefined)).toEqual([]); expect(parseStock('{"a":1}')).toEqual([]);
    expect(parseStock('[{"id":1,"s":"x","q":1,"p":2},{"id":"a"}]')).toHaveLength(1);
  });
});
