// dist/ içeriğinden sürümlü bir hizmet çalışanı (dist/sw.js) üretir.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const dist = 'dist';
const urls = [];
const hash = createHash('sha256');
(function walk(d) {
  for (const f of readdirSync(d).sort()) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const rel = '/' + relative(dist, p).replace(/\\/g, '/');
    // Barındırma sağlayıcısının işlediği ve istemciye sunulmayan dosyalar önbelleğe alınmaz (aksi halde kurulum 404 ile başarısız olur)
    if (rel === '/sw.js' || rel === '/sw-template.js' || rel === '/_headers' || rel === '/_redirects' || rel.endsWith('.map')) continue;
    urls.push(rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel);
    hash.update(rel).update(readFileSync(p));
  }
})(dist);

if (!urls.includes('/offline/')) throw new Error('/offline/ sayfası yok: src/pages/offline.astro derlenmedi');

hash.update(readFileSync('public/sw-template.js'));
const cache = `lepistes-${hash.digest('hex').slice(0, 10)}`;
const tpl = readFileSync('public/sw-template.js', 'utf8');
const sw = tpl.replaceAll("'__CACHE__'", JSON.stringify(cache)).replaceAll('__PRECACHE__', JSON.stringify(urls));
if (/__CACHE__|__PRECACHE__/.test(sw)) throw new Error('sw.js yer tutucuları doldurulamadı');
writeFileSync(join(dist, 'sw.js'), sw);
// sw-template.js dağıtıma girmesin
try { (await import('node:fs')).rmSync(join(dist, 'sw-template.js')); } catch { /* yok */ }
console.log(`sw.js: ${urls.length} dosya önbelleğe alınacak (${cache}).`);
