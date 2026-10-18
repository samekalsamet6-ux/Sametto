import { CITIES } from '../shared/cities.ts';
import { OTHER_ID, UNKNOWN_SEX, sexOptions, speciesById } from '../shared/catalog.ts';

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
  quantity: number; priceKurus: number; city: string; title: string; description: string;
  whatsapp: string | null; phone: string | null;
}
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
  const sex = clean(f.sex, 20);
  if (!sexOptions(speciesId).some((x) => x.id === sex)) errors.sex = 'Cinsiyet seçin.';

  const qRaw = clean(f.quantity, 8);
  const quantity = /^\d+$/.test(qRaw) ? parseInt(qRaw, 10) : NaN;
  if (!(quantity >= 1 && quantity <= MAX_QTY)) errors.quantity = `Adet 1 ile ${MAX_QTY} arasında bir sayı olmalı.`;

  const priceKurus = parsePriceKurus(f.price);
  if (priceKurus === null || priceKurus < 100 || priceKurus > MAX_PRICE_KURUS) errors.price = 'Fiyatı TL olarak yazın (en az 1 ₺), örn. 250 veya 249,90.';

  const city = clean(f.city, 40);
  if (!CITIES.includes(city)) errors.city = 'Listeden bir şehir seçin.';

  const description = clean(f.description, 2000);
  if (description.length < 10) errors.description = 'Açıklama en az 10 karakter olmalı.';
  let title = clean(f.title, 80);
  if (!title) title = `${speciesId === OTHER_ID ? speciesOther : sp?.ad ?? ''} (${quantity || 1} adet)`.trim();

  let whatsapp: string | null = null, phone: string | null = null;
  const wRaw = clean(f.whatsapp, 30), pRaw = clean(f.phone, 30);
  if (wRaw) { whatsapp = normalizePhone(wRaw); if (!whatsapp) errors.whatsapp = 'WhatsApp numarasını 05xx xxx xx xx biçiminde yazın.'; }
  if (pRaw) { phone = normalizePhone(pRaw); if (!phone) errors.phone = 'Telefon numarasını 05xx xxx xx xx biçiminde yazın.'; }

  return { ok: Object.keys(errors).length === 0, errors, value: { speciesId, speciesOther: speciesId === OTHER_ID ? speciesOther : null, formId, variantId, sex, quantity, priceKurus: priceKurus ?? 0, city, title, description, whatsapp, phone } };
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

export { UNKNOWN_SEX };
