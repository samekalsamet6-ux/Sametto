// Demo derlemesi: tek IIFE paketi (üç.js + 19 tür modülü + sunucu şablonları + istemci modülleri).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repoRoot = path.resolve(root, '..');

// client/*.ts sayfa modülleri import anında DOM'a bağlanır. Demo sayfayı yeniden çizdiği için, gövdeyi (içe aktarmalar hariç)
// `export default function init()` içine sarıyoruz; kaynak dosyalar DEĞİŞTİRİLMEZ. './site.ts' (confirm/CSS) demo tarafında yeniden yazıldı.
const PAGES = /[\\/]client[\\/](ilan-form|ilan-detay|ilanlar|satici|akvaryum-duzenle)\.ts$/;
const wrapPages = {
  name: 'demo-wrap-page-modules', enforce: 'pre',
  transform(code, id) {
    if (!PAGES.test(id)) return null;
    const head = [], body = []; let inHead = true;
    for (const line of code.split('\n')) {
      if (inHead && (/^import\s/.test(line) || /^\s*$/.test(line) || /^\s*\/\//.test(line))) {
        if (/^import\s+['"]\.\/site\.ts['"]/.test(line)) continue;
        head.push(line.replace("'./viewer3d.ts'", JSON.stringify(path.join(here, 'viewer-tracked.ts')).replace(/"/g, "'")));
      } else { inHead = false; body.push(line); }
    }
    return { code: `${head.join('\n')}\nexport default function init(): void {\n${body.join('\n')}\n}\n`, map: null };
  },
};

export default {
  root, logLevel: 'warn', configFile: false, plugins: [wrapPages],
  resolve: { alias: { three: path.resolve(repoRoot, 'node_modules/three') }, dedupe: ['three'] },
  build: {
    outDir: path.resolve(here, '.out'), emptyOutDir: true, minify: true, target: 'es2020', cssCodeSplit: false,
    lib: { entry: path.resolve(here, 'demo.ts'), formats: ['iife'], name: 'SuPazariDemo', fileName: () => 'demo.js' },
  },
};
