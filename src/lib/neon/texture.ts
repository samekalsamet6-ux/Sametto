// Neon tetra gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, makeCanvas, paintFin, rgba, scaleBump, type Ctx } from '../akvaryum/fishtex';
import { mulberry32, smoothstep } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { RED, STRIPE, stripeW } from './model';
import { seedFor, type Variant } from './variants';

export interface NeonTextures { color: HTMLCanvasElement; glow: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

export function paintBody(v: Variant, sex: SexId, W = 1024): NeonTextures {
  const Hh = W / 4;
  const stripeEnd = STRIPE.s0 + (STRIPE.s1 - STRIPE.s0) * v.serit.boy;
  /** Şerit çizimi: tek şerit yolu boyunca gradyan; mod 'color' ya da 'glow' */
  const stripe = (ctx: Ctx, w: number, h: number, glow: boolean) => {
    const n = 90;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = STRIPE.s0 + (stripeEnd - STRIPE.s0) * (i / n);
        const half = STRIPE.half * (pass === 0 ? 1 : 0.5) * (0.55 + 0.45 * smoothstep(0, 0.1, i / n) * (1 - 0.25 * smoothstep(0.8, 1, i / n)));
        const y = stripeW(sex, s) * h - half * h;
        if (i === 0) ctx.moveTo(s * w, y); else ctx.lineTo(s * w, y);
      }
      for (let i = n; i >= 0; i--) {
        const s = STRIPE.s0 + (stripeEnd - STRIPE.s0) * (i / n);
        const half = STRIPE.half * (pass === 0 ? 1 : 0.5) * (0.55 + 0.45 * smoothstep(0, 0.1, i / n) * (1 - 0.25 * smoothstep(0.8, 1, i / n)));
        ctx.lineTo(s * w, stripeW(sex, s) * h + half * h);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, rgba(pass ? v.serit.merkez : v.serit.kenar, glow ? 0.9 : 0.95));
      g.addColorStop(1, rgba(pass ? '#7dffe0' : v.serit.merkez, glow ? 0.9 : 0.95));
      ctx.fillStyle = g;
      ctx.fill();
    }
  };
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 31));
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.body.sirt);
    g.addColorStop(0.3, v.body.yan);
    g.addColorStop(0.78, v.body.yan);
    g.addColorStop(1, v.body.karin);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // kırmızı alt yarı: kuyruğa doğru, şeridin altından karına
    if (v.kirmizi.yogunluk > 0) {
      const rg = ctx.createLinearGradient(RED.s0 * w, 0, (RED.s0 + 0.14) * w, 0);
      rg.addColorStop(0, rgba(v.kirmizi.renk, 0));
      rg.addColorStop(1, rgba(v.kirmizi.renk, 0.96 * v.kirmizi.yogunluk));
      ctx.fillStyle = rg;
      const y0 = (stripeW(sex, 0.55) + STRIPE.half * 0.9) * h;
      ctx.fillRect(RED.s0 * w, y0, w * (1 - RED.s0), h * 0.78 - y0 + h * 0.04);
      // alt kenarda yumuşak geçiş
      const eg = ctx.createLinearGradient(0, h * 0.7, 0, h);
      eg.addColorStop(0, rgba(v.body.karin, 0)); eg.addColorStop(1, rgba(v.body.karin, 0.55 * v.kirmizi.yogunluk));
      ctx.fillStyle = eg; ctx.fillRect(RED.s0 * w, h * 0.7, w, h * 0.3);
      // kuyruk sapında kırmızı yoğun, sırta doğru kararır
      blob(ctx, w * 0.82, h * 0.62, w * 0.2, h * 0.22, v.kirmizi.renk, 0.5 * v.kirmizi.yogunluk, 0, 0.7);
    }
    // sırt yansıtıcı pulları (diamond) ve genel pul ipuçları
    if (v.sirtParilti > 0.3) for (let i = 0; i < 230; i++) blob(ctx, rnd() * w, rnd() * h * 0.42, 0.006 * w + rnd() * 0.006 * w, 0.006 * w, rnd() > 0.5 ? '#ffffff' : '#8fd9ff', 0.55 + 0.4 * rnd(), 0, 0.5);
    ctx.strokeStyle = rgba('#000000', 0.09);
    ctx.lineWidth = Math.max(1, w / 1000);
    const cols = 46, rows = 12, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * cw + cw * 0.5, y = r * ch + ch * 0.5;
      if (x < w * 0.2) continue;
      ctx.beginPath(); ctx.arc(x, y, cw * 0.55, -0.3, 1.9); ctx.stroke();
    }
    stripe(ctx, w, h, false);
    // baş: bir miktar koyu, sırtta zeytin
    const hg = ctx.createLinearGradient(0, 0, w * 0.2, 0);
    hg.addColorStop(0, rgba(v.body.sirt, 0.5)); hg.addColorStop(1, rgba(v.body.sirt, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w * 0.2, h * 0.5);
    ctx.fillStyle = rgba('#000000', 0.1);
    ctx.fillRect(w * 0.19, 0, w * 0.005, h);
  };
  const color = assembleBody(W, Hh, paint);
  const glow = assembleBody(W, Hh, (ctx, w, h) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); stripe(ctx, w, h, true); });
  const bump = scaleBump(W, Hh, 46, 12, 0.14);
  const f = paintFin(v.fin);
  void makeCanvas;
  return { color, glow, bump, fins: { sirt: f, yag: paintFin({ ...v.fin, stops: v.fin.stops.map(([p, c, a]) => [p, c, Math.min(1, a * 1.4)] as [number, string, number]) }), anal: f, kuyruk: f, karin: f, gogus: paintFin({ ...v.fin, stops: v.fin.stops.map(([p, c, a]) => [p, c, a * 0.6] as [number, string, number]) }) } };
}
