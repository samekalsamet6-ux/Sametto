// Zebra danioya özgü ek boyama (ortak boyayıcıdan sonra): solungaç kapağından kuyruk yüzgecine uzanan yatay çizgiler
// (kuyruk yüzgecine kesintisiz devam eder), anal/sırt yüzgecinde çizgi, leoparda benekler.
import { rgba } from '../akvaryum/yanal-texture';
import { bodyFns, finOutline, mulberry32, seedFor, xOfT, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export type StripeMode = 'stripes' | 'spots' | 'broken';
export interface StripeStyle { mode: StripeMode; c: string; a: number; /** çizgi yarı genişliği (gövde yüksekliğinin oranı) */ hw: number }

/** Renk hattına göre çizgi/benek stili (variants.ts renk kimlikleriyle eşleşir) */
export const STRIPES: Record<string, StripeStyle> = {
  normal: { mode: 'stripes', c: '#1a2f80', a: 0.9, hw: 0.044 },
  leopar: { mode: 'spots', c: '#1f2c6e', a: 0.88, hw: 0.044 },
  altin: { mode: 'stripes', c: '#d9a21c', a: 0.62, hw: 0.044 },
  albino: { mode: 'stripes', c: '#b9906c', a: 0.5, hw: 0.044 },
  hibrit: { mode: 'broken', c: '#223c94', a: 0.9, hw: 0.044 },
};

/** Çizgi merkezleri (sırttan karına 0..1); beş koyu çizgi, aralarında açık şeritler */
export const STRIPE_NY = [0.16, 0.31, 0.46, 0.61, 0.76];
/** Çizgilerin başladığı konum (solungaç kapağının arkası, 0..1 gövde boyunca) */
export const STRIPE_T0 = 0.255;

export function decorateZebra(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant, sex: SexId): void {
  const c = tex.map.getContext('2d');
  if (!c) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const st = STRIPES[variant.id] ?? STRIPES.normal;
  const b = spec.body, f = bodyFns(b);
  const rnd = mulberry32(seedFor('zebra' + variant.id));
  const lerpPt = (a: Pt, bb: Pt, r: number): Pt => [a[0] + (bb[0] - a[0]) * r, a[1] + (bb[1] - a[1]) * r];
  const bodyXY = (t: number, ny: number): Pt => [xOfT(b, t), f.top(t) - ny * (f.top(t) - f.bot(t))];
  const bodyClip = () => {
    c.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) { const [x, y] = px(...bodyXY(i / N, 0)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const [x, y] = px(...bodyXY(i / N, 1)); c.lineTo(x, y); }
    c.closePath();
  };
  const finClip = (fin: { base: Pt[]; edge: Pt[] }) => {
    c.beginPath();
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath();
  };
  const poly = (pts: Pt[], style: string | CanvasGradient) => {
    c.fillStyle = style;
    c.beginPath();
    pts.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath(); c.fill();
  };
  const femaleK = sex === 'disi' ? 0.88 : 1;
  const caudal = spec.fins[2];
  const xe = xOfT(b, 1);
  const cEnd = Math.max(...caudal.edge.map((p) => p[0]));

  // ---- gövde ve kuyruk yüzgecinde yatay çizgiler (kesintisiz)
  if (st.mode !== 'spots') {
    for (const ny of STRIPE_NY) {
      // kesikli (hibrit) modda gövde boyunca rastgele boşluklar bırak
      const segs: [number, number][] = [];
      if (st.mode === 'broken') {
        let t = STRIPE_T0;
        while (t < 1) { const len = 0.05 + rnd() * 0.12; segs.push([t, Math.min(1, t + len)]); t += len + 0.025 + rnd() * 0.05; }
      } else segs.push([STRIPE_T0, 1.0]);
      c.save();
      bodyClip(); c.clip();
      for (const [ta, tb] of segs) {
        const up: Pt[] = [], dn: Pt[] = [];
        const n = Math.max(6, Math.round((tb - ta) * 70));
        for (let i = 0; i <= n; i++) {
          const t = ta + ((tb - ta) * i) / n;
          // başta (ve kesikli modda sonda) yumuşak sivrilme; sürekli çizgi arkada tam genişlikte kuyruğa geçer
          const head = Math.min(1, (t - ta) / 0.05 + 0.3);
          const tail = st.mode === 'broken' ? Math.min(1, (tb - t) / 0.04 + 0.3) : 1;
          const hw = st.hw * head * tail;
          up.push(bodyXY(t, ny - hw)); dn.push(bodyXY(t, ny + hw));
        }
        for (const [grow, al] of [[1.35, 0.3], [1, 1]] as const) {
          const u2 = up.map((p, i) => lerpPt([(p[0] + dn[i][0]) / 2, (p[1] + dn[i][1]) / 2], p, grow));
          const d2 = dn.map((p, i) => lerpPt([(p[0] + up[i][0]) / 2, (p[1] + up[i][1]) / 2], p, grow));
          poly([...u2, ...d2.reverse()], rgba(st.c, st.a * al * femaleK));
        }
      }
      c.restore();
      // kuyruk yüzgecine devam: üç merkez çizgi uçtan önce solar
      if (ny > 0.3 && ny < 0.8) {
        c.save();
        finClip(caudal); c.clip();
        const yEnd = (t: number) => f.top(1) - (ny + (t - 0) * 0) * (f.top(1) - f.bot(1));
        const y0 = yEnd(1);
        const [gx0] = px(xe, 0), [gx1] = px(cEnd, 0);
        const gr = c.createLinearGradient(gx0, 0, gx1, 0);
        gr.addColorStop(0, rgba(st.c, st.a * femaleK));
        gr.addColorStop(0.75, rgba(st.c, st.a * 0.55 * femaleK));
        gr.addColorStop(1, rgba(st.c, 0));
        const up: Pt[] = [], dn: Pt[] = [];
        const hw0 = st.hw * (f.top(1) - f.bot(1));
        for (let i = 0; i <= 20; i++) {
          const u = i / 20, x = xe + (cEnd - xe) * u;
          const spread = 1 + 1.1 * u; // ışınlar yelpaze gibi açılır
          const wid = hw0 * (1 - 0.35 * u);
          up.push([x, y0 * spread + wid]); dn.push([x, y0 * spread - wid]);
        }
        poly([...up, ...dn.reverse()], gr);
        c.restore();
      }
    }
  }

  // ---- leopar: gövdeye ve kuyruğa dağılmış benekler
  if (st.mode === 'spots') {
    c.save();
    bodyClip(); c.clip();
    for (let i = 0; i < 150; i++) {
      const t = STRIPE_T0 - 0.04 + rnd() * (1.04 - (STRIPE_T0 - 0.04)), ny = 0.08 + rnd() * 0.78;
      const [x, y] = px(...bodyXY(t, ny));
      const r = sc * (0.0042 + rnd() * 0.0048) * (0.7 + 0.5 * (1 - t));
      c.fillStyle = rgba(st.c, st.a * (0.65 + rnd() * 0.35) * femaleK);
      c.beginPath(); c.ellipse(x, y, r * (1 + rnd() * 0.6), r, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    c.save();
    finClip(caudal); c.clip();
    for (let i = 0; i < 26; i++) {
      const u = rnd() * 0.8, x = xe + (cEnd - xe) * u, y = (rnd() - 0.5) * 0.12 * (0.5 + u);
      const [pxx, pyy] = px(x, y);
      c.fillStyle = rgba(st.c, st.a * 0.7 * femaleK);
      c.beginPath(); c.arc(pxx, pyy, sc * (0.0035 + rnd() * 0.003), 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  // ---- anal ve sırt yüzgeci: tabana paralel koyu şerit
  for (const fi of [0, 1]) {
    const fin = spec.fins[fi];
    c.save();
    finClip(fin); c.clip();
    const n = fin.base.length - 1;
    const r0 = fi === 1 ? 0.3 : 0.28, r1 = fi === 1 ? 0.5 : 0.48;
    c.fillStyle = rgba(st.mode === 'spots' ? '#2b3568' : st.c, (st.mode === 'spots' ? 0.3 : st.a * (fi === 1 ? 0.7 : 0.4)) * femaleK);
    c.beginPath();
    for (let i = 0; i <= n; i++) { const [x, y] = px(...lerpPt(fin.base[i], fin.edge[i], r0)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    for (let i = n; i >= 0; i--) { const [x, y] = px(...lerpPt(fin.base[i], fin.edge[i], r1)); c.lineTo(x, y); }
    c.closePath(); c.fill();
    c.restore();
  }
  // ---- ince ışınlar
  for (const fin of spec.fins) {
    c.save();
    finClip(fin); c.clip();
    c.lineCap = 'round';
    c.lineWidth = sc * 0.0014;
    const n = fin.base.length - 1;
    c.strokeStyle = rgba(variant.yuzgec.isin, 0.3);
    for (let i = 0; i < n; i++) {
      const bb = lerpPt(fin.base[i], fin.base[i + 1], 0.5), e = lerpPt(fin.edge[i], fin.edge[i + 1], 0.5);
      const [a, b2] = px(...lerpPt(bb, e, 0.35 + 0.1 * Math.sin(i * 12.9898)));
      const [x, y] = px(e[0], e[1]);
      c.beginPath(); c.moveTo(a, b2); c.lineTo(x, y); c.stroke();
    }
    c.restore();
  }
}
