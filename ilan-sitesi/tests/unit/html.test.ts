import { describe, it, expect } from 'vitest';
import { html, raw, esc } from '../../server/views/html.ts';
import { detailPage } from '../../server/views/pages.ts';
import { devAssets } from '../../server/assets.ts';
import type { Listing } from '../../server/db.ts';

describe('çıktı kaçışlama', () => {
  it('değerler kaçışlanır, raw ve iç içe şablonlar korunur', () => {
    expect(html`<p>${'<script>alert(1)</script>'}</p>`.value).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(html`<b>${raw('<i>x</i>')}</b>`.value).toBe('<b><i>x</i></b>');
    expect(html`${[html`<i>${'&'}</i>`, 'a"b']}`.value).toBe('<i>&amp;</i>a&quot;b');
    expect(esc(`'"<>&`)).toBe('&#39;&quot;&lt;&gt;&amp;');
  });
});

const listing = (o: Partial<Listing> = {}): Listing => ({ id: 1, user_id: 2, title: '<img src=x onerror=alert(1)>', species_id: 'betta', species_other: null, form_id: 'plakat', variant_id: 'mavi', sex: 'erkek', quantity: 1, price_kurus: 10000, city: 'Ankara', description: '<script>x</script>', is_demo: 0, flagged: 0, status: 'active', created_at: 0, seller_name: 'S', seller_whatsapp: '905550000000', seller_phone: null, first_photo: null, ...o });
const ctx = { csrf: 't', assets: devAssets(), isAdmin: false };
const photos = [{ id: 1, listing_id: 1, file: 'a'.repeat(32) + '.png', mime: 'image/png', bytes: 1, position: 0 }];

describe('ilan detay sayfası', () => {
  it("3B kullanan her ilanda 'temsili 3B görünüm' etiketi bulunur", () => {
    const out = detailPage(ctx, { l: listing(), photos, alreadyReported: false });
    expect(out).toMatch(/Temsili 3B görünüm — gerçek balık fotoğrafları <span class="w-wide">solda<\/span>/);
    expect(out).toContain('data-testid="etiket-3b"');
    expect(out).toContain('<canvas'); expect(out).toContain('aria-label="Betta için temsili 3B model');
  });
  it("3B olmayan ('diğer') ilanda model ve etiket yok, açık not var", () => {
    const out = detailPage(ctx, { l: listing({ species_id: 'diger', species_other: 'Danio', form_id: null, variant_id: null }), photos, alreadyReported: false });
    expect(out).not.toContain('<canvas'); expect(out).toContain('Bu tür için 3B model yok');
  });
  it('kullanıcı içeriği kaçışlanır', () => {
    const out = detailPage(ctx, { l: listing(), photos, alreadyReported: false });
    expect(out).not.toContain('<img src=x onerror'); expect(out).not.toContain('<script>x</script>');
  });
  it('WhatsApp bağlantısı wa.me ve düz metin numara', () => {
    const out = detailPage(ctx, { l: listing(), photos, alreadyReported: false });
    expect(out).toContain('https://wa.me/905550000000'); expect(out).toContain('+90 555 000 00 00');
  });
  it('boş kutu regresyonu: hiçbir durumda içeriksiz şikayet bölümü çizilmez', () => {
    const base = { l: listing(), photos };
    const owner = { ...ctx, user: { id: 2 } as never }, other = { ...ctx, user: { id: 9 } as never };
    const variants = [
      detailPage(owner, { ...base, alreadyReported: false }),
      detailPage(owner, { ...base, alreadyReported: true }),
      detailPage(other, { ...base, alreadyReported: true }),
      detailPage(other, { ...base, alreadyReported: false }),
      detailPage(ctx, { ...base, alreadyReported: false }),
      detailPage(owner, { ...base, alreadyReported: false, reported: true }),
    ];
    for (const out of variants) expect(out).not.toMatch(/<section class="report"[^>]*>\s*<\/section>/);
    expect(variants[0]).not.toContain('class="report"'); // sahibi kendi ilanını şikayet edemez: bölüm yok
    expect(variants[2]).toContain('daha önce şikayet ettiniz');
    expect(variants[3]).toContain('Şikayet et'); expect(variants[4]).toContain('giriş yapın');
  });
  it('satır içi olay işleyicisi yok (CSP script-src self ile uyumlu); kaldırma onayı data-confirm ile', () => {
    const out = detailPage({ ...ctx, user: { id: 2 } as never }, { l: listing(), photos, alreadyReported: false });
    expect(out).not.toMatch(/\son[a-z]+="/); expect(out).toContain('data-confirm=');
  });
});
