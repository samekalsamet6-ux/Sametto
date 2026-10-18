// Sunucu düzeyi (arayüzü atlayan) testler: güven kuralları sunucuda zorlanır.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readConfig } from '../../server/config.ts';
import { openDb, type DB } from '../../server/db.ts';
import { createApp } from '../../server/app.ts';
import { devAssets } from '../../server/assets.ts';
import { placeholderPng } from '../../server/placeholder.ts';

let server: Server, base: string, db: DB, dir: string;
beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'ilan-api-'));
  const cfg = { ...readConfig({ DATA_DIR: dir, ADMIN_EMAIL: 'admin@example.test' } as NodeJS.ProcessEnv), loginMaxFails: 3, registerMax: 1000 };
  db = openDb(cfg.dbPath);
  const app = createApp(cfg, db, devAssets());
  server = createServer((q, s) => void app.handler(q, s));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

/** Çerez saklayan küçük istemci */
class Client {
  jar = new Map<string, string>();
  async req(p: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers); if (this.jar.size) headers.set('cookie', [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '));
    const res = await fetch(base + p, { ...init, headers, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); const v = kv.slice(i + 1); if (v === '') this.jar.delete(kv.slice(0, i)); else this.jar.set(kv.slice(0, i), v); }
    return res;
  }
  async csrf() { await this.req('/giris'); return this.jar.get('csrf')!; }
  async post(p: string, fields: Record<string, string>, files: { name: string; type: string; data: Uint8Array }[] = [], opts: { token?: string | null; origin?: string } = {}) {
    const token = opts.token === undefined ? await this.csrf() : opts.token;
    const fd = new FormData();
    if (token !== null) fd.set('_csrf', token);
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    for (const f of files) fd.append('photos', new Blob([f.data as BlobPart], { type: f.type }), f.name);
    const headers: Record<string, string> = opts.origin ? { origin: opts.origin } : {};
    return this.req(p, { method: 'POST', body: fd, headers });
  }
  async register(email: string) { return this.postForm('/kayit', { displayName: 'Test Kullanıcı', email, password: 'parola-12345', password2: 'parola-12345' }); }
  async postForm(p: string, fields: Record<string, string>) {
    const token = await this.csrf();
    return this.req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: token, ...fields }) });
  }
}
const LISTING = { species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek', quantity: '1', price: '300', city: 'Ankara', description: 'Sağlıklı erkek betta, ayrı kavanozda.' };
const png = new Uint8Array(placeholderPng(1));
const count = () => (db.prepare('SELECT COUNT(*) c FROM listings').get() as { c: number }).c;

describe('hesap, CSRF, oturum', () => {
  it('kayıt oturum çerezi verir: HttpOnly + SameSite, Secure değil (yerel http)', async () => {
    const c = new Client();
    const res = await c.register('a@example.test');
    expect(res.status).toBe(303);
    const sid = res.headers.getSetCookie().find((x) => x.startsWith('sid='))!;
    expect(sid).toContain('HttpOnly'); expect(sid).toContain('SameSite=Lax'); expect(sid).toContain('Path=/');
    expect(await (await c.req('/')).text()).toContain('Çıkış');
  });
  it('CSRF belirteci olmadan ya da yanlış Origin ile POST reddedilir', async () => {
    const c = new Client();
    await c.csrf();
    const r1 = await c.req('/kayit', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: 'x@example.test', password: 'parola-12345', displayName: 'X' }) });
    expect(r1.status).toBe(403);
    const r2 = await c.req('/kayit', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }, body: new URLSearchParams({ _csrf: c.jar.get('csrf')!, email: 'x@example.test', password: 'parola-12345', displayName: 'X' }) });
    expect(r2.status).toBe(403);
    expect(db.prepare("SELECT 1 FROM users WHERE email = 'x@example.test'").get()).toBeUndefined();
  });
  it('yanlış parola 401, aynı e-posta ikinci kayıt 409, çıkış oturumu bitirir', async () => {
    const c = new Client(); await c.register('b@example.test');
    const other = new Client();
    expect((await other.register('b@example.test')).status).toBe(409);
    expect((await other.postForm('/giris', { email: 'b@example.test', password: 'yanlis-parola' })).status).toBe(401);
    expect((await other.postForm('/giris', { email: 'b@example.test', password: 'parola-12345' })).status).toBe(303);
    await other.postForm('/cikis', {});
    expect(await (await other.req('/')).text()).not.toContain('Çıkış');
  });
  it('giriş hız sınırı: 3 hatadan sonra doğru parola bile 429', async () => {
    const c = new Client(); await c.register('rl@example.test');
    const v = new Client();
    for (let i = 0; i < 3; i++) expect((await v.postForm('/giris', { email: 'rl@example.test', password: 'yanlis' + i })).status).toBe(401);
    const res = await v.postForm('/giris', { email: 'rl@example.test', password: 'parola-12345' });
    expect(res.status).toBe(429); expect(res.headers.get('retry-after')).toBeTruthy();
  });
});

describe('ilan oluşturma: fotoğraf zorunluluğu SUNUCUDA zorlanır (arayüz atlanarak)', () => {
  it('giriş yapılmadan ilan verilemez', async () => {
    const c = new Client(); const before = count();
    const res = await c.post('/ilan/yeni', LISTING, [{ name: 'a.png', type: 'image/png', data: png }]);
    expect(res.status).toBe(303); expect(res.headers.get('location')).toContain('/giris'); expect(count()).toBe(before);
  });
  it('fotoğrafsız POST 422 döner ve ilan oluşmaz', async () => {
    const c = new Client(); await c.register('p1@example.test'); const before = count();
    const res = await c.post('/ilan/yeni', LISTING);
    expect(res.status).toBe(422); expect(await res.text()).toContain('en az bir gerçek fotoğraf'); expect(count()).toBe(before);
  });
  it('görsel olmayan dosya (uzantısı .jpg, MIME image/jpeg) reddedilir', async () => {
    const c = new Client(); await c.register('p2@example.test'); const before = count();
    const res = await c.post('/ilan/yeni', LISTING, [{ name: 'x.jpg', type: 'image/jpeg', data: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>') }]);
    expect(res.status).toBe(422); expect(count()).toBe(before);
  });
  it('5 MB üstü ve 5 adetten fazla fotoğraf reddedilir', async () => {
    const c = new Client(); await c.register('p3@example.test'); const before = count();
    const big = new Uint8Array(5 * 1024 * 1024 + 10); big.set(png.subarray(0, 8));
    expect((await c.post('/ilan/yeni', LISTING, [{ name: 'big.png', type: 'image/png', data: big }])).status).toBe(422);
    const six = Array.from({ length: 6 }, (_, i) => ({ name: `${i}.png`, type: 'image/png', data: png }));
    expect((await c.post('/ilan/yeni', LISTING, six)).status).toBe(422);
    expect(count()).toBe(before);
  });
  it('geçersiz alanlar (var olmayan şekil) fotoğraf olsa da reddedilir; dosya diskte kalmaz', async () => {
    const c = new Client(); await c.register('p4@example.test'); const before = count(); const files = () => readdirSync(path.join(dir, 'uploads')).length;
    const f0 = (() => { try { return files(); } catch { return 0; } })();
    const res = await c.post('/ilan/yeni', { ...LISTING, form: 'yok' }, [{ name: 'a.png', type: 'image/png', data: png }]);
    expect(res.status).toBe(422); expect(count()).toBe(before);
    expect((() => { try { return files(); } catch { return 0; } })()).toBe(f0);
  });
  it('geçerli ilan + fotoğraf: 303, DB satırı, dosya rastgele adla yayınlanır, ham sunucu yolu sızmaz', async () => {
    const c = new Client(); await c.register('p5@example.test');
    const res = await c.post('/ilan/yeni', { ...LISTING, whatsapp: '0532 123 45 67' }, [{ name: '../../evil.png', type: 'text/html', data: png }]);
    expect(res.status).toBe(303);
    const loc = res.headers.get('location')!; expect(loc).toMatch(/^\/ilan\/\d+/);
    const page = await (await c.req(loc.split('?')[0])).text();
    expect(page).toContain('Temsili 3B görünüm — gerçek balık fotoğrafları');
    const src = /src="(\/yuklemeler\/[a-f0-9]{32}\.png)"/.exec(page)![1];
    const img = await c.req(src);
    expect(img.status).toBe(200); expect(img.headers.get('content-type')).toBe('image/png'); expect(img.headers.get('x-content-type-options')).toBe('nosniff');
    expect(page).toContain('https://wa.me/905321234567');
    expect(page).not.toContain('evil.png');
  });
  it('yol gezintisi ve bilinmeyen dosya 404', async () => {
    const c = new Client();
    for (const p of ['/yuklemeler/..%2F..%2Fapp.db', '/yuklemeler/app.db', '/yuklemeler/' + 'a'.repeat(32) + '.png']) expect((await c.req(p)).status).toBe(404);
  });
  it('gövde sınırı: çok büyük istek 413', async () => {
    const c = new Client(); await c.register('p6@example.test');
    const body = new Uint8Array(30 * 1024 * 1024);
    const fd = new FormData(); fd.set('_csrf', await c.csrf()); fd.append('photos', new Blob([body]), 'x.png');
    expect((await c.req('/ilan/yeni', { method: 'POST', body: fd })).status).toBe(413);
  });
});

describe('detay sayfası, şikayet, yönetim', () => {
  it("ilan detayında 'temsili 3B görünüm' etiketi var; 'diğer' ilanda 3B yok", async () => {
    const c = new Client(); await c.register('d1@example.test');
    const res = await c.post('/ilan/yeni', LISTING, [{ name: 'a.png', type: 'image/png', data: png }]);
    const html = await (await c.req(res.headers.get('location')!)).text();
    expect(html).toMatch(/Temsili 3B görünüm — gerçek balık fotoğrafları/);
    const r2 = await c.post('/ilan/yeni', { species: 'diger', speciesOther: 'Danio', sex: 'bilinmiyor', quantity: '5', price: '10', city: 'Bursa', description: 'Zebra danio sürüsü.' }, [{ name: 'a.png', type: 'image/png', data: png }]);
    const h2 = await (await c.req(r2.headers.get('location')!)).text();
    expect(h2).not.toContain('<canvas'); expect(h2).toContain('3B model yok');
  });
  it("ilan formu: önizleme 'Temsili 3B görünüm' etiketli; WhatsApp dostça biçimde ve gidiş-dönüşlü", async () => {
    const c = new Client(); await c.register('w1@example.test');
    expect((await c.post('/ilan/yeni', { ...LISTING, whatsapp: '0555 000 00 01' }, [{ name: 'a.png', type: 'image/png', data: png }])).status).toBe(303);
    const form = await (await c.req('/ilan/yeni')).text();
    expect(form).toContain('Temsili 3B görünüm (önizleme)');
    expect(form).toContain('value="0555 000 00 01"'); expect(form).not.toContain('905550000001');
  });
  it('sahibi kendi ilan sayfasında boş şikayet kutusu görmez', async () => {
    const c = new Client(); await c.register('e1@example.test');
    const loc = (await c.post('/ilan/yeni', LISTING, [{ name: 'a.png', type: 'image/png', data: png }])).headers.get('location')!;
    const h = await (await c.req(loc)).text();
    expect(h).not.toContain('class="report"'); expect(h).not.toMatch(/<section[^>]*>\s*<\/section>/);
  });
  it('şikayet yalnızca girişli kullanıcıdan, ilanı işaretler; /admin/raporlar yalnızca ADMIN_EMAIL', async () => {
    const seller = new Client(); await seller.register('s1@example.test');
    const loc = (await seller.post('/ilan/yeni', LISTING, [{ name: 'a.png', type: 'image/png', data: png }])).headers.get('location')!.split('?')[0];
    const id = Number(loc.split('/').pop());
    const anon = new Client();
    expect((await anon.postForm(`${loc}/sikayet`, { reason: 'sahte' })).headers.get('location')).toContain('/giris');
    const rep = new Client(); await rep.register('r1@example.test');
    expect((await rep.postForm(`${loc}/sikayet`, { reason: 'bilinmeyen' })).status).toBe(422);
    expect((await rep.postForm(`${loc}/sikayet`, { reason: 'sahte', note: 'Fotoğraf başka yerden' })).status).toBe(303);
    expect((db.prepare('SELECT flagged FROM listings WHERE id = ?').get(id) as { flagged: number }).flagged).toBe(1);
    expect((await rep.req('/admin/raporlar')).status).toBe(404);
    expect((await anon.req('/admin/raporlar')).status).toBe(404);
    const admin = new Client(); await admin.register('admin@example.test');
    const page = await (await admin.req('/admin/raporlar')).text();
    expect(page).toContain('Fotoğraf başka yerden'); expect(page).toContain(`#${id}`);
  });
  it('başkasının ilanı kaldırılamaz, sahibi kaldırabilir', async () => {
    const a = new Client(); await a.register('k1@example.test'); const b = new Client(); await b.register('k2@example.test');
    const loc = (await a.post('/ilan/yeni', LISTING, [{ name: 'a.png', type: 'image/png', data: png }])).headers.get('location')!.split('?')[0];
    expect((await b.postForm(`${loc}/kaldir`, {})).status).toBe(404);
    expect((await a.postForm(`${loc}/kaldir`, {})).status).toBe(303);
    expect((await a.req(loc)).status).toBe(404);
  });
  it('satıcı sayfası yer tutucu notunu içerir; güvenlik başlıkları', async () => {
    const c = new Client(); await c.register('sp@example.test');
    const id = (db.prepare("SELECT id FROM users WHERE email='sp@example.test'").get() as { id: number }).id;
    const res = await c.req(`/satici/${id}`);
    expect(await res.text()).toContain('Akvaryum yakında');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});
