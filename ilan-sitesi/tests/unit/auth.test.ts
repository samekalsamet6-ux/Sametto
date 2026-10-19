import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, RateLimiter, tokenHash, newToken } from '../../server/auth.ts';
import { openDb, createUser, createSession, getSessionUser, deleteSession, DuplicateEmailError } from '../../server/db.ts';
import { safeNext } from '../../server/app.ts';

describe('parola', () => {
  it('scrypt ile özetler ve doğrular', async () => {
    const h = await hashPassword('doğru-parola');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(h).not.toContain('doğru');
    expect(await verifyPassword('doğru-parola', h)).toBe(true);
    expect(await verifyPassword('yanlış', h)).toBe(false);
    expect(await hashPassword('doğru-parola')).not.toBe(h); // tuz rastgele
  });
  it('bozuk özet false döner', async () => { expect(await verifyPassword('x', 'bozuk')).toBe(false); });
});

describe('oturum', () => {
  it('oluşturur, çözer, siler; veritabanında yalnızca özet bulunur', async () => {
    const db = openDb(':memory:');
    const uid = createUser(db, 'a@b.com', await hashPassword('parola123'), 'Ali');
    const t = createSession(db, uid);
    expect(getSessionUser(db, t)?.email).toBe('a@b.com');
    const stored = db.prepare('SELECT token_hash FROM sessions').get() as { token_hash: string };
    expect(stored.token_hash).toBe(tokenHash(t)); expect(stored.token_hash).not.toBe(t);
    expect(getSessionUser(db, 'sahte')).toBeUndefined();
    deleteSession(db, t);
    expect(getSessionUser(db, t)).toBeUndefined();
  });
  it('süresi dolan oturum geçersiz', async () => {
    const db = openDb(':memory:');
    const uid = createUser(db, 'a@b.com', 'x', 'Ali');
    const t = createSession(db, uid);
    db.prepare('UPDATE sessions SET expires_at = 1').run();
    expect(getSessionUser(db, t)).toBeUndefined();
  });
  it('aynı e-posta ikinci kez kaydedilemez', () => {
    const db = openDb(':memory:');
    createUser(db, 'a@b.com', 'x', 'Ali');
    expect(() => createUser(db, 'a@b.com', 'y', 'Veli')).toThrow(DuplicateEmailError);
  });
  it('belirteçler benzersiz ve uzun', () => { expect(newToken()).not.toBe(newToken()); expect(newToken().length).toBeGreaterThanOrEqual(40); });
});

describe('hız sınırı', () => {
  it('sınırı aşınca engeller, pencere geçince açar', () => {
    let t = 0;
    const rl = new RateLimiter(3, 1000, () => t);
    expect(rl.hit('k')).toBe(false); expect(rl.hit('k')).toBe(false); expect(rl.hit('k')).toBe(false);
    expect(rl.blocked('k')).toBe(true); expect(rl.hit('k')).toBe(true);
    expect(rl.retryAfterSec('k')).toBeGreaterThan(0);
    t = 1500;
    expect(rl.blocked('k')).toBe(false);
  });
  it('anahtarlar bağımsız, reset çalışır', () => {
    const rl = new RateLimiter(1, 1000, () => 0);
    rl.hit('a'); rl.hit('a');
    expect(rl.blocked('a')).toBe(true); expect(rl.blocked('b')).toBe(false);
    rl.reset('a'); expect(rl.blocked('a')).toBe(false);
  });
});

describe('açık yönlendirme', () => {
  it('yalnızca yerel yollar', () => {
    expect(safeNext('/ilan/3')).toBe('/ilan/3');
    expect(safeNext('//evil.com')).toBe('/'); expect(safeNext('https://evil.com')).toBe('/'); expect(safeNext('/\\evil.com')).toBe('/'); expect(safeNext(undefined)).toBe('/');
  });
});
