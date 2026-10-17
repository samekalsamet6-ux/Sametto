// Kabuk dokusunu <canvas> üzerinde üretir (tarayıcıya özgü; sahte canvas ile birim testlenir).
// Doku eşlemesi: yatay eksen u = parça boyunca (karapaksta baştan arkaya, halkada önden arkaya),
// dikey eksen v = kesit çevresi (0 ve 1 = karın tarafı, 0,5 = sırt ortası).
import { BODY, type Sex } from './model';
import { hexToRgb, mulberry32, seedFor, sexTone, mixRgb, type Rgb, type Variant } from './variants';

type Ctx = CanvasRenderingContext2D;
export type ShellKind = 'carapace' | 'abdomen' | 'clear';

const css = (c: Rgb, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: Rgb, alpha: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, css(c, alpha));
  g.addColorStop(0.6, css(c, alpha * 0.55));
  g.addColorStop(1, css(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Karapaks ya da karın halkası dokusu. `clear` = Rili'de saydam kalan halkalar. */
export function paintShell(variant: Variant, sex: Sex, kind: ShellKind, W = 512): HTMLCanvasElement {
  const H = Math.round(W / 2);
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d') as Ctx;
  const rnd = mulberry32(seedFor(variant, sex) + (kind === 'carapace' ? 1 : kind === 'clear' ? 2 : 3));
  const k = BODY[sex].colour;
  const sirt = sexTone(hexToRgb(variant.renk.sirt), k), yan = sexTone(hexToRgb(variant.renk.yan), k), karin = sexTone(hexToRgb(variant.renk.karin), k);
  const clearT = variant.rili ? hexToRgb(variant.rili.ton) : yan;
  const clear = kind === 'clear';
  const rili = variant.stil === 'rili';
  const dor = clear ? mixRgb(clearT, sirt, 0.18) : sirt;
  const fl = clear ? clearT : yan;
  const bel = clear ? mixRgb(clearT, [1, 1, 1], 0.4) : karin;

  // 1) dikey degrade: sırt koyu, yanlar orta, karın açık
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, css(bel)); g.addColorStop(0.2, css(mixRgb(bel, fl, 0.7))); g.addColorStop(0.36, css(fl));
  g.addColorStop(0.5, css(dor)); g.addColorStop(0.64, css(fl)); g.addColorStop(0.8, css(mixRgb(bel, fl, 0.7))); g.addColorStop(1, css(bel));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 2) Rili: karapaksta ön yarıda renk, arkada saydam; opak halkalarda üst-arka kenarda saydam geçiş
  if (rili && kind === 'carapace') {
    const gr = ctx.createLinearGradient(W * 0.35, 0, W * 0.8, 0);
    gr.addColorStop(0, css(clearT, 0)); gr.addColorStop(1, css(clearT, 0.92));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    blob(ctx, W * 0.22, H * 0.5, W * 0.2, H * 0.42, sirt, 0.9);
    blob(ctx, W * 0.3, H * 0.28, W * 0.16, H * 0.2, yan, 0.7);
    blob(ctx, W * 0.3, H * 0.72, W * 0.16, H * 0.2, yan, 0.7);
  }
  if (rili && kind === 'abdomen') {
    // renkli halkalarda yine de arka kenara doğru hafif saydamlık
    const gr = ctx.createLinearGradient(W * 0.6, 0, W, 0);
    gr.addColorStop(0, css(clearT, 0)); gr.addColorStop(1, css(clearT, 0.35));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // 3) düzensiz renk lekeleri (düşük sınıf kırmızılar): açık/saydam bölgeler
  if (variant.lekeli && !rili) {
    const pale = mixRgb(hexToRgb(variant.renk.karin), [1, 1, 1], 0.35);
    const n = Math.round(6 + variant.lekeli * 22);
    for (let i = 0; i < n; i++) blob(ctx, rnd() * W, H * (0.1 + rnd() * 0.8), W * (0.03 + rnd() * 0.08) * (0.6 + variant.lekeli), H * (0.06 + rnd() * 0.12), pale, 0.45 * variant.lekeli + 0.1, rnd() * 3);
  }

  // 4) yabani tip: koyu/yeşilimsi benekli desen
  if (variant.stil === 'yabani') {
    for (let i = 0; i < 26; i++) blob(ctx, rnd() * W, rnd() * H, W * (0.03 + rnd() * 0.07), H * (0.05 + rnd() * 0.1), mixRgb(hexToRgb('#3a4a22'), hexToRgb('#6c5a2e'), rnd()), 0.35, rnd() * 3);
    ctx.strokeStyle = css(hexToRgb('#d8cfa4'), 0.35);
    ctx.lineWidth = H * 0.025;
    ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
  }

  // 5) sırt çizgisi (golden back)
  if (variant.serit) {
    const gs = ctx.createLinearGradient(0, H * 0.36, 0, H * 0.64);
    gs.addColorStop(0, css(hexToRgb(variant.serit), 0)); gs.addColorStop(0.5, css(hexToRgb(variant.serit), 1)); gs.addColorStop(0.25, css(hexToRgb(variant.serit), 0.7)); gs.addColorStop(0.75, css(hexToRgb(variant.serit), 0.7)); gs.addColorStop(1, css(hexToRgb(variant.serit), 0));
    ctx.fillStyle = gs;
    ctx.fillRect(0, H * 0.36, W, H * 0.28);
  }

  // 6) pigment noktaları (kromatofor)
  const dots = variant.benek ? variant.benek.yogunluk : 0.18;
  const dc = variant.benek ? hexToRgb(variant.benek.renk) : mixRgb(sirt, [0, 0, 0], 0.5);
  const nd = Math.round(180 * dots * (W / 512) * 2);
  for (let i = 0; i < nd; i++) {
    const x = rnd() * W, y = rnd() * H, r = 0.8 + rnd() * 2.2 * (W / 512);
    ctx.fillStyle = css(dc, 0.1 + rnd() * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // açık parıltı noktaları (kitin yansıması)
  for (let i = 0; i < nd / 3; i++) {
    ctx.fillStyle = css([1, 1, 1], 0.05 + rnd() * 0.08);
    ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 1.6, 0, Math.PI * 2); ctx.fill();
  }

  // 7) dişi: sırt ortasında "eyer" (gelişen yumurtalıklar; karapaks arkasında yeşilimsi-sarı alan)
  if (sex === 'disi' && kind === 'carapace') {
    blob(ctx, W * 0.66, H * 0.5, W * 0.26, H * 0.17, hexToRgb('#cdbb4a'), 0.62);
    blob(ctx, W * 0.66, H * 0.5, W * 0.14, H * 0.09, hexToRgb('#e6dc7a'), 0.4);
  }

  // 8) yapı çizgileri: karapaksta boyun oluğu (servikal), karında halka kenarı
  ctx.lineCap = 'round';
  if (kind === 'carapace') {
    ctx.strokeStyle = css(mixRgb(sirt, [0, 0, 0], 0.55), 0.35);
    ctx.lineWidth = Math.max(1, H * 0.012);
    ctx.beginPath(); ctx.moveTo(W * 0.46, H * 0.28); ctx.quadraticCurveTo(W * 0.4, H * 0.5, W * 0.46, H * 0.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.62); ctx.quadraticCurveTo(W * 0.4, H * 0.7, W * 0.9, H * 0.66); ctx.stroke();
  } else {
    const ge = ctx.createLinearGradient(0, 0, W * 0.12, 0);
    ge.addColorStop(0, css(mixRgb(dor, [0, 0, 0], 0.4), 0.3)); ge.addColorStop(1, css(mixRgb(dor, [0, 0, 0], 0.5), 0));
    ctx.fillStyle = ge;
    ctx.fillRect(0, 0, W * 0.12, H);
    const gh = ctx.createLinearGradient(W * 0.86, 0, W, 0);
    gh.addColorStop(0, css([1, 1, 1], 0)); gh.addColorStop(1, css([1, 1, 1], 0.06));
    ctx.fillStyle = gh;
    ctx.fillRect(W * 0.86, 0, W * 0.14, H);
  }
  return cv;
}
