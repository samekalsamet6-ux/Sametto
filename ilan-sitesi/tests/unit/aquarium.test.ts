import { describe, it, expect, beforeEach } from 'vitest';
import { validateFish, aquariumCapError, MAX_FISH, MAX_KARIDES, MAX_HEAVY } from '../../server/validation.ts';
import { openDb, createUser, addAquariumFish, listAquariumFish, InvalidFishError, AquariumCapError, type DB } from '../../server/db.ts';
import { CATALOG } from '../../shared/catalog.ts';
import { createMotion, poseFits, tankDims, REL_SIZE, type Extent } from '../../client/tank-motion.ts';

const ok = { species: 'betta', form: 'plakat', variant: 'mavi', sex: 'erkek' };

describe('validateFish', () => {
  it('geçerli seçimi kabul eder', () => { expect(validateFish(ok)).toMatchObject({ ok: true, value: { speciesId: 'betta', formId: 'plakat', variantId: 'mavi', sex: 'erkek' } }); });
  it('tüm katalog türleri için ilk şekil/renk/cinsiyet geçerlidir', () => {
    for (const s of CATALOG) expect(validateFish({ species: s.id, form: s.forms[0]?.id ?? '', variant: s.variants[0]?.id ?? '', sex: s.sexes[0].id }).ok, s.id).toBe(true);
  });
  it('geçersiz tür, diğer, başka türün şekli/rengi, geçersiz ya da bilinmiyor cinsiyet reddedilir', () => {
    expect(validateFish({ ...ok, species: 'yok' }).errors.species).toBeTruthy();
    expect(validateFish({ ...ok, species: 'diger' }).errors.species).toBeTruthy();
    expect(validateFish({ ...ok, form: 'olmayan-sekil' }).errors.form).toBeTruthy();
    expect(validateFish({ ...ok, variant: 'red-cobra' }).errors.variant).toBeTruthy();
    expect(validateFish({ ...ok, sex: 'bilinmiyor' }).errors.sex).toBeTruthy();
    expect(validateFish({ ...ok, sex: 'erkek; DROP' }).errors.sex).toBeTruthy();
    expect(validateFish({ ...ok, form: '' }).errors.form).toBeTruthy();
    expect(validateFish({ species: 'melek', form: 'veil', variant: 'zebra', sex: 'erkek' }).errors.sex).toBeTruthy(); // melekte yalnızca "ayrım yok"
  });
  it('şekli olmayan türde şekil alanı yok sayılır', () => {
    expect(validateFish({ species: 'karides', form: 'x', variant: CATALOG.find((s) => s.id === 'karides')!.variants[0].id, sex: 'erkek' })).toMatchObject({ ok: true, value: { formId: null } });
  });
});

describe('üst sınırlar', () => {
  it('toplam, karides ve ağır tür sınırları', () => {
    expect(aquariumCapError(Array(MAX_FISH).fill('neon'), 'neon')).toMatch(/en fazla 12/);
    expect(aquariumCapError(Array(MAX_KARIDES).fill('karides'), 'karides')).toMatch(/karides/);
    expect(aquariumCapError(Array(MAX_KARIDES - 1).fill('karides'), 'karides')).toBeNull();
    expect(aquariumCapError(['japon', 'pleco', 'vatoz', 'japon'], 'pleco')).toMatch(/en fazla 4/);
    expect(aquariumCapError(['japon', 'pleco', 'vatoz'], 'japon')).toBeNull();
    expect(aquariumCapError(['japon', 'pleco', 'vatoz', 'japon'], 'neon')).toBeNull();
    expect(MAX_HEAVY).toBe(4);
  });
});

describe('akvaryum DB katmanı', () => {
  let db: DB, uid: number;
  beforeEach(() => { db = openDb(':memory:'); uid = createUser(db, 'a@b.com', 'x', 'Ali'); });
  const add = (species: string) => { const s = CATALOG.find((x) => x.id === species)!; return addAquariumFish(db, uid, { speciesId: species, formId: s.forms[0]?.id, variantId: s.variants[0]?.id, sex: s.sexes[0].id }); };
  it('geçersiz balık DB katmanında da reddedilir', () => {
    expect(() => addAquariumFish(db, uid, { speciesId: 'betta', formId: 'olmayan-sekil', variantId: 'mavi', sex: 'erkek' })).toThrow(InvalidFishError);
    expect(listAquariumFish(db, uid)).toHaveLength(0);
  });
  it('12. balığa kadar eklenir, 13. reddedilir', () => {
    for (let i = 0; i < MAX_FISH; i++) add('neon');
    expect(() => add('neon')).toThrow(AquariumCapError);
    expect(listAquariumFish(db, uid)).toHaveLength(MAX_FISH);
  });
  it('karides ve ağır tür sınırı DB katmanında zorlanır', () => {
    for (let i = 0; i < 3; i++) add('karides');
    expect(() => add('karides')).toThrow(AquariumCapError);
    add('japon'); add('pleco'); add('vatoz'); add('japon');
    expect(() => add('vatoz')).toThrow(AquariumCapError);
  });
});

describe('yüzme yolları (tank-motion)', () => {
  const ext = (sp: string): Extent => ({ hx: 0.55 * (REL_SIZE[sp] ?? 0.8) * 1.1, hy: 0.3 * (REL_SIZE[sp] ?? 0.8), hz: 0.25 * (REL_SIZE[sp] ?? 0.8) });
  it('her balık her zaman cam kutunun içinde ve kum zemininin üstünde kalır', () => {
    for (const n of [1, 5, 12]) for (const aspect of [1, 1.78]) {
      const sps = Object.keys(REL_SIZE);
      const dims = tankDims(n, aspect, 0.9);
      for (let i = 0; i < n; i++) {
        const sp = sps[i % sps.length], e = ext(sp), m = createMotion({ index: i, species: sp, ext: e, dims });
        for (let t = 0; t < m.period * 2; t += 0.37) {
          const f = poseFits(m.pose(t), e, dims);
          expect(f, `${sp} n=${n} t=${t}`).toEqual({ inside: true, aboveFloor: true, belowSurface: true });
        }
      }
    }
  });
  it('yol tekrar eder (döngü) ve hız sıfırlanmaz', () => {
    const dims = tankDims(6, 1.78), e = ext('neon'), m = createMotion({ index: 2, species: 'neon', ext: e, dims });
    const a = m.pose(3), b = m.pose(3 + m.period);
    expect(b.x).toBeCloseTo(a.x, 6); expect(b.z).toBeCloseTo(a.z, 6);
    const c = m.pose(3.01); expect(Math.hypot(c.x - a.x, c.z - a.z)).toBeGreaterThan(1e-5);
  });
});
