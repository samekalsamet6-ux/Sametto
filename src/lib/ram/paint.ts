// Ram çikliti (Mikrogeophagus ramirezi) için ek boyama (ortak boyayıcıdan sonra): göz çubuğu, gövde lekesi, parlak mavi benekler,
// baş/karın sıcak tonları, dişide pembe karın lekesi ve dikenli sırt yüzgecinin siyah–kırmızı renkleri.
import { rgba } from '../akvaryum/yanal-texture';
import { bodyFns, finOutline, mulberry32, seedFor, xOfT, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';
import type { SexId } from '../akvaryum/types';

export interface RamStyle {
  /** Göz çubuğu ve gövde lekesi yoğunluğu (0..1) */
  bar: number; spot: number;
  /** Parlak benek rengi, yoğunluk (0..1) */
  spangle: string; spangleN: number;
  /** Baş/göğüs rengi ve yoğunluk; karın (kırmızımsı) rengi ve yoğunluk */
  head: string; headA: number; belly: string; bellyA: number;
  /** Dikenli sırt yüzgeci: diken rengi ve yoğunluk, üst kenar rengi */
  spine: string; spineA: number; edge: string; edgeA: number;
  /** Yumuşak yüzgeç tonu */
  soft: string; softA: number;
}

/** Renk hattına göre stil (variants.ts kimlikleriyle eşleşir) */
export const STYLES: Record<string, RamStyle> = {
  normal: { bar: 1, spot: 1, spangle: '#3fd0ff', spangleN: 1, head: '#f0a530', headA: 0.55, belly: '#e5532f', bellyA: 0.35, spine: '#08080c', spineA: 0.92, edge: '#e8402a', edgeA: 0.95, soft: '#7fa6e6', softA: 0.28 },
  gold: { bar: 0.38, spot: 0.4, spangle: '#bfe6ff', spangleN: 0.5, head: '#ffb43c', headA: 0.4, belly: '#f08a40', bellyA: 0.3, spine: '#6a5a20', spineA: 0.55, edge: '#f08030', edgeA: 0.9, soft: '#f3dc8c', softA: 0.3 },
  elektrik: { bar: 0.3, spot: 0.45, spangle: '#9be8ff', spangleN: 1.4, head: '#f2b83c', headA: 0.5, belly: '#e5603a', bellyA: 0.22, spine: '#0a1030', spineA: 0.75, edge: '#e8502e', edgeA: 0.85, soft: '#4f8ef0', softA: 0.4 },
  siyah: { bar: 0.1, spot: 0.1, spangle: '#6fc8f0', spangleN: 0.7, head: '#3a2a20', headA: 0.1, belly: '#8a2a20', bellyA: 0.12, spine: '#000000', spineA: 0.95, edge: '#6a1c1c', edgeA: 0.6, soft: '#40475c', softA: 0.35 },
  albino: { bar: 0, spot: 0, spangle: '#e6f6ff', spangleN: 0.35, head: '#ffc468', headA: 0.4, belly: '#f58a64', bellyA: 0.3, spine: '#e8a070', spineA: 0.45, edge: '#f07a50', edgeA: 0.85, soft: '#fbe8d4', softA: 0.25 },
};

/** Gövde üzerindeki konumlar (t: burundan kuyruk sapına 0..1; ny: sırttan karına 0..1) ve ölçüler (birim) */
export const SPOT = { t: 0.41, ny: 0.3, rx: 0.036, ry: 0.048 };
/** Dişide karın lekesi merkezi */
export const BELLY = { t0: 0.26, t1: 0.64, ny: 0.84, hw: 0.17 };
/** Dikenli (ön) sırt bölümü: yüzgeç boyunca s < SPINY_S */
export const SPINY_S = 0.46;

export function decorateRam(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant, sex: SexId): void {
  const c = tex.map.getContext('2d');
  if (!c) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const st = STYLES[variant.id] ?? STYLES.normal;
  const b = spec.body, f = bodyFns(b);
  const rnd = mulberry32(seedFor('ram' + variant.id + sex));
  const bodyXY = (t: number, ny: number): Pt => [xOfT(b, t), f.top(t) - ny * (f.top(t) - f.bot(t))];
  const lerp = (a: Pt, bb: Pt, r: number): Pt => [a[0] + (bb[0] - a[0]) * r, a[1] + (bb[1] - a[1]) * r];
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
  const blob = (x: number, y: number, rx: number, ry: number, col: string, a: number) => {
    c.save(); c.translate(x, y); c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.6, rgba(col, a * 0.6)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
  };
  const dot = (x: number, y: number, r: number, col: string, a: number) => {
    c.fillStyle = rgba(col, a); c.beginPath(); c.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2); c.fill();
  };

  // ---- gövde
  c.save(); bodyClip(); c.clip();
  // baş ve göğüs sıcak tonu, karın kırmızımsı
  {
    const [hx, hy] = px(...bodyXY(0.17, 0.5)); blob(hx, hy, sc * 0.24, sc * 0.26, st.head, st.headA * 1.3);
    const [gx, gy] = px(...bodyXY(0.3, 0.8)); blob(gx, gy, sc * 0.24, sc * 0.13, st.belly, st.bellyA * 1.3);
    // sırt koyulaşması
    const [rx, ry] = px(...bodyXY(0.55, 0.0)); blob(rx, ry, sc * 0.4, sc * 0.1, variant.govde.sirt, 0.5);
  }
  // dişide pembe–kırmızı karın lekesi
  if (sex === 'disi') {
    const [x, y] = px(...bodyXY((BELLY.t0 + BELLY.t1) / 2, BELLY.ny));
    blob(x, y, sc * BELLY.hw, sc * 0.075, variant.id === 'siyah' ? '#9a3a4a' : '#ee5a78', variant.id === 'siyah' ? 0.4 : 0.72);
  }
  // parlak mavi benekler: yanlarda ve alında yoğun, karında seyrek
  const nSp = Math.round(300 * st.spangleN);
  for (let i = 0; i < nSp; i++) {
    const head = rnd() < 0.22;
    const t = head ? 0.06 + rnd() * 0.16 : 0.2 + rnd() * 0.77;
    const ny = head ? rnd() * 0.5 : 0.04 + Math.pow(rnd(), 1.3) * 0.72;
    const [x, y] = px(...bodyXY(t, ny));
    const r = sc * (0.0028 + rnd() * 0.004);
    dot(x, y, r, st.spangle, 0.5 + rnd() * 0.45);
    if (rnd() < 0.3) dot(x, y, r * 0.45, '#ffffff', 0.8);
  }
  // gövde lekesi: erkekte düz koyu, dişide çevresinde mavi benekler (zayıf ve tutarsız ayrım, doğrulanmalı)
  if (st.spot > 0.02) {
    const [sx, sy] = px(...bodyXY(SPOT.t, SPOT.ny));
    c.save(); c.translate(sx, sy); c.scale(sc * SPOT.rx * 1.35, sc * SPOT.ry * 1.35);
    let g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, rgba('#000000', 0.9 * st.spot)); g.addColorStop(0.6, rgba('#000000', 0.55 * st.spot)); g.addColorStop(1, rgba('#000000', 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill(); c.restore();
    if (sex === 'disi') {
      for (let i = 0; i < 26; i++) {
        const a = rnd() * Math.PI * 2, rr = 1.0 + rnd() * 0.55;
        dot(sx + Math.cos(a) * sc * SPOT.rx * rr, sy + Math.sin(a) * sc * SPOT.ry * rr, sc * 0.0032, st.spangle, 0.85);
      }
    }
  }
  // göz çubuğu: alından göze, oradan çeneye inen siyah şerit (hafif öne eğimli)
  if (st.bar > 0.02) {
    const ex = spec.eye.x;
    const top = f.top(Math.max(0, (ex - b.xs) / (b.xe - b.xs)));
    const [x0, y0] = px(ex + 0.02, top + 0.02), [x1, y1] = px(ex - 0.012, f.bot(0.1) - 0.02);
    c.lineCap = 'round';
    for (const [w, a] of [[0.075, 0.18], [0.052, 0.4], [0.035, 0.96]] as const) {
      c.strokeStyle = rgba('#050507', a * st.bar); c.lineWidth = sc * w;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
  }
  c.restore();

  // ---- sırt yüzgeci: ön kısım dikenli (siyah, kırmızı kenarlı), arka kısım yumuşak ve mavi benekli
  {
    const fin = spec.fins[0], n = fin.base.length - 1;
    c.save(); finClip(fin); c.clip();
    for (let i = 0; i < n; i++) {
      const s = i / n;
      const quad = (r0: number, r1: number, col: string, a: number) => {
        const p0 = lerp(fin.base[i], fin.edge[i], r0), p1 = lerp(fin.base[i + 1], fin.edge[i + 1], r0);
        const p2 = lerp(fin.base[i + 1], fin.edge[i + 1], r1), p3 = lerp(fin.base[i], fin.edge[i], r1);
        c.fillStyle = rgba(col, a); c.beginPath();
        [p0, p1, p2, p3].forEach((p, k) => { const [x, y] = px(p[0], p[1]); if (k) c.lineTo(x, y); else c.moveTo(x, y); });
        c.closePath(); c.fill();
      };
      const e = 0.0015;
      if (s < SPINY_S) {
        const k = 1 - 0.35 * (s / SPINY_S);
        quad(0, 1, st.spine, st.spineA * 0.7 * k);
        quad(0.86, 1.02, st.edge, st.edgeA * 0.8);
      } else {
        quad(0, 1, st.soft, st.softA);
        quad(0.9, 1.02, st.edge, st.edgeA * 0.45);
      }
      void e;
    }
    // benekler yumuşak bölümde
    for (let i = 0; i < Math.round(60 * st.spangleN); i++) {
      const s = SPINY_S + rnd() * (1 - SPINY_S - 0.04), r = 0.15 + rnd() * 0.65;
      const j = Math.min(n - 1, Math.floor(s * n));
      const p = lerp(lerp(fin.base[j], fin.base[j + 1], 0.5), lerp(fin.edge[j], fin.edge[j + 1], 0.5), r);
      const [x, y] = px(p[0], p[1]);
      dot(x, y, sc * 0.0022, st.spangle, 0.8);
    }
    c.restore();
  }
  // ---- anal yüzgeç: ön dikenler koyu, kenar mavi/kırmızımsı
  {
    const fin = spec.fins[1], n = fin.base.length - 1;
    c.save(); finClip(fin); c.clip();
    for (let i = 0; i < n; i++) {
      const s = i / n;
      const col = s < 0.22 ? st.spine : st.soft, a = s < 0.22 ? st.spineA * 0.55 : st.softA * 0.9;
      const p0 = fin.base[i], p1 = fin.base[i + 1], p2 = fin.edge[i + 1], p3 = fin.edge[i];
      c.fillStyle = rgba(col, a); c.beginPath();
      [p0, p1, p2, p3].forEach((p, k) => { const [x, y] = px(p[0], p[1]); if (k) c.lineTo(x, y); else c.moveTo(x, y); });
      c.closePath(); c.fill();
    }
    c.strokeStyle = rgba(st.edge, st.edgeA * 0.5); c.lineWidth = sc * 0.004; c.beginPath();
    fin.edge.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    c.restore();
  }
  // ---- kuyruk: seyrek mavi benekler ve silik kenar
  {
    const fin = spec.fins[2];
    c.save(); finClip(fin); c.clip();
    for (let i = 0; i < Math.round(45 * st.spangleN); i++) {
      const j = Math.floor(rnd() * (fin.base.length - 1));
      const p = lerp(fin.base[j], fin.edge[j], 0.2 + rnd() * 0.7);
      const [x, y] = px(p[0], p[1]);
      dot(x, y, sc * 0.002, st.spangle, 0.7);
    }
    c.strokeStyle = rgba(st.edge, st.edgeA * 0.35); c.lineWidth = sc * 0.004; c.beginPath();
    fin.edge.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
    c.restore();
  }
  // ---- ince ışınlar
  for (let fi = 0; fi < 3; fi++) {
    const fin = spec.fins[fi];
    c.save(); finClip(fin); c.clip();
    c.lineCap = 'round'; c.lineWidth = sc * 0.0014;
    c.strokeStyle = rgba(variant.yuzgec.isin, 0.28);
    const n = fin.base.length - 1;
    for (let i = 0; i < n; i++) {
      const bb = lerp(fin.base[i], fin.base[i + 1], 0.5), e = lerp(fin.edge[i], fin.edge[i + 1], 0.5);
      const [a, b2] = px(...lerp(bb, e, 0.3 + 0.1 * Math.sin(i * 12.9898)));
      const [x, y] = px(e[0], e[1]);
      c.beginPath(); c.moveTo(a, b2); c.lineTo(x, y); c.stroke();
    }
    c.restore();
  }
}
