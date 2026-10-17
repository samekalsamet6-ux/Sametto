// Gövde dokusunu <canvas> üzerinde üretir (tarayıcıya özgü; birim testi yok).
// Doku eşlemesi: yatay eksen u = gövde boyu (burun solda), dikey eksen v = halka açısı / 2π.
// v=0 ve v=1 karın orta çizgisi, v=0.5 sırt, v=0.25 +z yanı. Yarısı çizilir, sonra aynalanır.
import type { Sex } from './model';
import { mulberry32, type Variant } from './variants';

type Ctx = CanvasRenderingContext2D;

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(0.6, hexA(color, alpha * 0.55));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export interface BodyTextures { map: HTMLCanvasElement; bump: HTMLCanvasElement }

export function paintBody(variant: Variant, sex: Sex, W = 1024): BodyTextures {
  const H = W / 2;
  const half = H / 2;
  const map = makeCanvas(W, H);
  const bump = makeCanvas(W, H);
  const hc = makeCanvas(W, half); // yarım doku (karın -> sırt)
  const hb = makeCanvas(W, half);
  const c = hc.getContext('2d')!;
  const b = hb.getContext('2d')!;
  const pal = variant[sex];
  const rnd = mulberry32(variant.id.length * 977 + (sex === 'erkek' ? 11 : 29));
  const male = sex === 'erkek';

  // taban: karın açık, sırt koyu
  const g = c.createLinearGradient(0, 0, 0, half);
  g.addColorStop(0, pal.karin);
  g.addColorStop(0.14, pal.karin);
  g.addColorStop(0.36, pal.yan);
  g.addColorStop(0.8, pal.yan);
  g.addColorStop(1, pal.sirt);
  c.fillStyle = g;
  c.fillRect(0, 0, W, half);
  // sırt boyunca koyu şerit
  const dg = c.createLinearGradient(0, half * 0.7, 0, half);
  dg.addColorStop(0, hexA(pal.sirt, 0));
  dg.addColorStop(1, hexA(pal.sirt, 0.65));
  c.fillStyle = dg;
  c.fillRect(0, half * 0.7, W, half * 0.3);

  // ---- renkli desen (erkekte arka yarı güçlü; dişide çok hafif)
  const x0 = W * 0.3; // desen başlangıcı
  const span = W - x0;
  const strength = male ? 1 : 0.18;
  c.save();
  // arka yarıya doğru artan maske için çizimleri ayrı katmanda yap
  const layer = makeCanvas(W, half);
  const l = layer.getContext('2d')!;
  const id = variant.id;
  if (id === 'mozaik') {
    for (let i = 0; i < 120; i++) {
      const col = variant.vurgu[Math.floor(rnd() * variant.vurgu.length)];
      blob(l, x0 + rnd() * span, rnd() * half, 16 + rnd() * 46, 12 + rnd() * 30, col, 0.5 + rnd() * 0.35);
    }
  } else if (id === 'cobra') {
    l.fillStyle = hexA(variant.erkek.yan, 0.9);
    l.fillRect(x0, 0, span, half);
    blob(l, W * 0.62, half * 0.62, 190, 70, '#f6c15a', 0.75);
    l.strokeStyle = hexA('#101010', 0.62);
    l.lineWidth = 3.2;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 18; col++) {
        const cx = x0 + col * 34 + (row % 2 ? 17 : 0) + (rnd() - 0.5) * 4;
        const cy = row * 40 + 14 + (rnd() - 0.5) * 3;
        l.beginPath();
        l.ellipse(cx, cy, 12 + rnd() * 3, 12.5 + rnd() * 3, 0, 0, Math.PI * 2);
        l.stroke();
        if (rnd() > 0.55) { l.fillStyle = hexA('#101010', 0.5); l.beginPath(); l.arc(cx, cy, 3, 0, Math.PI * 2); l.fill(); }
      }
    }
  } else if (id === 'blue-grass') {
    l.fillStyle = hexA(variant.erkek.yan, 0.9);
    l.fillRect(x0, 0, span, half);
    blob(l, W * 0.7, half * 0.5, 210, 80, '#3f74e8', 0.8);
    for (let i = 0; i < 1800; i++) {
      const r = 1.1 + rnd() * 2.1;
      l.fillStyle = hexA('#060b22', 0.45 + rnd() * 0.5);
      l.beginPath(); l.arc(x0 + rnd() * span, rnd() * half, r, 0, Math.PI * 2); l.fill();
    }
    for (let i = 0; i < 60; i++) blob(l, x0 + rnd() * span, rnd() * half, 10 + rnd() * 18, 8 + rnd() * 10, '#9fc4ff', 0.35);
  } else if (id === 'albino') {
    blob(l, W * 0.72, half * 0.55, 240, 90, '#f7dba8', 0.6);
    blob(l, W * 0.55, half * 0.2, 160, 50, '#f4c4b2', 0.35);
  } else if (id === 'endler') {
    blob(l, W * 0.62, half * 0.62, 200, 64, '#ff7a12', 0.92);
    blob(l, W * 0.8, half * 0.45, 130, 50, '#ff8a1f', 0.85);
    blob(l, W * 0.46, half * 0.8, 120, 36, '#2fd06a', 0.75);
    blob(l, W * 0.55, half * 0.32, 150, 36, '#35c9e8', 0.5);
    for (let i = 0; i < 3; i++) {
      const bx = W * (0.5 + i * 0.13);
      l.fillStyle = hexA('#0a0a0a', 0.78);
      l.beginPath(); l.ellipse(bx, half * 0.7, 9, half * 0.34, 0, 0, Math.PI * 2); l.fill();
    }
    blob(l, W * 0.4, half * 0.62, 24, 22, '#0a0a0a', 0.85);
  }
  // maske: x0'dan itibaren artan
  l.globalCompositeOperation = 'destination-in';
  const mask = l.createLinearGradient(x0, 0, x0 + span * 0.45, 0);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,1)');
  l.fillStyle = mask;
  l.fillRect(0, 0, W, half);
  c.globalAlpha = strength;
  c.drawImage(layer, 0, 0);
  c.globalAlpha = 1;
  c.restore();

  // ---- kafa: hafif parlak ve solungaç bölgesi yumuşak gölgesi
  blob(c, W * 0.12, half * 0.7, 120, 60, '#ffffff', 0.12);
  const gill = c.createLinearGradient(W * 0.255, 0, W * 0.3, 0);
  gill.addColorStop(0, 'rgba(0,0,0,0)');
  gill.addColorStop(0.5, 'rgba(20,20,30,0.16)');
  gill.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gill;
  c.fillRect(W * 0.25, 0, W * 0.06, half);

  // ---- pullar
  b.fillStyle = '#808080';
  b.fillRect(0, 0, W, half);
  const sw = 33, sh = 27;
  for (let row = -1; row < Math.ceil(half / sh) + 1; row++) {
    for (let col = 0; col * sw < W - 40; col++) {
      const x = W * 0.235 + col * sw + (row % 2 ? sw / 2 : 0);
      if (x > W * 0.97) continue;
      const y = row * sh + sh * 0.5;
      // pul gövdesi: hafif ışıltı
      const sg = c.createRadialGradient(x - 6, y - 4, 1, x, y, sw * 0.6);
      sg.addColorStop(0, 'rgba(255,255,255,0.12)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sg;
      c.beginPath(); c.ellipse(x, y, sw * 0.55, sh * 0.6, 0, 0, Math.PI * 2); c.fill();
      // arka (kuyruğa bakan) kenar: koyu ince yay
      c.strokeStyle = 'rgba(10,20,30,0.20)';
      c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(x, y, sw * 0.55, sh * 0.6, 0, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      // kabartma
      const bg = b.createRadialGradient(x - 5, y - 3, 1, x, y, sw * 0.6);
      bg.addColorStop(0, '#d8d8d8');
      bg.addColorStop(0.8, '#9a9a9a');
      bg.addColorStop(1, '#606060');
      b.fillStyle = bg;
      b.beginPath(); b.ellipse(x, y, sw * 0.55, sh * 0.6, 0, 0, Math.PI * 2); b.fill();
      b.strokeStyle = '#303030';
      b.lineWidth = 1.5;
      b.beginPath(); b.ellipse(x, y, sw * 0.55, sh * 0.6, 0, -Math.PI * 0.5, Math.PI * 0.5); b.stroke();
    }
  }
  // pulsuz baş bölgesi: sönük
  const headFade = c.createLinearGradient(W * 0.17, 0, W * 0.25, 0);
  headFade.addColorStop(0, 'rgba(128,128,128,1)');
  headFade.addColorStop(1, 'rgba(128,128,128,0)');
  b.fillStyle = headFade;
  b.fillRect(0, 0, W * 0.25, half);

  // ---- yan çizgi (v = 0.25 -> yarım dokuda y = half/2): noktalı çizgi
  c.save();
  c.strokeStyle = 'rgba(15,25,35,0.55)';
  c.lineWidth = 2.4;
  c.setLineDash([5, 4]);
  c.beginPath();
  const ly = half * 0.5;
  for (let i = 0; i <= 80; i++) {
    const x = W * (0.3 + 0.66 * (i / 80));
    const y = ly + Math.sin((i / 80) * Math.PI) * -6 + (i / 80) * 6;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();

  // ---- gravid spot (dişi): karın arka kısmı, anal yüzgecin hemen önünde
  if (!male) {
    const sx = W * 0.6, sy = half * 0.2;
    blob(c, sx, sy, 78, 46, '#1a0f08', 0.85);
    blob(c, sx, sy, 48, 28, '#0a0504', 0.9);
    blob(c, sx + 30, sy + 10, 90, 55, '#c86a3a', 0.12);
  }

  // yarıyı tam dokuya yerleştir: alt yarı normal, üst yarı ayna
  for (const [src, dst] of [[hc, map], [hb, bump]] as const) {
    const d = dst.getContext('2d')!;
    d.drawImage(src, 0, 0);
    d.save();
    d.translate(0, H);
    d.scale(1, -1);
    d.drawImage(src, 0, 0);
    d.restore();
  }
  return { map, bump };
}
