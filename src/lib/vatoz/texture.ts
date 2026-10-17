// Sırt / karın dokusunu <canvas> üzerinde üretir (tarayıcıya özgü; sahte canvas ile birim testlenir).
// Doku eşlemesi: planar; yatay eksen = x (burun solda), dikey eksen = z. Bkz. texUV.
import { discPoint, texUV, type Sex } from './model';
import { hexToRgb, mulberry32, seedFor, type DesenLayer, type Variant } from './variants';

type Ctx = CanvasRenderingContext2D;

function rgba(hex: string, a: number): string {
  const c = hexToRgb(hex);
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.65, rgba(color, alpha * 0.6));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export interface BodyTextures { dorsal: HTMLCanvasElement; ventral: HTMLCanvasElement; bump: HTMLCanvasElement }

export function paintBody(variant: Variant, sex: Sex, W = 1024): BodyTextures {
  const rnd = mulberry32(seedFor(variant, sex));
  const px = (x: number, z: number): [number, number] => { const [u, v] = texUV(x, z); return [u * W, v * W]; };
  const unit = W / 2.2; // 1 disk birimi = unit piksel
  const sample = (rho: [number, number]): [number, number] => {
    const rr = Math.sqrt(rho[0] ** 2 + (rho[1] ** 2 - rho[0] ** 2) * rnd());
    const [x, z] = discPoint(sex, rr, rnd() * Math.PI * 2);
    return px(x, z);
  };
  const clipDisc = (c: Ctx) => {
    c.beginPath();
    for (let i = 0; i <= 120; i++) {
      const [x, z] = discPoint(sex, 1, (i / 120) * Math.PI * 2);
      const [a, b] = px(x, z);
      if (i === 0) c.moveTo(a, b); else c.lineTo(a, b);
    }
    c.closePath();
    c.clip();
  };
  const cen = px(0, 0);

  // ---------------- sırt
  const dorsal = makeCanvas(W, W);
  const d = dorsal.getContext('2d')!;
  d.save();
  clipDisc(d);
  const g = d.createRadialGradient(cen[0] - unit * 0.1, cen[1], 0, cen[0], cen[1], unit * 1.02);
  g.addColorStop(0, variant.sirt.merkez);
  g.addColorStop(0.55, variant.sirt.merkez);
  g.addColorStop(1, variant.sirt.kenar);
  d.fillStyle = g;
  d.fillRect(0, 0, W, W);
  for (const ly of variant.desen) paintLayer(d, ly, sample, unit, rnd);
  // baş-gövde tümseğinde hafif aydınlık ve kenarda yumuşak koyulaşma
  blob(d, px(-0.2, 0)[0], cen[1], unit * 0.42, unit * 0.28, '#ffffff', 0.07);
  d.restore();

  // ---------------- karın
  const ventral = makeCanvas(W, W);
  const v = ventral.getContext('2d')!;
  v.save();
  clipDisc(v);
  const gv = v.createRadialGradient(cen[0], cen[1], 0, cen[0], cen[1], unit * 1.02);
  gv.addColorStop(0, variant.karin.orta);
  gv.addColorStop(0.62, variant.karin.orta);
  gv.addColorStop(1, variant.karin.kenar);
  v.fillStyle = gv;
  v.fillRect(0, 0, W, W);
  for (let i = 0; i < 70; i++) {
    const [a, b] = sample([0.72, 0.99]);
    blob(v, a, b, unit * (0.02 + rnd() * 0.04), unit * (0.02 + rnd() * 0.04), variant.karin.kenar, 0.35, rnd() * 3);
  }
  // kenarda ince koyu çizgi (sırt rengine yakın)
  v.lineWidth = unit * 0.014;
  v.strokeStyle = rgba(variant.sirt.kenar, 0.75);
  v.beginPath();
  for (let i = 0; i <= 120; i++) {
    const [x, z] = discPoint(sex, 0.995, (i / 120) * Math.PI * 2);
    const [a, b] = px(x, z);
    if (i === 0) v.moveTo(a, b); else v.lineTo(a, b);
  }
  v.stroke();
  v.restore();

  // ---------------- kabartma: ince deri tanecikleri
  const bump = makeCanvas(W, W);
  const b = bump.getContext('2d')!;
  b.fillStyle = '#808080';
  b.fillRect(0, 0, W, W);
  for (let i = 0; i < 1400; i++) {
    const [a, c] = sample([0, 1]);
    const r = unit * (0.005 + rnd() * 0.008);
    b.fillStyle = rnd() > 0.5 ? 'rgba(200,200,200,0.55)' : 'rgba(90,90,90,0.55)';
    b.beginPath(); b.arc(a, c, r, 0, Math.PI * 2); b.fill();
  }
  return { dorsal, ventral, bump };
}

function paintLayer(c: Ctx, ly: DesenLayer, sample: (rho: [number, number]) => [number, number], unit: number, rnd: () => number) {
  if (ly.t === 'benek') {
    for (let i = 0; i < ly.n; i++) {
      const [x, y] = sample(ly.rho);
      const r = (ly.r[0] + rnd() * (ly.r[1] - ly.r[0])) * unit;
      c.fillStyle = rgba(ly.renk, ly.a[0] + rnd() * ly.a[1]);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
  } else if (ly.t === 'ocellus') {
    for (let i = 0; i < ly.n; i++) {
      const [x, y] = sample(ly.rho);
      const r = (ly.r[0] + rnd() * (ly.r[1] - ly.r[0])) * unit;
      c.fillStyle = rgba(ly.ic, 0.95);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rgba(ly.halka, 0.95);
      c.lineWidth = Math.max(1.5, r * ly.kalinlik * 2);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    }
  } else if (ly.t === 'leke') {
    for (let i = 0; i < ly.n; i++) {
      const [x, y] = sample(ly.rho);
      const r = (ly.r[0] + rnd() * (ly.r[1] - ly.r[0])) * unit;
      blob(c, x, y, r * (0.7 + rnd() * 0.8), r * (0.6 + rnd() * 0.6), ly.renk, ly.a, rnd() * Math.PI);
    }
  } else if (ly.t === 'ag') {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 0; i < ly.n; i++) {
      let [x, y] = sample(ly.rho);
      let ang = rnd() * Math.PI * 2;
      c.strokeStyle = rgba(ly.renk, ly.a);
      c.lineWidth = (ly.w[0] + rnd() * (ly.w[1] - ly.w[0])) * unit;
      c.beginPath(); c.moveTo(x, y);
      const steps = 10 + Math.floor(rnd() * 14);
      for (let k = 0; k < steps; k++) {
        ang += (rnd() - 0.5) * 0.9;
        x += Math.cos(ang) * ly.uzunluk * unit * 0.09;
        y += Math.sin(ang) * ly.uzunluk * unit * 0.09;
        c.lineTo(x, y);
      }
      c.stroke();
    }
  }
}
