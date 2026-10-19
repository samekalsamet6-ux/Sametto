// Cüce guramiye özgü ek boyama (ortak boyayıcıdan sonra): yüzgeçlerde ikincil ışınlar ve uçta ince renkli kenar.
import { rgba } from '../akvaryum/yanal-texture';
import { finOutline, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';

export function decorateGurami(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant): void {
  const c = tex.map.getContext('2d');
  if (!c) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  for (const fin of spec.fins) {
    const n = fin.base.length - 1;
    c.save();
    c.beginPath();
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath(); c.clip();
    c.lineCap = 'round';
    c.lineWidth = sc * 0.0014;
    for (let i = 0; i < n; i++) {
      const bx = (fin.base[i][0] + fin.base[i + 1][0]) / 2, by = (fin.base[i][1] + fin.base[i + 1][1]) / 2;
      const ex = (fin.edge[i][0] + fin.edge[i + 1][0]) / 2, ey = (fin.edge[i][1] + fin.edge[i + 1][1]) / 2;
      const r0 = 0.4 + 0.1 * Math.sin(i * 12.9898);
      const [a, b] = px(bx + (ex - bx) * r0, by + (ey - by) * r0);
      const [x, y] = px(ex, ey);
      c.strokeStyle = rgba(variant.yuzgec.isin, 0.3);
      c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke();
    }
    c.restore();
  }
}
