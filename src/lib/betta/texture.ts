// Betta gövde ve yüzgeç dokuları (<canvas>; tarayıcıya özgü, sahte canvas ile birim testlenir).
import { assembleBody, blob, flatBump, paintFin, rgba, scaleBump, type Ctx, type FinStyle } from '../akvaryum/fishtex';
import { mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { seedFor, sexTone, type Variant } from './variants';
import { finsFor, formById, webFraction } from './model';

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

export function paintBody(v: Variant, sex: SexId, W = 1024, form?: string): BettaTextures {
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
  const spec = formById(form);
  const web = webFraction(form, sex);
  for (const f of finsFor(sex, form)) {
    if (f.id === 'gogus') {
      const g = toneFin(v.gogus, sex, v);
      // fil kulakta göğüs yüzgeci kürek biçimini okunur kılmak için biraz daha opak
      fins.gogus = paintFin(spec.pectoral > 1.5 ? { ...g, stops: g.stops.map(([p, c, al]): [number, string, number] => [p, c, Math.min(0.6, al * 1.7 + 0.1)]) } : g);
      continue;
    }
    const cv = paintFin(toneFin(v.fin, sex, v));
    const unpairedBig = f.id === 'sirt' || f.id === 'anal' || f.id.startsWith('kuyruk');
    if (unpairedBig && spec.tex !== 'plain' && spec.tex !== 'rose') shapeWeb(cv, f.base.length, web, toneFin(v.fin, sex, v).rays?.color ?? '#000000', spec.tex === 'crown' ? 5 : 2.2);
    else if (unpairedBig && spec.tex === 'rose') shapeWeb(cv, f.base.length, web, toneFin(v.fin, sex, v).rays?.color ?? '#000000', 1, true);
    fins[f.id] = cv;
  }
  return { color, bump, fins };
}

/** Işınlar arasındaki zarı geri çeker: sütun i = geometrideki i. ışın (u = i/(n−1)); ışın ucu v=1'de kalır, ara bölge `web` oranına kadar uzanır */
export function webEdge(x01: number, columns: number, web: number, sharp: number): number {
  const t = x01 * (columns - 1), fr = t - Math.floor(t);
  const d = Math.abs(Math.cos(Math.PI * fr)); // ışında 1, aralığın ortasında 0
  return web + (1 - web) * Math.pow(d, sharp);
}

function shapeWeb(cv: HTMLCanvasElement, columns: number, web: number, rayColor: string, sharp: number, frill = false) {
  const ctx = cv.getContext('2d')!;
  const W = cv.width, H = cv.height;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  const steps = (columns - 1) * 8;
  for (let i = steps; i >= 0; i--) ctx.lineTo((i / steps) * W, webEdge(i / steps, columns, web, sharp) * H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (frill) return;
  // ışın çizgileri (şeffaf varyetelerde bile okunur kalsın)
  ctx.strokeStyle = rgba(rayColor, 0.7);
  ctx.lineWidth = Math.max(1.5, W / (columns - 1) / 4);
  for (let i = 0; i < columns; i++) { const x = (i / (columns - 1)) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.995); ctx.stroke(); }
}
