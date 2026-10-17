// Balık dokuları için ortak canvas yardımcıları (tarayıcıya özgü; sahte canvas ile birim testlenir).
// Gövde dokusu: yatay eksen = s (burun solda), dikey eksen = çevre açısı. Üst yarı +z yanı (sırt üstte, karın altta),
// alt yarı −z yanı (karın üstte, sırt altta) gösterir. Boyama işlevi her yanı "sırt üstte" varsayarak boyar.
import { hexToRgb, mulberry32 } from './fishmath';

export type Ctx = CanvasRenderingContext2D;

export const rgba = (hex: string, a: number): string => {
  const c = hexToRgb(hex);
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
};

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Yumuşak kenarlı elips leke */
export function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number, rot = 0, hard = 0.65) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(hard, rgba(color, alpha * 0.6));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export type FlankPainter = (ctx: Ctx, W: number, H: number, side: 1 | -1) => void;

/** İki yanı (farklı tohumlarla) boyayıp tek gövde dokusuna birleştirir */
export function assembleBody(W: number, Hh: number, paint: FlankPainter): HTMLCanvasElement {
  const cv = makeCanvas(W, Hh * 2);
  const ctx = cv.getContext('2d')!;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, Hh); ctx.clip();
  paint(ctx, W, Hh, 1);
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(0, Hh, W, Hh); ctx.clip();
  ctx.translate(0, Hh * 2);
  ctx.scale(1, -1);
  paint(ctx, W, Hh, -1);
  ctx.restore();
  return cv;
}

/** Pul/zırh kabartma haritası: satırlar kayık dizilmiş yarım daire pullar (griye göre) */
export function scaleBump(W: number, Hh: number, cols: number, rows: number, strength = 0.5): HTMLCanvasElement {
  const cv = makeCanvas(W, Hh * 2);
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, Hh * 2);
  const cw = W / cols, ch = (Hh * 2) / rows;
  for (let r = 0; r < rows + 1; r++) {
    for (let c = -1; c < cols + 1; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * cw, y = r * ch;
      const g = ctx.createRadialGradient(x, y, 0, x, y, cw * 0.62);
      g.addColorStop(0, `rgba(255,255,255,${strength})`);
      g.addColorStop(0.7, `rgba(255,255,255,${strength * 0.35})`);
      g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, cw * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return cv;
}

export function flatBump(W: number, H: number): HTMLCanvasElement {
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, W, H);
  return cv;
}

// ------------------------------------------------------------------ yüzgeç dokusu

export interface FinStyle {
  /** Kökten uca renk/saydamlık durakları: [konum 0..1, renk, alfa] */
  stops: [number, string, number][];
  rays?: { n: number; color: string; alpha: number };
  /** Uca yakın şerit (ör. kelebek desen) */
  speckle?: { n: number; color: string; alpha: number; r: [number, number]; seed?: number };
  edge?: { color: string; alpha: number };
}

/** Yüzgeç dokusu: yatay = kök boyunca (ışınlar), dikey = köken uca (üstte kök) */
export function paintFin(style: FinStyle, W = 256, H = 128): HTMLCanvasElement {
  const cv = makeCanvas(W, H);
  const ctx = cv.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [p, c, a] of style.stops) g.addColorStop(Math.min(1, Math.max(0, p)), rgba(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (style.speckle) {
    const rnd = mulberry32(style.speckle.seed ?? 7);
    for (let i = 0; i < style.speckle.n; i++) {
      const r = style.speckle.r[0] + (style.speckle.r[1] - style.speckle.r[0]) * rnd();
      blob(ctx, rnd() * W, rnd() * H, r * W, r * W, style.speckle.color, style.speckle.alpha, 0, 0.6);
    }
  }
  if (style.rays) {
    const { n, color, alpha } = style.rays;
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = Math.max(1, W / n / 6);
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
  }
  if (style.edge) {
    ctx.fillStyle = rgba(style.edge.color, style.edge.alpha);
    ctx.fillRect(0, H - Math.max(2, H * 0.04), W, H);
  }
  return cv;
}
