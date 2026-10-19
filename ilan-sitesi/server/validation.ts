import { CITIES } from '../shared/cities.ts';
import { normalizeLNumber, gradeById, L_SPECIES, GRADE_SPECIES } from '../shared/species-fields.ts';
import { OTHER_ID, UNKNOWN_SEX, sexOptions, fishSexOptions, noSexSplit, speciesById } from '../shared/catalog.ts';

export type Errors = Record<string, string>;
export interface Result<T> { ok: boolean; value?: T; errors: Errors }

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;
export const clean = (v: unknown, max = 2000): string =>
  (typeof v === 'string' ? v : '').normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);

export function normalizeEmail(v: unknown): string { return clean(v, 254).toLowerCase(); }

export interface RegisterInput { email: string; password: string; displayName: string }
export function validateRegister(f: Record<string, unknown>): Result<RegisterInput> {
  const errors: Errors = {};
  const email = normalizeEmail(f.email);
  const password = typeof f.password === 'string' ? f.password : '';
  const displayName = clean(f.displayName, 40);
  if (!EMAIL_RE.test(email)) errors.email = 'Geçerli bir e-posta adresi girin.';
  if (password.length < 8) errors.password = 'Parola en az 8 karakter olmalı.';
  else if (password.length > 200) errors.password = 'Parola en fazla 200 karakter olabilir.';
  if (displayName.length < 2) errors.displayName = 'Görünen ad en az 2 karakter olmalı.';
  if (!errors.password && password !== (typeof f.password2 === 'string' ? f.password2 : password)) errors.password2 = 'Parolalar eşleşmiyor.';
  return { ok: Object.keys(errors).length === 0, value: { email, password, displayName }, errors };
}

/** Türkiye numarasını rakamlara indirger: 0532 123 45 67 / +90 532... -> 905321234567. Geçersizse null. */
export function normalizePhone(v: unknown): string | null {
  let d = clean(v, 30).replace(/[\s().-]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('90') && d.length === 12) return d;
  if (d.startsWith('0') && d.length === 11) return '9' + d;
  if (d.length === 10) return '90' + d;
  return null;
}
export function formatPhone(n: string): string { return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10)}`; }
/** Form alanı için: 905550000001 -> 0555 000 00 01 (normalizePhone ile geri çevrilebilir). */
export function formatPhoneLocal(n: string): string { return `0${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10)}`; }

/** "1.250,50" / "1250" / "12,5" -> kuruş (tamsayı). */
export function parsePriceKurus(v: unknown): number | null {
  let s = clean(v, 20).replace(/\s|₺|TL/gi, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const k = Math.round(parseFloat(s) * 100);
  return Number.isSafeInteger(k) ? k : null;
}
export function formatPrice(kurus: number): string {
  const tl = kurus / 100;
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: kurus % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(tl) + ' ₺';
}

export interface ListingInput {
  speciesId: string; speciesOther: string | null; formId: string | null; variantId: string | null; sex: string;
  quantity: number; priceKurus: number; city: string; district: string; title: string; description: string;
  whatsapp: string | null; phone: string | null;
  /** Türe özel isteğe bağlı alanlar (pleco: L-numarası; Neocaridina: grade). Diğer türlerde her zaman null. */
  lNumber?: string | null; lUnverified?: boolean; grade?: string | null;
}
/** İlçe: serbest metin, yalnızca harf/rakam/boşluk ve . ' ’ - ( ) / (HTML/kontrol karakteri yok). */
const DISTRICT_RE = /^[\p{L}\p{M}\p{N} .'’()\/-]{2,60}$/u;
export const MAX_QTY = 10000;
export const MAX_PRICE_KURUS = 100_000_000_00; // 100 milyon TL üst sınır

export function validateListing(f: Record<string, unknown>): Result<ListingInput> {
  const errors: Errors = {};
  const speciesId = clean(f.species, 30);
  const sp = speciesById(speciesId);
  if (speciesId !== OTHER_ID && !sp) errors.species = 'Listeden bir tür seçin.';
  const speciesOther = speciesId === OTHER_ID ? clean(f.speciesOther, 60) : '';
  if (speciesId === OTHER_ID && speciesOther.length < 2) errors.speciesOther = 'Türün adını yazın (en az 2 karakter).';

  let formId: string | null = null, variantId: string | null = null;
  if (sp) {
    const form = clean(f.form, 40);
    if (sp.forms.length) { if (!sp.forms.some((x) => x.id === form)) errors.form = 'Bu tür için geçerli bir şekil seçin.'; else formId = form; }
    const variant = clean(f.variant, 40);
    if (sp.variants.length) { if (!sp.variants.some((x) => x.id === variant)) errors.variant = 'Bu tür için geçerli bir renk seçin.'; else variantId = variant; }
  }
  let sex = clean(f.sex, 20);
  if (noSexSplit(speciesId) && sp && (sex === sp.sexes[0].id || sex === UNKNOWN_SEX)) sex = UNKNOWN_SEX; // eski 'disi' kimliği de 'bilinmiyor'a çevrilir
  if (!sexOptions(speciesId).some((x) => x.id === sex)) errors.sex = 'Cinsiyet seçin.';

  const qRaw = clean(f.quantity, 8);
  const quantity = /^\d+$/.test(qRaw) ? parseInt(qRaw, 10) : NaN;
  if (!(quantity >= 1 && quantity <= MAX_QTY)) errors.quantity = `Adet 1 ile ${MAX_QTY} arasında bir sayı olmalı.`;

  const priceKurus = parsePriceKurus(f.price);
  if (priceKurus === null || priceKurus < 100 || priceKurus > MAX_PRICE_KURUS) errors.price = 'Fiyatı TL olarak yazın (en az 1 ₺), örn. 250 veya 249,90.';

  const city = clean(f.city, 40);
  if (!CITIES.includes(city)) errors.city = 'Listeden bir şehir seçin.';

  const district = clean(f.district, 200).replace(/\s+/g, ' ');
  if (district.length < 2 || !DISTRICT_RE.test(district)) errors.district = 'İlçe adını yazın (2-60 karakter; yalnızca harf, rakam, boşluk ve . \' - ( ) /).';

  const description = clean(f.description, 2000);
  if (description.length < 10) errors.description = 'Açıklama en az 10 karakter olmalı.';
  let title = clean(f.title, 80);
  if (!title) title = `${speciesId === OTHER_ID ? speciesOther : sp?.ad ?? ''} (${quantity || 1} adet)`.trim();

  let whatsapp: string | null = null, phone: string | null = null;
  const wRaw = clean(f.whatsapp, 30), pRaw = clean(f.phone, 30);
  if (wRaw) { whatsapp = normalizePhone(wRaw); if (!whatsapp) errors.whatsapp = 'WhatsApp numarasını 05xx xxx xx xx biçiminde yazın.'; }
  if (pRaw) { phone = normalizePhone(pRaw); if (!phone) errors.phone = 'Telefon numarasını 05xx xxx xx xx biçiminde yazın.'; }

  // Türe özel alanlar (yalnızca ilgili türde geçerli; başka türde sessizce yok sayılır).
  let lNumber: string | null = null, lUnverified = false, grade: string | null = null;
  if (speciesId === L_SPECIES) {
    const raw = clean(f.lnum, 12);
    if (raw) { lNumber = normalizeLNumber(raw); if (!lNumber) errors.lnum = 'L-numarasını "L144" gibi yazın (L ve 1-3 haneli sayı) ya da boş bırakın.'; }
    lUnverified = f.lunknown === '1' || f.lunknown === 'on';
  }
  if (speciesId === GRADE_SPECIES) {
    const g = clean(f.grade, 40);
    if (g) { if (gradeById(g)) grade = g; else errors.grade = 'Listeden bir grade seçin ya da boş bırakın.'; }
  }

  return { ok: Object.keys(errors).length === 0, errors, value: { speciesId, speciesOther: speciesId === OTHER_ID ? speciesOther : null, formId, variantId, sex, quantity, priceKurus: priceKurus ?? 0, city, district, title, description, whatsapp, phone, lNumber, lUnverified, grade } };
}

export const REPORT_REASONS = [
  { id: 'sahte', ad: 'Sahte ya da yanıltıcı ilan' },
  { id: 'foto', ad: 'Fotoğraf başkasına ait / uygunsuz' },
  { id: 'yasak', ad: 'Satışı yasak ya da korunan tür' },
  { id: 'diger', ad: 'Diğer' },
] as const;
export function validateReport(f: Record<string, unknown>): Result<{ reason: string; note: string }> {
  const errors: Errors = {};
  const reason = clean(f.reason, 20);
  if (!REPORT_REASONS.some((r) => r.id === reason)) errors.reason = 'Bir neden seçin.';
  const note = clean(f.note, 500);
  return { ok: !Object.keys(errors).length, errors, value: { reason, note } };
}

// ---- Akvaryum (satıcı profili): balık doğrulaması ve üst sınırlar ----
/** Bir akvaryumdaki en çok balık sayısı (tek WebGL sahnesinin çizim bütçesi için). */
export const MAX_FISH = 12;
/** Karides modeli çok parçalıdır (~240 çizim çağrısı/adet): en çok 3. */
export const MAX_KARIDES = 3;
/** Karides sınırına sayılan türler (Neocaridina ve Amano aynı havuzdan sayılır). */
export const SHRIMP_SPECIES = ['karides', 'amano'] as const;
/** Ağır modeller (japon, pleco, vatoz: 35-60 çizim çağrısı ve büyük yüzgeçler): toplamda en çok 4. */
export const HEAVY_SPECIES = ['japon', 'pleco', 'vatoz'] as const;
export const MAX_HEAVY = 4;

export interface FishInput { speciesId: string; formId: string | null; variantId: string | null; sex: string }

/** Katalogla doğrular: tür 3B modeli olan bir tür olmalı; şekil/renk o türe ait olmalı; cinsiyet türün sunduğu seçeneklerden biri olmalı ('bilinmiyor' yok: 3B için kesin cinsiyet gerekir). */
export function validateFish(f: Record<string, unknown>): Result<FishInput> {
  const errors: Errors = {};
  const speciesId = clean(f.species, 30);
  const sp = speciesById(speciesId);
  if (!sp) errors.species = 'Listeden bir tür seçin.';
  let formId: string | null = null, variantId: string | null = null;
  if (sp) {
    const form = clean(f.form, 40);
    if (sp.forms.length) { if (!sp.forms.some((x) => x.id === form)) errors.form = 'Bu tür için geçerli bir şekil seçin.'; else formId = form; }
    const variant = clean(f.variant, 40);
    if (sp.variants.length) { if (!sp.variants.some((x) => x.id === variant)) errors.variant = 'Bu tür için geçerli bir renk seçin.'; else variantId = variant; }
  }
  let sex = clean(f.sex, 20);
  if (sp && noSexSplit(speciesId) && sex === sp.sexes[0].id) sex = UNKNOWN_SEX; // 'Ayrım yok' türleri: 'bilinmiyor' saklanır
  if (sp && !fishSexOptions(speciesId).some((x) => x.id === sex)) errors.sex = 'Bu tür için geçerli bir cinsiyet seçin.';
  return { ok: Object.keys(errors).length === 0, errors, value: { speciesId, formId, variantId, sex } };
}

/** Eklemeden önce üst sınır denetimi: sorun varsa Türkçe mesaj, yoksa null. `current` mevcut balıkların tür kimlikleri. */
export function aquariumCapError(current: string[], add: string): string | null {
  if (current.length >= MAX_FISH) return `Akvaryumda en fazla ${MAX_FISH} balık olabilir. Yeni balık eklemek için birini kaldırın.`;
  if ((SHRIMP_SPECIES as readonly string[]).includes(add) && current.filter((x) => (SHRIMP_SPECIES as readonly string[]).includes(x)).length >= MAX_KARIDES) return `Akvaryumda en fazla ${MAX_KARIDES} karides olabilir (karides modeli çok parçalıdır).`;
  if ((HEAVY_SPECIES as readonly string[]).includes(add) && current.filter((x) => (HEAVY_SPECIES as readonly string[]).includes(x)).length >= MAX_HEAVY) return `Japon, pleco ve vatoz toplamda en fazla ${MAX_HEAVY} tane olabilir (büyük modeller).`;
  return null;
}

export { UNKNOWN_SEX };

// ---- Toplu giriş (dükkân modu) ve dükkân bilgisi ----
export function validateStockRow(f: { quantity: unknown; price: unknown }): Result<{ quantity: number; priceKurus: number }> {
  const errors: Errors = {};
  const qRaw = clean(f.quantity, 8);
  const quantity = /^\d+$/.test(qRaw) ? parseInt(qRaw, 10) : NaN;
  if (!(quantity >= 1 && quantity <= MAX_QTY)) errors.quantity = `Adet 1 ile ${MAX_QTY} arasında olmalı.`;
  const priceKurus = parsePriceKurus(f.price);
  if (priceKurus === null || priceKurus < 100 || priceKurus > MAX_PRICE_KURUS) errors.price = 'Fiyat en az 1 ₺ olmalı (örn. 250 ya da 249,90).';
  return { ok: !Object.keys(errors).length, errors, value: { quantity, priceKurus: priceKurus ?? 0 } };
}
export const MAX_BULK_ROWS = 200;

export interface ShopInput { name: string | null; address: string | null; hours: string | null; about: string | null }
const oneLine = (v: unknown, max: number) => clean(v, max * 3).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
export function validateShop(f: Record<string, unknown>): Result<ShopInput> {
  const errors: Errors = {};
  const raw = { name: clean(f.shopName, 1000), address: clean(f.shopAddress, 1000), hours: clean(f.shopHours, 1000), about: clean(f.shopAbout, 2000) };
  const caps = { name: 60, address: 160, hours: 100, about: 400 } as const;
  const labels = { name: 'Dükkân adı', address: 'Adres', hours: 'Çalışma saatleri', about: 'Kısa tanıtım' } as const;
  const out = {} as ShopInput;
  for (const k of ['name', 'address', 'hours', 'about'] as const) {
    if (raw[k].length > caps[k]) errors[k === 'name' ? 'shopName' : k === 'address' ? 'shopAddress' : k === 'hours' ? 'shopHours' : 'shopAbout'] = `${labels[k]} en fazla ${caps[k]} karakter olabilir.`;
    out[k] = oneLine(raw[k], caps[k]) || null;
  }
  return { ok: !Object.keys(errors).length, errors, value: out };
}
