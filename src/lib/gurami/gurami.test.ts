import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORM, FORM_IDS, SEXES, bodyFns, hexToRgb, silhouette, specFor, outline } from './model';
import { PARTS, VIEWS, partAnchors, partsFor } from './parts';
import { FORMS, formById } from './forms';
import { VARIANTS, VARIANT_GROUPS, femaleOf, groupedVariants, variantById } from './variants';
import { species } from './index';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));
const top = (sex: 'erkek' | 'disi') => { const f = specFor('standart', sex).fins[0]; return Math.max(...f.edge.map((p, i) => p[1] - f.base[i][1])); }; // gövdeden yükseklik

describe('cüce gurami geometrisi', () => {
  it('gövde oval ve yanlardan basık; burun kapalı', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx), f = bodyFns(sp.body), L = sp.body.xe - sp.body.xs;
      let h = 0, w = 0;
      for (let t = 0; t <= 1; t += 0.01) { h = Math.max(h, f.top(t) - f.bot(t)); w = Math.max(w, 2 * f.w(t)); }
      expect(h / L).toBeGreaterThan(0.38); expect(h / L).toBeLessThan(0.52);
      expect(w / h).toBeLessThan(0.4);
      expect(f.top(0)).toBeCloseTo(f.bot(0), 6);
      for (const p of outline(sp.body, 40)) expect(finite(p)).toBe(true);
    }
  });
  it('erkek: sırt yüzgeci dişiden belirgin uzun ve sivri (uç geride); dişide yuvarlak', () => {
    expect(top('erkek')).toBeGreaterThan(top('disi') + 0.04);
    const dm = specFor('standart', 'erkek').fins[0], dd = specFor('standart', 'disi').fins[0];
    const tipM = dm.edge.reduce((m, p) => (p[1] > m[1] ? p : m), dm.edge[0]);
    const baseEnd = dm.base[dm.base.length - 1];
    expect(tipM[0]).toBeGreaterThan(baseEnd[0] - 0.05); // en yüksek nokta arka uca yakın (sivri uç)
    const tipD = dd.edge.reduce((m, p) => (p[1] > m[1] ? p : m), dd.edge[0]);
    const idxD = dd.edge.indexOf(tipD) / (dd.edge.length - 1), idxM = dm.edge.indexOf(tipM) / (dm.edge.length - 1);
    expect(idxD).toBeLessThan(idxM); // dişide tepe ortada (yuvarlak), erkekte arkada
  });
  it('dişide karın erkekten dolgun', () => {
    const belly = (s: 'erkek' | 'disi') => { const f = bodyFns(specFor('standart', s).body); return f.top(0.5) - f.bot(0.5); };
    expect(belly('disi')).toBeGreaterThan(belly('erkek') + 0.015);
  });
  it('anal yüzgeç uzun ve kesintisiz: gövde uzunluğunun yarısından fazlasını kaplar; kuyruk yuvarlak', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx), a = sp.fins[1], L = sp.body.xe - sp.body.xs;
      expect((a.base[a.base.length - 1][0] - a.base[0][0]) / L).toBeGreaterThan(0.5);
      const c = sp.fins[2].edge, mid = c.reduce((m, p) => (Math.abs(p[1]) < Math.abs(m[1]) ? p : m), c[0]);
      expect(mid[0]).toBeGreaterThanOrEqual(Math.max(...c.map((p) => p[0])) - 0.01); // çentik yok
    }
  });
  it('iki uzun ince karın ipliği (dokunma): gövde altına sarkar, incelir; yan çizgi çizilmez; küçük yukarı bakan dudaklı ağız', () => {
    const sp = specFor();
    const fil = sp.filaments[0];
    expect(fil.path[fil.path.length - 1][1]).toBeLessThan(-0.45);
    for (let i = 1; i < fil.radii.length; i++) expect(fil.radii[i]).toBeLessThan(fil.radii[i - 1]);
    expect(sp.lateral).toHaveLength(0);
    expect(sp.mouthGeom).toBeTruthy();
    expect(sp.mouthGeom!.dir[1]).toBeGreaterThan(0.4); // yukarı bakar
    expect(sp.mouthGeom!.lip).toBeGreaterThan(0.003);
    expect(sp.eye.r).toBeGreaterThan(0.025);
  });
  it('atlas tüm yüzgeçleri kapsar; noktalar sonlu; önbellek', () => {
    for (const sx of SEXES) {
      const sp = specFor('standart', sx);
      for (const f of sp.fins) { expect(f.base).toHaveLength(f.edge.length); for (const p of [...f.base, ...f.edge]) { expect(finite(p)).toBe(true); expect(p[0]).toBeGreaterThanOrEqual(sp.atlas.x0); expect(p[0]).toBeLessThanOrEqual(sp.atlas.x1); expect(p[1]).toBeGreaterThanOrEqual(sp.atlas.y0); expect(p[1]).toBeLessThanOrEqual(sp.atlas.y1); } }
      expect(specFor('standart', sx)).toBe(sp);
    }
    expect(specFor('yok')).toBe(specFor(DEFAULT_FORM, 'erkek'));
  });
});

describe('form (şekil): dürüst tek biçim', () => {
  it('yalnızca standart form var; uydurma form yok; açıklama bunu söyler', () => {
    expect(FORM_IDS).toEqual(['standart']);
    expect(FORMS.map((f) => f.id)).toEqual(['standart']);
    expect(species.forms).toBe(FORMS);
    expect(formById('yok').id).toBe('standart');
    expect(FORMS[0].aciklama).toMatch(/bulunamadı/);
    expect(species.not).toMatch(/form/);
  });
});

describe('parçalar', () => {
  it('benzersiz kimlik; bağlantı noktaları tam ve sonlu, iki cinsiyette; görünümler geçerli', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sx of SEXES) {
      const an = partAnchors('standart', sx);
      expect(Object.keys(an).sort()).toEqual([...ids].sort());
      for (const p of PARTS) { expect(finite(an[p.id].pos), p.id).toBe(true); expect(VIEWS.map((v) => v.id)).toContain(p.view); expect(p.aciklama.length).toBeGreaterThan(60); }
    }
    expect(VIEWS.map((v) => v.id)).toEqual(['yan', 'ust', 'on', 'arka', 'alt', 'capraz']);
  });
  it('anahtar anatomi var; labirent organı açıkça iç organ ve doğrulanmalı olarak işaretli', () => {
    const ids = PARTS.map((p) => p.id);
    for (const id of ['agiz', 'goz', 'pelvik-iplik', 'anal-yuzgec', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'seritler', 'labirent']) expect(ids).toContain(id);
    const l = PARTS.find((p) => p.id === 'labirent')!;
    expect(l.ad).toMatch(/görünmez/); expect(l.dogrulanmali).toBe(true); expect(l.aciklama).toMatch(/çizilmemiştir/);
  });
  it('sırt yüzgeci özeti cinsiyete göre değişir; erkekte sivri, dişide yuvarlak; sırt yüzgeci noktası erkekte daha yüksek', () => {
    expect(partsFor('erkek').find((p) => p.id === 'sirt-yuzgeci')!.ozet).toMatch(/sivri/);
    expect(partsFor('disi').find((p) => p.id === 'sirt-yuzgeci')!.ozet).toMatch(/yuvarlak/);
    expect(partAnchors('standart', 'erkek')['sirt-yuzgeci'].pos[1]).toBeGreaterThan(partAnchors('standart', 'disi')['sirt-yuzgeci'].pos[1]);
  });
});

describe('varyeteler', () => {
  it('kimlik/ad benzersiz; geçerli renkler; gruplar; belirsiz adlar doğrulanmalı', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(8);
    for (const v of VARIANTS) {
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.goz), ...Object.values(v.govde), v.yuzgec.renk, v.yuzgec.isin, v.iplik, ...v.katmanlar.flatMap((l) => ('renk' in l ? [l.renk] : []))]) expect(() => hexToRgb(h)).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(40);
    }
    for (const id of ['neon', 'powder', 'kobalt', 'sunset', 'alev', 'altin', 'albino', 'yabani']) expect(ids).toContain(id);
    for (const id of ['kobalt', 'alev', 'altin', 'albino', 'yabani']) expect(variantById(id).dogrulanmali, id).toBe(true);
    expect(variantById('neon').dogrulanmali).toBe(false);
    expect(variantById('yok').id).toBe('neon');
    expect(groupedVariants().flatMap((g) => g.items)).toHaveLength(VARIANTS.length);
  });
  it('dişi rengi erkekten soluk (şeritler silik, yüzgeç saydam); kimlik korunur', () => {
    for (const v of VARIANTS) {
      const f = femaleOf(v);
      expect(f.id).toBe(v.id);
      const bars = (x: typeof v) => x.katmanlar.filter((l) => l.t === 'bar').map((l) => (l as { a: number }).a);
      expect(Math.max(...bars(f))).toBeLessThan(Math.max(...bars(v)));
      expect(f.yuzgec.a).toBeLessThan(v.yuzgec.a);
      expect(variantById(v.id, 'disi').govde).toEqual(f.govde);
      expect(variantById(v.id, 'erkek')).toBe(v);
    }
    expect(variantById('neon', 'disi').govde.orta).not.toBe(variantById('neon').govde.orta);
  });
  it('tüm varyete × cinsiyet dokuyu hatasız boyar (sahte canvas)', async () => {
    const ctx: any = new Proxy({}, { get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => {}), set: (t: any, k, val) => { t[k] = val; return true; } });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintAtlas } = await import('../akvaryum/yanal-texture');
      for (const sx of SEXES) for (const v of VARIANTS) {
        const t = paintAtlas(specFor('standart', sx), variantById(v.id, sx), 128);
        expect(t.map.width).toBe(128); expect(t.map.height).toBeGreaterThan(60);
      }
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('tür sözleşmesi (SpeciesModule)', () => {
  it('kimlik, iki cinsiyet, görünümler, şematik notu; her form × renk × cinsiyet kurulabilir kaydı var', () => {
    expect(species.id).toBe('gurami');
    expect(species.latin).toBe('Trichogaster lalius');
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
  it('SVG siluet: sonlu, üç yüzgeç, her iki cinsiyet', () => {
    for (const s of SEXES) { const sil = silhouette(specFor('standart', s)); expect(sil.fins).toHaveLength(3); for (const p of [...sil.body, ...sil.fins.flat()]) expect(finite(p)).toBe(true); }
  });
});
