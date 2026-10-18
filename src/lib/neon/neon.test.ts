import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { FORM_IDS, FORM_PARAMS, SEXES, STRIPE, bodyFor, eyeGeom, finsFor, mouthLine, operculumArc, silhouette, stripeW } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { hexToRgb } from '../akvaryum/fishmath';
import { species } from './index';
import { FORMS } from './forms';
import { bodyOutline } from '../akvaryum/fishmath';
import { paintBody } from './texture';

const ASPECT = { standart: [3.6, 5.2], 'uzun-yuzgec': [3.6, 5.2], balon: [2.2, 4.4] } as const;
for (const form of FORM_IDS) {
  fishSuite({
    ad: `neon/${form}`, sexes: [...SEXES], bodyFor: (s) => bodyFor(s, form), finsFor: (s) => finsFor(s, form), silhouette: (s) => silhouette(s, form), parts: PARTS, partsFor,
    partAnchors: (s) => partAnchors(s, form), variants: VARIANTS, paint: (id, sex, W) => paintBody(variantById(id), sex, W),
    onSurface: ['govde', 'solungac-kapagi', 'mavi-serit', 'kirmizi-bolge', 'serit-egri', 'serit-duz'], aspect: [...ASPECT[form]],
  });
}

describe('neon: form (şekil) varyeteleri', () => {
  const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0) / 2);
  const finExtent = (form: (typeof FORM_IDS)[number], id: string) => { const f = finsFor('erkek', form).find((x) => x.id === id)!; return Math.max(...f.tip.map((p, i) => Math.hypot(p[0] - f.base[i][0], p[1] - f.base[i][1]))); };
  it('standart ilk; üç gerçek form; kimlikler FORM_IDS ile aynı; açıklamalar dürüst', () => {
    expect(FORMS.map((f) => f.id)).toEqual([...FORM_IDS]);
    expect(FORMS[0].id).toBe('standart');
    expect(species.forms).toBe(FORMS);
    for (const f of FORMS) expect(f.aciklama.length).toBeGreaterThan(60);
    for (const id of ['uzun-yuzgec', 'balon']) expect(FORMS.find((f) => f.id === id)?.dogrulanmali).toBe(true);
  });
  it('uzun yüzgeçli: sırt, anal, kuyruk ve karın yüzgeçleri standarttan belirgin uzun; gövde aynı', () => {
    for (const id of ['sirt', 'anal', 'kuyruk', 'karin']) expect(finExtent('uzun-yuzgec', id), id).toBeGreaterThan(finExtent('standart', id) * 1.5);
    const a = bodyFor('erkek', 'standart').section(0.45), b = bodyFor('erkek', 'uzun-yuzgec').section(0.45);
    expect(b.yTop).toBeCloseTo(a.yTop, 9);
  });
  it('balon: gövde belirgin yuvarlak (derinlik ve genişlik fazla, özellikle karın); yüzgeçler biraz küçük; silüet alanı büyür', () => {
    const s = bodyFor('erkek', 'standart').section(0.46), b = bodyFor('erkek', 'balon').section(0.46);
    expect(b.yTop - b.yBot).toBeGreaterThan((s.yTop - s.yBot) * 1.4);
    expect(b.hw).toBeGreaterThan(s.hw * 1.2);
    expect(-b.yBot).toBeGreaterThan(-s.yBot * 1.5);
    expect(area(silhouette('erkek', 'balon').body)).toBeGreaterThan(area(silhouette('erkek', 'standart').body) * 1.25);
    expect(FORM_PARAMS.balon.fin.caudal).toBeLessThan(1);
  });
  it('her formun silüeti standarttan ölçülebilir biçimde farklı; bilinmeyen form standarda eşit değil hata vermez', () => {
    const ext = (f: (typeof FORM_IDS)[number]) => { const s = silhouette('disi', f); const all = [...s.body, ...s.fins.flatMap((x) => x.pts)]; return [Math.max(...all.map((p) => p[0])) - Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1])) - Math.min(...all.map((p) => p[1]))]; };
    expect(ext('uzun-yuzgec')[0]).toBeGreaterThan(ext('standart')[0] * 1.08);
    expect(ext('uzun-yuzgec')[1]).toBeGreaterThan(ext('standart')[1] * 1.15);
    expect(ext('balon')[1]).toBeGreaterThan(ext('standart')[1] * 1.1);
    expect(bodyOutline(bodyFor('erkek', 'balon'), 10).length).toBeGreaterThan(10);
  });
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
  it('yüzgeçler (standart): yağ yüzgeci var; kuyruk çatallı (ortası uçlardan kısa); hepsi küçük', () => {
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

describe('neon: torpido gövde (tür karakteri)', () => {
  it('ince ve uzun: en derin kesit boyun ~%21-24\'ü; kuyruk sapı ince; baş sivri', () => {
    const depth = (sx: 'erkek' | 'disi', s: number) => { const c = bodyFor(sx).section(s); return c.yTop - c.yBot; };
    let max = 0; for (let s = 0; s <= 1; s += 0.01) max = Math.max(max, depth('erkek', s));
    expect(max).toBeGreaterThan(0.2); expect(max).toBeLessThan(0.235);
    expect(depth('erkek', 0.95)).toBeLessThan(max * 0.4);
    expect(bodyFor('erkek').section(0.06).hw).toBeLessThan(0.045);
    for (const sx of SEXES) expect(bodyFor(sx).section(0.38).yTop).toBeGreaterThan(bodyFor(sx).section(0.8).yTop * 1.8);
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
