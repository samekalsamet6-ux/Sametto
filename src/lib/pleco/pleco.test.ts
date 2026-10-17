import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma } from '../akvaryum/fishmath';
import { ARMOR, SEXES, TUL_GAIN, bodyFor, bristles, eyeSpec, finsFor, mouthRing, mouthSpec, silhouette, spines } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';
import { FORMS, tulFor } from './forms';
import { paintBody, plateEdges } from './texture';

fishSuite({
  ad: 'pleco', sexes: [...SEXES], bodyFor, finsFor: (s) => finsFor(s), silhouette: (s) => silhouette(s), parts: PARTS, partsFor, partAnchors: (s) => partAnchors(s, 'normal'), variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'plakalar', 'odontodlar', 'solungac-kapagi'], aspect: [4.5, 8.5],
});

const len = (sex: 'erkek' | 'disi', id: string, tul: number) => {
  const x = finsFor(sex, tul).find((y) => y.id === id)!;
  return Math.max(...x.base.map((p, i) => Math.hypot(p[0] - x.tip[i][0], p[1] - x.tip[i][1], p[2] - x.tip[i][2])));
};

describe('pleco: gövde', () => {
  it('üstten basık: genişlik yükseklikten büyük; karın düze yakın; baş en geniş bölgeye yakın', () => {
    for (const sex of SEXES) {
      const b = bodyFor(sex);
      for (const s of [0.15, 0.25, 0.4]) { const c = b.section(s); expect(c.hw * 2, `${sex} ${s}`).toBeGreaterThan(c.yTop - c.yBot); }
      const belly = [0.15, 0.3, 0.45, 0.6].map((s) => b.section(s).yBot);
      expect(Math.max(...belly) - Math.min(...belly)).toBeLessThan(0.02);
      expect(b.section(0.22).hw).toBeGreaterThan(b.section(0.8).hw * 2.5);
    }
  });
  it('erkek başı biraz geniş, dişi orta gövdesi dolgun; gözler başın üstünde', () => {
    expect(bodyFor('erkek').section(0.2).hw).toBeGreaterThan(bodyFor('disi').section(0.2).hw);
    expect(bodyFor('disi').section(0.4).hw).toBeGreaterThan(bodyFor('erkek').section(0.4).hw);
    for (const s of SEXES) { const e = eyeSpec(s); expect(e.center[1]).toBeGreaterThan(0.03); expect(e.normal[1]).toBeGreaterThan(0.3); }
  });
  it('vantuz ağız alt yüzde: disk gövdenin altında, burun yakınında ve gövde genişliği içinde', () => {
    for (const sex of SEXES) {
      const b = bodyFor(sex), m = mouthSpec(sex);
      expect(m.c[0]).toBeLessThan(-0.35);
      expect(m.c[1]).toBeLessThan(0);
      const ring = mouthRing(sex);
      expect(ring.length).toBeGreaterThan(16);
      for (const p of ring) expect(Math.abs(p[2])).toBeLessThanOrEqual(b.section(Math.max(0.004, p[0] + 0.5)).hw + 1e-9);
    }
  });
});

describe('pleco: bristle (cinsiyet farkı)', () => {
  it('erkekte çok sayıda büyük, dallı; dişide az sayıda kısa, dalsız', () => {
    const m = bristles('erkek'), f = bristles('disi');
    expect(m.length).toBeGreaterThanOrEqual(6);
    expect(f.length).toBeLessThanOrEqual(3);
    expect(m.every((b) => b.branches.length >= 2)).toBe(true);
    expect(f.every((b) => b.branches.length === 0)).toBe(true);
    const L = (b: ReturnType<typeof bristles>[number]) => Math.hypot(b.stalk[0][0] - b.stalk[b.stalk.length - 1][0], b.stalk[0][1] - b.stalk[b.stalk.length - 1][1], b.stalk[0][2] - b.stalk[b.stalk.length - 1][2]);
    expect(Math.max(...m.map(L))).toBeGreaterThan(Math.max(...f.map(L)) * 3);
    for (const b of m) expect(b.stalk[b.stalk.length - 1][0]).toBeLessThan(b.stalk[0][0]); // öne uzanır
  });
  it('cinsiyete özgü parça: erkek ve dişi farklı bristle parçası görür', () => {
    expect(partsFor('erkek').some((p) => p.id === 'bristle-erkek')).toBe(true);
    expect(partsFor('erkek').some((p) => p.id === 'bristle-disi')).toBe(false);
    expect(partsFor('disi').some((p) => p.id === 'bristle-disi')).toBe(true);
    expect(partsFor('erkek').length).toBe(partsFor('disi').length);
  });
});

describe('pleco: yüzgeçler ve tül biçimi', () => {
  it('altı yüzgeç; yağ yüzgeci ve üç diken var', () => {
    expect(finsFor('erkek').map((x) => x.id).sort()).toEqual(['anal', 'gogus', 'karin', 'kuyruk', 'sirt', 'yag']);
    expect(spines('erkek').map((s) => s.id)).toEqual(['sirt', 'yag', 'gogus']);
  });
  it('tül: sırt, kuyruk, göğüs, karın ve anal yüzgeçler uzar; yağ yüzgeci aynı kalır; tül değeri 0..1 arasında ara değerlenir', () => {
    for (const id of ['sirt', 'kuyruk', 'gogus', 'karin', 'anal']) expect(len('erkek', id, 1), id).toBeGreaterThan(len('erkek', id, 0) * 1.3);
    expect(len('erkek', 'yag', 1)).toBeCloseTo(len('erkek', 'yag', 0), 9);
    expect(len('erkek', 'kuyruk', 0.5)).toBeGreaterThan(len('erkek', 'kuyruk', 0));
    expect(len('erkek', 'kuyruk', 0.5)).toBeLessThan(len('erkek', 'kuyruk', 1));
    expect(len('erkek', 'kuyruk', 1) / len('erkek', 'kuyruk', 0)).toBeGreaterThan(TUL_GAIN.caudal * 0.7);
  });
  it('tül biçiminde de yüzgeç uzunlukları sınırlar içinde; bağlantı noktaları sonlu', () => {
    for (const sex of SEXES) {
      for (const f of finsFor(sex, 1)) expect(len(sex, f.id, 1)).toBeLessThan(0.6);
      for (const a of Object.values(partAnchors(sex, 'tul'))) expect(a.pos.every(Number.isFinite)).toBe(true);
    }
  });
  it('zırh: dört sıra plaka; aralık gövde içinde', () => {
    const e = plateEdges(1000);
    for (let r = 0; r < ARMOR.rows; r++) expect(e.filter((p) => p.row === r).length).toBe(ARMOR.plates);
    for (const p of e) { expect(p.x0).toBeGreaterThanOrEqual(ARMOR.s0 * 1000 - 1e-6); expect(p.x1).toBeLessThanOrEqual(ARMOR.s1 * 1000 + 1e-6); expect(p.x1).toBeGreaterThan(p.x0); }
  });
});

describe('pleco: varyeteler (renk)', () => {
  it('yalnızca renk varyeteleri; ilk L144 limon mavi göz; gruplar ve renkler geçerli', () => {
    expect(VARIANTS[0].id).toBe('limon-mavi-goz');
    expect(VARIANTS.length).toBeGreaterThanOrEqual(7);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      expect(v.id.endsWith('-tul')).toBe(false);
      for (const h of [...Object.values(v.body), v.benek.renk, ...v.yamalar, ...Object.values(v.eye)]) expect(() => hexToRgb(h)).not.toThrow();
    }
    expect(groupedVariants().flatMap((g) => g.items).length).toBe(VARIANTS.length);
    expect(variantById('yok').id).toBe('limon-mavi-goz');
  });
  it('L144 mavi gözlü ve sarı; albino pembe gözlü ve açık; süper kırmızı kırmızımsı; L-kodu uyarısı', () => {
    const l = variantById('limon-mavi-goz'), a = variantById('albino');
    expect(l.eye.iris).not.toBe(a.eye.iris);
    expect(l.eye.iris.toLowerCase()).toMatch(/^#[6-9a-b][0-9a-f][a-f][0-9a-f]{3}$/);
    expect(hexToRgb(l.body.yan)[0]).toBeGreaterThan(hexToRgb(l.body.yan)[2] + 0.4);
    expect(luma(a.body.yan)).toBeGreaterThan(0.8);
    expect(hexToRgb(variantById('super-kirmizi').body.yan)[0]).toBeGreaterThan(hexToRgb(variantById('super-kirmizi').body.yan)[2] + 0.4);
    expect(luma(variantById('ortak').body.yan)).toBeLessThan(0.3);
    expect(l.aciklama).toMatch(/ticari/);
    expect(l.dogrulanmali).toBe(true);
    expect(variantById('albino').aciklama).toMatch(/yanlış etiketlen/);
  });
});

describe('pleco: formlar (şekil)', () => {
  it('normal ilk; tül ikinci; kimlikler benzersiz; tül derecesi', () => {
    expect(FORMS.map((f) => f.id)).toEqual(['normal', 'tul']);
    expect(species.forms).toBe(FORMS);
    expect(tulFor('normal')).toBe(0);
    expect(tulFor('tul')).toBe(1);
    for (const f of FORMS) expect(f.aciklama.length).toBeGreaterThan(40);
    expect(FORMS[1].dogrulanmali).toBe(true);
  });
  it('tül silueti normalden ölçülebilir biçimde farklı (daha uzun/yüksek); her iki cinsiyette', () => {
    for (const sex of SEXES) {
      const ext = (tul: number) => { const pts = silhouette(sex, tul).fins.flatMap((f) => f.pts); return { x: Math.max(...pts.map((p) => p[0])), y: Math.max(...pts.map((p) => p[1])) }; };
      expect(ext(1).x).toBeGreaterThan(ext(0).x + 0.1);
      expect(ext(1).y).toBeGreaterThan(ext(0).y + 0.05);
    }
  });
  it('bağlantı noktaları forma uyar: tülde yüzgeç noktaları uzaklaşır; gövde noktaları aynı', () => {
    const n = partAnchors('erkek', 'normal'), t = partAnchors('erkek', 'tul');
    expect(t['kuyruk-yuzgeci'].pos[0]).toBeGreaterThan(n['kuyruk-yuzgeci'].pos[0] + 0.05);
    expect(t['sirt-yuzgeci'].pos[1]).toBeGreaterThan(n['sirt-yuzgeci'].pos[1]);
    expect(t.goz.pos).toEqual(n.goz.pos);
    expect(Object.keys(t).sort()).toEqual(Object.keys(n).sort());
  });
});

describe('pleco: tür modülü', () => {
  it('SpeciesModule sözleşmesi; dürüstlük notu; dikenler uyarısı', () => {
    expect(species.id).toBe('pleco');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/ticari/);
    expect(species.not).toMatch(/Tül/);
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(PARTS.find((p) => p.id === 'gogus-yuzgeci')?.uyari).toBe(true);
    expect(species.forms?.length).toBe(2);
    expect(species.views.map((v) => v.id)).toContain('alt');
  });
});
