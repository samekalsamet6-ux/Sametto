import { describe, expect, it } from 'vitest';
import { bodyShape, flankProfile, mouthCutT, mouthStation, MOUTH_SHEAR } from './body';
import { EYE_DEPTH } from './model';
import { eyeSpec as GEYE, BODY as GB, mouthT0 as GMOUTH } from '../guppy/model';
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

describe('göz ve ağız (ortak kurallar)', () => {
  const species = [
    ['lepistes', GB, GEYE, GMOUTH, GP, GS],
    ['molly', MB, MOLLY.eyeSpec, MOLLY.mouthT0, MOLLY.bodyProfile, MOLLY.bodySurfacePoint],
    ['plati', PLATY.BODY, PLATY.eyeSpec, PLATY.mouthT0, PLATY.bodyProfile, PLATY.bodySurfacePoint],
  ] as const;

  it('göz küresi yüzeye gömülü: yalnızca hafif şişkinlik dışarıda, plaka gibi değil', () => {
    expect(EYE_DEPTH).toBeGreaterThan(0.5);
    expect(EYE_DEPTH).toBeLessThan(0.9);
    for (const [, BODY, eyeSpec, , bodyProfile] of species) for (const s of GSEX) {
      const e = eyeSpec(s), pr = bodyProfile(s, 0.118);
      // göz yarıçapı baş yüksekliğine göre büyük ama dev değil (gövde yüksekliğinin ~%8–22'si)
      expect(e.radius / BODY[s].height).toBeGreaterThan(0.08);
      expect(e.radius / BODY[s].height).toBeLessThan(0.22);
      // küre merkezi gövde yarı genişliğinin içinde, dışarı taşan kısım yarıçapın yarısından az
      expect(e.center[2]).toBeLessThan(pr.rz);
      expect(e.center[2] + e.radius - pr.rz).toBeLessThan(0.5 * e.radius);
    }
  });

  it('ağız halkası burunda, gözden önce; alt çene (karın) üst çeneden (sırt) ileride: ağız yukarı bakar', () => {
    for (const [, BODY, eyeSpec, mouthT0] of species) for (const s of GSEX) {
      const t0 = mouthT0(s);
      expect(t0).toBeGreaterThan(0.004);
      expect(t0).toBeLessThan(0.05);
      expect(t0 * BODY[s].length - BODY[s].length / 2).toBeLessThan(eyeSpec(s).center[0]);
      expect(mouthCutT(t0, 0)).toBeLessThan(mouthCutT(t0, Math.PI));
      expect(mouthCutT(t0, 0)).toBeGreaterThan(0); // alt çene ucu gövdenin dışına taşmaz
      expect(mouthCutT(t0, Math.PI / 2)).toBeCloseTo(t0, 9); // yan köşelerde değişmez
      expect(MOUTH_SHEAR).toBeGreaterThan(0);
    }
  });

  it('ağız genişliği gövde genişliğinin küçük bir oranı; halka kesiti açık (sıfır değil)', () => {
    for (const [, BODY, , mouthT0, bodyProfile] of species) for (const s of GSEX) {
      const pr = bodyProfile(s, mouthT0(s));
      expect(pr.rz / (BODY[s].width / 2)).toBeLessThan(0.55);
      expect(pr.up + pr.down).toBeGreaterThan(0.03);
    }
  });

  it('mouthStation hedef yarı genişliği bulur ve alt sınırı korur', () => {
    expect(mouthStation((t) => t * 2, 1, 0.05)).toBeCloseTo(0.025, 3);
    expect(mouthStation(() => 10, 1)).toBeGreaterThanOrEqual(0.005);
  });
});
