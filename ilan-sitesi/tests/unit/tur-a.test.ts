import { describe, it, expect } from 'vitest';
import { unitPriceKurus, unitPriceText, relativeDay, absoluteDate } from '../../shared/listing-format.ts';
import { filterChips, narrowOptions } from '../../shared/filters.ts';
import { decide3d } from '../../shared/lazy3d.ts';
import { buildSearch, SORTS } from '../../server/search.ts';
import { listingCard, registerPage, detailPage, listingsPage } from '../../server/views/pages.ts';
import { devAssets } from '../../server/assets.ts';
import type { Listing } from '../../server/db.ts';

const DAY = 86_400_000;
const L = (o: Partial<Listing> = {}): Listing => ({ id: 5, user_id: 2, title: 'Test', species_id: 'lepistes', species_other: null, form_id: 'delta', variant_id: null, sex: 'erkek', quantity: 3, price_kurus: 12000, city: 'Ankara', district: null, description: 'x', is_demo: 0, flagged: 0, status: 'active', created_at: Date.UTC(2026, 9, 10, 12), seller_name: 'S', seller_whatsapp: null, seller_phone: null, first_photo: 'a'.repeat(32) + '.png', ...o });
const ctx = { csrf: 't', assets: devAssets(), isAdmin: false };

describe('adet başı fiyat (türetilmiş)', () => {
  it('toplamı adede böler; adet 1 ise yok', () => {
    expect(unitPriceKurus(12000, 3)).toBe(4000); expect(unitPriceKurus(10000, 1)).toBeNull(); expect(unitPriceKurus(10000, 0)).toBeNull();
    expect(unitPriceText(12000, 3)).toBe('40 ₺'); expect(unitPriceText(10000, 12)).toBe('8,33 ₺');
    expect(unitPriceText(50000, 3)).toBe('167 ₺'); // 100 ₺ ve üstü tam liraya yuvarlanır
    expect(unitPriceText(10000, 1)).toBeNull();
  });
  it('kartta toplam fiyat korunur, tanesi yaklaşık olarak etiketlenir; adet 1 ise gösterilmez', () => {
    const out = listingCard(L()).value;
    expect(out).toContain('120 ₺'); expect(out).toContain('toplam'); expect(out).toContain('tanesi ≈ 40 ₺'); expect(out).toContain('yaklaşık, toplam fiyatın adede bölünmesi');
    expect(listingCard(L({ quantity: 1 })).value).not.toContain('tanesi');
  });
  it('detayda hem satıcı beyanı hem türetilmiş tanesi', () => {
    const out = detailPage(ctx, { l: L(), photos: [{ id: 1, listing_id: 5, file: 'a'.repeat(32) + '.png', mime: 'image/png', bytes: 1, position: 0 }], alreadyReported: false });
    expect(out).toContain('(toplam, 3 adet için satıcının beyanı)'); expect(out).toContain('tanesi ≈ 40 ₺'); expect(out).toContain('İlan tarihi');
  });
});

describe('göreli tarih', () => {
  const now = Date.UTC(2026, 9, 18, 12);
  it('bugün, dün, gün, hafta, ay, yıl', () => {
    expect(relativeDay(now - 3_600_000, now)).toBe('bugün'); expect(relativeDay(now + DAY, now)).toBe('bugün');
    expect(relativeDay(now - DAY, now)).toBe('dün'); expect(relativeDay(now - 3 * DAY, now)).toBe('3 gün önce');
    expect(relativeDay(now - 7 * DAY, now)).toBe('1 hafta önce'); expect(relativeDay(now - 15 * DAY, now)).toBe('2 hafta önce');
    expect(relativeDay(now - 60 * DAY, now)).toBe('2 ay önce'); expect(relativeDay(now - 400 * DAY, now)).toBe('1 yıl önce');
  });
  it('takvim günü Türkiye saatiyle: gece yarısını aşan fark dün sayılır', () => {
    expect(relativeDay(Date.UTC(2026, 9, 17, 20, 30), Date.UTC(2026, 9, 17, 22, 0))).toBe('dün'); // 23:30 ve 01:00 (UTC+3)
  });
  it('kartta göreli metin, title ve datetime ile mutlak tarih', () => {
    const out = listingCard(L(), Date.UTC(2026, 9, 13, 12)).value;
    expect(out).toContain('3 gün önce'); expect(out).toContain(`title="İlan tarihi: ${absoluteDate(L().created_at)}"`); expect(out).toContain('datetime="2026-10-10T12:00:00.000Z"');
  });
});

describe('sıralama', () => {
  it('adet başı fiyat beyaz listede ve SQL toplam/adet', () => {
    expect(Object.keys(SORTS)).toEqual(['yeni', 'ucuz', 'pahali', 'adet']);
    expect(SORTS.ucuz.ad).toBe('Fiyat (düşükten yükseğe)'); expect(SORTS.pahali.ad).toBe('Fiyat (yüksekten düşüğe)');
    expect(buildSearch({ sort: 'adet' }).orderBy).toContain('/ l.quantity ASC');
    expect(buildSearch({}).orderBy).toContain('created_at DESC');
  });
});

describe('filtre çipleri ve daraltma', () => {
  it('seçili filtreler çip olur; tür çipi şekil/renk bağımlılarını da kaldırır', () => {
    const c = filterChips({ species: 'lepistes', form: 'delta', city: 'Ankara', minPrice: '10', maxPrice: '50' });
    expect(c.map((x) => x.label)).toEqual(['Tür: Lepistes', 'Şekil: Delta', 'Şehir: Ankara', 'Fiyat: 10–50 ₺']);
    expect(c[0].drop).toEqual(['tur', 'sekil', 'renk', 'l', 'grade']); expect(c[3].drop).toEqual(['min', 'max']);
    expect(filterChips({})).toEqual([]); expect(filterChips({ species: '', city: ' ' })).toEqual([]);
    expect(filterChips({ minPrice: '5' })[0].label).toBe('En az 5 ₺');
  });
  it('tür değişince şekil ve renk o türe daralır', () => {
    const l = narrowOptions('lepistes'), b = narrowOptions('betta');
    expect(l.forms.length).toBeGreaterThan(0); expect(b.forms.map((x) => x.id)).not.toEqual(l.forms.map((x) => x.id));
    expect(narrowOptions('').forms).toEqual([]); expect(narrowOptions('diger').variants).toEqual([]);
  });
  it('liste sayfası: çipler kaldırma bağlantısı taşır, sonuç sayısı ve Ara düğmesi var', () => {
    const out = listingsPage(ctx, { params: { species: 'lepistes', form: 'delta', city: 'Ankara' }, result: { items: [L()], total: 1, page: 1, pages: 1 } });
    expect(out).toContain('1 ilan bulundu'); expect(out).toContain('<details class="filter-panel"'); expect(out).toContain('>Ara</button>');
    expect(out).toContain('href="/ilanlar?sehir=Ankara"'); // tür çipi kaldırılınca şekil de gider
    expect(out).toContain('href="/ilanlar?tur=lepistes&amp;sekil=delta"'); // şehir çipi
  });
});

describe('kart: doğrulanmalı rozeti ve fotoğraf yok', () => {
  it('uzun uyarı yerine kısa rozet; ad Türkçe önce', () => {
    const out = listingCard(L({ form_id: 'veiltail' })).value;
    expect(out).toContain('badge-verify'); expect(out).not.toContain('adı kaynaklarda tutarsız / doğrulanmalı'); expect(out).toMatch(/card-meta">Lepistes ·/);
    expect(listingCard(L()).value).not.toContain('badge-verify');
  });
  it('fotoğrafsız kartta nötr yer tutucu; fotoğraflıda lazy/async/boyut', () => {
    expect(listingCard(L({ first_photo: null })).value).toContain('Fotoğraf yok');
    expect(listingCard(L()).value).toMatch(/loading="lazy" decoding="async" width="400" height="300"/);
  });
});

describe('3B açılış kararı', () => {
  it('geniş ekran otomatik; dar ekran/veri tasarrufu dokunuşla; hatırlanan seçim otomatik', () => {
    const base = { wide: true, saveData: false, reducedData: false, remembered: false };
    expect(decide3d(base)).toBe('auto'); expect(decide3d({ ...base, wide: false })).toBe('tap');
    expect(decide3d({ ...base, saveData: true })).toBe('tap'); expect(decide3d({ ...base, reducedData: true })).toBe('tap');
    expect(decide3d({ ...base, wide: false, remembered: true })).toBe('auto');
  });
  it('sayfada poster ve düğme metni var', () => {
    const out = detailPage(ctx, { l: L(), photos: [{ id: 1, listing_id: 5, file: 'a'.repeat(32) + '.png', mime: 'image/png', bytes: 1, position: 0 }], alreadyReported: false });
    expect(out).toContain('Temsili 3B görünümü aç'); expect(out).toContain('Temsili 3B görünüm — gerçek balık fotoğrafları');
  });
});

describe('kayıt sayfası', () => {
  it('scrypt cümlesi yok; sade metin, parolayı göster, tekrar alanı yok', () => {
    const out = registerPage(ctx, { values: {}, errors: {} });
    expect(out).not.toMatch(/scrypt/i); expect(out).toContain('Parolanız güvenli biçimde saklanır'); expect(out).toContain('Parolayı göster');
    expect(out).toContain('ilanlara bakabilirsiniz'); expect(out).not.toContain('name="password2"');
  });
});

import { validateRegister } from '../../server/validation.ts';
describe('kayıt doğrulaması', () => {
  it('parola tekrarı alanı olmadan da geçerli; gönderilmişse ve uyuşmuyorsa hata', () => {
    expect(validateRegister({ email: 'a@b.co', password: 'sekizkarakter', displayName: 'Ali' }).ok).toBe(true);
    expect(validateRegister({ email: 'a@b.co', password: 'sekizkarakter', password2: 'x', displayName: 'Ali' }).errors.password2).toBeTruthy();
  });
});
