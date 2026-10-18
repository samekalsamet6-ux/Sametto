import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, createUser, createListing, getListing, getPhotos, searchListings, addReport, listReports, removeListing, NoPhotoError, addAquariumFish, listAquariumFish, listingsBySeller, type DB } from '../../server/db.ts';
import { validateListing, type ListingInput } from '../../server/validation.ts';

const base = { species: 'lepistes', form: 'delta', variant: 'mozaik', sex: 'erkek', quantity: '3', price: '120', city: 'İstanbul', description: 'Sağlıklı, evde üretim balıklar.' };
const input = (o: Record<string, string> = {}): ListingInput => validateListing({ ...base, ...o }).value!;
const photo = (n = 'a') => ({ file: `${n.padEnd(32, '0')}.jpg`, mime: 'image/jpeg', bytes: 10 });
let db: DB, uid: number;
beforeEach(() => { db = openDb(':memory:'); uid = createUser(db, 'a@b.com', 'x', 'Ali'); });

describe('ilan oluşturma', () => {
  it('fotoğrafsız ilan veritabanı katmanında reddedilir ve hiçbir satır kalmaz', () => {
    expect(() => createListing(db, uid, input(), [])).toThrow(NoPhotoError);
    expect((db.prepare('SELECT COUNT(*) c FROM listings').get() as { c: number }).c).toBe(0);
  });
  it('5 fotoğraftan fazlası reddedilir', () => {
    expect(() => createListing(db, uid, input(), Array.from({ length: 6 }, (_, i) => photo(String(i))))).toThrow();
  });
  it('ilan ve fotoğraflar birlikte kaydedilir, sıra korunur', () => {
    const id = createListing(db, uid, input(), [photo('a'), photo('b')]);
    const l = getListing(db, id)!;
    expect(l.species_id).toBe('lepistes'); expect(l.price_kurus).toBe(12000); expect(l.first_photo).toContain('a000');
    expect(getPhotos(db, id).map((p) => p.position)).toEqual([0, 1]);
  });
  it('yinelenen dosya adı işlemi geri alır', () => {
    createListing(db, uid, input(), [photo('a')]);
    expect(() => createListing(db, uid, input(), [photo('z'), photo('a')])).toThrow();
    expect((db.prepare('SELECT COUNT(*) c FROM listings').get() as { c: number }).c).toBe(1);
  });
});

describe('arama', () => {
  beforeEach(() => {
    createListing(db, uid, input({ price: '100' }), [photo('a')]);
    createListing(db, uid, input({ species: 'betta', form: 'plakat', variant: 'mavi', price: '300', city: 'Ankara' }), [photo('b')]);
    createListing(db, uid, input({ species: 'betta', form: 'veiltail', variant: 'kirmizi', price: '500', city: 'Ankara' }), [photo('c')]);
  });
  it('tür / şekil / renk / şehir / fiyat filtreleri', () => {
    expect(searchListings(db, { species: 'betta' }).total).toBe(2);
    expect(searchListings(db, { species: 'betta', form: 'plakat' }).total).toBe(1);
    expect(searchListings(db, { variant: 'kirmizi' }).total).toBe(1);
    expect(searchListings(db, { city: 'Ankara' }).total).toBe(2);
    expect(searchListings(db, { minPrice: '200', maxPrice: '400' }).items.map((i) => i.price_kurus)).toEqual([30000]);
    expect(searchListings(db, { sort: 'pahali' }).items[0].price_kurus).toBe(50000);
  });
  it('sonuçlar ilk fotoğrafı içerir', () => { expect(searchListings(db, {}).items.every((i) => !!i.first_photo)).toBe(true); });
  it('satıcıya göre listeleme', () => { expect(listingsBySeller(db, uid)).toHaveLength(3); });
});

describe('şikayet, kaldırma, akvaryum tablosu', () => {
  it('şikayet ilanı işaretler ve listelenir', () => {
    const id = createListing(db, uid, input(), [photo('a')]);
    expect(getListing(db, id)!.flagged).toBe(0);
    addReport(db, id, uid, 'sahte', 'not');
    expect(getListing(db, id)!.flagged).toBe(1);
    expect(listReports(db)).toMatchObject([{ listing_id: id, reason: 'sahte', note: 'not' }]);
  });
  it('yalnızca sahibi kaldırabilir', () => {
    const other = createUser(db, 'c@d.com', 'x', 'Veli');
    const id = createListing(db, uid, input(), [photo('a')]);
    expect(removeListing(db, id, other)).toBeNull();
    expect(removeListing(db, id, uid)).toEqual([photo('a').file]);
    expect(getListing(db, id)).toBeUndefined(); expect(searchListings(db, {}).total).toBe(0);
  });
  it('gelecek aşama: kullanıcı akvaryum balığı satırları', () => {
    addAquariumFish(db, uid, { speciesId: 'betta', formId: 'plakat', variantId: 'mavi', sex: 'erkek' });
    expect(listAquariumFish(db, uid)).toHaveLength(1);
  });
  it('sorgular parametreli: tırnaklı değer sorun çıkarmaz', () => {
    const id = createListing(db, uid, input({ description: "Robert'); DROP TABLE listings;-- açıklama" }), [photo('a')]);
    expect(getListing(db, id)!.description).toContain('DROP TABLE');
    expect(searchListings(db, {}).total).toBe(1);
  });
});
