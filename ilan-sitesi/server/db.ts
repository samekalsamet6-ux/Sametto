import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { newToken, tokenHash } from './auth.ts';
import { buildSearch, type SearchParams } from './search.ts';
import { validateFish, aquariumCapError, type ListingInput } from './validation.ts';

export type DB = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  whatsapp TEXT, phone TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,       -- yalnızca make-admin betiğiyle (sunucuda yerel komut) ayarlanır
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  species_id TEXT NOT NULL,           -- katalog kimliği ya da 'diger'
  species_other TEXT,                 -- 'diger' için serbest ad
  form_id TEXT, variant_id TEXT,
  sex TEXT NOT NULL,                  -- erkek | disi | bilinmiyor
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price_kurus INTEGER NOT NULL CHECK (price_kurus >= 0),
  city TEXT NOT NULL,
  description TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0,
  flagged INTEGER NOT NULL DEFAULT 0, -- şikayet edildi: inceleme bekliyor
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings(status, species_id, city, price_kurus);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE TABLE IF NOT EXISTS listing_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file TEXT NOT NULL UNIQUE,          -- diskteki rastgele ad (data/uploads/<file>)
  mime TEXT NOT NULL, bytes INTEGER NOT NULL,
  position INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_listing ON listing_photos(listing_id, position);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON reports(listing_id);
-- Satıcı profili akvaryumu: kullanıcı başına en çok 12 balık (sunucuda zorlanır); position = gösterim sırası.
CREATE TABLE IF NOT EXISTS aquarium_fish (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id TEXT NOT NULL, form_id TEXT, variant_id TEXT, sex TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_aquarium_user ON aquarium_fish(user_id);
`;

export function openDb(file: string): DB {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec(SCHEMA);
  // Eski veritabanları için geçiş: is_admin sütunu yoksa ekle.
  const cols = db.prepare('PRAGMA table_info(users)').all() as unknown as { name: string }[];
  if (!cols.some((c) => c.name === 'is_admin')) db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
  // Geçiş: aquarium_fish.position (ilk sürümde yoktu).
  const fcols = db.prepare('PRAGMA table_info(aquarium_fish)').all() as unknown as { name: string }[];
  if (!fcols.some((c) => c.name === 'position')) {
    db.exec('ALTER TABLE aquarium_fish ADD COLUMN position INTEGER NOT NULL DEFAULT 0');
    db.exec('UPDATE aquarium_fish SET position = id');
  }
  return db;
}

const now = () => Date.now();
export const SESSION_TTL_MS = 14 * 24 * 3600 * 1000;

export interface User { id: number; email: string; display_name: string; whatsapp: string | null; phone: string | null; is_demo: number; is_admin: number; created_at: number }
export interface Photo { id: number; listing_id: number; file: string; mime: string; bytes: number; position: number }
export interface Listing {
  id: number; user_id: number; title: string; species_id: string; species_other: string | null; form_id: string | null; variant_id: string | null;
  sex: string; quantity: number; price_kurus: number; city: string; description: string; is_demo: number; flagged: number; status: string; created_at: number;
  seller_name?: string; seller_whatsapp?: string | null; seller_phone?: string | null; first_photo?: string | null;
}

// ---- kullanıcılar ----
export class DuplicateEmailError extends Error {}
export function createUser(db: DB, email: string, passwordHash: string, displayName: string, isDemo = false): number {
  try {
    const r = db.prepare('INSERT INTO users (email, password_hash, display_name, is_demo, created_at) VALUES (?,?,?,?,?)').run(email, passwordHash, displayName, isDemo ? 1 : 0, now());
    return Number(r.lastInsertRowid);
  } catch (e) {
    if (String((e as Error).message).includes('UNIQUE')) throw new DuplicateEmailError('e-posta kayıtlı');
    throw e;
  }
}
export const findUserByEmail = (db: DB, email: string) => db.prepare('SELECT * FROM users WHERE email = ?').get(email) as (User & { password_hash: string }) | undefined;
export const getUser = (db: DB, id: number) => db.prepare('SELECT id,email,display_name,whatsapp,phone,is_demo,is_admin,created_at FROM users WHERE id = ?').get(id) as User | undefined;
/** Yönetici bayrağını ayarlar. Web arayüzünden ÇAĞRILMAZ; yalnızca scripts/make-admin.ts (yerel komut). Kullanıcı yoksa false. */
export function setAdmin(db: DB, email: string, admin = true): boolean {
  return Number(db.prepare('UPDATE users SET is_admin = ? WHERE email = ?').run(admin ? 1 : 0, email).changes) > 0;
}
export function updateContact(db: DB, userId: number, whatsapp: string | null, phone: string | null): void {
  db.prepare('UPDATE users SET whatsapp = ?, phone = ? WHERE id = ?').run(whatsapp, phone, userId);
}

// ---- oturumlar ----
export function createSession(db: DB, userId: number): string {
  const token = newToken();
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(tokenHash(token), userId, now(), now() + SESSION_TTL_MS);
  return token;
}
export function getSessionUser(db: DB, token: string | undefined): User | undefined {
  if (!token || token.length > 100) return undefined;
  const row = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').get(tokenHash(token)) as { user_id: number; expires_at: number } | undefined;
  if (!row) return undefined;
  if (row.expires_at < now()) { deleteSession(db, token); return undefined; }
  return getUser(db, row.user_id);
}
export const deleteSession = (db: DB, token: string) => void db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
export const purgeExpiredSessions = (db: DB) => void db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());

// ---- ilanlar ----
export interface NewPhoto { file: string; mime: string; bytes: number }
export class NoPhotoError extends Error {}
export const MAX_PHOTOS = 5;

/** İlan + fotoğraflar tek işlemde eklenir. En az 1 gerçek fotoğraf olmadan ilan YAYINLANAMAZ (şema düzeyinde de zorunlu). */
export function createListing(db: DB, userId: number, v: ListingInput, photos: NewPhoto[], opts: { demo?: boolean; createdAt?: number } = {}): number {
  if (photos.length < 1) throw new NoPhotoError('En az bir fotoğraf gerekli');
  if (photos.length > MAX_PHOTOS) throw new Error('En fazla 5 fotoğraf');
  db.exec('BEGIN');
  try {
    const r = db.prepare(`INSERT INTO listings (user_id,title,species_id,species_other,form_id,variant_id,sex,quantity,price_kurus,city,description,is_demo,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(userId, v.title, v.speciesId, v.speciesOther, v.formId, v.variantId, v.sex, v.quantity, v.priceKurus, v.city, v.description, opts.demo ? 1 : 0, opts.createdAt ?? now());
    const id = Number(r.lastInsertRowid);
    const ins = db.prepare('INSERT INTO listing_photos (listing_id,file,mime,bytes,position) VALUES (?,?,?,?,?)');
    photos.forEach((p, i) => ins.run(id, p.file, p.mime, p.bytes, i));
    db.exec('COMMIT');
    return id;
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

const LISTING_COLS = `l.*, u.display_name AS seller_name, u.whatsapp AS seller_whatsapp, u.phone AS seller_phone,
  (SELECT file FROM listing_photos p WHERE p.listing_id = l.id ORDER BY position LIMIT 1) AS first_photo`;

export function getListing(db: DB, id: number): Listing | undefined {
  return db.prepare(`SELECT ${LISTING_COLS} FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ? AND l.status = 'active'`).get(id) as Listing | undefined;
}
export const getPhotos = (db: DB, listingId: number) => db.prepare('SELECT * FROM listing_photos WHERE listing_id = ? ORDER BY position').all(listingId) as unknown as Photo[];
export const getPhotoByFile = (db: DB, file: string) => db.prepare(`SELECT p.* FROM listing_photos p JOIN listings l ON l.id = p.listing_id WHERE p.file = ? AND l.status = 'active'`).get(file) as Photo | undefined;

export function searchListings(db: DB, params: SearchParams): { items: Listing[]; total: number; page: number; pages: number } {
  const q = buildSearch(params);
  const total = Number((db.prepare(`SELECT COUNT(*) AS c FROM listings l WHERE ${q.where}`).get(...q.args) as { c: number }).c);
  const items = db.prepare(`SELECT ${LISTING_COLS} FROM listings l JOIN users u ON u.id = l.user_id WHERE ${q.where} ORDER BY ${q.orderBy} LIMIT ? OFFSET ?`).all(...q.args, q.limit, q.offset) as unknown as Listing[];
  return { items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) };
}
export function listingsBySeller(db: DB, userId: number): Listing[] {
  return db.prepare(`SELECT ${LISTING_COLS} FROM listings l JOIN users u ON u.id = l.user_id WHERE l.user_id = ? AND l.status = 'active' ORDER BY l.created_at DESC, l.id DESC`).all(userId) as unknown as Listing[];
}
/** Sahibi tarafından kaldırma: kayıt 'removed' olur, dosyalar çağıran tarafından silinir. Dosya adlarını döndürür. */
export function removeListing(db: DB, id: number, userId: number): string[] | null {
  const l = db.prepare(`SELECT id FROM listings WHERE id = ? AND user_id = ? AND status = 'active'`).get(id, userId);
  if (!l) return null;
  const files = getPhotos(db, id).map((p) => p.file);
  db.prepare(`UPDATE listings SET status = 'removed' WHERE id = ?`).run(id);
  db.prepare('DELETE FROM listing_photos WHERE listing_id = ?').run(id);
  return files;
}

// ---- şikayetler ----
export function addReport(db: DB, listingId: number, reporterId: number | null, reason: string, note: string): number {
  db.exec('BEGIN');
  try {
    const r = db.prepare('INSERT INTO reports (listing_id,reporter_id,reason,note,created_at) VALUES (?,?,?,?,?)').run(listingId, reporterId, reason, note, now());
    db.prepare('UPDATE listings SET flagged = 1 WHERE id = ?').run(listingId);
    db.exec('COMMIT');
    return Number(r.lastInsertRowid);
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export const hasReported = (db: DB, listingId: number, userId: number) => !!db.prepare('SELECT 1 FROM reports WHERE listing_id = ? AND reporter_id = ?').get(listingId, userId);
export interface ReportRow { id: number; listing_id: number; reason: string; note: string; created_at: number; listing_title: string; listing_status: string; reporter_email: string | null }
export function listReports(db: DB): ReportRow[] {
  return db.prepare(`SELECT r.id, r.listing_id, r.reason, r.note, r.created_at, l.title AS listing_title, l.status AS listing_status, u.email AS reporter_email
    FROM reports r JOIN listings l ON l.id = r.listing_id LEFT JOIN users u ON u.id = r.reporter_id ORDER BY r.created_at DESC, r.id DESC LIMIT 500`).all() as unknown as ReportRow[];
}

// ---- akvaryum (satıcı profili) ----
export interface AquariumFish { id: number; user_id: number; species_id: string; form_id: string | null; variant_id: string | null; sex: string; position: number; created_at: number }
export class InvalidFishError extends Error { errors: Record<string, string>; constructor(errors: Record<string, string>) { super('Geçersiz balık'); this.errors = errors; } }
export class AquariumCapError extends Error {}

/** Balığı doğrular (katalog), üst sınırları denetler ve tek işlemde ekler. Geçersizse InvalidFishError, sınır aşılırsa AquariumCapError. */
export function addAquariumFish(db: DB, userId: number, f: { speciesId: string; formId?: string | null; variantId?: string | null; sex: string }): number {
  const v = validateFish({ species: f.speciesId, form: f.formId ?? '', variant: f.variantId ?? '', sex: f.sex });
  if (!v.ok) throw new InvalidFishError(v.errors);
  db.exec('BEGIN IMMEDIATE');
  try {
    const cur = (db.prepare('SELECT species_id, position FROM aquarium_fish WHERE user_id = ?').all(userId) as unknown as { species_id: string; position: number }[]);
    const cap = aquariumCapError(cur.map((r) => r.species_id), v.value!.speciesId);
    if (cap) throw new AquariumCapError(cap);
    const pos = cur.reduce((m, r) => Math.max(m, r.position), 0) + 1;
    const r = db.prepare('INSERT INTO aquarium_fish (user_id,species_id,form_id,variant_id,sex,created_at,position) VALUES (?,?,?,?,?,?,?)')
      .run(userId, v.value!.speciesId, v.value!.formId, v.value!.variantId, v.value!.sex, now(), pos);
    db.exec('COMMIT');
    return Number(r.lastInsertRowid);
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export const listAquariumFish = (db: DB, userId: number) => db.prepare('SELECT * FROM aquarium_fish WHERE user_id = ? ORDER BY position, id').all(userId) as unknown as AquariumFish[];
/** Yalnızca sahibi silebilir; satır yoksa ya da başkasınınsa false. */
export const removeAquariumFish = (db: DB, userId: number, fishId: number): boolean => Number(db.prepare('DELETE FROM aquarium_fish WHERE id = ? AND user_id = ?').run(fishId, userId).changes) > 0;

export const randomFileBase = () => randomUUID().replace(/-/g, '');
