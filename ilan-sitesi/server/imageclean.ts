// Yüklenen fotoğraflardan üst veriyi (EXIF/GPS, XMP, IPTC, yorum, zaman damgası...) ayıklar. Bağımlılık yok; yeniden kodlama yok:
// yalnızca izin verilen bölümler/parçalar olduğu gibi kopyalanır, görüntü verisine dokunulmaz.
// Biçim bozuksa null döner (yükleme reddedilir).

import { crc32 } from 'node:zlib';

const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ---------------- JPEG ----------------
/** APP1/Exif içindeki yönelim (Orientation, etiket 0x0112) değerini okur; yoksa/bozuksa null. */
export function readExifOrientation(seg: Uint8Array): number | null {
  // seg: "Exif\0\0" + TIFF
  if (seg.length < 14 || ascii(seg, 0, 4) !== 'Exif' || seg[4] !== 0 || seg[5] !== 0) return null;
  const t = 6, le = ascii(seg, t, 2) === 'II';
  if (!le && ascii(seg, t, 2) !== 'MM') return null;
  const r16 = (o: number) => (o + 2 <= seg.length ? (le ? seg[o] | (seg[o + 1] << 8) : u16be(seg, o)) : -1);
  const r32 = (o: number) => (o + 4 <= seg.length ? (le ? u32le(seg, o) : u32be(seg, o)) : -1);
  if (r16(t + 2) !== 42) return null;
  const ifd = t + r32(t + 4);
  if (ifd < t || ifd + 2 > seg.length) return null;
  const n = r16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > seg.length) return null;
    if (r16(e) === 0x0112 && r16(e + 2) === 3 && r32(e + 4) === 1) { const v = r16(e + 8); return v >= 1 && v <= 8 ? v : null; }
  }
  return null;
}

/** Yalnızca yönelim etiketini içeren en küçük EXIF APP1 bölümü (konum, cihaz, zaman yok). */
export function minimalExifOrientation(o: number): Uint8Array {
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, // "Exif\0\0"
    0x4d, 0x4d, 0, 42, 0, 0, 0, 8, // TIFF başlığı (big-endian), IFD0 ofseti 8
    0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, // 1 girdi: Orientation, SHORT, sayı 1, değer
    0, 0, 0, 0]; // sonraki IFD yok
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...payload]);
}

export function cleanJpeg(b: Uint8Array): Uint8Array | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const out: Uint8Array[] = [b.subarray(0, 2)];
  let outLen = 2, insertIdx = 1; // yönelim bölümü APP0'dan hemen sonra (yoksa SOI'dan sonra) eklenir
  let orientation: number | null = null;
  let i = 2, sawSof = false, sawEoi = false;
  const push = (s: Uint8Array) => { out.push(s); outLen += s.length; };
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    while (i < b.length && b[i] === 0xff) i++; // dolgu baytları
    if (i >= b.length) return null;
    const m = b[i++];
    if (m === 0xd9) { push(new Uint8Array([0xff, 0xd9])); sawEoi = true; break; }
    if (m === 0x00 || m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { if (m === 0x01) { push(new Uint8Array([0xff, 0x01])); } continue; }
    if (i + 2 > b.length) return null;
    const len = u16be(b, i);
    if (len < 2 || i + len > b.length) return null;
    const seg = b.subarray(i + 2, i + len), full = b.subarray(i - 2, i + len);
    i += len;
    const isApp = m >= 0xe0 && m <= 0xef;
    if (m === 0xe1 && orientation === null) orientation = readExifOrientation(seg);
    if (m === 0xfe) continue; // COM
    if (isApp) {
      const keep = (m === 0xe0 && ascii(seg, 0, 5) === 'JFIF\0') // JFXX (küçük resim barındırabilir) atılır
        || (m === 0xe2 && ascii(seg, 0, 12) === 'ICC_PROFILE\0') // renk profili
        || (m === 0xee && ascii(seg, 0, 5) === 'Adobe'); // Adobe renk dönüşümü bayrağı (CMYK/YCCK doğru görünsün)
      if (!keep) continue;
      if (m === 0xe0 && out.length === 1) insertIdx = 2;
      push(full);
      continue;
    }
    push(full);
    if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) sawSof = true;
    if (m === 0xda) {
      // tarama başlığından sonra: sıkıştırılmış veri bir sonraki gerçek işaretçiye kadar olduğu gibi kopyalanır
      let j = i;
      while (j < b.length - 1) {
        if (b[j] === 0xff && b[j + 1] !== 0x00 && !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7)) { if (b[j + 1] === 0xff) { j++; continue; } break; }
        j++;
      }
      if (j >= b.length - 1) return null;
      push(b.subarray(i, j)); i = j;
    }
  }
  if (!sawEoi || !sawSof) return null;
  if (orientation !== null && orientation !== 1) out.splice(insertIdx, 0, minimalExifOrientation(orientation));
  return concat(out);
}

// ---------------- PNG ----------------
const PNG_KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'pHYs', 'bKGD']);
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); out.set(Buffer.from(type), 4); out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
export function cleanPng(b: Uint8Array): Uint8Array | null {
  if (b.length < 8 + 12) return null;
  const out: Uint8Array[] = [b.subarray(0, 8)];
  let orientation: number | null = null;
  let i = 8, first = true, sawIdat = false, sawIend = false;
  while (i + 12 <= b.length) {
    const len = u32be(b, i);
    if (len > 0x7fffffff || i + 12 + len > b.length) return null;
    const type = ascii(b, i + 4, 4);
    if (first && type !== 'IHDR') return null;
    first = false;
    if (type === 'eXIf' && orientation === null) orientation = readExifOrientation(concat([Buffer.from('Exif\0\0'), b.subarray(i + 8, i + 8 + len)]));
    if (type === 'IDAT') { if (!sawIdat && orientation !== null && orientation !== 1) out.push(pngChunk('eXIf', minimalExifOrientation(orientation).subarray(10))); sawIdat = true; }
    if (PNG_KEEP.has(type)) out.push(b.subarray(i, i + 12 + len)); // tEXt/zTXt/iTXt/eXIf/tIME ve diğer yardımcı parçalar atılır
    i += 12 + len;
    if (type === 'IEND') { sawIend = true; break; } // IEND sonrası fazlalık atılır
  }
  if (!sawIend || !sawIdat) return null;
  return concat(out);
}

// ---------------- WebP ----------------
const WEBP_KEEP = new Set(['VP8X', 'VP8 ', 'VP8L', 'ALPH', 'ANIM', 'ANMF', 'ICCP']);
export function cleanWebp(b: Uint8Array): Uint8Array | null {
  if (b.length < 20 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WEBP') return null;
  const end = Math.min(b.length, 8 + u32le(b, 4));
  if (end < 20) return null;
  const chunks: Uint8Array[] = [];
  let i = 12, sawImage = false;
  while (i + 8 <= end) {
    const type = ascii(b, i, 4), len = u32le(b, i + 4);
    const total = 8 + len + (len & 1);
    if (i + 8 + len > end) return null;
    if (type === 'VP8 ' || type === 'VP8L' || type === 'ANMF') sawImage = true;
    if (WEBP_KEEP.has(type)) {
      const c = new Uint8Array(total);
      c.set(b.subarray(i, Math.min(i + total, end)));
      if (type === 'VP8X') { if (len < 10) return null; c[8] &= ~(0x08 | 0x04); } // EXIF ve XMP bayraklarını temizle
      chunks.push(c);
    }
    i += total;
  }
  if (!sawImage) return null;
  const body = concat(chunks);
  const head = new Uint8Array(12);
  head.set(Buffer.from('RIFF'), 0); head.set(Buffer.from('WEBP'), 8);
  new DataView(head.buffer).setUint32(4, 4 + body.length, true);
  return concat([head, body]);
}

export function cleanImage(mime: string, data: Uint8Array): Uint8Array | null {
  try {
    if (mime === 'image/jpeg') return cleanJpeg(data);
    if (mime === 'image/png') return cleanPng(data);
    if (mime === 'image/webp') return cleanWebp(data);
  } catch { /* bozuk girdi */ }
  return null;
}
