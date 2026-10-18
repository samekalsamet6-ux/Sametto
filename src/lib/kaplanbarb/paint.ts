// Kaplan barba özgü ek boyama (ortak boyayıcıdan sonra): sırt yüzgecinde siyah bant ve kırmızı kenar,
// anal yüzgeçte turuncu kenar, ışınlar. Siyah bant yoğunluğu renk hattına göre değişir (altın/albino soluk).
import { rgba } from '../akvaryum/yanal-texture';
import { finOutline, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

/** Sırt yüzgeci siyah bandı: renk ve erkekteki yoğunluk (dişide biraz silik) */
export const DORSAL_BAND: Record<string, { c: string; a: number }> = {
  normal: { c: '#0c0a08', a: 0.9 }, yesil: { c: '#06100a', a: 0.8 }, albino: { c: '#b8a58a', a: 0.28 },
  altin: { c: '#8a6a30', a: 0.22 }, platin: { c: '#6a665c', a: 0.3 }, cam: { c: '#8c8466', a: 0.3 },
};

export function decorateKaplan(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant, sex: SexId): void {
  const c = tex.map.getContext('2d');
  if (!c) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const band = DORSAL_BAND[variant.id] ?? DORSAL_BAND.normal;
  const lerpPt = (a: Pt, b: Pt, r: number): Pt => [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];
  const strip = (fin: { base: Pt[]; edge: Pt[] }, r0: number, r1: number, color: string) => {
    const n = fin.base.length - 1;
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i <= n; i++) { const [x, y] = px(...lerpPt(fin.base[i], fin.edge[i], r0)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    for (let i = n; i >= 0; i--) { const [x, y] = px(...lerpPt(fin.base[i], fin.edge[i], r1)); c.lineTo(x, y); }
    c.closePath(); c.fill();
  };
  spec.fins.forEach((fin, fi) => {
    c.save();
    c.beginPath();
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath(); c.clip();
    if (fi === 0) {
      // siyah bant (tabana yakın ortada) + kırmızı–turuncu dış kenar
      strip(fin, 0.12, 0.7, rgba(band.c, band.a * (sex === 'disi' ? 0.85 : 1)));
      strip(fin, 0.74, 1.01, rgba(variant.yuzgec.isin, sex === 'disi' ? 0.7 : 0.92));
    } else if (fi === 1) {
      strip(fin, 0.62, 1.01, rgba(variant.yuzgec.isin, sex === 'disi' ? 0.35 : 0.6));
    } else {
      strip(fin, 0.0, 1.0, rgba(variant.yuzgec.isin, sex === 'disi' ? 0.1 : 0.18));
    }
    c.lineCap = 'round';
    c.lineWidth = sc * 0.0014;
    const n = fin.base.length - 1;
    for (let i = 0; i < n; i++) {
      const b = lerpPt(fin.base[i], fin.base[i + 1], 0.5), e = lerpPt(fin.edge[i], fin.edge[i + 1], 0.5);
      const [a, bb] = px(...lerpPt(b, e, 0.35 + 0.1 * Math.sin(i * 12.9898)));
      const [x, y] = px(e[0], e[1]);
      c.strokeStyle = rgba(fi === 0 ? '#1a0c08' : variant.yuzgec.isin, 0.28);
      c.beginPath(); c.moveTo(a, bb); c.lineTo(x, y); c.stroke();
    }
    c.restore();
  });
}
