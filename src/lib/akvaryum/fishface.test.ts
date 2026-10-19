import { describe, expect, it } from 'vitest';
import { makeBody, midlinePoint, snoutFace, spline } from './fishmath';
import { snoutFace as flatSnout } from '../melek/model';

const body = makeBody(1, { top: spline([[0, 0.01], [0.1, 0.06], [1, 0.03]]), bot: spline([[0, -0.01], [0.1, -0.06], [1, -0.03]]), hw: spline([[0, 0.02], [0.1, 0.05], [1, 0.02]]), nose: 0.06 });

describe('fishface: ağız yerleşimi yardımcıları', () => {
  it('snoutFace yüz genişliğini aşan ilk kesiti verir; burun ucuna yakın ve orta çizgide', () => {
    const p = snoutFace(body, 0.03);
    expect(p[0]).toBeGreaterThan(-0.5);
    expect(p[0]).toBeLessThan(-0.4);
    expect(p[2]).toBe(0);
    expect(body.section((p[0] + 0.5) ).hw).toBeGreaterThan(0);
  });
  it('midlinePoint sırt-karın arasında', () => {
    const p = midlinePoint(body, 0.1, 0.5), s = body.section(0.1);
    expect(p[1]).toBeLessThan(s.yTop); expect(p[1]).toBeGreaterThan(s.yBot);
  });
  it('yanal gövdede burun yüzü burun ucunun hemen gerisinde', () => {
    expect(typeof flatSnout).toBe('function');
  });
});
