import { describe, expect, it } from 'vitest';
import { bodyShape, flankProfile } from './body';
import { finDetail, streak } from './finpaint';
import { M as MOLLY, BODY as MB } from '../molly/model';
import { M as PLATY } from '../platy/model';
import { bodyProfile as GP, bodySurfacePoint as GS, SEXES as GSEX } from '../guppy/model';

describe('ortak gövde biçimlendirme', () => {
  it('çarpanlar sonlu ve makul aralıkta; burun ucunda daha sivri', () => {
    for (let i = 0; i <= 100; i++) {
      const m = bodyShape(i / 100, undefined);
      for (const v of [m.up, m.down, m.w]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThan(0.5); expect(v).toBeLessThan(1.3); }
    }
    expect(bodyShape(0, undefined).up).toBeLessThan(bodyShape(0.3, undefined).up);
  });

  it('ensede (t≈0.17) sırt çizgisi çukurlaşır, sırt kamburu (t≈0.4) daha yüksek', () => {
    expect(bodyShape(0.175, { nape: 0.1, back: 0 }).up).toBeLessThan(bodyShape(0.175, { nape: 0, back: 0 }).up - 0.05);
    expect(bodyShape(0.4, { nape: 0, back: 0.06 }).up).toBeGreaterThan(bodyShape(0.4, { nape: 0, back: 0 }).up + 0.05);
  });

  it('kesit yanları sırtta daralır, yanlar simetrik ve karın/sırtta sıfıra gider', () => {
    expect(flankProfile(Math.PI / 2, undefined)).toBeCloseTo(1, 9);
    expect(flankProfile(0, undefined)).toBeCloseTo(0, 9);
    expect(flankProfile(Math.PI, undefined)).toBeCloseTo(0, 9);
    expect(flankProfile(Math.PI / 2 + 0.2, undefined)).toBeGreaterThan(flankProfile(Math.PI * 0.85, undefined));
    expect(flankProfile(1, undefined)).toBeCloseTo(-flankProfile(2 * Math.PI - 1, undefined), 9);
  });

  it('yüzey noktası dışa offset ile uzaklaşır; kuyruk sapı yuvarlakça kapanır', () => {
    for (const M of [MOLLY, PLATY]) {
      for (const sex of ['erkek', 'disi'] as const) {
        const a = M.bodySurfacePoint(sex, 0.5, 1.2, 0), b = M.bodySurfacePoint(sex, 0.5, 1.2, 0.05);
        expect(Math.hypot(b[1] - a[1], b[2] - a[2])).toBeGreaterThan(0.04);
        const end = M.bodyProfile(sex, 0.995), pre = M.bodyProfile(sex, 0.93);
        expect(end.up + end.down).toBeLessThan(0.45 * (pre.up + pre.down));
      }
    }
    for (const s of GSEX) {
      const a = GS(s, 0.5, 1.2, 0), b = GS(s, 0.5, 1.2, 0.05);
      expect(Math.hypot(b[1] - a[1], b[2] - a[2])).toBeGreaterThan(0.04);
      expect(GP(s, 0.995).up).toBeLessThan(0.5 * GP(s, 0.93).up);
    }
    expect(MB.erkek.shape).toBeDefined();
  });
});

describe('yüzgeç zarı ayrıntısı', () => {
  it('streak -1..1; finDetail sonlu ve 0..1 aralığında, deterministik', () => {
    for (let i = 0; i <= 50; i++) { const v = streak(i / 50, 3, 38); expect(v).toBeGreaterThanOrEqual(-1); expect(v).toBeLessThanOrEqual(1); }
    for (const big of [true, false]) for (let u = 0; u <= 1; u += 0.1) for (let s = 0; s <= 1; s += 0.1) {
      const [c, a] = finDetail([0.9, 0.3, 0.1], 0.8, big, u, s, 5);
      for (const v of [...c, a]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
      expect(finDetail([0.9, 0.3, 0.1], 0.8, big, u, s, 5)).toEqual([c, a]);
    }
  });
  it('doygun renk tabanda uca göre daha doygun', () => {
    const sat = (c: number[]) => Math.max(...c) - Math.min(...c);
    expect(sat(finDetail([0.8, 0.4, 0.2], 0.8, true, 0.05, 0.5, 1)[0])).toBeGreaterThan(sat(finDetail([0.8, 0.4, 0.2], 0.8, true, 0.95, 0.5, 1)[0]));
  });
});
