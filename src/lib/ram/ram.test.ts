import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM, FORM_IDS, SEXES, bodyFns, hexToRgb, silhouette, specFor, outline } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { FORMS, formById } from './forms';
import { STYLES, SPOT, SPINY_S } from './paint';
import { VARIANTS, VARIANT_GROUPS, femaleOf, groupedVariants, variantById } from './variants';
import { species } from './index';
import { bodyFor as kardinalBody } from '../kardinal/model';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const hMax = (form: string, sx: 'erkek' | 'disi', i: number) => { const f = specFor(form, sx).fins[i]; return Math.max(...f.edge.map((p, k) => Math.abs(p[1] - f.base[k][1]))); };
const xMax = (form: string, i: number) => Math.max(...specFor(form, 'erkek').fins[i].edge.map((p) => p[0]));
const ratio = (form: string, sx: 'erkek' | 'disi') => { const sp = specFor(form, sx), f = bodyFns(sp.body); let h = 0; for (let t = 0; t <= 1; t += 0.01) h = Math.max(h, f.top(t) - f.bot(t)); return h / (sp.body.xe - sp.body.xs); };

describe('ram çiklit geometrisi', () => {
  it('gövde derin ama yanlardan basık; kardinal tetradan belirgin derin; burun kapalı', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx), f = bodyFns(sp.body);
      let h = 0, w = 0;
      for (let t = 0; t <= 1; t += 0.01) { h = Math.max(h, f.top(t) - f.bot(t)); w = Math.max(w, 2 * f.w(t)); }
      expect(w / h).toBeLessThan(0.5);
      expect(f.top(0)).toBeCloseTo(f.bot(0), 1);
      for (const p of outline(sp.body, 40)) expect(finite(p)).toBe(true);
    }
    const kf = bodyFns(kardinalBody('erkek')); let kh = 0; for (let t = 0; t <= 1; t += 0.01) kh = Math.max(kh, kf.top(t) - kf.bot(t));
    expect(ratio('standart', 'erkek')).toBeGreaterThan(kh / 0.92 + 0.08);
    expect(ratio('standart', 'erkek')).toBeGreaterThan(0.4); expect(ratio('standart', 'erkek')).toBeLessThan(0.52);
  });
  it('dişide karın erkekten dolgun', () => { expect(ratio('standart', 'disi')).toBeGreaterThan(ratio('standart', 'erkek')); });
  it('bıyık yok; tek karın iplik; iri göz; dudaklı ağız; üç yüzgeç (sırt, anal, kuyruk); kuyruk çatalsız yuvarlak', () => {
    const sp = specFor();
    expect(sp.filaments).toHaveLength(1);
    expect(sp.lateral).toHaveLength(0);
    expect(sp.mouthGeom!.lip).toBeGreaterThan(0.003);
    expect(sp.eye.r).toBeGreaterThanOrEqual(0.045);
    expect(sp.fins.map((f) => f.id)).toEqual(['sirt', 'anal', 'kuyruk']);
    const c = sp.fins[2].edge;
    const mid = c.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), c[0]);
    expect(mid[0]).toBeGreaterThan(Math.max(...c.map((p) => p[0])) - 0.02); // çentik yok
  });
  it('erkekte 2. sırt dikeni belirgin uzar; dişide sırt yüzgeci düz ve yuvarlak', () => {
    const d = (sx: 'erkek' | 'disi') => { const f = specFor('standart', sx).fins[0]; const hs = f.edge.map((p, i) => p[1] - f.base[i][1]); const peak = Math.max(...hs); return { peak, at: hs.indexOf(peak) / (hs.length - 1), tail: hs[hs.length - 6] }; };
    const m = d('erkek'), f = d('disi');
    expect(m.peak).toBeGreaterThan(f.peak * 1.6);
    expect(m.at).toBeLessThan(SPINY_S); // dikenli bölgede
    expect(f.peak).toBeLessThan(0.13);
    // erkek tepe noktası geriye süpürülür
    const fm = specFor('standart', 'erkek').fins[0], i = Math.round(m.at * (fm.base.length - 1));
    expect(fm.edge[i][0]).toBeGreaterThan(fm.base[i][0] + 0.04);
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

describe('form (şekil)', () => {
  it('standart, uzun yüzgeçli, balon; ilki standart; sınırlı güvenilirlik dürüstçe işaretli', () => {
    expect(FORM_IDS).toEqual(['standart', 'uzun-yuzgec', 'balon']);
    expect(FORMS.map((f) => f.id)).toEqual(FORM_IDS);
    expect(species.forms).toBe(FORMS);
    expect(formById('yok').id).toBe('standart');
    expect(FORMS[0].dogrulanmali).toBe(false);
    for (const f of FORMS.slice(1)) { expect(f.dogrulanmali).toBe(true); expect(f.aciklama).toMatch(/doğrulanmalı/); }
    expect(species.not).toMatch(/form/);
  });
  it('uzun yüzgeçli: sırt, anal, kuyruk ve karın yüzgeci ölçülebilir uzun; gövde aynı derinlikte', () => {
    for (const i of [0, 1, 2]) expect(hMax('uzun-yuzgec', 'erkek', i), `yüzgeç ${i}`).toBeGreaterThan(hMax('standart', 'erkek', i) * 1.25);
    expect(xMax('uzun-yuzgec', 2)).toBeGreaterThan(xMax('standart', 2) + 0.05);
    const pel = (f: string) => { const p = specFor(f).filaments[0].path; return Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]); };
    expect(pel('uzun-yuzgec')).toBeGreaterThan(pel('standart') * 1.3);
    expect(ratio('uzun-yuzgec', 'erkek')).toBeCloseTo(ratio('standart', 'erkek'), 5);
  });
  it('balon: gövde daha kısa ve çok daha yüksek (oran), kuyruk sapı geride değil; yüzgeçler gövdeye göre küçük', () => {
    const s = specFor('standart'), b = specFor('balon');
    expect(b.body.xe - b.body.xs).toBeLessThan(s.body.xe - s.body.xs - 0.05);
    expect(ratio('balon', 'erkek')).toBeGreaterThan(ratio('standart', 'erkek') * 1.35);
    expect(hMax('balon', 'erkek', 2)).toBeLessThan(hMax('standart', 'erkek', 2));
    expect(b.eye.y).toBeGreaterThan(s.eye.y);
  });
  it('parça özeti forma göre değişir; bağlantı noktaları yeni geometriyi izler; cinsiyete özgü parçalar', () => {
    expect(partsFor('erkek', 'uzun-yuzgec').find((p) => p.id === 'sirt-yuzgeci')!.ozet).toMatch(/Uzun yüzgeçli/);
    expect(partsFor('erkek', 'standart').find((p) => p.id === 'sirt-yuzgeci')!.ozet).not.toMatch(/Uzun yüzgeçli/);
    expect(partAnchors('uzun-yuzgec')['kuyruk-yuzgeci'].pos[0]).toBeGreaterThan(partAnchors('standart')['kuyruk-yuzgeci'].pos[0] + 0.01);
    expect(partAnchors('balon')['kuyruk-sapi'].pos[0]).toBeLessThan(partAnchors('standart')['kuyruk-sapi'].pos[0] - 0.03);
    expect(partAnchors('uzun-yuzgec')['ikinci-diken'].pos[1]).toBeGreaterThan(partAnchors('standart')['ikinci-diken'].pos[1]);
    expect(partsFor('erkek').some((p) => p.id === 'ikinci-diken')).toBe(true);
    expect(partsFor('erkek').some((p) => p.id === 'karin-lekesi')).toBe(false);
    expect(partsFor('disi').some((p) => p.id === 'karin-lekesi')).toBe(true);
    expect(partsFor('disi').some((p) => p.id === 'ikinci-diken')).toBe(false);
  });
});

describe('parçalar', () => {
  it('benzersiz kimlik; bağlantı noktaları tam ve sonlu; görünümler geçerli; her cinsiyette 14 parça', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FORM_IDS) for (const sx of SEXES) {
      const an = partAnchors(f, sx);
      expect(Object.keys(an).sort()).toEqual([...ids].sort());
      for (const p of PARTS) { expect(finite(an[p.id].pos), p.id).toBe(true); expect(VIEWS.map((v) => v.id)).toContain(p.view); expect(p.aciklama.length).toBeGreaterThan(60); }
    }
    expect(partsFor('erkek')).toHaveLength(14); expect(partsFor('disi')).toHaveLength(14);
    expect(VIEWS.map((v) => v.id)).toEqual(['yan', 'ust', 'on', 'arka', 'alt', 'capraz']);
    for (const id of ['agiz', 'goz', 'goz-cubugu', 'govde-lekesi', 'benekler', 'sirt-yuzgeci', 'anal-yuzgec', 'karin-yuzgeci', 'kuyruk-yuzgeci']) expect(ids).toContain(id);
  });
  it('numaralı noktalar birbirinden yeterince uzak (mobilde çakışmasın)', () => {
    for (const f of FORM_IDS) for (const sx of SEXES) {
      const an = partAnchors(f, sx), vis = partsFor(sx, f).map((p) => p.id);
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = an[vis[i] as keyof typeof an].pos, b = an[vis[j] as keyof typeof an].pos;
        expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${f} ${sx} ${vis[i]}-${vis[j]}`).toBeGreaterThan(0.07);
      }
    }
  });
  it('dürüstlük: Bolivya ramı ayrı tür; zayıf noktalar doğrulanmalı', () => {
    expect(PARTS.find((p) => p.id === 'govde')!.aciklama).toMatch(/Bolivya ramı/);
    expect(species.not).toMatch(/Bolivya ramı/);
    for (const id of ['ikinci-diken', 'karin-lekesi', 'govde-lekesi']) expect(PARTS.find((p) => p.id === id)!.dogrulanmali, id).toBe(true);
    expect(PARTS.find((p) => p.id === 'agiz')!.aciklama).toMatch(/bıyık yok/);
  });
});

describe('varyeteler', () => {
  it('kimlik/ad benzersiz; geçerli renkler; gruplar; belirsiz adlar doğrulanmalı; boyalı/floresan yok', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik]) expect(() => hexToRgb(h)).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(40);
      expect(`${v.ad} ${v.aciklama}`).not.toMatch(/glofish|floresan renk|neon pembe|boyalı balık/i);
      expect(STYLES[v.id], v.id).toBeTruthy();
    }
    expect(ids).toEqual(['normal', 'gold', 'elektrik', 'siyah', 'albino']);
    for (const id of ['gold', 'elektrik', 'siyah', 'albino']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(variantById('normal').dogrulanmali).toBe(false);
    expect(variantById('yok').id).toBe('normal');
    expect(groupedVariants().flatMap((g) => g.items)).toHaveLength(VARIANTS.length);
    expect(VARIANTS.some((v) => /altispinosus/.test(v.aciklama) || v.id === 'bolivya')).toBe(false); // ayrı tür: modellenmez
  });
  it('normal: kırmızı göz, çubuk ve leke tam; altın/elektrik/albinoda çubuk ve leke soluk ya da yok', () => {
    expect(hexToRgb(variantById('normal').goz.iris)[0]).toBeGreaterThan(0.6);
    expect(STYLES.normal.bar).toBe(1); expect(STYLES.normal.spot).toBe(1);
    expect(STYLES.gold.bar).toBeLessThan(0.6); expect(STYLES.elektrik.bar).toBeLessThan(0.6); expect(STYLES.albino.bar).toBe(0);
    const [r, , b] = hexToRgb(variantById('elektrik').govde.orta); expect(b).toBeGreaterThan(r + 0.3);
    expect(SPOT.t).toBeGreaterThan(0.25); expect(SPOT.t).toBeLessThan(0.55);
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
    expect(species.id).toBe('ram');
    expect(species.latin).toBe('Mikrogeophagus ramirezi');
    expect(species.sexes.map((s) => s.id)).toEqual(['erkek', 'disi']);
    expect(species.not).toMatch(/Şematik/);
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
