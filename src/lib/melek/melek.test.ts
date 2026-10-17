import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM, FINS, FORM_IDS, SPEC, specFor, bodyFns, hexToRgb, outline, silhouette, xOfT } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { FORMS, formById } from './forms';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

describe('melek balığı geometrisi', () => {
  it('gövde yüksek ve yanlardan çok basık: yükseklik uzunluğun yarısından fazla, kalınlık yüksekliğin dörtte birinden az', () => {
    const f = bodyFns(SPEC.body);
    const L = SPEC.body.xe - SPEC.body.xs;
    let hMax = 0, wMax = 0;
    for (let t = 0; t <= 1; t += 0.01) { hMax = Math.max(hMax, f.top(t) - f.bot(t)); wMax = Math.max(wMax, 2 * f.w(t)); }
    expect(hMax / L).toBeGreaterThan(0.6);
    expect(wMax / hMax).toBeLessThan(0.28);
    expect(f.top(0)).toBeCloseTo(f.bot(0), 6); // burun kapalı
  });
  it('sırt ve anal yüzgeç gövdeden çok yüksek: toplam yükseklik gövdenin 2,2 katından fazla; sivri üçgen', () => {
    const [d, a, c] = FINS;
    const top = Math.max(...d.edge.map((p) => p[1])), bot = Math.min(...a.edge.map((p) => p[1]));
    const f = bodyFns(SPEC.body);
    const body = Math.max(...[...Array(101).keys()].map((i) => f.top(i / 100))) * 2;
    expect((top - bot) / body).toBeGreaterThan(2.2);
    // tek bir zirve: sırt yüzgecinin uç çizgisi bir kez yükselip bir kez alçalır
    const ys = d.edge.map((p) => p[1]);
    const peak = ys.indexOf(Math.max(...ys));
    for (let i = 1; i <= peak; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1] - 1e-6);
    for (let i = peak + 1; i < ys.length; i++) expect(ys[i]).toBeLessThanOrEqual(ys[i - 1] + 1e-6);
    expect(d.base).toHaveLength(d.edge.length);
    // kuyruk yüzgeci gövdenin arkasında, çatallı (orta uç, köşelerden içeride)
    expect(Math.min(...c.edge.map((p) => p[0]))).toBeGreaterThanOrEqual(SPEC.body.xe - 0.02);
    const mid = c.edge.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), c.edge[0]);
    expect(mid[0]).toBeLessThan(Math.max(...c.edge.map((p) => p[0])) - 0.03);
  });
  it('karın iplikleri gövdenin altına, yüzgeç uçları kadar sarkar; tüm noktalar sonlu', () => {
    const fil = SPEC.filaments[0];
    expect(fil.path[fil.path.length - 1][1]).toBeLessThan(-0.9);
    for (const f of FINS) for (const p of [...f.base, ...f.edge]) expect(finite(p)).toBe(true);
    for (const p of outline(SPEC.body, 40)) expect(finite(p)).toBe(true);
  });
  it('göz iri (gövde yüksekliğinin %8’inden fazla) ve başta; ağız burun ucunda', () => {
    const f = bodyFns(SPEC.body);
    expect(SPEC.eye.r * 2).toBeGreaterThan(0.08 * (Math.max(...[...Array(101).keys()].map((i) => f.top(i / 100))) * 2));
    expect(SPEC.eye.x).toBeLessThan(xOfT(SPEC.body, 0.25));
    expect(SPEC.mouth[0][0]).toBeCloseTo(SPEC.body.xs, 1);
  });
});

describe('formlar (şekil varyeteleri)', () => {
  const ext = (id: string) => {
    const sp = specFor(id);
    const pts = sp.fins.flatMap((f) => [...f.base, ...f.edge]);
    return { w: Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])), top: Math.max(...sp.fins[0].edge.map((p) => p[1])), bot: Math.min(...sp.fins[1].edge.map((p) => p[1])), tail: Math.max(...sp.fins[2].edge.map((p) => p[0])), fil: sp.filaments[0].path[sp.filaments[0].path.length - 1][1] };
  };
  it('kimlikler forms.ts ile model arasında eşleşir; standart ilk; her formun açıklaması dolu; altum yok', () => {
    expect(FORMS.map((f) => f.id).sort()).toEqual([...FORM_IDS].sort());
    expect(FORMS[0].id).toBe(DEFAULT_FORM);
    expect(specFor('yok')).toBe(specFor(DEFAULT_FORM));
    expect(formById('yok').id).toBe('standart');
    for (const f of FORMS) { expect(f.aciklama.length).toBeGreaterThan(60); expect(f.ad.toLowerCase()).not.toContain('altum'); }
    expect(formById('halfmoon').dogrulanmali).toBe(true);
  });
  it('veil standarttan ölçülebilir biçimde büyüktür: daha yüksek sırt, daha alçak anal, daha uzun kuyruk ve iplik; süper veil daha da', () => {
    const s = ext('standart'), v = ext('veil'), sv = ext('super-veil');
    expect(v.top).toBeGreaterThan(s.top + 0.2); expect(v.bot).toBeLessThan(s.bot - 0.2);
    expect(v.tail).toBeGreaterThan(s.tail + 0.25); expect(v.fil).toBeLessThan(s.fil - 0.3);
    expect(sv.top).toBeGreaterThan(v.top); expect(sv.tail).toBeGreaterThan(v.tail); expect(sv.fil).toBeLessThan(v.fil);
  });
  it('halfmoon: kuyruk standarttan geniş ve dışbükey (orta uç köşelerden dışarıda); veilden kısa', () => {
    const h = specFor('halfmoon').fins[2].edge;
    const mid = h.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), h[0]);
    expect(mid[0]).toBeGreaterThanOrEqual(Math.max(...h.map((p) => p[0])) - 0.02);
    expect(Math.max(...h.map((p) => p[1]))).toBeGreaterThan(Math.max(...specFor('standart').fins[2].edge.map((p) => p[1])) * 1.5);
    expect(ext('halfmoon').tail).toBeLessThan(ext('veil').tail);
  });
  it('gövde ve göz her formda aynı; atlas tüm yüzgeçleri kapsar; noktalar sonlu; bağlantı noktaları forma uyar', () => {
    for (const id of FORM_IDS) {
      const sp = specFor(id);
      expect(sp.body).toBe(SPEC.body); expect(sp.eye).toEqual(SPEC.eye);
      for (const f of sp.fins) for (const p of [...f.base, ...f.edge]) {
        expect(finite(p)).toBe(true);
        expect(p[0]).toBeGreaterThanOrEqual(sp.atlas.x0); expect(p[0]).toBeLessThanOrEqual(sp.atlas.x1);
        expect(p[1]).toBeGreaterThanOrEqual(sp.atlas.y0); expect(p[1]).toBeLessThanOrEqual(sp.atlas.y1);
      }
      for (const f of sp.fins) expect(f.base).toHaveLength(f.edge.length);
    }
    expect(partAnchors('veil')['kuyruk-yuzgeci'].pos[0]).toBeGreaterThan(partAnchors('standart')['kuyruk-yuzgeci'].pos[0] + 0.1);
    expect(partAnchors('super-veil')['sirt-yuzgeci'].pos[1]).toBeGreaterThan(partAnchors('standart')['sirt-yuzgeci'].pos[1]);
    expect(partsFor('disi', 'veil')).toBe(PARTS);
  });
  it('SpeciesModule.forms ve renk/forma bağımsız dokuma (her form × renk sahte canvasta boyanır)', async () => {
    expect(species.forms).toBe(FORMS);
    const ctx: any = new Proxy({}, { get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => {}), set: (t: any, k, val) => { t[k] = val; return true; } });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintAtlas } = await import('../akvaryum/yanal-texture');
      for (const id of FORM_IDS) for (const v of [VARIANTS[0], VARIANTS[10], VARIANTS[11]]) {
        const t = paintAtlas(specFor(id), v, 128);
        expect(t.map.width).toBe(128); expect(t.map.height).toBeGreaterThan(100);
      }
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('parçalar', () => {
  it('benzersiz kimlik; bağlantı noktaları tam; görünümler geçerli; her açıklama dolu', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const an = partAnchors();
    const vids = VIEWS.map((v) => v.id);
    for (const p of PARTS) {
      expect(an[p.id], p.id).toBeTruthy();
      expect(finite(an[p.id].pos)).toBe(true);
      expect(vids).toContain(p.view);
      expect(p.aciklama.length).toBeGreaterThan(80);
      expect(p.ozet.length).toBeGreaterThan(10);
    }
    expect(Object.keys(an).sort()).toEqual([...ids].sort());
  });
  it('anatomi: göz, ağız, solungaç kapağı, sırt/anal/göğüs/kuyruk yüzgeci, pelvik iplik ve şeritler var; cinsiyete göre değişmez', () => {
    const ids = PARTS.map((p) => p.id);
    for (const id of ['goz', 'agiz', 'solungac-kapagi', 'sirt-yuzgeci', 'anal-yuzgec', 'pelvik-iplik', 'gogus-yuzgeci', 'kuyruk-yuzgeci', 'seritler']) expect(ids).toContain(id);
    expect(partsFor('erkek')).toEqual(partsFor('disi'));
    expect(PARTS.some((p) => p.sex)).toBe(false);
  });
  it('yan yüzey noktalarının normali +z; orta hat/yüzgeç noktaları normalsiz', () => {
    const an = partAnchors();
    expect(an.goz.normal![2]).toBeGreaterThan(0.5);
    expect(an.agiz.normal).toBeNull();
    expect(an['sirt-yuzgeci'].normal).toBeNull();
  });
});

describe('varyeteler', () => {
  it('kimlik/ad benzersiz; gruplar geçerli; tüm renkler geçerli; konumlar 0..1; veil yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(VARIANTS.map((v) => v.ad)).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(12);
    for (const v of VARIANTS) {
      expect(v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      const hex = [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik, ...v.katmanlar.flatMap((l) => ('renk' in l ? [l.renk] : []))];
      for (const h of hex) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      for (const l of v.katmanlar) {
        if (l.t === 'bar') { expect(l.nx).toBeGreaterThanOrEqual(0); expect(l.nx).toBeLessThanOrEqual(1); }
        else if ('nx' in l) { expect(l.nx[0]).toBeLessThanOrEqual(l.nx[1]); expect(l.ny[1]).toBeLessThanOrEqual(1); }
      }
      expect(`${v.ad} ${v.aciklama}`).not.toMatch(/veil\)?\s*:|peçe\s*:/i);
      expect(v.aciklama.length).toBeGreaterThan(40);
    }
    expect(VARIANTS.some((v) => /peçe|veil/i.test(v.id))).toBe(false);
  });
  it('istenen varyeteler mevcut; belirsiz adlar "doğrulanmalı"; yabani tip doğrulanmalı değil; albinoda kırmızı göz', () => {
    for (const id of ['gumus', 'koi', 'mermer', 'siyah', 'altin', 'zebra', 'albino', 'platin', 'mavi']) expect(VARIANTS.map((v) => v.id)).toContain(id);
    for (const id of ['hayalet', 'pembe-yanak', 'panda', 'siyah-dantel']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(variantById('gumus').dogrulanmali).toBe(false);
    expect(variantById('albino').goz.iris).not.toBe(variantById('gumus').goz.iris);
    expect(variantById('inci-pul').inci).toBe(true);
  });
  it('gruplama ve bilinmeyen kimlik davranışı; ilk varyete gümüş', () => {
    const g = groupedVariants();
    expect(g.flatMap((x) => x.items).length).toBe(VARIANTS.length);
    for (const x of g) expect(x.items.length).toBeGreaterThan(0);
    expect(variantById('yok').id).toBe('gumus');
    expect(VARIANTS[0].id).toBe('gumus');
  });
  it('tüm varyeteler dokuyu hatasız boyar (sahte canvas)', async () => {
    const calls = { n: 0 };
    const ctx: any = new Proxy({}, {
      get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
      set: (t: any, k, val) => { t[k] = val; return true; },
    });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintMelek } = await import('./texture');
      for (const v of VARIANTS) {
        const t = paintMelek(v, 256);
        expect(t.map.width, v.id).toBe(256);
        expect(t.map.height).toBeGreaterThan(256);
      }
      expect(calls.n).toBeGreaterThan(5000);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('tür sözleşmesi (SpeciesModule)', () => {
  it('kimlik, tek ve dürüst cinsiyet seçeneği, görünümler, şematik notu, createViewer', () => {
    expect(species.id).toBe('melek');
    expect(species.latin).toBe('Pterophyllum scalare');
    expect(species.sexes).toHaveLength(1);
    expect(species.sexes[0].ad).toMatch(/Ayrım yok/);
    expect(species.sexes[0].not).toMatch(/güvenilir/);
    expect(species.views.map((v) => v.id)).toEqual(VIEWS.map((v) => v.id));
    expect(species.not).toMatch(/Şematik|şematik/);
    expect(species.parts).toBe(PARTS);
    expect(species.partsFor('erkek')).toEqual(PARTS);
    expect(species.variants).toHaveLength(VARIANTS.length);
    expect(typeof species.createViewer).toBe('function');
  });
});

describe('SVG yedeği için siluet', () => {
  it('sonlu noktalar; üç yüzgeç, bir iplik; göz gövde içinde', () => {
    const s = silhouette(SPEC);
    for (const poly of [s.body, ...s.fins, s.pectoral, ...s.filaments, s.mouth, s.gill]) { expect(poly.length).toBeGreaterThan(2); expect(poly.every((p) => finite(p))).toBe(true); }
    expect(s.fins).toHaveLength(3); expect(s.filaments).toHaveLength(1);
    expect(s.eye.x).toBeGreaterThan(s.bbox.x0); expect(s.eye.x).toBeLessThan(s.bbox.x1);
    for (const poly of [s.body, ...s.fins]) for (const p of poly) { expect(p[0]).toBeGreaterThanOrEqual(s.bbox.x0 - 1e-6); expect(p[0]).toBeLessThanOrEqual(s.bbox.x1 + 1e-6); expect(p[1]).toBeGreaterThanOrEqual(s.bbox.y0 - 1e-6); expect(p[1]).toBeLessThanOrEqual(s.bbox.y1 + 1e-6); }
  });
});
