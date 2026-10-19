import { describe, expect, it } from 'vitest';
import { fishSuite } from '../akvaryum/fish-contract';
import { hexToRgb, luma, mulberry32 } from '../akvaryum/fishmath';
import { SEXES, FIN_SIZES, FORM_SPECS, bodyFor, caudalExtent, eyeSpec, finsFor, formById, mouthLine, operculumArc, ovipositor, silhouette, webFraction } from './model';
import { FORMS } from './forms';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, sexTone, variantById } from './variants';
import { species } from './index';
import { SCALES, hueShift, paintBody, webEdge } from './texture';

fishSuite({
  ad: 'betta', sexes: [...SEXES], bodyFor, finsFor, silhouette, parts: PARTS, partsFor, partAnchors, variants: VARIANTS,
  paint: (id, sex, W) => paintBody(variantById(id), sex, W), onSurface: ['govde', 'pullar', 'solungac-kapagi', 'labirent'], aspect: [3.4, 6.5],
});

// her form için ortak geometri/parça/doku sözleşmesi
for (const f of FORMS) {
  fishSuite({
    ad: `betta/${f.id}`, sexes: [...SEXES], bodyFor: (s) => bodyFor(s, f.id), finsFor: (s) => finsFor(s, f.id), silhouette: (s) => silhouette(s, f.id),
    parts: PARTS, partsFor: (s) => partsFor(s, f.id), partAnchors: (s) => partAnchors(s, f.id), variants: VARIANTS,
    paint: (id, sex, W) => paintBody(variantById(id), sex, W, f.id), onSurface: ['govde', 'pullar', 'solungac-kapagi', 'labirent'], aspect: [3.4, 6.5],
  });
}

describe('betta: cinsiyet farkları ve kapsam', () => {
  it('erkek yüzgeçleri dişiden belirgin büyük; dişi gövdesi daha dolgun', () => {
    for (const k of ['dorsal', 'caudalLen', 'anal', 'pelvic'] as const) expect(FIN_SIZES.erkek[k], k).toBeGreaterThan(FIN_SIZES.disi[k] * 1.4);
    const h = (s: 'erkek' | 'disi') => { const x = bodyFor(s).section(0.5); return x.yTop - x.yBot; };
    expect(h('disi')).toBeGreaterThan(h('erkek'));
  });
  it('plakat (varsayılan form): kuyruk gövde boyunun en çok ~%35\'i; yüzgeç kimlikleri beklenen', () => {
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
    expect(species.forms).toBe(FORMS);
    expect(species.parts).toBe(PARTS);
    expect(typeof species.createViewer).toBe('function');
  });
});

describe('betta: form (şekil) varyeteleri', () => {
  it('form listesi: standart ilk, kimlikler benzersiz ve geometri tanımıyla eşleşir; gruplu; belirsizler doğrulanmalı', () => {
    expect(FORMS[0].id).toBe('plakat');
    expect(new Set(FORMS.map((f) => f.id)).size).toBe(FORMS.length);
    expect(FORMS.map((f) => f.id)).toEqual(FORM_SPECS.map((f) => f.id));
    for (const id of ['plakat', 'veiltail', 'delta', 'super-delta', 'halfmoon', 'overhalfmoon', 'crowntail', 'rosetail', 'double-tail', 'dumbo', 'spade', 'combtail']) expect(FORMS.some((f) => f.id === id), id).toBe(true);
    for (const f of FORMS) { expect(f.aciklama.length).toBeGreaterThan(80); expect(f.grup).toBeTruthy(); expect(f.id).toMatch(/^[a-z]+(-[a-z]+)*$/); }
    for (const id of ['spade', 'combtail', 'rosetail', 'overhalfmoon', 'delta', 'super-delta']) expect(FORMS.find((f) => f.id === id)!.dogrulanmali, id).toBe(true);
    expect(formById('yok').id).toBe('plakat');
  });
  it('kuyruk açıklığı sırası: plakat < delta < super delta < halfmoon; halfmoon ≈ 180° (tepe ışını düşey)', () => {
    const sp = (id: string) => caudalExtent('erkek', id).span;
    expect(sp('delta')).toBeGreaterThan(sp('plakat'));
    expect(sp('super-delta')).toBeGreaterThan(sp('delta'));
    expect(sp('halfmoon')).toBeGreaterThan(sp('super-delta'));
    const k = finsFor('erkek', 'halfmoon').find((f) => f.id === 'kuyruk')!;
    const top = k.tip[0], b = k.base[0];
    expect(Math.abs(top[0] - b[0])).toBeLessThan(0.02); // tepe ışını yukarı bakar
    expect(top[1] - b[1]).toBeGreaterThan(0.3);
    const bot = k.tip[k.tip.length - 1];
    expect(top[1] + bot[1]).toBeCloseTo(k.base[0][1] + k.base[k.base.length - 1][1], 1); // simetrik
  });
  it('delta / super delta: geniş, yuvarlak köşeli yelpaze; yüksekliği genişliğinin ~1,3 katından fazla değil; halfmoon\'dan ayrı', () => {
    const shape = (id: string) => {
      const k = finsFor('erkek', id).find((f) => f.id === 'kuyruk')!;
      const xs = k.tip.map((p) => p[0]), ys = k.tip.map((p) => p[1]);
      return { w: Math.max(...xs) - k.base[0][0], h: Math.max(...ys) - Math.min(...ys), k };
    };
    const d = shape('delta'), sd = shape('super-delta'), hm = shape('halfmoon');
    expect(d.h / d.w).toBeLessThan(1.35);
    expect(d.h).toBeLessThan(sd.h);
    expect(sd.h).toBeLessThan(hm.h);
    // yuvarlak köşe: uç ışın, ondan hemen içerideki ışından kısa (düz üçgen sivri köşesi yok)
    const len = (k: typeof d.k, i: number) => Math.hypot(k.tip[i][0] - k.base[i][0], k.tip[i][1] - k.base[i][1]);
    for (const x of [d, sd]) { const n = x.k.tip.length; expect(len(x.k, 0)).toBeLessThan(len(x.k, 2) * 1.0001); expect(len(x.k, n - 1)).toBeLessThan(len(x.k, n - 3) * 1.0001); }
    // halfmoon 180° (tepe ışını düşey), super delta daha dar açı
    expect(Math.abs(hm.k.tip[0][0] - hm.k.base[0][0])).toBeLessThan(0.02);
    expect(Math.abs(sd.k.tip[0][0] - sd.k.base[0][0])).toBeGreaterThan(0.04);
  });
  it('overhalfmoon: uç ışınlar gövdeye doğru geri kıvrılır (180°yi aşar)', () => {
    const k = finsFor('erkek', 'overhalfmoon').find((f) => f.id === 'kuyruk')!;
    expect(k.tip[0][0]).toBeLessThan(k.base[0][0] - 0.01);
    const h = finsFor('erkek', 'halfmoon').find((f) => f.id === 'kuyruk')!;
    expect(k.tip[0][0]).toBeLessThan(h.tip[0][0]);
  });
  it('veiltail sarkık (alt ışınlar daha uzun); spade ortada sivri; delta arka kenarı düze yakın', () => {
    const v = finsFor('erkek', 'veiltail').find((f) => f.id === 'kuyruk')!;
    const lowest = Math.min(...v.tip.map((p) => p[1])), highest = Math.max(...v.tip.map((p) => p[1]));
    expect(-lowest).toBeGreaterThan(highest);
    const sp = finsFor('erkek', 'spade').find((f) => f.id === 'kuyruk')!;
    const xs = sp.tip.map((p) => p[0]), mid = Math.floor(xs.length / 2);
    expect(xs[mid]).toBeGreaterThan(xs[0] + 0.05);
    expect(xs[mid]).toBe(Math.max(...xs));
    const d = finsFor('erkek', 'delta').find((f) => f.id === 'kuyruk')!;
    const dx = d.tip.map((p) => p[0]);
    const rng = (a: number[]) => Math.max(...a) - Math.min(...a);
    const hm = finsFor('erkek', 'halfmoon').find((f) => f.id === 'kuyruk')!;
    expect(rng(dx)).toBeLessThan(rng(hm.tip.map((p) => p[0])));
  });
  it('çift kuyruk: iki ayrı lob (kuyruk, kuyruk2), aralarında yarık; sırt yüzgeci plakattan çok büyük', () => {
    const fins = finsFor('erkek', 'double-tail');
    const up = fins.find((f) => f.id === 'kuyruk')!, lo = fins.find((f) => f.id === 'kuyruk2')!;
    expect(Math.min(...up.tip.map((p) => p[1]))).toBeGreaterThan(Math.max(...lo.tip.map((p) => p[1])) - 0.02); // üst lob altta lobun üstünde
    expect(up.tip.some((p) => p[2] > 0.01) && lo.tip.some((p) => p[2] < -0.01)).toBe(true);
    const h = (f: string) => { const d = finsFor('erkek', f).find((x) => x.id === 'sirt')!; return Math.max(...d.tip.map((p) => p[1])); };
    expect(h('double-tail')).toBeGreaterThan(h('plakat') + 0.1);
    expect(finsFor('erkek', 'plakat').some((f) => f.id === 'kuyruk2')).toBe(false);
  });
  it('fil kulak: göğüs yüzgeci plakattan çok büyük ve yana açık; diğer yüzgeçler plakatla aynı', () => {
    const ext = (f: string) => { const g = finsFor('erkek', f).find((x) => x.id === 'gogus')!; return Math.max(...g.tip.map((p, i) => Math.hypot(p[0] - g.base[i][0], p[1] - g.base[i][1], p[2] - g.base[i][2]))); };
    expect(ext('dumbo')).toBeGreaterThan(ext('plakat') * 2.2);
    const a = finsFor('erkek', 'dumbo'), b = finsFor('erkek', 'plakat');
    expect(a.find((f) => f.id === 'kuyruk')!.tip).toEqual(b.find((f) => f.id === 'kuyruk')!.tip);
    expect(Math.max(...a.find((f) => f.id === 'gogus')!.tip.map((p) => p[2]))).toBeGreaterThan(0.18);
  });
  it('crowntail/combtail/rosetail: sütun sayısı artar; zar geri çekilme sırası crown < comb < rose < tam; kenar profili ışında 1', () => {
    expect(finsFor('erkek', 'crowntail').find((f) => f.id === 'kuyruk')!.base.length).toBeGreaterThan(finsFor('erkek', 'halfmoon').find((f) => f.id === 'kuyruk')!.base.length);
    const w = (id: string) => webFraction(id, 'erkek');
    expect(w('crowntail')).toBeLessThan(w('combtail'));
    expect(w('combtail')).toBeLessThan(w('rosetail'));
    expect(w('rosetail')).toBeLessThan(1);
    expect(w('halfmoon')).toBe(1);
    for (const n of [8, 23]) {
      expect(webEdge(0, n, 0.5, 5)).toBeCloseTo(1, 9);
      expect(webEdge(1 / (n - 1), n, 0.5, 5)).toBeCloseTo(1, 9);
      expect(webEdge(0.5 / (n - 1), n, 0.5, 5)).toBeCloseTo(0.5, 6);
    }
    const z = finsFor('erkek', 'rosetail').find((f) => f.id === 'kuyruk')!;
    expect(z.tip[0][2] * z.tip[1][2]).toBeLessThan(0);
  });
  it('dişi: süslü formların yüzgeçleri erkekten kısa/dar ama plakat dişiden büyük; yapı (çift kuyruk, fil kulak) korunur', () => {
    for (const id of ['veiltail', 'delta', 'super-delta', 'halfmoon', 'overhalfmoon', 'crowntail', 'rosetail', 'double-tail']) {
      expect(caudalExtent('disi', id).span, id).toBeLessThan(caudalExtent('erkek', id).span * 0.85);
      expect(caudalExtent('disi', id).span, id).toBeGreaterThan(caudalExtent('disi', 'plakat').span * 0.9);
    }
    expect(finsFor('disi', 'double-tail').some((f) => f.id === 'kuyruk2')).toBe(true);
    const ext = (f: string) => { const g = finsFor('disi', f).find((x) => x.id === 'gogus')!; return Math.max(...g.tip.map((p, i) => Math.hypot(p[0] - g.base[i][0], p[2] - g.base[i][2]))); };
    expect(ext('dumbo')).toBeGreaterThan(ext('plakat') * 2);
    expect(webFraction('crowntail', 'disi')).toBeGreaterThan(webFraction('crowntail', 'erkek'));
  });
  it('her form plakattan ölçülebilir biçimde farklıdır (silüet alanı ya da yüzgeç sayısı)', () => {
    const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    const sig = (id: string) => silhouette('erkek', id).fins.map((f) => area(f.pts));
    const base = sig('plakat');
    for (const f of FORMS.slice(1)) {
      const s = sig(f.id);
      const differs = s.length !== base.length || s.some((a, i) => Math.abs(a - base[i]) > base[i] * 0.08);
      if (f.id === 'dumbo') { // göğüs yüzgeci silüette yok: yüzgeç nesnesi farkını denetle
        const g = (x: string) => finsFor('erkek', x).find((y) => y.id === 'gogus')!.tip.flat().join();
        expect(g('dumbo')).not.toBe(g('plakat'));
      } else expect(differs, f.id).toBe(true);
    }
  });
  it('parça metni forma uyar; parça kimlikleri tüm formlarda aynı', () => {
    const base = partsFor('erkek').map((p) => p.id);
    for (const f of FORMS) expect(partsFor('erkek', f.id).map((p) => p.id)).toEqual(base);
    expect(partsFor('erkek', 'halfmoon').find((p) => p.id === 'kuyruk-yuzgeci')!.aciklama).toMatch(/Halfmoon/);
    expect(partsFor('erkek', 'dumbo').find((p) => p.id === 'gogus-yuzgeci')!.aciklama).toMatch(/Fil kulak|fil kulak/);
    expect(partsFor('erkek', 'plakat').find((p) => p.id === 'kuyruk-yuzgeci')!.aciklama).not.toMatch(/Seçili form/);
  });
  it('çift kuyrukta gövde plakattan derin; diğer formlarda aynı', () => {
    const h = (f: string) => { const s = bodyFor('erkek', f).section(0.4); return s.yTop - s.yBot; };
    expect(h('double-tail')).toBeGreaterThan(h('plakat'));
    expect(h('halfmoon')).toBe(h('plakat'));
  });
});

describe('betta: baş ve pul dokusu (tür karakteri)', () => {
  it('baş yassı ve geniş (labirent balığı); alt çene öne çıkık; ağız yarığı geriye doğru YUKARI çıkar (üste dönük ağız)', () => {
    for (const s of SEXES) {
      const b = bodyFor(s), c = b.section(0.12);
      expect(c.hw * 2).toBeGreaterThan((c.yTop - c.yBot) * 0.95);
      const m = mouthLine(s, 1);
      expect(m[0][0]).toBeLessThan(m[2][0]);
      expect(m[2][1]).toBeGreaterThan(m[0][1] + 0.02);
      expect(m.every((p) => Number.isFinite(p[0] + p[1] + p[2]))).toBe(true);
      expect(Math.abs(mouthLine(s, -1)[2][2] + m[2][2])).toBeLessThan(1e-9);
      expect(eyeSpec(s).radius).toBeGreaterThanOrEqual(0.028);
    }
  });
  it('pul ızgarası baştan sonra başlar ve sütun/satır sayıları makul', () => {
    expect(SCALES.s0).toBeGreaterThanOrEqual(0.19);
    expect(SCALES.cols).toBeGreaterThan(24);
    expect(SCALES.rows).toBeGreaterThan(7);
  });
  it('hueShift: kırmızıyı 120° kaydırınca yeşil; açma beyaza yaklaştırır; gri değişmez', () => {
    const g = hexToRgb(hueShift('#ff0000', 120));
    expect(g[1]).toBeGreaterThan(g[0] + 0.5);
    expect(hexToRgb(hueShift('#2650b8', 0, 0.5))[0]).toBeGreaterThan(hexToRgb('#2650b8')[0]);
    expect(hueShift('#808080', 90)).toBe('#808080');
  });
});

import { mouthSpec as bMouth } from './model';
describe('betta: ağız yukarı bakar, alt çene öne çıkık', () => {
  it('süperior ağız: yön yukarı-öne; alt dudak üst dudaktan daha çok çıkıntılı', () => {
    for (const s of SEXES) { const m = bMouth(s); expect(m.dir[1]).toBeGreaterThan(0.5); expect(m.dir[0]).toBeLessThan(0); expect(m.lower!).toBeGreaterThan(m.upper! * 3); expect(m.c[0]).toBeLessThan(-0.47); }
  });
});
