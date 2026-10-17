// Japon balığı gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, flatBump, makeCanvas, paintFin, rgba, scaleBump, type Ctx } from '../akvaryum/fishtex';
import { mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { LATERAL, specOf, type Form } from './model';
import { seedFor, type Variant } from './variants';

export interface JaponTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

export function paintBody(v: Variant, sex: SexId, W = 1024, form: Form = 'standart'): JaponTextures {
  const Hh = W / 4;
  const inci = specOf(form).inci;
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 211));
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.body.sirt);
    g.addColorStop(0.35, v.body.yan);
    g.addColorStop(0.65, v.body.yan);
    g.addColorStop(1, v.body.karin);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const P = v.yamalar;
    if (v.desen === 'sarasa') {
      // baş kırmızı başlık + sırtta büyük yamalar + birkaç küçük benek
      blob(ctx, w * 0.08, h * 0.35, w * 0.17, h * 0.62, P[0], 0.95, 0, 0.92);
      for (let i = 0; i < 4; i++) blob(ctx, w * (0.3 + 0.17 * i) + rnd() * w * 0.05, rnd() * h * 0.35 + h * 0.1, (0.07 + rnd() * 0.07) * w, (0.14 + rnd() * 0.22) * h, P[i % 2], 0.95, rnd() * 0.6, 0.92);
      for (let i = 0; i < 5; i++) blob(ctx, rnd() * w, rnd() * h * 0.6, 0.02 * w, 0.06 * h, P[1], 0.8, 0, 0.9);
    } else if (v.desen === 'shubunkin') {
      for (let i = 0; i < 20; i++) blob(ctx, rnd() * w, rnd() * h * 0.85, (0.03 + rnd() * 0.08) * w, (0.1 + rnd() * 0.25) * h, P[Math.floor(rnd() * P.length)], 0.8 + 0.15 * rnd(), rnd() * 3, 0.88);
      for (let i = 0; i < 24; i++) blob(ctx, rnd() * w, rnd() * h * 0.8, 0.007 * w, 0.02 * h, P[2], 0.9, 0, 0.9);
    } else if (v.desen === 'panda') {
      for (let i = 0; i < 6; i++) blob(ctx, rnd() * w, rnd() * h * 0.7, (0.05 + rnd() * 0.09) * w, (0.12 + rnd() * 0.25) * h, P[0], 0.95, rnd() * 3, 0.92);
      blob(ctx, w * 0.1, h * 0.3, w * 0.05, h * 0.2, P[0], 0.95, 0, 0.9);
    }
    // metalik pul parıltısı: her pulun üst kenarı hafif ışık, alt kenarı hafif gölge
    const cols = inci ? 20 : 34, rows = inci ? 7 : 11, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows + 1; r++) for (let c = -1; c < cols + 1; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * cw + cw * 0.5, y = r * ch;
      if (x < w * 0.19) continue;
      const k = 0.5 + 0.5 * Math.sin(r * 1.7 + c * 0.9);
      const sg = ctx.createRadialGradient(x, y - ch * 0.2, 0, x, y, cw * 0.62);
      sg.addColorStop(0, rgba(v.sedef ? '#e6eef6' : mixHex(v.body.yan, '#ffffff', 0.55), (v.sedef ? 0.28 : 0.16) + 0.22 * v.parlak * k));
      sg.addColorStop(0.7, rgba(v.body.yan, 0));
      sg.addColorStop(1, rgba('#000000', 0.18 + 0.05 * k));
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(x, y, cw * 0.62, 0, Math.PI * 2); ctx.fill();
    }
    // yan çizgi
    ctx.strokeStyle = rgba('#000000', 0.2);
    ctx.lineWidth = Math.max(1, w / 500);
    ctx.setLineDash([w / 220, w / 330]);
    ctx.beginPath(); ctx.moveTo(w * LATERAL.s0, h * LATERAL.w); ctx.lineTo(w * LATERAL.s1, h * (LATERAL.w + 0.02)); ctx.stroke();
    ctx.setLineDash([]);
    // baş: hafif koyu üst; solungaç kapağı sınırı
    const hg = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    hg.addColorStop(0, rgba(v.body.sirt, 0.5)); hg.addColorStop(1, rgba(v.body.sirt, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w * 0.2, h * 0.5);
    ctx.fillStyle = rgba('#000000', 0.12);
    ctx.fillRect(w * 0.197, 0, w * 0.005, h);
  };
  const color = assembleBody(W, Hh, paint);
  void makeCanvas; void flatBump;
  const bump = inci ? scaleBump(W, Hh, 20, 7, 1.0) : scaleBump(W, Hh, 34, 11, 0.55);
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'anal', 'kuyruk', 'karin']) fins[id] = paintFin(v.fin);
  fins.gogus = paintFin(v.gogus);
  return { color, bump, fins };
}
