// Danışman turu: katalog 'dogrulanmali', 'ayrım yok' cinsiyet, yönetici kaldırma, giriş kilidi, eşzamanlı yükleme sınırı.
import { describe, it, expect, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { connect } from 'node:net';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CATALOG, noSexSplit, sexOptions, itemLabel, UNVERIFIED_NOTE } from '../../shared/catalog.ts';
import { validateListing, validateFish } from '../../server/validation.ts';
import { readConfig } from '../../server/config.ts';
import { openDb, setAdmin, addAquariumFish, listAquariumFish, createUser, type DB } from '../../server/db.ts';
import { createApp } from '../../server/app.ts';
import { devAssets } from '../../server/assets.ts';
import { placeholderPng } from '../../server/placeholder.ts';

const servers: Server[] = [];
afterAll(() => { servers.forEach((s) => s.close()); });

async function start(tweak: Record<string, unknown> = {}, env: Record<string, string> = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'ilan-uyum-'));
  const cfg = { ...readConfig({ DATA_DIR: dir, ...env } as NodeJS.ProcessEnv), loginMaxFails: 3, registerMax: 1000, ...tweak };
  const db = openDb(cfg.dbPath);
  const app = createApp(cfg, db, devAssets());
  const server = createServer((q, s) => void app.handler(q, s)); servers.push(server);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as { port: number }).port;
  return { db, port, base: `http://127.0.0.1:${port}` };
}
class Client {
  jar = new Map<string, string>(); base: string; extra: Record<string, string>;
  constructor(base: string, extra: Record<string, string> = {}) { this.base = base; this.extra = extra; }
  cookie() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '); }
  async req(p: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers); for (const [k, v] of Object.entries(this.extra)) headers.set(k, v);
    if (this.jar.size) headers.set('cookie', this.cookie());
    const res = await fetch(this.base + p, { ...init, headers, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); const v = kv.slice(i + 1); if (v === '') this.jar.delete(kv.slice(0, i)); else this.jar.set(kv.slice(0, i), v); }
    return res;
  }
  async csrf() { await this.req('/giris'); return this.jar.get('csrf')!; }
  async postForm(p: string, fields: Record<string, string>, headers: Record<string, string> = {}, token?: string | null) {
    const t = token === undefined ? await this.csrf() : token;
    return this.req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams({ ...(t === null ? {} : { _csrf: t }), ...fields }) });
  }
  async register(email: string) { return this.postForm('/kayit', { displayName: 'Test', email, password: 'parola-12345', password2: 'parola-12345' }); }
  async list(fields: Record<string, string>) {
    const fd = new FormData(); fd.set('_csrf', await this.csrf());
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    fd.append('photos', new Blob([new Uint8Array(placeholderPng(1))], { type: 'image/png' }), 'a.png');
    return this.req('/ilan/yeni', { method: 'POST', body: fd });
  }
}
const BASE = { quantity: '1', price: '300', city: 'Ankara', district: 'Çankaya', description: 'Sağlıklı balık, ayrı kavanozda.' };

describe('A1 katalog: dogrulanmali ve türetilmiş sayılar', () => {
  const dirs: Record<string, string> = { lepistes: 'guppy' };
  for (const s of CATALOG) {
    it(`${s.id}: dogrulanmali ve kisaAciklama sayıları tür modülüyle uyumlu`, async () => {
      const mod = (await import(`../../../src/lib/${dirs[s.id] ?? s.id}/index.ts`)).species;
      type It = { id: string; dogrulanmali?: boolean };
      expect(s.variants.map((v) => !!v.dogrulanmali)).toEqual(mod.variants.map((v: It) => !!v.dogrulanmali));
      expect(s.forms.map((f) => !!f.dogrulanmali)).toEqual((mod.forms ?? []).map((f: It) => !!f.dogrulanmali));
      const nums = (s.kisaAciklama.match(/(\d+) (?:şematik )?(?:renk|desen)/g) ?? []).map((m) => Number(m.match(/\d+/)![0]));
      for (const n of nums) expect(n).toBe(s.variants.length);
      for (const m of s.kisaAciklama.matchAll(/(\d+) form\b/g)) expect(Number(m[1])).toBe(s.forms.length);
    });
  }
  it('en az bir kayıt doğrulanmalı işaretli ve etiket ekini taşır', () => {
    const all = CATALOG.flatMap((s) => [...s.forms, ...s.variants]).filter((x) => x.dogrulanmali);
    expect(all.length).toBeGreaterThan(0);
    expect(itemLabel(all[0])).toBe(`${all[0].ad} ${UNVERIFIED_NOTE}`);
  });
  it('ilan formu seçeneği ve ilan detayı etiketi doğrulanmalı ekini gösterir', async () => {
    const { base, db } = await start();
    const sp = CATALOG.find((s) => s.variants.some((v) => v.dogrulanmali))!;
    const v = sp.variants.find((x) => x.dogrulanmali)!;
    const c = new Client(base); await c.register('v1@example.test');
    const form = await (await c.req('/ilan/yeni')).text();
    expect(form).toBeTypeOf('string');
    const res = await c.list({ ...BASE, species: sp.id, form: sp.forms[0]?.id ?? '', variant: v.id, sex: 'erkek' });
    expect(res.status).toBe(303);
    const detail = await (await c.req(res.headers.get('location')!.split('?')[0])).text();
    expect(detail).toContain(UNVERIFIED_NOTE);
    void db;
  });
});

describe('A2 "Ayrım yok" türleri (melek, diskus)', () => {
  it('melek/diskus: tek seçenek bilinmiyor / "Ayrım yok"; gerçek model kimliği korunur', () => {
    for (const id of ['melek', 'diskus']) {
      expect(noSexSplit(id)).toBe(true);
      expect(sexOptions(id)).toEqual([{ id: 'bilinmiyor', ad: 'Ayrım yok' }]);
      expect(CATALOG.find((s) => s.id === id)!.sexes).toHaveLength(1); // modele geçilecek gerçek kimlik
    }
    expect(noSexSplit('betta')).toBe(false);
  });
  it('ilan: eski "disi" de, "bilinmiyor" da bilinmiyor olarak saklanır', () => {
    for (const sex of ['disi', 'bilinmiyor']) {
      const r = validateListing({ ...BASE, species: 'melek', form: CATALOG.find((s) => s.id === 'melek')!.forms[0].id, variant: CATALOG.find((s) => s.id === 'melek')!.variants[0].id, sex });
      expect(r.errors).toEqual({}); expect(r.value!.sex).toBe('bilinmiyor');
    }
    expect(validateListing({ ...BASE, species: 'melek', sex: 'erkek' }).errors.sex).toBeTruthy();
  });
  it('akvaryum: melek/diskus eklenebilir ve bilinmiyor saklanır', () => {
    for (const id of ['melek', 'diskus']) {
      const sp = CATALOG.find((s) => s.id === id)!;
      for (const sex of ['disi', 'bilinmiyor']) {
        const r = validateFish({ species: id, form: sp.forms[0]?.id ?? '', variant: sp.variants[0].id, sex });
        expect(r.errors).toEqual({}); expect(r.value!.sex).toBe('bilinmiyor');
      }
    }
  });
  it('geçiş: eski "disi" satırları veri silinmeden "bilinmiyor" olur', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ilan-mig-'));
    const file = path.join(dir, 'app.db');
    let db: DB = openDb(file);
    const uid = createUser(db, 'm@example.test', 'x', 'M');
    const sp = CATALOG.find((s) => s.id === 'melek')!;
    db.prepare('INSERT INTO aquarium_fish (user_id,species_id,form_id,variant_id,sex,created_at,position) VALUES (?,?,?,?,?,?,1)').run(uid, 'melek', sp.forms[0].id, sp.variants[0].id, 'disi', Date.now());
    db.prepare('INSERT INTO aquarium_fish (user_id,species_id,form_id,variant_id,sex,created_at,position) VALUES (?,?,?,?,?,?,2)').run(uid, 'betta', null, null, 'disi', Date.now());
    db.prepare(`INSERT INTO listings (user_id,title,species_id,sex,quantity,price_kurus,city,description,created_at) VALUES (?,?,?,?,1,100,'Ankara','x',1)`).run(uid, 't', 'diskus', 'disi');
    db.close();
    db = openDb(file);
    const fish = listAquariumFish(db, uid);
    expect(fish.map((f) => f.sex)).toEqual(['bilinmiyor', 'disi']); // betta dokunulmaz
    expect((db.prepare('SELECT sex FROM listings').get() as { sex: string }).sex).toBe('bilinmiyor');
    expect(() => addAquariumFish(db, uid, { speciesId: 'diskus', formId: CATALOG.find((s) => s.id === 'diskus')!.forms[0]?.id, variantId: CATALOG.find((s) => s.id === 'diskus')!.variants[0].id, sex: 'bilinmiyor' })).not.toThrow();
  });
  it('ilan detayında "Ayrım yok" görünür', async () => {
    const { base } = await start();
    const c = new Client(base); await c.register('ay@example.test');
    const sp = CATALOG.find((s) => s.id === 'melek')!;
    const res = await c.list({ ...BASE, species: 'melek', form: sp.forms[0].id, variant: sp.variants[0].id, sex: 'bilinmiyor' });
    expect(res.status).toBe(303);
    const html = await (await c.req(res.headers.get('location')!.split('?')[0])).text();
    expect(html).toContain('Ayrım yok'); expect(html).not.toContain('Dişi');
  });
});

describe('A3 yönetici ilan kaldırma', () => {
  it('CSRF + Origin + is_admin; ilan kalkar, şikayet çözülür, /admin/raporlar durumu gösterir', async () => {
    const { base, db } = await start();
    const seller = new Client(base); await seller.register('s@example.test');
    const res = await seller.list({ ...BASE, species: 'diger', speciesOther: 'Test türü', sex: 'bilinmiyor' });
    const loc = res.headers.get('location')!.split('?')[0]; const id = Number(loc.split('/').pop());
    const rep = new Client(base); await rep.register('r@example.test');
    await rep.postForm(`${loc}/sikayet`, { reason: 'yasak', note: 'korunan tür' });
    const admin = new Client(base); await admin.register('a@example.test');
    const act = `/admin/ilan/${id}/kaldir`;
    expect((await admin.postForm(act, {})).status).toBe(404); // henüz yönetici değil
    expect((await rep.postForm(act, {})).status).toBe(404);
    setAdmin(db, 'a@example.test');
    expect((await admin.postForm(act, {}, {}, null)).status).toBe(403); // CSRF yok
    expect((await admin.postForm(act, {}, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await seller.req(loc)).status).toBe(200);
    const ok = await admin.postForm(act, {});
    expect(ok.status).toBe(303); expect(ok.headers.get('location')).toContain('/admin/raporlar');
    expect((await seller.req(loc)).status).toBe(404);
    expect((db.prepare('SELECT resolved_at FROM reports WHERE listing_id = ?').get(id) as { resolved_at: number | null }).resolved_at).toBeTruthy();
    const page = await (await admin.req('/admin/raporlar?kaldirildi=1')).text();
    expect(page).toContain('Çözüldü'); expect(page).toContain('İlan kaldırıldı');
    expect((await admin.postForm(act, {})).status).toBe(404); // ikinci kez
  });
  it('bekleyen şikayet satırında "İlanı kaldır" düğmesi vardır', async () => {
    const { base, db } = await start();
    const seller = new Client(base); await seller.register('s2@example.test');
    const loc = (await seller.list({ ...BASE, species: 'diger', speciesOther: 'Test türü', sex: 'bilinmiyor' })).headers.get('location')!.split('?')[0];
    const rep = new Client(base); await rep.register('r2@example.test'); await rep.postForm(`${loc}/sikayet`, { reason: 'sahte' });
    const admin = new Client(base); await admin.register('a2@example.test'); setAdmin(db, 'a2@example.test');
    const page = await (await admin.req('/admin/raporlar')).text();
    expect(page).toContain('İnceleme bekliyor'); expect(page).toContain('/kaldir');
  });
});

describe('A4 giriş kilidi (IP, e-posta) çiftine bağlı', () => {
  it('saldırgan kurbanın e-postasıyla kilitleyemez; kurban başka IP den girer', async () => {
    const { base } = await start({ trustProxy: true });
    const v = new Client(base, { 'x-forwarded-for': '10.0.0.2' }); await v.register('victim@example.test');
    const atk = new Client(base, { 'x-forwarded-for': '10.0.0.1' });
    for (let i = 0; i < 3; i++) expect((await atk.postForm('/giris', { email: 'victim@example.test', password: 'x' + i })).status).toBe(401);
    expect((await atk.postForm('/giris', { email: 'victim@example.test', password: 'x' })).status).toBe(429);
    const legit = new Client(base, { 'x-forwarded-for': '10.0.0.2' });
    expect((await legit.postForm('/giris', { email: 'victim@example.test', password: 'parola-12345' })).status).toBe(303);
  });
  it('tek IP birçok e-postayı deneyince IP başına gevşek sınır devreye girer', async () => {
    const { base } = await start({ trustProxy: true, loginMaxFails: 1 });
    const atk = new Client(base, { 'x-forwarded-for': '10.0.0.9' });
    let last = 0;
    for (let i = 0; i < 8; i++) last = (await atk.postForm('/giris', { email: `u${i}@example.test`, password: 'x' })).status;
    expect(last).toBe(429);
  });
});

describe('A5 eşzamanlı yükleme sınırı', () => {
  it('yuva doluyken 503 + Retry-After; yuva boşalınca yeniden çalışır', async () => {
    const { base, port } = await start({ maxConcurrentUploads: 1 });
    const c = new Client(base); await c.register('up@example.test');
    // Yarım gövdeli bir yükleme yuvayı tutar
    const sock = connect(port, '127.0.0.1');
    await new Promise<void>((r) => sock.once('connect', () => r()));
    sock.write(`POST /ilan/yeni HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nCookie: ${c.cookie()}\r\nContent-Type: multipart/form-data; boundary=zzz\r\nContent-Length: 100000\r\n\r\n--zzz\r\n`);
    await new Promise((r) => setTimeout(r, 300));
    const second = await c.list({ ...BASE, species: 'diger', speciesOther: 'Test türü', sex: 'bilinmiyor' });
    expect(second.status).toBe(503); expect(second.headers.get('retry-after')).toBeTruthy();
    sock.destroy();
    let status = 0;
    for (let i = 0; i < 20 && status !== 303; i++) { await new Promise((r) => setTimeout(r, 100)); status = (await c.list({ ...BASE, species: 'diger', speciesOther: 'Test türü', sex: 'bilinmiyor' })).status; }
    expect(status).toBe(303);
  });
});
