import { test, expect, type Page } from '@playwright/test';
import { register, photo, axeViolations } from './helpers.ts';

const isMobile = (info: { project: { name: string } }) => info.project.name === 'mobil';

async function fillCommon(page: Page, o: { tur: string; price?: string; lnum?: string; lunknown?: boolean; grade?: string }) {
  await page.getByLabel('Tür', { exact: true }).selectOption(o.tur);
  await page.getByLabel('Fiyat (₺)').fill(o.price ?? '100');
  await page.getByLabel('Şehir', { exact: true }).selectOption('Ankara');
  await page.getByLabel('İlçe', { exact: true }).fill('Çankaya');
  await page.getByLabel('Açıklama', { exact: true }).fill('Sağlıklı balıklar, evde üretim; elden teslim.');
  if (o.lnum !== undefined) await page.getByLabel(/^L-numarası/).fill(o.lnum);
  if (o.lunknown) await page.getByLabel(/L-numarasını bilmiyorum/).check();
  if (o.grade) await page.getByLabel(/^Grade/).selectOption(o.grade);
}

test.describe('türe özel alanlar', () => {
  test('liste: seed pleco L144 rozetli; L-numarası filtresi, çip ve kaldırma', async ({ page }, info) => {
    await page.goto('/ilanlar?tur=pleco');
    if (isMobile(info)) await page.locator('.filter-toggle').click();
    await expect(page.getByLabel('L-numarası')).toBeVisible();
    await page.getByLabel('L-numarası').fill('144');
    await page.getByRole('button', { name: 'Ara' }).click();
    await expect(page).toHaveURL(/l=144/);
    await expect(page.locator('.filter-chips')).toContainText('L-numarası: L144');
    await expect(page.locator('.card [data-testid=rozet-ozel]').first()).toHaveText('L144');
    await page.goto('/ilanlar?tur=pleco&l=L999');
    await expect(page.getByTestId('sonuc-sayisi')).toHaveText('0 ilan bulundu');
    await page.goto('/ilanlar?tur=pleco&l=144');
    await page.locator('.filter-chips .chip-x', { hasText: 'L-numarası' }).click();
    await expect(page).not.toHaveURL(/l=/);
    expect(await axeViolations(page)).toEqual([]);
    await page.goto('/ilanlar?tur=karides&grade=sakura');
    await expect(page.locator('.filter-chips')).toContainText('Grade: Sakura');
    await expect(page.locator('.card [data-testid=rozet-ozel]').first()).toHaveText('Grade: Sakura');
    expect(await axeViolations(page)).toEqual([]);
  });

  test('form: alanlar türe göre görünür; pleco L-numarası + grade ilan detayında; hatalı L-numarası reddedilir', async ({ page }, info) => {
    await register(page);
    await page.goto('/ilan/yeni');
    await expect(page.locator('#ozel-l')).toBeHidden(); await expect(page.locator('#ozel-grade')).toBeHidden();
    await page.getByLabel('Tür', { exact: true }).selectOption('pleco');
    await expect(page.locator('#ozel-l')).toBeVisible(); await expect(page.locator('#ozel-grade')).toBeHidden();
    await page.getByLabel('Tür', { exact: true }).selectOption('karides');
    await expect(page.locator('#ozel-grade')).toBeVisible(); await expect(page.locator('#ozel-l')).toBeHidden();
    const opts = await page.locator('#grade option').allInnerTexts();
    expect(opts).toContain('Fire Red'); expect(opts.some((o) => /Blue Velvet.*tutarsız/.test(o))).toBe(true);
    await page.screenshot({ path: `test-results/tb-form-grade-${info.project.name}.png`, fullPage: true });
    expect(await axeViolations(page)).toEqual([]);
    await fillCommon(page, { tur: 'karides', grade: 'fire-red' });
    await page.setInputFiles('#foto', [photo(1)]);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page.getByTestId('rozet-ozel')).toHaveText('Grade: Fire Red');
    await expect(page.locator('.facts')).toContainText('satıcı beyanı');
    // pleco: geçersiz L
    await page.goto('/ilan/yeni');
    await fillCommon(page, { tur: 'pleco', lnum: 'L12345' });
    await page.setInputFiles('#foto', [photo(2)]);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page.locator('#lnum-err')).toBeVisible();
    await expect(page.locator('#lnum')).toHaveAttribute('aria-invalid', 'true');
    expect(await axeViolations(page)).toEqual([]);
    await page.getByLabel(/^L-numarası/).fill('L 46');
    await page.getByLabel(/L-numarasını bilmiyorum/).check();
    await page.setInputFiles('#foto', [photo(2)]);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page.getByTestId('rozet-ozel')).toHaveText('L46 (doğrulanmamış)');
    await page.screenshot({ path: `test-results/tb-detay-l-${info.project.name}.png` });
    expect(await axeViolations(page)).toEqual([]);
  });
});

test.describe('ilanı kopyala', () => {
  test('profilden ve detaydan kopyala: alanlar ön dolu, fotoğraf boş ve zorunlu, adet/fiyat düzenlenir', async ({ page }, info) => {
    const email = await register(page);
    await page.goto('/ilan/yeni');
    await fillCommon(page, { tur: 'pleco', lnum: 'L134', price: '300' });
    await page.getByLabel('Adet', { exact: true }).fill('2');
    await page.setInputFiles('#foto', [photo(1)]);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page).toHaveURL(/\/ilan\/\d+/);
    const detailUrl = page.url().replace(/\?.*/, '');
    // detaydan
    await page.getByTestId('kopyala').click();
    await expect(page).toHaveURL(/\/ilan\/yeni\?kopya=\d+/);
    await expect(page.getByTestId('kopya-uyari')).toContainText('Fotoğraflar kopyalanmaz');
    await expect(page.getByLabel('Tür', { exact: true })).toHaveValue('pleco');
    await expect(page.getByLabel(/^L-numarası/)).toHaveValue('L134');
    await expect(page.getByLabel('İlçe', { exact: true })).toHaveValue('Çankaya');
    await expect(page.getByLabel('Açıklama', { exact: true })).toHaveValue(/evde üretim/);
    await expect(page.locator('#foto')).toHaveValue('');
    await page.screenshot({ path: `test-results/tb-kopya-${info.project.name}.png`, fullPage: true });
    expect(await axeViolations(page)).toEqual([]);
    // fotoğrafsız yayınlanamaz
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page).toHaveURL(/\/ilan\/yeni\?kopya/);
    // profilden de açılır
    await page.goto('/ilan/yeni');
    const uid = (await page.locator('.nav-user').getAttribute('href'))!;
    await page.goto(uid);
    await expect(page.getByTestId('sahip-araclari')).toBeVisible();
    await page.getByRole('link', { name: /^İlanı kopyala: / }).first().click();
    await expect(page.getByLabel(/^L-numarası/)).toHaveValue('L134');
    await page.getByLabel('Adet', { exact: true }).fill('5');
    await page.getByLabel('Fiyat (₺)').fill('450');
    await page.setInputFiles('#foto', [photo(7)]);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page).not.toHaveURL(/kopya/);
    await expect(page.getByTestId('rozet-ozel')).toHaveText('L134');
    await expect(page.locator('.detail-price')).toContainText('450');
    expect(detailUrl).not.toBe(page.url().replace(/\?.*/, ''));
    // başka kullanıcı kopyalayamaz
    const id = /kopya=(\d+)/.exec(detailUrl) ?? /\/ilan\/(\d+)/.exec(detailUrl);
    const ctx2 = await page.context().browser()!.newContext({ baseURL: info.project.use.baseURL as string });
    const p2 = await ctx2.newPage(); await register(p2);
    expect((await p2.goto(`/ilan/yeni?kopya=${id![1]}`))!.status()).toBe(404);
    await ctx2.close(); void email;
  });
});

test.describe('toplu giriş / stok', () => {
  test('tablo: adet/fiyat düzenle, satıldı işaretle (herkese açık sayfadan kalkar), yeniden aktif; foto notu', async ({ page, browser }, info) => {
    await register(page);
    for (const n of [1, 2]) {
      await page.goto('/ilan/yeni');
      await fillCommon(page, { tur: 'neon', price: String(10 * n) });
      await page.getByLabel('Adet', { exact: true }).fill(String(n * 5));
      await page.setInputFiles('#foto', [photo(n)]);
      await page.getByRole('button', { name: 'İlanı yayınla' }).click();
      await expect(page).toHaveURL(/\/ilan\/\d+/);
    }
    const profile = (await page.locator('.nav-user').getAttribute('href'))!;
    await page.goto(profile);
    await page.getByRole('link', { name: 'Toplu ilan / stok' }).click();
    await expect(page).toHaveURL(/\/profil\/toplu$/);
    await expect(page.getByTestId('toplu-foto-notu')).toContainText('fotoğraf');
    const rows = page.locator('tr[data-row]');
    await expect(rows).toHaveCount(2);
    await page.screenshot({ path: `test-results/tb-toplu-${info.project.name}.png`, fullPage: true });
    expect(await axeViolations(page)).toEqual([]);
    const firstId = await rows.nth(0).getAttribute('data-row');
    const secondId = await rows.nth(1).getAttribute('data-row');
    await page.locator(`#q_${firstId}`).fill('42');
    await page.locator(`#p_${firstId}`).fill('77,50');
    await page.locator(`#s_${secondId}`).selectOption('satildi');
    await page.getByRole('button', { name: 'Tüm değişiklikleri kaydet' }).click();
    await expect(page.getByTestId('toplu-sonuc')).toContainText('2 ilan güncellendi');
    await expect(page.locator(`#q_${firstId}`)).toHaveValue('42');
    await expect(page.locator(`#s_${secondId}`)).toHaveValue('satildi');
    // herkese açık
    const anon = await browser.newContext({ baseURL: info.project.use.baseURL as string }); const ap = await anon.newPage();
    expect((await ap.goto(`/ilan/${secondId}`))!.status()).toBe(404);
    await ap.goto(profile);
    await expect(ap.locator(`a[href="/ilan/${secondId}"]`)).toHaveCount(0);
    await expect(ap.locator(`a[href="/ilan/${firstId}"]`).first()).toBeVisible();
    await ap.goto('/ilanlar?tur=neon'); await expect(ap.locator(`a[href="/ilan/${secondId}"]`)).toHaveCount(0);
    // kısmi hata
    await page.locator(`#q_${firstId}`).fill('0');
    await page.locator(`#s_${secondId}`).selectOption('aktif');
    await page.getByRole('button', { name: 'Tüm değişiklikleri kaydet' }).click();
    await expect(page.getByTestId('toplu-sonuc')).toContainText('1 ilan güncellendi, 1 satırda hata');
    await expect(page.locator(`#q_${firstId}-err`)).toBeVisible();
    await page.screenshot({ path: `test-results/tb-toplu-hata-${info.project.name}.png`, fullPage: true });
    expect(await axeViolations(page)).toEqual([]);
    expect((await ap.goto(`/ilan/${secondId}`))!.status()).toBe(200); // yeniden aktif
    await anon.close();
  });
});

test.describe('dükkân bilgisi', () => {
  test('ayarlardan kaydet, herkese açık satıcı sayfasında düz metin', async ({ page, browser }, info) => {
    await register(page);
    const profile = (await page.locator('.nav-user').getAttribute('href'))!;
    await page.goto(profile);
    await page.getByRole('link', { name: 'Dükkân bilgisi' }).click();
    await page.getByLabel(/^Dükkân adı/).fill('Mavi Su Akvaryum');
    await page.getByLabel(/^Açık adres/).fill('Bağdat Cd. No 12, Kadıköy');
    await page.getByLabel(/^Çalışma saatleri/).fill('Hafta içi 10:00–19:00');
    await page.getByLabel(/^Kısa tanıtım/).fill('Canlı balık, bitki ve malzeme.');
    expect(await axeViolations(page)).toEqual([]);
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Dükkân bilgisi kaydedildi.')).toBeVisible();
    const anon = await browser.newContext({ baseURL: info.project.use.baseURL as string }); const ap = await anon.newPage();
    await ap.goto(profile);
    await expect(ap.getByTestId('dukkan-bilgisi')).toContainText('Bağdat Cd. No 12');
    await expect(ap.getByTestId('dukkan-bilgisi')).toContainText('Mavi Su Akvaryum');
    await ap.screenshot({ path: `test-results/tb-dukkan-${info.project.name}.png`, fullPage: true });
    expect(await axeViolations(ap)).toEqual([]);
    await anon.close();
  });
});
