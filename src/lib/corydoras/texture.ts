// Corydoras gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, makeCanvas, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
import { lerp, mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { ARMOR } from './model';
import { seedFor, type Variant } from './variants';

export interface CoryTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

/** İki sıra zırh plakasının sınırları: x konumları (piksel) ve satır başına w aralığı */
export function plateEdges(w: number): { row: number; x0: number; x1: number }[] {
  const out: { row: number; x0: number; x1: number }[] = [];
  const n = ARMOR.plates, a = ARMOR.s0 * w, b = ARMOR.s1 * w;
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const off = row ? 0.5 : 0;
    const x0 = lerp(a, b, (i + off) / (n + 0.5)), x1 = lerp(a, b, (i + off + 1.1) / (n + 0.5));
    out.push({ row, x0, x1: Math.min(x1, b) });
  }
  return out;
}

export function paintBody(v: Variant, sex: SexId, W = 1024): CoryTextures {
  const Hh = W / 4;
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 53));
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.body.sirt);
    g.addColorStop(0.3, v.body.yan);
    g.addColorStop(0.62, v.body.yan);
    g.addColorStop(0.8, mixHex(v.body.yan, v.body.karin, 0.55));
    g.addColorStop(1, v.body.karin);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // baş
    const hg = ctx.createLinearGradient(0, 0, w * 0.26, 0);
    hg.addColorStop(0, rgba(v.body.bas, 0.9)); hg.addColorStop(0.75, rgba(v.body.bas, 0.5)); hg.addColorStop(1, rgba(v.body.bas, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w * 0.26, h * 0.72);
    // metalik parıltı (yan çizgi boyunca)
    if (v.parilti.yogunluk > 0) {
      const sg = ctx.createLinearGradient(0, h * 0.22, 0, h * 0.7);
      sg.addColorStop(0, rgba(v.parilti.renk, 0)); sg.addColorStop(0.5, rgba(v.parilti.renk, 0.5 * v.parilti.yogunluk)); sg.addColorStop(1, rgba(v.parilti.renk, 0));
      ctx.fillStyle = sg; ctx.fillRect(w * 0.18, h * 0.22, w * 0.8, h * 0.48);
    }
    // desen
    if (v.desen === 'benekli') {
      for (let i = 0; i < 70; i++) blob(ctx, rnd() * w * 0.95 + w * 0.05, rnd() * h * 0.85, (0.014 + rnd() * 0.04) * w, (0.04 + rnd() * 0.12) * h, v.yama, 0.55 + 0.3 * rnd(), rnd() * 3, 0.8);
      for (let i = 0; i < 40; i++) blob(ctx, rnd() * w, rnd() * h * 0.7, 0.01 * w, 0.025 * h, v.benek, 0.35, 0, 0.6);
    } else if (v.desen === 'sterbai') {
      for (let i = 0; i < 380; i++) { const y = rnd() * h * 0.82; blob(ctx, rnd() * w, y, (0.005 + rnd() * 0.006) * w, (0.005 + rnd() * 0.006) * w, v.benek, 0.95, 0, 0.8); }
    } else if (v.desen === 'bronz') {
      for (let i = 0; i < 26; i++) blob(ctx, rnd() * w, rnd() * h * 0.4, (0.01 + rnd() * 0.03) * w, 0.05 * h, v.yama, 0.18, rnd() * 3, 0.7);
    } else {
      for (let i = 0; i < 10; i++) blob(ctx, rnd() * w, rnd() * h * 0.6, 0.03 * w, 0.08 * h, v.yama, 0.12, 0, 0.7);
    }
    // zırh plakaları: kenarlarda ince koyu çizgi ve açık kenar
    const edges = plateEdges(w);
    const yTop = h * 0.08, yMid = h * 0.52, yBot = h * 0.95;
    ctx.lineWidth = Math.max(1, w / 700);
    for (const e of edges) {
      const y0 = e.row ? yMid : yTop, y1 = e.row ? yBot : yMid;
      ctx.strokeStyle = rgba('#000000', 0.2 * v.zirh + 0.06);
      ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(e.x0 + (e.x1 - e.x0) * 0.14, y1); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.1 * v.zirh);
      ctx.beginPath(); ctx.moveTo(e.x0 + 2, y0); ctx.lineTo(e.x0 + 2 + (e.x1 - e.x0) * 0.14, y1); ctx.stroke();
    }
    ctx.strokeStyle = rgba('#000000', 0.22);
    ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, yMid); ctx.lineTo(w * ARMOR.s1, yMid); ctx.stroke();
    // baş kalkanı ve solungaç kapağı sınırı
    ctx.fillStyle = rgba('#000000', 0.12);
    ctx.fillRect(w * 0.2, 0, w * 0.006, h);
  };
  const color = assembleBody(W, Hh, paint);
  // kabartma: plakalar
  const bump = makeCanvas(W, Hh * 2);
  const bc = bump.getContext('2d')!;
  bc.fillStyle = '#707070';
  bc.fillRect(0, 0, W, Hh * 2);
  for (const half of [0, 1]) for (const e of plateEdges(W)) {
    const y0 = Hh * (e.row ? 0.52 : 0.08), hh = Hh * 0.43;
    const gr = bc.createLinearGradient(e.x0, 0, e.x1, 0);
    gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.25, '#d0d0d0'); gr.addColorStop(1, '#8a8a8a');
    bc.fillStyle = gr;
    bc.fillRect(e.x0, half ? Hh * 2 - (y0 + hh) : y0, e.x1 - e.x0, hh);
  }
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'yag', 'anal', 'kuyruk', 'karin']) fins[id] = paintFin(v.fin);
  fins.gogus = paintFin(v.gogus);
  return { color, bump, fins };
}
