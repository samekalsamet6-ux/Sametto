// Tohum (seed) verisi için tamamen üretilmiş, açıkça "ÖRNEK" damgalı yer tutucu PNG fotoğraflar. Dış bağımlılık yok.
import { deflateSync, crc32 } from 'node:zlib';

const W = 640, H = 480;
// 5x7 piksel yazı tipi: Ö R N E K
const GLYPHS: Record<string, string[]> = {
  Ö: ['01010', '01110', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
};

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}

export function placeholderPng(seed: number, label = 'ÖRNEK'): Buffer {
  const px = Buffer.alloc(W * H * 3);
  const set = (x: number, y: number, c: [number, number, number], a = 1) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) px[i + k] = Math.round(px[i + k] * (1 - a) + c[k] * a);
  };
  const hue = (seed * 47 + 170) % 360;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, hsl((hue + 200) % 360, 0.45, 0.14 + 0.28 * (1 - y / H)));
  // "su" ışık huzmeleri
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x + y * 0.4 + seed * 31) % 90) < 10) set(x, y, [255, 255, 255], 0.05);
  // balık gövdesi (elips) + kuyruk + göz
  const cx = 300 + (seed % 3) * 20, cy = 230, rx = 140, ry = 70 + (seed % 4) * 8;
  const body = hsl(hue, 0.75, 0.55), fin = hsl((hue + 25) % 360, 0.8, 0.62);
  for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
    if (d <= 1) set(x, y, body, 1 - Math.max(0, d - 0.85) * 3);
  }
  for (let t = 0; t < 110; t++) { const half = t * 0.75; for (let y = Math.round(cy - half); y <= cy + half; y++) set(cx + rx - 20 + t, y, fin, 0.95 - t / 220); }
  for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) {
    const d = x * x + y * y;
    if (d <= 100) set(cx - rx + 45 + x, cy - 14 + y, [255, 255, 255]);
    if (d <= 30) set(cx - rx + 47 + x, cy - 14 + y, [10, 20, 30]);
  }
  // ÖRNEK şeridi
  const sc = 6, gap = 2, gw = 5 * sc, total = label.length * gw + (label.length - 1) * gap * sc;
  const x0 = Math.round((W - total) / 2), y0 = 20;
  for (let y = y0 - 10; y < y0 + 7 * sc + 10; y++) for (let x = 0; x < W; x++) set(x, y, [10, 20, 30], 0.62);
  [...label].forEach((ch, gi) => {
    const g = GLYPHS[ch]; if (!g) return;
    g.forEach((row, ry2) => [...row].forEach((bit, rx2) => {
      if (bit !== '1') return;
      for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) set(x0 + gi * (gw + gap * sc) + rx2 * sc + xx, y0 + ry2 * sc + yy, [255, 224, 138]);
    }));
  });
  // PNG kodla
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
