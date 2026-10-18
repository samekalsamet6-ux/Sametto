// Demo "veritabanı": tarayıcı belleğinde, mümkünse localStorage'da (try/catch ile). Sunucu yok.
import { CATALOG, UNKNOWN_SEX, speciesById } from '../shared/catalog.ts';
import { SORTS, PAGE_SIZE, priceToKurus, type SearchParams } from '../server/search.ts';
import { aquariumCapError, type FishInput, type ListingInput } from '../server/validation.ts';
import type { Listing, Photo, AquariumFish, User } from '../server/db.ts';

const KEY = 'supazari-demo-v1';
export const DEMO_PASSWORD = 'ornek-parola-123';
export const DEMO_EMAIL = 'ornek.satici@example.test';

type DUser = User & { pw: string };
export interface Report { id: number; listing_id: number; user_id: number; reason: string; note: string; created_at: number }
interface Data { v: 1; users: DUser[]; listings: Listing[]; photos: Photo[]; reports: Report[]; fish: AquariumFish[]; sid: number | null; seq: number }

/** Parola yalnızca bu demoda, tarayıcıda; gerçek bir özet değil (sahte). */
export const fakeHash = (s: string): string => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return 'demo$' + h.toString(16); };

const DISTRICTS: Record<string, string[]> = { 'İstanbul': ['Kadıköy', 'Beşiktaş', 'Üsküdar'], 'Ankara': ['Çankaya', 'Keçiören'], 'İzmir': ['Karşıyaka', 'Bornova'], 'Bursa': ['Nilüfer', 'Osmangazi'], 'Antalya': ['Muratpaşa', 'Konyaaltı'], 'Eskişehir': ['Tepebaşı', 'Odunpazarı'], 'Kocaeli': ['İzmit', 'Gebze'], 'Konya': ['Selçuklu', 'Meram'] };
const CITIES8 = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir', 'Kocaeli', 'Konya'];
// scripts/seed.ts ile aynı plan: [tür, şekil sırası, renk sırası, cinsiyet, adet, fiyat TL, açıklama]
const PLAN: [string, number, number, string, number, number, string][] = [
  ['lepistes', 2, 0, 'erkek', 3, 120, 'Örnek ilan metni: 3 erkek lepistes, evde üretim, sağlıklı ve iştahlı. Teslim elden.'],
  ['lepistes', 7, 3, 'disi', 2, 90, 'Örnek ilan metni: iki dişi, farklı kuşaklardan. Akvaryum suyuna alıştırılmış.'],
  ['lepistes', 11, 5, 'erkek', 1, 150, 'Örnek ilan metni: tek erkek, uzun kuyruklu form; gösteri kalitesi iddiası yoktur.'],
  ['betta', 3, 1, 'erkek', 1, 350, 'Örnek ilan metni: tek erkek betta, ayrı bir kavanozda büyütüldü, yem yiyor.'],
  ['betta', 1, 4, 'erkek', 1, 420, 'Örnek ilan metni: erkek betta, yüzgeçleri tam. Başka bir balıkla barındırmayın.'],
  ['japon', 3, 2, 'bilinmiyor', 5, 60, 'Örnek ilan metni: küçük boy japon balıkları, cinsiyet ayrımı henüz yapılamıyor.'],
  ['molly', 1, 1, 'disi', 4, 45, 'Örnek ilan metni: dişi molly grubu, yavru verebilir.'],
  ['platy', 1, 2, 'erkek', 6, 30, 'Örnek ilan metni: renkli platy erkekleri, toplu satılık.'],
  ['melek', 1, 2, 'bilinmiyor', 2, 200, 'Örnek ilan metni: genç melek balığı çifti adayı, cinsiyetleri belli değil.'],
  ['diskus', 0, 4, 'bilinmiyor', 1, 1800, 'Örnek ilan metni: genç diskus, yaklaşık 10 cm. Temiz ve yumuşak su ister.'],
  ['pleco', 1, 1, 'erkek', 1, 250, 'Örnek ilan metni: erkek pleco, gece aktif. Büyük akvaryum gerektirir.'],
  ['neon', 1, 1, 'bilinmiyor', 20, 8, 'Örnek ilan metni: 20 adet neon tetra, 2-3 cm, sürü hâlinde satılır.'],
  ['corydoras', 1, 0, 'bilinmiyor', 6, 35, 'Örnek ilan metni: 6 corydoras, kumlu zemin tercih ederler.'],
  ['karides', 0, 2, 'bilinmiyor', 10, 15, 'Örnek ilan metni: 10 adet karides, bitkili akvaryumdan.'],
  ['vatoz', 0, 0, 'bilinmiyor', 1, 3500, 'Örnek ilan metni: tatlı su vatozu; özel bakım bilgisi gerektirir, ilan yalnızca örnektir.'],
  ['diger', 0, 0, 'bilinmiyor', 2, 75, 'Örnek ilan metni: listede 3B modeli olmayan bir tür; yalnızca fotoğraflarla gösterilir.'],
];
// [tür, şekil sırası, renk sırası, cinsiyet sırası]: 12 karışık balık
const AQUARIUM: [string, number, number, number][] = [
  ['lepistes', 2, 3, 0], ['molly', 1, 1, 1], ['platy', 1, 2, 0], ['betta', 3, 1, 0], ['neon', 1, 1, 1], ['corydoras', 1, 0, 0],
  ['japon', 3, 2, 0], ['pleco', 1, 1, 1], ['melek', 1, 2, 0], ['diskus', 0, 4, 0], ['vatoz', 0, 0, 1], ['karides', 0, 2, 1],
];

function seed(): Data {
  const t0 = Date.now();
  const d: Data = { v: 1, users: [], listings: [], photos: [], reports: [], fish: [], sid: null, seq: 100 };
  const mk = (id: number, email: string, name: string, whatsapp: string | null, phone: string | null): DUser => ({ id, email, display_name: name, whatsapp, phone, is_demo: 1, is_admin: 0, created_at: t0 - 40 * 86_400_000, pw: fakeHash(DEMO_PASSWORD) });
  d.users.push(mk(1, DEMO_EMAIL, 'Örnek Satıcı (DEMO)', '905550000001', null), mk(2, 'ornek.yetistirici@example.test', 'Örnek Yetiştirici (DEMO)', null, '905550000002'));
  let ph = 1, pid = 1;
  PLAN.forEach(([sid, fi, vi, sex, qty, price, desc], i) => {
    const sp = sid === 'diger' ? null : speciesById(sid)!;
    const form = sp?.forms.length ? sp.forms[Math.min(fi, sp.forms.length - 1)] : null;
    const variant = sp?.variants.length ? sp.variants[Math.min(vi, sp.variants.length - 1)] : null;
    const city = CITIES8[i % CITIES8.length];
    const id = i + 1;
    d.listings.push({
      id, user_id: (i % 2) + 1, title: `${sp ? sp.ad : 'Zebra danio'} — ${sp ? [form?.ad, variant?.ad].filter(Boolean).join(', ') : 'diğer'} (ÖRNEK)`,
      species_id: sid, species_other: sp ? null : 'Zebra danio', form_id: form?.id ?? null, variant_id: variant?.id ?? null,
      sex: sp && sex !== UNKNOWN_SEX && !sp.sexes.some((s) => s.id === sex) ? sp.sexes[0].id : sex, quantity: qty, price_kurus: price * 100,
      city, district: DISTRICTS[city][i % 2], description: desc, is_demo: 1, flagged: 0, status: 'active', created_at: t0 - i * 3_600_000,
    });
    const n = 1 + (i % 3);
    for (let k = 0; k < n; k++) d.photos.push({ id: pid++, listing_id: id, file: 'ph-' + ph++, mime: 'image/svg+xml', bytes: 0, position: k });
  });
  d.reports.push({ id: 1, listing_id: 5, user_id: 0, reason: 'diger', note: 'Örnek şikayet kaydı (DEMO)', created_at: t0 });
  AQUARIUM.forEach(([sid, fi, vi, si], i) => {
    const sp = speciesById(sid)!;
    d.fish.push({ id: i + 1, user_id: 1, species_id: sid, form_id: sp.forms.length ? sp.forms[Math.min(fi, sp.forms.length - 1)].id : null, variant_id: sp.variants.length ? sp.variants[Math.min(vi, sp.variants.length - 1)].id : null, sex: sp.sexes[Math.min(si, sp.sexes.length - 1)].id, position: i + 1, created_at: t0 });
  });
  return d;
}

let data: Data = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const x = JSON.parse(raw) as Data; if (x && x.v === 1 && Array.isArray(x.listings)) return x; }
  } catch { /* depolama yok / bozuk: bellekte devam */ }
  return seed();
})();
export function save(): void { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* bellekte kalır */ } }
export function resetAll(): void { data = seed(); save(); }
const nextId = (): number => ++data.seq;

// ---- fotoğraflar: yüklenenler yalnızca bellekte (object URL); tohum fotoğrafları üretilmiş SVG ----
const uploads = new Map<string, string>();
function svgPhoto(seedN: number, label: string, small?: string): string {
  const hue = (seedN * 47 + 170) % 360, h2 = (hue + 200) % 360, cy = 230, ry = 70 + (seedN % 4) * 8, cx = 300 + (seedN % 3) * 20, rx = 140;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h2} 45% 42%)"/><stop offset="1" stop-color="hsl(${h2} 45% 14%)"/></linearGradient></defs>`
    + `<rect width="640" height="480" fill="url(#g)"/>`
    + [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${(i * 110 + seedN * 31) % 640 - 20}" y="0" width="26" height="480" fill="#fff" opacity=".05" transform="skewX(-14)"/>`).join('')
    + `<polygon points="${cx + rx - 20},${cy} ${cx + rx + 90},${cy - 80} ${cx + rx + 90},${cy + 80}" fill="hsl(${(hue + 25) % 360} 80% 62%)" opacity=".9"/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="hsl(${hue} 75% 55%)"/>`
    + `<circle cx="${cx - rx + 45}" cy="${cy - 14}" r="10" fill="#fff"/><circle cx="${cx - rx + 47}" cy="${cy - 14}" r="5" fill="#0a141e"/>`
    + `<rect x="0" y="0" width="640" height="${small ? 84 : 66}" fill="#0a141e" opacity=".62"/>`
    + `<text x="320" y="${small ? 38 : 48}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="38" letter-spacing="6" fill="#ffe08a">${label}</text>`
    + (small ? `<text x="320" y="68" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#fff">${small}</text>` : '')
    + `</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
export function photoUrl(file: string): string {
  const up = uploads.get(file);
  if (up) return up;
  if (file.startsWith('ph-')) return svgPhoto(Number(file.slice(3)) || 1, 'ÖRNEK');
  return svgPhoto(7, 'FOTOĞRAF', 'Yüklenen fotoğraf bu demoda saklanmaz');
}

// ---- kullanıcılar / oturum ----
export const currentUser = (): User | undefined => { const u = data.users.find((x) => x.id === data.sid); return u ? stripPw(u) : undefined; };
const stripPw = ({ pw: _pw, ...u }: DUser): User => u;
export const getUser = (id: number): User | undefined => { const u = data.users.find((x) => x.id === id); return u ? stripPw(u) : undefined; };
export const findUserByEmail = (email: string): DUser | undefined => data.users.find((u) => u.email === email);
export class DuplicateEmailError extends Error {}
export function createUser(email: string, password: string, displayName: string): number {
  if (findUserByEmail(email)) throw new DuplicateEmailError();
  const id = nextId();
  data.users.push({ id, email, display_name: displayName, whatsapp: null, phone: null, is_demo: 0, is_admin: 0, created_at: Date.now(), pw: fakeHash(password) });
  save(); return id;
}
export function setSession(id: number | null): void { data.sid = id; save(); }
export function updateContact(uid: number, whatsapp: string | null, phone: string | null): void { const u = data.users.find((x) => x.id === uid); if (u) { u.whatsapp = whatsapp; u.phone = phone; save(); } }

// ---- ilanlar ----
const withSeller = (l: Listing): Listing => {
  const s = data.users.find((u) => u.id === l.user_id);
  const first = data.photos.filter((p) => p.listing_id === l.id).sort((a, b) => a.position - b.position)[0];
  return { ...l, seller_name: s?.display_name, seller_whatsapp: s?.whatsapp ?? null, seller_phone: s?.phone ?? null, first_photo: first?.file ?? null };
};
export function searchListings(p: SearchParams): { items: Listing[]; total: number; page: number; pages: number } {
  const lc = (s: string) => s.toLocaleLowerCase('tr-TR');
  let rows = data.listings.filter((l) => l.status === 'active');
  if (p.species) rows = rows.filter((l) => l.species_id === p.species);
  if (p.form) rows = rows.filter((l) => l.form_id === p.form);
  if (p.variant) rows = rows.filter((l) => l.variant_id === p.variant);
  if (p.city) rows = rows.filter((l) => l.city === p.city);
  if (p.district?.trim()) rows = rows.filter((l) => lc(l.district ?? '').includes(lc(p.district!.trim())));
  const min = priceToKurus(p.minPrice), max = priceToKurus(p.maxPrice);
  if (min !== null) rows = rows.filter((l) => l.price_kurus >= min);
  if (max !== null) rows = rows.filter((l) => l.price_kurus <= max);
  if (typeof p.userId === 'number') rows = rows.filter((l) => l.user_id === p.userId);
  const sort = p.sort && SORTS[p.sort] ? p.sort : 'yeni';
  rows.sort((a, b) => sort === 'ucuz' ? a.price_kurus - b.price_kurus || b.id - a.id : sort === 'pahali' ? b.price_kurus - a.price_kurus || b.id - a.id : b.created_at - a.created_at || b.id - a.id);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(p.page)) || 1));
  return { items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(withSeller), total: rows.length, page, pages };
}
export const getListing = (id: number): Listing | undefined => { const l = data.listings.find((x) => x.id === id && x.status === 'active'); return l ? withSeller(l) : undefined; };
export const getPhotos = (id: number): Photo[] => data.photos.filter((p) => p.listing_id === id).sort((a, b) => a.position - b.position);
export const listingsBySeller = (uid: number): Listing[] => searchListings({ userId: uid }).items;
export function createListing(uid: number, v: ListingInput, files: File[]): number {
  if (files.length < 1) throw new Error('En az bir fotoğraf gerekli'); // gerçek sitedeki gibi: fotoğrafsız ilan yayınlanamaz
  const id = nextId();
  data.listings.push({ id, user_id: uid, title: v.title, species_id: v.speciesId, species_other: v.speciesOther, form_id: v.formId, variant_id: v.variantId, sex: v.sex, quantity: v.quantity, price_kurus: v.priceKurus, city: v.city, district: v.district, description: v.description, is_demo: 0, flagged: 0, status: 'active', created_at: Date.now() });
  files.forEach((f, i) => { const file = 'up-' + nextId(); uploads.set(file, URL.createObjectURL(f)); data.photos.push({ id: nextId(), listing_id: id, file, mime: f.type, bytes: f.size, position: i }); });
  save(); return id;
}
export function removeListing(id: number, uid: number): boolean {
  const l = data.listings.find((x) => x.id === id && x.user_id === uid && x.status === 'active');
  if (!l) return false;
  l.status = 'removed'; save(); return true;
}
export const hasReported = (lid: number, uid: number): boolean => data.reports.some((r) => r.listing_id === lid && r.user_id === uid);
export function addReport(lid: number, uid: number, reason: string, note: string): void { data.reports.push({ id: nextId(), listing_id: lid, user_id: uid, reason, note, created_at: Date.now() }); const l = data.listings.find((x) => x.id === lid); if (l) l.flagged = 1; save(); }

// ---- akvaryum ----
export const listAquariumFish = (uid: number): AquariumFish[] => data.fish.filter((f) => f.user_id === uid).sort((a, b) => a.position - b.position);
export class AquariumCapError extends Error {}
export function addAquariumFish(uid: number, f: FishInput): void {
  const cur = listAquariumFish(uid);
  const cap = aquariumCapError(cur.map((x) => x.species_id), f.speciesId);
  if (cap) throw new AquariumCapError(cap);
  data.fish.push({ id: nextId(), user_id: uid, species_id: f.speciesId, form_id: f.formId, variant_id: f.variantId, sex: f.sex, position: cur.reduce((m, r) => Math.max(m, r.position), 0) + 1, created_at: Date.now() });
  save();
}
export function removeAquariumFish(uid: number, id: number): boolean { const n = data.fish.length; data.fish = data.fish.filter((f) => !(f.id === id && f.user_id === uid)); if (data.fish.length === n) return false; save(); return true; }
void CATALOG;
