import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM, FORM_IDS, SEXES, bodyFns, hexToRgb, silhouette, specFor, outline } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { FORMS, formById } from './forms';
import { STRIPES, STRIPE_NY } from './paint';
import { VARIANTS, VARIANT_GROUPS, femaleOf, groupedVariants, variantById } from './variants';
import { species } from './index';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const ext = (form: string, i: number) => { const f = specFor(form, 'erkek').fins[i]; return { h: Math.max(...f.edge.map((p, k) => Math.abs(p[1] - f.base[k][1]))), x: Math.max(...f.edge.map((p) => p[0])) }; };

describe('zebra danio geometrisi', () => {
  it('gövde ince ve mekik biçimli; burun kapalı', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx), f = bodyFns(sp.body), L = sp.body.xe - sp.body.xs;
      let h = 0, w = 0, tPeak = 0, yPeak = -1;
      for (let t = 0; t <= 1; t += 0.01) { h = Math.max(h, f.top(t) - f.bot(t)); w = Math.max(w, 2 * f.w(t)); if (f.top(t) > yPeak) { yPeak = f.top(t); tPeak = t; } }
      expect(h / L).toBeGreaterThan(0.18); expect(h / L).toBeLessThan(0.28); // ince, mekik biçimli (kaplan barb ~0,42)
      expect(w / h).toBeLessThan(0.65);
      expect(tPeak).toBeGreaterThan(0.25); expect(tPeak).toBeLessThan(0.6);
      expect(f.top(0)).toBeCloseTo(f.bot(0), 1);
      for (const p of outline(sp.body, 40)) expect(finite(p)).toBe(true);
    }
  });
  it('dişide karın erkekten dolgun', () => {
    const belly = (s: 'erkek' | 'disi') => { const f = bodyFns(specFor('standart', s).body); return f.top(0.5) - f.bot(0.5); };
    expect(belly('disi')).toBeGreaterThan(belly('erkek') + 0.02);
  });
  it('iki çift bıyık (küçük, ince) + karın yüzgeci; yan çizgi çizilmez; yukarı bakan dudaklı ağız', () => {
    const sp = specFor();
    expect(sp.filaments).toHaveLength(3); // karın yüzgeci + rostral + maksiller bıyık (her biri iki yanda)
    for (const f of sp.filaments.slice(1)) {
      const p = f.path, len = Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]);
      expect(len).toBeLessThan(0.07); expect(len).toBeGreaterThan(0.02);
      expect(Math.max(...f.radii)).toBeLessThan(0.006);
      expect(p[0][1]).toBeGreaterThan(p[p.length - 1][1]); // yukarıdan aşağıya (doku eşlemesi için)
    }
    expect(sp.lateral).toHaveLength(0);
    expect(sp.mouthGeom).toBeTruthy();
    expect(sp.mouthGeom!.dir[1]).toBeGreaterThan(0.4); // yukarı bakar
    expect(sp.mouthGeom!.lip).toBeGreaterThan(0.003);
    expect(sp.eye.r).toBeGreaterThan(0.028);
  });
  it('sırt yüzgeci küçük ve gövdenin arka yarısında; anal yüzgeç uzun tabanlı', () => {
    const sp = specFor(), d = sp.fins[0], a = sp.fins[1], xs = sp.body.xs, L = sp.body.xe - xs;
    expect((d.base[0][0] - xs) / L).toBeGreaterThan(0.48);
    const span = (f: typeof d) => f.base[f.base.length - 1][0] - f.base[0][0];
    expect(span(a)).toBeGreaterThan(span(d));
    expect(Math.max(...d.edge.map((p, i) => p[1] - d.base[i][1]))).toBeLessThan(0.1);
  });
  it('kuyruk çatallı (ortada çentik)', () => {
    const sp = specFor('standart', 'erkek'), c = sp.fins[2].edge;
    const mid = c.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), c[0]);
    expect(mid[0]).toBeLessThan(Math.max(...c.map((p) => p[0])) - 0.05);
  });
  it('atlas tüm yüzgeçleri kapsar; noktalar sonlu; önbellek; her form × cinsiyet', () => {
    for (const f of FORM_IDS) for (const sx of SEXES) {
      const sp = specFor(f, sx);
      for (const fin of sp.fins) { expect(fin.base).toHaveLength(fin.edge.length); for (const p of [...fin.base, ...fin.edge]) { expect(finite(p)).toBe(true); expect(p[0]).toBeGreaterThanOrEqual(sp.atlas.x0); expect(p[0]).toBeLessThanOrEqual(sp.atlas.x1); expect(p[1]).toBeGreaterThanOrEqual(sp.atlas.y0); expect(p[1]).toBeLessThanOrEqual(sp.atlas.y1); } }
      for (const fl of sp.filaments) for (const p of fl.path) { expect(p[0]).toBeGreaterThanOrEqual(sp.atlas.x0); expect(p[0]).toBeLessThanOrEqual(sp.atlas.x1); expect(p[1]).toBeGreaterThanOrEqual(sp.atlas.y0); }
      expect(specFor(f, sx)).toBe(sp);
    }
    expect(specFor('yok')).toBe(specFor(DEFAULT_FORM, 'erkek'));
  });
});

describe('form (şekil)', () => {
  it('standart ve uzun yüzgeçli; ilki standart; açıklamalar dürüst', () => {
    expect(FORM_IDS).toEqual(['standart', 'uzun-yuzgec']);
    expect(FORMS.map((f) => f.id)).toEqual(FORM_IDS);
    expect(species.forms).toBe(FORMS);
    expect(formById('yok').id).toBe('standart');
    expect(FORMS[1].aciklama).toMatch(/satıcıya göre/);
    expect(species.not).toMatch(/form|Ticari/);
  });
  it('uzun yüzgeçli form: sırt, anal, kuyruk ve karın yüzgeçleri ölçülebilir uzun; gövde aynı', () => {
    for (const i of [0, 1, 2]) {
      const a = ext('standart', i), b = ext('uzun-yuzgec', i);
      expect(b.h, `yüzgeç ${i} yükseklik`).toBeGreaterThan(a.h * 1.3);
    }
    expect(ext('uzun-yuzgec', 2).x).toBeGreaterThan(ext('standart', 2).x + 0.05);
    const pel = (f: string) => { const p = specFor(f).filaments[0].path; return Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]); };
    expect(pel('uzun-yuzgec')).toBeGreaterThan(pel('standart') * 1.4);
    expect(specFor('uzun-yuzgec').body).toBe(specFor('standart').body);
    expect(specFor('uzun-yuzgec').atlas.x1).toBeGreaterThan(specFor('standart').atlas.x1);
  });
  it('parça özeti forma göre değişir; bağlantı noktaları yeni geometriyi izler', () => {
    expect(partsFor('erkek', 'uzun-yuzgec').find((p) => p.id === 'sirt-yuzgeci')!.ozet).toMatch(/Uzun yüzgeçli/);
    expect(partsFor('erkek', 'standart').find((p) => p.id === 'sirt-yuzgeci')!.ozet).not.toMatch(/Uzun yüzgeçli/);
    expect(partAnchors('uzun-yuzgec')['kuyruk-yuzgeci'].pos[0]).toBeGreaterThan(partAnchors('standart')['kuyruk-yuzgeci'].pos[0] + 0.01);
    expect(partAnchors('uzun-yuzgec')['sirt-yuzgeci'].pos[1]).toBeGreaterThan(partAnchors('standart')['sirt-yuzgeci'].pos[1]);
  });
});

describe('parçalar', () => {
  it('benzersiz kimlik; bağlantı noktaları tam ve sonlu; görünümler geçerli', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FORM_IDS) for (const sx of SEXES) {
      const an = partAnchors(f, sx);
      expect(Object.keys(an).sort()).toEqual([...ids].sort());
      for (const p of PARTS) { expect(finite(an[p.id].pos), p.id).toBe(true); expect(VIEWS.map((v) => v.id)).toContain(p.view); expect(p.aciklama.length).toBeGreaterThan(60); }
    }
    expect(VIEWS.map((v) => v.id)).toEqual(['yan', 'ust', 'on', 'arka', 'alt', 'capraz']);
  });
  it('iki cinsiyette de 12 parça; anahtar anatomi var; bıyık doğrulanmalı ve dürüst', () => {
    expect(partsFor('erkek')).toHaveLength(12); expect(partsFor('disi')).toHaveLength(12);
    const ids = PARTS.map((p) => p.id);
    for (const id of ['agiz', 'biyik', 'goz', 'seritler', 'sirt-yuzgeci', 'anal-yuzgec', 'karin-yuzgeci', 'kuyruk-yuzgeci', 'kuyruk-sapi']) expect(ids).toContain(id);
    const bk = PARTS.find((p) => p.id === 'biyik')!;
    expect(bk.dogrulanmali).toBe(true); expect(bk.aciklama).toMatch(/küçük/); expect(bk.aciklama).toMatch(/iki çift/);
    expect(PARTS.find((p) => p.id === 'seritler')!.aciklama).toMatch(/kuyruk yüzgecinin içine/);
  });
});

describe('varyeteler', () => {
  it('kimlik/ad benzersiz; geçerli renkler; gruplar; belirsiz adlar doğrulanmalı; floresan yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik, ...v.katmanlar.flatMap((l) => ('renk' in l ? [l.renk] : []))]) expect(() => hexToRgb(h)).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(40);
      expect(`${v.ad} ${v.aciklama}`).not.toMatch(/glofish|floresan renk|neon pembe/i);
    }
    for (const id of ['normal', 'leopar', 'hibrit', 'altin', 'albino']) expect(ids).toContain(id);
    for (const id of ['hibrit', 'albino']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(variantById('normal').dogrulanmali).toBe(false);
    expect(variantById('yok').id).toBe('normal');
    expect(groupedVariants().flatMap((g) => g.items)).toHaveLength(VARIANTS.length);
  });
  it('çizgi/benek stili her renkte tanımlı; normalde beş koyu mavi çizgi, leoparda benek; dişi çizgi arası daha gümüşi', () => {
    for (const v of VARIANTS) expect(STRIPES[v.id], v.id).toBeTruthy();
    expect(STRIPE_NY).toHaveLength(5);
    expect(STRIPES.normal.mode).toBe('stripes'); expect(STRIPES.leopar.mode).toBe('spots'); expect(STRIPES.hibrit.mode).toBe('broken');
    const [r, g, b] = hexToRgb(STRIPES.normal.c); expect(b).toBeGreaterThan(r); expect(b).toBeGreaterThan(g);
    const v = variantById('normal'), f = femaleOf(v);
    expect(f.id).toBe(v.id); expect(variantById('normal', 'disi').govde).toEqual(f.govde); expect(variantById('normal', 'erkek')).toBe(v);
    const sat = (hex: string) => { const c = hexToRgb(hex); return Math.max(...c) - Math.min(...c); };
    expect(sat(f.govde.orta)).toBeLessThan(sat(v.govde.orta));
  });
  it('tüm form × varyete × cinsiyet dokuyu hatasız boyar (sahte canvas)', async () => {
    const ctx: any = new Proxy({}, { get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => {}), set: (t: any, k, val) => { t[k] = val; return true; } });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintAtlas } = await import('../akvaryum/yanal-texture');
      for (const f of FORM_IDS) for (const sx of SEXES) for (const v of VARIANTS) {
        const t = paintAtlas(specFor(f, sx), variantById(v.id, sx), 128);
        expect(t.map.width).toBe(128); expect(t.map.height).toBeGreaterThan(40);
      }
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('tür sözleşmesi (SpeciesModule)', () => {
  it('kimlik, iki cinsiyet, görünümler, şematik notu; her form × renk × cinsiyet kurulabilir', () => {
    expect(species.id).toBe('zebradanio');
    expect(species.latin).toBe('Danio rerio');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/Şematik/); expect(species.not).toMatch(/bıyık/);
    expect(species.views.map((v) => v.id)).toEqual(VIEWS.map((v) => v.id));
    expect(species.variants).toHaveLength(VARIANTS.length);
    for (const f of FORMS) for (const v of VARIANTS) for (const s of SEXES) {
      const sp = specFor(f.id, s), an = partAnchors(f.id, s);
      expect(sp.fins).toHaveLength(3); expect(Object.keys(an)).toHaveLength(PARTS.length);
      expect(variantById(v.id, s).id).toBe(v.id);
    }
    expect(typeof species.createViewer).toBe('function');
    expect(typeof species.createFishGroup).toBe('function');
  });
  it('SVG siluet: sonlu, üç yüzgeç, her form ve cinsiyet', () => {
    for (const f of FORM_IDS) for (const s of SEXES) { const sil = silhouette(specFor(f, s)); expect(sil.fins).toHaveLength(3); for (const p of [...sil.body, ...sil.fins.flat()]) expect(finite(p)).toBe(true); }
  });
});
