// 3B tür modüllerinden (../src/lib/<tür>/index.ts, SALT OKUNUR) ilan sitesinin ihtiyaç duyduğu üst veriyi çıkarır
// ve shared/catalog.json olarak yazar. Sunucu ve testler bu dosyayı kullanır; böylece Node tarafında three.js yüklenmez.
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(root, '..');
export const SPECIES_DIRS = {
  lepistes: 'guppy', molly: 'molly', platy: 'platy', betta: 'betta', vatoz: 'vatoz', karides: 'karides',
  melek: 'melek', diskus: 'diskus', pleco: 'pleco', neon: 'neon', corydoras: 'corydoras', japon: 'japon', kilickuyruk: 'kilickuyruk', gurami: 'gurami', kaplanbarb: 'kaplanbarb', zebradanio: 'zebradanio',
};

// Şekil/renk kaydı; 'dogrulanmali' yalnızca true ise yazılır (adı kaynaklarda tutarsız / doğrulanmalı).
const item = (x) => ({ id: x.id, ad: x.ad, grup: x.grup ?? '', ...(x.dogrulanmali ? { dogrulanmali: true } : {}) });
// kisaAciklama içindeki sabit sayılar ("29 şematik renk", "15 form") şekil/renk listesi uzunluğundan türetilir; bayatlayamaz.
const derivedCounts = (s) => (s.kisaAciklama ?? '')
  .replace(/\b\d+(?= (?:şematik )?(?:renk|desen))/g, String(s.variants.length))
  .replace(/\b\d+(?= form\b)/g, String((s.forms ?? []).length));

const server = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true, fs: { allow: [path.resolve(ROOT, '..')] } }, appType: 'custom', optimizeDeps: { noDiscovery: true } });
try {
  const out = [];
  for (const [id, dir] of Object.entries(SPECIES_DIRS)) {
    const mod = await server.ssrLoadModule(path.resolve(ROOT, '..', 'src/lib', dir, 'index.ts'));
    const s = mod.species;
    if (s.id !== id) throw new Error(`Beklenmeyen tür kimliği: ${s.id} != ${id}`);
    out.push({
      id: s.id, ad: s.ad, latin: s.latin, kisaAciklama: derivedCounts(s), not: s.not ?? '',
      sexes: s.sexes.map((x) => ({ id: x.id, ad: x.ad })),
      views: s.views.map((v) => ({ id: v.id, ad: v.ad })),
      forms: (s.forms ?? []).map(item),
      variants: s.variants.map(item),
    });
  }
  writeFileSync(path.join(ROOT, 'shared/catalog.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`catalog.json yazıldı: ${out.length} tür`);
  for (const s of out) console.log(' ', s.id, 'şekil:', s.forms.length, 'renk:', s.variants.length, 'cinsiyet:', s.sexes.map((x) => x.id).join('/'));
} finally { await server.close(); }
