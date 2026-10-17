import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma } from '../akvaryum/fishmath';
import { LATERAL, SEXES, bodyFor, eyeGeom, finsFor, lateralLine, mouthLine, nostrils, operculumArc, silhouette, tubercles } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';
import { paintBody } from './texture';

fishSuite({
  ad: 'japon', sexes: [...SEXES], bodyFor, finsFor, silhouette, parts: PARTS, partsFor, partAnchors, variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'pullar', 'solungac-kapagi', 'tuberkul', 'karin-dolgun', 'burun-delikleri'], aspect: [2.2, 3.4],
});

describe('japon: common/comet gövdesi (süs biçimleri yok)', () => {
  it('tek sırt, tek anal, tek kuyruk; çift yüzgeçler yalnızca karın ve göğüs; kuyruk çatallı', () => {
    for (const s of SEXES) {
      const f = finsFor(s);
      expect(f.map((x) => x.id).sort()).toEqual(['anal', 'gogus', 'karin', 'kuyruk', 'sirt']);
      expect(f.filter((x) => x.paired).map((x) => x.id).sort()).toEqual(['gogus', 'karin']);
      const k = f.find((x) => x.id === 'kuyruk')!;
      expect(k.tip[Math.floor(k.tip.length / 2)][0]).toBeLessThan(k.tip[0][0]);
      const sirt = f.find((x) => x.id === 'sirt')!;
      expect(Math.abs(sirt.base[sirt.base.length - 1][0] - sirt.base[0][0])).toBeGreaterThan(0.3); // uzun taban
    }
  });
  it('gövde derinliği "fancy" değil: boy/derinlik en az 2,2; bıyık (barbel) yok', () => {
    const b = bodyFor('erkek');
    let h = 0; for (let i = 0; i <= 60; i++) { const s = b.section(i / 60); h = Math.max(h, s.yTop - s.yBot); }
    expect(1 / h).toBeGreaterThan(2.2);
    expect(PARTS.some((p) => /bıyık|barbel/i.test(p.ad) && !/bıyıksız/.test(p.ad))).toBe(false);
    expect(PARTS.find((p) => p.id === 'agiz')?.aciklama).toMatch(/bıyık .*bulunmaz/);
  });
  it('tüberküller yalnızca erkekte ve solungaç kapağı/göğüs yüzgeci bölgesinde; dişide dolgun karın', () => {
    expect(tubercles('disi')).toHaveLength(0);
    const t = tubercles('erkek');
    expect(t.length).toBeGreaterThan(8);
    for (const p of t) { expect(p[0]).toBeLessThan(-0.05); expect(p[2]).toBeGreaterThan(0); }
    const d = (s: 'erkek' | 'disi') => { const x = bodyFor(s).section(0.45); return x.hw; };
    expect(d('disi')).toBeGreaterThan(d('erkek'));
    expect(partsFor('erkek').some((p) => p.id === 'tuberkul')).toBe(true);
    expect(partsFor('disi').some((p) => p.id === 'tuberkul')).toBe(false);
    expect(partsFor('disi').some((p) => p.id === 'karin-dolgun')).toBe(true);
  });
  it('yan çizgi operkulumdan kuyruk köküne; burun delikleri gözün önünde; ağız burunda', () => {
    for (const s of SEXES) {
      const l = lateralLine(s);
      expect(l[0][0]).toBeGreaterThan(-0.3);
      expect(l[l.length - 1][0]).toBeGreaterThan(0.4);
      expect(LATERAL.s0).toBeGreaterThan(0.2);
      for (const n of nostrils(s)) expect(n.pos[0]).toBeLessThan(eyeGeom(s).center[0]);
      expect(mouthLine(s, 1)[0][0]).toBeLessThan(-0.49);
      expect(operculumArc(s, 1).every((p) => p[0] > eyeGeom(s).center[0])).toBe(true);
    }
  });
});

describe('japon: varyeteler', () => {
  it('beklenen renkler; ilk varyete turuncu; süs biçimi adı yok', () => {
    for (const id of ['turuncu', 'kirmizi', 'limon', 'beyaz', 'siyah', 'sarasa', 'shubunkin', 'panda']) expect(VARIANTS.some((v) => v.id === id), id).toBe(true);
    expect(VARIANTS[0].id).toBe('turuncu');
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.body), ...v.yamalar, ...Object.values(v.eye), ...v.fin.stops.map((x) => x[1])]) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      expect(`${v.ad} ${v.id}`).not.toMatch(/oranda|ryukin|telescope|veil|fancy/i);
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(VARIANTS.length);
    expect(variantById('yok').id).toBe('turuncu');
  });
  it('desenli tiplerde yama; siyah çok koyu, beyaz çok açık; shubunkin sedefli; belirsiz adlar doğrulanmalı', () => {
    expect(variantById('sarasa').yamalar.length).toBeGreaterThan(0);
    expect(variantById('shubunkin').yamalar.length).toBeGreaterThanOrEqual(3);
    expect(variantById('shubunkin').sedef).toBe(true);
    expect(luma(variantById('siyah').body.yan)).toBeLessThan(0.12);
    expect(luma(variantById('beyaz').body.yan)).toBeGreaterThan(0.85);
    for (const id of ['limon', 'panda', 'bronz']) expect(variantById(id).dogrulanmali, id).toBe(true);
    const keys = VARIANTS.map((v) => v.body.yan + v.desen);
    expect(new Set(keys).size).toBe(VARIANTS.length);
  });
});

describe('japon: tür modülü', () => {
  it('SpeciesModule sözleşmesi; ayrım üreme dönemine bağlı notu', () => {
    expect(species.id).toBe('japon');
    expect(species.latin).toBe('Carassius auratus');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    for (const s of species.sexes) expect(s.not).toMatch(/çok benzer/);
    expect(species.not).toMatch(/oranda/);
  });
});
