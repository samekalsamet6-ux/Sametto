// Gövde dokusunu <canvas> üzerinde üretir (tarayıcıya özgü; birim testi yok).
// Doku eşlemesi: yatay eksen u = gövde boyu (burun solda), dikey eksen v = halka açısı / 2π.
// v=0 ve v=1 karın orta çizgisi, v=0.5 sırt, v=0.25 +z yanı. Yarısı çizilir, sonra aynalanır.
// Çizim mantıksal 1024x512 uzayında yapılır; gerçek boyut W'ye göre ölçeklenir.
import type { Sex } from './model';
import { mulberry32, type Variant } from './variants';
import { EYE_A, EYE_T } from './model';
import { eyeHalo, LH as SLH, LW as SLW, paintBase, paintHead, paintLateralLine, paintScaleBump, paintScales, paintSheen, type DetailOpts } from './scales';

type Ctx = CanvasRenderingContext2D;
const LW = SLW, LH = SLH; // yarım doku, mantıksal piksel

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, hexA(color, alpha)); g.addColorStop(0.6, hexA(color, alpha * 0.55)); g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export interface BodyTextures { map: HTMLCanvasElement; bump: HTMLCanvasElement }
export interface TextureOpts {
  scaleW?: number; scaleH?: number;
  /** Göz çukuru gölgesi için türün göz yarıçapı/gövde boyu/yüksekliği (yoksa varsayılan boyut) */
  eye?: (sex: Sex) => { r: number; length: number; height: number };
}

export function paintBody(variant: Variant, sex: Sex, W = 1024, opts: TextureOpts = {}): BodyTextures {
  const k = W / LW;
  const H = W / 2;
  const map = makeCanvas(W, H), bump = makeCanvas(W, H);
  const hc = makeCanvas(W, H / 2), hb = makeCanvas(W, H / 2);
  const c = hc.getContext('2d')!, b = hb.getContext('2d')!;
  c.scale(k, k); b.scale(k, k);
  const pal = variant[sex];
  const rnd = mulberry32(variant.id.length * 977 + variant.id.charCodeAt(0) * 31 + (sex === 'erkek' ? 11 : 29));

  // taban: karın açık, sırt koyu
  const g = c.createLinearGradient(0, 0, 0, LH);
  g.addColorStop(0, pal.karin); g.addColorStop(0.14, pal.karin); g.addColorStop(0.36, pal.yan); g.addColorStop(0.8, pal.yan); g.addColorStop(1, pal.sirt);
  c.fillStyle = g; c.fillRect(0, 0, LW, LH);
  const dg = c.createLinearGradient(0, LH * 0.7, 0, LH);
  dg.addColorStop(0, hexA(pal.sirt, 0)); dg.addColorStop(1, hexA(pal.sirt, 0.6));
  c.fillStyle = dg; c.fillRect(0, LH * 0.7, LW, LH * 0.3);

  // ---- desen katmanları
  for (const ly of variant.desen) {
    if (ly.t === 'zemin') {
      const x0 = ly.x[0] * LW, x1 = ly.x[1] * LW, y0 = (ly.y?.[0] ?? 0) * LH, y1 = (ly.y?.[1] ?? 1) * LH;
      const f = (ly.yum ?? 0.04) * LW;
      const tmp = makeCanvas(LW, LH);
      const t = tmp.getContext('2d')!;
      t.fillStyle = hexA(ly.renk, ly.a);
      t.fillRect(x0, y0, x1 - x0, y1 - y0);
      t.globalCompositeOperation = 'destination-in';
      if (f > 0) {
        const hm = t.createLinearGradient(x0, 0, x1, 0);
        const e = Math.min(0.5, f / Math.max(1, x1 - x0));
        const open0 = ly.x[0] <= 0.001, open1 = ly.x[1] >= 0.999;
        hm.addColorStop(0, open0 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); hm.addColorStop(open0 ? 0 : e, 'rgba(0,0,0,1)');
        hm.addColorStop(open1 ? 1 : 1 - e, 'rgba(0,0,0,1)'); hm.addColorStop(1, open1 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
        t.fillStyle = hm; t.fillRect(0, 0, LW, LH);
      }
      if (ly.y) {
        const vm = t.createLinearGradient(0, y0, 0, y1), fv = 0.12;
        vm.addColorStop(0, ly.y[0] <= 0.001 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); vm.addColorStop(ly.y[0] <= 0.001 ? 0 : fv, 'rgba(0,0,0,1)');
        vm.addColorStop(ly.y[1] >= 0.999 ? 1 : 1 - fv, 'rgba(0,0,0,1)'); vm.addColorStop(1, ly.y[1] >= 0.999 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
        t.fillStyle = vm; t.fillRect(0, 0, LW, LH);
      }
      c.drawImage(tmp, 0, 0);
    } else if (ly.t === 'gradyan') {
      const x0 = ly.x[0] * LW, x1 = ly.x[1] * LW;
      const gg = c.createLinearGradient(x0, 0, x1, 0);
      gg.addColorStop(0, hexA(ly.renk0, ly.a)); gg.addColorStop(1, hexA(ly.renk1, ly.a));
      c.fillStyle = gg; c.fillRect(x0, 0, LW - x0, LH);
    } else if (ly.t === 'blob') {
      blob(c, LW * ly.x, LH * ly.y, ly.rx, ly.ry, ly.renk, ly.a);
    } else if (ly.t === 'benek') {
      const x0 = ly.x[0] * LW, x1 = ly.x[1] * LW, y0 = (ly.y?.[0] ?? 0.05) * LH, y1 = (ly.y?.[1] ?? 0.98) * LH;
      for (let i = 0; i < ly.n; i++) {
        const col = ly.renkler ? ly.renkler[Math.floor(rnd() * ly.renkler.length)] : ly.renk;
        const r = ly.r[0] + rnd() * (ly.r[1] - ly.r[0]);
        const cx = x0 + rnd() * (x1 - x0), cy = y0 + rnd() * (y1 - y0);
        c.save();
        c.translate(cx, cy); c.rotate((rnd() - 0.5) * 1.2);
        c.fillStyle = hexA(col, ly.a);
        if (!ly.sert) { c.shadowColor = hexA(col, ly.a); c.shadowBlur = r * 0.35; }
        c.beginPath();
        // düzensiz kenar: yarıçap küçük sapmalarla
        const steps = 14, el = ly.uzun ?? 1.15;
        for (let s = 0; s <= steps; s++) {
          const an = (s / steps) * Math.PI * 2, rr = r * (0.82 + rnd() * 0.36);
          const px = Math.cos(an) * rr * el, py = Math.sin(an) * rr;
          if (s === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath(); c.fill();
        c.restore();
      }
    } else if (ly.t === 'sira') {
      const sw = opts.scaleW ?? 33, sh = opts.scaleH ?? 27;
      c.fillStyle = hexA(ly.renk, ly.a);
      for (let row = 0; row < Math.ceil(LH / sh) + 1; row++) {
        for (let col = 0; col * sw < LW; col++) {
          const x = LW * 0.235 + col * sw + (row % 2 ? sw / 2 : 0), y = row * sh + sh * 0.5;
          if (x < ly.x[0] * LW || x > ly.x[1] * LW) continue;
          if (rnd() > ly.p) continue;
          c.beginPath(); c.arc(x, y, ly.r ?? 3.2, 0, Math.PI * 2); c.fill();
        }
      }
    } else if (ly.t === 'serit') {
      const gx = c.createLinearGradient((ly.x - ly.w) * LW, 0, (ly.x + ly.w) * LW, 0);
      gx.addColorStop(0, hexA(ly.renk, 0)); gx.addColorStop(0.5, hexA(ly.renk, ly.a)); gx.addColorStop(1, hexA(ly.renk, 0));
      c.fillStyle = gx; c.fillRect((ly.x - ly.w) * LW, 0, ly.w * 2 * LW, LH);
    }
  }

  // ---- gerçekçi gövde ayrıntıları: lekelenme, pul pul parlaklık/kenar, iridesans, yan çizgi gözenekleri, baş
  const sw = opts.scaleW ?? 33, sh = opts.scaleH ?? 27;
  const det: DetailOpts = {
    yan: pal.yan, sirt: pal.sirt, karin: pal.karin, metal: variant.metal ?? 0, sw, sh, seed: variant.id.length * 977 + variant.id.charCodeAt(0) * 31 + (sex === 'erkek' ? 11 : 29),
    eye: { x: EYE_T * LW, y: (EYE_A / (Math.PI * 2)) * 2 * LH, ...(opts.eye ? eyeHalo(opts.eye(sex).r, opts.eye(sex).length, opts.eye(sex).height) : { rx: 40, ry: 40 }) },
  };
  paintBase(c, det);
  paintScales(c, det);
  paintSheen(c, det);
  paintLateralLine(c, det);
  paintHead(c, det);

  // ---- kabartma
  paintScaleBump(b, det);
  const headFade = c.createLinearGradient(LW * 0.17, 0, LW * 0.25, 0);
  headFade.addColorStop(0, 'rgba(128,128,128,1)'); headFade.addColorStop(1, 'rgba(128,128,128,0)');
  b.fillStyle = headFade; b.fillRect(0, 0, LW * 0.25, LH);

  // ---- gravid spot (dişi): karın arka kısmı, anal yüzgecin hemen önünde
  if (sex === 'disi') {
    const gv = variant.gravid ?? 0.85;
    const sx = LW * 0.6, sy = LH * 0.2;
    blob(c, sx, sy, 78, 46, '#1a0f08', gv); blob(c, sx, sy, 48, 28, '#0a0504', gv * 1.05); blob(c, sx + 30, sy + 10, 90, 55, '#c86a3a', 0.1 * gv);
  }

  for (const [src, dst] of [[hc, map], [hb, bump]] as const) {
    const d = dst.getContext('2d')!;
    d.drawImage(src, 0, 0);
    d.save(); d.translate(0, H); d.scale(1, -1); d.drawImage(src, 0, 0); d.restore();
  }
  return { map, bump };
}
