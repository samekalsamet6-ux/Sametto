// Melek balığına özgü ek boyama (ortak boyayıcıdan sonra çağrılır; bkz. FishSpec.decorate).
// Koyu dikey bantlar gövdede kalır; yüzgeçlere yalnızca silik, ışın boyunca uzayan ve uca doğru sönen bir uzantı
// olarak geçer (sert bant değil). Yüzgeçlere ayrıca ikincil (dallanan) ışınlar çizilir.
import { rgba } from '../akvaryum/yanal-texture';
import { bodyFns, finOutline, xOfT, type FishSpec, type FishVariant as Variant, type Pt } from '../akvaryum/yanal-model';

export function decorateMelek(spec: FishSpec, tex: { map: HTMLCanvasElement; bump: HTMLCanvasElement; w: number; h: number }, variant: Variant): void {
  const c = tex.map.getContext('2d');
  if (!c) return;

  const A = spec.atlas;
  const sc = tex.w / (A.x1 - A.x0);
  const px = (x: number, y: number): Pt => [(x - A.x0) * sc, (A.y1 - y) * sc];
  const W = tex.w, H = tex.h;
  const f = bodyFns(spec.body);
  const finClip = (fin: { base: Pt[]; edge: Pt[] }) => {
    c.beginPath();
    finOutline(fin).forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath();
  };

  // ---- ikincil ışınlar: ana ışınların arasında, dış yarıda dallanan ince çizgiler
  for (const fin of spec.fins) {
    const n = fin.base.length - 1;
    c.save();
    finClip(fin); c.clip();
    c.lineCap = 'round';
    c.lineWidth = sc * 0.0016;
    for (let i = 0; i < n; i++) {
      const j = i + 0.5;
      const bx = (fin.base[i][0] + fin.base[i + 1][0]) / 2, by = (fin.base[i][1] + fin.base[i + 1][1]) / 2;
      const ex = (fin.edge[i][0] + fin.edge[i + 1][0]) / 2, ey = (fin.edge[i][1] + fin.edge[i + 1][1]) / 2;
      const r0 = 0.45 + 0.1 * Math.sin(j * 12.9898);
      const [a, b] = px(bx + (ex - bx) * r0, by + (ey - by) * r0);
      const [x, y] = px(ex, ey);
      c.strokeStyle = rgba(variant.yuzgec.isin, 0.28);
      c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke();
    }
    c.restore();
  }

  // ---- bantların yüzgeçlere silik uzantısı
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const t = tmp.getContext('2d');
  if (!t) return;
  const dorsal = spec.fins[0], anal = spec.fins[1];
  const reach = (fin: { edge: Pt[] }, sign: 1 | -1) => Math.max(...fin.edge.map((p) => p[1] * sign));
  for (const ly of variant.katmanlar) {
    if (ly.t !== 'bar' || !ly.fin) continue;
    const tc = Math.min(1, Math.max(0, ly.nx));
    const x = xOfT(spec.body, tc);
    for (const [fin, sign] of [[dorsal, 1], [anal, -1]] as const) {
      const yR = sign === 1 ? f.top(tc) : f.bot(tc);
      const hFin = Math.max(0.05, reach(fin, sign) - Math.abs(yR));
      const [cx, cy] = px(x, yR);
      const half = ly.w * (spec.body.xe - spec.body.xs) * sc * 1.1;
      const len = hFin * sc;
      t.clearRect(0, 0, W, H);
      t.save();
      const lean = (sign === 1 ? -1 : 1) * (0.28 - (ly.slant ?? 0) * 2);
      t.transform(1, 0, lean, 1, -lean * cy, 0);
      const gh = t.createLinearGradient(cx - half, 0, cx + half, 0);
      gh.addColorStop(0, rgba(ly.renk, 0));
      gh.addColorStop(0.5, rgba(ly.renk, 1));
      gh.addColorStop(1, rgba(ly.renk, 0));
      t.fillStyle = gh;
      t.fillRect(cx - half, sign === 1 ? cy - len * 1.05 : cy - len * 0.06, half * 2, len * 1.11);
      t.restore();
      // uca doğru sönen dikey saydamlık
      t.globalCompositeOperation = 'destination-in';
      const gv = t.createLinearGradient(0, cy, 0, cy + (sign === 1 ? -len : len));
      gv.addColorStop(0, 'rgba(0,0,0,1)');
      gv.addColorStop(0.6, 'rgba(0,0,0,0.55)');
      gv.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = gv;
      t.fillRect(0, 0, W, H);
      t.globalCompositeOperation = 'source-over';
      c.save();
      finClip(fin); c.clip();
      c.globalAlpha = Math.min(1, ly.a * 0.62);
      c.drawImage(tmp, 0, 0);
      c.restore();
    }
  }
}
