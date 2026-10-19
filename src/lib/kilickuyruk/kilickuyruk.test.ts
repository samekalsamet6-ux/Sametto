import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { BODY, SEXES, TAIL, analFin, bodyProfile, bodySurfacePoint, dorsalFin, envelope, eyeSpec, gonopodium, mouthLine, pectoralFin, pelvicFin, silhouette, tailFin, type Sex, type Vec3 } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, finColor, groupedVariants, hexToRgb, variantById } from './variants';
import { species } from './index';
import { BODY as PBODY } from '../platy/model';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const flat = (rays: Vec3[][]) => rays.flat().flat();

describe('kılıçkuyruk gövde ve yüzgeç geometrisi', () => {
  it('zarf uçlarda 0, tepede 1', () => {
    for (const s of SEXES) {
      expect(envelope(s, 0)).toBe(0);
      expect(envelope(s, 1)).toBe(0);
      expect(envelope(s, BODY[s].peak)).toBeCloseTo(1, 5);
    }
  });
  it('dişi erkekten büyük; platiye göre uzun ve ince (uzunluk/yükseklik daha büyük)', () => {
    for (const s of SEXES) expect(BODY[s].length / BODY[s].height).toBeGreaterThan(PBODY[s].length / PBODY[s].height);
    expect(BODY.disi.length).toBeGreaterThan(BODY.erkek.length);
    const m = bodyProfile('erkek', 0.5), f = bodyProfile('disi', 0.5);
    expect(f.up + f.down).toBeGreaterThan(m.up + m.down);
  });
  it('erkekte kılıç var, dişide yok: alt ışın uzun ve ince', () => {
    expect(TAIL.erkek.sword).toBeGreaterThan(1);
    expect(TAIL.disi.sword).toBeUndefined();
    const e = tailFin('erkek').rays.map((r) => r[r.length - 1]);
    const d = tailFin('disi').rays.map((r) => r[r.length - 1]);
    expect(e[0][0]).toBeGreaterThan(Math.max(...e.slice(4).map((p) => p[0])) + 0.8);
    expect(Math.max(...d.map((p) => p[0]))).toBeLessThan(e[0][0] - 0.8);
  });
  it('tüm yüzgeç ve yüzey noktaları sonlu', () => {
    for (const s of SEXES) {
      for (const f of [tailFin(s), dorsalFin(s), pectoralFin(s, 1), pectoralFin(s, -1), pelvicFin(s, 1)]) expect(finite(flat(f.rays))).toBe(true);
      for (let j = 0; j < 16; j++) expect(finite(bodySurfacePoint(s, 0.5, (j / 16) * 2 * Math.PI))).toBe(true);
      expect(finite(eyeSpec(s).center)).toBe(true);
      expect(mouthLine(s, 1).length).toBeGreaterThan(3);
    }
  });
  it('gonopodium yalnızca erkekte, anal yüzgeç yalnızca dişide', () => {
    expect(gonopodium('erkek')).not.toBeNull();
    expect(gonopodium('disi')).toBeNull();
    expect(analFin('erkek')).toBeNull();
    expect(analFin('disi')).not.toBeNull();
  });
  it('siluet sonlu; gravid spot yalnızca dişide', () => {
    expect(silhouette('erkek').spot).toBeNull();
    expect(silhouette('disi').spot).not.toBeNull();
    for (const s of SEXES) expect([...silhouette(s).body, ...silhouette(s).tail].every((p) => finite(p))).toBe(true);
  });
});

describe('kılıçkuyruk parçalar', () => {
  it('kimlikler benzersiz; metinler dolu; wiki dosyaları var', () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    for (const p of PARTS) {
      expect(p.ad.length).toBeGreaterThan(2);
      expect(p.aciklama.length).toBeGreaterThan(40);
      if (p.wiki) expect(existsSync(`src/content/wiki/${p.wiki}.mdx`), p.id).toBe(true);
    }
  });
  it('cinsiyete özgü parçalar: kılıç ve gonopodium erkekte, gravid spot ve anal yüzgeç dişide', () => {
    const ids = (s: Sex) => partsFor(s).map((p) => p.id);
    expect(ids('erkek')).toContain('kilic');
    expect(ids('erkek')).toContain('gonopodium');
    expect(ids('erkek')).not.toContain('gravid-spot');
    expect(ids('disi')).not.toContain('kilic');
    expect(ids('disi')).toContain('gravid-spot');
    expect(ids('disi')).toContain('anal-yuzgec');
    expect(ids('disi')).not.toContain('gonopodium');
  });
  it('her görünür parçanın sonlu bir çapası var; kılıç çapası kılıç ucuna yakın', () => {
    for (const s of SEXES) for (const p of partsFor(s)) {
      const a = partAnchors(s)[p.id];
      expect(a, `${s}:${p.id}`).toBeDefined();
      expect(finite(a!.pos)).toBe(true);
    }
    const k = partAnchors('erkek').kilic!;
    expect(k.pos[0]).toBeGreaterThan(BODY.erkek.length / 2 + 0.8);
  });
});

describe('kılıçkuyruk varyeteler', () => {
  it('kimlikler benzersiz, gruplar tanımlı, renkler geçerli', () => {
    expect(new Set(VARIANTS.map((v) => v.id)).size).toBe(VARIANTS.length);
    expect(VARIANTS.length).toBe(10);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS).toContain(v.grup);
      for (const c of [v.erkek.sirt, v.erkek.yan, v.erkek.karin, v.disi.yan, v.yuzgec.taban, v.yuzgec.uc, v.yuzgec.benek, v.goz.iris]) expect(() => hexToRgb(c)).not.toThrow();
      if (v.yuzgec.kilic) { expect(() => hexToRgb(v.yuzgec.kilic!.renk)).not.toThrow(); expect(() => hexToRgb(v.yuzgec.kilic!.kenar)).not.toThrow(); }
      expect(v.aciklama.length).toBeGreaterThan(30);
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(VARIANTS.length);
    expect(variantById('yok-boyle').id).toBe(VARIANTS[0].id);
  });
  it('yaygın renkler var; biçim varyeteleri renk listesinde yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    for (const id of ['green', 'red', 'red-wag', 'tuxedo', 'koi', 'pineapple']) expect(ids).toContain(id);
    for (const v of VARIANTS) expect(`${v.id} ${v.ad}`).not.toMatch(/balloon|balon|hifin|hi-fin|lyre|delta/i);
  });
  it('yüzgeç renkleri 0..1 aralığında (kılıç dahil)', () => {
    for (const v of VARIANTS) for (const sx of SEXES) for (const k of ['kuyruk', 'sirt', 'anal', 'gogus', 'karin'] as const) for (const u of [0, 0.5, 1]) for (const s of [0, 0.05, 0.1, 0.5, 1]) {
      const c = finColor(v, sx, k, u, s);
      expect(c.every((x) => x >= 0 && x <= 1)).toBe(true);
    }
  });
  it('kılıç boyası yalnızca erkekte ve yalnızca en alt ışınlarda uygulanır', () => {
    const v = variantById('green');
    const sw = finColor(v, 'erkek', 'kuyruk', 0.9, 0.048), body = finColor(v, 'erkek', 'kuyruk', 0.9, 0.6);
    expect(sw).not.toEqual(finColor(v, 'disi', 'kuyruk', 0.9, 0.048));
    expect(sw).not.toEqual(body);
    const edge = finColor(v, 'erkek', 'kuyruk', 0.9, 0), mid = finColor(v, 'erkek', 'kuyruk', 0.9, 0.048);
    expect(edge[0] + edge[1] + edge[2]).toBeLessThan(mid[0] + mid[1] + mid[2]);
    expect(finColor(v, 'erkek', 'kuyruk', 0.9, 0.5)).toEqual(finColor(v, 'disi', 'kuyruk', 0.9, 0.5));
  });
});

describe('SpeciesModule sözleşmesi', () => {
  it('temel alanlar ve parça/varyete eşlemesi', () => {
    expect(species.id).toBe('kilickuyruk');
    expect(species.sexes.map((s) => s.id).sort()).toEqual(['disi', 'erkek']);
    expect(species.variants.length).toBe(VARIANTS.length);
    expect(species.parts.length).toBe(PARTS.length);
    expect(species.partsFor('erkek').length).toBe(partsFor('erkek').length);
    expect(species.views.map((v) => v.id)).toContain('capraz');
    expect(species.not).toMatch(/şematik/i);
    expect(typeof species.createViewer).toBe('function');
    expect(typeof species.createFishGroup).toBe('function');
  });
});
