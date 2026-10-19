// Su Pazarı — TEK DOSYALIK ETKİLEŞİMLİ DEMO. Sunucu yok: gerçek sunucu şablonları (server/views/*), gerçek doğrulama
// (server/validation.ts) ve gerçek istemci modülleri (client/*, Vite eklentisiyle init() işlevine sarılmış) tarayıcıda çalışır.
import css from '../client/styles.css?inline';
import * as V from '../server/views/pages.ts';
import type { PageCtx } from '../server/views/layout.ts';
import { validateRegister, validateListing, validateReport, validateFish, normalizeEmail, type Errors } from '../server/validation.ts';
import type { SearchParams } from '../server/search.ts';
import * as S from './store.ts';
import { disposeAllViewers } from './viewer-tracked.ts';
import initIlanlar from '../client/ilanlar.ts';
import initDetay from '../client/ilan-detay.ts';
import initForm from '../client/ilan-form.ts';
import initSatici from '../client/satici.ts';
import initDuzenle from '../client/akvaryum-duzenle.ts';

const BANNER = 'DEMO: veriler yalnızca bu tarayıcıda, sunucu yok; gerçek site yerelde çalışır.';

// ---- stil (+ sandbox/artifact ana sayfasının data-theme anahtarı için açık/koyu kopyaları) ----
{
  const dark = /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const light = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const extra = `
:root[data-theme="dark"]{${dark}} :root[data-theme="light"]{${light}}
:root[data-theme="dark"]{color-scheme:dark} :root[data-theme="light"]{color-scheme:light}
.demo-banner{background:var(--accent-soft);color:var(--ink);border-bottom:2px solid var(--accent);padding:8px 14px;font-size:.86rem;font-weight:600;text-align:center;display:flex;gap:6px 12px;flex-wrap:wrap;align-items:center;justify-content:center}
.demo-banner button{font:inherit;font-size:.8rem;padding:4px 12px;min-height:30px;border-radius:999px;border:1.5px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-weight:700}
.demo-hint{background:var(--surface-2);border:1px dashed var(--accent);border-radius:12px;padding:12px 14px;margin:16px 0}
.demo-hint p{margin:.2em 0}
`;
  const st = document.createElement('style'); st.id = 'demo-css'; st.textContent = css + extra; document.head.appendChild(st);
  try { const m = document.createElement('meta'); m.name = 'color-scheme'; m.content = 'light dark'; document.head.appendChild(m); } catch { /* yoksay */ }
}

// ---- sunucu yerine geçen "istek işleyici" (server/app.ts akışının aynası) ----
type Res = { html: string } | { redirect: string };
const assets = { head: () => '', scripts: () => '' };
const safeNext = (n: unknown): string => (typeof n === 'string' && /^\/(?![/\\])[\w\-./?=&%]*$/.test(n) ? n : '/');
const ctxOf = (flash?: PageCtx['flash']): PageCtx => ({ user: S.currentUser(), csrf: 'demo', assets, isAdmin: false, flash });
const msg = (title: string, text: string): Res => ({ html: V.messagePage(ctxOf(), title, text) });

function magicOk(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

async function handle(method: 'GET' | 'POST', path: string, q: URLSearchParams, fields: Record<string, string>, files: File[]): Promise<Res> {
  const p = path.replace(/\/+$/, '') || '/';
  const user = S.currentUser();
  const nf = (): Res => ({ html: V.messagePage(ctxOf(), 'Sayfa bulunamadı', 'Aradığınız sayfa yok ya da kaldırılmış olabilir.') });

  if (p === '/' && method === 'GET') return { html: V.homePage(ctxOf(), S.searchListings({ page: 1 }).items.slice(0, 8)) };

  if (p === '/ilanlar' && method === 'GET') {
    const params: SearchParams = { species: q.get('tur') ?? undefined, form: q.get('sekil') ?? undefined, variant: q.get('renk') ?? undefined, city: q.get('sehir') ?? undefined, district: q.get('ilce') ?? undefined, minPrice: q.get('min') ?? undefined, maxPrice: q.get('max') ?? undefined, sort: q.get('sirala') ?? undefined, page: q.get('sayfa') ?? 1 };
    return { html: V.listingsPage(ctxOf(), { params, result: S.searchListings(params) }) };
  }

  if (p === '/ilan/yeni') {
    if (!user) return { redirect: '/giris?next=/ilan/yeni' };
    if (method === 'GET') return { html: V.listingFormPage(ctxOf(), { values: {}, errors: {} }) };
    const v = validateListing(fields);
    const errors: Errors = { ...v.errors };
    const real = files.filter((f) => f.size > 0);
    const okFiles: File[] = [];
    if (real.length === 0) errors.photos = 'İlan yayınlamak için en az bir gerçek fotoğraf yüklemelisiniz.';
    else if (real.length > 5) errors.photos = 'En fazla 5 fotoğraf yükleyebilirsiniz.';
    else for (const f of real) {
      if (f.size > 5 * 1024 * 1024) { errors.photos = `${f.name}: 5 MB'tan büyük.`; break; }
      const head = new Uint8Array(await f.slice(0, 16).arrayBuffer());
      const mime = magicOk(head);
      if (!mime) { errors.photos = `${f.name.slice(0, 40)}: yalnızca JPEG, PNG ya da WebP fotoğraf yüklenebilir.`; break; }
      okFiles.push(f.type === mime ? f : new File([f], f.name, { type: mime }));
    }
    if (Object.keys(errors).length) {
      return { html: V.listingFormPage(ctxOf(), { values: { species: fields.species, speciesOther: fields.speciesOther, form: fields.form, variant: fields.variant, sex: fields.sex, quantity: fields.quantity, price: fields.price, city: fields.city, district: fields.district, title: fields.title, description: fields.description, whatsapp: fields.whatsapp, phone: fields.phone }, errors }) };
    }
    const id = S.createListing(user.id, v.value!, okFiles);
    S.updateContact(user.id, v.value!.whatsapp, v.value!.phone);
    return { redirect: `/ilan/${id}?yeni=1` };
  }

  const detail = /^\/ilan\/(\d{1,9})$/.exec(p);
  if (detail && method === 'GET') {
    const l = S.getListing(Number(detail[1]));
    if (!l) return nf();
    const flash = q.get('yeni') === '1' && user?.id === l.user_id ? { kind: 'ok' as const, text: 'İlanınız yayınlandı. (Demo: ilan yalnızca bu tarayıcıda durur; yüklediğiniz fotoğraf sayfa yenilenince saklanmaz.)' } : undefined;
    return { html: V.detailPage(ctxOf(flash), { l, photos: S.getPhotos(l.id), alreadyReported: !!user && S.hasReported(l.id, user.id), reported: q.get('sikayet') === 'ok' }) };
  }
  const rep = /^\/ilan\/(\d{1,9})\/sikayet$/.exec(p);
  if (rep && method === 'POST') {
    const l = S.getListing(Number(rep[1]));
    if (!l) return nf();
    if (!user) return { redirect: `/giris?next=/ilan/${l.id}` };
    const v = validateReport(fields);
    if (!v.ok) return { html: V.detailPage(ctxOf(), { l, photos: S.getPhotos(l.id), alreadyReported: false, reportErrors: v.errors }) };
    if (!S.hasReported(l.id, user.id)) S.addReport(l.id, user.id, v.value!.reason, v.value!.note);
    return { redirect: `/ilan/${l.id}?sikayet=ok` };
  }
  const del = /^\/ilan\/(\d{1,9})\/kaldir$/.exec(p);
  if (del && method === 'POST') {
    if (!user) return { redirect: '/giris' };
    if (!S.removeListing(Number(del[1]), user.id)) return nf();
    return { redirect: `/satici/${user.id}` };
  }

  const seller = /^\/satici\/(\d{1,9})$/.exec(p);
  if (seller && method === 'GET') {
    const s = S.getUser(Number(seller[1]));
    if (!s) return nf();
    return { html: V.sellerPage(ctxOf(), { seller: s, items: S.listingsBySeller(s.id), fish: S.listAquariumFish(s.id), isOwner: user?.id === s.id }) };
  }

  if (p === '/profil/akvaryum' && method === 'GET') {
    if (!user) return { redirect: '/giris?next=/profil/akvaryum' };
    const flash = q.get('eklendi') === '1' ? { kind: 'ok' as const, text: 'Balık akvaryuma eklendi.' } : q.get('silindi') === '1' ? { kind: 'ok' as const, text: 'Balık kaldırıldı.' } : undefined;
    return { html: V.aquariumEditorPage(ctxOf(flash), { fish: S.listAquariumFish(user.id), values: {}, errors: {} }) };
  }
  if (p === '/profil/akvaryum/ekle' && method === 'POST') {
    if (!user) return { redirect: '/giris?next=/profil/akvaryum' };
    const v = validateFish(fields);
    const values = { species: fields.species, form: fields.form, variant: fields.variant, sex: fields.sex };
    if (!v.ok) return { html: V.aquariumEditorPage(ctxOf(), { fish: S.listAquariumFish(user.id), values, errors: v.errors }) };
    try { S.addAquariumFish(user.id, v.value!); }
    catch (e) {
      if (e instanceof S.AquariumCapError) return { html: V.aquariumEditorPage(ctxOf(), { fish: S.listAquariumFish(user.id), values, errors: { cap: e.message } }) };
      throw e;
    }
    return { redirect: '/profil/akvaryum?eklendi=1' };
  }
  const fishDel = /^\/profil\/akvaryum\/(\d{1,9})\/sil$/.exec(p);
  if (fishDel && method === 'POST') {
    if (!user) return { redirect: '/giris?next=/profil/akvaryum' };
    if (!S.removeAquariumFish(user.id, Number(fishDel[1]))) return nf();
    return { redirect: '/profil/akvaryum?silindi=1' };
  }

  if (p === '/kayit') {
    if (user) return { redirect: '/' };
    if (method === 'GET') return { html: V.registerPage(ctxOf(), { values: {}, errors: {} }) };
    const v = validateRegister(fields);
    if (!v.ok) return { html: V.registerPage(ctxOf(), { values: { email: v.value!.email, displayName: v.value!.displayName }, errors: v.errors }) };
    try { S.setSession(S.createUser(v.value!.email, v.value!.password, v.value!.displayName)); return { redirect: '/' }; }
    catch (e) {
      if (e instanceof S.DuplicateEmailError) return { html: V.registerPage(ctxOf(), { values: { email: v.value!.email, displayName: v.value!.displayName }, errors: { form: 'Kayıt tamamlanamadı. Bilgilerinizi kontrol edin; zaten hesabınız varsa giriş yapın.' } }) };
      throw e;
    }
  }
  if (p === '/giris') {
    if (method === 'GET') return user ? { redirect: '/' } : { html: V.loginPage(ctxOf(), { next: safeNext(q.get('next')) }) };
    const email = normalizeEmail(fields.email);
    const row = S.findUserByEmail(email);
    if (!row || row.pw !== S.fakeHash((fields.password ?? '').slice(0, 200))) return { html: V.loginPage(ctxOf(), { email, next: safeNext(fields.next), error: 'E-posta ya da parola hatalı.' }) };
    S.setSession(row.id);
    return { redirect: safeNext(fields.next) };
  }
  if (p === '/cikis' && method === 'POST') { S.setSession(null); return { redirect: '/' }; }
  return nf();
}

// ---- istemci yönlendirici (hash tabanlı: file://, sandbox iframe ve artifact içinde çalışır) ----
let lastRendered = '\0';
let token = 0;

function banner(): HTMLElement {
  const b = document.createElement('div'); b.className = 'demo-banner'; b.setAttribute('role', 'note'); b.dataset.testid = 'demo-banner';
  const t = document.createElement('span'); t.textContent = BANNER;
  const r = document.createElement('button'); r.type = 'button'; r.id = 'demo-reset'; r.textContent = 'Demoyu sıfırla';
  r.addEventListener('click', () => { S.resetAll(); go('/', { replace: true }); });
  b.append(t, r); return b;
}

function postProcess(root: ParentNode, routePath: string): void {
  // yüklenen/üretilen fotoğraflar: /yuklemeler/<dosya> -> data: ya da blob: URL
  root.querySelectorAll<HTMLImageElement>('img[src^="/yuklemeler/"]').forEach((i) => { i.src = S.photoUrl(i.getAttribute('src')!.slice(12)); });
  root.querySelectorAll<HTMLElement>('[data-src^="/yuklemeler/"]').forEach((e) => { e.dataset.src = S.photoUrl(e.dataset.src!.slice(12)); });
  // WhatsApp bağlantısı demoda kapalı (dış bağlantı yok)
  root.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me"]').forEach((a) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = a.className; b.disabled = true; b.textContent = "WhatsApp'ta yaz (demoda kapalı)"; a.replaceWith(b);
  });
  // giriş/kayıt sayfalarında demo hesabı kolaylığı
  if (routePath === '/giris') {
    const sec = root.querySelector('section.auth'); if (!sec) return;
    const box = document.createElement('div'); box.className = 'demo-hint';
    box.innerHTML = `<p><strong>Demo hesabı:</strong> <code>${S.DEMO_EMAIL}</code> / <code>${S.DEMO_PASSWORD}</code></p><p><button type="button" class="btn btn-small" id="demo-giris">Demo hesabıyla giriş yap</button></p><p class="muted small">Giriş sahtedir ve yalnızca bu tarayıcıdadır; parola hiçbir yere gönderilmez.</p>`;
    sec.appendChild(box);
    box.querySelector('#demo-giris')!.setAttribute('data-demo', '1');
  }
  if (routePath === '/kayit') {
    const sec = root.querySelector('section.auth');
    const p = document.createElement('p'); p.className = 'muted small'; p.textContent = 'Demo: hesap yalnızca bu tarayıcıda oluşturulur, parola hiçbir yere gönderilmez.'; sec?.appendChild(p);
  }
}
function hookAfterInsert(): void {
  const btn = document.getElementById('demo-giris');
  if (btn) btn.addEventListener('click', () => {
      const f = document.querySelector('section.auth form') as HTMLFormElement;
      (f.querySelector('#email') as HTMLInputElement).value = S.DEMO_EMAIL;
      (f.querySelector('#password') as HTMLInputElement).value = S.DEMO_PASSWORD;
      f.requestSubmit();
  });
}

function teardown(): void {
  disposeAllViewers();
  const w = window as unknown as { __akvaryum?: { dispose(): void } };
  try { w.__akvaryum?.dispose(); } catch { /* yoksay */ }
  w.__akvaryum = undefined;
}

function initFor(p: string, hasTank: boolean): void {
  if (p === '/ilanlar') initIlanlar();
  else if (p === '/ilan/yeni') initForm();
  else if (/^\/ilan\/\d+$/.test(p)) initDetay();
  else if (/^\/satici\/\d+$/.test(p) && hasTank) initSatici();
  else if (p === '/profil/akvaryum') initDuzenle();
}

async function render(full: string): Promise<void> {
  const my = ++token;
  lastRendered = full;
  const hi = full.indexOf('#');
  const target = hi >= 0 ? full.slice(0, hi) : full, frag = hi >= 0 ? full.slice(hi + 1) : '';
  const u = new URL(target, 'http://demo.local');
  let res: Res;
  try { res = await handle('GET', u.pathname, u.searchParams, {}, []); }
  catch (e) { console.error(e); res = msg('Bir şeyler ters gitti', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'); }
  if (my !== token) return;
  if ('redirect' in res) { go(res.redirect, { replace: true }); return; }
  show(res.html, u.pathname.replace(/\/+$/, '') || '/', frag);
}

function show(htmlText: string, routePath: string, frag = ''): void {
  teardown();
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  postProcess(doc.body, routePath);
  document.title = doc.title + ' · DEMO';
  const nodes = [...doc.body.childNodes].map((n) => document.importNode(n, true));
  document.body.replaceChildren(banner(), ...nodes);
  hookAfterInsert();
  try { initFor(routePath, !!document.getElementById('tank')); } catch (e) { console.error('Sayfa betiği başlatılamadı', e); }
  const t = frag ? document.getElementById(frag) : null;
  if (t) t.scrollIntoView(); else window.scrollTo(0, 0);
}

function go(path: string, o: { replace?: boolean } = {}): void {
  const target = '#' + path;
  if (location.hash !== target) {
    try { if (o.replace) location.replace(target); else location.hash = target; } catch { /* hash yazılamadı */ }
    if (location.hash === target) return; // hashchange işleyicisi çizer
  }
  void render(path);
}
addEventListener('hashchange', () => { const p = location.hash.replace(/^#/, '') || '/'; if (p !== lastRendered) void render(p); });

// ---- tıklama / gönderim yakalama ----
document.addEventListener('click', (ev) => {
  if (ev.defaultPrevented || (ev as MouseEvent).button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href') ?? '';
  if (href.startsWith('#') && !href.startsWith('#/')) {
    ev.preventDefault();
    const t = document.getElementById(href.slice(1));
    if (t) { t.scrollIntoView(); if (!t.hasAttribute('tabindex') && !/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(t.tagName)) t.setAttribute('tabindex', '-1'); (t as HTMLElement).focus?.({ preventScroll: true }); }
    return;
  }
  if (href.startsWith('/') && !href.startsWith('//')) { ev.preventDefault(); go(href); }
});

document.addEventListener('submit', async (ev) => {
  const form = ev.target as HTMLFormElement;
  if (ev.defaultPrevented) return; // örn. ilan formunun kendi doğrulaması geçersiz bulduysa
  ev.preventDefault();
  const confirmMsg = form.getAttribute('data-confirm');
  if (confirmMsg && form.dataset.armed !== '1') { // window.confirm sandbox'ta yok: iki dokunuşlu onay
    form.dataset.armed = '1';
    const b = form.querySelector('button[type=submit]') as HTMLButtonElement | null;
    const old = b?.textContent ?? '';
    if (b) b.textContent = 'Emin misiniz? Tekrar dokunun';
    setTimeout(() => { form.dataset.armed = ''; if (b) b.textContent = old; }, 4000);
    return;
  }
  const action = new URL(form.getAttribute('action') || '/', 'http://demo.local');
  const fd = new FormData(form);
  const method = (form.getAttribute('method') || 'get').toLowerCase();
  if (method !== 'post') {
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === 'string' && v !== '') qs.set(k, v);
    go(action.pathname + (qs.toString() ? '?' + qs : ''));
    return;
  }
  const fields: Record<string, string> = {}; const files: File[] = [];
  for (const [k, v] of fd.entries()) { if (typeof v === 'string') fields[k] = v; else if (k === 'photos') files.push(v); }
  const my = ++token;
  let res: Res;
  try { res = await handle('POST', action.pathname, action.searchParams, fields, files); }
  catch (e) { console.error(e); res = msg('Bir şeyler ters gitti', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'); }
  if (my !== token) return;
  if ('redirect' in res) go(res.redirect);
  else { lastRendered = '\0'; show(res.html, action.pathname.replace(/\/+$/, '') || '/'); }
});

void render(location.hash.replace(/^#/, '') || '/');
