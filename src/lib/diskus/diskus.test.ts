import { describe, expect, it, vi } from 'vitest';
import { FINS, SPEC, bodyFns, hexToRgb, outline, silhouette, tOfX, xOfT } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, variantById } from './variants';
import { species } from './index';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

describe('diskus geometrisi', () => {
  it('gövde yaklaşık dairesel (yükseklik/uzunluk 0,85–1,1) ve yanlardan basık (kalınlık yüksekliğin yarısından az)', () => {
    const f = bodyFns(SPEC.body);
    const L = SPEC.body.xe - SPEC.body.xs;
    let hMax = 0, wMax = 0;
    for (let t = 0; t <= 1; t += 0.01) { hMax = Math.max(hMax, f.top(t) - f.bot(t)); wMax = Math.max(wMax, 2 * f.w(t)); }
    expect(hMax / L).toBeGreaterThan(0.85);
    expect(hMax / L).toBeLessThan(1.1);
    expect(wMax / hMax).toBeLessThan(0.5);
    expect(f.top(0)).toBeCloseTo(f.bot(0), 6); // burun kapalı
  });
  it('sırt ve anal yüzgeç kısa ve uzun tabanlı: gövdeden en çok %45 taşar; tabanları gövde kenarında; kuyruk yüzgeci küçük', () => {
    const [d, a, c] = FINS;
    const f = bodyFns(SPEC.body);
    const bodyH = Math.max(...[...Array(101).keys()].map((i) => f.top(i / 100))) * 2;
    expect(Math.max(...d.edge.map((p) => p[1])) - Math.max(...d.base.map((p) => p[1]))).toBeLessThan(0.45 * bodyH);
    expect(Math.min(...a.base.map((p) => p[1])) - Math.min(...a.edge.map((p) => p[1]))).toBeLessThan(0.45 * bodyH);
    expect(d.base[d.base.length - 1][0] - d.base[0][0]).toBeGreaterThan(0.5); // uzun taban
    expect(d.base).toHaveLength(d.edge.length);
    expect(Math.max(...c.edge.map((p) => p[0])) - SPEC.body.xe).toBeLessThan(0.25);
    expect(Math.max(...c.edge.map((p) => p[1])) * 2).toBeLessThan(0.4 * bodyH);
  });
  it('pelvik yüzgeç kısa (gövde yüksekliğinin %15’inden az sarkar); tüm noktalar sonlu', () => {
    const fil = SPEC.filaments[0];
    const f = bodyFns(SPEC.body);
    const belly = f.bot(tOfX(SPEC.body, fil.path[0][0]));
    expect(belly - fil.path[fil.path.length - 1][1]).toBeLessThan(0.2);
    for (const fn of FINS) for (const p of [...fn.base, ...fn.edge]) expect(finite(p)).toBe(true);
    for (const p of outline(SPEC.body, 40)) expect(finite(p)).toBe(true);
  });
  it('göz iri (gövde yüksekliğinin %8’inden fazla) ve başta; ağız burun ucunda', () => {
    const f = bodyFns(SPEC.body);
    expect(SPEC.eye.r * 2).toBeGreaterThan(0.08 * (Math.max(...[...Array(101).keys()].map((i) => f.top(i / 100))) * 2));
    expect(SPEC.eye.x).toBeLessThan(xOfT(SPEC.body, 0.25));
    expect(SPEC.mouth[0][0]).toBeCloseTo(SPEC.body.xs, 1);
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
    for (const id of ['goz', 'agiz', 'solungac-kapagi', 'sirt-yuzgeci', 'anal-yuzgec', 'pelvik-yuzgec', 'gogus-yuzgeci', 'kuyruk-yuzgeci', 'seritler', 'deri-mukusu']) expect(ids).toContain(id);
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
    expect(ids.length).toBeGreaterThanOrEqual(14);
    for (const v of VARIANTS) {
      expect(v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      const hex = [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik, ...v.katmanlar.flatMap((l) => ('renk' in l ? [l.renk] : []))];
      for (const h of hex) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      for (const l of v.katmanlar) {
        if (l.t === 'bar') { expect(l.nx).toBeGreaterThanOrEqual(0); expect(l.nx).toBeLessThanOrEqual(1); }
        else if ('nx' in l) { expect(l.nx[0]).toBeLessThanOrEqual(l.nx[1]); expect(l.ny[1]).toBeLessThanOrEqual(1); }
      }
      expect(v.aciklama.length).toBeGreaterThan(40);
    }
  });
  it('istenen varyeteler mevcut; belirsiz adlar "doğrulanmalı"; yılan derisi hücre katmanı, leopar benek katmanı var; albinoda kırmızı göz', () => {
    for (const id of ['pigeon-blood', 'kirmizi-turkuaz', 'blue-diamond', 'yilan-derisi', 'albino', 'leopar', 'kobalt', 'panda']) expect(VARIANTS.map((v) => v.id)).toContain(id);
    for (const id of ['panda', 'beyaz', 'red-melon', 'royal-blue', 'heckel']) expect(variantById(id).dogrulanmali, id).toBe(true);
    for (const id of ['pigeon-blood', 'blue-diamond', 'kobalt', 'albino']) expect(variantById(id).dogrulanmali, id).toBe(false);
    expect(variantById('yilan-derisi').katmanlar.some((l) => l.t === 'cells')).toBe(true);
    expect(variantById('leopar').katmanlar.some((l) => l.t === 'spot')).toBe(true);
    expect(variantById('albino').goz.iris).not.toBe(variantById('kahverengi').goz.iris);
    // pigeon blood: bantlar bastırılmış (bar katmanı yok)
    expect(variantById('pigeon-blood').katmanlar.some((l) => l.t === 'bar')).toBe(false);
  });
  it('gruplama ve bilinmeyen kimlik davranışı; ilk varyete gümüş', () => {
    const g = groupedVariants();
    expect(g.flatMap((x) => x.items).length).toBe(VARIANTS.length);
    for (const x of g) expect(x.items.length).toBeGreaterThan(0);
    expect(variantById('yok').id).toBe('heckel');
    expect(VARIANTS[0].id).toBe('heckel');
  });
  it('tüm varyeteler dokuyu hatasız boyar (sahte canvas)', async () => {
    const calls = { n: 0 };
    const ctx: any = new Proxy({}, {
      get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
      set: (t: any, k, val) => { t[k] = val; return true; },
    });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintDiskus } = await import('./texture');
      for (const v of VARIANTS) {
        const t = paintDiskus(v, 256);
        expect(t.map.width, v.id).toBe(256);
        expect(t.map.height).toBeGreaterThan(256);
      }
      expect(calls.n).toBeGreaterThan(5000);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('tür sözleşmesi (SpeciesModule)', () => {
  it('kimlik, tek ve dürüst cinsiyet seçeneği, görünümler, şematik notu, createViewer', () => {
    expect(species.id).toBe('diskus');
    expect(species.latin).toMatch(/Symphysodon/);
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
  it('sonlu noktalar; üç yüzgeç, bir pelvik uç; göz gövde içinde', () => {
    const s = silhouette(SPEC);
    for (const poly of [s.body, ...s.fins, s.pectoral, ...s.filaments, s.mouth, s.gill]) { expect(poly.length).toBeGreaterThan(2); expect(poly.every((p) => finite(p))).toBe(true); }
    expect(s.fins).toHaveLength(3); expect(s.filaments).toHaveLength(1);
    expect(s.eye.x).toBeGreaterThan(s.bbox.x0); expect(s.eye.x).toBeLessThan(s.bbox.x1);
    for (const poly of [s.body, ...s.fins]) for (const p of poly) { expect(p[0]).toBeGreaterThanOrEqual(s.bbox.x0 - 1e-6); expect(p[0]).toBeLessThanOrEqual(s.bbox.x1 + 1e-6); expect(p[1]).toBeGreaterThanOrEqual(s.bbox.y0 - 1e-6); expect(p[1]).toBeLessThanOrEqual(s.bbox.y1 + 1e-6); }
  });
});
