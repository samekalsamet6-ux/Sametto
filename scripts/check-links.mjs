// dist/ içindeki dahili bağlantıları doğrular.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p);
  }
})(dist);

let bad = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:#[^"]*)?"/g)) {
    const href = decodeURIComponent(m[1]);
    if (href.startsWith('/pagefind/')) continue;
    const ok = existsSync(join(dist, href)) && (statSync(join(dist, href)).isFile() || existsSync(join(dist, href, 'index.html')));
    if (!ok) { console.error(`KIRIK: ${f} -> ${href}`); bad++; }
  }
}
console.log(`${files.length} sayfa tarandı, ${bad} kırık bağlantı.`);
process.exit(bad ? 1 : 0);
