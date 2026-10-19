import { describe, expect, it, vi } from 'vitest';
import { SEXES, carapaceRing, segRing, silhouette, BODY, type Sex } from '../karides/model';
import { species } from './index';
import { PARTS, partsFor } from './parts';
import { VARIANTS } from './variants';
import { FORMS } from './forms';
import { AMANO_BODY, AMANO_PROFILE } from './profile';
import { dotLayout } from './texture';

describe('Amano gövdesi', () => {
  it('dişi erkekten iri; Neocaridina’dan ince (sol/sağ genişlik küçük), sonlu siluet; yumurta yalnız dişide', () => {
    expect(AMANO_BODY.disi.scale).toBeGreaterThan(AMANO_BODY.erkek.scale);
    for (const s of SEXES) {
      expect(carapaceRing(s, 0.5, AMANO_BODY[s]).rz).toBeLessThan(carapaceRing(s, 0.5, BODY[s]).rz * 1.02 + 1e-9);
      expect(segRing(s, 2, 0.5, AMANO_BODY[s]).rz).toBeLessThan(segRing(s, 2, 0.5, BODY[s]).rz * 1.02 + 1e-9);
      const sil = silhouette(s, AMANO_BODY[s]);
      for (const poly of [sil.carapace, ...sil.segments, sil.telson, sil.uropod]) expect(poly.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))).toBe(true);
      expect(sil.eggs.length > 0).toBe(s === 'disi');
    }
  });
  it('profil: daha uzun ve daha çok dişli rostrum, fırça kıskaç', () => {
    expect(AMANO_PROFILE.rostrum.len).toBeGreaterThan(0.4);
    expect(AMANO_PROFILE.rostrum.teethEvery).toBeLessThan(3);
    expect(AMANO_PROFILE.brushChela).toBe(true);
  });
});

describe('Amano desen ekseni (cinsiyet)', () => {
  it('erkekte yuvarlak benekler (kısa), dişide uzamış tireler; ikisinde de benek var', () => {
    for (const kind of ['carapace', 'abdomen'] as const) {
      const m = dotLayout('erkek', kind), f = dotLayout('disi', kind);
      expect(m.length).toBeGreaterThan(0); expect(f.length).toBeGreaterThan(0);
      expect(Math.max(...f.map((d) => d.len))).toBeGreaterThan(Math.max(...m.map((d) => d.len)) * 2);
    }
  });
  it('dokuyu her iki cinsiyette hatasız boyar (sahte canvas)', async () => {
    const ctx: any = new Proxy({}, { get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => {}), set: (t: any, k, v) => { t[k] = v; return true; } });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintShell } = await import('./texture');
      for (const sex of SEXES) for (const kind of ['carapace', 'abdomen'] as const) expect(paintShell(VARIANTS[0], sex, kind, 128).width).toBe(128);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('Amano parçaları, renk ve form', () => {
  it('kimlikler benzersiz; yan benek ve sırt çizgisi eklenmiş; eyer/yumurta dişide, appendix erkekte', () => {
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(PARTS.length);
    for (const p of PARTS) { expect(p.ozet.length).toBeGreaterThan(10); expect(p.aciklama.length).toBeGreaterThan(60); }
    const ids = (s: Sex) => partsFor(s).map((p) => p.id);
    expect(ids('disi')).toEqual(expect.arrayContaining(['benek', 'sirt-cizgisi', 'rostrum', 'kiskac', 'eyer', 'yumurta']));
    expect(ids('erkek')).toContain('appendix');
    expect(ids('erkek')).not.toContain('eyer');
    expect(ids('disi')).toHaveLength(16); expect(ids('erkek')).toHaveLength(15);
    expect(PARTS.find((p) => p.id === 'benek')!.aciklama).toMatch(/nokta/);
  });
  it('uydurma renk morfu yok: tek doğal görünüm; tek biçim', () => {
    expect(VARIANTS).toHaveLength(1);
    expect(VARIANTS[0].aciklama).toMatch(/[Şş]ematik/);
    expect(FORMS).toHaveLength(1);
    expect(FORMS[0].ad).toBe('Standart (tek biçim)');
  });
  it('SpeciesModule sözleşmesi', () => {
    expect(species.id).toBe('amano');
    expect(species.latin).toBe('Caridina multidentata');
    expect(species.not).toMatch(/doğrulanmalı/);
    expect(species.forms).toHaveLength(1);
    expect(species.views.map((v) => v.id)).toEqual(['ust', 'alt', 'yan', 'on', 'arka', 'capraz']);
    expect(species.sexes.map((s) => s.id).sort()).toEqual(['disi', 'erkek']);
    expect(typeof species.createFishGroup).toBe('function');
    expect(species.partsFor('disi')).toHaveLength(16);
  });
});
