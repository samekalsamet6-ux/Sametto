// Neon tetra gövde dokusu (<canvas>; sahte canvas ile birim testlenir). Yatay = s (burun solda), dikey = sırt (üst) → karın (alt).
import { assembleBody, blob, makeCanvas, paintFin, rgba, scaleBump, type Ctx } from '../akvaryum/fishtex';
import { mixHex, mulberry32, smoothstep } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { RED, STRIPE, stripeW } from './model';
import { seedFor, type Variant } from './variants';

export interface NeonTextures { color: HTMLCanvasElement; glow: HTMLCanvasElement; bump: HTMLCanvasElement; fins: Record<string, HTMLCanvasElement> }

export function paintBody(v: Variant, sex: SexId, W = 1024): NeonTextures {
  const Hh = W / 4;
  const stripeEnd = STRIPE.s0 + (STRIPE.s1 - STRIPE.s0) * v.serit.boy;
  const hot = mixHex(v.serit.merkez, '#e6ffff', 0.72), deep = mixHex(v.serit.kenar, '#0a1c8a', 0.35);
  /** Şerit yarı yüksekliği (doku birimi 0..1): başta daralır, sonda incelir */
  const halfAt = (u: number) => STRIPE.half * (0.62 + 0.38 * smoothstep(0, 0.1, u) * (1 - 0.3 * smoothstep(0.75, 1, u)));
  /** Şerit: ince dilimlerle, enine profil (kenar koyu mavi → camgöbeği → sıcak beyaz çekirdek). glow = ışıma haritası (halo geniş) */
  const stripe = (ctx: Ctx, w: number, h: number, glow: boolean, rnd: () => number) => {
    const n = 150, x0 = STRIPE.s0 * w, span = (stripeEnd - STRIPE.s0) * w;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, s = STRIPE.s0 + (stripeEnd - STRIPE.s0) * u;
      const half = halfAt(u) * h * (glow ? 1.55 : 1.12), cy = stripeW(sex, s) * h - half * 0.05;
      const spark = 0.82 + 0.18 * rnd();                     // iridofor plakaları: dilim başına küçük parlaklık farkı
      const core = mixHex(v.serit.merkez, '#7dffe0', 0.25 * u), tone = (c: string, a: number) => rgba(c, Math.min(1, a * spark));
      const g = ctx.createLinearGradient(0, cy - half, 0, cy + half);
      if (glow) {
        g.addColorStop(0, rgba(deep, 0)); g.addColorStop(0.2, rgba(v.serit.kenar, 0.3)); g.addColorStop(0.38, rgba(core, 0.85)); g.addColorStop(0.46, rgba(hot, 1));
        g.addColorStop(0.6, rgba(core, 0.8)); g.addColorStop(0.8, rgba(v.serit.kenar, 0.3)); g.addColorStop(1, rgba(deep, 0));
      } else {
        g.addColorStop(0, tone(deep, 0)); g.addColorStop(0.12, tone(v.serit.kenar, 0.62)); g.addColorStop(0.3, tone(v.serit.kenar, 0.96)); g.addColorStop(0.43, tone(core, 1));
        g.addColorStop(0.49, tone(hot, 1)); g.addColorStop(0.62, tone(core, 0.98)); g.addColorStop(0.82, tone(v.serit.kenar, 0.9)); g.addColorStop(1, tone(deep, 0));
      }
      ctx.fillStyle = g;
      ctx.fillRect(x0 + (span * i) / n - 0.5, cy - half, span / n + 1.2, half * 2);
    }
  };
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 31));
    // zemin: zeytin-kahve sırt, gümüşi-yeşil yan, parlak gümüş karın
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, v.body.sirt);
    g.addColorStop(0.2, mixHex(v.body.sirt, v.body.yan, 0.55));
    g.addColorStop(0.42, v.body.yan);
    g.addColorStop(0.78, v.body.yan);
    g.addColorStop(1, v.body.karin);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // sırtta mavi-yeşil iridesan örtü (şeridin üstünde, hafif)
    const sheen = ctx.createLinearGradient(0, 0, 0, h * 0.36);
    sheen.addColorStop(0, rgba(v.serit.kenar, 0)); sheen.addColorStop(0.55, rgba(v.serit.kenar, 0.2 * v.serit.parilti)); sheen.addColorStop(1, rgba(v.serit.merkez, 0));
    ctx.fillStyle = sheen; ctx.fillRect(w * 0.06, 0, w * 0.92, h * 0.36);
    // kırmızı alt yarı: kuyruğa doğru, şeridin altından karına; üst kenarı turuncuya, altı koyu kırmızıya kayar
    if (v.kirmizi.yogunluk > 0) {
      const y0 = (stripeW(sex, 0.55) + STRIPE.half * 0.9) * h;
      const rg = ctx.createLinearGradient(RED.s0 * w, 0, (RED.s0 + 0.14) * w, 0);
      rg.addColorStop(0, rgba(v.kirmizi.renk, 0));
      rg.addColorStop(1, rgba(v.kirmizi.renk, 0.97 * v.kirmizi.yogunluk));
      ctx.fillStyle = rg;
      ctx.fillRect(RED.s0 * w, y0, w * (1 - RED.s0), h * 0.82 - y0);
      const vg = ctx.createLinearGradient(0, y0, 0, h * 0.9);
      vg.addColorStop(0, rgba(mixHex(v.kirmizi.renk, '#ff9a3c', 0.45), 0.5 * v.kirmizi.yogunluk));
      vg.addColorStop(0.35, rgba(v.kirmizi.renk, 0));
      vg.addColorStop(0.8, rgba(mixHex(v.kirmizi.renk, '#5a0008', 0.35), 0.35 * v.kirmizi.yogunluk));
      vg.addColorStop(1, rgba(v.body.karin, 0.5 * v.kirmizi.yogunluk));
      ctx.fillStyle = vg; ctx.fillRect(RED.s0 * w + w * 0.05, y0, w * (1 - RED.s0), h * 0.9 - y0);
      blob(ctx, w * 0.78, h * 0.6, w * 0.2, h * 0.2, mixHex(v.kirmizi.renk, '#ff6a50', 0.3), 0.4 * v.kirmizi.yogunluk, 0, 0.7);
    }
    // gümüşi solungaç/ön yan: açık, yarı saydam görünüm
    blob(ctx, w * 0.15, h * 0.58, w * 0.1, h * 0.32, '#f2f6f2', 0.45, 0, 0.6);
    // sırt yansıtıcı pulları (diamond) ve genel pul ipuçları
    if (v.sirtParilti > 0.3) for (let i = 0; i < 230; i++) blob(ctx, rnd() * w, rnd() * h * 0.42, 0.006 * w + rnd() * 0.006 * w, 0.006 * w, rnd() > 0.5 ? '#ffffff' : '#8fd9ff', 0.55 + 0.4 * rnd(), 0, 0.5);
    ctx.strokeStyle = rgba('#000000', 0.08);
    ctx.lineWidth = Math.max(1, w / 1000);
    const cols = 46, rows = 12, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * cw + cw * 0.5, y = r * ch + ch * 0.5;
      if (x < w * 0.2) continue;
      ctx.beginPath(); ctx.arc(x, y, cw * 0.55, -0.3, 1.9); ctx.stroke();
    }
    // şerit: dış halo (geniş, soluk) + çekirdek
    if (v.serit.parilti > 0.05) {
      const hs = ctx.createLinearGradient(0, 0, w, 0);
      hs.addColorStop(0, rgba(v.serit.kenar, 0)); hs.addColorStop(0.2, rgba(v.serit.kenar, 0.16 * v.serit.parilti)); hs.addColorStop(1, rgba(v.serit.kenar, 0.1 * v.serit.parilti));
      ctx.fillStyle = hs;
      ctx.fillRect(STRIPE.s0 * w, (stripeW(sex, 0.5) - STRIPE.half * 1.5) * h, (stripeEnd - STRIPE.s0) * w, STRIPE.half * 3 * h);
    }
    stripe(ctx, w, h, false, rnd);
    // iridofor plakaları: şeridin içinde parlayan küçük baklavalar
    for (let i = 0; i < 160; i++) {
      const u = rnd(), s = STRIPE.s0 + (stripeEnd - STRIPE.s0) * u, y = stripeW(sex, s) * h + (rnd() - 0.5) * halfAt(u) * h * 1.3;
      blob(ctx, s * w, y, w * 0.0045, h * 0.016, rnd() > 0.5 ? '#eaffff' : hot, 0.18 + 0.3 * rnd() * v.serit.parilti, 0, 0.6);
    }
    // baş: bir miktar koyu, sırtta zeytin
    const hg = ctx.createLinearGradient(0, 0, w * 0.2, 0);
    hg.addColorStop(0, rgba(v.body.sirt, 0.5)); hg.addColorStop(1, rgba(v.body.sirt, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w * 0.2, h * 0.5);
    ctx.fillStyle = rgba('#000000', 0.1);
    ctx.fillRect(w * 0.19, 0, w * 0.005, h);
    // yarı saydamlık izlenimi: sırt/karın kenarları ve kuyruk sapı açılır (içten ışık geçiyor gibi)
    const ed = ctx.createLinearGradient(0, 0, 0, h);
    ed.addColorStop(0, rgba('#cfe8e4', 0.2)); ed.addColorStop(0.06, rgba('#cfe8e4', 0)); ed.addColorStop(0.94, rgba('#ffffff', 0)); ed.addColorStop(1, rgba('#ffffff', 0.34));
    ctx.fillStyle = ed; ctx.fillRect(0, 0, w, h);
    const tg = ctx.createLinearGradient(w * 0.88, 0, w, 0);
    tg.addColorStop(0, rgba(v.body.karin, 0)); tg.addColorStop(1, rgba(v.body.karin, 0.4));
    ctx.fillStyle = tg; ctx.fillRect(w * 0.88, 0, w * 0.12, h);
  };
  const color = assembleBody(W, Hh, paint);
  const glow = assembleBody(W, Hh, (ctx, w, h, side) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); stripe(ctx, w, h, true, mulberry32(seedFor(v, sex) + (side > 0 ? 5 : 9))); });
  const bump = scaleBump(W, Hh, 52, 13, 0.2);
  const f = paintFin(v.fin);
  void makeCanvas;
  return { color, glow, bump, fins: { sirt: f, yag: paintFin({ ...v.fin, stops: v.fin.stops.map(([p, c, a]) => [p, c, Math.min(1, a * 1.4)] as [number, string, number]) }), anal: f, kuyruk: f, karin: f, gogus: paintFin({ ...v.fin, stops: v.fin.stops.map(([p, c, a]) => [p, c, a * 0.6] as [number, string, number]) }) } };
}
