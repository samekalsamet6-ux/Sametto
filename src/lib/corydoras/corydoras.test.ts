import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma } from '../akvaryum/fishmath';
import { ARMOR, SEXES, barbels, bodyFor, eyeGeom, finsFor, lipsLoop, operculumArc, silhouette, spines } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';
import { paintBody, plateEdges } from './texture';

fishSuite({
  ad: 'corydoras', sexes: [...SEXES], bodyFor, finsFor, silhouette, parts: PARTS, partsFor, partAnchors, variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'zirh', 'bas-kalkani', 'solungac-kapagi', 'govde-genis', 'govde-dar'], aspect: [2.7, 4.8],
});

describe('corydoras: gövde ve cinsiyet', () => {
  it('karın düze yakın: alt kesit düz (nBot büyük); sırt kemerli (en yüksek nokta ortada)', () => {
    const b = bodyFor('erkek');
    expect(b.section(0.4).nBot).toBeGreaterThan(3);
    expect(b.section(0.4).yTop).toBeGreaterThan(b.section(0.1).yTop);
    expect(b.section(0.4).yTop).toBeGreaterThan(b.section(0.85).yTop);
    const belly = [0.25, 0.4, 0.55, 0.7].map((s) => b.section(s).yBot);
    expect(Math.max(...belly) - Math.min(...belly)).toBeLessThan(0.03);
  });
  it('dişi gövdesi erkekten belirgin geniş (üstten); yükseklik aynı', () => {
    const w = (s: 'erkek' | 'disi') => bodyFor(s).section(0.45).hw;
    expect(w('disi')).toBeGreaterThan(w('erkek') * 1.08);
    expect(bodyFor('disi').section(0.4).yTop).toBeCloseTo(bodyFor('erkek').section(0.4).yTop, 6);
    expect(partsFor('disi').some((p) => p.id === 'govde-genis')).toBe(true);
    expect(partsFor('erkek').some((p) => p.id === 'govde-genis')).toBe(false);
    expect(partsFor('erkek').some((p) => p.id === 'govde-dar')).toBe(true);
  });
  it('ağız alt yüzde: dudak halkası gövdenin altında, burun yakınında; üç çift bıyık; bıyıklar aşağı ve öne', () => {
    const b = bodyFor('erkek');
    const loop = lipsLoop('erkek');
    expect(loop.length).toBeGreaterThan(8);
    for (const p of loop) { expect(p[0]).toBeLessThan(-0.3); expect(p[1]).toBeLessThan(0); expect(Math.abs(p[2])).toBeLessThan(b.section(0.045).hw); }
    const bb = barbels('erkek');
    expect(bb.map((x) => x.id)).toEqual(['maksiller', 'mandibular-1', 'mandibular-2']);
    for (const x of bb) { expect(x.path[x.path.length - 1][0]).toBeLessThan(x.path[0][0]); expect(x.path[x.path.length - 1][1]).toBeLessThan(x.path[0][1]); expect(x.radii[0]).toBeGreaterThan(x.radii[x.radii.length - 1]); }
  });
  it('yüzgeçler ve dikenler: sırt, yağ, göğüs dikeni; yağ yüzgeci var; kuyruk çatallı; göğüs yüzgeci büyük', () => {
    const f = finsFor('erkek');
    expect(f.map((x) => x.id).sort()).toEqual(['anal', 'gogus', 'karin', 'kuyruk', 'sirt', 'yag']);
    expect(spines('erkek').map((s) => s.id)).toEqual(['sirt', 'yag', 'gogus']);
    const k = f.find((x) => x.id === 'kuyruk')!;
    expect(k.tip[Math.floor(k.tip.length / 2)][0]).toBeLessThan(k.tip[0][0]);
    const len = (id: string) => { const x = f.find((y) => y.id === id)!; return Math.max(...x.base.map((p, i) => Math.hypot(p[0] - x.tip[i][0], p[1] - x.tip[i][1], p[2] - x.tip[i][2]))); };
    expect(len('gogus')).toBeGreaterThan(len('karin'));
  });
  it('zırh plakaları iki sıra; aralık gövde içinde; plakalar üst üste biner; göz ve operkulum', () => {
    const e = plateEdges(1000);
    expect(e.filter((p) => p.row === 0).length).toBe(ARMOR.plates);
    expect(e.filter((p) => p.row === 1).length).toBe(ARMOR.plates);
    for (const p of e) { expect(p.x0).toBeGreaterThanOrEqual(ARMOR.s0 * 1000 - 1e-6); expect(p.x1).toBeLessThanOrEqual(ARMOR.s1 * 1000 + 1e-6); expect(p.x1).toBeGreaterThan(p.x0); }
    expect(e[1].x0).toBeLessThan(e[0].x1);
    for (const s of SEXES) { expect(eyeGeom(s).center[1]).toBeGreaterThan(0.02); expect(operculumArc(s, 1).every((p) => p[0] > eyeGeom(s).center[0])).toBe(true); }
  });
});

describe('corydoras: varyeteler', () => {
  it('bronz, albino, benekli, sterbai tipi; ilk bronz; gruplar ve renkler geçerli', () => {
    expect(VARIANTS.map((v) => v.id)).toEqual(['bronz', 'albino', 'benekli', 'sterbai']);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.body), v.yama, v.benek, v.parilti.renk, ...Object.values(v.eye)]) expect(() => hexToRgb(h)).not.toThrow();
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(4);
    expect(variantById('yok').id).toBe('bronz');
  });
  it('albino açık ve kırmızı gözlü; sterbai tipi koyu ve başka türe ait diye işaretli; benekli desenli', () => {
    expect(luma(variantById('albino').body.yan)).toBeGreaterThan(0.85);
    expect(variantById('albino').eye.iris).not.toBe(variantById('bronz').eye.iris);
    expect(luma(variantById('sterbai').body.yan)).toBeLessThan(0.2);
    expect(variantById('sterbai').dogrulanmali).toBe(true);
    expect(variantById('sterbai').aciklama).toMatch(/başka bir türe/);
    expect(variantById('benekli').desen).toBe('benekli');
    expect(variantById('bronz').dogrulanmali).toBe(false);
  });
});

describe('corydoras: tür modülü', () => {
  it('SpeciesModule sözleşmesi; dikenler uyarısı; gövde farkı notu', () => {
    expect(species.id).toBe('corydoras');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(PARTS.find((p) => p.id === 'dikenler')?.uyari).toBe(true);
    expect(species.sexes[1].not).toMatch(/geniş/);
  });
});
