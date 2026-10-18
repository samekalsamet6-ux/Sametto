import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma } from '../akvaryum/fishmath';
import { ARMOR, FORM_IDS, FORM_PARAMS, SEXES, barbels, bodyFor, eyeGeom, finsFor, lipsLoop, operculumArc, silhouette, spines } from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';
import { FORMS } from './forms';
import { PLATE_Y, paintBody, plateEdges } from './texture';

const ASPECT = { standart: [2.7, 4.8], 'uzun-yuzgec': [2.7, 4.8], balon: [1.8, 3.8] } as const;
for (const form of FORM_IDS) {
  fishSuite({
    ad: `corydoras/${form}`, sexes: [...SEXES], bodyFor: (s) => bodyFor(s, form), finsFor: (s) => finsFor(s, form), silhouette: (s) => silhouette(s, form), parts: PARTS, partsFor,
    partAnchors: (s) => partAnchors(s, form), variants: VARIANTS, paint: (id, sex, W) => paintBody(variantById(id), sex, W),
    onSurface: ['govde', 'zirh', 'bas-kalkani', 'solungac-kapagi', 'govde-genis', 'govde-dar'], aspect: [...ASPECT[form]],
  });
}

describe('corydoras: form (şekil) varyeteleri', () => {
  const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0) / 2);
  const ext = (form: (typeof FORM_IDS)[number], id: string) => { const f = finsFor('erkek', form).find((x) => x.id === id)!; return Math.max(...f.tip.map((p, i) => Math.hypot(p[0] - f.base[i][0], p[1] - f.base[i][1]))); };
  it('standart ilk; üç gerçek form; FORM_IDS ile uyumlu; dürüst açıklamalar', () => {
    expect(FORMS.map((f) => f.id)).toEqual([...FORM_IDS]);
    expect(species.forms).toBe(FORMS);
    for (const f of FORMS) expect(f.aciklama.length).toBeGreaterThan(60);
    expect(FORMS[1].dogrulanmali && FORMS[2].dogrulanmali).toBe(true);
  });
  it('uzun yüzgeçli: tüm yüzgeçler belirgin uzun; gövde ve zırh aynı; dikenler yüzgeçle birlikte uzar', () => {
    for (const id of ['sirt', 'anal', 'kuyruk', 'karin', 'gogus']) expect(ext('uzun-yuzgec', id), id).toBeGreaterThan(ext('standart', id) * 1.4);
    expect(bodyFor('erkek', 'uzun-yuzgec').section(0.4).yTop).toBeCloseTo(bodyFor('erkek', 'standart').section(0.4).yTop, 9);
    const sp = (f: (typeof FORM_IDS)[number]) => { const p = spines('erkek', f).find((x) => x.id === 'sirt')!.path; return Math.hypot(p[2][0] - p[0][0], p[2][1] - p[0][1]); };
    expect(sp('uzun-yuzgec')).toBeGreaterThan(sp('standart') * 1.3);
  });
  it('balon: gövde yuvarlak ve geniş, karın düz değil (nBot aynı ama derin); silüet alanı büyür; yüzgeç biraz küçük', () => {
    const s = bodyFor('erkek', 'standart').section(0.45), b = bodyFor('erkek', 'balon').section(0.45);
    expect(b.yTop - b.yBot).toBeGreaterThan((s.yTop - s.yBot) * 1.3);
    expect(b.hw).toBeGreaterThan(s.hw * 1.2);
    expect(-b.yBot).toBeGreaterThan(-s.yBot * 1.6);
    expect(area(silhouette('erkek', 'balon').body)).toBeGreaterThan(area(silhouette('erkek', 'standart').body) * 1.25);
    expect(FORM_PARAMS.balon.fin.dorsal).toBeLessThan(1);
  });
  it('her form silüeti standarttan ölçülebilir biçimde farklı', () => {
    const e = (f: (typeof FORM_IDS)[number]) => { const s = silhouette('disi', f); const all = [...s.body, ...s.fins.flatMap((x) => x.pts)]; return [Math.max(...all.map((p) => p[0])) - Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1])) - Math.min(...all.map((p) => p[1]))]; };
    expect(e('uzun-yuzgec')[0]).toBeGreaterThan(e('standart')[0] * 1.08);
    expect(e('uzun-yuzgec')[1]).toBeGreaterThan(e('standart')[1] * 1.12);
    expect(e('balon')[1]).toBeGreaterThan(e('standart')[1] * 1.05);
  });
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
    // ince, üst üste binen plakalar: her plaka görünen şeridinden uzun; iki sıra yarım adım kaydırılmış; konumlar düzensiz (cetvel gibi değil)
    for (const p of e.filter((q) => q.x1 < 0.96 * 1000)) expect(p.x1 - p.x0).toBeGreaterThan(p.pitch * 1.4);
    const row0 = e.filter((p) => p.row === 0), row1 = e.filter((p) => p.row === 1);
    expect(Math.abs(row1[3].x0 - row0[3].x0)).toBeGreaterThan(row0[0].pitch * 0.15);
    const gaps = row0.slice(1).map((p, i) => p.x0 - row0[i].x0), mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(mean * 0.1);
    for (const s of SEXES) { expect(eyeGeom(s).center[1]).toBeGreaterThan(0.02); expect(operculumArc(s, 1).every((p) => p[0] > eyeGeom(s).center[0])).toBe(true); }
  });
});

describe('corydoras: hörgüçlü gövde (tür karakteri)', () => {
  const top = (s: number) => bodyFor('erkek').section(s).yTop;
  it('dik burun/ense eğimi: dorsal kökünde (s≈0.3–0.45) belirgin tepe; arkada düz inen sırt çizgisi', () => {
    let peak = 0, at = 0;
    for (let i = 0; i <= 100; i++) { const y = top(i / 100); if (y > peak) { peak = y; at = i / 100; } }
    expect(at).toBeGreaterThan(0.3); expect(at).toBeLessThan(0.45);
    expect(top(0.3) - top(0.1)).toBeGreaterThan(0.11); // ense dik tırmanır
    expect(peak - top(0.9)).toBeGreaterThan(0.12); // arkada belirgin iner
    const dx = 0.1, slope = (a: number) => (top(a + dx) - top(a)) / dx;
    expect(slope(0.05)).toBeGreaterThan(0.7); // ~35° ve üzeri burun/ense eğimi
    expect(slope(0.55)).toBeLessThan(-0.3);
  });
  it('sırt kesiti hafif sivri (sırt çıkıntısı), karın düz; omuz geniş; kısa derin oran', () => {
    const c = bodyFor('erkek').section(0.37);
    expect(c.nTop).toBeLessThan(1.9);
    expect(c.nBot).toBeGreaterThan(3);
    expect(bodyFor('erkek').section(0.28).hw).toBeGreaterThan(0.13);
    expect(c.yTop - c.yBot).toBeGreaterThan(0.33); // derinlik/boy ≈ 1/2.9
  });
  it('büyük gözler; sırt dikeni ve göğüs dikeni belirgin kalın; sırt yüzgeci yüksek', () => {
    expect(eyeGeom("erkek").radius).toBeGreaterThanOrEqual(0.029);
    const sp = spines('erkek');
    expect(sp.find((x) => x.id === 'sirt')!.r).toBeGreaterThanOrEqual(0.0065);
    expect(sp.find((x) => x.id === 'gogus')!.r).toBeGreaterThanOrEqual(0.006);
    const d = finsFor('erkek').find((x) => x.id === 'sirt')!;
    expect(Math.max(...d.tip.map((q) => q[1])) - Math.max(...d.base.map((q) => q[1]))).toBeGreaterThan(0.2);
  });
  it('doku: iki plaka sırasının sınırları yarım yükseklik içinde; kabartma dokusu iki yarıdan oluşur', () => {
    expect(PLATE_Y.top).toBeLessThan(PLATE_Y.mid); expect(PLATE_Y.mid).toBeLessThan(PLATE_Y.bot); expect(PLATE_Y.bot).toBeLessThanOrEqual(1);
    expect(Math.abs(PLATE_Y.mid - 0.5)).toBeLessThan(0.05);
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

import { mouthSpec as cMouth } from './model';
describe('corydoras: alt ağız ve bıyık kökleri', () => {
  it('ağız aşağı bakar, dudaklar kalın; bıyıklar dudak köşelerinden çıkar', () => {
    for (const s of SEXES) {
      const m = cMouth(s); expect(m.dir[1]).toBeLessThan(-0.7); expect(m.lip).toBeGreaterThan(0.005);
      for (const x of barbels(s)) { expect(Math.abs(x.path[0][2])).toBeLessThanOrEqual(m.hw + 1e-9); expect(Math.abs(x.path[0][0] - m.c[0])).toBeLessThan(0.03); }
    }
  });
});
