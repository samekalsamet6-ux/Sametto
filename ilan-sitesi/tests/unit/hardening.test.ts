// Güvenlik sertleştirmeleri: yükleme gizliliği (uçtan uca), üretim başlıkları, TRUST_PROXY, yönetici CLI'si.
import { describe, it, expect, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig, type Config } from '../../server/config.ts';
import { openDb, createUser, findUserByEmail, getUser } from '../../server/db.ts';
import { createApp } from '../../server/app.ts';
import { devAssets } from '../../server/assets.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const servers: Server[] = []; const dirs: string[] = [];
afterAll(() => { servers.forEach((s) => s.close()); dirs.forEach((d) => rmSync(d, { recursive: true, force: true })); });

async function start(env: Record<string, string> = {}, tweak: Partial<Config> = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'ilan-hard-')); dirs.push(dir);
  const cfg = { ...readConfig({ DATA_DIR: dir, ...env } as NodeJS.ProcessEnv), registerMax: 1000, ...tweak };
  const db = openDb(cfg.dbPath);
  const app = createApp(cfg, db, devAssets());
  const server = createServer((q, s) => void app.handler(q, s)); servers.push(server);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return { dir, db, cfg, app, base: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
}

describe('yönetici yalnızca yerel CLI ile', () => {
  it('hangi e-postayla kayıt olunursa olunsun yönetici olunmaz (ADMIN_EMAIL artık yok)', async () => {
    const s = await start({ ADMIN_EMAIL: 'admin@example.test' }); // eski ayar yok sayılır
    const jar = new Map<string, string>();
    const call = async (p: string, init: RequestInit = {}) => {
      const h = new Headers(init.headers); if (jar.size) h.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
      const r = await fetch(s.base + p, { ...init, headers: h, redirect: 'manual' });
      for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar.set(kv.slice(0, i), kv.slice(i + 1)); }
      return r;
    };
    await call('/giris');
    const body = new URLSearchParams({ _csrf: jar.get('csrf')!, displayName: 'Ben', email: 'admin@example.test', password: 'parola-12345', password2: 'parola-12345' });
    expect((await call('/kayit', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } })).status).toBe(303);
    expect(getUser(s.db, findUserByEmail(s.db, 'admin@example.test')!.id)!.is_admin).toBe(0);
    expect((await call('/admin/raporlar')).status).toBe(404);
  });

  it('npm run make-admin betiği geçici veritabanında çalışır; olmayan hesapta hata verir', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ilan-cli-')); dirs.push(dir);
    const db = openDb(path.join(dir, 'app.db'));
    const id = createUser(db, 'op@example.test', 'x', 'Op');
    expect(getUser(db, id)!.is_admin).toBe(0); db.close();
    const run = (...a: string[]) => execFileSync('node', ['scripts/make-admin.ts', ...a], { cwd: ROOT, env: { ...process.env, DATA_DIR: dir }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(run('OP@Example.test')).toContain('Yönetici yapıldı');
    const db2 = openDb(path.join(dir, 'app.db'));
    expect(getUser(db2, id)!.is_admin).toBe(1);
    expect(() => run('yok@example.test')).toThrow();
    run('--remove', 'op@example.test');
    expect(getUser(db2, id)!.is_admin).toBe(0);
    db2.close();
  });
});

describe('yüklenen fotoğrafta konum/üst veri saklanmaz', () => {
  it('GPS içeren JPEG yüklenir; diskteki dosyada GPS baytları yoktur, görüntü geçerli kalır', async () => {
    const s = await start();
    const jar = new Map<string, string>();
    const call = async (p: string, init: RequestInit = {}) => {
      const h = new Headers(init.headers); if (jar.size) h.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
      const r = await fetch(s.base + p, { ...init, headers: h, redirect: 'manual' });
      for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar.set(kv.slice(0, i), kv.slice(i + 1)); }
      return r;
    };
    await call('/giris');
    await call('/kayit', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: jar.get('csrf')!, displayName: 'Ben', email: 'f@example.test', password: 'parola-12345', password2: 'parola-12345' }) });
    const jpg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAgDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDPryj6I//Z', 'base64');
    const GPS = 'GPS-LAT-41.0082-LON-28.9784';
    const payload = Buffer.concat([Buffer.from('Exif\0\0MM\0*\0\0\0\x08\0\0\0\0\0\0'), Buffer.from(GPS)]);
    const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 255]), payload]);
    const dirty = Buffer.concat([jpg.subarray(0, 20), app1, jpg.subarray(20)]); // APP0 (18 bayt) sonrası
    expect(dirty.includes(GPS)).toBe(true);
    const fd = new FormData();
    fd.set('_csrf', jar.get('csrf')!);
    for (const [k, v] of Object.entries({ species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek', quantity: '1', price: '300', city: 'Ankara', description: 'Sağlıklı erkek betta, ayrı kavanozda.' })) fd.set(k, v);
    fd.append('photos', new Blob([dirty], { type: 'image/jpeg' }), 'kamera.jpg');
    const r = await call('/ilan/yeni', { method: 'POST', body: fd });
    expect(r.status).toBe(303);
    const files = readdirSync(path.join(s.dir, 'uploads'));
    expect(files).toHaveLength(1);
    const stored = readFileSync(path.join(s.dir, 'uploads', files[0]));
    expect(stored.includes(GPS)).toBe(false); expect(stored.includes('Exif')).toBe(false);
    expect(stored[0]).toBe(0xff); expect(stored[1]).toBe(0xd8); expect(stored.at(-2)).toBe(0xff); expect(stored.at(-1)).toBe(0xd9);
    expect((s.db.prepare('SELECT bytes FROM listing_photos').get() as { bytes: number }).bytes).toBe(stored.length);
    // bozuk görsel reddedilir
    const fd2 = new FormData(); fd2.set('_csrf', jar.get('csrf')!);
    for (const [k, v] of Object.entries({ species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek', quantity: '1', price: '300', city: 'Ankara', description: 'Sağlıklı erkek betta, ayrı kavanozda.' })) fd2.set(k, v);
    fd2.append('photos', new Blob([jpg.subarray(0, 120)], { type: 'image/jpeg' }), 'bozuk.jpg');
    expect((await call('/ilan/yeni', { method: 'POST', body: fd2 })).status).toBe(422);
  });
});

describe('başlıklar ve TRUST_PROXY', () => {
  it('HSTS yalnızca COOKIE_SECURE/üretimde; diğer güvenlik başlıkları her zaman', async () => {
    const dev = await start();
    const r0 = await fetch(dev.base + '/giris');
    expect(r0.headers.get('strict-transport-security')).toBeNull();
    for (const [k, v] of [['x-content-type-options', 'nosniff'], ['referrer-policy', 'same-origin'], ['x-frame-options', 'DENY']]) expect(r0.headers.get(k)).toBe(v);
    expect(r0.headers.get('permissions-policy')).toContain('camera=()');
    const sec = await start({ COOKIE_SECURE: 'true' });
    expect((await fetch(sec.base + '/giris')).headers.get('strict-transport-security')).toMatch(/max-age=\d+/);
    const prod = await start({ NODE_ENV: 'production' });
    const r2 = await fetch(prod.base + '/giris');
    expect(r2.headers.get('strict-transport-security')).toMatch(/max-age=\d+/);
    expect(r2.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('X-Forwarded-For varsayılan olarak yok sayılır; TRUST_PROXY=true ile son girdi IP olur', async () => {
    const attempt = async (base: string, xff: string) => (await fetch(base + '/giris', { headers: { 'x-forwarded-for': xff } })).status; // sayfa açılışı
    expect(await attempt((await start()).base, '1.2.3.4')).toBe(200);
    // IP başına kayıt sınırı üzerinden gözlem: registerMax=1 ise ikinci istek aynı IP ise 429
    const post = async (base: string, xff: string) => {
      const g = await fetch(base + '/giris'); const csrf = /csrf=([^;]+)/.exec(g.headers.getSetCookie().join(';'))![1];
      return (await fetch(base + '/kayit', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: `csrf=${csrf}`, 'x-forwarded-for': xff }, body: new URLSearchParams({ _csrf: csrf }) })).status;
    };
    const off = await start({}, { registerMax: 1 });
    expect(await post(off.base, '9.9.9.1')).toBe(422);
    expect(await post(off.base, '9.9.9.2')).toBe(429); // farklı XFF'e rağmen aynı soket IP'si
    const on = await start({ TRUST_PROXY: 'true' }, { registerMax: 1 });
    expect(await post(on.base, '8.8.8.1')).toBe(422);
    expect(await post(on.base, '8.8.8.2')).toBe(422); // farklı istemci IP'si
    expect(await post(on.base, '8.8.8.2')).toBe(429);
    expect(await post(on.base, 'sahte, 8.8.8.3')).toBe(422); // yalnızca SON girdi (vekilin eklediği) kullanılır
  });
});
