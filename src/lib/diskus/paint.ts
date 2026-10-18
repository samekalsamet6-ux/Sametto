// Diskus'a özgü ek boyama (ortak boyayıcıdan sonra çağrılır; bkz. FishSpec.decorate).
// Gerçek diskusta dikey bantlar (yaklaşık dokuz; beşincisi daha koyu) düzensizdir: genişlik, koyuluk ve eğim bantlar
// arasında değişir, uçlara doğru söner; turkuaz hatlarda başta ve gövdede dalgalı, kesintili turkuaz çizgiler vardır.
// Desen şiddeti hatta göre PATTERNS tablosundan gelir. Ayrıca ince pul kabartması, hafif benekli (mottling) doku,
// sırt koyu/karın açık gölgeleme ve yan çizgi boyunca sedefli parlama eklenir.
import { rgba } from '../akvaryum/yanal-texture';
import { bodyFns, finOutline, finPoint, mulberry32, seedFor, xOfT, type FishSpec, type FishVariant, type Pt } from '../akvaryum/yanal-model';

export interface BarPattern { renk: string; a: number; mid: number; w?: number }
export interface WavePattern { renk: string; n: number; a: number; /** 0..1 başa yığılma */ head?: number; fin?: boolean; width?: number }
export interface Pattern { bars?: BarPattern; wave?: WavePattern }

/** Hatta göre bant/turkuaz çizgi deseni (kimlik → desen). Tabloda olmayan hat desensizdir. */
export const PATTERNS: Record<string, Pattern> = {
  heckel: { bars: { renk: '#1c0c06', a: 0.34, mid: 0.92, w: 1.1 }, wave: { renk: '#3fd0d6', n: 22, a: 0.6, head: 0.7, fin: true } },
  kahverengi: { bars: { renk: '#2a160a', a: 0.26, mid: 0.55 }, wave: { renk: '#4cc4c8', n: 12, a: 0.5, head: 0.7 } },
  'yabani-yesil': { bars: { renk: '#1d200c', a: 0.26, mid: 0.55 }, wave: { renk: '#5fd6b4', n: 30, a: 0.62, head: 0.5, fin: true } },
  'royal-blue': { bars: { renk: '#0a2036', a: 0.2, mid: 0.5 }, wave: { renk: '#3de0e8', n: 64, a: 0.8, head: 0.35, fin: true, width: 1.1 } },
  'blue-diamond': { bars: { renk: '#0c3a50', a: 0.06, mid: 0.2 }, wave: { renk: '#c4f8fa', n: 22, a: 0.5, head: 0.6, fin: true } },
  kobalt: { bars: { renk: '#081a42', a: 0.24, mid: 0.55 }, wave: { renk: '#7ab4ff', n: 20, a: 0.55, head: 0.5, fin: true } },
  'kirmizi-turkuaz': { bars: { renk: '#4a0c08', a: 0.1, mid: 0.3 }, wave: { renk: '#38d6d9', n: 58, a: 0.8, head: 0.35, fin: true, width: 1.1 } },
  'red-melon': { wave: { renk: '#4adada', n: 9, a: 0.5, head: 0.9 } },
  'yilan-derisi': { bars: { renk: '#40160c', a: 0.14, mid: 0.34 } },
  beyaz: { bars: { renk: '#8a8678', a: 0.12, mid: 0.24 } },
};

type Tex = { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number };
const BAR_NX = [0.2, 0.28, 0.36, 0.43, 0.5, 0.58, 0.66, 0.74, 0.83];

export function decorateDiskus(spec: FishSpec, tex: Tex, v: FishVariant): void {
  const c = tex.map.getContext('2d'), b = tex.bump.getContext('2d');
  if (!c || !b) return;
  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const f = bodyFns(spec.body);
  const L = spec.body.xe - spec.body.xs;
  const bodyXY = (nx: number, ny: number): Pt => { const t = Math.min(1, Math.max(0, nx)); return [xOfT(spec.body, t), f.top(t) - ny * (f.top(t) - f.bot(t))]; };
  const bodyPath = (cc: CanvasRenderingContext2D) => {
    cc.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) { const [x, y] = px(...bodyXY(i / N, 0)); if (i) cc.lineTo(x, y); else cc.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const [x, y] = px(...bodyXY(i / N, 1)); cc.lineTo(x, y); }
    cc.closePath();
  };
  const finPath = (cc: CanvasRenderingContext2D, fin: { base: Pt[]; edge: Pt[] }) => {
    cc.beginPath();
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) cc.lineTo(x, y); else cc.moveTo(x, y); });
    cc.closePath();
  };
  const rnd = mulberry32(seedFor(v.id) ^ 0x9e3779b1);
  const pat = PATTERNS[v.id] ?? {};
  const shine = v.parlak ?? 0.4;

  // ---------------- gövde: hafif benekli doku, sırt/karın gölgeleme, yan çizgi boyunca sedefli parlama
  c.save();
  bodyPath(c); c.clip();
  for (let i = 0; i < 70; i++) {
    const [x, y] = px(...bodyXY(0.05 + rnd() * 0.9, 0.05 + rnd() * 0.9));
    const r = sc * (0.05 + rnd() * 0.11);
    const dark = rnd() < 0.5;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, dark ? 'rgba(20,10,5,0.085)' : 'rgba(255,245,230,0.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  const [, yT] = px(0, f.top(0.5)), [, yB] = px(0, f.bot(0.5));
  const cs = c.createLinearGradient(0, yT, 0, yB);
  cs.addColorStop(0, 'rgba(10,8,12,0.2)'); cs.addColorStop(0.3, 'rgba(10,8,12,0)'); cs.addColorStop(0.78, 'rgba(255,250,240,0)'); cs.addColorStop(1, 'rgba(255,250,240,0.16)');
  c.fillStyle = cs; c.fillRect(0, 0, tex.w, tex.h);
  // sedefli parlama: yan çizgi bölgesinde yumuşak açık elips (başa yakın güçlü)
  const [sx0, sy] = px(...bodyXY(0.1, 0.4)), [sx1] = px(...bodyXY(0.95, 0.4));
  const sheen = 0.06 + 0.12 * shine;
  c.save();
  c.translate((sx0 + sx1) / 2 - (sx1 - sx0) * 0.08, sy); c.scale(1, 0.3);
  const sg = c.createRadialGradient(0, 0, 0, 0, 0, (sx1 - sx0) / 2);
  sg.addColorStop(0, `rgba(255,255,255,${sheen})`); sg.addColorStop(0.6, `rgba(255,255,255,${sheen * 0.45})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.beginPath(); c.arc(0, 0, (sx1 - sx0) / 2, 0, Math.PI * 2); c.fill();
  c.restore();
  c.restore();

  // ---------------- dikey bantlar (düzensiz)
  if (pat.bars) {
    const { renk, a, mid } = pat.bars, wk = pat.bars.w ?? 1;
    c.save();
    bodyPath(c); c.clip();
    BAR_NX.forEach((nx0, i) => {
      const center = i === 4;
      const nx = nx0 + (rnd() - 0.5) * 0.026;
      const rel = center ? 1 : 0.45 + rnd() * 0.55; // bantlar arası şiddet farkı
      const edge = i === 0 || i === 8 ? 0.7 : 1;
      const base = (center ? mid : a * rel) * edge;
      const hw0 = (center ? 0.05 : 0.014 + rnd() * 0.016) * L * wk * sc;
      const lean = (rnd() - 0.5) * 0.05 - 0.03; // üst kısım hafif geride
      const ph = rnd() * 6.28, amp = 0.002 + rnd() * 0.004;
      const K = 120;
      const y0 = 0.02 + (center ? 0 : rnd() * 0.12), y1 = 0.98 - (center ? 0 : rnd() * 0.18);
      for (let k = 0; k < K; k++) {
        const ny = y0 + ((y1 - y0) * k) / K;
        const bell = Math.pow(Math.sin(Math.PI * ((k + 0.5) / K)), 0.45);
        const nz = 0.75 + 0.25 * Math.sin(ny * 17 + ph * 2);
        const al = Math.min(0.95, base * (0.3 + 0.7 * bell) * nz);
        const [cx0, cy] = px(...bodyXY(nx + lean * (ny - 0.5) + amp * Math.sin(ny * 5 + ph), ny));
        const hw = hw0 * (0.85 + 0.2 * Math.sin(ny * 4 + ph) + (center ? 0.15 * bell : 0));
        const [, cy2] = px(...bodyXY(nx, ny + (y1 - y0) / K));
        const g = c.createLinearGradient(cx0 - hw, 0, cx0 + hw, 0);
        g.addColorStop(0, rgba(renk, 0)); g.addColorStop(0.5, rgba(renk, al)); g.addColorStop(1, rgba(renk, 0));
        c.fillStyle = g;
        c.fillRect(cx0 - hw, Math.min(cy, cy2) - 1, hw * 2, Math.abs(cy2 - cy) + 2);
      }
    });
    c.restore();
  }

  // ---------------- turkuaz dalgalı çizgiler (gövde ve yüzgeçler)
  if (pat.wave) {
    const wv = pat.wave;
    c.save();
    bodyPath(c); c.clip();
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < wv.n; i++) {
      // başa yığılma: nx dağılımı head ile başa kaydırılır
      const headBias = Math.pow(rnd(), 1 + (wv.head ?? 0.5) * 1.6);
      const nx0 = 0.03 + headBias * 0.82;
      const len = 0.16 + rnd() * 0.45;
      const ny0 = 0.08 + rnd() * 0.84;
      const A2 = 0.012 + rnd() * 0.03, cyc = 0.7 + rnd() * 1.1, ph = rnd() * 6.28, drift = (rnd() - 0.5) * 0.14;
      const wBase = (0.0035 + rnd() * 0.0045) * (wv.width ?? 1);
      const steps = 48;
      let prev: Pt | null = null;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const nx = nx0 + len * u;
        if (nx > 0.97) break;
        const ny = ny0 + drift * u + A2 * Math.sin(2 * Math.PI * cyc * u + ph) + 0.35 * A2 * Math.sin(2 * Math.PI * cyc * 2.3 * u + ph * 1.7);
        const p2 = px(...bodyXY(nx, Math.min(0.96, Math.max(0.04, ny))));
        const taper = Math.pow(Math.sin(Math.PI * u), 0.7);
        if (prev) {
          c.strokeStyle = rgba(wv.renk, wv.a * (0.2 + 0.8 * taper) * (0.75 + 0.25 * Math.sin(u * 7 + ph)));
          c.lineWidth = sc * wBase * (0.35 + taper);
          c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(p2[0], p2[1]); c.stroke();
        }
        prev = p2;
      }
    }
    c.restore();
    if (wv.fin) {
      for (const fin of spec.fins.slice(0, 2)) {
        c.save();
        finPath(c, fin); c.clip();
        c.lineCap = 'round';
        // zar üzerinde yumuşak turkuaz bantlar (ışınlar boyunca ince çizgi değil, pigment gibi)
        for (let k = 0; k < 3; k++) {
          const r = 0.3 + 0.25 * k + (rnd() - 0.5) * 0.06;
          for (const [wd, al] of [[0.03, 0.07], [0.017, 0.1], [0.007, 0.16]] as const) {
            c.strokeStyle = rgba(wv.renk, wv.a * al * (0.7 + rnd() * 0.6));
            c.lineWidth = sc * wd;
            c.beginPath();
            for (let i = 0; i <= 24; i++) {
              const s = i / 24;
              const [x, y] = px(...finPoint(fin, s, Math.min(0.97, r + 0.035 * Math.sin(s * 7 + k * 2.3))));
              if (i) c.lineTo(x, y); else c.moveTo(x, y);
            }
            c.stroke();
          }
        }
        c.restore();
      }
    }
  }

  // ---------------- kabartma: ince, düzensiz pullar (iri ızgara yumuşatılır) ve ince benekler
  b.save();
  bodyPath(b); b.clip();
  b.fillStyle = 'rgba(128,128,128,0.62)';
  b.fillRect(0, 0, tex.w, tex.h);
  const ps = 0.019;
  b.lineWidth = sc * 0.0014;
  for (let row = 0, y = A.y0; y < A.y1; y += ps * 0.7, row++) {
    for (let x = A.x0 + (row % 2 ? ps / 2 : 0); x < A.x1; x += ps) {
      const [a1, b1] = px(x + (rnd() - 0.5) * ps * 0.3, y + (rnd() - 0.5) * ps * 0.2);
      b.strokeStyle = `rgba(235,235,235,${0.14 + rnd() * 0.22})`;
      b.beginPath(); b.arc(a1, b1, ps * sc * (0.45 + rnd() * 0.12), 0.15 * Math.PI, 0.85 * Math.PI); b.stroke();
    }
  }
  for (let i = 0; i < 500; i++) {
    const [x, y] = px(A.x0 + rnd() * (A.x1 - A.x0), A.y0 + rnd() * (A.y1 - A.y0));
    b.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    b.beginPath(); b.arc(x, y, sc * (0.002 + rnd() * 0.004), 0, Math.PI * 2); b.fill();
  }
  b.restore();
}
