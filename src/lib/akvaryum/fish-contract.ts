// Balık türleri (betta, neon, corydoras, japon) için ortak birim test paketi. Vitest dosyalarından çağrılır.
import { describe, expect, it, vi } from 'vitest';
import { bodyOutline, finGrid, sectionPoint, surfaceAt, type Body, type FinDef, type Silhouette, type Vec3 } from './fishmath';
import type { FishAnchor } from './fish3d';
import type { FishPart } from './page';
import type { SexId, SpeciesVariant } from './types';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

export interface FishSuite {
  ad: string;
  sexes: SexId[];
  bodyFor(sex: SexId): Body;
  finsFor(sex: SexId): FinDef[];
  silhouette(sex: SexId): Silhouette;
  parts: FishPart[];
  partsFor(sex: SexId): FishPart[];
  partAnchors(sex: SexId): Record<string, FishAnchor>;
  variants: (SpeciesVariant & { dogrulanmali?: boolean })[];
  /** Dokuyu sahte canvas ile boyar */
  paint(variantId: string, sex: SexId, W: number): unknown;
  /** Parça kimlikleri arasında yüzey parçası olup (gövde üzerinde) yüzeye yakın durması gerekenler */
  onSurface: string[];
  /** Gövde boyu/yüksekliği için beklenen en-boy oranı aralığı */
  aspect: [number, number];
}

export function fishSuite(c: FishSuite) {
  describe(`${c.ad}: gövde`, () => {
    it('kesitler sonlu; burun ve kuyruk sapı uçlarında beklenen boyut; yan yana simetrik', () => {
      for (const sex of c.sexes) {
        const b = c.bodyFor(sex);
        for (let i = 0; i <= 40; i++) {
          const sec = b.section(i / 40);
          expect(finite([sec.x, sec.yTop, sec.yBot, sec.hw]), `${sex} ${i}`).toBe(true);
          expect(sec.yTop, `${sex} ${i}`).toBeGreaterThanOrEqual(sec.yBot);
          expect(sec.hw).toBeGreaterThanOrEqual(0);
          for (const phi of [0.3, 1.2, 2.4]) {
            const p = sectionPoint(sec, phi), q = sectionPoint(sec, Math.PI * 2 - phi);
            expect(p[2]).toBeCloseTo(-q[2], 9);
            expect(p[1]).toBeCloseTo(q[1], 9);
          }
        }
        expect(b.section(0).x).toBeCloseTo(-0.5, 9);
        expect(b.section(1).x).toBeCloseTo(0.5, 9);
        expect(b.section(0).hw).toBeCloseTo(0, 9); // burun kapalı
        expect(b.section(0).yTop - b.section(0).yBot).toBeCloseTo(0, 9);
        expect(b.section(1).hw).toBeGreaterThan(0.01);
      }
    });
    it('en-boy oranı beklenen aralıkta; yan siluet çokgeni sonlu', () => {
      for (const sex of c.sexes) {
        const b = c.bodyFor(sex);
        let h = 0;
        for (let i = 0; i <= 60; i++) { const s = b.section(i / 60); h = Math.max(h, s.yTop - s.yBot); }
        const ratio = 1 / h;
        expect(ratio, sex).toBeGreaterThan(c.aspect[0]);
        expect(ratio, sex).toBeLessThan(c.aspect[1]);
        const o = bodyOutline(b, 20);
        expect(o.every((p) => finite(p))).toBe(true);
      }
    });
    it('yüzey normali dışa bakar', () => {
      for (const sex of c.sexes) {
        const b = c.bodyFor(sex);
        const top = surfaceAt(b, 0.5, 0), side = surfaceAt(b, 0.5, Math.PI / 2), bot = surfaceAt(b, 0.5, Math.PI);
        expect(top.normal[1]).toBeGreaterThan(0.8);
        expect(side.normal[2]).toBeGreaterThan(0.8);
        expect(bot.normal[1]).toBeLessThan(-0.8);
        expect(Math.hypot(...side.normal)).toBeCloseTo(1, 6);
      }
    });
  });

  describe(`${c.ad}: yüzgeçler`, () => {
    it('yüzgeç ızgarası sonlu ve düzgün indeksli; kökler gövdeye yakın; uçlar köklerden ayrı', () => {
      for (const sex of c.sexes) {
        const fins = c.finsFor(sex);
        expect(fins.length).toBeGreaterThanOrEqual(4);
        expect(new Set(fins.map((f) => f.id)).size).toBe(fins.length);
        for (const f of fins) {
          expect(f.base.length).toBe(f.tip.length);
          expect(f.base.length).toBeGreaterThanOrEqual(2);
          const g = finGrid(f, 1, 4);
          expect(finite(g.pos), f.id).toBe(true);
          expect(Math.max(...g.idx)).toBeLessThan(g.pos.length / 3);
          expect(g.uv.every((u) => u >= 0 && u <= 1)).toBe(true);
          const len = f.base.reduce((m, p, i) => Math.max(m, Math.hypot(p[0] - f.tip[i][0], p[1] - f.tip[i][1], p[2] - f.tip[i][2])), 0);
          expect(len, `${f.id} uzunluğu`).toBeGreaterThan(0.02);
          expect(len, `${f.id} uzunluğu`).toBeLessThan(0.8);
          // kök, gövde sınırlayıcı kutusunun içinde
          for (const p of f.base) { expect(Math.abs(p[0])).toBeLessThanOrEqual(0.52); expect(Math.abs(p[2])).toBeLessThan(0.25); }
          if (f.paired) for (const p of [...f.base, ...f.tip]) expect(p[2], `${f.id} +z yanında tanımlı`).toBeGreaterThanOrEqual(-1e-9);
        }
      }
    });
    it('silüet çokgenleri sonlu; göz gövde içinde', () => {
      for (const sex of c.sexes) {
        const s = c.silhouette(sex);
        expect(s.body.length).toBeGreaterThan(20);
        for (const f of s.fins) expect(f.pts.every((p) => finite(p))).toBe(true);
        expect(finite([...s.eye.c, s.eye.r])).toBe(true);
        expect(Math.abs(s.eye.c[0])).toBeLessThan(0.5);
      }
    });
  });

  describe(`${c.ad}: parçalar ve noktalar`, () => {
    it('kimlikler benzersiz; metinler dolu; görünüm tanımlı; cinsiyete özgü parça süzgeci', () => {
      expect(new Set(c.parts.map((p) => p.id)).size).toBe(c.parts.length);
      expect(c.parts.length).toBeGreaterThanOrEqual(10);
      for (const p of c.parts) {
        expect(p.ad.length).toBeGreaterThan(3);
        expect(p.ozet.length).toBeGreaterThan(10);
        expect(p.aciklama.length).toBeGreaterThan(80);
        expect(['yan', 'ust', 'alt', 'on', 'arka', 'capraz']).toContain(p.view);
      }
      for (const sex of c.sexes) for (const p of c.partsFor(sex)) expect(!p.sex || p.sex === sex).toBe(true);
    });
    it('her parçanın (cinsiyetine uygun) bağlantı noktası var, sonlu; yüzeydekiler gövdeye yakın', () => {
      for (const sex of c.sexes) {
        const a = c.partAnchors(sex), b = c.bodyFor(sex);
        for (const p of c.partsFor(sex)) {
          const an = a[p.id];
          expect(an, `${sex} ${p.id}`).toBeTruthy();
          expect(finite(an.pos)).toBe(true);
          if (an.normal) expect(Math.hypot(...an.normal)).toBeCloseTo(1, 5);
          if (an.mirror) expect(an.pos[2], `${p.id} +z`).toBeGreaterThanOrEqual(-1e-9);
        }
        for (const id of c.onSurface) {
          const an = a[id];
          if (!an) continue;
          const sec = b.section(an.pos[0] + 0.5), cy = (sec.yTop + sec.yBot) / 2;
          const q = (an.pos[1] - cy) / Math.max(1e-6, (sec.yTop - sec.yBot) / 2), w = an.pos[2] / Math.max(1e-6, sec.hw);
          expect(Math.hypot(q, w), `${sex} ${id} gövdeye yakın`).toBeLessThan(1.45);
          expect(Math.hypot(q, w), `${sex} ${id} gövdenin içinde değil`).toBeGreaterThan(0.8);
        }
        for (const id of Object.keys(a)) expect(c.parts.some((p) => p.id === id), `${id} listede`).toBe(true);
      }
    });
  });

  describe(`${c.ad}: varyeteler ve doku`, () => {
    it('kimlik ve ad benzersiz; açıklamalar şematik/doğrulanmalı dürüstlüğü taşır', () => {
      const ids = c.variants.map((v) => v.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(c.variants.map((v) => v.ad)).size).toBe(ids.length);
      for (const v of c.variants) {
        expect(v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
        expect(v.aciklama.length).toBeGreaterThan(40);
        expect(v.aciklama).toMatch(/[Şş]ematik|doğrulanmalı|değişir/);
      }
      expect(c.variants.some((v) => v.dogrulanmali)).toBe(true);
    });
    it('tüm varyeteler her cinsiyette dokuyu hatasız boyar (sahte canvas)', () => {
      const calls = { n: 0 };
      const ctx: any = new Proxy({}, {
        get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
        set: (t: any, k, val) => { t[k] = val; return true; },
      });
      vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
      try {
        for (const v of c.variants) for (const sex of c.sexes) expect(c.paint(v.id, sex, 256), `${v.id} ${sex}`).toBeTruthy();
        expect(calls.n).toBeGreaterThan(300);
      } finally { vi.unstubAllGlobals(); }
    });
  });
}

export const v3 = (a: number, b: number, d: number): Vec3 => [a, b, d];
