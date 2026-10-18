import { describe, it, expect } from 'vitest';
import { validateListing, validateRegister, validateReport, normalizePhone, parsePriceKurus, formatPrice, formatPhone, formatPhoneLocal } from '../../server/validation.ts';
import { CATALOG } from '../../shared/catalog.ts';

const good = { species: 'lepistes', form: 'delta', variant: 'mozaik', sex: 'erkek', quantity: '3', price: '120', city: 'İstanbul', description: 'Sağlıklı, evde üretim balıklar.' };

describe('katalog', () => {
  it('katalog türleri ve geçerli kimlikler', () => { expect(CATALOG.length).toBeGreaterThanOrEqual(12); expect(new Set(CATALOG.map((s) => s.id)).size).toBe(CATALOG.length); expect(CATALOG.every((s) => s.variants.length > 0)).toBe(true); });
});

describe('validateListing', () => {
  it('geçerli ilanı kabul eder ve başlığı üretir', () => {
    const r = validateListing(good);
    expect(r.ok).toBe(true);
    expect(r.value).toMatchObject({ speciesId: 'lepistes', formId: 'delta', variantId: 'mozaik', priceKurus: 12000, quantity: 3 });
    expect(r.value!.title).toContain('Lepistes');
  });
  it('bilinmeyen tür / şekil / renk / cinsiyeti reddeder', () => {
    expect(validateListing({ ...good, species: 'kopekbaligi' }).errors.species).toBeTruthy();
    expect(validateListing({ ...good, form: 'yok' }).errors.form).toBeTruthy();
    expect(validateListing({ ...good, variant: 'yok' }).errors.variant).toBeTruthy();
    expect(validateListing({ ...good, sex: 'x' }).errors.sex).toBeTruthy();
  });
  it('şekil başka türe ait ise reddeder', () => { expect(validateListing({ ...good, form: 'plakat' }).errors.form).toBeTruthy(); });
  it('şekli olmayan türde şekil gerekmez', () => {
    const r = validateListing({ ...good, species: 'karides', form: '', variant: 'dogal', sex: 'bilinmiyor' });
    expect(r.ok).toBe(true); expect(r.value!.formId).toBeNull();
  });
  it("'diğer' tür serbest ad ister, 3B alanı yok sayar", () => {
    expect(validateListing({ ...good, species: 'diger', form: '', variant: '' }).errors.speciesOther).toBeTruthy();
    const r = validateListing({ ...good, species: 'diger', speciesOther: 'Zebra danio', form: 'x', variant: 'y', sex: 'bilinmiyor' });
    expect(r.ok).toBe(true); expect(r.value).toMatchObject({ formId: null, variantId: null, speciesOther: 'Zebra danio' });
  });
  it('adet, fiyat, şehir, açıklama sınırları', () => {
    expect(validateListing({ ...good, quantity: '0' }).errors.quantity).toBeTruthy();
    expect(validateListing({ ...good, quantity: '1.5' }).errors.quantity).toBeTruthy();
    expect(validateListing({ ...good, price: 'abc' }).errors.price).toBeTruthy();
    expect(validateListing({ ...good, price: '0' }).errors.price).toBeTruthy();
    expect(validateListing({ ...good, city: 'Atlantis' }).errors.city).toBeTruthy();
    expect(validateListing({ ...good, description: 'kısa' }).errors.description).toBeTruthy();
  });
  it('kontrol karakterlerini temizler, aşırı uzun metni keser', () => {
    const r = validateListing({ ...good, description: 'a\u0000b'.repeat(10) + 'x'.repeat(5000) });
    expect(r.value!.description).not.toContain('\u0000'); expect(r.value!.description.length).toBeLessThanOrEqual(2000);
  });
  it('telefon biçimlerini normalleştirir', () => {
    expect(validateListing({ ...good, whatsapp: '0532 123 45 67' }).value!.whatsapp).toBe('905321234567');
    expect(validateListing({ ...good, whatsapp: '12' }).errors.whatsapp).toBeTruthy();
  });
});

describe('yardımcılar', () => {
  it('normalizePhone', () => {
    expect(normalizePhone('+90 (532) 123-45-67')).toBe('905321234567');
    expect(normalizePhone('5321234567')).toBe('905321234567');
    expect(normalizePhone('0090 532 123 45 67')).toBe('905321234567');
    expect(normalizePhone('abc')).toBeNull(); expect(normalizePhone('123')).toBeNull();
    expect(formatPhone('905321234567')).toBe('+90 532 123 45 67');
  });
  it('parsePriceKurus', () => {
    expect(parsePriceKurus('250')).toBe(25000); expect(parsePriceKurus('249,90')).toBe(24990);
    expect(parsePriceKurus('1.250,5')).toBe(125050); expect(parsePriceKurus('1.250')).toBe(125000);
    expect(parsePriceKurus('12 ₺')).toBe(1200); expect(parsePriceKurus('-5')).toBeNull(); expect(parsePriceKurus('1e3')).toBeNull();
    expect(formatPrice(25000)).toMatch(/^250 ₺$/);
  });
});

describe('validateRegister / validateReport', () => {
  it('kayıt', () => {
    expect(validateRegister({ email: 'A@B.com', password: 'sekizkarakter', displayName: 'Ali' }).value!.email).toBe('a@b.com');
    expect(validateRegister({ email: 'yanlis', password: 'sekizkarakter', displayName: 'Ali' }).errors.email).toBeTruthy();
    expect(validateRegister({ email: 'a@b.com', password: 'kısa', displayName: 'Ali' }).errors.password).toBeTruthy();
    expect(validateRegister({ email: 'a@b.com', password: 'sekizkarakter', password2: 'baska', displayName: 'Ali' }).errors.password2).toBeTruthy();
    expect(validateRegister({ email: 'a@b.com', password: 'sekizkarakter', displayName: 'A' }).errors.displayName).toBeTruthy();
  });
  it('şikayet nedeni', () => {
    expect(validateReport({ reason: 'sahte' }).ok).toBe(true);
    expect(validateReport({ reason: 'x' }).ok).toBe(false);
  });
});

describe('telefon biçimi gidiş-dönüş', () => {
  it('formda dostça biçim gösterilir ve geri normalleştirilir', () => {
    expect(formatPhoneLocal('905550000001')).toBe('0555 000 00 01');
    for (const n of ['905550000001', '905321234567']) expect(normalizePhone(formatPhoneLocal(n))).toBe(n);
  });
});
