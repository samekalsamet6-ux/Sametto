// PWA denetimi: manifest, simgeler, hizmet çalışanı kaydı ve çevrimdışı gezinti.
// Kullanım: npm run build && npm run pwa   (CHROME ile tarayıcı yolu verilebilir)
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { serve } from './serve.mjs';

const fail = [];
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fail.push(msg); };

const { server, port } = await serve('dist');
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// 1) Manifest ve simgeler
const m = await (await fetch(`${base}/manifest.webmanifest`)).json();
ok(m.name && m.short_name && m.start_url === '/' && m.display === 'standalone', 'manifest temel alanlar');
for (const i of m.icons) ok(existsSync('dist' + i.src), `simge mevcut: ${i.src} (${i.purpose})`);
ok(m.icons.some((i) => i.sizes === '192x192') && m.icons.some((i) => i.sizes === '512x512'), '192 ve 512 simge var');
ok(m.icons.some((i) => i.purpose === 'maskable'), 'maskable simge var');

// 2) Hizmet çalışanı
await page.goto(base + '/');
await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('SW hazır olmadı (kurulum başarısız?)')), 15000))]));
await page.waitForFunction(() => navigator.serviceWorker.controller || true);
await page.reload(); // controller devralsın
const ctrl = await page.evaluate(() => !!navigator.serviceWorker.controller);
ok(ctrl, 'hizmet çalışanı sayfayı denetliyor');
const cached = await page.evaluate(async () => (await (await caches.open((await caches.keys())[0])).keys()).length);
ok(cached > 100, `önbellekte ${cached} dosya`);
ok(await page.locator('link[rel=manifest]').count() === 1, 'manifest bağlantısı sayfada');

// 3) Çevrimdışı
// Gerçek çevrimdışı: sunucuyu kapat (Playwright setOffline hizmet çalışanı isteklerini kesmez).
server.closeAllConnections();
await new Promise((r) => server.close(r));
ok(await fetch(base + '/').then(() => false, () => true), 'sunucu kapalı (ağ erişimi yok)');
const visit = async (path) => { const r = await page.goto(base + path).catch(() => null); return r; };
for (const [path, needle] of [['/rehber/baslangic/05-azot-dongusu-kurulum/', 'Azot döngüsü'], ['/wiki/gonopodium/', 'Gonopodium'], ['/araclar/hacim/', 'hacmi'], ['/sorun-giderme/', 'Sorun giderme'], ['/rehber/baslangic/05-azot-dongusu-kurulum', 'Azot döngüsü']]) {
  const r = await visit(path);
  const h1 = r ? await page.locator('h1').first().innerText().catch(() => '') : '';
  ok(!!r && h1.includes(needle), `çevrimdışı açılıyor: ${path}`);
}
const r404 = await visit('/olmayan-sayfa/');
ok(r404 && (await page.locator('h1').first().innerText()).includes('Çevrimdışı'), 'bilinmeyen sayfa → çevrimdışı sayfası');

// 4) Çevrimdışı araç çalışıyor mu?
await visit('/araclar/hacim/');
await page.click('form button');
ok((await page.locator('#out').innerText()).includes('Net:'), 'çevrimdışı hacim aracı hesaplıyor');

// 5) Çevrimdışı arama dizini
await visit('/ara/');
await page.waitForSelector('.pagefind-ui__search-input', { timeout: 5000 }).catch(() => {});
await page.fill('.pagefind-ui__search-input', 'gonopodium').catch(() => {});
const hit = await page.waitForSelector('.pagefind-ui__result', { timeout: 8000 }).then(() => true).catch(() => false);
ok(hit, 'çevrimdışı arama sonuç veriyor');

await browser.close();
console.log(fail.length ? `\n${fail.length} denetim başarısız.` : '\nPWA denetimi geçti.');
process.exit(fail.length ? 1 : 0);
