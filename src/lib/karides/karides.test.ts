import { describe, expect, it, vi } from 'vitest';
import {
  ANIM, BODY, CARAPACE, LEGS, REST_ANGLES, SEG, SEXES, antennaSway, carapaceRing, eggPositions, jointAngle, pleopodAngle, ringYZ, segRing, silhouette,
  spineFrames, toBody, type Sex,
} from './model';
import { PARTS, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, hexToRgb, mulberry32, sexTone, variantById } from './variants';
import { species } from './index';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

describe('gövde geometrisi', () => {
  it('karapaks: baştan arkaya genişler, tüm yarıçaplar pozitif ve sonlu; dişi erkekten iri', () => {
    for (const s of SEXES) {
      let prev = 0;
      for (let k = 0; k <= 20; k++) {
        const r = carapaceRing(s, k / 20);
        expect(r.ry).toBeGreaterThan(0); expect(r.rz).toBeGreaterThan(0); expect(finite([r.cx, r.cy, r.ry, r.rz])).toBe(true);
        if (k > 0) expect(r.cx).toBeGreaterThan(prev);
        prev = r.cx;
      }
      expect(carapaceRing(s, 0.5).rz).toBeGreaterThan(carapaceRing(s, 0.02).rz);
    }
    expect(carapaceRing('disi', 0.5).rz).toBeGreaterThan(carapaceRing('erkek', 0.5).rz);
    expect(carapaceRing('disi', 1).cx).toBeCloseTo(CARAPACE.x0 + CARAPACE.len, 9);
  });
  it('6 karın halkası; halkalar 3. halkada en iri, kuyruğa doğru incelir; dişide daha dolgun', () => {
    expect(SEG.len).toHaveLength(6); expect(SEG.ry).toHaveLength(6); expect(SEG.rz).toHaveLength(6);
    for (const s of SEXES) {
      expect(segRing(s, 5, 0.5).ry).toBeLessThan(segRing(s, 2, 0.5).ry);
      expect(segRing(s, 5, 0.5).rz).toBeLessThan(segRing(s, 0, 0.5).rz);
    }
    for (let i = 0; i < 6; i++) expect(segRing('disi', i, 0.5).rz).toBeGreaterThan(segRing('erkek', i, 0.5).rz);
    expect(BODY.disi.scale).toBeGreaterThan(BODY.erkek.scale);
  });
  it('halka kesiti kapalı ve sonlu; alt yarıda yanlara taşma, dişide fazla', () => {
    for (const f of [0, 0.5, 1]) for (let k = 0; k <= 24; k++) expect(finite(ringYZ(-Math.PI / 2 + (k / 24) * Math.PI * 2, 0.2, 0.2, f))).toBe(true);
    const [, zLow] = ringYZ(-Math.PI / 4, 0.2, 0.2, 1);
    const [, zHigh] = ringYZ(Math.PI / 4, 0.2, 0.2, 1);
    expect(zLow).toBeGreaterThan(zHigh);
    expect(ringYZ(-Math.PI / 4, 0.2, 0.2, 1)[1]).toBeGreaterThan(ringYZ(-Math.PI / 4, 0.2, 0.2, 0.5)[1]);
  });
  it('düz kinematik: kuyruk karapaksın gerisinde; dinlenmede kuyruk ucu aşağı kıvrılır', () => {
    const f = spineFrames('disi');
    expect(f).toHaveLength(7);
    for (let i = 1; i < f.length; i++) expect(f[i].x).toBeGreaterThan(f[i - 1].x);
    expect(f[6].ang).toBeLessThan(0);
    expect(toBody(f[0], 0, 0)).toEqual([f[0].x, f[0].y]);
  });
});

describe('hareket', () => {
  it('amp=0 iken dinlenme açıları; açılar sınırlı ve zamanla değişir', () => {
    for (let i = 0; i <= 6; i++) {
      expect(jointAngle(i, 3.3, 0)).toBe(REST_ANGLES[i]);
      let min = 9, max = -9;
      for (let t = 0; t < 12; t += 0.1) { const a = jointAngle(i, t, ANIM.amp); min = Math.min(min, a); max = Math.max(max, a); expect(Math.abs(a - REST_ANGLES[i])).toBeLessThan(0.35); }
      expect(max - min).toBeGreaterThan(0.01);
    }
  });
  it('yüzme bacakları art arda çırpar: komşu bacaklar farklı fazda; amp=0 sabit', () => {
    expect(pleopodAngle(0, 1, 0)).toBe(pleopodAngle(3, 9, 0));
    expect(pleopodAngle(0, 1, 1)).not.toBeCloseTo(pleopodAngle(1, 1, 1), 3);
  });
  it('anten salınımı uca doğru büyür ve amp=0 iken sıfır', () => {
    const z = antennaSway(5, 10, 1, 0, 0);
    expect(Math.abs(z[0]) + Math.abs(z[1])).toBe(0);
    const big = (k: number) => { let m = 0; for (let t = 0; t < 20; t += 0.05) m = Math.max(m, Math.abs(antennaSway(k, 10, t, 1, 0)[0])); return m; };
    expect(big(9)).toBeGreaterThan(big(1));
  });
});

describe('bacaklar ve yumurtalar', () => {
  it('5 çift yürüme bacağı; yalnızca ilk ikisi kıskaçlı; halkalar pozitif', () => {
    expect(LEGS).toHaveLength(5);
    LEGS.forEach((l, i) => { expect(l.chela).toBe(i < 2); expect(l.links.length).toBe(l.pitch.length); l.links.forEach((x) => expect(x).toBeGreaterThan(0)); });
    for (let i = 1; i < 5; i++) expect(LEGS[i].x).toBeGreaterThan(LEGS[i - 1].x);
  });
  it('yumurta konumları deterministik, sonlu ve halkanın altında', () => {
    for (let i = 1; i <= 4; i++) {
      const a = eggPositions(i, 11), b = eggPositions(i, 11);
      expect(a).toEqual(b);
      for (const e of a) { expect(finite([...e.p, e.r])).toBe(true); expect(e.p[1]).toBeLessThan(-SEG.ry[i] * 0.5); }
    }
  });
});

describe('parçalar', () => {
  it('kimlikler benzersiz; açıklamalar dolu; eyer/yumurta yalnızca dişide, appendix yalnızca erkekte', () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    for (const p of PARTS) { expect(p.ad).toBeTruthy(); expect(p.ozet.length).toBeGreaterThan(10); expect(p.aciklama.length).toBeGreaterThan(60); expect(p.aciklama).not.toMatch(/öndən/); }
    const ids = (s: Sex) => partsFor(s).map((p) => p.id);
    expect(ids('disi')).toEqual(expect.arrayContaining(['eyer', 'yumurta']));
    expect(ids('disi')).not.toContain('appendix');
    expect(ids('erkek')).toContain('appendix');
    expect(ids('erkek')).not.toContain('eyer');
    expect(ids('disi')).toHaveLength(14); expect(ids('erkek')).toHaveLength(13);
  });
  it('anatomi kapsamı: rostrum, göz, anten, antenül, ağız, 5 çift bacak, kıskaç, karın, pleopod, telson, uropod', () => {
    const ids = PARTS.map((p) => p.id);
    for (const id of ['rostrum', 'karapaks', 'goz', 'anten', 'antenul', 'agiz', 'yuruyen-bacak', 'kiskac', 'karin', 'yuzme-bacagi', 'telson', 'uropod']) expect(ids).toContain(id);
  });
});

describe('varyeteler', () => {
  it('kimlikler/adlar benzersiz; renkler geçerli; gruplar geçerli; şematik notu', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(VARIANTS.map((v) => v.ad)).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(14);
    for (const v of VARIANTS) {
      expect(v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      for (const h of [...Object.values(v.renk), v.goz, ...(v.serit ? [v.serit] : []), ...(v.benek ? [v.benek.renk] : []), ...(v.rili ? [v.rili.ton] : [])]) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      expect(v.aciklama).toMatch(/Şematik|şematik/);
      expect(v.parlak).toBeGreaterThanOrEqual(0); expect(v.parlak).toBeLessThanOrEqual(1);
    }
  });
  it('Caridina adları yok; belirsiz adlar doğrulanmalı; Rili varyeteleri saydam halka listesi taşır', () => {
    for (const v of VARIANTS) expect(v.ad).not.toMatch(/Crystal|Pure Red|Taiwan|Panda|Tiger|Bee/i);
    for (const id of ['black-rose', 'green-jade', 'blue-velvet', 'snowball', 'yellow-goldenback', 'orange']) expect(variantById(id).dogrulanmali, id).toBe(true);
    for (const id of ['red-cherry', 'sakura', 'fire-red', 'blue-dream', 'chocolate']) expect(variantById(id).dogrulanmali, id).toBe(false);
    for (const v of VARIANTS.filter((x) => x.stil === 'rili')) { expect(v.rili?.acik.length).toBeGreaterThan(0); v.rili!.acik.forEach((i) => { expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(6); }); }
  });
  it('renkler birbirinden ayırt edilir: sırt rengi çiftleri yeterince farklı olmalı (kırmızı hat dışında)', () => {
    const d = (a: string, b: string) => { const x = hexToRgb(a), y = hexToRgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    const lone = VARIANTS.filter((v) => v.grup !== 'Kırmızı hat');
    for (let i = 0; i < lone.length; i++) for (let j = i + 1; j < lone.length; j++) {
      if (lone[i].stil === 'rili' || lone[j].stil === 'rili' || lone[i].serit || lone[j].serit) continue;
      expect(d(lone[i].renk.yan, lone[j].renk.yan), `${lone[i].id}/${lone[j].id}`).toBeGreaterThan(0.1);
    }
  });
  it('gruplama, bilinmeyen kimlik ve yardımcılar', () => {
    expect(groupedVariants().flatMap((g) => g.items)).toHaveLength(VARIANTS.length);
    expect(variantById('yok').id).toBe(VARIANTS[0].id);
    expect(() => hexToRgb('kırmızı')).toThrow(RangeError);
    const a = mulberry32(5), b = mulberry32(5);
    expect(a()).toBe(b());
    const c = sexTone([0.8, 0.2, 0.2], 0.82);
    expect(c[0] - c[1]).toBeLessThan(0.6);
  });
  it('tüm varyeteler her iki cinsiyette dokuyu hatasız boyar (sahte canvas)', async () => {
    const calls = { n: 0 };
    const ctx: any = new Proxy({}, {
      get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
      set: (t: any, k, val) => { t[k] = val; return true; },
    });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintShell } = await import('./texture');
      for (const v of VARIANTS) for (const sex of SEXES) for (const kind of ['carapace', 'abdomen', 'clear'] as const) {
        const c = paintShell(v, sex, kind, 128);
        expect(c.width, `${v.id} ${sex} ${kind}`).toBe(128);
        expect(c.height).toBe(64);
      }
      expect(calls.n).toBeGreaterThan(1000);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('SVG yedeği için siluet', () => {
  it('sonlu noktalar; 6 halka; yumurta yalnızca dişide', () => {
    for (const s of SEXES) {
      const sil = silhouette(s);
      expect(sil.segments).toHaveLength(6);
      expect(sil.legs).toHaveLength(5);
      expect(sil.pleopods).toHaveLength(5);
      for (const poly of [sil.carapace, ...sil.segments, sil.telson, sil.uropod, sil.rostrum, ...sil.antennae, ...sil.legs]) { expect(poly.length).toBeGreaterThan(1); expect(poly.every((p) => finite(p))).toBe(true); }
      expect(finite([sil.eye.x, sil.eye.y, sil.eye.r])).toBe(true);
      expect(sil.eggs.length > 0).toBe(s === 'disi');
      expect(Math.max(...sil.uropod.map((p) => p[0]))).toBeGreaterThan(Math.max(...sil.carapace.map((p) => p[0])));
    }
  });
});

describe('tür modülü', () => {
  it('SpeciesModule sözleşmesi', () => {
    expect(species.id).toBe('karides');
    expect(species.latin).toBe('Neocaridina davidi');
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(species.not).toMatch(/Caridina/);
    expect(species.sexes.map((s) => s.id).sort()).toEqual(['disi', 'erkek']);
    expect(species.views.map((v) => v.id)).toEqual(['ust', 'alt', 'yan', 'on', 'arka', 'capraz']);
    expect(species.parts.length).toBe(PARTS.length);
    expect(species.partsFor('erkek').every((p) => !p.sex || p.sex === 'erkek')).toBe(true);
    expect(species.variants.length).toBe(VARIANTS.length);
    expect(typeof species.createViewer).toBe('function');
  });
});
