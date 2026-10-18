import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Çok basit .env okuyucu (bağımlılık yok). Var olan ortam değişkenlerini ezmez. */
export function loadDotEnv(file = path.join(ROOT, '.env')): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export interface Config {
  port: number; host: string; adminEmail: string; cookieSecure: boolean; dataDir: string; uploadDir: string; dbPath: string; production: boolean;
  /** Test için hız sınırlarını gevşetmek */
  loginMaxFails: number;
}

export function readConfig(env = process.env): Config {
  const dataDir = path.resolve(ROOT, env.DATA_DIR || './data');
  return {
    port: Number(env.PORT || 5180), host: env.HOST || '127.0.0.1',
    adminEmail: (env.ADMIN_EMAIL || '').trim().toLowerCase(),
    cookieSecure: env.COOKIE_SECURE === 'true', dataDir,
    uploadDir: path.join(dataDir, 'uploads'), dbPath: path.join(dataDir, 'app.db'),
    production: env.NODE_ENV === 'production', loginMaxFails: Number(env.LOGIN_MAX_FAILS || 5),
  };
}
