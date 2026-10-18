// Gövde dokusunu <canvas> üzerinde üretir (tarayıcıya özgü; birim testi yok).
// Doku eşlemesi: yatay eksen u = gövde boyu (burun solda), dikey eksen v = halka açısı / 2π.
// v=0 ve v=1 karın orta çizgisi, v=0.5 sırt, v=0.25 +z yanı. Yarısı çizilir, sonra aynalanır.
import type { Sex } from './model';
import { mulberry32, type Variant } from './variants';
import { EYE_A, EYE_T } from './model';
import { LH, LW, paintBase, paintHead, paintLateralLine, paintScaleBump, paintScales, paintSheen, type DetailOpts } from '../livebearer/scales';

type Ctx = CanvasRenderingContext2D;

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(0.6, hexA(color, alpha * 0.55));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export interface BodyTextures { map: HTMLCanvasElement; bump: HTMLCanvasElement }

export function paintBody(variant: Variant, sex: Sex, W = 1024): BodyTextures {
  const H = W / 2;
  const half = H / 2;
  const map = makeCanvas(W, H);
  const bump = makeCanvas(W, H);
  const hc = makeCanvas(W, half); // yarım doku (karın -> sırt)
  const hb = makeCanvas(W, half);
  const c = hc.getContext('2d')!;
  const b = hb.getContext('2d')!;
  const pal = variant[sex];
  const rnd = mulberry32(variant.id.length * 977 + (sex === 'erkek' ? 11 : 29));
  const male = sex === 'erkek';

  // taban: karın açık, sırt koyu
  const g = c.createLinearGradient(0, 0, 0, half);
  g.addColorStop(0, pal.karin);
  g.addColorStop(0.14, pal.karin);
  g.addColorStop(0.36, pal.yan);
  g.addColorStop(0.8, pal.yan);
  g.addColorStop(1, pal.sirt);
  c.fillStyle = g;
  c.fillRect(0, 0, W, half);
  // sırt boyunca koyu şerit
  const dg = c.createLinearGradient(0, half * 0.7, 0, half);
  dg.addColorStop(0, hexA(pal.sirt, 0));
  dg.addColorStop(1, hexA(pal.sirt, 0.65));
  c.fillStyle = dg;
  c.fillRect(0, half * 0.7, W, half * 0.3);

  // ---- renkli desen (erkekte arka yarı güçlü; dişide çok hafif)
  const [mBas, mGenis] = variant.maske ?? [0.3, 0.45];
  const x0 = W * mBas; // desen başlangıcı
  const span = W - x0;
  const strength = male ? 1 : 0.18;
  c.save();
  // arka yarıya doğru artan maske için çizimleri ayrı katmanda yap
  const layer = makeCanvas(W, half);
  const l = layer.getContext('2d')!;
  for (const ly of variant.desen) {
    if (ly.t === 'zemin') {
      l.fillStyle = hexA(ly.renk, ly.a);
      l.fillRect(x0, 0, span, half);
    } else if (ly.t === 'blob') {
      blob(l, W * ly.x, half * ly.y, ly.rx, ly.ry, ly.renk, ly.a);
    } else if (ly.t === 'leke') {
      const cols = ly.renkler ?? variant.vurgu;
      for (let i = 0; i < ly.n; i++) {
        const col = cols.length > 1 ? cols[Math.floor(rnd() * cols.length)] : cols[0];
        const bx = x0 + rnd() * span, by = rnd() * half;
        const rx = ly.rx[0] + rnd() * ly.rx[1], ry = ly.ry[0] + rnd() * ly.ry[1];
        const al = ly.a[0] + (ly.a[1] > 0 ? rnd() * ly.a[1] : 0);
        blob(l, bx, by, rx, ry, col, al);
      }
    } else if (ly.t === 'nokta') {
      for (let i = 0; i < ly.n; i++) {
        const r = ly.r[0] + rnd() * ly.r[1];
        l.fillStyle = hexA(ly.renk, ly.a[0] + rnd() * ly.a[1]);
        l.beginPath(); l.arc(x0 + rnd() * span, rnd() * half, r, 0, Math.PI * 2); l.fill();
      }
    } else if (ly.t === 'halka') {
      const adim = ly.adim ?? 34, yr = ly.yaricap ?? 12, dy = (adim * 40) / 34, rows = Math.ceil(half / dy), cols = Math.round(612 / adim);
      l.strokeStyle = hexA(ly.renk, ly.a);
      l.lineWidth = 3.2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = x0 + col * adim + (row % 2 ? adim / 2 : 0) + (rnd() - 0.5) * 4;
          const cy = row * dy + 14 + (rnd() - 0.5) * 3;
          l.beginPath();
          l.ellipse(cx, cy, yr + rnd() * 3, yr + 0.5 + rnd() * 3, 0, 0, Math.PI * 2);
          l.stroke();
          if (rnd() > 0.55) { l.fillStyle = hexA(ly.renk, ly.a * 0.806); l.beginPath(); l.arc(cx, cy, 3, 0, Math.PI * 2); l.fill(); }
        }
      }
    } else if (ly.t === 'cubuk') {
      l.fillStyle = hexA(ly.renk, ly.a);
      l.beginPath(); l.ellipse(W * ly.x, half * ly.y, ly.rx, half * ly.ry, 0, 0, Math.PI * 2); l.fill();
    } else if (ly.t === 'leopar') {
      for (let i = 0; i < ly.n; i++) {
        const bx = x0 + 30 + rnd() * (span - 60), by = 24 + rnd() * (half - 48), r = 11 + rnd() * 10;
        blob(l, bx, by, r * 0.9, r * 0.8, ly.ic, 0.6);
        l.strokeStyle = hexA(ly.renk, 0.88);
        l.lineWidth = 3.4 + rnd() * 1.6;
        l.beginPath(); l.ellipse(bx, by, r, r * 0.88, rnd() * 3, 0.3, Math.PI * 2 - 0.3 + rnd() * 0.5); l.stroke();
      }
    }
  }
  // maske: x0'dan itibaren artan
  l.globalCompositeOperation = 'destination-in';
  const mask = l.createLinearGradient(x0, 0, x0 + span * mGenis, 0);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,1)');
  l.fillStyle = mask;
  l.fillRect(0, 0, W, half);
  c.globalAlpha = strength;
  c.drawImage(layer, 0, 0);
  c.globalAlpha = 1;
  c.restore();

  // ---- gerçekçi gövde ayrıntıları (ortak yardımcılar; mantıksal 1024x256 uzayında çizilir)
  const k = W / LW;
  const det: DetailOpts = {
    yan: pal.yan, sirt: pal.sirt, karin: pal.karin, metal: variant.metal ?? 0.3, sw: 24, sh: 20,
    seed: variant.id.length * 977 + variant.id.charCodeAt(0) * 31 + (male ? 11 : 29),
    eye: { x: EYE_T * LW, y: (EYE_A / (Math.PI * 2)) * 2 * LH, rx: 54, ry: 46 },
  };
  c.save(); c.scale(k, k);
  paintBase(c, det); paintScales(c, det); paintSheen(c, det); paintLateralLine(c, det); paintHead(c, det);
  c.restore();
  b.save(); b.scale(k, k);
  paintScaleBump(b, det);
  const headFade = b.createLinearGradient(LW * 0.17, 0, LW * 0.25, 0);
  headFade.addColorStop(0, 'rgba(128,128,128,1)'); headFade.addColorStop(1, 'rgba(128,128,128,0)');
  b.fillStyle = headFade; b.fillRect(0, 0, LW * 0.25, LH);
  b.restore();

  // ---- gravid spot (dişi): karın arka kısmı, anal yüzgecin hemen önünde
  if (!male) {
    const sx = W * 0.6, sy = half * 0.2;
    blob(c, sx, sy, 78, 46, '#1a0f08', 0.85);
    blob(c, sx, sy, 48, 28, '#0a0504', 0.9);
    blob(c, sx + 30, sy + 10, 90, 55, '#c86a3a', 0.12);
  }

  // yarıyı tam dokuya yerleştir: alt yarı normal, üst yarı ayna
  for (const [src, dst] of [[hc, map], [hb, bump]] as const) {
    const d = dst.getContext('2d')!;
    d.drawImage(src, 0, 0);
    d.save();
    d.translate(0, H);
    d.scale(1, -1);
    d.drawImage(src, 0, 0);
    d.restore();
  }
  return { map, bump };
}
