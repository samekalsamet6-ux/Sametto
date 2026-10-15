// Seçili sayfalarda Lighthouse (mobil) çalıştırır; eşik altındaysa hata verir.
// Kullanım: npm run build && npm run lighthouse   (CHROME ile tarayıcı yolu verilebilir)
import lighthouse from 'lighthouse';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const PAGES = ['/', '/rehber/baslangic/05-azot-dongusu-kurulum/', '/wiki/azot-dongusu/', '/araclar/azot-dongusu/', '/sorun-giderme/', '/seviye-testi/', '/ara/'];
const MIN = { performance: 0.85, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };

const { server, port } = await serve('dist');
const PORT = 9333;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', `--remote-debugging-port=${PORT}`] });
let failed = false;
const details = [];
for (const path of PAGES) {
  const r = await lighthouse(`http://127.0.0.1:${port}${path}`, { port: PORT, output: 'json', logLevel: 'error', onlyCategories: Object.keys(MIN) });
  const cats = r.lhr.categories;
  const row = Object.keys(MIN).map((k) => `${k}=${Math.round((cats[k].score ?? 0) * 100)}`).join('  ');
  const bad = Object.entries(MIN).filter(([k, m]) => (cats[k].score ?? 0) < m).map(([k]) => k);
  if (bad.length) failed = true;
  console.log(`${bad.length ? '✗' : '✓'} ${path.padEnd(48)} ${row}`);
  for (const k of bad) for (const a of cats[k].auditRefs) {
    const au = r.lhr.audits[a.id];
    if (au.score !== null && au.score < 0.9 && au.scoreDisplayMode !== 'notApplicable' && a.weight > 0) details.push(`  [${path}] ${k}: ${au.title} — ${au.displayValue ?? ''}`);
  }
}
if (details.length) console.log('\nDetay:\n' + [...new Set(details)].join('\n'));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
