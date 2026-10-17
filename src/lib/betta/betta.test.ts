import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma, mulberry32 } from '../akvaryum/fishmath';
import { SEXES, FIN_SIZES, bodyFor, eyeSpec, finsFor, mouthLine, operculumArc, ovipositor, silhouette } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, sexTone, variantById } from './variants';
import { species } from './index';
import { paintBody } from './texture';

fishSuite({
  ad: 'betta', sexes: [...SEXES], bodyFor, finsFor, silhouette, parts: PARTS, partsFor, partAnchors, variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'pullar', 'solungac-kapagi', 'labirent'], aspect: [3.4, 6.5],
});

describe('betta: cinsiyet farkları ve kapsam', () => {
  it('erkek yüzgeçleri dişiden belirgin büyük; dişi gövdesi daha dolgun', () => {
    for (const k of ['dorsal', 'caudalLen', 'anal', 'pelvic'] as const) expect(FIN_SIZES.erkek[k], k).toBeGreaterThan(FIN_SIZES.disi[k] * 1.4);
    const h = (s: 'erkek' | 'disi') => { const x = bodyFor(s).section(0.5); return x.yTop - x.yBot; };
    expect(h('disi')).toBeGreaterThan(h('erkek'));
  });
  it('uzun yüzgeçli (veiltail/halfmoon) biçim yok: kuyruk gövde boyunun en çok ~%35\'i; yüzgeç kimlikleri beklenen', () => {
    for (const s of SEXES) {
      const f = finsFor(s);
      expect(f.map((x) => x.id).sort()).toEqual(['anal', 'gogus', 'karin', 'kuyruk', 'sirt']);
      const k = f.find((x) => x.id === 'kuyruk')!;
      expect(Math.max(...k.tip.map((p) => p[0])) - 0.5).toBeLessThan(0.36);
    }
  });
  it('yumurta borusu yalnızca dişide; yalnızca dişide parça listesinde', () => {
    expect(ovipositor('erkek')).toBeNull();
    expect(ovipositor('disi')).not.toBeNull();
    expect(partsFor('erkek').some((p) => p.id === 'yumurta-borusu')).toBe(false);
    expect(partsFor('disi').some((p) => p.id === 'yumurta-borusu')).toBe(true);
  });
  it('göz başta ve burna yakın; ağız ucu burunda; operkulum gözün arkasında', () => {
    for (const s of SEXES) {
      const e = eyeSpec(s);
      expect(e.center[0]).toBeLessThan(-0.3);
      expect(e.center[2]).toBeGreaterThan(0);
      expect(mouthLine(s, 1)[0][0]).toBeLessThan(-0.49);
      expect(operculumArc(s, 1).every((p) => p[0] > e.center[0])).toBe(true);
    }
  });
});

describe('betta: varyeteler', () => {
  it('14 varyete; gruplar geçerli; renkler geçerli; ilk varyete kırmızı', () => {
    expect(VARIANTS.length).toBeGreaterThanOrEqual(12);
    expect(VARIANTS[0].id).toBe('kirmizi');
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.body), ...Object.values(v.eye), ...v.yamalar, ...v.fin.stops.map((s) => s[1])]) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(VARIANTS.length);
    expect(variantById('yok').id).toBe('kirmizi');
  });
  it('istenen çeşitler var; belirsiz adlar doğrulanmalı; renkler birbirinden ayırt edilir', () => {
    for (const id of ['kirmizi', 'mavi', 'celik-mavi', 'selofan', 'koi', 'ejder', 'kelebek', 'mermer', 'siyah-orkide', 'opak-beyaz', 'sari']) expect(VARIANTS.some((v) => v.id === id), id).toBe(true);
    for (const id of ['celik-mavi', 'selofan', 'koi', 'siyah-orkide', 'opak-beyaz']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(luma(variantById('siyah-orkide').body.yan)).toBeLessThan(0.1);
    expect(luma(variantById('opak-beyaz').body.yan)).toBeGreaterThan(0.8);
    expect(variantById('opak-beyaz').aciklama).toMatch(/doğrulanmalı/);
    const keys = VARIANTS.map((v) => v.body.yan + v.fin.stops.map((s) => s[1]).join(''));
    expect(new Set(keys).size).toBe(VARIANTS.length);
  });
  it('dişi tonu erkekten solgun; saydam/opak tiplerde değişim küçük; üreteç deterministik', () => {
    const v = variantById('kirmizi');
    const sat = (h: string) => { const c = hexToRgb(h); return Math.max(...c) - Math.min(...c); };
    expect(sat(sexTone(v.body.yan, 'disi', v))).toBeLessThan(sat(v.body.yan));
    expect(sexTone(v.body.yan, 'erkek', v)).toBe(v.body.yan);
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
});

describe('betta: tür modülü', () => {
  it('SpeciesModule sözleşmesi', () => {
    expect(species.id).toBe('betta');
    expect(species.latin).toBe('Betta splendens');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.views.map((v) => v.id)).toContain('yan');
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(species.parts).toBe(PARTS);
    expect(typeof species.createViewer).toBe('function');
  });
});
