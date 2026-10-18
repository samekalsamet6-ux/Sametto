// Kardinal tetraya özgü ek boyama (ortak boyayıcıdan sonra): gözün hizasından yağ yüzgecine uzanan iridofor mavi-yeşil şerit
// ve onun ALTINDA, solungaç kapağından kuyruk köküne TÜM gövde boyunca uzanan kırmızı şerit (neonda kırmızı yalnızca arka yarıdadır).
import { rgba } from '../akvaryum/yanal-texture';
import { bodyFns, finOutline, mulberry32, seedFor, xOfT, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export interface StripeStyle {
  /** Mavi-yeşil şerit: üst, orta, alt renkleri ve yoğunluk */
  blue: [string, string, string]; blueA: number;
  /** Kırmızı şerit rengi ve yoğunluk */
  red: string; redA: number;
  /** Sırtta yansıtıcı (pırıltılı) pul yoğunluğu 0..1 */
  sparkle: number;
}

/** Renk hattına göre şerit stili (variants.ts kimlikleriyle eşleşir) */
export const STRIPES: Record<string, StripeStyle> = {
  normal: { blue: ['#1a38d0', '#22c8ff', '#2be0b8'], blueA: 0.95, red: '#e0141e', redA: 0.96, sparkle: 0 },
  diamond: { blue: ['#1a38d0', '#22c8ff', '#2be0b8'], blueA: 0.95, red: '#e0141e', redA: 0.96, sparkle: 1 },
  gold: { blue: ['#8fb2d6', '#c4e4ee', '#bfe6d4'], blueA: 0.8, red: '#e0141e', redA: 0.96, sparkle: 0 },
  albino: { blue: ['#b6c6e6', '#d4e6f2', '#d6ecde'], blueA: 0.55, red: '#ec6a6a', redA: 0.55, sparkle: 0 },
};

/** Mavi şerit: yatay konum aralığı (gövde boyunca 0..1) ve merkez/yarı genişlik (sırttan karına 0..1) */
export const BLUE = { t0: 0.09, t1: 0.9, ny: 0.34, hw: 0.085 };
/** Kırmızı şerit: solungaç kapağının arkasından kuyruk köküne TAM boy; merkez ve yarı genişlik */
export const RED = { t0: 0.18, t1: 1.0, ny: 0.65, hw: 0.155 };

export function decorateKardinal(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant, sex: SexId): void {
  const c = tex.map.getContext('2d');
  if (!c) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const st = STRIPES[variant.id] ?? STRIPES.normal;
  const b = spec.body, f = bodyFns(b);
  const rnd = mulberry32(seedFor('kardinal' + variant.id));
  const lerpPt = (a: Pt, bb: Pt, r: number): Pt => [a[0] + (bb[0] - a[0]) * r, a[1] + (bb[1] - a[1]) * r];
  const bodyXY = (t: number, ny: number): Pt => [xOfT(b, t), f.top(t) - ny * (f.top(t) - f.bot(t))];
  const femaleK = sex === 'disi' ? 0.94 : 1;
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
  type Band = { up: Pt[]; dn: Pt[] };
  const outlineOf = (t0: number, t1: number, nyC: number, hw: number, taper0: number, taper1: number): Band => {
    const n = 90, up: Pt[] = [], dn: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n;
      const head = Math.min(1, (t - t0) / taper0 + 0.2), tail = Math.min(1, (t1 - t) / taper1 + 0.2);
      const h = hw * head * tail;
      up.push(bodyXY(t, nyC - h)); dn.push(bodyXY(t, nyC + h));
    }
    return { up, dn };
  };
  /** Dikey degradeli şerit (her dilim kendi yüksekliğine göre boyanır): renkler üstten alta */
  const vband = (bd: Band, stops: [number, string][]) => {
    for (let i = 0; i < bd.up.length - 1; i++) {
      const q: Pt[] = [bd.up[i], bd.up[i + 1], bd.dn[i + 1], bd.dn[i]];
      const [, y0] = px(...bd.up[i]), [, y1] = px(...bd.dn[i]);
      const g = c.createLinearGradient(0, y0, 0, y1);
      for (const [o, col] of stops) g.addColorStop(o, col);
      // dilimler arası ince dikişi önlemek için hafif taşır
      const e = 0.0015;
      poly([[q[0][0] - e, q[0][1]], [q[1][0] + e, q[1][1]], [q[2][0] + e, q[2][1]], [q[3][0] - e, q[3][1]]], g);
    }
  };

  // ---- kırmızı şerit: TAM boy (solungaç kapağından kuyruk köküne); dikey degrade, kenarlar yumuşak
  c.save(); bodyClip(); c.clip();
  {
    const ra = st.redA * femaleK;
    const glow = outlineOf(RED.t0 - 0.01, RED.t1, RED.ny, RED.hw * 1.2, 0.08, 0.02);
    vband(glow, [[0, rgba(st.red, 0)], [0.25, rgba(st.red, ra * 0.35)], [0.75, rgba(st.red, ra * 0.35)], [1, rgba(st.red, 0)]]);
    const core = outlineOf(RED.t0, RED.t1, RED.ny, RED.hw, 0.05, 0.02);
    vband(core, [[0, rgba(st.red, ra * 0.55)], [0.3, rgba(st.red, ra)], [0.7, rgba(st.red, ra)], [1, rgba(st.red, ra * 0.5)]]);
  }
  c.restore();

  // ---- iridofor mavi-yeşil şerit: gözün hizasından yağ yüzgecine; üstte koyu mavi, ortada turkuaz, altta yeşilimsi
  c.save(); bodyClip(); c.clip();
  {
    const ba = st.blueA * femaleK;
    const halo = outlineOf(BLUE.t0, BLUE.t1, BLUE.ny, BLUE.hw * 1.35, 0.1, 0.1);
    vband(halo, [[0, rgba(st.blue[0], 0)], [0.5, rgba(st.blue[1], ba * 0.3)], [1, rgba(st.blue[2], 0)]]);
    const core = outlineOf(BLUE.t0, BLUE.t1, BLUE.ny, BLUE.hw, 0.12, 0.08);
    vband(core, [[0, rgba(st.blue[0], ba)], [0.45, rgba(st.blue[1], ba)], [1, rgba(st.blue[2], ba * 0.92)]]);
    // parıltı: şerit içinde ince, açık yansımalar (ışığa göre kayan renk izlenimi)
    c.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const t = BLUE.t0 + 0.05 + rnd() * (BLUE.t1 - BLUE.t0 - 0.08), ny = BLUE.ny + (rnd() - 0.5) * BLUE.hw * 1.5;
      const [x, y] = px(...bodyXY(t, ny));
      c.fillStyle = rgba('#e8ffff', ba * (0.12 + rnd() * 0.22));
      c.beginPath(); c.ellipse(x, y, sc * (0.004 + rnd() * 0.004), sc * 0.0016, 0, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();

  // ---- sırtta yansıtıcı pırıltılı pullar (diamond'da yoğun)
  if (st.sparkle > 0.05) {
    c.save(); bodyClip(); c.clip();
    const cnt = Math.round(190 * st.sparkle);
    for (let i = 0; i < cnt; i++) {
      const t = 0.1 + rnd() * 0.88, ny = 0.02 + rnd() * 0.24;
      const [x, y] = px(...bodyXY(t, ny));
      c.fillStyle = rgba(rnd() < 0.5 ? '#d8fbff' : '#ffffff', 0.35 + rnd() * 0.45);
      c.beginPath(); c.ellipse(x, y, sc * (0.0032 + rnd() * 0.003), sc * (0.0022 + rnd() * 0.002), 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  // ---- ince ışınlar (yüzgeçler saydam; yağ yüzgeci ışınsızdır)
  for (let fi = 0; fi < 3; fi++) {
    const fin = spec.fins[fi];
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
