import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 5 * MAX_PHOTO_BYTES + 512 * 1024;
export const EXT_BY_MIME: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MIME_BY_EXT: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Dosya içeriğine (sihirli baytlar) bakarak tür belirler; istemcinin bildirdiği türe güvenilmez. */
export function sniffImage(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export interface PhotoCheck { ok: boolean; error?: string; mime?: string }
export function checkPhoto(name: string, data: Uint8Array): PhotoCheck {
  if (data.length === 0) return { ok: false, error: `${name}: dosya boş.` };
  if (data.length > MAX_PHOTO_BYTES) return { ok: false, error: `${name}: dosya 5 MB'tan büyük.` };
  const mime = sniffImage(data);
  if (!mime) return { ok: false, error: `${name}: yalnızca JPEG, PNG ya da WebP fotoğraf yükleyebilirsiniz.` };
  return { ok: true, mime };
}

export const SAFE_FILE_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
export const isSafeFileName = (f: string): boolean => SAFE_FILE_RE.test(f);

export function savePhoto(dir: string, data: Uint8Array, mime: string): string {
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new Error('desteklenmeyen tür');
  mkdirSync(dir, { recursive: true });
  const file = `${randomBytes(16).toString('hex')}.${ext}`;
  writeFileSync(path.join(dir, file), data, { flag: 'wx', mode: 0o640 });
  return file;
}
export function deletePhotoFiles(dir: string, files: string[]): void {
  for (const f of files) {
    if (!isSafeFileName(f)) continue;
    const p = path.join(dir, f);
    try { if (existsSync(p)) unlinkSync(p); } catch { /* yoksay */ }
  }
}
