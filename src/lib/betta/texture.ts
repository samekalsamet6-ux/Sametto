// Betta gövde ve yüzgeç dokuları (<canvas>; tarayıcıya özgü, sahte canvas ile birim testlenir).
import { assembleBody, blob, flatBump, paintFin, rgba, scaleBump, type Ctx, type FinStyle } from '../akvaryum/fishtex';
import { mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { seedFor, sexTone, type Variant } from './variants';

export function toneFin(style: FinStyle, sex: SexId, v: Variant): FinStyle {
  if (sex !== 'disi') return style;
  const a = v.desen === 'saydam' ? 1 : 0.82;
  return {
    ...style,
    stops: style.stops.map(([p, c, al]): [number, string, number] => [p, sexTone(c, sex, v), al * a]),
    speckle: style.speckle && { ...style.speckle, color: sexTone(style.speckle.color, sex, v), alpha: style.speckle.alpha * 0.8 },
    rays: style.rays && { ...style.rays, color: sexTone(style.rays.color, sex, v) },
  };
}

export interface BettaTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

export function paintBody(v: Variant, sex: SexId, W = 1024): BettaTextures {
  const Hh = W / 4;
  const T = (c: string) => sexTone(c, sex, v);
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 977));
    // zemin: sırttan karına
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, T(v.body.sirt));
    g.addColorStop(0.38, T(v.body.yan));
    g.addColorStop(0.72, T(v.body.yan));
    g.addColorStop(1, T(v.body.karin));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // baş
    const hg = ctx.createLinearGradient(0, 0, w * 0.27, 0);
    hg.addColorStop(0, rgba(T(v.body.bas), 0.85));
    hg.addColorStop(0.8, rgba(T(v.body.bas), 0.45));
    hg.addColorStop(1, rgba(T(v.body.bas), 0));
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, w * 0.27, h);

    const P = v.yamalar;
    if (v.desen === 'koi') {
      for (let i = 0; i < 11; i++) blob(ctx, rnd() * w * 0.95 + w * 0.03, rnd() * h * 0.8 + h * 0.05, (0.05 + rnd() * 0.1) * w, (0.1 + rnd() * 0.18) * h, P[i % 3 === 2 ? 1 : 0], 0.95, rnd() * 3, 0.9);
      for (let i = 0; i < 4; i++) blob(ctx, rnd() * w, rnd() * h, 0.03 * w, 0.06 * h, P[1], 0.9, rnd() * 3, 0.9);
    } else if (v.desen === 'mermer') {
      for (let i = 0; i < 26; i++) blob(ctx, rnd() * w, rnd() * h, (0.02 + rnd() * 0.08) * w, (0.06 + rnd() * 0.2) * h, P[Math.floor(rnd() * P.length)], 0.92, rnd() * 3, 0.88);
    } else if (v.desen === 'ejder') {
      const cols = 46, rows = 15, cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows + 1; r++) for (let c = -1; c < cols + 1; c++) {
        const x = (c + (r % 2 ? 0.5 : 0)) * cw, y = r * ch;
        const k = 0.5 + 0.5 * Math.sin(r * 0.9 + c * 0.37) * 0.4;
        const sg = ctx.createRadialGradient(x, y - ch * 0.15, 0, x, y, cw * 0.78);
        sg.addColorStop(0, rgba(mixHex(T(v.body.yan), '#fff6e6', 0.55), 0.95));
        sg.addColorStop(0.65, rgba(T(v.body.yan), 0.9));
        sg.addColorStop(1, rgba(mixHex(P[0], '#2a0a08', 0.2 + 0.2 * k), 0.85));
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(x, y, cw * 0.78, 0, Math.PI * 2); ctx.fill();
      }
      // sırtta kırmızımsı gölge
      const rg = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      rg.addColorStop(0, rgba(P[0], 0.7)); rg.addColorStop(1, rgba(P[0], 0));
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h * 0.35);
    } else if (v.desen === 'orkide') {
      for (let i = 0; i < 40; i++) blob(ctx, rnd() * w, rnd() * h * 0.7 + h * 0.1, (0.02 + rnd() * 0.04) * w, 0.02 * h, '#4a3fa8', 0.25, 0, 0.7);
    }
    // metalik parıltı: yan şeridi boyunca ışık
    if (v.parlak > 0) {
      const tone = v.desen === 'duz' || v.desen === 'orkide' || v.desen === 'kelebek' ? mixHex(v.body.yan, '#ffffff', 0.45) : '#ffffff';
      for (let i = 0; i < 14; i++) blob(ctx, w * (0.2 + 0.7 * rnd()), h * (0.28 + 0.2 * rnd()), (0.06 + 0.07 * rnd()) * w, 0.045 * h, tone, 0.2 * v.parlak, 0, 0.5);
    }
    // pul ipuçları
    if (v.pul > 0 && v.desen !== 'ejder') {
      ctx.strokeStyle = rgba('#000000', 0.12 * v.pul + 0.04);
      ctx.lineWidth = Math.max(1, w / 900);
      const cols = 40, rows = 14, cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = (c + (r % 2 ? 0.5 : 0)) * cw + cw * 0.5, y = r * ch + ch * 0.5;
        if (x < w * 0.24) continue;
        ctx.beginPath(); ctx.arc(x, y, cw * 0.55, -0.3, 1.9); ctx.stroke();
      }
    }
    // dişide üreme dönemi dikey şeritler (soluk)
    if (sex === 'disi' && v.desen !== 'saydam') {
      for (let i = 0; i < 7; i++) {
        const x = w * (0.28 + i * 0.09);
        const bg = ctx.createLinearGradient(x - w * 0.012, 0, x + w * 0.012, 0);
        bg.addColorStop(0, rgba('#000000', 0)); bg.addColorStop(0.5, rgba('#000000', 0.2)); bg.addColorStop(1, rgba('#000000', 0));
        ctx.fillStyle = bg; ctx.fillRect(x - w * 0.012, h * 0.05, w * 0.024, h * 0.8);
      }
    }
    // solungaç kapağı kenarı
    ctx.fillStyle = rgba('#000000', 0.12);
    ctx.fillRect(w * 0.205, 0, w * 0.006, h);
  };
  const color = assembleBody(W, Hh, paint);
  const bump = v.pul > 0.5 ? scaleBump(W, Hh, 46, 15, 0.7) : v.pul > 0 ? scaleBump(W, Hh, 40, 14, 0.18 + 0.2 * v.pul) : flatBump(W, Hh * 2);
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'anal', 'kuyruk']) fins[id] = paintFin(toneFin(v.fin, sex, v));
  fins.karin = paintFin(toneFin(v.fin, sex, v));
  fins.gogus = paintFin(toneFin(v.gogus, sex, v));
  return { color, bump, fins };
}
