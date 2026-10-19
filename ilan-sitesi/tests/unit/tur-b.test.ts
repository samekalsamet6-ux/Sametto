// Tur B: türe özel alanlar (L-numarası, Neocaridina grade), ilanı kopyala, toplu giriş/stok, dükkân bilgisi.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readConfig } from '../../server/config.ts';
import { openDb, createListing, getListing, searchListings, listingsBySeller, type DB } from '../../server/db.ts';
import { createApp } from '../../server/app.ts';
import { devAssets } from '../../server/assets.ts';
import { placeholderPng } from '../../server/placeholder.ts';
import { validateListing, validateStockRow, validateShop } from '../../server/validation.ts';
import { normalizeLNumber, normalizeLFilter, GRADES, specBadges } from '../../shared/species-fields.ts';
import { filterChips } from '../../shared/filters.ts';
import { buildSearch } from '../../server/search.ts';
import { summarizeStock } from '../../shared/stock.ts';
import { CATALOG } from '../../shared/catalog.ts';

let server: Server, base: string, db: DB;
beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ilan-b-'));
  const cfg = { ...readConfig({ DATA_DIR: dir } as NodeJS.ProcessEnv), registerMax: 1000 };
  db = openDb(cfg.dbPath);
  const app = createApp(cfg, db, devAssets());
  server = createServer((q, s) => void app.handler(q, s));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

class Client {
  jar = new Map<string, string>();
  async req(p: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers); if (this.jar.size) headers.set('cookie', [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '));
    const res = await fetch(base + p, { ...init, headers, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); const v = kv.slice(i + 1); if (v === '') this.jar.delete(kv.slice(0, i)); else this.jar.set(kv.slice(0, i), v); }
    return res;
  }
  async csrf() { await this.req('/giris'); return this.jar.get('csrf')!; }
  async form(p: string, fields: Record<string, string>, o: { token?: string | null; origin?: string } = {}) {
    const token = o.token === undefined ? await this.csrf() : o.token;
    const body = new URLSearchParams(fields); if (token !== null) body.set('_csrf', token);
    return this.req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...(o.origin ? { origin: o.origin } : {}) }, body });
  }
  async register(email: string) { const r = await this.form('/kayit', { displayName: 'Test', email, password: 'parola-12345' }); expect(r.status).toBe(303); return Number((db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id); }
  async createViaForm(fields: Record<string, string>) {
    const token = await this.csrf(); const fd = new FormData(); fd.set('_csrf', token);
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    fd.append('photos', new Blob([new Uint8Array(placeholderPng(3)) as BlobPart], { type: 'image/png' }), 'a.png');
    return this.req('/ilan/yeni', { method: 'POST', body: fd });
  }
}
const PLECO = { species: 'pleco', form: 'normal', variant: 'ortak', sex: 'erkek', quantity: '1', price: '250', city: 'Ankara', district: 'Çankaya', description: 'Sağlıklı pleco, evde üretim.' };
const KARIDES = { species: 'karides', variant: 'sakura', sex: 'bilinmiyor', quantity: '10', price: '100', city: 'İzmir', district: 'Bornova', description: 'On adet karides, bitkili havuzdan.' };
const idOf = (loc: string | null) => Number(/\/ilan\/(\d+)/.exec(loc ?? '')![1]);
let ph = 0; const photos = () => [{ file: `tb${ph++}.png`, mime: 'image/png', bytes: 5 }];

describe('L-numarası ve grade: doğrulama', () => {
  it('L-numarası biçimi', () => {
    expect(normalizeLNumber('L144')).toBe('L144'); expect(normalizeLNumber(' l 46 ')).toBe('L46'); expect(normalizeLNumber('L046')).toBe('L46');
    for (const bad of ['144', 'L', 'L1234', 'L0', 'LL12', 'L12a', '<b>', 'L 1 2']) expect(normalizeLNumber(bad)).toBeNull();
    expect(normalizeLFilter('144')).toBe('L144'); expect(normalizeLFilter('l144')).toBe('L144'); expect(normalizeLFilter('x')).toBeNull();
  });
  it('pleco: geçerli L-numarası ve "bilmiyorum" kabul; geçersiz hata; boş serbest', () => {
    expect(validateListing({ ...PLECO, lnum: 'l 144' }).value).toMatchObject({ lNumber: 'L144', lUnverified: false });
    expect(validateListing({ ...PLECO, lnum: 'L144', lunknown: '1' }).value).toMatchObject({ lNumber: 'L144', lUnverified: true });
    expect(validateListing({ ...PLECO, lunknown: '1' }).value).toMatchObject({ lNumber: null, lUnverified: true });
    expect(validateListing({ ...PLECO }).ok).toBe(true);
    const bad = validateListing({ ...PLECO, lnum: 'L99999' }); expect(bad.ok).toBe(false); expect(bad.errors.lnum).toBeTruthy();
  });
  it('başka türde L-numarası/grade sessizce yok sayılır; yalnızca karides için grade (amano değil)', () => {
    expect(validateListing({ ...KARIDES, lnum: 'L144', grade: 'sakura' }).value).toMatchObject({ lNumber: null, grade: 'sakura' });
    expect(validateListing({ ...PLECO, grade: 'sakura' }).value).toMatchObject({ grade: null });
    expect(validateListing({ species: 'amano', form: 'standart', variant: 'dogal', sex: 'bilinmiyor', quantity: '1', price: '10', city: 'Ankara', district: 'Çankaya', description: 'Amano karidesi ilanı.', grade: 'sakura' }).value).toMatchObject({ grade: null });
    expect(validateListing({ ...KARIDES, grade: 'uydurma' }).errors.grade).toBeTruthy();
    expect(validateListing({ ...KARIDES }).value!.grade).toBeNull();
  });
  it('grade listesi benzersiz ve sabit; rozet metinleri', () => {
    expect(new Set(GRADES.map((g) => g.id)).size).toBe(GRADES.length);
    expect(specBadges({ species_id: 'pleco', l_number: 'L144', l_unverified: 1 })).toEqual(['L144 (doğrulanmamış)']);
    expect(specBadges({ species_id: 'pleco', l_unverified: 1 })).toEqual(['L-numarası bilinmiyor']);
    expect(specBadges({ species_id: 'karides', grade: 'fire-red' })).toEqual(['Grade: Fire Red']);
    expect(specBadges({ species_id: 'betta', l_number: 'L1', grade: 'sakura' })).toEqual([]);
  });
  it('katalog ve stok eşleşmesi değişmedi: stok kaydı yeni alanları içermez', () => {
    expect(JSON.stringify(CATALOG)).not.toContain('L144x');
    const s = summarizeStock([{ id: 1, t: '', s: 'pleco', f: 'normal', v: 'ortak', x: 'erkek', q: 1, p: 100 }], { species: 'pleco', form: 'normal', variant: 'ortak', sex: 'erkek' });
    expect(s?.count).toBe(1);
  });
  it('filtre: sorgu ve çipler', () => {
    const q = buildSearch({ species: 'pleco', lnum: '144' }); expect(q.where).toContain('l.l_number = ?'); expect(q.args).toContain('L144');
    expect(buildSearch({ lnum: "'; DROP TABLE x;--" }).where).not.toContain('l_number');
    expect(buildSearch({ grade: 'sakura' }).args).toContain('sakura'); expect(buildSearch({ grade: 'yok' }).where).not.toContain('grade');
    expect(filterChips({ species: 'pleco', lnum: 'L144' }).map((c) => c.label)).toContain('L-numarası: L144');
    expect(filterChips({ species: 'karides', grade: 'fire-red' }).map((c) => c.label)).toContain('Grade: Fire Red');
  });
  it('stok satırı doğrulaması', () => {
    expect(validateStockRow({ quantity: '5', price: '12,50' }).value).toEqual({ quantity: 5, priceKurus: 1250 });
    for (const [q, p] of [['0', '10'], ['x', '10'], ['10001', '10'], ['1', '0'], ['1', 'abc'], ['1', '']]) expect(validateStockRow({ quantity: q, price: p }).ok).toBe(false);
  });
  it('dükkân bilgisi: sınırlar ve düz metin', () => {
    const ok = validateShop({ shopName: ' Su  <b>Dünyası</b> ', shopAddress: '', shopHours: '10-19', shopAbout: 'a\nb' });
    expect(ok.ok).toBe(true); expect(ok.value).toEqual({ name: 'Su bDünyası/b', address: null, hours: '10-19', about: 'a b' });
    const long = validateShop({ shopName: 'x'.repeat(61) }); expect(long.ok).toBe(false); expect(long.errors.shopName).toBeTruthy();
  });
});

describe('veritabanı: kayıt, göç, satıldı durumu', () => {
  it('alanlar saklanır; eski veritabanına sütunlar eklenir (veri silinmez)', () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'ilan-mig-')), 'eski.db');
    const old = openDb(file);
    for (const c of ['l_number', 'l_unverified', 'grade', 'sold_at']) old.exec(`ALTER TABLE listings DROP COLUMN ${c}`);
    for (const c of ['shop_name', 'shop_address', 'shop_hours', 'shop_about']) old.exec(`ALTER TABLE users DROP COLUMN ${c}`);
    const u = old.prepare("INSERT INTO users (email,password_hash,display_name,created_at) VALUES ('o@o','x','O',1)").run().lastInsertRowid;
    old.prepare(`INSERT INTO listings (user_id,title,species_id,sex,quantity,price_kurus,city,description,created_at) VALUES (?, 'eski','pleco','erkek',1,100,'Ankara','x',1)`).run(u);
    old.close();
    const re = openDb(file); // göç
    expect(getListing(re, 1)).toMatchObject({ title: 'eski', l_number: null, grade: null, sold_at: null });
    re.close(); openDb(file).close(); // ikinci açılış da hatasız (idempotent)
    const d = openDb(':memory:'); const cols = (d.prepare('PRAGMA table_info(listings)').all() as { name: string }[]).map((c) => c.name);
    for (const c of ['l_number', 'l_unverified', 'grade', 'sold_at']) expect(cols).toContain(c);
  });
  it('satıldı ilan: arama, satıcı listesi (stok kartı) ve herkese açık getListing dışında kalır', () => {
    const db2 = openDb(':memory:');
    const u = db2.prepare("INSERT INTO users (email,password_hash,display_name,created_at) VALUES ('s@s','x','S',1)").run().lastInsertRowid as number;
    const v = validateListing({ ...PLECO, lnum: 'L144' }).value!;
    const a = createListing(db2, u, v, photos()), b = createListing(db2, u, v, photos());
    expect(getListing(db2, a)!.l_number).toBe('L144');
    db2.prepare('UPDATE listings SET sold_at = 5 WHERE id = ?').run(a);
    expect(searchListings(db2, { lnum: 'L144' }).items.map((i) => i.id)).toEqual([b]);
    expect(listingsBySeller(db2, u).map((i) => i.id)).toEqual([b]);
    expect(getListing(db2, a)).toBeUndefined(); expect(getListing(db2, a, true)?.id).toBe(a);
  });
});

describe('HTTP: form, kopya, filtre', () => {
  it('ilan formu L-numarası/grade kaydeder; kart ve detayda rozet, filtre çalışır', async () => {
    const c = new Client(); await c.register('b1@example.test');
    const r = await c.createViaForm({ ...PLECO, lnum: 'l144' }); expect(r.status).toBe(303);
    const id = idOf(r.headers.get('location'));
    const detail = await (await c.req(`/ilan/${id}`)).text();
    expect(detail).toContain('L-numarası'); expect(detail).toContain('L144'); expect(detail).toContain('satıcı beyanı');
    const list = await (await c.req('/ilanlar?tur=pleco&l=144')).text();
    expect(list).toContain('data-testid="rozet-ozel"'); expect(list).toContain('L-numarası: L144');
    expect(await (await c.req('/ilanlar?tur=pleco&l=L999')).text()).toContain('0 ilan bulundu');
    const g = await c.createViaForm({ ...KARIDES, grade: 'fire-red' }); expect(g.status).toBe(303);
    const gl = await (await c.req('/ilanlar?tur=karides&grade=fire-red')).text(); expect(gl).toContain('Grade: Fire Red'); expect(gl).toContain('1 ilan bulundu');
    expect((await c.createViaForm({ ...PLECO, lnum: 'L12345' })).status).toBe(422);
    expect((await c.createViaForm({ ...KARIDES, grade: 'nope' })).status).toBe(422);
  });
  it('İlanı kopyala: yalnızca sahibi; alanlar ön dolu; fotoğraf yok; POST yeni ilan açar', async () => {
    const a = new Client(); const aid = await a.register('b2@example.test');
    const id = idOf((await a.createViaForm({ ...PLECO, lnum: 'L200', lunknown: '1', title: 'x' })).headers.get('location'));
    const html = await (await a.req(`/ilan/yeni?kopya=${id}`)).text();
    for (const s of ['value="L200"', 'Çankaya', 'Sağlıklı pleco, evde üretim.', 'data-testid="kopya-uyari"', 'Fotoğraflar kopyalanmaz']) expect(html).toContain(s);
    expect(html).toMatch(/<option value="pleco" selected>/); expect(html).toMatch(/id="lunknown"[^>]*checked/); expect(html).toMatch(/id="foto"[^>]*required/);
    const b = new Client(); await b.register('b3@example.test');
    expect((await b.req(`/ilan/yeni?kopya=${id}`)).status).toBe(404);
    const anon = new Client(); const r = await anon.req(`/ilan/yeni?kopya=${id}`); expect(r.status).toBe(303); expect(r.headers.get('location')).toContain('/giris');
    expect((await a.req('/ilan/yeni?kopya=99999')).status).toBe(404); expect((await a.req('/ilan/yeni?kopya=abc')).status).toBe(404);
    const before = (db.prepare('SELECT COUNT(*) c FROM listings WHERE user_id = ?').get(aid) as { c: number }).c;
    // fotoğrafsız gönderim kopyadan da yayımlanamaz
    const fd = new FormData(); fd.set('_csrf', await a.csrf()); for (const [k, v] of Object.entries({ ...PLECO, lnum: 'L200' })) fd.set(k, v);
    expect((await a.req('/ilan/yeni', { method: 'POST', body: fd })).status).toBe(422);
    expect((db.prepare('SELECT COUNT(*) c FROM listings WHERE user_id = ?').get(aid) as { c: number }).c).toBe(before);
  });
  it('detayda sahibine "İlanı kopyala", başkasına yok', async () => {
    const a = new Client(); await a.register('b4@example.test');
    const id = idOf((await a.createViaForm(PLECO)).headers.get('location'));
    expect(await (await a.req(`/ilan/${id}`)).text()).toContain(`href="/ilan/yeni?kopya=${id}"`);
    expect(await (await new Client().req(`/ilan/${id}`)).text()).not.toContain('kopya=');
  });
});

describe('HTTP: toplu giriş / stok', () => {
  const mk = (uid: number, n: number) => Array.from({ length: n }, (_, i) => createListing(db, uid, validateListing({ ...PLECO, quantity: String(i + 1), price: String(100 + i) }).value!, photos()));
  it('giriş gerekir; yalnızca kendi ilanları listelenir', async () => {
    const anon = await new Client().req('/profil/toplu'); expect(anon.status).toBe(303);
    const a = new Client(); const aid = await a.register('t1@example.test'); const [x] = mk(aid, 1);
    const b = new Client(); const bid = await b.register('t2@example.test'); const [y] = mk(bid, 1);
    const html = await (await a.req('/profil/toplu')).text();
    expect(html).toContain(`name="q_${x}"`); expect(html).not.toContain(`name="q_${y}"`); expect(html).toContain('Yeni ilan toplu açılamaz');
  });
  it('CSRF/Origin: belirteçsiz ya da yabancı Origin reddedilir, veri değişmez', async () => {
    const a = new Client(); const aid = await a.register('t3@example.test'); const [x] = mk(aid, 1);
    expect((await a.form('/profil/toplu', { [`q_${x}`]: '9', [`p_${x}`]: '99' }, { token: null })).status).toBe(403);
    expect((await a.form('/profil/toplu', { [`q_${x}`]: '9', [`p_${x}`]: '99' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect(getListing(db, x)!.quantity).toBe(1);
  });
  it('kaydeder; satıldı işaretli ilan herkese açık yerlerden çıkar, yeniden aktifte döner', async () => {
    const a = new Client(); const aid = await a.register('t4@example.test'); const [x, y] = mk(aid, 2);
    const r = await a.form('/profil/toplu', { [`q_${x}`]: '7', [`p_${x}`]: '12,50', [`s_${x}`]: 'satildi', [`q_${y}`]: '3', [`p_${y}`]: '40', [`s_${y}`]: 'aktif' });
    expect(r.status).toBe(200); expect(await r.text()).toContain('2 ilan güncellendi');
    const row = db.prepare('SELECT quantity, price_kurus, sold_at FROM listings WHERE id = ?').get(x) as { quantity: number; price_kurus: number; sold_at: number | null };
    expect(row.quantity).toBe(7); expect(row.price_kurus).toBe(1250); expect(row.sold_at).not.toBeNull();
    const pub = new Client();
    expect((await pub.req(`/ilan/${x}`)).status).toBe(404);
    expect(await (await pub.req(`/satici/${aid}`)).text()).not.toContain(`href="/ilan/${x}"`);
    expect(await (await pub.req('/ilanlar?tur=pleco')).text()).not.toContain(`href="/ilan/${x}"`);
    expect((await a.req(`/ilan/${x}`)).status).toBe(200); // sahibi görür
    expect(await (await a.req('/profil/toplu')).text()).toContain(`name="q_${x}"`);
    await a.form('/profil/toplu', { [`q_${x}`]: '7', [`p_${x}`]: '12,50', [`s_${x}`]: 'aktif' });
    expect((await pub.req(`/ilan/${x}`)).status).toBe(200);
  });
  it('stok kartı yalnızca aktif ilanlardan beslenir (satıldı veri dışı)', async () => {
    const a = new Client(); const aid = await a.register('t5@example.test'); const [x, y] = mk(aid, 2);
    await a.form('/profil/toplu', { [`q_${x}`]: '1', [`p_${x}`]: '100', [`s_${x}`]: 'satildi', [`q_${y}`]: '1', [`p_${y}`]: '100', [`s_${y}`]: 'aktif' });
    const html = await (await new Client().req(`/satici/${aid}`)).text();
    if (html.includes('data-stock')) { const m = /data-stock="([^"]*)"/.exec(html)![1]; expect(m).toContain(`${y}`); expect(m).not.toContain(`&quot;id&quot;:${x},`); }
    expect(await (await new Client().req(`/satici/${aid}`)).text()).toContain('1 aktif ilan');
  });
  it('kısmi hata: geçerli satırlar kaydedilir, hatalılar satır bazında bildirilir (422); başkasının ilanı reddedilir', async () => {
    const a = new Client(); const aid = await a.register('t6@example.test'); const [x, y] = mk(aid, 2);
    const b = new Client(); const bid = await b.register('t7@example.test'); const [z] = mk(bid, 1);
    const r = await a.form('/profil/toplu', { [`q_${x}`]: '50', [`p_${x}`]: '60', [`q_${y}`]: '0', [`p_${y}`]: 'abc', [`q_${z}`]: '99', [`p_${z}`]: '999' });
    expect(r.status).toBe(422); const html = await r.text();
    expect(html).toContain('1 ilan güncellendi, 2 satırda hata'); expect(html).toContain(`id="q_${y}-err"`); expect(html).toContain(`id="p_${y}-err"`);
    expect(getListing(db, x)!.quantity).toBe(50);
    expect(getListing(db, y)!.quantity).toBe(2);
    expect(getListing(db, z)!.quantity).toBe(1); expect(getListing(db, z)!.price_kurus).toBe(10000);
    expect(html).not.toContain(`name="q_${z}"`);
  });
  it('hız sınırı: kullanıcı başına saatte 30 kayıttan sonra 429', async () => {
    const a = new Client(); const aid = await a.register('t8@example.test'); const [x] = mk(aid, 1);
    let last = 0;
    for (let i = 0; i < 31; i++) last = (await a.form('/profil/toplu', { [`q_${x}`]: '1', [`p_${x}`]: '100' })).status;
    expect(last).toBe(429);
  });
});

describe('HTTP: dükkân bilgisi', () => {
  it('kaydedilir, herkese açık satıcı sayfasında kaçışlı düz metin; CSRF ve giriş zorunlu; uzun değer reddedilir', async () => {
    expect((await new Client().req('/profil/dukkan')).status).toBe(303);
    const a = new Client(); const aid = await a.register('d1@example.test');
    expect((await a.form('/profil/dukkan', { shopName: 'X' }, { token: null })).status).toBe(403);
    expect((await a.form('/profil/dukkan', { shopName: 'Su Dünyası <script>alert(1)</script>', shopAddress: 'Atatürk Cd. 5, Kadıköy', shopHours: 'Pzt-Cmt 10-19', shopAbout: 'Canlı balık ve malzeme.' })).status).toBe(303);
    const html = await (await new Client().req(`/satici/${aid}`)).text();
    expect(html).toContain('Atatürk Cd. 5'); expect(html).toContain('Pzt-Cmt 10-19'); expect(html).not.toContain('<script>alert'); expect(html).toContain('data-testid="dukkan-bilgisi"');
    expect((await a.form('/profil/dukkan', { shopName: 'x'.repeat(70) })).status).toBe(422);
    expect(await (await new Client().req(`/satici/${await new Client().register('d2@example.test')}`)).text()).not.toContain('dukkan-bilgisi');
  });
});
