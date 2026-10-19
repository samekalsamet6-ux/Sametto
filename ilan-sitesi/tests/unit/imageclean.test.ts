// Üst veri ayıklama: GPS içeren özel hazırlanmış görsellerde konum baytlarının depolanan dosyada kalmadığını kanıtlar.
import { describe, it, expect } from 'vitest';
import { cleanJpeg, cleanPng, cleanWebp, cleanImage, readExifOrientation } from '../../server/imageclean.ts';

const b64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));
// 8x8 küçük, geçerli görseller (Pillow ile üretildi)
const JPG = b64('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAgDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDPryj6I//Z');
const PNG = b64('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8YSPCgA0wYRUdtBIA4EwBKCQ+tnkAAAAASUVORK5CYII=');
const WEBP_L = b64('UklGRh4AAABXRUJQVlA4TBEAAAAvB8ABAAdQniKXov+BiOh/AAA=');

const GPS_MARK = 'GPSLATITUDE-SECRET-41.0082N-28.9784E';
const enc = (s: string) => new TextEncoder().encode(s);
const cat = (...p: Uint8Array[]) => { const o = new Uint8Array(p.reduce((s, x) => s + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
const has = (b: Uint8Array, s: string) => Buffer.from(b).includes(Buffer.from(s));
const seg = (marker: number, payload: Uint8Array) => cat(new Uint8Array([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 255]), payload);

/** Orientation (varsa) ve GPS işaretçisi içeren EXIF APP1 */
function exif(orientation: number | null): Uint8Array {
  const gps = enc(GPS_MARK);
  const n = orientation ? 2 : 1;
  // big-endian TIFF: IFD0 = [Orientation?, GPSInfo ofseti]; GPS verisi sonda
  const entries: number[] = [];
  const gpsOff = 8 + 2 + n * 12 + 4;
  if (orientation) entries.push(0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0);
  entries.push(0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, gpsOff);
  return seg(0xe1, cat(enc('Exif\0\0'), new Uint8Array([0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, n, ...entries, 0, 0, 0, 0]), gps));
}
const insertAfterApp0 = (j: Uint8Array, ...segs: Uint8Array[]) => { const len = (j[4] << 8) | j[5]; return cat(j.subarray(0, 4 + len), ...segs, j.subarray(4 + len)); };
const markers = (j: Uint8Array) => { const out: number[] = []; let i = 2; while (i < j.length) { const m = j[i + 1]; out.push(m); if (m === 0xd9) break; if (m === 0xda) { i += 2 + ((j[i + 2] << 8) | j[i + 3]); while (!(j[i] === 0xff && j[i + 1] !== 0 && !(j[i + 1] >= 0xd0 && j[i + 1] <= 0xd7))) i++; continue; } i += 2 + ((j[i + 2] << 8) | j[i + 3]); } return out; };

describe('JPEG', () => {
  const dirty = insertAfterApp0(JPG, exif(null), seg(0xe1, enc('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>' + GPS_MARK)), seg(0xed, enc('Photoshop 3.0\0' + GPS_MARK)), seg(0xfe, enc('yorum ' + GPS_MARK)), seg(0xe2, cat(enc('ICC_PROFILE\0'), new Uint8Array([1, 1, 9, 9]))));
  it('GPS/EXIF, XMP, IPTC ve yorum gider; ICC ve görüntü verisi kalır', () => {
    expect(has(dirty, GPS_MARK)).toBe(true);
    const clean = cleanJpeg(dirty)!;
    expect(clean).not.toBeNull();
    expect(has(clean, GPS_MARK)).toBe(false); expect(has(clean, 'Exif')).toBe(false); expect(has(clean, 'xmpmeta')).toBe(false); expect(has(clean, 'Photoshop')).toBe(false);
    expect(has(clean, 'ICC_PROFILE')).toBe(true);
    const m = markers(clean);
    expect(m).not.toContain(0xe1); expect(m).not.toContain(0xed); expect(m).not.toContain(0xfe);
    expect(m).toEqual(markers(JPG).flatMap((x) => (x === 0xe0 ? [0xe0, 0xe2] : [x])));
    // görüntü verisi (SOS'tan EOI'ye) aynen korunur
    const tail = (j: Uint8Array) => Buffer.from(j.subarray(j.length - 40)).toString('hex');
    expect(tail(clean)).toBe(tail(JPG));
  });
  it('yönelim != 1 ise yalnızca yönelim etiketini içeren en küçük EXIF bırakılır (GPS yok)', () => {
    const clean = cleanJpeg(insertAfterApp0(JPG, exif(6)))!;
    expect(has(clean, GPS_MARK)).toBe(false);
    const i = Buffer.from(clean).indexOf(Buffer.from('Exif\0\0'));
    expect(i).toBeGreaterThan(0);
    const app1 = clean.subarray(i - 4, i - 4 + 2 + ((clean[i - 2] << 8) | clean[i - 1]));
    expect(app1.length).toBeLessThan(40);
    expect(readExifOrientation(app1.subarray(4))).toBe(6);
    expect(markers(clean).filter((x) => x === 0xe1)).toHaveLength(1);
  });
  it('yönelim 1 ise EXIF tamamen kalkar; bozuk/kısa dosya reddedilir', () => {
    expect(markers(cleanJpeg(insertAfterApp0(JPG, exif(1)))!)).not.toContain(0xe1);
    expect(cleanJpeg(JPG.subarray(0, 100))).toBeNull();
    expect(cleanJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]))).toBeNull();
  });
  it('EOI sonrası eklenmiş artık veri atılır', () => {
    const clean = cleanJpeg(cat(JPG, enc('ARTIK ' + GPS_MARK)))!;
    expect(has(clean, GPS_MARK)).toBe(false); expect(clean.length).toBe(JPG.length);
  });
});

const crc = () => new Uint8Array(4);
const pngChunk = (type: string, data: Uint8Array) => cat(new Uint8Array([data.length >>> 24, (data.length >> 16) & 255, (data.length >> 8) & 255, data.length & 255]), enc(type), data, crc());
const pngTypes = (b: Uint8Array) => { const t: string[] = []; let i = 8; while (i < b.length) { const n = (b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0; t.push(String.fromCharCode(...b.subarray(i + 4, i + 8))); i += 12 + n; } return t; };
describe('PNG', () => {
  it('tEXt/zTXt/iTXt/eXIf/tIME gider; kritik ve görüntü parçaları kalır', () => {
    const idat = pngTypes(PNG).indexOf('IDAT'); // IHDR, (…), IDAT, IEND
    let off = 8; for (let k = 0; k < idat; k++) off += 12 + ((PNG[off] << 24 | PNG[off + 1] << 16 | PNG[off + 2] << 8 | PNG[off + 3]) >>> 0);
    const dirty = cat(PNG.subarray(0, off), pngChunk('tEXt', enc('Comment\0' + GPS_MARK)), pngChunk('zTXt', enc('x\0\0' + GPS_MARK)), pngChunk('iTXt', enc('XML:com.adobe.xmp\0\0\0\0\0' + GPS_MARK)), pngChunk('eXIf', enc('MM\0*' + GPS_MARK)), pngChunk('tIME', new Uint8Array(7)), pngChunk('gAMA', new Uint8Array(4)), PNG.subarray(off));
    expect(has(dirty, GPS_MARK)).toBe(true);
    const clean = cleanPng(dirty)!;
    expect(has(clean, GPS_MARK)).toBe(false);
    const t = pngTypes(clean);
    for (const bad of ['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']) expect(t).not.toContain(bad);
    expect(t).toContain('IHDR'); expect(t).toContain('IDAT'); expect(t).toContain('gAMA'); expect(t.at(-1)).toBe('IEND');
    expect(cleanPng(PNG.subarray(0, 40))).toBeNull();
  });
  it('eXIf içinde yönelim != 1 ise yalnızca yönelimli en küçük eXIf kalır (GPS yok)', () => {
    const tiff = exif(8).subarray(10); // "Exif\0\0" sonrası TIFF (GPS işaretçisi dahil)
    const idat = pngTypes(PNG).indexOf('IDAT'); let off = 8; for (let k = 0; k < idat; k++) off += 12 + ((PNG[off] << 24 | PNG[off + 1] << 16 | PNG[off + 2] << 8 | PNG[off + 3]) >>> 0);
    const clean = cleanPng(cat(PNG.subarray(0, off), pngChunk('eXIf', tiff), PNG.subarray(off)))!;
    expect(has(clean, GPS_MARK)).toBe(false);
    const t = pngTypes(clean); expect(t.filter((x) => x === 'eXIf')).toHaveLength(1); expect(t.indexOf('eXIf')).toBeLessThan(t.indexOf('IDAT'));
  });
});

const le32 = (n: number) => new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]);
const riffChunk = (t: string, d: Uint8Array) => cat(enc(t), le32(d.length), d, d.length & 1 ? new Uint8Array(1) : new Uint8Array());
const riff = (...chunks: Uint8Array[]) => { const body = cat(enc('WEBP'), ...chunks); return cat(enc('RIFF'), le32(body.length), body); };
describe('WebP', () => {
  it('EXIF ve XMP parçaları gider, VP8X bayrakları temizlenir, RIFF boyutu doğru olur', () => {
    const vp8l = WEBP_L.subarray(12); // "VP8L" parçası
    const vp8x = riffChunk('VP8X', new Uint8Array([0x08 | 0x04 | 0x20, 0, 0, 0, 7, 0, 0, 7, 0, 0]));
    const dirty = riff(vp8x, riffChunk('ICCP', new Uint8Array([1, 2, 3])), vp8l, riffChunk('EXIF', enc('Exif\0\0MM\0*' + GPS_MARK + 'x')), riffChunk('XMP ', enc('<x:xmpmeta>' + GPS_MARK + '</x:xmpmeta>')));
    expect(has(dirty, GPS_MARK)).toBe(true);
    const clean = cleanWebp(dirty)!;
    expect(has(clean, GPS_MARK)).toBe(false); expect(has(clean, 'EXIF')).toBe(false); expect(has(clean, 'XMP ')).toBe(false);
    expect(clean[20]).toBe(0x20); // yalnızca ICC bayrağı kaldı
    expect(new DataView(clean.buffer, clean.byteOffset).getUint32(4, true)).toBe(clean.length - 8);
    expect(has(clean, 'ICCP')).toBe(true); expect(has(clean, 'VP8L')).toBe(true);
    expect(cleanWebp(WEBP_L)).not.toBeNull();
    expect(cleanWebp(WEBP_L.subarray(0, 25))).toBeNull();
  });
  it('cleanImage yönlendirir ve bilinmeyen türü reddeder', () => {
    expect(cleanImage('image/png', PNG)).not.toBeNull(); expect(cleanImage('image/gif', PNG)).toBeNull();
  });
});
