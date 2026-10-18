// Corydoras gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
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

/** Plaka sıralarının dikey sınırları (yarım doku yüksekliğine oranla): sırt kenarı, yan çizgi, karın kenarı */
export const PLATE_Y = { top: 0.07, mid: 0.5, bot: 0.93 } as const;

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
    // ---- zırh plakaları (skut): iki sıra; her plaka ön kenarı bir öncekinin altında kalır, arka kenarı parlak ve keskin
    const edges = plateEdges(w), z = Math.min(1, v.zirh) * 0.5;
    const yTop = h * PLATE_Y.top, yMid = h * PLATE_Y.mid, yBot = h * PLATE_Y.bot;
    for (const e of edges) {
      const y0 = e.row ? yMid : yTop, y1 = e.row ? yBot : yMid, sl = (e.x1 - e.x0) * 0.42 * (e.row ? -1 : 1);
      const x1 = e.x1;
      if (e.row) { ctx.fillStyle = rgba(v.body.karin, 0.22); ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 + sl, y1); ctx.lineTo(e.x0 + sl, y1); ctx.closePath(); ctx.fill(); }
      const tone = rnd() < 0.5 ? '#ffffff' : '#000000';
      ctx.fillStyle = rgba(tone, 0.025 + 0.05 * rnd());
      ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 + sl, y1); ctx.lineTo(e.x0 + sl, y1); ctx.closePath(); ctx.fill();
      const gr = ctx.createLinearGradient(e.x0, 0, x1, 0);
      gr.addColorStop(0, rgba('#000000', 0.34 * z + 0.06));
      gr.addColorStop(0.3, rgba('#000000', 0.04));
      gr.addColorStop(0.62, rgba('#ffffff', 0.06 * z));
      gr.addColorStop(0.9, rgba('#ffffff', 0.2 * z + 0.04));
      gr.addColorStop(1, rgba('#000000', 0.3 * z));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 + sl, y1); ctx.lineTo(e.x0 + sl, y1); ctx.closePath(); ctx.fill();
      // dikey yuvarlaklık: plakanın üst/alt kenarı koyu
      const vg = ctx.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, rgba('#000000', 0.12 * z)); vg.addColorStop(0.22, rgba('#000000', 0)); vg.addColorStop(0.78, rgba('#000000', 0)); vg.addColorStop(1, rgba('#000000', 0.12 * z));
      ctx.fillStyle = vg; ctx.fillRect(e.x0, y0, x1 - e.x0, y1 - y0);
      // arka kenar: ince koyu çizgi + açık kenar
      ctx.lineWidth = Math.max(1, w / 560);
      ctx.strokeStyle = rgba('#000000', 0.5 * z + 0.12);
      ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(x1 + sl, y1); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.28 * z);
      ctx.beginPath(); ctx.moveTo(x1 - ctx.lineWidth * 1.4, y0); ctx.lineTo(x1 + sl - ctx.lineWidth * 1.4, y1); ctx.stroke();
    }
    // yan çizgi: iki sıranın birleştiği sırt çizgisi (kıl) ve gözenekler
    ctx.lineWidth = Math.max(2, w / 380);
    ctx.strokeStyle = rgba('#000000', 0.45 * z + 0.1);
    ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, yMid); ctx.lineTo(w * ARMOR.s1, yMid); ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.3 * z + 0.05);
    ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, yMid + ctx.lineWidth); ctx.lineTo(w * ARMOR.s1, yMid + ctx.lineWidth); ctx.stroke();
    for (const e of edges) if (e.row === 0) blob(ctx, (e.x0 + e.x1) / 2, yMid, w * 0.0022, w * 0.0022, '#000000', 0.5, 0, 0.8);
    // sırt ve karın kenarındaki küçük orta plakalar
    ctx.lineWidth = Math.max(1, w / 700);
    ctx.strokeStyle = rgba('#000000', 0.28 * z);
    for (let x = w * ARMOR.s0; x < w * ARMOR.s1; x += w * 0.019) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w * 0.004, h * 0.07); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + w * 0.004, h * 0.93); ctx.stroke(); }
    // ---- baş: kemikli kalkan, dikişler, solungaç kapağı plakası
    const hs = h * 0.74;
    ctx.strokeStyle = rgba('#000000', 0.18);
    ctx.lineWidth = Math.max(1, w / 520);
    for (const [xa, xb] of [[0.05, 0.075], [0.1, 0.12], [0.15, 0.168]] as const) { ctx.beginPath(); ctx.moveTo(w * xa, 0); ctx.quadraticCurveTo(w * (xa + 0.03), h * 0.25, w * xb, hs * 0.62); ctx.stroke(); }
    const rg = ctx.createRadialGradient(w * 0.168, h * 0.4, 0, w * 0.168, h * 0.4, w * 0.055);
    rg.addColorStop(0, rgba('#ffffff', 0.2)); rg.addColorStop(1, rgba('#ffffff', 0));
    ctx.fillStyle = rg; ctx.fillRect(w * 0.1, h * 0.1, w * 0.12, h * 0.6);
    for (let i = 0; i < 70; i++) blob(ctx, rnd() * w * 0.2, rnd() * hs, w * 0.0022, w * 0.0022, '#ffffff', 0.16 * z + 0.04, 0, 0.7);
    // solungaç kapağı ve omuz kuşağı kenarı: koyu çizgi + gölge
    ctx.fillStyle = rgba('#000000', 0.2);
    ctx.fillRect(w * 0.205, 0, w * 0.004, h);
    const sg = ctx.createLinearGradient(w * 0.208, 0, w * 0.245, 0);
    sg.addColorStop(0, rgba('#000000', 0.24)); sg.addColorStop(1, rgba('#000000', 0));
    ctx.fillStyle = sg; ctx.fillRect(w * 0.208, 0, w * 0.04, h);
  };
  const color = assembleBody(W, Hh, paint);
  // kabartma: plakalar (testere dişi yükseklik: arka kenar keskin), orta kıl, baş kalkanı
  const bump = assembleBody(W, Hh, (bc, w, h) => {
    bc.fillStyle = '#6c6c6c';
    bc.fillRect(0, 0, w, h);
    const yTop = h * PLATE_Y.top, yMid = h * PLATE_Y.mid, yBot = h * PLATE_Y.bot;
    for (const e of plateEdges(w)) {
      const y0 = e.row ? yMid : yTop, y1 = e.row ? yBot : yMid, sl = (e.x1 - e.x0) * 0.42 * (e.row ? -1 : 1);
      const gr = bc.createLinearGradient(e.x0, 0, e.x1, 0);
      gr.addColorStop(0, '#4c4c4c'); gr.addColorStop(0.18, '#a0a0a0'); gr.addColorStop(0.7, '#cfcfcf'); gr.addColorStop(0.94, '#dedede'); gr.addColorStop(1, '#3c3c3c');
      bc.fillStyle = gr;
      bc.beginPath(); bc.moveTo(e.x0, y0); bc.lineTo(e.x1, y0); bc.lineTo(e.x1 + sl, y1); bc.lineTo(e.x0 + sl, y1); bc.closePath(); bc.fill();
      const vg = bc.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, 'rgba(60,60,60,0.85)'); vg.addColorStop(0.2, 'rgba(60,60,60,0)'); vg.addColorStop(0.8, 'rgba(60,60,60,0)'); vg.addColorStop(1, 'rgba(60,60,60,0.8)');
      bc.fillStyle = vg; bc.fillRect(e.x0, y0, e.x1 - e.x0, y1 - y0);
    }
    // yan çizgi kılı: yüksek sırt
    bc.fillStyle = '#ffffff';
    bc.fillRect(w * ARMOR.s0, yMid - h * 0.012, w * (ARMOR.s1 - ARMOR.s0), h * 0.024);
    // baş kalkanı: yükseltili plaka alanları, dikiş olukları, solungaç kapağı kabarıklığı
    const hg = bc.createRadialGradient(w * 0.15, h * 0.34, 0, w * 0.15, h * 0.34, w * 0.07);
    hg.addColorStop(0, 'rgba(235,235,235,0.9)'); hg.addColorStop(1, 'rgba(108,108,108,0)');
    bc.fillStyle = hg; bc.fillRect(w * 0.06, 0, w * 0.17, h * 0.8);
    bc.fillStyle = '#303030';
    for (const xa of [0.05, 0.1, 0.15]) bc.fillRect(w * xa, 0, w * 0.0035, h * 0.55);
    bc.fillRect(w * 0.205, 0, w * 0.006, h);
    const rb = mulberry32(seedFor(v, sex) + 11);
    for (let i = 0; i < 90; i++) { bc.fillStyle = 'rgba(255,255,255,0.5)'; bc.beginPath(); bc.arc(rb() * w * 0.2, rb() * h * 0.72, w / 520, 0, Math.PI * 2); bc.fill(); }
  });
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'yag', 'anal', 'kuyruk', 'karin']) fins[id] = paintFin(v.fin);
  fins.gogus = paintFin(v.gogus);
  return { color, bump, fins };
}
