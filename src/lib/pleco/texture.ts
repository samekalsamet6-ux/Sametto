// Pleko gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt ortası (üst) → karın ortası (alt).
import { assembleBody, blob, paintFin, rgba, type Ctx } from '../akvaryum/fishtex';
import { lerp, mixHex, mulberry32 } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { ARMOR, OPERCULUM } from './model';
import { seedFor, type Variant } from './variants';

export interface PlecoTextures { color: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

/** Plaka sıralarının dikey sınırları (satır yüksekliğine oranla): sırt, üst yan, alt yan, karın yanı */
export const ROW_Y = [0.03, 0.22, 0.42, 0.6, 0.78] as const;

/** Deterministik 0..1 sözde-rastgele sayı: plaka başına sabit (renk ve kabartma aynı plakayı çizer) */
const hash = (r: number, i: number): number => { const x = Math.sin(r * 127.1 + i * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

export interface Plate { row: number; x0: number; x1: number; /** görünen şerit genişliği (px) */ pitch: number; /** -1..1 plaka tonu */ tone: number; /** 0..1 plakanın renk kayması seçimi */ hue: number }

/** Dört sıra ince, birbirinin üstüne binen kilitli plaka: her plaka ~2,3 aralık uzunluğunda, konumlar hafif oynak, ardışık sıralar kaydırılmış. */
export function plateEdges(w: number): Plate[] {
  const out: Plate[] = [];
  const n = ARMOR.plates, a = ARMOR.s0 * w, b = ARMOR.s1 * w, p = (b - a) / (n + 0.5);
  for (let row = 0; row < ARMOR.rows; row++) for (let i = 0; i < n; i++) {
    const off = [0.1, 0.52, 0.31, 0.74][row % 4];
    const j = (hash(row, i) - 0.5) * 0.4 * p;
    const x0 = Math.max(a, a + (i + off) * p + j), x1 = Math.min(b, x0 + p * 2.3);
    out.push({ row, x0, x1: Math.max(x1, x0 + 1), pitch: p, tone: hash(row + 3, i) * 2 - 1, hue: hash(row + 11, i) });
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
    // ---- kemikli plakalar (4 sıra): ince, birbirinin üstüne binen ve sırtı keskin (keel'li) plakalar. Görünen şerit yalnızca her plakanın serbest arka kenarıdır;
    // plaka başına hafif ton/renk farkı, sıra ortasında ince kil çizgisi ve arka yarıda ince odontod (diş) benekleri vardır. Gövde genelinde pürüzsüz görünüm korunur.
    const edges = plateEdges(w), z = Math.min(1, v.zirh);
    const lw = Math.max(1, w / 900), warm = mixHex(v.body.yan, '#ffe9b8', 0.35), cool = mixHex(v.body.yan, '#102030', 0.45);
    for (const e of edges) {
      const y0 = h * ROW_Y[e.row], y1 = h * ROW_Y[e.row + 1], ym = (y0 + y1) / 2, xr = e.x1, xl = Math.max(e.x0, xr - e.pitch), k = e.pitch * 0.32;
      // plaka başına renk farkı (yumuşak): çoğunlukla ışık/koyu, bazen sıcak/soğuk kayma
      const tint = e.hue < 0.25 ? warm : e.hue > 0.78 ? cool : e.tone > 0 ? '#ffffff' : '#000000';
      const gr = ctx.createLinearGradient(xl, 0, xr, 0);
      gr.addColorStop(0, rgba(tint, 0)); gr.addColorStop(0.5, rgba(tint, 0.03 + 0.05 * Math.abs(e.tone))); gr.addColorStop(1, rgba('#ffffff', 0.06 * z));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(xl, y0); ctx.lineTo(xr, y0); ctx.lineTo(xr + k, ym); ctx.lineTo(xr, y1); ctx.lineTo(xl, y1); ctx.lineTo(xl + k, ym); ctx.closePath(); ctx.fill();
      // keel çizgisi boyunca hafif ışık
      const kg = ctx.createLinearGradient(0, y0, 0, y1);
      kg.addColorStop(0, rgba('#000000', 0.07 * z)); kg.addColorStop(0.5, rgba('#ffffff', 0.09 * z)); kg.addColorStop(1, rgba('#000000', 0.07 * z));
      ctx.fillStyle = kg; ctx.fillRect(xl, y0, xr - xl + k * 0.5, y1 - y0);
      // arka kenarın düşürdüğü yumuşak gölge
      const sh = ctx.createLinearGradient(xr + k * 0.3, 0, xr + k * 1.9, 0);
      sh.addColorStop(0, rgba('#000000', 0.12 * z + 0.02)); sh.addColorStop(1, rgba('#000000', 0));
      ctx.fillStyle = sh; ctx.fillRect(xr + k * 0.3, y0, k * 1.6, y1 - y0);
      // ince arka kenar çizgisi (şevron) ve yanında parlak sınır
      ctx.lineWidth = lw;
      ctx.strokeStyle = rgba('#000000', (0.13 * z + 0.025) * (0.6 + 0.4 * Math.abs(e.tone)));
      ctx.beginPath(); ctx.moveTo(xr, y0); ctx.lineTo(xr + k, ym); ctx.lineTo(xr, y1); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.08 * z);
      ctx.beginPath(); ctx.moveTo(xr - lw * 1.7, y0); ctx.lineTo(xr + k - lw * 1.7, ym); ctx.lineTo(xr - lw * 1.7, y1); ctx.stroke();
      // odontodlar: arka yarıda keel çevresinde küçük açık renkli dişçikler (4-6 adet, ince)
      const cnt = 4 + Math.floor(hash(e.row + 20, Math.round(e.x0)) * 3);
      for (let q = 0; q < cnt; q++) {
        const x = xr - e.pitch * (0.15 + 0.7 * hash(q + 1, Math.round(e.x0 + e.row * 7))) + k * 0.5, y = ym + (hash(q + 4, Math.round(e.x0 * 1.3 + e.row)) - 0.5) * (y1 - y0) * 0.45;
        blob(ctx, x, y, w * 0.0011, w * 0.0011, '#fff4d8', 0.34 * z + 0.12, 0, 0.7);
        blob(ctx, x + w * 0.0008, y + h * 0.006, w * 0.0009, w * 0.0009, '#000000', 0.14 * z, 0, 0.7);
      }
    }
    // sıra sınırları: çok ince ve silik (yassı, pürüzsüz görünüm)
    for (let r = 0; r <= ARMOR.rows; r++) {
      const y = h * ROW_Y[r];
      ctx.lineWidth = Math.max(1, w / 800);
      ctx.strokeStyle = rgba('#000000', 0.05 * z + 0.012);
      ctx.beginPath(); ctx.moveTo(w * ARMOR.s0, y); ctx.lineTo(w * ARMOR.s1, y); ctx.stroke();
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
      const y0 = h * ROW_Y[e.row], y1 = h * ROW_Y[e.row + 1], ym = (y0 + y1) / 2, xr = e.x1, xl = Math.max(e.x0, xr - e.pitch), k = e.pitch * 0.32;
      // yumuşak kabartma: şerit hafif yükselir, arka kenarda ince basamak; ortada keel (alçak sırt)
      const gr = bc.createLinearGradient(xl, 0, xr, 0);
      gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(0.55, '#767676'); gr.addColorStop(0.9, '#808080'); gr.addColorStop(1, '#606060');
      bc.fillStyle = gr;
      bc.beginPath(); bc.moveTo(xl, y0); bc.lineTo(xr, y0); bc.lineTo(xr + k, ym); bc.lineTo(xr, y1); bc.lineTo(xl, y1); bc.lineTo(xl + k, ym); bc.closePath(); bc.fill();
      const vg = bc.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, 'rgba(60,60,60,0.3)'); vg.addColorStop(0.25, 'rgba(60,60,60,0)'); vg.addColorStop(0.45, 'rgba(255,255,255,0)'); vg.addColorStop(0.5, 'rgba(255,255,255,0.25)'); vg.addColorStop(0.55, 'rgba(255,255,255,0)'); vg.addColorStop(0.75, 'rgba(60,60,60,0)'); vg.addColorStop(1, 'rgba(60,60,60,0.3)');
      bc.fillStyle = vg; bc.fillRect(xl, y0, xr - xl + k, y1 - y0);
      // odontodlar: ince küçük çıkıntılar
      const cnt = 4 + Math.floor(hash(e.row + 20, Math.round(e.x0)) * 3);
      for (let q = 0; q < cnt; q++) {
        const x = xr - e.pitch * (0.15 + 0.7 * hash(q + 1, Math.round(e.x0 + e.row * 7))) + k * 0.5, y = ym + (hash(q + 4, Math.round(e.x0 * 1.3 + e.row)) - 0.5) * (y1 - y0) * 0.45;
        bc.fillStyle = 'rgba(255,255,255,0.7)'; bc.beginPath(); bc.arc(x, y, w / 900, 0, Math.PI * 2); bc.fill();
      }
    }
    for (let i = 0; i < 340; i++) {
      const x = rb() * w * (OPERCULUM.s + 0.01), y = (rb() < 0.55 ? rb() * 0.2 : 0.38 + rb() * 0.35) * h;
      bc.fillStyle = 'rgba(255,255,255,0.6)';
      bc.beginPath(); bc.arc(x, y, w / 500, 0, Math.PI * 2); bc.fill();
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
