// Pleko gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt ortası (üst) → karın ortası (alt).
import { assembleBody, blob, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
import { lerp, mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { ARMOR, OPERCULUM } from './model';
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
    // ---- karın: açık renkli, ince benekli; göğüs kuşağı (kleitrum) plakası ve ince karın plakaları
    const bg = ctx.createLinearGradient(0, h * 0.78, 0, h);
    bg.addColorStop(0, rgba(v.body.karin, 0)); bg.addColorStop(0.35, rgba(v.body.karin, 0.55)); bg.addColorStop(1, rgba(v.body.karin, 0.8));
    ctx.fillStyle = bg; ctx.fillRect(0, h * 0.78, w, h * 0.22);
    for (let i = 0; i < 260; i++) blob(ctx, rnd() * w, h * (0.8 + 0.2 * rnd()), w * (0.0025 + 0.003 * rnd()), w * (0.0025 + 0.003 * rnd()), rnd() < 0.55 ? mixHex(v.body.yan, '#000000', 0.35) : v.benek.renk, 0.28 + 0.3 * rnd() * v.benek.yogunluk, 0, 0.7);
    ctx.lineWidth = Math.max(1, w / 650);
    ctx.strokeStyle = rgba('#000000', 0.2);
    ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.86); ctx.quadraticCurveTo(w * 0.2, h * 0.8, w * 0.3, h * 0.86); ctx.lineTo(w * 0.31, h); ctx.stroke();
    for (let x = w * 0.3; x < w * ARMOR.s1; x += w * 0.03) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + w * 0.006, h * 0.9); ctx.stroke(); }
    // ---- kemikli plakalar (4 sıra): her plaka ön kenarı bir öncekinin altında; sıra ortasında sırt (kil) çizgisi ve dişçikler (odontod)
    const edges = plateEdges(w), z = Math.min(1, v.zirh);
    for (const e of edges) {
      const y0 = h * ROW_Y[e.row], y1 = h * ROW_Y[e.row + 1], sl = (e.x1 - e.x0) * 0.3;
      const gr = ctx.createLinearGradient(e.x0, 0, e.x1, 0);
      gr.addColorStop(0, rgba('#000000', 0.3 * z + 0.05)); gr.addColorStop(0.3, rgba('#000000', 0.02)); gr.addColorStop(0.75, rgba('#ffffff', 0.06 * z)); gr.addColorStop(0.95, rgba('#ffffff', 0.18 * z)); gr.addColorStop(1, rgba('#000000', 0.3 * z));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(e.x0, y0); ctx.lineTo(e.x1, y0); ctx.lineTo(e.x1 + sl, y1); ctx.lineTo(e.x0 + sl, y1); ctx.closePath(); ctx.fill();
      ctx.lineWidth = Math.max(1, w / 650);
      ctx.strokeStyle = rgba('#000000', 0.4 * z + 0.08);
      ctx.beginPath(); ctx.moveTo(e.x1, y0); ctx.lineTo(e.x1 + sl, y1); ctx.stroke();
      // odontodlar: plakanın arka yarısında kil çizgisi boyunca küçük sivri dişçikler
      const ym = (y0 + y1) / 2;
      for (let k = 0; k < 3; k++) {
        const x = lerp(e.x0 + (e.x1 - e.x0) * 0.35, e.x1, k / 2) + sl * 0.5;
        blob(ctx, x, ym + (rnd() - 0.5) * (y1 - y0) * 0.12, w * 0.0026, w * 0.0026, '#fff4d8', 0.5 * z + 0.12, 0, 0.7);
        blob(ctx, x + w * 0.0016, ym + (rnd() - 0.5) * (y1 - y0) * 0.12 + h * 0.012, w * 0.0018, w * 0.0018, '#000000', 0.25 * z, 0, 0.7);
      }
    }
    for (let r = 0; r <= ARMOR.rows; r++) {
      const y = h * ROW_Y[r];
      ctx.lineWidth = Math.max(1.5, w / 520);
      ctx.strokeStyle = rgba('#000000', 0.3 * z + 0.06);
      ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, y); ctx.lineTo(w * ARMOR.s1, y); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.18 * z);
      ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, y + 2); ctx.lineTo(w * ARMOR.s1, y + 2); ctx.stroke();
      if (r < ARMOR.rows) {
        const ym = h * (ROW_Y[r] + ROW_Y[r + 1]) / 2;
        ctx.lineWidth = Math.max(1, w / 700);
        ctx.strokeStyle = rgba('#ffffff', 0.22 * z); ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, ym); ctx.lineTo(w * ARMOR.s1, ym); ctx.stroke();
        ctx.strokeStyle = rgba('#000000', 0.2 * z); ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, ym + 2); ctx.lineTo(w * ARMOR.s1, ym + 2); ctx.stroke();
      }
    }
    // ---- baş kalkanı: yassı ve geniş; kemik plaka dikişleri, göz çukuru çevresi ve kenarlarda yoğun odontodlar
    ctx.strokeStyle = rgba('#000000', 0.22);
    ctx.lineWidth = Math.max(1, w / 480);
    for (const f of [0.07, 0.13, 0.2]) { ctx.beginPath(); ctx.moveTo(w * f, 0); ctx.quadraticCurveTo(w * (f + 0.03), h * 0.22, w * f, h * 0.46); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(w * 0.04, h * 0.18); ctx.quadraticCurveTo(w * 0.15, h * 0.3, w * 0.25, h * 0.2); ctx.stroke();
    for (let i = 0; i < 110; i++) { const x = rnd() * w * (OPERCULUM.s + 0.01), y = (rnd() < 0.5 ? rnd() * 0.18 : 0.38 + rnd() * 0.3) * h; blob(ctx, x, y, w * 0.002, w * 0.002, '#fff1cf', 0.18 + 0.3 * z * rnd(), 0, 0.7); }
    // solungaç kapağı: yükseltili plaka, arka kenarında gölge ve parlak sınır
    const og = ctx.createLinearGradient(w * (OPERCULUM.s - 0.07), 0, w * (OPERCULUM.s + 0.03), 0);
    og.addColorStop(0, rgba('#ffffff', 0)); og.addColorStop(0.8, rgba('#ffffff', 0.1)); og.addColorStop(1, rgba('#000000', 0.25));
    ctx.fillStyle = og; ctx.fillRect(w * (OPERCULUM.s - 0.07), 0, w * 0.1, h * 0.74);
    ctx.fillStyle = rgba('#000000', 0.26);
    ctx.fillRect(w * (OPERCULUM.s + 0.005), 0, w * 0.0055, h * 0.8);
  };
  const color = assembleBody(W, Hh, paint);
  // kabartma: plakalar (arka kenar keskin), her sıranın ortasında kil çizgisi, odontodlar, baş kalkanı
  const bump = assembleBody(W, Hh, (bc, w, h) => {
    bc.fillStyle = '#6c6c6c';
    bc.fillRect(0, 0, w, h);
    const rb = mulberry32(seedFor(v, sex) + 7);
    for (const e of plateEdges(w)) {
      const y0 = h * ROW_Y[e.row], y1 = h * ROW_Y[e.row + 1], sl = (e.x1 - e.x0) * 0.3;
      const gr = bc.createLinearGradient(e.x0, 0, e.x1, 0);
      gr.addColorStop(0, '#404040'); gr.addColorStop(0.2, '#a8a8a8'); gr.addColorStop(0.75, '#dcdcdc'); gr.addColorStop(0.95, '#ececec'); gr.addColorStop(1, '#303030');
      bc.fillStyle = gr;
      bc.beginPath(); bc.moveTo(e.x0, y0); bc.lineTo(e.x1, y0); bc.lineTo(e.x1 + sl, y1); bc.lineTo(e.x0 + sl, y1); bc.closePath(); bc.fill();
      const vg = bc.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, 'rgba(50,50,50,0.85)'); vg.addColorStop(0.22, 'rgba(50,50,50,0)'); vg.addColorStop(0.42, 'rgba(255,255,255,0)'); vg.addColorStop(0.5, 'rgba(255,255,255,0.75)'); vg.addColorStop(0.58, 'rgba(255,255,255,0)'); vg.addColorStop(0.8, 'rgba(50,50,50,0)'); vg.addColorStop(1, 'rgba(50,50,50,0.85)');
      bc.fillStyle = vg; bc.fillRect(e.x0, y0, e.x1 - e.x0 + sl, y1 - y0);
      const ym = (y0 + y1) / 2;
      for (let k = 0; k < 3; k++) { bc.fillStyle = '#ffffff'; bc.beginPath(); bc.arc(lerp(e.x0 + (e.x1 - e.x0) * 0.35, e.x1, k / 2) + sl * 0.5, ym, w / 380, 0, Math.PI * 2); bc.fill(); }
    }
    for (let i = 0; i < 340; i++) {
      const x = rb() * w * (OPERCULUM.s + 0.01), y = (rb() < 0.55 ? rb() * 0.2 : 0.38 + rb() * 0.35) * h;
      bc.fillStyle = 'rgba(255,255,255,0.6)';
      bc.beginPath(); bc.arc(x, y, w / 360, 0, Math.PI * 2); bc.fill();
    }
    bc.fillStyle = '#2c2c2c';
    for (const f of [0.07, 0.13, 0.2]) bc.fillRect(w * f, 0, w * 0.0035, h * 0.42);
    bc.fillRect(w * (OPERCULUM.s + 0.003), 0, w * 0.006, h * 0.8);
    const hg = bc.createRadialGradient(w * 0.2, h * 0.34, 0, w * 0.2, h * 0.34, w * 0.08);
    hg.addColorStop(0, 'rgba(230,230,230,0.8)'); hg.addColorStop(1, 'rgba(108,108,108,0)');
    bc.fillStyle = hg; bc.fillRect(w * 0.1, 0, w * 0.2, h * 0.8);
  });
  const fins: Record<string, HTMLCanvasElement> = {};
  for (const id of ['sirt', 'yag', 'anal', 'kuyruk', 'karin']) fins[id] = paintFin(v.fin);
  fins.gogus = paintFin(v.gogus);
  return { color, bump, fins };
}
