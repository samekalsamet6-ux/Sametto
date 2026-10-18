import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CATALOG } from '../../shared/catalog.ts';

// shared/catalog.json, ../src/lib/<tür>/index.ts modüllerinden üretilir (npm run catalog). Güncel mi?
describe('katalog güncelliği', () => {
  const dirs: Record<string, string> = { lepistes: 'guppy', molly: 'molly', platy: 'platy', betta: 'betta', vatoz: 'vatoz', karides: 'karides', melek: 'melek', diskus: 'diskus', pleco: 'pleco', neon: 'neon', corydoras: 'corydoras', japon: 'japon', kilickuyruk: 'kilickuyruk', gurami: 'gurami', kaplanbarb: 'kaplanbarb', zebradanio: 'zebradanio' };
  for (const s of CATALOG) {
    it(`${s.id}: kimlikler tür modülüyle uyumlu`, async () => {
      const mod = (await import(`../../../src/lib/${dirs[s.id]}/index.ts`)).species;
      expect(mod.id).toBe(s.id);
      expect(mod.variants.map((v: { id: string }) => v.id)).toEqual(s.variants.map((v) => v.id));
      expect((mod.forms ?? []).map((f: { id: string }) => f.id)).toEqual(s.forms.map((f) => f.id));
      expect(mod.sexes.map((x: { id: string }) => x.id)).toEqual(s.sexes.map((x) => x.id));
    });
  }
  it('json okunabilir', () => { expect(JSON.parse(readFileSync(new URL('../../shared/catalog.json', import.meta.url), 'utf8'))).toHaveLength(CATALOG.length); });
});
