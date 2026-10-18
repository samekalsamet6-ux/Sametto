import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, createUser, createListing, getListing, getPhotos, searchListings, addReport, listReports, removeListing, NoPhotoError, addAquariumFish, listAquariumFish, removeAquariumFish, listingsBySeller, type DB } from '../../server/db.ts';
import { validateListing, type ListingInput } from '../../server/validation.ts';

const base = { species: 'lepistes', form: 'delta', variant: 'mozaik', sex: 'erkek', quantity: '3', price: '120', city: 'İstanbul', district: 'Kadıköy', description: 'Sağlıklı, evde üretim balıklar.' };
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
  it('akvaryum balığı satırları (sıra, silme yalnızca sahibine)', () => {
    addAquariumFish(db, uid, { speciesId: 'betta', formId: 'plakat', variantId: 'mavi', sex: 'erkek' });
    const id2 = addAquariumFish(db, uid, { speciesId: 'neon', formId: 'standart', variantId: 'normal', sex: 'disi' });
    const l = listAquariumFish(db, uid);
    expect(l.map((f) => f.species_id)).toEqual(['betta', 'neon']); expect(l[1].position).toBeGreaterThan(l[0].position);
    const other = createUser(db, 'o@b.com', 'x', 'Veli');
    expect(removeAquariumFish(db, other, id2)).toBe(false);
    expect(removeAquariumFish(db, uid, id2)).toBe(true);
    expect(listAquariumFish(db, uid)).toHaveLength(1);
  });
  it('sorgular parametreli: tırnaklı değer sorun çıkarmaz', () => {
    const id = createListing(db, uid, input({ description: "Robert'); DROP TABLE listings;-- açıklama" }), [photo('a')]);
    expect(getListing(db, id)!.description).toContain('DROP TABLE');
    expect(searchListings(db, {}).total).toBe(1);
  });
});

describe('ilçe', () => {
  it('ilçe kaydedilir ve alt dizeyle (büyük/küçük harf duyarsız) aranır; ilçesiz eski satır şehirle bulunur', () => {
    createListing(db, uid, input({ city: 'Ankara', district: 'Çankaya' }), [photo('a')]);
    createListing(db, uid, input({ city: 'Ankara', district: 'Keçiören' }), [photo('b')]);
    db.prepare(`INSERT INTO listings (user_id,title,species_id,sex,quantity,price_kurus,city,description,created_at) VALUES (?,?,?,?,1,100,'Ankara','x',1)`).run(uid, 't', 'betta', 'erkek');
    expect(searchListings(db, { district: 'ÇANK' }).total).toBe(1);
    expect(searchListings(db, { district: 'KEÇİ' }).total).toBe(1);
    expect(searchListings(db, { city: 'Ankara' }).total).toBe(3);
    expect(searchListings(db, { city: 'Ankara', district: 'yok' }).total).toBe(0);
    expect(searchListings(db, { district: "' OR 1=1 --" }).total).toBe(0);
  });
});

describe('ilçe geçişi', () => {
  it('sütunu olmayan eski veritabanı açılışta yükseltilir, veri korunur, district NULL kalır', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const { mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const path = await import('node:path');
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'ilan-mig-')), 'old.db');
    const old = new DatabaseSync(file);
    old.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, display_name TEXT NOT NULL, whatsapp TEXT, phone TEXT, is_demo INTEGER NOT NULL DEFAULT 0, is_admin INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
      CREATE TABLE listings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, species_id TEXT NOT NULL, species_other TEXT, form_id TEXT, variant_id TEXT, sex TEXT NOT NULL, quantity INTEGER NOT NULL, price_kurus INTEGER NOT NULL, city TEXT NOT NULL, description TEXT NOT NULL, is_demo INTEGER NOT NULL DEFAULT 0, flagged INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at INTEGER NOT NULL);
      INSERT INTO users (email,password_hash,display_name,created_at) VALUES ('o@o.com','x','Eski',1);
      INSERT INTO listings (user_id,title,species_id,sex,quantity,price_kurus,city,description,created_at) VALUES (1,'Eski ilan','betta','erkek',1,100,'Bursa','açıklama',1);`);
    old.close();
    const mdb = openDb(file);
    const row = mdb.prepare('SELECT title, city, district FROM listings').get() as { title: string; city: string; district: string | null };
    expect(row).toEqual({ title: 'Eski ilan', city: 'Bursa', district: null });
    expect(searchListings(mdb, { city: 'Bursa' }).total).toBe(1);
    mdb.close(); openDb(file).close(); // ikinci açılış hata vermez (idempotent)
  });
});
