// Amano karidesi kabuk dokusu (tarayıcıya özgü <canvas>): yarı saydam gri-yeşil gövde, sırtta ince açık çizgi,
// yanlarda kırmızımsı-kahverengi benek sırası (erkek: yuvarlak benekler, dişi: uzamış çizgi/tireler), ince koyu kromatofor noktaları.
// Doku eşlemesi karides hattıyla aynıdır: yatay u = parça boyunca, dikey v = çevre (0,5 = sırt ortası, 0,25/0,75 = yanlar).
import { BODY, type Sex } from '../karides/model';
import type { ShellKind } from '../karides/texture';
import { hexToRgb, mixRgb, mulberry32, seedFor, sexTone, type Rgb, type Variant } from '../karides/variants';

const css = (c: Rgb, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
export const DOT: Rgb = hexToRgb('#7d321c');

/** Dünya birimi (model uzunluğu ~2,3) cinsinden benek yerleşimi: u = parça boyunca konum, len = u yönünde uzunluk (tam), th = kalınlık (yarıçap) */
export function dotLayout(sex: Sex, kind: ShellKind): { u: number; len: number; th: number }[] {
  if (kind === 'carapace') return sex === 'erkek' ? [0.3, 0.46, 0.62, 0.78].map((u) => ({ u, len: 0.05, th: 0.026 })) : [{ u: 0.38, len: 0.16, th: 0.02 }, { u: 0.74, len: 0.14, th: 0.02 }];
  return sex === 'erkek' ? [{ u: 0.3, len: 0.045, th: 0.023 }, { u: 0.7, len: 0.045, th: 0.023 }] : [{ u: 0.5, len: 0.12, th: 0.018 }];
}
/** Doku boyutu: dünya uzunluğu (u yönü) ve çevre (v yönü) */
const DIM = { carapace: { L: 0.78, C: 1.5 }, abdomen: { L: 0.2, C: 1.3 }, clear: { L: 0.2, C: 1.3 } } as const;

export function paintShell(variant: Variant, sex: Sex, kind: ShellKind, W = 512): HTMLCanvasElement {
  const H = Math.round(W / 2);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  const rnd = mulberry32(seedFor(variant, sex) + (kind === 'carapace' ? 1 : 3));
  const k = BODY[sex].colour;
  const sirt = sexTone(hexToRgb(variant.renk.sirt), k), yan = sexTone(hexToRgb(variant.renk.yan), k), karin = sexTone(hexToRgb(variant.renk.karin), k);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, css(karin)); g.addColorStop(0.2, css(mixRgb(karin, yan, 0.7))); g.addColorStop(0.36, css(yan));
  g.addColorStop(0.5, css(sirt)); g.addColorStop(0.64, css(yan)); g.addColorStop(0.8, css(mixRgb(karin, yan, 0.7))); g.addColorStop(1, css(karin));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // ince koyu kromatofor noktaları (yarı saydam kabukta küçük benekler)
  const nd = Math.round(300 * (W / 512));
  for (let i = 0; i < nd; i++) {
    ctx.fillStyle = css(mixRgb(sirt, [0, 0, 0], 0.6), 0.1 + rnd() * 0.2);
    ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, (0.7 + rnd() * 1.4) * (W / 512), 0, Math.PI * 2); ctx.fill();
  }
  // sırtta ince açık çizgi (sırt çizgisi)
  const gs = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.55);
  const cr = hexToRgb('#ffffff');
  gs.addColorStop(0, css(cr, 0)); gs.addColorStop(0.5, css(cr, 1)); gs.addColorStop(1, css(cr, 0));
  ctx.fillStyle = gs; ctx.fillRect(0, H * 0.45, W, H * 0.1);

  // dişi: sırtta yeşilimsi eyer (yalnız karapaks arkası)
  if (sex === 'disi' && kind === 'carapace') {
    for (const [rx, ry, a] of [[0.24, 0.16, 0.5], [0.12, 0.08, 0.35]] as const) {
      ctx.save(); ctx.translate(W * 0.68, H * 0.5); ctx.scale(W * rx, H * ry);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, css(hexToRgb('#8aa04a'), a)); rg.addColorStop(1, css(hexToRgb('#8aa04a'), 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  // yan benek sırası (iki yan): alt yanlarda v≈0,2 ve 0,8
  const dim = DIM[kind];
  for (const v of [0.2, 0.8]) {
    for (const d of dotLayout(sex, kind)) {
      const cx = d.u * W, cy = v * H;
      const rx = (d.len / 2) / (dim.L / W), ry = d.th / (dim.C / H);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, css(DOT, 0.95)); rg.addColorStop(0.75, css(DOT, 0.9)); rg.addColorStop(1, css(DOT, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  // halka kenarı gölgesi (karın) / boyun oluğu (karapaks)
  if (kind === 'abdomen') {
    const ge = ctx.createLinearGradient(0, 0, W * 0.12, 0);
    ge.addColorStop(0, css(mixRgb(sirt, [0, 0, 0], 0.4), 0.3)); ge.addColorStop(1, css(mixRgb(sirt, [0, 0, 0], 0.5), 0));
    ctx.fillStyle = ge; ctx.fillRect(0, 0, W * 0.12, H);
  }
  return cv;
}
