import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { BODY, SEXES, TAIL, analFin, bodyProfile, bodySurfacePoint, dorsalFin, envelope, eyeSpec, gonopodium, mouthLine, pectoralFin, pelvicFin, silhouette, tailFin, type Sex, type Vec3 } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, finColor, groupedVariants, hexToRgb, variantById } from './variants';
import { species } from './index';
import { BODY as GBODY } from '../guppy/model';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const flat = (rays: Vec3[][]) => rays.flat().flat();

describe('platy gövde ve yüzgeç geometrisi', () => {
  it('zarf uçlarda 0, tepede 1', () => {
    for (const s of SEXES) {
      expect(envelope(s, 0)).toBe(0);
      expect(envelope(s, 1)).toBe(0);
      expect(envelope(s, BODY[s].peak)).toBeCloseTo(1, 5);
    }
  });
  it('dişi erkekten büyük; lepistesten kısa ve tıknaz (yükseklik/uzunluk oranı daha büyük)', () => {
    for (const s of SEXES) expect(BODY[s].height / BODY[s].length).toBeGreaterThan(GBODY[s].height / GBODY[s].length);
    expect(BODY.disi.length).toBeGreaterThan(BODY.erkek.length);
    const m = bodyProfile('erkek', 0.5), f = bodyProfile('disi', 0.5);
    expect(f.up + f.down).toBeGreaterThan(m.up + m.down);
  });
  it('kuyruk kısa ve yuvarlak: uç noktalar yaklaşık sabit uzaklıkta', () => {
    const t = tailFin('erkek');
    const base = t.rays[Math.floor(t.rays.length / 2)][0];
    const d = t.rays.map((r) => Math.hypot(r[r.length - 1][0] - base[0], r[r.length - 1][1] - base[1]));
    expect(Math.max(...d) / Math.min(...d)).toBeLessThan(1.35);
    expect(TAIL.erkek.round).toBeGreaterThan(0.5);
    expect(TAIL.erkek.reach).toBeLessThan(1);
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
  it('sırt yüzgeci kısa: yüksekliği gövde yüksekliğinin ~1 katını aşmaz', () => {
    for (const s of SEXES) {
      const top = Math.max(...dorsalFin(s).rays.map((r) => r[r.length - 1][1]));
      const body = bodyProfile(s, 0.45).up;
      expect(top - body).toBeLessThan(BODY[s].height * 1.0);
    }
  });
  it('siluet sonlu; gravid spot yalnızca dişide', () => {
    expect(silhouette('erkek').spot).toBeNull();
    expect(silhouette('disi').spot).not.toBeNull();
    for (const s of SEXES) expect(silhouette(s).body.every((p) => finite(p))).toBe(true);
  });
});

describe('platy parçalar', () => {
  it('kimlikler benzersiz; metinler dolu; wiki dosyaları var', () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    for (const p of PARTS) {
      expect(p.ad.length).toBeGreaterThan(2);
      expect(p.aciklama.length).toBeGreaterThan(40);
      if (p.wiki) expect(existsSync(`src/content/wiki/${p.wiki}.mdx`), p.id).toBe(true);
    }
  });
  it('cinsiyete özgü parçalar', () => {
    const ids = (s: Sex) => partsFor(s).map((p) => p.id);
    expect(ids('erkek')).toContain('gonopodium');
    expect(ids('erkek')).not.toContain('gravid-spot');
    expect(ids('disi')).toContain('gravid-spot');
    expect(ids('disi')).toContain('anal-yuzgec');
    expect(ids('disi')).not.toContain('gonopodium');
  });
  it('her görünür parçanın sonlu bir çapası var', () => {
    for (const s of SEXES) for (const p of partsFor(s)) {
      const a = partAnchors(s)[p.id];
      expect(a, `${s}:${p.id}`).toBeDefined();
      expect(finite(a!.pos)).toBe(true);
    }
  });
});

describe('platy varyeteler', () => {
  it('kimlikler benzersiz, gruplar tanımlı, renkler geçerli', () => {
    expect(new Set(VARIANTS.map((v) => v.id)).size).toBe(VARIANTS.length);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS).toContain(v.grup);
      for (const c of [v.erkek.sirt, v.erkek.yan, v.erkek.karin, v.disi.yan, v.yuzgec.taban, v.yuzgec.uc, v.yuzgec.benek, v.goz.iris]) expect(() => hexToRgb(c)).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(30);
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(VARIANTS.length);
    expect(variantById('yok-boyle').id).toBe(VARIANTS[0].id);
  });
  it('popüler formlar var; biçim varyeteleri yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    for (const id of ['red-wag', 'mickey', 'tuxedo', 'sunset', 'gold', 'blue', 'salt-pepper']) expect(ids).toContain(id);
    for (const v of VARIANTS) expect(`${v.id} ${v.ad}`).not.toMatch(/balloon|balon|hifin|hi-fin|sword|kılıç/i);
  });
  it('yüzgeç renkleri 0..1 aralığında', () => {
    for (const v of VARIANTS) for (const k of ['kuyruk', 'sirt', 'anal', 'gogus', 'karin'] as const) for (const u of [0, 0.5, 1]) for (const s of [0, 0.5, 1]) {
      const c = finColor(v, 'erkek', k, u, s);
      expect(c.every((x) => x >= 0 && x <= 1)).toBe(true);
    }
  });
  it('tuxedo arka gövde bloğu ve red wag siyah yüzgeçleri var', () => {
    expect(variantById('tuxedo').desen.some((l) => l.t === 'zemin' && l.x[0] >= 0.4)).toBe(true);
    const wag = finColor(variantById('red-wag'), 'erkek', 'kuyruk', 0.5, 0.5);
    expect(wag[0] + wag[1] + wag[2]).toBeLessThan(0.6);
    expect(variantById('mickey').yuzgec.desen?.daireler?.length).toBe(3);
    expect(variantById('sunset').dogrulanmali).toBe(true);
  });
});

describe('SpeciesModule sözleşmesi', () => {
  it('temel alanlar ve parça/varyete eşlemesi', () => {
    expect(species.id).toBe('platy');
    expect(species.sexes.map((s) => s.id).sort()).toEqual(['disi', 'erkek']);
    expect(species.variants.length).toBe(VARIANTS.length);
    expect(species.parts.length).toBe(PARTS.length);
    expect(species.partsFor('erkek').length).toBe(partsFor('erkek').length);
    expect(species.views.map((v) => v.id)).toContain('capraz');
    expect(species.not).toMatch(/şematik/i);
    expect(typeof species.createViewer).toBe('function');
  });
});
