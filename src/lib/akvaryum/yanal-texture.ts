// Yanlardan basık balıklar için yan görünüş "atlas" dokusu (gövde + yüzgeçler tek tuvalde). Tarayıcıya özgü (canvas);
// birim testlerde sahte canvas ile çalıştırılır. Eşleme: planar, bkz. atlasUV.
import {
  bodyFns, finOutline, hexToRgb, mulberry32, seedFor, xOfT, type FishSpec, type FishVariant, type Layer, type Pt,
} from './yanal-model';

type Ctx = CanvasRenderingContext2D;

export function rgba(hex: string, a: number): string {
  const c = hexToRgb(hex);
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export interface FishTextures { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }

export function paintAtlas(spec: FishSpec, v: FishVariant, W = 1024): FishTextures {
  const A = spec.atlas;
  const sc = W / (A.x1 - A.x0); // 1 birim = sc piksel
  const H = Math.round((A.y1 - A.y0) * sc);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  let rnd = mulberry32(seedFor(v.id));
  const f = bodyFns(spec.body);
  const L = spec.body.xe - spec.body.xs;
  const bodyXY = (nx: number, ny: number): Pt => {
    const t = Math.min(1, Math.max(0, nx));
    return [xOfT(spec.body, t), f.top(t) - ny * (f.top(t) - f.bot(t))];
  };
  const bodyPx = (nx: number, ny: number): Pt => { const [x, y] = bodyXY(nx, ny); return px(x, y); };
  const rr = (r: [number, number]) => r[0] + rnd() * (r[1] - r[0]);

  const bodyPath = (c: Ctx) => {
    c.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) { const [x, y] = px(...bodyXY(i / N, 0)); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const [x, y] = px(...bodyXY(i / N, 1)); c.lineTo(x, y); }
    c.closePath();
  };
  const finPath = (c: Ctx, fin: { base: Pt[]; edge: Pt[] }) => {
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath();
  };

  const map = makeCanvas(W, H);
  const c = map.getContext('2d')!;
  // Saydam bölgede renk bilgisi kalsın (bilinear süzmede kenarda kararmayı azaltır)
  c.fillStyle = rgba(v.yuzgec.renk, 1 / 255);
  c.fillRect(0, 0, W, H);

  // ---------------- yüzgeçler
  for (const fin of spec.fins) {
    c.save();
    c.beginPath(); finPath(c, fin);
    c.fillStyle = rgba(v.yuzgec.renk, v.yuzgec.a);
    c.fill();
    c.restore();
    const n = fin.base.length - 1;
    c.lineCap = 'round';
    for (let i = 0; i <= n; i++) {
      const lead = i < n * 0.1;
      c.strokeStyle = rgba(v.yuzgec.isin, lead ? 0.85 : 0.5);
      c.lineWidth = sc * (lead ? 0.006 : 0.0032);
      const [a, b] = px(fin.base[i][0], fin.base[i][1]);
      const [x, y] = px(fin.edge[i][0], fin.edge[i][1]);
      c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke();
    }
    c.strokeStyle = rgba(v.yuzgec.isin, 0.7);
    c.lineWidth = sc * 0.005;
    c.beginPath();
    fin.edge.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
  }
  // göğüs yüzgeci (çok saydam)
  c.beginPath(); finPath(c, spec.pectoral);
  c.fillStyle = rgba(v.yuzgec.renk, Math.min(1, v.yuzgec.a * 0.8));
  c.fill();

  // ---------------- gövde zemin
  c.save();
  bodyPath(c);
  c.clip();
  const [, yTopPx] = px(0, Math.max(...spec.body.top.map((p) => p[1])));
  const [, yBotPx] = px(0, Math.min(...spec.body.bot.map((p) => p[1])));
  const g = c.createLinearGradient(0, yTopPx, 0, yBotPx);
  g.addColorStop(0, v.govde.sirt);
  g.addColorStop(0.45, v.govde.orta);
  g.addColorStop(1, v.govde.karin);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // pul dokusu: ince yarım daireler
  const ps = 0.034;
  c.lineWidth = sc * 0.0018;
  for (let row = 0, y = A.y0; y < A.y1; y += ps * 0.62, row++) {
    for (let x = A.x0 + (row % 2 ? ps / 2 : 0); x < A.x1; x += ps) {
      const [a, b] = px(x, y);
      c.strokeStyle = 'rgba(0,0,0,0.07)';
      c.beginPath(); c.arc(a, b, ps * sc * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.05)';
      c.beginPath(); c.arc(a, b - sc * 0.004, ps * sc * 0.5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    }
  }
  c.restore();

  // ---------------- desen katmanları
  v.katmanlar.forEach((ly, idx) => {
    const withFins = 'fin' in ly && ly.fin;
    const clips: ((c: Ctx) => void)[] = [bodyPath];
    if (withFins) for (const fin of [...spec.fins, spec.pectoral]) clips.push((cc) => { cc.beginPath(); finPath(cc, fin); });
    for (const clipFn of clips) {
      c.save();
      clipFn(c);
      c.clip();
      rnd = mulberry32(seedFor(v.id) + idx * 7919);
      paintLayer(ly);
      c.restore();
    }
  });

  function paintLayer(ly: Layer) {
    if (ly.t === 'bar') {
      const [cx, cy] = bodyPx(ly.nx, 0.5);
      const half = ly.w * L * sc;
      const soft = ly.soft ?? 0.35;
      const gr = c.createLinearGradient(cx - half, 0, cx + half, 0);
      gr.addColorStop(0, rgba(ly.renk, 0));
      gr.addColorStop(soft, rgba(ly.renk, ly.a));
      gr.addColorStop(1 - soft, rgba(ly.renk, ly.a));
      gr.addColorStop(1, rgba(ly.renk, 0));
      c.fillStyle = gr;
      const sl = ly.slant ?? 0;
      c.transform(1, 0, sl, 1, -sl * cy, 0);
      if (ly.ny) {
        const [, y0] = bodyPx(ly.nx, ly.ny[0]);
        const [, y1] = bodyPx(ly.nx, ly.ny[1]);
        c.fillRect(cx - half, y0, half * 2, y1 - y0);
      } else c.fillRect(cx - half, 0, half * 2, H);
    } else if (ly.t === 'spot') {
      for (let i = 0; i < ly.n; i++) {
        const [x, y] = bodyPx(rr(ly.nx), rr(ly.ny));
        const r = rr(ly.r) * sc;
        c.fillStyle = rgba(ly.renk, ly.a * (0.7 + rnd() * 0.3));
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (ly.halka) { c.strokeStyle = rgba(ly.halka, ly.a); c.lineWidth = r * 0.45; c.beginPath(); c.arc(x, y, r * 1.15, 0, Math.PI * 2); c.stroke(); }
      }
    } else if (ly.t === 'blotch') {
      for (let i = 0; i < ly.n; i++) {
        const [x, y] = bodyPx(rr(ly.nx), rr(ly.ny));
        const r = rr(ly.r) * sc;
        const K = 10, rot = rnd() * Math.PI, ex = 0.8 + rnd() * 0.7;
        const pts: Pt[] = [];
        for (let k = 0; k < K; k++) {
          const a = (k / K) * Math.PI * 2, rad = r * (0.7 + rnd() * 0.5);
          pts.push([Math.cos(a) * rad * ex, Math.sin(a) * rad / ex]);
        }
        for (const [scale, al] of [[1.18, ly.a * 0.3], [1, ly.a]] as const) {
          c.save(); c.translate(x, y); c.rotate(rot); c.scale(scale, scale);
          c.fillStyle = rgba(ly.renk, al);
          c.beginPath();
          const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          const m0 = mid(pts[K - 1], pts[0]);
          c.moveTo(m0[0], m0[1]);
          for (let k = 0; k < K; k++) { const m = mid(pts[k], pts[(k + 1) % K]); c.quadraticCurveTo(pts[k][0], pts[k][1], m[0], m[1]); }
          c.closePath(); c.fill(); c.restore();
        }
      }
    } else if (ly.t === 'streak') {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < ly.n; i++) {
        let [x, y] = bodyPx(rr(ly.nx), rr(ly.ny));
        const len = rr(ly.len) * sc, wv = rr(ly.w) * sc, ph = rnd() * 6;
        c.strokeStyle = rgba(ly.renk, ly.a * (0.7 + rnd() * 0.3));
        c.lineWidth = wv;
        c.beginPath(); c.moveTo(x, y);
        const steps = 12;
        for (let k = 1; k <= steps; k++) { x += len / steps; c.lineTo(x, y + Math.sin(ph + k * 0.7) * ly.wave * sc * 0.02); }
        c.stroke();
      }
    } else if (ly.t === 'cells') {
      const s = ly.size;
      c.strokeStyle = rgba(ly.renk, ly.a);
      c.lineWidth = sc * (ly.w ?? 0.006);
      c.lineJoin = 'round';
      const [xa, ya] = bodyXY(ly.nx[0], 0);
      for (let row = 0, y = ya + 0.6; y > ya - 1.4; y -= s * 0.86, row++) {
        for (let x = xa - 0.1 + (row % 2 ? s / 2 : 0); x < xa + L * (ly.nx[1] - ly.nx[0]) + 0.1; x += s) {
          const t = (x - spec.body.xs) / L;
          if (t < ly.nx[0] || t > ly.nx[1]) continue;
          const top = f.top(Math.min(1, Math.max(0, t))), bot = f.bot(Math.min(1, Math.max(0, t)));
          const ny = (top - y) / (top - bot || 1);
          if (ny < ly.ny[0] || ny > ly.ny[1]) continue;
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
            const r = (s / 1.75) * (0.8 + rnd() * 0.45);
            const [qx, qy] = px(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r);
            if (k) c.lineTo(qx, qy); else c.moveTo(qx, qy);
          }
          c.closePath(); c.stroke();
        }
      }
    } else if (ly.t === 'wash') {
      const [x0, y0] = bodyPx(ly.nx[0], ly.ny[0]), [x1, y1] = bodyPx(ly.nx[1], ly.ny[1]);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
      c.translate(cx, cy); c.scale(rx, Math.max(1, ry));
      const gr = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, rgba(ly.renk, ly.a));
      gr.addColorStop(0.6, rgba(ly.renk, ly.a * 0.6));
      gr.addColorStop(1, rgba(ly.renk, 0));
      c.fillStyle = gr;
      c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
    }
  }

  // yan çizgi (çok silik)
  c.save();
  bodyPath(c); c.clip();
  c.strokeStyle = 'rgba(0,0,0,0.13)';
  c.lineWidth = sc * 0.0035;
  c.setLineDash([sc * 0.018, sc * 0.012]);
  c.beginPath();
  spec.lateral.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
  c.stroke();
  c.setLineDash([]);
  // burun deliği
  const [nxp, nyp] = px(spec.nostril[0], spec.nostril[1]);
  c.fillStyle = 'rgba(20,12,8,0.55)';
  c.beginPath(); c.arc(nxp, nyp, sc * 0.007, 0, Math.PI * 2); c.fill();
  c.restore();

  // ---------------- kabartma
  const bump = makeCanvas(W, H);
  const b = bump.getContext('2d')!;
  b.fillStyle = '#808080';
  b.fillRect(0, 0, W, H);
  b.save();
  bodyPath(b); b.clip();
  b.lineWidth = sc * 0.0022;
  for (let row = 0, y = A.y0; y < A.y1; y += ps * 0.62, row++) {
    for (let x = A.x0 + (row % 2 ? ps / 2 : 0); x < A.x1; x += ps) {
      const [a, bb] = px(x, y);
      b.strokeStyle = 'rgba(230,230,230,0.65)';
      b.beginPath(); b.arc(a, bb, ps * sc * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); b.stroke();
    }
  }
  if (v.inci) {
    for (let row = 0, y = A.y0; y < A.y1; y += 0.036, row++) {
      for (let x = A.x0 + (row % 2 ? 0.02 : 0); x < A.x1; x += 0.04) {
        const [a, bb] = px(x, y);
        const gr = b.createRadialGradient(a, bb, 0, a, bb, sc * 0.016);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        b.fillStyle = gr; b.beginPath(); b.arc(a, bb, sc * 0.016, 0, Math.PI * 2); b.fill();
      }
    }
  }
  b.restore();
  b.lineCap = 'round';
  for (const fin of spec.fins) {
    const n = fin.base.length - 1;
    for (let i = 0; i <= n; i++) {
      b.strokeStyle = 'rgba(235,235,235,0.8)';
      b.lineWidth = sc * 0.0035;
      const [a, bb] = px(fin.base[i][0], fin.base[i][1]);
      const [x, y] = px(fin.edge[i][0], fin.edge[i][1]);
      b.beginPath(); b.moveTo(a, bb); b.lineTo(x, y); b.stroke();
    }
  }
  return { map, bump, w: W, h: H };
}
