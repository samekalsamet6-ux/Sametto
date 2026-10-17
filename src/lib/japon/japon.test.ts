import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma } from '../akvaryum/fishmath';
import { FORM_IDS, FORM_SPECS, LATERAL, SEXES, bodyFor, eyeExtras, eyeGeom, finsFor, lateralLine, mouthLine, nostrils, operculumArc, pompomSpec, silhouette, tubercles, wenSpec } from './model';
import { FORMS } from './forms';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';
import { paintBody } from './texture';

const ASPECT: Record<string, [number, number]> = { standart: [2.2, 3.4], comet: [2.4, 3.8], bristol: [2.2, 3.4], fantail: [1.8, 2.7], veiltail: [1.8, 2.7], ranchu: [1.7, 2.6], pompom: [1.8, 2.7], celestial: [2.0, 3.0], ryukin: [1.6, 2.4], oranda: [1.8, 2.7], lionhead: [1.9, 2.8], teleskop: [1.8, 2.7], 'balon-goz': [2.0, 3.0], inci: [1.4, 2.0] };
for (const form of FORM_IDS) {
  fishSuite({
    ad: `japon/${form}`, sexes: [...SEXES], bodyFor: (s) => bodyFor(s, form), finsFor: (s) => finsFor(s, form), silhouette: (s) => silhouette(s, form), parts: PARTS, partsFor: (s) => partsFor(s, form),
    partAnchors: (s) => partAnchors(s, form), variants: VARIANTS, paint: (id, sex, W) => paintBody(variantById(id), sex, W, form),
    onSurface: ['govde', 'pullar', 'solungac-kapagi', 'tuberkul', 'karin-dolgun', 'burun-delikleri', 'omuz-kamburu', 'inci-pul'], aspect: ASPECT[form],
  });
}

describe('japon: form (şekil) varyeteleri', () => {
  const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0) / 2);
  const height = (f: (typeof FORM_IDS)[number]) => { const b = bodyFor('erkek', f); let h = 0; for (let i = 0; i <= 60; i++) { const s = b.section(i / 60); h = Math.max(h, s.yTop - s.yBot); } return h; };
  const tailLen = (f: (typeof FORM_IDS)[number]) => { const k = finsFor('erkek', f).find((x) => x.id === 'kuyruk')!; return Math.max(...k.tip.map((p) => p[0])) - 0.5; };
  it('standart ilk; on dört form; FORM_IDS/FORMS/FORM_SPECS tutarlı; iki grup; açıklamalar dürüst', () => {
    expect(FORMS.map((f) => f.id)).toEqual([...FORM_IDS]);
    expect(FORMS[0].id).toBe('standart');
    expect(species.forms).toBe(FORMS);
    expect(Object.keys(FORM_SPECS).sort()).toEqual([...FORM_IDS].sort());
    expect(new Set(FORMS.map((f) => f.grup)).size).toBe(2);
    for (const f of FORMS) { expect(f.aciklama.length).toBeGreaterThan(60); expect(f.aciklama).toMatch(/[Şş]ematik/); }
    expect(FORMS.find((f) => f.id === 'standart')?.dogrulanmali).toBe(false);
  });
  it('tek kuyruklu formlar: tek kuyruk ve tek anal; çift kuyruklu formlar: kuyruk ve anal çift (paired)', () => {
    for (const id of ['standart', 'comet', 'bristol'] as const) { const f = finsFor('erkek', id); expect(f.find((x) => x.id === 'kuyruk')!.paired).toBe(false); expect(f.find((x) => x.id === 'anal')!.paired).toBe(false); }
    for (const id of ['fantail', 'veiltail', 'ryukin', 'oranda', 'lionhead', 'ranchu', 'pompom', 'teleskop', 'celestial', 'balon-goz', 'inci'] as const) { const f = finsFor('erkek', id); expect(f.find((x) => x.id === 'kuyruk')!.paired, id).toBe(true); expect(f.find((x) => x.id === 'anal')!.paired, id).toBe(true); }
  });
  it('fancy gövdeler common’dan belirgin derin; ryukin ve inci en derin; comet en ince', () => {
    expect(height('comet')).toBeLessThan(height('standart'));
    for (const id of ['fantail', 'oranda', 'teleskop'] as const) expect(height(id), id).toBeGreaterThan(height('standart') * 1.2);
    expect(height('ryukin')).toBeGreaterThan(height('fantail'));
    expect(height('inci')).toBeGreaterThan(height('ryukin'));
    const hump = (f: (typeof FORM_IDS)[number]) => { const b = bodyFor('erkek', f); return b.section(0.33).yTop - b.section(0.6).yTop; };
    expect(hump('ryukin')).toBeGreaterThan(hump('fantail') + 0.05); // omuz kamburu
  });
  it('sırt yüzgeci: lionhead ve bubble eye’da yok; ryukin’de en yüksek; comet kuyruğu en uzun, Bristol kuyruğu en geniş', () => {
    for (const id of ['lionhead', 'balon-goz', 'ranchu', 'celestial'] as const) expect(finsFor('erkek', id).some((x) => x.id === 'sirt'), id).toBe(false);
    for (const id of ['veiltail', 'pompom'] as const) expect(finsFor('erkek', id).some((x) => x.id === 'sirt'), id).toBe(true);
    const dH = (f: (typeof FORM_IDS)[number]) => { const d = finsFor('erkek', f).find((x) => x.id === 'sirt')!; return Math.max(...d.tip.map((p, i) => p[1] - d.base[i][1])); };
    expect(dH('ryukin')).toBeGreaterThan(dH('fantail'));
    expect(dH('fantail')).toBeGreaterThan(dH('standart'));
    expect(tailLen('comet')).toBeGreaterThan(tailLen('standart') * 1.5);
    const spread = (f: (typeof FORM_IDS)[number]) => { const k = finsFor('erkek', f).find((x) => x.id === 'kuyruk')!; return Math.max(...k.tip.map((p) => p[1])) - Math.min(...k.tip.map((p) => p[1])); };
    expect(spread('bristol')).toBeGreaterThan(spread('standart') * 1.15);
    const k = finsFor('erkek', 'comet').find((x) => x.id === 'kuyruk')!;
    expect(k.tip[Math.floor(k.tip.length / 2)][0]).toBeLessThan(k.tip[0][0] - 0.1); // derin çatal
    const kb = finsFor('erkek', 'bristol').find((x) => x.id === 'kuyruk')!;
    expect(kb.tip[Math.floor(kb.tip.length / 2)][0]).toBeGreaterThan(kb.tip[0][0]); // yuvarlak, çatalsız
  });
  it('veiltail kuyruğu fantail’inkinden belirgin uzun; ranchu kuyruğu kısa ve aşağı eğik, sırtı yumurta biçimli kavisli', () => {
    expect(tailLen('veiltail')).toBeGreaterThan(tailLen('fantail') * 1.25);
    expect(tailLen('ranchu')).toBeLessThan(tailLen('fantail'));
    const ytip = (f: (typeof FORM_IDS)[number]) => { const k = finsFor('erkek', f).find((x) => x.id === 'kuyruk')!; return k.tip.reduce((a, p) => a + p[1], 0) / k.tip.length - k.base.reduce((a, p) => a + p[1], 0) / k.base.length; };
    expect(ytip('ranchu')).toBeLessThan(ytip('fantail') - 0.03);
    const b = bodyFor('erkek', 'ranchu'), l = bodyFor('erkek', 'lionhead');
    expect(b.section(0.42).yTop - b.section(0.95).yTop).toBeGreaterThan(l.section(0.42).yTop - l.section(0.95).yTop + 0.03); // güçlü sırt kavisi
    const dh = (f: (typeof FORM_IDS)[number]) => { const d = finsFor('erkek', f).find((x) => x.id === 'sirt')!; return Math.max(...d.tip.map((p, i) => p[1] - d.base[i][1])); };
    expect(dh('veiltail')).toBeGreaterThan(dh('fantail') * 1.25);
  });
  it('pompom: yalnızca pompom formunda burun tomurcukları; celestial gözleri yukarı bakar, çıkıntılı, sapı var, kese yok', () => {
    for (const id of FORM_IDS) expect(!!pompomSpec('erkek', id), id).toBe(id === 'pompom');
    const pp = pompomSpec('erkek', 'pompom')!;
    expect(pp.puffs.length).toBeGreaterThanOrEqual(3);
    const e = eyeGeom('erkek', 'pompom');
    for (const q of pp.puffs) { expect(q.center[0]).toBeLessThan(e.center[0]); expect(q.center[2]).toBeGreaterThan(0); }
    const c = eyeGeom('erkek', 'celestial'), n = eyeGeom('erkek', 'standart');
    expect(c.normal[1]).toBeGreaterThan(0.9);
    expect(c.radius).toBeGreaterThan(n.radius * 1.3);
    expect(c.center[1]).toBeGreaterThan(bodyFor('erkek', 'celestial').section(0.1).yTop);
    const x = eyeExtras('erkek', 'celestial');
    expect(x.stalk?.path.length).toBeGreaterThan(1); expect(x.sac).toBeUndefined();
  });
  it('çift kuyruk: iki lob z ekseninde ayrışır; kuyruk uç z > taban z', () => {
    const k = finsFor('erkek', 'fantail').find((x) => x.id === 'kuyruk')!;
    expect(Math.max(...k.tip.map((p) => p[2]))).toBeGreaterThan(0.1);
  });
  it('wen: yalnızca oranda, lionhead ve ranchu; lionhead’de daha büyük; sapma yumruları; diğer formlarda yok', () => {
    for (const id of FORM_IDS) expect(!!wenSpec('erkek', id), id).toBe(id === 'oranda' || id === 'lionhead' || id === 'ranchu');
    const o = wenSpec('erkek', 'oranda')!, l = wenSpec('erkek', 'lionhead')!;
    expect(l.radii[0] * l.radii[1] * l.radii[2]).toBeGreaterThan(o.radii[0] * o.radii[1] * o.radii[2] * 1.5);
    expect(o.bumps).toBeGreaterThan(3);
  });
  it('göz: telescope’ta iri ve gövdeden dışarı taşar + göz sapı; bubble eye’da yukarı bakar + sıvı kesesi; diğerlerinde ek yok', () => {
    const n = eyeGeom('erkek', 'standart'), t = eyeGeom('erkek', 'teleskop'), bb = eyeGeom('erkek', 'balon-goz');
    expect(t.radius).toBeGreaterThan(n.radius * 1.4);
    expect(t.center[2]).toBeGreaterThan(bodyFor('erkek', 'teleskop').section(0.1).hw);
    expect(eyeExtras('erkek', 'teleskop').stalk?.path.length).toBeGreaterThan(1);
    expect(bb.normal[1]).toBeGreaterThan(0.8);
    const sac = eyeExtras('erkek', 'balon-goz').sac!;
    expect(sac.center[1]).toBeLessThan(bb.center[1]);
    for (const id of ['standart', 'comet', 'fantail', 'oranda'] as const) expect(Object.keys(eyeExtras('erkek', id))).toHaveLength(0);
  });
  it('forma özgü parçalar yalnızca ilgili formda; sırt yüzgeci parçası lionhead’de yok; standartta 13 parça', () => {
    const ids = (f: (typeof FORM_IDS)[number]) => partsFor('erkek', f).map((p) => p.id);
    expect(ids('standart')).toHaveLength(13);
    expect(ids('oranda')).toContain('wen'); expect(ids('lionhead')).toContain('wen'); expect(ids('fantail')).not.toContain('wen');
    expect(ids('teleskop')).toContain('teleskop-goz'); expect(ids('balon-goz')).toContain('balon-kesesi'); expect(ids('ryukin')).toContain('omuz-kamburu'); expect(ids('inci')).toContain('inci-pul');
    expect(ids('ranchu')).toContain('wen'); expect(ids('pompom')).toContain('pompom'); expect(ids('pompom')).not.toContain('burun-delikleri'); expect(ids('celestial')).toContain('gokyuzu-goz'); expect(ids('celestial')).not.toContain('sirt-yuzgeci'); expect(ids('ranchu')).not.toContain('sirt-yuzgeci');
    expect(ids('lionhead')).not.toContain('sirt-yuzgeci'); expect(ids('balon-goz')).not.toContain('sirt-yuzgeci'); expect(ids('fantail')).toContain('sirt-yuzgeci');
    expect(partsFor('erkek', 'bilinmeyen').length).toBe(13);
  });
  it('her formun silüeti standarttan farklı (alan veya genişlik); fancy formların silüet alanı büyük', () => {
    const a0 = area(silhouette('erkek', 'standart').body);
    for (const id of FORM_IDS.filter((x) => x !== 'standart')) {
      const a = area(silhouette('erkek', id).body), s = silhouette('erkek', id), s0 = silhouette('erkek', 'standart');
      const all = (x: typeof s) => [...x.body, ...x.fins.flatMap((f) => f.pts)];
      const w = (x: typeof s) => Math.max(...all(x).map((p) => p[0])) - Math.min(...all(x).map((p) => p[0]));
      const hh = (x: typeof s) => Math.max(...all(x).map((p) => p[1])) - Math.min(...all(x).map((p) => p[1]));
      const diff = Math.abs(a - a0) / a0 + Math.abs(w(s) - w(s0)) / w(s0) + Math.abs(hh(s) - hh(s0)) / hh(s0);
      expect(diff, id).toBeGreaterThan(0.05);
    }
    for (const id of ['fantail', 'ryukin', 'oranda', 'inci'] as const) expect(area(silhouette('erkek', id).body), id).toBeGreaterThan(a0 * 1.2);
  });
});

describe('japon: common gövdesi (standart form)', () => {
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
      expect(`${v.ad} ${v.id}`).not.toMatch(/oranda|ryukin|telescope|veil|fancy/i); // renk adları form adı içermez
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
    expect(species.forms?.length).toBe(14);
  });
});
