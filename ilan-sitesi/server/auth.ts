import { scrypt as scryptCb, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>;
const N = 16384, R = 8, P = 1, KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [n, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const salt = Buffer.from(parts[4], 'base64'), expected = Buffer.from(parts[5], 'base64');
  if (![n, r, p].every(Number.isSafeInteger) || n > 1 << 20) return false;
  const key = await scrypt(password.normalize('NFKC'), salt, expected.length, { N: n, r, p, maxmem: 256 * 1024 * 1024 });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const newToken = (): string => randomBytes(32).toString('base64url');
/** Oturum belirteci veritabanında yalnızca SHA-256 özeti olarak saklanır. */
export const tokenHash = (t: string): string => createHash('sha256').update(t).digest('hex');

/** Bellek içi, pencereli hız sınırlayıcı (tek süreç; yerel geliştirme için yeterli). */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private max: number; private windowMs: number; private now: () => number;
  constructor(max: number, windowMs: number, now: () => number = Date.now) { this.max = max; this.windowMs = windowMs; this.now = now; }
  private prune(key: string): number[] {
    const t = this.now();
    const arr = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (arr.length) this.hits.set(key, arr); else this.hits.delete(key);
    return arr;
  }
  /** Engelli mi? (kayıt eklemez) */
  blocked(key: string): boolean { return this.prune(key).length >= this.max; }
  /** Bir olay kaydeder; sınır aşıldıysa true döner. */
  hit(key: string): boolean { const a = this.prune(key); a.push(this.now()); this.hits.set(key, a); return a.length > this.max; }
  reset(key: string): void { this.hits.delete(key); }
  retryAfterSec(key: string): number { const a = this.prune(key); return a.length ? Math.max(1, Math.ceil((a[0] + this.windowMs - this.now()) / 1000)) : 0; }
}
