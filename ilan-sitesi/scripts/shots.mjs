// Geliştirici aracı: çalışan sunucudan ekran görüntüleri alır. Kullanım: BASE=http://127.0.0.1:5181 OUT=/yol node scripts/shots.mjs
import { chromium } from '@playwright/test';
import path from 'node:path';
const BASE = process.env.BASE || 'http://127.0.0.1:5181', OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, vp, mobile] of [['d', { width: 1280, height: 800 }, false], ['m', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, locale: 'tr-TR' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 200)); });
  const shot = async (n, full = true) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`), fullPage: full });
  await page.goto(BASE + '/'); await shot('home');
  await page.goto(BASE + '/ilanlar?tur=lepistes'); await shot('arama');
  await page.goto(BASE + '/giris'); await page.fill('#email', 'ornek.satici@example.test'); await page.fill('#password', 'ornek-parola-123'); await page.click('button[type=submit].btn');
  await page.waitForURL(BASE + '/');
  await page.goto(BASE + '/ilan/yeni'); await page.selectOption('#tur', 'lepistes'); await page.waitForSelector('#sahne[data-state=ready]', { timeout: 40000 }).catch(() => {}); await page.waitForTimeout(1500); await shot('form');
  await page.goto(BASE + '/ilan/1'); await page.waitForSelector('#sahne[data-state]', { timeout: 40000 }).catch(() => {}); await page.waitForTimeout(2000); await shot('detay');
  await page.goto(BASE + '/satici/1'); await shot('satici');
  await ctx.close();
}
await browser.close();
