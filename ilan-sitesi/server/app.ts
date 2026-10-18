import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import type { Config } from './config.ts';
import * as repo from './db.ts';
import { hashPassword, verifyPassword, RateLimiter } from './auth.ts';
import { validateRegister, validateListing, validateReport, normalizeEmail, type Errors } from './validation.ts';
import { checkPhoto, savePhoto, deletePhotoFiles, isSafeFileName, MIME_BY_EXT, MAX_REQUEST_BYTES } from './uploads.ts';
import type { SearchParams } from './search.ts';
import type { Assets, PageCtx } from './views/layout.ts';
import * as V from './views/pages.ts';
import { speciesById } from '../shared/catalog.ts';

class HttpError extends Error { status: number; constructor(status: number, msg: string) { super(msg); this.status = status; } }

export interface App { handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>; limiters: Record<string, RateLimiter> }

const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

function parseCookies(h: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (h ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* yoksay */ } }
  }
  return out;
}
export const safeNext = (n: unknown): string => (typeof n === 'string' && /^\/(?![/\\])[\w\-./?=&%]*$/.test(n) ? n : '/');

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const len = Number(req.headers['content-length'] ?? 0);
  if (len > limit) throw new HttpError(413, 'İstek çok büyük.');
  const chunks: Buffer[] = []; let n = 0;
  for await (const c of req) { n += (c as Buffer).length; if (n > limit) throw new HttpError(413, 'İstek çok büyük.'); chunks.push(c as Buffer); }
  return Buffer.concat(chunks);
}

interface Parsed { fields: Record<string, string>; files: File[] }
async function parseBody(req: IncomingMessage, kind: 'form' | 'upload'): Promise<Parsed> {
  const ct = String(req.headers['content-type'] ?? '');
  const buf = await readBody(req, kind === 'upload' ? MAX_REQUEST_BYTES : 32 * 1024);
  const fields: Record<string, string> = {}; const files: File[] = [];
  if (ct.startsWith('application/x-www-form-urlencoded')) {
    for (const [k, v] of new URLSearchParams(buf.toString('utf8'))) fields[k] = v;
  } else if (kind === 'upload' && ct.startsWith('multipart/form-data')) {
    let fd: FormData;
    try { fd = await new Response(buf, { headers: { 'content-type': ct } }).formData(); } catch { throw new HttpError(400, 'Form verisi okunamadı.'); }
    for (const [k, v] of fd.entries()) { if (typeof v === 'string') fields[k] = v; else if (k === 'photos') files.push(v); }
  } else if (buf.length) throw new HttpError(415, 'Desteklenmeyen içerik türü.');
  return { fields, files };
}

export function createApp(cfg: Config, db: repo.DB, assets: Assets, staticRoot?: string): App {
  const limiters = {
    login: new RateLimiter(cfg.loginMaxFails, 10 * 60_000), // e-posta başına
    loginIp: new RateLimiter(cfg.loginMaxFails * 6, 10 * 60_000), // IP başına (daha gevşek)
    register: new RateLimiter(cfg.registerMax, 60 * 60_000),
    listing: new RateLimiter(20, 60 * 60_000),
    report: new RateLimiter(20, 60 * 60_000),
  };
  const sameOrigin = (req: IncomingMessage): boolean => {
    const o = req.headers.origin;
    if (!o) return true; // tarayıcı dışı istemciler; asıl koruma CSRF belirteci
    try { return new URL(o).host === req.headers.host; } catch { return false; }
  };

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const cookies = parseCookies(req.headers.cookie);
    const setCookies: string[] = [];
    const secure = cfg.cookieSecure ? '; Secure' : '';
    const ip = req.socket.remoteAddress ?? 'x';

    let csrf = cookies.csrf;
    if (!csrf || !/^[\w-]{20,64}$/.test(csrf)) { csrf = randomBytes(24).toString('base64url'); setCookies.push(`csrf=${csrf}; Path=/; HttpOnly; SameSite=Lax${secure}`); }
    const sidToken = cookies.sid;
    const user = repo.getSessionUser(db, sidToken);
    const isAdmin = !!user && !!cfg.adminEmail && user.email === cfg.adminEmail;
    const ctx: PageCtx = { user, csrf, assets, isAdmin };

    const send = (status: number, body: string | Buffer, type = 'text/html; charset=utf-8', extra: Record<string, string> = {}) => {
      const headers: Record<string, string | string[]> = {
        'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', ...extra,
      };
      if (cfg.production && type.startsWith('text/html')) headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
      if (type.startsWith('text/html')) headers['Cache-Control'] = 'no-store';
      if (setCookies.length) headers['Set-Cookie'] = setCookies;
      res.writeHead(status, headers);
      res.end(method === 'HEAD' ? undefined : body);
    };
    const redirect = (to: string, status = 303) => { res.writeHead(status, { Location: to, ...(setCookies.length ? { 'Set-Cookie': setCookies } : {}) }); res.end(); };
    const page = (html: string, status = 200) => send(status, html);
    const notFound = () => page(V.messagePage(ctx, 'Sayfa bulunamadı', 'Aradığınız sayfa yok ya da kaldırılmış olabilir.'), 404);
    const checkCsrf = (fields: Record<string, string>) => {
      const a = Buffer.from(fields._csrf ?? ''), b = Buffer.from(csrf!);
      if (!sameOrigin(req) || a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(403, 'Güvenlik doğrulaması başarısız oldu. Sayfayı yenileyip tekrar deneyin.');
    };
    const setSession = (token: string | null) => {
      if (token) setCookies.push(`sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(repo.SESSION_TTL_MS / 1000)}${secure}`);
      else setCookies.push(`sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
    };

    try {
      if (method !== 'GET' && method !== 'HEAD' && method !== 'POST') throw new HttpError(405, 'Yöntem desteklenmiyor.');
      if (method === 'POST' && !sameOrigin(req)) throw new HttpError(403, 'Farklı kaynaktan gelen istek reddedildi.');

      // ---- statik: yüklenen fotoğraflar ----
      const up = /^\/yuklemeler\/([^/]+)$/.exec(p);
      if (up && method !== 'POST') {
        const file = up[1];
        if (!isSafeFileName(file) || !repo.getPhotoByFile(db, file)) return notFound();
        const full = path.join(cfg.uploadDir, file);
        if (!existsSync(full)) return notFound();
        return send(200, readFileSync(full), MIME_BY_EXT[file.split('.').pop()!], { 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Content-Disposition': 'inline' });
      }
      // ---- statik: derlenmiş istemci (üretim) ----
      if (staticRoot && method === 'GET' && (p.startsWith('/assets/') || p === '/favicon.svg')) {
        const full = path.resolve(staticRoot, '.' + p);
        if (full.startsWith(staticRoot + path.sep) && existsSync(full) && statSync(full).isFile()) {
          const ext = path.extname(full);
          const type = ({ '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' } as Record<string, string>)[ext] ?? 'application/octet-stream';
          return send(200, readFileSync(full), type, { 'Cache-Control': p.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600' });
        }
        return notFound();
      }

      // ---- sayfalar ----
      if (p === '/' && method === 'GET') return page(V.homePage(ctx, repo.searchListings(db, { page: 1 }).items.slice(0, 8)));

      if (p === '/ilanlar' && method === 'GET') {
        const q = url.searchParams;
        const params: SearchParams = { species: q.get('tur') ?? undefined, form: q.get('sekil') ?? undefined, variant: q.get('renk') ?? undefined, city: q.get('sehir') ?? undefined, minPrice: q.get('min') ?? undefined, maxPrice: q.get('max') ?? undefined, sort: q.get('sirala') ?? undefined, page: q.get('sayfa') ?? 1 };
        return page(V.listingsPage(ctx, { params, result: repo.searchListings(db, params) }));
      }

      if (p === '/ilan/yeni') {
        if (!user) return redirect('/giris?next=/ilan/yeni');
        if (method === 'GET') return page(V.listingFormPage(ctx, { values: {}, errors: {} }));
        // POST: ilan + fotoğraflar
        if (limiters.listing.hit('u' + user.id)) throw new HttpError(429, 'Çok fazla ilan denemesi. Bir süre sonra tekrar deneyin.');
        const { fields, files } = await parseBody(req, 'upload');
        checkCsrf(fields);
        const v = validateListing(fields);
        const errors: Errors = { ...v.errors };
        const real = files.filter((f) => f.size > 0);
        const checked: { data: Uint8Array; mime: string }[] = [];
        if (real.length === 0) errors.photos = 'İlan yayınlamak için en az bir gerçek fotoğraf yüklemelisiniz.';
        else if (real.length > repo.MAX_PHOTOS) errors.photos = `En fazla ${repo.MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`;
        else {
          for (const f of real) {
            const data = new Uint8Array(await f.arrayBuffer());
            const c = checkPhoto(f.name.replace(/[^\w.\- ]/g, '').slice(0, 40) || 'dosya', data);
            if (!c.ok) { errors.photos = c.error!; break; }
            checked.push({ data, mime: c.mime! });
          }
        }
        if (Object.keys(errors).length) {
          return page(V.listingFormPage(ctx, { values: { species: fields.species, speciesOther: fields.speciesOther, form: fields.form, variant: fields.variant, sex: fields.sex, quantity: fields.quantity, price: fields.price, city: fields.city, title: fields.title, description: fields.description, whatsapp: fields.whatsapp, phone: fields.phone }, errors }), 422);
        }
        const saved: string[] = [];
        try {
          const photos = checked.map((c) => { const file = savePhoto(cfg.uploadDir, c.data, c.mime); saved.push(file); return { file, mime: c.mime, bytes: c.data.length }; });
          const id = repo.createListing(db, user.id, v.value!, photos);
          repo.updateContact(db, user.id, v.value!.whatsapp, v.value!.phone);
          return redirect(`/ilan/${id}?yeni=1`);
        } catch (e) { deletePhotoFiles(cfg.uploadDir, saved); throw e; }
      }

      const detail = /^\/ilan\/(\d{1,9})$/.exec(p);
      if (detail && method === 'GET') {
        const l = repo.getListing(db, Number(detail[1]));
        if (!l) return notFound();
        const flash = url.searchParams.get('yeni') === '1' && user?.id === l.user_id ? { kind: 'ok' as const, text: 'İlanınız yayınlandı.' } : undefined;
        return page(V.detailPage({ ...ctx, flash }, { l, photos: repo.getPhotos(db, l.id), alreadyReported: !!user && repo.hasReported(db, l.id, user.id), reported: url.searchParams.get('sikayet') === 'ok' }));
      }
      const rep = /^\/ilan\/(\d{1,9})\/sikayet$/.exec(p);
      if (rep && method === 'POST') {
        const l = repo.getListing(db, Number(rep[1]));
        if (!l) return notFound();
        if (!user) return redirect(`/giris?next=/ilan/${l.id}`);
        if (limiters.report.hit('u' + user.id)) throw new HttpError(429, 'Çok fazla şikayet gönderdiniz. Daha sonra deneyin.');
        const { fields } = await parseBody(req, 'form');
        checkCsrf(fields);
        const v = validateReport(fields);
        if (!v.ok) return page(V.detailPage(ctx, { l, photos: repo.getPhotos(db, l.id), alreadyReported: false, reportErrors: v.errors }), 422);
        if (!repo.hasReported(db, l.id, user.id)) repo.addReport(db, l.id, user.id, v.value!.reason, v.value!.note);
        return redirect(`/ilan/${l.id}?sikayet=ok`);
      }
      const del = /^\/ilan\/(\d{1,9})\/kaldir$/.exec(p);
      if (del && method === 'POST') {
        if (!user) return redirect('/giris');
        const { fields } = await parseBody(req, 'form');
        checkCsrf(fields);
        const files = repo.removeListing(db, Number(del[1]), user.id);
        if (!files) return notFound();
        deletePhotoFiles(cfg.uploadDir, files);
        return redirect(`/satici/${user.id}`);
      }

      const seller = /^\/satici\/(\d{1,9})$/.exec(p);
      if (seller && method === 'GET') {
        const s = repo.getUser(db, Number(seller[1]));
        if (!s) return notFound();
        return page(V.sellerPage(ctx, { seller: s, items: repo.listingsBySeller(db, s.id) }));
      }

      // ---- hesap ----
      if (p === '/kayit') {
        if (user) return redirect('/');
        if (method === 'GET') return page(V.registerPage(ctx, { values: {}, errors: {} }));
        if (limiters.register.hit(ip)) throw new HttpError(429, 'Çok fazla kayıt denemesi. Daha sonra tekrar deneyin.');
        const { fields } = await parseBody(req, 'form');
        checkCsrf(fields);
        const v = validateRegister(fields);
        if (!v.ok) return page(V.registerPage(ctx, { values: { email: v.value!.email, displayName: v.value!.displayName }, errors: v.errors }), 422);
        try {
          const id = repo.createUser(db, v.value!.email, await hashPassword(v.value!.password), v.value!.displayName);
          setSession(repo.createSession(db, id));
          return redirect('/');
        } catch (e) {
          if (e instanceof repo.DuplicateEmailError) return page(V.registerPage(ctx, { values: { email: v.value!.email, displayName: v.value!.displayName }, errors: { email: 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.' } }), 409);
          throw e;
        }
      }
      if (p === '/giris') {
        if (method === 'GET') return user ? redirect('/') : page(V.loginPage(ctx, { next: safeNext(url.searchParams.get('next')) }));
        const { fields } = await parseBody(req, 'form');
        checkCsrf(fields);
        const email = normalizeEmail(fields.email);
        const kIp = 'ip:' + ip, kEm = 'em:' + email;
        if (limiters.loginIp.blocked(kIp) || limiters.login.blocked(kEm)) {
          const wait = Math.max(limiters.loginIp.retryAfterSec(kIp), limiters.login.retryAfterSec(kEm));
          res.setHeader('Retry-After', String(wait));
          return page(V.loginPage(ctx, { email, next: safeNext(fields.next), error: `Çok fazla başarısız deneme. Yaklaşık ${Math.ceil(wait / 60)} dakika sonra tekrar deneyin.` }), 429);
        }
        const row = repo.findUserByEmail(db, email);
        const ok = await verifyPassword(typeof fields.password === 'string' ? fields.password.slice(0, 200) : '', row?.password_hash ?? DUMMY_HASH);
        if (!row || !ok) {
          limiters.loginIp.hit(kIp); limiters.login.hit(kEm);
          return page(V.loginPage(ctx, { email, next: safeNext(fields.next), error: 'E-posta ya da parola hatalı.' }), 401);
        }
        limiters.login.reset(kEm);
        if (sidToken) repo.deleteSession(db, sidToken); // oturum sabitlemeye karşı yeni belirteç
        setSession(repo.createSession(db, row.id));
        return redirect(safeNext(fields.next));
      }
      if (p === '/cikis' && method === 'POST') {
        const { fields } = await parseBody(req, 'form');
        checkCsrf(fields);
        if (sidToken) repo.deleteSession(db, sidToken);
        setSession(null);
        return redirect('/');
      }

      if (p === '/admin/raporlar' && method === 'GET') {
        if (!isAdmin) return notFound();
        return page(V.adminReportsPage(ctx, repo.listReports(db)));
      }
      return notFound();
    } catch (e) {
      if (e instanceof HttpError) {
        if (!res.headersSent) { if (e.status === 429) res.setHeader('Retry-After', '600'); send(e.status, V.messagePage(ctx, e.status === 413 ? 'Dosya çok büyük' : e.status === 403 ? 'İstek reddedildi' : 'Hata', e.message)); }
        return;
      }
      console.error('İstek hatası:', e);
      if (!res.headersSent) send(500, V.messagePage(ctx, 'Bir şeyler ters gitti', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'));
    }
  }
  void speciesById;
  return { handler: handle, limiters };
}
