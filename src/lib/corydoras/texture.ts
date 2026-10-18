// Corydoras gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
import { lerp, mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { ARMOR } from './model';
import { seedFor, type Variant } from './variants';

export interface CoryTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

/** Deterministik 0..1 sözde-rastgele sayı (plaka başına sabit: renk ve kabartma aynı plakayı çizer) */
const hash = (r: number, i: number): number => { const x = Math.sin(r * 127.1 + i * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

export interface Plate { row: number; x0: number; x1: number; /** görünen şerit genişliği (px) */ pitch: number; /** arka kenarın eğimi (px; satır yüksekliği boyunca) */ slant: number; /** arka kenarın kavisi (px) */ bow: number; /** -1..1 plaka tonu */ tone: number }

/** İki sıra zırh plakasının sınırları: x konumları (piksel) ve satır başına w aralığı. Plakalar birbirinin üstüne biner (her plaka ~1,8 aralık uzunluğunda), konumlar hafif oynak ve iki sıra yarım adım kaydırılmıştır. */
export function plateEdges(w: number): Plate[] {
  const out: Plate[] = [];
  const n = ARMOR.plates, a = ARMOR.s0 * w, b = ARMOR.s1 * w, p = (b - a) / (n + 0.5);
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const off = row ? 0.5 : 0.08;
    const j = (hash(row, i) - 0.5) * 0.28 * p;
    const x0 = Math.max(a, a + (i + off) * p + j), x1 = Math.min(b, x0 + p * 1.8);
    out.push({ row, x0, x1: Math.max(x1, x0 + 1), pitch: p, slant: p * (0.55 + 0.25 * hash(row + 5, i)) * (row ? -1 : 1), bow: p * (hash(row + 9, i) - 0.3) * 0.25, tone: hash(row + 2, i) * 2 - 1 });
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
    // ---- zırh plakaları (skut): iki sıra, birbirinin üstüne binen ince plakalar; ön kenar bir öncekinin altında kalır.
    // Görünen şey yalnızca ince arka kenarlar (düşük kontrast) ve plaka başına çok hafif ton farkı; gövde genelinde pürüzsüz bir parlaklık korunur.
    const edges = plateEdges(w), z = Math.min(1, v.zirh) * 0.5;
    const yTop = h * PLATE_Y.top, yMid = h * PLATE_Y.mid, yBot = h * PLATE_Y.bot;
    const lw = Math.max(1, w / 900);
    for (const e of edges) {
      const y0 = e.row ? yMid : yTop, y1 = e.row ? yBot : yMid, xr = e.x1, xl = Math.max(e.x0, xr - e.pitch);
      const edgePath = (x: number) => { ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + e.slant * 0.5 + e.bow, (y0 + y1) / 2, x + e.slant, y1); };
      // görünen şeridin tonu: plaka başına hafif açık/koyu fark + çok yumuşak yatay geçiş
      const gr = ctx.createLinearGradient(xl, 0, xr, 0);
      const t = e.tone, up = t > 0 ? '#ffffff' : '#000000';
      gr.addColorStop(0, rgba(up, 0)); gr.addColorStop(0.55, rgba(up, 0.035 * Math.abs(t) + 0.01)); gr.addColorStop(1, rgba('#ffffff', 0.05 * z));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(xl, y0); ctx.lineTo(xr, y0); ctx.quadraticCurveTo(xr + e.slant * 0.5 + e.bow, (y0 + y1) / 2, xr + e.slant, y1); ctx.lineTo(xl + e.slant, y1); ctx.closePath(); ctx.fill();
      // arka kenarın düşürdüğü yumuşak gölge (bir sonraki plakanın üzerine)
      const sh = ctx.createLinearGradient(xr, 0, xr + e.pitch * 0.45, 0);
      sh.addColorStop(0, rgba('#000000', 0.11 * z + 0.02)); sh.addColorStop(1, rgba('#000000', 0));
      ctx.fillStyle = sh;
      ctx.beginPath(); ctx.moveTo(xr, y0); ctx.lineTo(xr + e.pitch * 0.45, y0); ctx.lineTo(xr + e.pitch * 0.45 + e.slant, y1); ctx.lineTo(xr + e.slant, y1); ctx.quadraticCurveTo(xr + e.slant * 0.5 + e.bow, (y0 + y1) / 2, xr, y0); ctx.closePath(); ctx.fill();
      // ince arka kenar çizgisi ve yanında çok ince parlak sınır
      ctx.lineWidth = lw;
      ctx.strokeStyle = rgba('#000000', (0.36 * z + 0.07) * (0.65 + 0.35 * Math.abs(t))); ctx.beginPath(); edgePath(xr); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.2 * z + 0.02); ctx.beginPath(); edgePath(xr - lw * 1.6); ctx.stroke();
    }
    // yan çizgi: iki sıranın birleştiği ince çizgi ve gözenekler
    ctx.lineWidth = Math.max(1.2, w / 650);
    ctx.strokeStyle = rgba('#000000', 0.2 * z + 0.04);
    ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, yMid); ctx.lineTo(w * ARMOR.s1, yMid); ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.12 * z + 0.02);
    ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, yMid + ctx.lineWidth); ctx.lineTo(w * ARMOR.s1, yMid + ctx.lineWidth); ctx.stroke();
    for (const e of edges) if (e.row === 0) blob(ctx, e.x1 - e.pitch * 0.2, yMid, w * 0.0016, w * 0.0016, '#000000', 0.3, 0, 0.8);
    // gövde boyunca yumuşak, kesintisiz parıltı (plaka çizgilerinden bağımsız): derinin pürüzsüz metalik görünümü
    const sheen = ctx.createLinearGradient(0, h * 0.12, 0, h * 0.5);
    sheen.addColorStop(0, rgba('#ffffff', 0)); sheen.addColorStop(0.5, rgba('#ffffff', 0.09 + 0.05 * v.parilti.yogunluk)); sheen.addColorStop(1, rgba('#ffffff', 0));
    ctx.fillStyle = sheen; ctx.fillRect(w * ARMOR.s0, h * 0.12, w * (ARMOR.s1 - ARMOR.s0), h * 0.38);
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
      const y0 = e.row ? yMid : yTop, y1 = e.row ? yBot : yMid, xr = e.x1, xl = Math.max(e.x0, xr - e.pitch);
      // çok yumuşak kabartma: görünen şerit hafif yükselir, arka kenarda ince bir basamak (plaka bindirmesi)
      const gr = bc.createLinearGradient(xl, 0, xr, 0);
      gr.addColorStop(0, '#666666'); gr.addColorStop(0.6, '#7c7c7c'); gr.addColorStop(0.92, '#8c8c8c'); gr.addColorStop(1, '#505050');
      bc.fillStyle = gr;
      bc.beginPath(); bc.moveTo(xl, y0); bc.lineTo(xr, y0); bc.quadraticCurveTo(xr + e.slant * 0.5 + e.bow, (y0 + y1) / 2, xr + e.slant, y1); bc.lineTo(xl + e.slant, y1); bc.closePath(); bc.fill();
      const vg = bc.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, 'rgba(70,70,70,0.45)'); vg.addColorStop(0.2, 'rgba(70,70,70,0)'); vg.addColorStop(0.8, 'rgba(70,70,70,0)'); vg.addColorStop(1, 'rgba(70,70,70,0.4)');
      bc.fillStyle = vg; bc.fillRect(xl, y0, xr - xl + Math.abs(e.slant), y1 - y0);
    }
    // yan çizgi: ince, alçak kıl
    bc.fillStyle = '#9a9a9a';
    bc.fillRect(w * ARMOR.s0, yMid - h * 0.006, w * (ARMOR.s1 - ARMOR.s0), h * 0.012);
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
