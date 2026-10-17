import { describe, expect, it } from 'vitest';
import type { SpeciesModule } from './types';
import { species as guppy } from '../guppy';
import { species as vatoz } from '../vatoz';

const unique = (a: string[]) => new Set(a).size === a.length;

describe.each([[guppy, 'lepistes'], [vatoz, 'vatoz']] as [SpeciesModule, string][])('tür modülü sözleşmesi: %#', (sp, id) => {
  it('kimlik ve üst bilgi', () => {
    expect(sp.id).toBe(id);
    expect(sp.id).toMatch(/^[a-z]+$/);
    for (const k of [sp.ad, sp.latin, sp.kisaAciklama, sp.not ?? '']) expect(k.length).toBeGreaterThan(3);
    expect(typeof sp.createViewer).toBe('function');
  });
  it('cinsiyetler, görünümler', () => {
    expect(sp.sexes.length).toBeGreaterThan(0);
    for (const s of sp.sexes) { expect(['erkek', 'disi']).toContain(s.id); expect(s.ad).toBeTruthy(); expect(s.not.length).toBeGreaterThan(5); }
    expect(unique(sp.sexes.map((s) => s.id))).toBe(true);
    expect(unique(sp.views.map((v) => v.id))).toBe(true);
    for (const v of sp.views) expect(v.ad).toBeTruthy();
  });
  it('parçalar: benzersiz kimlik, ad/özet/açıklama; partsFor cinsiyete göre süzer', () => {
    expect(sp.parts.length).toBeGreaterThan(5);
    expect(unique(sp.parts.map((p) => p.id))).toBe(true);
    for (const p of sp.parts) { expect(p.ad).toBeTruthy(); expect(p.ozet).toBeTruthy(); expect(p.aciklama.length).toBeGreaterThan(20); }
    for (const s of sp.sexes) {
      const list = sp.partsFor(s.id);
      expect(list.length).toBeGreaterThan(0);
      for (const p of list) expect(!p.sex || p.sex === s.id).toBe(true);
    }
  });
  it('varyeteler: benzersiz kimlik, ad ve açıklama', () => {
    expect(sp.variants.length).toBeGreaterThan(3);
    expect(unique(sp.variants.map((v) => v.id))).toBe(true);
    for (const v of sp.variants) { expect(v.ad).toBeTruthy(); expect(v.aciklama).toBeTruthy(); }
  });
});

describe('vatoz modülü', () => {
  it('tür kimliği uyarısı ve "cüce" ifadesi', () => {
    expect(vatoz.ad).toBe('Tatlı su vatozu');
    expect(vatoz.not).toMatch(/doğrulanmalı/);
    expect(JSON.stringify([vatoz.ad, vatoz.kisaAciklama, vatoz.not])).not.toMatch(/cüce/i);
  });
});
