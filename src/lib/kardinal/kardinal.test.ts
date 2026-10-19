import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM, FORM_IDS, SEXES, bodyFns, hexToRgb, silhouette, specFor, outline } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { FORMS, formById } from './forms';
import { STRIPES, BLUE, RED } from './paint';
import { VARIANTS, VARIANT_GROUPS, femaleOf, groupedVariants, variantById } from './variants';
import { species } from './index';
import { PARTS as NEON_PARTS } from '../neon/parts';
import { bodyFor as zebraBody } from '../zebradanio/model';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const ext = (form: string, i: number) => { const f = specFor(form, 'erkek').fins[i]; return { h: Math.max(...f.edge.map((p, k) => Math.abs(p[1] - f.base[k][1]))), x: Math.max(...f.edge.map((p) => p[0])) }; };
const ratio = (sx: 'erkek' | 'disi') => { const sp = specFor('standart', sx), f = bodyFns(sp.body); let h = 0; for (let t = 0; t <= 1; t += 0.01) h = Math.max(h, f.top(t) - f.bot(t)); return h / (sp.body.xe - sp.body.xs); };

describe('kardinal tetra geometrisi', () => {
  it('gövde yanlardan basık torpido; zebra daniodan daha derin; burun kapalı', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx), f = bodyFns(sp.body);
      let h = 0, w = 0, tPeak = 0, yPeak = -1;
      for (let t = 0; t <= 1; t += 0.01) { h = Math.max(h, f.top(t) - f.bot(t)); w = Math.max(w, 2 * f.w(t)); if (f.top(t) > yPeak) { yPeak = f.top(t); tPeak = t; } }
      expect(w / h).toBeLessThan(0.65);
      expect(tPeak).toBeGreaterThan(0.25); expect(tPeak).toBeLessThan(0.65);
      expect(f.top(0)).toBeCloseTo(f.bot(0), 1);
      for (const p of outline(sp.body, 40)) expect(finite(p)).toBe(true);
    }
    const zf = bodyFns(zebraBody('erkek')); let zh = 0; for (let t = 0; t <= 1; t += 0.01) zh = Math.max(zh, zf.top(t) - zf.bot(t));
    expect(ratio('erkek')).toBeGreaterThan(zh / 0.92);
    expect(ratio('erkek')).toBeGreaterThan(0.23); expect(ratio('erkek')).toBeLessThan(0.3);
  });
  it('dişide karın erkekten dolgun', () => {
    expect(ratio('disi')).toBeGreaterThan(ratio('erkek') + 0.02);
  });
  it('bıyık yok; tek karın yüzgeci ipliği; iri göz; dudaklı terminal ağız; yağ yüzgeci dördüncü yüzgeç', () => {
    const sp = specFor();
    expect(sp.filaments).toHaveLength(1);
    expect(sp.lateral).toHaveLength(0);
    expect(sp.mouthGeom).toBeTruthy();
    expect(sp.mouthGeom!.lip).toBeGreaterThan(0.003);
    expect(sp.eye.r).toBeGreaterThanOrEqual(0.038);
    expect(sp.fins.map((f) => f.id)).toEqual(['sirt', 'anal', 'kuyruk', 'yag']);
    const adip = sp.fins[3], c = sp.fins[2];
    expect(adip.base[0][0]).toBeGreaterThan(sp.fins[0].base[0][0]); // sırttan geride
    expect(adip.base[adip.base.length - 1][0]).toBeLessThan(c.base[0][0]);
    expect(Math.max(...adip.edge.map((p, i) => p[1] - adip.base[i][1]))).toBeLessThan(0.06); // küçük
  });
  it('kuyruk çatallı (ortada çentik)', () => {
    const c = specFor('standart', 'erkek').fins[2].edge;
    const mid = c.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), c[0]);
    expect(mid[0]).toBeLessThan(Math.max(...c.map((p) => p[0])) - 0.05);
  });
  it('atlas tüm yüzgeçleri kapsar; noktalar sonlu; önbellek; her form × cinsiyet', () => {
    for (const f of FORM_IDS) for (const sx of SEXES) {
      const sp = specFor(f, sx);
      for (const fin of sp.fins) { expect(fin.base).toHaveLength(fin.edge.length); for (const p of [...fin.base, ...fin.edge]) { expect(finite(p)).toBe(true); expect(p[0]).toBeGreaterThanOrEqual(sp.atlas.x0); expect(p[0]).toBeLessThanOrEqual(sp.atlas.x1); expect(p[1]).toBeGreaterThanOrEqual(sp.atlas.y0); expect(p[1]).toBeLessThanOrEqual(sp.atlas.y1); } }
      expect(specFor(f, sx)).toBe(sp);
    }
    expect(specFor('yok')).toBe(specFor(DEFAULT_FORM, 'erkek'));
  });
});

describe('desen: kırmızı tam boy, mavi üstte', () => {
  it('kırmızı şerit gövdenin tamamı boyunca (solungaç kapağından kuyruk köküne), neondan farklı olarak yalnızca arka yarı değil', () => {
    expect(RED.t0).toBeLessThan(0.3);
    expect(RED.t1).toBeGreaterThanOrEqual(0.95);
    expect(RED.t1 - RED.t0).toBeGreaterThan(0.7); // neonda yalnızca ~0,5
  });
  it('mavi şerit kırmızının ÜSTÜNDE ve yağ yüzgecine dek sürer', () => {
    expect(BLUE.ny).toBeLessThan(RED.ny);
    const sp = specFor();
    const xAdip = sp.fins[3].base[0][0], b = sp.body;
    const tAdip = (xAdip - b.xs) / (b.xe - b.xs);
    expect(BLUE.t1).toBeGreaterThan(tAdip - 0.02);
    expect(BLUE.t1).toBeLessThanOrEqual(0.95);
  });
  it('neon parçaları kardinal ile ayrımı anar', () => {
    const red = NEON_PARTS.find((p) => p.id === 'kirmizi-bolge')!;
    expect(red.aciklama).toMatch(/[Kk]ardinal/);
  });
});

describe('form (şekil)', () => {
  it('standart ve uzun yüzgeçli; ilki standart; açıklamalar dürüst', () => {
    expect(FORM_IDS).toEqual(['standart', 'uzun-yuzgec']);
    expect(FORMS.map((f) => f.id)).toEqual(FORM_IDS);
    expect(species.forms).toBe(FORMS);
    expect(formById('yok').id).toBe('standart');
    expect(FORMS[1].dogrulanmali).toBe(true);
    expect(FORMS[1].aciklama).toMatch(/doğrulanmalı/);
    expect(species.not).toMatch(/form/);
  });
  it('uzun yüzgeçli form: sırt, anal, kuyruk, yağ ve karın yüzgeçleri ölçülebilir uzun; gövde aynı', () => {
    for (const i of [0, 1, 2]) expect(ext('uzun-yuzgec', i).h, `yüzgeç ${i}`).toBeGreaterThan(ext('standart', i).h * 1.3);
    expect(ext('uzun-yuzgec', 3).h).toBeGreaterThan(ext('standart', 3).h);
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
  it('iki cinsiyette de 13 parça; anahtar anatomi; kırmızı şerit tam boy ve neonla farkı anlatılır', () => {
    expect(partsFor('erkek')).toHaveLength(13); expect(partsFor('disi')).toHaveLength(13);
    const ids = PARTS.map((p) => p.id);
    for (const id of ['agiz', 'goz', 'mavi-serit', 'kirmizi-serit', 'yag-yuzgeci', 'sirt-yuzgeci', 'anal-yuzgec', 'karin-yuzgeci', 'kuyruk-yuzgeci', 'kuyruk-sapi']) expect(ids).toContain(id);
    const k = PARTS.find((p) => p.id === 'kirmizi-serit')!;
    expect(k.dogrulanmali).toBe(true); expect(k.aciklama).toMatch(/neon/i); expect(k.aciklama).toMatch(/tüm/i);
    expect(PARTS.find((p) => p.id === 'agiz')!.aciklama).toMatch(/bıyık yoktur/);
  });
});

describe('varyeteler', () => {
  it('kimlik/ad benzersiz; geçerli renkler; gruplar; belirsiz adlar doğrulanmalı; boyalı/floresan yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik, ...v.katmanlar.flatMap((l) => ('renk' in l ? [l.renk] : []))]) expect(() => hexToRgb(h)).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(40);
      expect(`${v.ad} ${v.aciklama}`).not.toMatch(/glofish|floresan renk|neon pembe|boyalı balık/i);
    }
    expect(ids).toEqual(['normal', 'diamond', 'gold', 'albino']);
    for (const id of ['diamond', 'gold', 'albino']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(variantById('normal').dogrulanmali).toBe(false);
    expect(variantById('yok').id).toBe('normal');
    expect(groupedVariants().flatMap((g) => g.items)).toHaveLength(VARIANTS.length);
  });
  it('şerit stili her renkte tanımlı; normalde mavi–turkuaz ve kırmızı; altın/albinoda mavi soluk; diamond pırıltılı', () => {
    for (const v of VARIANTS) expect(STRIPES[v.id], v.id).toBeTruthy();
    const [r, g, b] = hexToRgb(STRIPES.normal.blue[1]); expect(b).toBeGreaterThan(r); expect(g).toBeGreaterThan(r);
    const [rr, rg, rb] = hexToRgb(STRIPES.normal.red); expect(rr).toBeGreaterThan(rg + 0.5); expect(rr).toBeGreaterThan(rb + 0.5);
    expect(STRIPES.gold.blueA).toBeLessThan(STRIPES.normal.blueA);
    expect(STRIPES.albino.blueA).toBeLessThan(STRIPES.gold.blueA);
    expect(STRIPES.diamond.sparkle).toBeGreaterThan(STRIPES.normal.sparkle + 0.5);
    const v = variantById('normal'), f = femaleOf(v);
    expect(f.id).toBe(v.id); expect(variantById('normal', 'disi').govde).toEqual(f.govde); expect(variantById('normal', 'erkek')).toBe(v);
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
    expect(species.id).toBe('kardinal');
    expect(species.latin).toBe('Paracheirodon axelrodi');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/Şematik/); expect(species.not).toMatch(/neon/);
    expect(species.views.map((v) => v.id)).toEqual(VIEWS.map((v) => v.id));
    expect(species.variants).toHaveLength(VARIANTS.length);
    for (const f of FORMS) for (const v of VARIANTS) for (const s of SEXES) {
      const sp = specFor(f.id, s), an = partAnchors(f.id, s);
      expect(sp.fins).toHaveLength(4); expect(Object.keys(an)).toHaveLength(PARTS.length);
      expect(variantById(v.id, s).id).toBe(v.id);
    }
    expect(typeof species.createViewer).toBe('function');
    expect(typeof species.createFishGroup).toBe('function');
  });
  it('SVG siluet: sonlu, dört yüzgeç, her form ve cinsiyet', () => {
    for (const f of FORM_IDS) for (const s of SEXES) { const sil = silhouette(specFor(f, s)); expect(sil.fins).toHaveLength(4); for (const p of [...sil.body, ...sil.fins.flat()]) expect(finite(p)).toBe(true); }
  });
});
