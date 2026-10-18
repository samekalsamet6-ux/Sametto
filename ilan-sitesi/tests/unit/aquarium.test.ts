import { describe, it, expect, beforeEach } from 'vitest';
import { validateFish, aquariumCapError, MAX_FISH, MAX_KARIDES, MAX_HEAVY } from '../../server/validation.ts';
import { openDb, createUser, addAquariumFish, listAquariumFish, InvalidFishError, AquariumCapError, type DB } from '../../server/db.ts';
import { CATALOG } from '../../shared/catalog.ts';
import { createMotion, poseFits, tankDims, behaviorOf, isBottom, REL_SIZE, type Extent } from '../../client/tank-motion.ts';

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
    // Amano karidesi de aynı karides sınırına sayılır
    expect(aquariumCapError(['karides', 'amano', 'amano'], 'amano')).toMatch(/karides/);
    expect(aquariumCapError(['karides', 'amano', 'amano'], 'karides')).toMatch(/karides/);
    expect(aquariumCapError(['karides', 'amano'], 'amano')).toBeNull();
    expect(aquariumCapError(['amano', 'amano', 'amano'], 'neon')).toBeNull();
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
    expect(() => add('amano')).toThrow(AquariumCapError);
    add('japon'); add('pleco'); add('vatoz'); add('japon');
    expect(() => add('vatoz')).toThrow(AquariumCapError);
  });
});

describe('yüzme yolları (tank-motion)', () => {
  const ext = (sp: string): Extent => ({ hx: 0.55 * (REL_SIZE[sp] ?? 0.8) * 1.1, hy: 0.3 * (REL_SIZE[sp] ?? 0.8), hz: 0.25 * (REL_SIZE[sp] ?? 0.8) });
  const species = Object.keys(REL_SIZE);
  const mk = (sp: string, i: number, n: number, aspect = 1.78, rank = 0) => { const dims = tankDims(n, aspect, 0.9), e = ext(sp); return { dims, e, m: createMotion({ index: i, species: sp, ext: e, dims, rank }) }; };
  it('her balık her zaman cam kutunun içinde ve kum zemininin üstünde kalır', () => {
    for (const n of [1, 5, 12]) for (const aspect of [1, 1.78]) {
      for (let i = 0; i < n; i++) {
        const sp = species[i % species.length], { dims, e, m } = mk(sp, i, n, aspect, Math.floor(i / species.length));
        for (let t = 0; t < m.period * 2; t += 0.37) {
          const f = poseFits(m.pose(t), e, dims);
          expect(f, `${sp} n=${n} t=${t}`).toEqual({ inside: true, aboveFloor: true, belowSurface: true });
        }
      }
    }
  });
  it('her tür kendi derinlik bandında kalır; hiçbiri yüzeyde asılı durmaz', () => {
    for (const sp of species) for (const i of [0, 3, 7]) {
      const { m } = mk(sp, i, 12), b = behaviorOf(sp), span = m.ceilY - m.floorY;
      for (let t = 0; t < m.period * 1.5; t += 0.5) {
        const y = m.pose(t).y;
        if (b.bottom) expect(y, `${sp} t=${t}`).toBeLessThanOrEqual(m.floorY + 0.06);
        else {
          expect(y, `${sp} t=${t}`).toBeGreaterThanOrEqual(m.floorY + span * b.band[0] - 1e-6);
          expect(y, `${sp} t=${t}`).toBeLessThanOrEqual(m.floorY + span * b.band[1] + 1e-6);
          expect(b.band[1], sp).toBeLessThanOrEqual(0.82);
        }
      }
    }
  });
  it('dipte yaşayanlar zemine paralel ve zeminde; sınıflara göre bantlar mantıklı', () => {
    for (const sp of ['pleco', 'vatoz', 'corydoras', 'karides', 'amano']) {
      expect(isBottom(sp)).toBe(true);
      const { m } = mk(sp, 2, 8);
      for (let t = 0; t < m.period; t += 0.7) { const p = m.pose(t); expect(p.pitch).toBe(0); expect(p.y).toBeLessThan(m.floorY + 0.06); }
    }
    const mid = (sp: string) => (behaviorOf(sp).band[0] + behaviorOf(sp).band[1]) / 2;
    expect(mid('zebradanio')).toBeGreaterThan(mid('neon'));
    expect(mid('ram')).toBeLessThan(0.3);
    expect(mid('japon')).toBeLessThan(mid('betta'));
    for (const sp of ['neon', 'kardinal', 'zebradanio', 'kaplanbarb']) expect(behaviorOf(sp).shoal).toBe(true);
  });
  it('burun hareket yönüne bakar, yön ve konum sıçramaz (karides/pleco duruşları dahil)', () => {
    for (const sp of species) {
      const { m } = mk(sp, 1, 6);
      let prev = m.pose(0);
      for (let t = 0.1; t < m.period; t += 0.1) {
        const p = m.pose(t);
        const dx = p.x - prev.x, dz = p.z - prev.z, mv = Math.hypot(dx, dz);
        expect(Math.hypot(dx, dz), `${sp} konum sıçraması t=${t}`).toBeLessThan(1.2);
        let dy = Math.abs(p.yaw - prev.yaw); dy = Math.min(dy, 2 * Math.PI - dy);
        expect(dy, `${sp} yaw sıçraması t=${t}`).toBeLessThan(0.5);
        if (mv > 0.02) { // ilerlerken burun (cos yaw, -sin yaw) yönü ile hareket yönü hizalı
          const mid = m.pose(t - 0.05), want = Math.atan2(-(dz), dx);
          let d = Math.abs(mid.yaw - want); d = Math.min(d, 2 * Math.PI - d);
          expect(d, `${sp} yön t=${t}`).toBeLessThan(0.45);
        }
        prev = p;
      }
    }
  });
  it('durup kalkanlar gerçekten durur; sürü balıkları aynı yönde döner', () => {
    const { m } = mk('pleco', 0, 6);
    let still = 0, n = 0, prev = m.pose(0);
    for (let t = 0.5; t < m.period; t += 0.5) { const p = m.pose(t); if (Math.hypot(p.x - prev.x, p.z - prev.z) < 0.01) still++; n++; prev = p; }
    expect(still / n).toBeGreaterThan(0.4);
    const a = mk('neon', 0, 12, 1.78, 0).m, b = mk('neon', 1, 12, 1.78, 1).m;
    const turn = (m2: typeof a) => { const p0 = m2.pose(5), p1 = m2.pose(8); let d = p1.yaw - p0.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.sign(d); };
    expect(turn(a)).toBe(turn(b));
  });
  it('yol tekrar eder (döngü) ve yüzenlerin hızı sıfırlanmaz', () => {
    const { m } = mk('neon', 2, 6);
    const a = m.pose(3), b = m.pose(3 + m.period);
    expect(b.x).toBeCloseTo(a.x, 5); expect(b.z).toBeCloseTo(a.z, 5);
    const c = m.pose(3.01); expect(Math.hypot(c.x - a.x, c.z - a.z)).toBeGreaterThan(1e-5);
  });
  it('tank 12 balığa yer açar', () => {
    const d = tankDims(12, 1.78, 0.9);
    expect(d.W).toBeGreaterThanOrEqual(9); expect(d.D).toBeGreaterThanOrEqual(4.5);
  });
});
