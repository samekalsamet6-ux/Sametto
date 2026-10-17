import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { SEXES, STRIPE, bodyFor, eyeGeom, finsFor, mouthLine, operculumArc, silhouette, stripeW } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { hexToRgb } from '../akvaryum/fishmath';
import { species } from './index';
import { paintBody } from './texture';

fishSuite({
  ad: 'neon', sexes: [...SEXES], bodyFor, finsFor, silhouette, parts: PARTS, partsFor, partAnchors, variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'solungac-kapagi', 'mavi-serit', 'kirmizi-bolge', 'serit-egri', 'serit-duz'], aspect: [3.6, 5.2],
});

describe('neon: cinsiyet ve şerit', () => {
  it('erkek şeridi düz; dişide karın bölgesinde aşağı bükülür ve yine de gövdede kalır', () => {
    const range = (sx: 'erkek' | 'disi') => { const v: number[] = []; for (let s = STRIPE.s0; s <= STRIPE.s1; s += 0.02) v.push(stripeW(sx, s)); return Math.max(...v) - Math.min(...v); };
    expect(range('erkek')).toBeLessThan(0.02);
    expect(range('disi')).toBeGreaterThan(0.05);
    for (let s = STRIPE.s0; s <= STRIPE.s1; s += 0.02) for (const x of SEXES) { expect(stripeW(x, s) - STRIPE.half).toBeGreaterThan(0.05); expect(stripeW(x, s) + STRIPE.half).toBeLessThan(0.7); }
  });
  it('dişi karnı erkekten dolgun; cinsiyete özgü parçalar', () => {
    const d = (s: 'erkek' | 'disi') => { const x = bodyFor(s).section(0.46); return x.yTop - x.yBot; };
    expect(d('disi')).toBeGreaterThan(d('erkek'));
    expect(partsFor('disi').some((p) => p.id === 'serit-egri')).toBe(true);
    expect(partsFor('erkek').some((p) => p.id === 'serit-egri')).toBe(false);
    expect(partsFor('erkek').some((p) => p.id === 'serit-duz')).toBe(true);
  });
  it('yüzgeçler: yağ yüzgeci var; kuyruk çatallı (ortası uçlardan kısa); hepsi küçük', () => {
    const f = finsFor('erkek');
    expect(f.map((x) => x.id).sort()).toEqual(['anal', 'gogus', 'karin', 'kuyruk', 'sirt', 'yag']);
    const k = f.find((x) => x.id === 'kuyruk')!;
    const mid = k.tip[Math.floor(k.tip.length / 2)][0], edge = k.tip[0][0];
    expect(mid).toBeLessThan(edge);
    expect(Math.max(...k.tip.map((p) => p[0])) - 0.5).toBeLessThan(0.25);
  });
  it('göz iri; ağız burunda; operkulum gözün arkasında', () => {
    for (const s of SEXES) {
      expect(eyeGeom(s).radius).toBeGreaterThan(0.03);
      expect(mouthLine(s, 1)[0][0]).toBeLessThan(-0.49);
      expect(operculumArc(s, 1).every((p) => p[0] > eyeGeom(s).center[0])).toBe(true);
    }
  });
});

describe('neon: varyeteler', () => {
  it('yalnızca normal, diamond ve gold; ilk varyete normal; gruplar geçerli', () => {
    expect(VARIANTS.map((v) => v.id)).toEqual(['normal', 'diamond', 'gold']);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.body), v.serit.merkez, v.serit.kenar, v.kirmizi.renk, ...Object.values(v.eye)]) expect(() => hexToRgb(h)).not.toThrow();
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(3);
    expect(variantById('yok').id).toBe('normal');
  });
  it('diamond: şerit kısa, sırt parıltısı yüksek; gold: soluk, albino gözlü; doğrulanmalı işaretleri', () => {
    expect(variantById('diamond').serit.boy).toBeLessThan(0.4);
    expect(variantById('diamond').sirtParilti).toBeGreaterThan(0.5);
    expect(variantById('normal').serit.boy).toBe(1);
    expect(variantById('gold').kirmizi.yogunluk).toBeLessThan(0.6);
    expect(variantById('gold').serit.parilti).toBeLessThan(0.5);
    expect(variantById('gold').aciklama).toMatch(/albino/);
    expect(variantById('normal').dogrulanmali).toBe(false);
    expect(variantById('diamond').dogrulanmali).toBe(true);
    expect(variantById('gold').dogrulanmali).toBe(true);
  });
});

describe('neon: tür modülü', () => {
  it('SpeciesModule sözleşmesi', () => {
    expect(species.id).toBe('neon');
    expect(species.latin).toBe('Paracheirodon innesi');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(species.partsFor('disi').length).toBe(species.partsFor('erkek').length);
  });
});
