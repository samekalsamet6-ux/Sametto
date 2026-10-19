// Akvaryum uç noktaları (sunucu düzeyi): yalnızca sahibi, CSRF, geçersiz birleşimler, sınırlar, hız sınırı.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readConfig } from '../../server/config.ts';
import { openDb, listAquariumFish, createListing, removeListing, type DB } from '../../server/db.ts';
import { createApp, type App } from '../../server/app.ts';
import { devAssets } from '../../server/assets.ts';

let server: Server, base: string, db: DB, app: App;
beforeAll(async () => {
  const cfg = { ...readConfig({ DATA_DIR: mkdtempSync(path.join(tmpdir(), 'akv-api-')) } as NodeJS.ProcessEnv), registerMax: 1000 };
  db = openDb(cfg.dbPath); app = createApp(cfg, db, devAssets());
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
  async post(p: string, fields: Record<string, string> = {}, opts: { token?: string | null; origin?: string } = {}) {
    const token = opts.token === undefined ? await this.csrf() : opts.token;
    const body = new URLSearchParams({ ...(token === null ? {} : { _csrf: token }), ...fields });
    return this.req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...(opts.origin ? { origin: opts.origin } : {}) }, body });
  }
  async register(email: string) { const r = await this.post('/kayit', { displayName: 'Akv Kullanıcı', email, password: 'parola-12345', password2: 'parola-12345' }); expect(r.status).toBe(303); return (db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number }).id; }
}
const BETTA = { species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek' };
const NEON = { species: 'neon', form: 'standart', variant: 'normal', sex: 'disi' };

describe('akvaryum uç noktaları', () => {
  it('girişsiz: düzenleme sayfası girişe yönlendirir, ekleme/silme satır oluşturmaz', async () => {
    const c = new Client();
    const r = await c.req('/profil/akvaryum'); expect(r.status).toBe(303); expect(r.headers.get('location')).toContain('/giris');
    const p = await c.post('/profil/akvaryum/ekle', BETTA); expect(p.status).toBe(303); expect(p.headers.get('location')).toContain('/giris');
    expect((db.prepare('SELECT COUNT(*) c FROM aquarium_fish').get() as { c: number }).c).toBe(0);
  });
  it('sahibi ekler, profilde herkes görür; CSRF belirteci ve yabancı Origin olmadan reddedilir', async () => {
    const a = new Client(); const id = await a.register('akv1@example.test');
    expect((await a.post('/profil/akvaryum/ekle', BETTA, { token: null })).status).toBe(403);
    expect((await a.post('/profil/akvaryum/ekle', BETTA, { origin: 'https://evil.example' })).status).toBe(403);
    expect(listAquariumFish(db, id)).toHaveLength(0);
    const ok = await a.post('/profil/akvaryum/ekle', BETTA); expect(ok.status).toBe(303);
    expect(listAquariumFish(db, id)).toHaveLength(1);
    const html = await (await new Client().req(`/satici/${id}`)).text();   // anonim ziyaretçi
    expect(html).toContain('Sahne temsilidir; stok ve fiyat, satıcının aktif ilanlarından gelir'); expect(html).not.toContain('gerçek stoğu değildir'); expect(html).toContain('data-species="betta"');
    expect(html).not.toContain('/profil/akvaryum"'); // ziyaretçide düzenle düğmesi yok
    expect(await (await a.req(`/satici/${id}`)).text()).toContain('href="/profil/akvaryum"');
  });
  it('geçersiz birleşimler 422 ile reddedilir ve kaydedilmez', async () => {
    const a = new Client(); const id = await a.register('akv2@example.test');
    for (const bad of [{ ...BETTA, species: 'diger' }, { ...BETTA, species: 'yok' }, { ...BETTA, form: 'standart' }, { ...BETTA, variant: 'normal' }, { ...BETTA, sex: 'bilinmiyor' }, { ...BETTA, sex: '' }, { species: 'melek', form: 'veil', variant: 'zebra', sex: 'erkek' }]) {
      expect((await a.post('/profil/akvaryum/ekle', bad)).status, JSON.stringify(bad)).toBe(422);
    }
    expect(listAquariumFish(db, id)).toHaveLength(0);
  });
  it('sınırlar sunucuda zorlanır: 12 balık, 3 karides', async () => {
    const a = new Client(); const id = await a.register('akv3@example.test');
    const KAR = { species: 'karides', variant: (await import('../../shared/catalog.ts')).speciesById('karides')!.variants[0].id, sex: 'erkek' };
    for (let i = 0; i < 3; i++) expect((await a.post('/profil/akvaryum/ekle', KAR)).status).toBe(303);
    const r = await a.post('/profil/akvaryum/ekle', KAR); expect(r.status).toBe(422); expect(await r.text()).toContain('en fazla 3 karides');
    for (let i = 0; i < 9; i++) expect((await a.post('/profil/akvaryum/ekle', NEON)).status).toBe(303);
    const full = await a.post('/profil/akvaryum/ekle', NEON); expect(full.status).toBe(422); expect(await full.text()).toContain('en fazla 12');
    expect(listAquariumFish(db, id)).toHaveLength(12);
  });
  it('yalnızca sahibi silebilir; başkasının balığı için 404', async () => {
    const a = new Client(), b = new Client(); const ida = await a.register('akv4@example.test'); await b.register('akv5@example.test');
    await a.post('/profil/akvaryum/ekle', NEON);
    const fid = listAquariumFish(db, ida)[0].id;
    expect((await b.post(`/profil/akvaryum/${fid}/sil`)).status).toBe(404);
    expect((await a.post(`/profil/akvaryum/${fid}/sil`, {}, { token: null })).status).toBe(403);
    expect(listAquariumFish(db, ida)).toHaveLength(1);
    expect((await a.post(`/profil/akvaryum/${fid}/sil`)).status).toBe(303);
    expect(listAquariumFish(db, ida)).toHaveLength(0);
  });
  it('hız sınırı: kullanıcı başına saatte 60 değişiklik', async () => {
    const a = new Client(); await a.register('akv6@example.test');
    let last = 0;
    for (let i = 0; i < 62; i++) last = (await a.post('/profil/akvaryum/ekle', { ...BETTA, sex: 'x' })).status;
    expect(last).toBe(429);
  });
  it('boş akvaryum durumu', async () => {
    const a = new Client(); const id = await a.register('akv7@example.test');
    const html = await (await new Client().req(`/satici/${id}`)).text();
    expect(html).toContain('Bu satıcı henüz akvaryum oluşturmadı'); expect(html).not.toContain('id="tank"');
  });
});

describe('profildeki stok verisi', () => {
  const dataStock = (html: string) => { const m = /data-stock="([^"]*)"/.exec(html); expect(m).toBeTruthy(); return JSON.parse(m![1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')) as { id: number; t: string; s: string; q: number; p: number }[]; };
  const L = (title: string, price: number, qty = 1, species = 'betta') => ({ speciesId: species, speciesOther: null, formId: 'plakat', variantId: 'mavi', sex: 'erkek', quantity: qty, priceKurus: price, city: 'İstanbul', district: '', title, description: 'x', whatsapp: null, phone: null });
  let fn = 0; const ph = () => [{ file: `stok${fn++}.png`, mime: 'image/png', bytes: 10 }];
  it('yalnızca o satıcının AKTİF ilanları, güvenle kaçışlanmış ve satır içi betik olmadan gömülür', async () => {
    const a = new Client(); const id = await a.register('stok1@example.test'); const b = new Client(); const other = await b.register('stok2@example.test');
    expect((await a.post('/profil/akvaryum/ekle', BETTA)).status).toBe(303);
    const l1 = createListing(db, id, L('Mavi "betta" <b>x</b> & \'ç\'', 45000, 3), ph());
    const l2 = createListing(db, id, L('İkinci', 30000), ph());
    const l3 = createListing(db, id, L('Kaldırılan', 1000), ph()); removeListing(db, l3, id);
    createListing(db, other, L('Başkasının', 5000), ph());
    const res = await new Client().req(`/satici/${id}`); const html = await res.text();
    const stock = dataStock(html);
    expect(stock.map((x) => x.id).sort()).toEqual([l1, l2].sort());
    expect(stock.find((x) => x.id === l1)).toMatchObject({ s: 'betta', q: 3, p: 45000, t: 'Mavi "betta" <b>x</b> & \'ç\'' });
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toMatch(/<script(?![^>]*src=)[^>]*>/); // satır içi betik yok (CSP)
    expect(html).toContain('id="balik-karti"');
  });
  it('ilanı olmayan satıcıda veri boş dizidir', async () => {
    const a = new Client(); const id = await a.register('stok3@example.test');
    expect((await a.post('/profil/akvaryum/ekle', BETTA)).status).toBe(303);
    expect(dataStock(await (await new Client().req(`/satici/${id}`)).text())).toEqual([]);
  });
});

