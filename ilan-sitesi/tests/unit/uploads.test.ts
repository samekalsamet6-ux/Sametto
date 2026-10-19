import { describe, it, expect } from 'vitest';
import { mkdtempSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sniffImage, checkPhoto, isSafeFileName, savePhoto, deletePhotoFiles, MAX_PHOTO_BYTES } from '../../server/uploads.ts';
import { placeholderPng } from '../../server/placeholder.ts';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
describe('fotoğraf doğrulama', () => {
  it('sihirli baytlarla tür belirler', () => {
    expect(sniffImage(JPEG)).toBe('image/jpeg');
    expect(sniffImage(placeholderPng(1))).toBe('image/png');
    const webp = new Uint8Array([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]);
    expect(sniffImage(webp)).toBe('image/webp');
  });
  it('görsel olmayan içeriği reddeder (uzantı/MIME adı önemsiz)', () => {
    expect(checkPhoto('x.jpg', new TextEncoder().encode('<svg onload=alert(1)>')).ok).toBe(false);
    expect(checkPhoto('x.jpg', new TextEncoder().encode('GIF89a....')).ok).toBe(false);
    expect(checkPhoto('x.jpg', new Uint8Array()).ok).toBe(false);
  });
  it('5 MB üstünü reddeder', () => {
    const big = new Uint8Array(MAX_PHOTO_BYTES + 1); big.set(JPEG);
    expect(checkPhoto('b.jpg', big).ok).toBe(false);
    const ok = new Uint8Array(1000); ok.set(JPEG); expect(checkPhoto('b.jpg', ok)).toMatchObject({ ok: true, mime: 'image/jpeg' });
  });
  it('dosya adı yolu: yol gezintisi mümkün değil', () => {
    expect(isSafeFileName('0123456789abcdef0123456789abcdef.png')).toBe(true);
    for (const bad of ['../etc/passwd', '..%2f', 'a.png', '0123456789abcdef0123456789abcdef.svg', '0123456789abcdef0123456789abcdef.png/..']) expect(isSafeFileName(bad)).toBe(false);
  });
  it('rastgele adla kaydeder, güvenli olanları siler, güvensizi atlar', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'up-'));
    const f = savePhoto(dir, JPEG, 'image/jpeg');
    expect(isSafeFileName(f)).toBe(true); expect(existsSync(path.join(dir, f))).toBe(true);
    deletePhotoFiles(dir, [f, '../x']);
    expect(readdirSync(dir)).toEqual([]);
    expect(() => savePhoto(dir, JPEG, 'image/svg+xml')).toThrow();
  });
});
