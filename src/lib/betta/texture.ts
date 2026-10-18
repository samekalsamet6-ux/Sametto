// Betta gövde ve yüzgeç dokuları (<canvas>; tarayıcıya özgü, sahte canvas ile birim testlenir).
import { assembleBody, blob, paintFin, rgba, scaleBump, type Ctx, type FinStyle } from '../akvaryum/fishtex';
import { clamp, hexToRgb, lerp, mixHex, mulberry32, rgbToHex } from '../akvaryum/fishmath';
import type { SexId } from '../akvaryum/types';
import { seedFor, sexTone, type Variant } from './variants';
import { OPERCULUM, finsFor, formById, webFraction } from './model';


/** Renk tonunu derece kaydırır ve (0..1) açar: iridesan (renk değiştiren) parıltı için */
export function hueShift(hex: string, deg: number, light = 0): string {
  const [r, g, b] = hexToRgb(hex);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + deg + 360) % 360;
  const l = (mx + mn) / 2, sat = d < 1e-6 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const l2 = l + (1 - l) * light;
  const c = (1 - Math.abs(2 * l2 - 1)) * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l2 - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex([r1 + m, g1 + m, b1 + m]);
}

/** Pul ızgarası: baş bölgesinden sonra, kuyruğa doğru ucu sivri (ok biçimli) üst üste binen pullar */
export const SCALES = { s0: 0.2, cols: 33, rows: 10 } as const;

/** Her pul için çokgeni çizer: ön kenarı düz, arka ucu sivri. cb(x, y, pitch, rowH) pul başına çağrılır; sondan öne doğru (öndeki pul üstte kalsın) */
function eachScale(w: number, h: number, cb: (x: number, y: number, p: number, rh: number, r: number, c: number) => void) {
  const p = (w * (1 - SCALES.s0)) / SCALES.cols, rh = h / SCALES.rows;
  for (let r = 0; r <= SCALES.rows; r++) for (let c = SCALES.cols; c >= 0; c--) cb(w * SCALES.s0 + (c + (r % 2 ? 0.5 : 0)) * p, (r + 0.5) * rh, p, rh, r, c);
}
function scalePath(ctx: Ctx, x: number, y: number, p: number, rh: number) {
  ctx.beginPath();
  ctx.moveTo(x - p * 0.5, y - rh * 0.5);
  ctx.lineTo(x + p * 0.12, y - rh * 0.5);
  ctx.lineTo(x + p * 0.58, y);
  ctx.lineTo(x + p * 0.12, y + rh * 0.5);
  ctx.lineTo(x - p * 0.5, y + rh * 0.5);
  ctx.closePath();
}

/** Solungaç kapağı kenarı (doku koordinatlarında), model.operculumArc ile aynı eğri */
function operculumTex(w: number, h: number, n = 14): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([(OPERCULUM.s + 0.032 * Math.sin(t * Math.PI) - 0.012 * t) * w, (lerp(OPERCULUM.phi0, OPERCULUM.phi1, t) / Math.PI) * h]);
  }
  return out;
}

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
  const dragon = v.desen === 'ejder';
  const pk = clamp(0.3 + 0.7 * v.pul, 0, 1);
  // iridesan parıltı renkleri: gövde tonunun iki yanındaki tonlar (mavide camgöbeği ↔ mor, yeşilde sarı-yeşil ↔ mavi, kırmızıda turuncu ↔ eflatun)
  const sheenA = hueShift(T(v.body.yan), -38, 0.5), sheenB = hueShift(T(v.body.yan), 42, 0.45);
  const paint = (ctx: Ctx, w: number, h: number, side: 1 | -1) => {
    const rnd = mulberry32(seedFor(v, sex) + (side > 0 ? 0 : 977));
    // zemin: sırttan karına (üstten koyu, alttan açık: karşı gölgelenme)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, T(v.body.sirt));
    g.addColorStop(0.3, mixHex(T(v.body.sirt), T(v.body.yan), 0.7));
    g.addColorStop(0.5, T(v.body.yan));
    g.addColorStop(0.74, T(v.body.yan));
    g.addColorStop(0.9, mixHex(T(v.body.yan), T(v.body.karin), 0.7));
    g.addColorStop(1, T(v.body.karin));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // baş: yassı, geniş; üstte daha koyu
    const hg = ctx.createLinearGradient(0, 0, w * 0.27, 0);
    hg.addColorStop(0, rgba(T(v.body.bas), 0.9));
    hg.addColorStop(0.8, rgba(T(v.body.bas), 0.5));
    hg.addColorStop(1, rgba(T(v.body.bas), 0));
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, w * 0.27, h);
    const hd = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    hd.addColorStop(0, rgba(T(v.body.sirt), 0.55)); hd.addColorStop(1, rgba(T(v.body.sirt), 0));
    ctx.fillStyle = hd; ctx.fillRect(0, 0, w * 0.24, h * 0.4);

    const P = v.yamalar;
    if (v.desen === 'koi') {
      for (let i = 0; i < 11; i++) blob(ctx, rnd() * w * 0.95 + w * 0.03, rnd() * h * 0.8 + h * 0.05, (0.05 + rnd() * 0.1) * w, (0.1 + rnd() * 0.18) * h, P[i % 3 === 2 ? 1 : 0], 0.95, rnd() * 3, 0.9);
      for (let i = 0; i < 4; i++) blob(ctx, rnd() * w, rnd() * h, 0.03 * w, 0.06 * h, P[1], 0.9, rnd() * 3, 0.9);
    } else if (v.desen === 'mermer') {
      for (let i = 0; i < 26; i++) blob(ctx, rnd() * w, rnd() * h, (0.02 + rnd() * 0.08) * w, (0.06 + rnd() * 0.2) * h, P[Math.floor(rnd() * P.length)], 0.92, rnd() * 3, 0.88);
    } else if (dragon) {
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

    // ---- pullar: ucu sivri, üst üste binen; her pulun ortası parlak, kenarı koyu, arka ucunda iridesan vurgu
    if (!dragon && v.pul > 0) {
      const dark = v.desen === 'orkide' || v.desen === 'saydam' ? 0.5 : 1;
      eachScale(w, h, (x, y, p, rh) => {
        if (x < w * SCALES.s0 - p * 0.2) return;
        const j = 0.85 + 0.3 * rnd();
        const sgr = ctx.createLinearGradient(x - p * 0.5, 0, x + p * 0.58, 0);
        sgr.addColorStop(0, rgba('#000000', 0.2 * pk * dark));
        sgr.addColorStop(0.35, rgba(sheenA, 0.2 * pk * v.parlak * j + 0.04));
        sgr.addColorStop(0.75, rgba(sheenB, 0.42 * pk * (0.3 + v.parlak) * j));
        sgr.addColorStop(1, rgba('#000000', 0.3 * pk * dark));
        ctx.fillStyle = sgr;
        scalePath(ctx, x, y, p, rh); ctx.fill();
        ctx.fillStyle = rgba(rnd() < 0.5 ? '#ffffff' : '#000000', 0.03 + 0.07 * rnd() * pk);
        ctx.fill();
        ctx.lineWidth = Math.max(1, w / 760);
        ctx.strokeStyle = rgba('#000000', (0.07 + 0.2 * pk) * dark);
        ctx.beginPath(); ctx.moveTo(x + p * 0.12, y - rh * 0.5); ctx.lineTo(x + p * 0.58, y); ctx.lineTo(x + p * 0.12, y + rh * 0.5); ctx.stroke();
        ctx.strokeStyle = rgba(sheenA, (0.1 + 0.28 * v.parlak) * pk);
        ctx.beginPath(); ctx.moveTo(x + p * 0.04, y - rh * 0.44); ctx.lineTo(x + p * 0.5, y); ctx.lineTo(x + p * 0.04, y + rh * 0.44); ctx.stroke();
      });
    }
    // iridesan geniş bant: yan çizgi boyunca renk değiştiren parıltı (mavi/turkuazda belirgin)
    if (v.parlak > 0) {
      const amt = 0.2 + 0.55 * v.parlak;
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        blob(ctx, w * (0.22 + 0.72 * t) + (rnd() - 0.5) * w * 0.03, h * (0.24 + 0.2 * rnd()), (0.07 + 0.06 * rnd()) * w, (0.05 + 0.05 * rnd()) * h, i % 2 ? sheenA : sheenB, 0.3 * amt, 0, 0.5);
      }
      const sh = ctx.createLinearGradient(0, h * 0.14, 0, h * 0.62);
      sh.addColorStop(0, rgba(sheenA, 0)); sh.addColorStop(0.5, rgba(sheenA, 0.22 * amt)); sh.addColorStop(1, rgba(sheenB, 0));
      ctx.fillStyle = sh; ctx.fillRect(w * 0.2, h * 0.14, w * 0.78, h * 0.48);
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
    // karın ve sırt kenarı: ince gölge (hacim)
    const eg = ctx.createLinearGradient(0, h * 0.9, 0, h);
    eg.addColorStop(0, rgba('#000000', 0)); eg.addColorStop(1, rgba('#000000', 0.12));
    ctx.fillStyle = eg; ctx.fillRect(0, h * 0.9, w, h * 0.1);
    // ---- solungaç kapağı: arka kenarı parlak, hemen arkasında gölge; ön yüzeyi hafif metalik
    const arc = operculumTex(w, h);
    ctx.beginPath(); ctx.moveTo(arc[0][0] - w * 0.06, arc[0][1]);
    for (const [x, y] of arc) ctx.lineTo(x, y);
    ctx.lineTo(arc[arc.length - 1][0] - w * 0.06, arc[arc.length - 1][1]); ctx.closePath();
    const og = ctx.createLinearGradient(w * 0.15, 0, w * 0.245, 0);
    og.addColorStop(0, rgba(sheenA, 0.08)); og.addColorStop(0.7, rgba(sheenA, 0.2 * (0.4 + v.parlak))); og.addColorStop(1, rgba('#ffffff', 0.24 * (0.3 + v.parlak)));
    ctx.fillStyle = og; ctx.fill();
    ctx.lineWidth = Math.max(2, w / 330);
    ctx.strokeStyle = rgba('#000000', 0.3);
    ctx.beginPath(); arc.forEach(([x, y], i) => (i ? ctx.lineTo(x + ctx.lineWidth * 0.9, y) : ctx.moveTo(x + ctx.lineWidth * 0.9, y))); ctx.stroke();
    ctx.lineWidth = Math.max(1, w / 500);
    ctx.strokeStyle = rgba('#ffffff', 0.34 * (0.4 + v.parlak));
    ctx.beginPath(); arc.forEach(([x, y], i) => (i ? ctx.lineTo(x - ctx.lineWidth, y) : ctx.moveTo(x - ctx.lineWidth, y))); ctx.stroke();
    ctx.strokeStyle = rgba('#000000', 0.12);
    for (let i = 1; i < arc.length - 1; i += 2) { ctx.beginPath(); ctx.moveTo(arc[i][0] - w * 0.045, arc[i][1] * 0.9 + h * 0.02); ctx.lineTo(arc[i][0] - w * 0.006, arc[i][1]); ctx.stroke(); }
  };
  const color = assembleBody(W, Hh, paint);
  // kabartma: ucu sivri pullar (arka uç yüksek) ve yükseltili solungaç kapağı plakası
  const bump = dragon ? scaleBump(W, Hh, 46, 15, 0.7) : assembleBody(W, Hh, (bc, w, h) => {
    bc.fillStyle = '#707070';
    bc.fillRect(0, 0, w, h);
    if (v.pul > 0) eachScale(w, h, (x, y, p, rh) => {
      if (x < w * SCALES.s0 - p * 0.2) return;
      const gr = bc.createLinearGradient(x - p * 0.5, 0, x + p * 0.58, 0);
      gr.addColorStop(0, '#585858'); gr.addColorStop(0.5, '#9a9a9a'); gr.addColorStop(0.9, '#d8d8d8'); gr.addColorStop(1, '#f0f0f0');
      bc.fillStyle = gr; scalePath(bc, x, y, p, rh); bc.fill();
      bc.lineWidth = Math.max(1, w / 700); bc.strokeStyle = '#2c2c2c';
      bc.beginPath(); bc.moveTo(x + p * 0.12, y - rh * 0.5); bc.lineTo(x + p * 0.58, y); bc.lineTo(x + p * 0.12, y + rh * 0.5); bc.stroke();
    });
    const arc = operculumTex(w, h);
    bc.beginPath(); bc.moveTo(arc[0][0] - w * 0.06, arc[0][1]);
    for (const [x, y] of arc) bc.lineTo(x, y);
    bc.lineTo(arc[arc.length - 1][0] - w * 0.06, arc[arc.length - 1][1]); bc.closePath();
    const og = bc.createLinearGradient(w * 0.16, 0, w * 0.245, 0);
    og.addColorStop(0, '#707070'); og.addColorStop(0.8, '#c4c4c4'); og.addColorStop(1, '#e8e8e8');
    bc.fillStyle = og; bc.fill();
    bc.lineWidth = Math.max(2, w / 300); bc.strokeStyle = '#242424';
    bc.beginPath(); arc.forEach(([x, y], i) => (i ? bc.lineTo(x + bc.lineWidth, y) : bc.moveTo(x + bc.lineWidth, y))); bc.stroke();
  });
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
