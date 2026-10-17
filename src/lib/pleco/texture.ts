// Pleko gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt ortası (üst) → karın ortası (alt).
import { assembleBody, blob, makeCanvas, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
import { lerp, mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { ARMOR } from './model';
import { seedFor, type Variant } from './variants';

export interface PlecoTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

/** Plaka sıralarının dikey sınırları (satır yüksekliğine oranla): sırt, üst yan, alt yan, karın yanı */
export const ROW_Y = [0.03, 0.22, 0.42, 0.6, 0.78] as const;

export function plateEdges(w: number): { row: number; x0: number; x1: number }[] {
  const out: { row: number; x0: number; x1: number }[] = [];
  const n = ARMOR.plates, a = ARMOR.s0 * w, b = ARMOR.s1 * w;
  for (let row = 0; row < ARMOR.rows; row++) for (let i = 0; i < n; i++) {
    const off = row % 2 ? 0.5 : 0;
    const x0 = lerp(a, b, (i + off) / (n + 0.5)), x1 = lerp(a, b, (i + off + 1.15) / (n + 0.5));
    out.push({ row, x0, x1: Math.min(x1, b) });
  }
  return out;
}

export function paintBody(v: Variant, sex: SexId, W = 1024): PlecoTextures {
  const Hh = W / 4;
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 53));
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.body.sirt);
    g.addColorStop(0.3, v.body.yan);
    g.addColorStop(0.6, v.body.yan);
    g.addColorStop(0.8, mixHex(v.body.yan, v.body.karin, 0.6));
    g.addColorStop(1, v.body.karin);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // baş
    const hg = ctx.createLinearGradient(0, 0, w * 0.27, 0);
    hg.addColorStop(0, rgba(v.body.bas, 0.95)); hg.addColorStop(0.8, rgba(v.body.bas, 0.55)); hg.addColorStop(1, rgba(v.body.bas, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w * 0.27, h * 0.8);
    // desen
    if (v.desen === 'calico') {
      for (let i = 0; i < 22; i++) {
        const c = v.yamalar[Math.floor(rnd() * v.yamalar.length)];
        blob(ctx, rnd() * w, rnd() * h * 0.85, (0.03 + rnd() * 0.07) * w, (0.1 + rnd() * 0.22) * h, c, 0.7 + 0.25 * rnd(), rnd() * 3, 0.85);
      }
    }
    const nSpot = Math.round(520 * v.benek.yogunluk);
    for (let i = 0; i < nSpot; i++) {
      const hd = rnd() < 0.3, x = hd ? rnd() * w * 0.24 : rnd() * w;
      const r = (0.0032 + rnd() * 0.0042) * w * v.benek.boyut * (hd ? 0.75 : 1);
      blob(ctx, x, rnd() * h * 0.84, r, r, v.benek.renk, 0.5 + 0.4 * rnd(), 0, 0.8);
    }
    // plaka sıraları: dik kenar çizgileri ve sıra sınırında omurga çizgisi
    const edges = plateEdges(w);
    ctx.lineWidth = Math.max(1, w / 650);
    for (const e of edges) {
      const y0 = h * ROW_Y[e.row], y1 = h * ROW_Y[e.row + 1];
      ctx.strokeStyle = rgba('#000000', 0.18 * v.zirh + 0.05);
      ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(e.x0 + (e.x1 - e.x0) * 0.2, y1); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.1 * v.zirh);
      ctx.beginPath(); ctx.moveTo(e.x0 + 2, y0); ctx.lineTo(e.x0 + 2 + (e.x1 - e.x0) * 0.2, y1); ctx.stroke();
    }
    for (let r = 0; r <= ARMOR.rows; r++) {
      const y = h * ROW_Y[r];
      ctx.strokeStyle = rgba('#000000', 0.24 * v.zirh + 0.04);
      ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, y); ctx.lineTo(w * ARMOR.s1, y); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.14 * v.zirh);
      ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, y + 2); ctx.lineTo(w * ARMOR.s1, y + 2); ctx.stroke();
    }
    // baş kalkanı çizgileri ve solungaç kapağı sınırı
    ctx.strokeStyle = rgba('#000000', 0.2);
    ctx.lineWidth = Math.max(1, w / 500);
    for (const f of [0.09, 0.16]) { ctx.beginPath(); ctx.moveTo(w * f, 0); ctx.quadraticCurveTo(w * (f + 0.03), h * 0.22, w * f, h * 0.46); ctx.stroke(); }
    ctx.fillStyle = rgba('#000000', 0.14);
    ctx.fillRect(w * 0.21, 0, w * 0.006, h * 0.8);
  };
  const color = assembleBody(W, Hh, paint);
  // kabartma: plakalar + baş odontodları
  const bump = makeCanvas(W, Hh * 2);
  const bc = bump.getContext('2d')!;
  bc.fillStyle = '#707070';
  bc.fillRect(0, 0, W, Hh * 2);
  const rb = mulberry32(seedFor(v, sex) + 7);
  for (const half of [0, 1]) {
    for (const e of plateEdges(W)) {
      const y0 = Hh * ROW_Y[e.row], hh = Hh * (ROW_Y[e.row + 1] - ROW_Y[e.row]);
      const gr = bc.createLinearGradient(e.x0, 0, e.x1, 0);
      gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.25, '#d6d6d6'); gr.addColorStop(1, '#8a8a8a');
      bc.fillStyle = gr;
      bc.fillRect(e.x0, half ? Hh * 2 - (y0 + hh) : y0, e.x1 - e.x0, hh * 0.94);
    }
    for (let i = 0; i < 160; i++) {
      const x = rb() * W * 0.24, y = rb() * Hh * 0.8, yy = half ? Hh * 2 - y : y;
      bc.fillStyle = 'rgba(255,255,255,0.55)';
      bc.beginPath(); bc.arc(x, yy, W / 330, 0, Math.PI * 2); bc.fill();
    }
  }
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'yag', 'anal', 'kuyruk', 'karin']) fins[id] = paintFin(v.fin);
  fins.gogus = paintFin(v.gogus);
  return { color, bump, fins };
}
