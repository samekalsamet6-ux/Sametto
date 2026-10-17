import { describe, expect, it } from 'vitest';
import { atlasUV, bodyFns, bodyPoint, bodySurfaceZ, cornerPath, finPoint, flankNormal, mulberry32, outline, pchip, resample, seedFor, smoothPath, swimZ, xOfT } from './yanal-model';
import { SPEC as MELEK } from '../melek/model';

describe('ortak yanal balık modeli', () => {
  it('pchip: düğümlerden geçer, monoton veride taşma yapmaz', () => {
    const f = pchip([[0, 0], [0.3, 0.5], [0.6, 0.52], [1, 1]]);
    expect(f(0)).toBe(0); expect(f(0.3)).toBeCloseTo(0.5, 9); expect(f(1)).toBe(1);
    for (let x = 0; x <= 1; x += 0.02) { expect(f(x)).toBeGreaterThanOrEqual(-1e-9); expect(f(x)).toBeLessThanOrEqual(1 + 1e-9); }
  });
  it('resample yay uzunluğuna göre eşit aralıklı; smoothPath/cornerPath uçları korur', () => {
    const r = resample([[0, 0], [1, 0], [1, 1]], 4);
    expect(r).toHaveLength(5); expect(r[2]).toEqual([1, 0]); expect(r[4]).toEqual([1, 1]);
    const s = smoothPath([[0, 0], [1, 1], [2, 0]], 5);
    expect(s[0]).toEqual([0, 0]); expect(s[s.length - 1]).toEqual([2, 0]);
    const c = cornerPath([[[0, 0], [1, 1], [2, 0]], [[2, 0], [3, -1], [4, 0]]], 4);
    expect(c).toContainEqual([2, 0]);
  });
  it('gövde noktaları sonlu; süper elips kesitte tepe/karın çizgisi z=0', () => {
    const b = MELEK.body;
    for (let i = 0; i <= 20; i++) for (let j = 0; j < 16; j++) expect(bodyPoint(b, i / 20, (j / 16) * Math.PI * 2).every(Number.isFinite)).toBe(true);
    const t = 0.5, f = bodyFns(b);
    expect(bodyPoint(b, t, Math.PI / 2)[1]).toBeCloseTo(f.top(t), 6);
    expect(bodyPoint(b, t, Math.PI / 2)[2]).toBeCloseTo(0, 6);
    expect(bodyPoint(b, t, 0)[2]).toBeCloseTo(f.w(t), 6);
    expect(bodyPoint(b, t, 3 * Math.PI / 2)[1]).toBeCloseTo(f.bot(t), 6);
  });
  it('yüzey z: gövde dışında 0, içinde pozitif; normal birim ve +z yönlü', () => {
    const b = MELEK.body;
    expect(bodySurfaceZ(b, 0, 2)).toBe(0);
    expect(bodySurfaceZ(b, 0, 0)).toBeGreaterThan(0.05);
    const n = flankNormal(b, 0, 0.1);
    expect(Math.hypot(...n)).toBeCloseTo(1, 6); expect(n[2]).toBeGreaterThan(0.8);
  });
  it('outline kapalı çokgen; yüzgeç noktaları taban-uç arasında; swimZ kuyruğa doğru artar, baş durağan', () => {
    const o = outline(MELEK.body, 20);
    expect(o.length).toBe(42);
    const fin = MELEK.fins[0];
    expect(finPoint(fin, 0.5, 0)[1]).toBeLessThan(finPoint(fin, 0.5, 1)[1]);
    const sw = MELEK.swim;
    expect(swimZ(sw, sw.x0 - 0.1, 1.3, 1)).toBeCloseTo(0, 9);
    const peak = (x: number) => { let m = 0; for (let t = 0; t < 6.3; t += 0.05) m = Math.max(m, Math.abs(swimZ(sw, x, t, 1))); return m; };
    expect(peak(sw.x1)).toBeGreaterThan(peak((sw.x0 + sw.x1) / 2));
    expect(swimZ(sw, 0.5, 1, 0)).toBeCloseTo(0, 9);
  });
  it('atlas eşlemesi: köşeler 0..1; üreteç deterministik', () => {
    const a = MELEK.atlas;
    expect(atlasUV(a, a.x0, a.y1)).toEqual([0, 0]); expect(atlasUV(a, a.x1, a.y0)).toEqual([1, 1]);
    const p = mulberry32(5), q = mulberry32(5);
    for (let i = 0; i < 5; i++) expect(p()).toBe(q());
    expect(seedFor('a')).not.toBe(seedFor('b'));
    expect(xOfT(MELEK.body, 0)).toBe(MELEK.body.xs);
  });
});
