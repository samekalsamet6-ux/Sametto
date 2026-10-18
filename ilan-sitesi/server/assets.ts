import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Assets } from './views/layout.ts';
import { esc } from './views/html.ts';

const ENTRY_FILES: Record<string, string> = { site: 'client/site.ts', ilanForm: 'client/ilan-form.ts', ilanDetay: 'client/ilan-detay.ts', ilanlar: 'client/ilanlar.ts' };

export function devAssets(): Assets {
  return {
    head: () => `<script type="module" src="/@vite/client"></script>\n<link rel="stylesheet" href="/client/styles.css">`,
    scripts: (entry) => `<script type="module" src="/${ENTRY_FILES[entry] ?? ENTRY_FILES.site}"></script>`,
  };
}

interface ManifestEntry { file: string; css?: string[]; imports?: string[] }
export function prodAssets(root: string): Assets {
  const mf = path.join(root, 'dist/client/.vite/manifest.json');
  if (!existsSync(mf)) throw new Error('dist/client bulunamadı: önce "npm run build" çalıştırın.');
  const manifest = JSON.parse(readFileSync(mf, 'utf8')) as Record<string, ManifestEntry>;
  const cssOf = (key: string, seen = new Set<string>()): string[] => {
    if (seen.has(key) || !manifest[key]) return [];
    seen.add(key);
    const e = manifest[key];
    return [...(e.css ?? []), ...(e.imports ?? []).flatMap((i) => cssOf(i, seen))];
  };
  const cache = new Map<string, { head: string; script: string }>();
  const resolve = (entry: string) => {
    let c = cache.get(entry);
    if (!c) {
      const key = ENTRY_FILES[entry] ?? ENTRY_FILES.site;
      const m = manifest[key];
      const css = [...new Set(cssOf(key))].map((f) => `<link rel="stylesheet" href="/${esc(f)}">`).join('\n');
      c = { head: css, script: `<script type="module" src="/${esc(m.file)}"></script>` };
      cache.set(entry, c);
    }
    return c;
  };
  return { head: (entry) => resolve(entry).head, scripts: (entry) => resolve(entry).script };
}
