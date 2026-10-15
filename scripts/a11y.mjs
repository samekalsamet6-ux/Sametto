// Tüm sayfalarda axe-core taraması (açık/koyu tema, mobil görünüm).
// Kullanım: npm run build && npm run a11y   (CHROME ortam değişkeni ile tarayıcı yolu verilebilir)
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const pages = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== 'pagefind') walk(p); }
    else if (f === 'index.html') pages.push('/' + relative('dist', d).replace(/\\/g, '/'));
  }
})('dist');

const { server, port } = await serve('dist');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const found = new Map();
let scanned = 0;

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  for (const path of pages) {
    await page.goto(`http://127.0.0.1:${port}${path === '/' ? '/' : path + '/'}`, { waitUntil: 'load' });
    await page.evaluate(axeSource);
    const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
    scanned++;
    for (const v of res.violations) {
      const key = `${v.id}|${scheme}`;
      const e = found.get(key) ?? { id: v.id, impact: v.impact, help: v.help, scheme, pages: new Set(), samples: new Set() };
      e.pages.add(path);
      for (const n of v.nodes.slice(0, 3)) e.samples.add(n.html.slice(0, 120) + (n.any[0]?.message ? '  ⇒ ' + n.any[0].message.slice(0, 120) : ''));
      found.set(key, e);
    }
  }
  await ctx.close();
}
await browser.close();
server.close();

console.log(`${pages.length} sayfa × 2 tema = ${scanned} tarama`);
if (!found.size) console.log('axe ihlali yok.');
for (const e of found.values()) console.log(`\n[${e.impact}] ${e.id} (${e.scheme}) — ${e.help}\n  ${e.pages.size} sayfa, örn. ${[...e.pages][0]}\n${[...e.samples].slice(0, 4).map((x) => '  - ' + x).join('\n')}`);
process.exit(found.size ? 1 : 0);
