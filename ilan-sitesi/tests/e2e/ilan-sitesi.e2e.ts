import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { photo, register, uniqueEmail, PASSWORD, webglReady, axeViolations } from './helpers.ts';

test.describe('hesap', () => {
  test('kayıt, çıkış ve giriş', async ({ page }) => {
    const email = await register(page);
    await expect(page.getByRole('button', { name: 'Çıkış' })).toBeVisible();
    await page.getByRole('button', { name: 'Çıkış' }).click();
    await expect(page.getByRole('link', { name: 'Giriş' })).toBeVisible();
    await page.goto('/giris');
    await page.getByLabel('E-posta').fill(email);
    await page.getByLabel('Parola').fill('yanlis-parola-1');
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page.getByRole('alert')).toContainText('hatalı');
    await page.getByLabel('E-posta').fill(email);
    await page.getByLabel('Parola').fill(PASSWORD);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Çıkış' })).toBeVisible();
  });
  test('girişsiz ilan ver sayfası girişe yönlendirir', async ({ page }) => {
    await page.goto('/ilan/yeni');
    await expect(page).toHaveURL(/\/giris\?next=/);
  });
});

test.describe('ilan oluşturma ve 3B', () => {
  test('fotoğraf olmadan yayınlanamaz; fotoğrafla yayınlanır ve detayda 3B etiketi görünür', async ({ page }) => {
    await register(page);
    await page.goto('/ilan/yeni');
    await page.getByLabel('Tür', { exact: true }).selectOption('betta');
    await page.getByLabel('Adet', { exact: true }).fill('2');
    await page.getByLabel('Fiyat (₺)').fill('350');
    await page.getByLabel('Şehir', { exact: true }).selectOption('Ankara');
    await page.getByLabel('Açıklama', { exact: true }).fill('Sağlıklı iki erkek betta, ayrı kavanozlarda büyütüldü.');
    await page.getByLabel('WhatsApp numarası').fill('0532 123 45 67');
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    // fotoğraf yok: sayfa değişmez
    await expect(page).toHaveURL(/\/ilan\/yeni$/);
    await expect(page.locator('#foto')).toBeFocused();
    expect(await page.locator('#foto').evaluate((e: HTMLInputElement) => e.validationMessage)).not.toBe('');

    await page.setInputFiles('#foto', [photo(1), photo(2)]);
    await expect(page.locator('#onizleme img')).toHaveCount(2);
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page).toHaveURL(/\/ilan\/\d+/);
    await expect(page.getByText('İlanınız yayınlandı.')).toBeVisible();
    await expect(page.getByTestId('etiket-3b')).toContainText(/Temsili 3B görünüm — gerçek balık fotoğrafları (solda|yukarıda)/);
    await expect(page.locator('.photo-main img')).toBeVisible();
    await expect(page.locator('.thumb')).toHaveCount(2);
    await webglReady(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    await expect(page.getByRole('link', { name: "WhatsApp'ta yaz" })).toHaveAttribute('href', /^https:\/\/wa\.me\/905321234567/);
    await expect(page.getByText('+90 532 123 45 67')).toBeVisible();
  });

  test('sunucu da fotoğrafsız formu reddeder (tarayıcı doğrulaması atlanarak)', async ({ page }) => {
    await register(page);
    await page.goto('/ilan/yeni');
    await page.evaluate(() => { const f = document.querySelector('form.listing-form') as HTMLFormElement; f.noValidate = true; document.getElementById('foto')!.removeAttribute('required'); f.addEventListener('submit', (e) => e.stopImmediatePropagation(), true); });
    await page.getByLabel('Tür', { exact: true }).selectOption('neon');
    await page.getByLabel('Fiyat (₺)').fill('8');
    await page.getByLabel('Şehir', { exact: true }).selectOption('İzmir');
    await page.getByLabel('Açıklama', { exact: true }).fill('Yirmi adet neon tetra, sürü hâlinde.');
    await page.getByRole('button', { name: 'İlanı yayınla' }).click();
    await expect(page.getByRole('alert')).toContainText('en az bir gerçek fotoğraf');
    await expect(page).toHaveURL(/\/ilan\/yeni$/);
  });

  test('3B önizleme tür, şekil, renk ve cinsiyete göre güncellenir', async ({ page }) => {
    await register(page);
    await page.goto('/ilan/yeni');
    const stage = page.locator('#sahne');
    await page.getByLabel('Tür', { exact: true }).selectOption('lepistes');
    await webglReady(page);
    const m1 = await stage.getAttribute('data-model');
    expect(m1).toMatch(/^lepistes\|/);
    await page.getByLabel('Şekil (yüzgeç / vücut biçimi)').selectOption('delta');
    await expect(stage).not.toHaveAttribute('data-model', m1!);
    const m2 = await stage.getAttribute('data-model');
    expect(m2).toContain('|delta|');
    await page.getByLabel('Renk', { exact: true }).selectOption({ index: 3 });
    await expect(stage).not.toHaveAttribute('data-model', m2!);
    const m3 = await stage.getAttribute('data-model');
    await page.getByLabel('Cinsiyet', { exact: true }).selectOption('disi');
    await expect(stage).not.toHaveAttribute('data-model', m3!);
    await expect(page.locator('#onizleme-ozet')).toContainText('Lepistes');
    // başka tür
    await page.getByLabel('Tür', { exact: true }).selectOption('japon');
    await expect(stage).toHaveAttribute('data-model', /^japon\|/);
    await expect(page.locator('#renk-kutu select option').first()).not.toHaveText('Önce tür seçin');
    // 'diğer': model yok, açık not
    await page.getByLabel('Tür', { exact: true }).selectOption('diger');
    await expect(page.locator('#diger-kutu')).toBeVisible();
    await expect(page.locator('#durum')).toContainText('3B model yok');
  });

  test('WebGL yoksa yedek metin gösterilir', async ({ page }) => {
    await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : (o as Function).call(this, t, ...a); } as typeof o; });
    await register(page);
    await page.goto('/ilan/yeni');
    await page.getByLabel('Tür', { exact: true }).selectOption('betta');
    await expect(page.locator('#yedek')).toBeVisible();
    await expect(page.locator('#yedek')).toContainText('3B önizleme açılamadı');
  });
});

test.describe('arama ve ilan detayı (örnek veriyle)', () => {
  test('tür, şekil, renk, şehir ve fiyat filtreleri; listede gerçek fotoğraf var, 3B yok', async ({ page }) => {
    await page.goto('/ilanlar');
    const total = Number((await page.getByTestId('sonuc-sayisi').innerText()).match(/\d+/)![0]);
    expect(total).toBeGreaterThanOrEqual(16);
    await expect(page.locator('.card canvas')).toHaveCount(0);
    expect(await page.locator('.card .card-photo img').count()).toBeGreaterThan(0);
    await expect(page.locator('.card-photo img').first()).toHaveJSProperty('complete', true);

    await page.getByLabel('Tür', { exact: true }).selectOption('betta');
    await expect(page.getByLabel('Şekil')).toBeEnabled();
    await page.getByRole('button', { name: 'Ara' }).click();
    await expect(page).toHaveURL(/tur=betta/);
    await expect(page.getByTestId('sonuc-sayisi')).toHaveText(/^\d+ ilan bulundu$/);
    expect(Number((await page.getByTestId('sonuc-sayisi').innerText()).match(/\d+/)![0])).toBeGreaterThanOrEqual(2);
    for (const t of await page.locator('.card-meta').allInnerTexts()) expect(t).toMatch(/^Betta/);

    await page.getByLabel('Şekil').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Ara' }).click();
    await expect(page).toHaveURL(/sekil=/);
    expect(Number((await page.getByTestId('sonuc-sayisi').innerText()).match(/\d+/)![0])).toBeGreaterThanOrEqual(0);

    await page.goto('/ilanlar?sehir=Ankara');
    await expect(page.locator('.card')).not.toHaveCount(0);
    for (const t of await page.locator('.card-row .muted').allInnerTexts()) expect(t).toContain('Ankara');

    await page.goto('/ilanlar?min=1000&max=5000&sirala=ucuz');
    const prices = (await page.locator('.card .price').allInnerTexts()).map((s) => parseFloat(s.replace(/\./g, '').replace(',', '.')));
    expect(prices.length).toBeGreaterThan(0);
    for (const p of prices) { expect(p).toBeGreaterThanOrEqual(1000); expect(p).toBeLessThanOrEqual(5000); }
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    await page.goto('/ilanlar?tur=vatoz&sehir=Van');
    await expect(page.getByText('Bu ölçütlere uyan ilan bulunamadı')).toBeVisible();
  });

  test('karttan detaya: fotoğraflar, 3B etiketi, 3B model, örnek ilan notu', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/ilanlar?tur=lepistes');
    await page.locator('.card-link').first().click();
    await expect(page).toHaveURL(/\/ilan\/\d+/);
    await expect(page.getByTestId('etiket-3b')).toContainText('Temsili 3B görünüm — gerçek balık fotoğrafları');
    await expect(page.getByText('Örnek ilan — gerçek bir satış değildir')).toBeVisible();
    await expect(page.locator('.photo-main img')).toBeVisible();
    await webglReady(page);
    // klavye ile erişilebilir görünüm düğmeleri
    await page.getByRole('button', { name: 'Üst', exact: true }).click();
    await page.locator('#cv').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#cv')).toBeFocused();
    expect(errors, 'CSP / konsol hatası olmamalı').toEqual([]);
  });

  test("'diğer' tür ilanında 3B model yoktur", async ({ page }) => {
    await page.goto('/ilanlar?tur=diger');
    await page.locator('.card-link').first().click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByText('Bu tür için 3B model yok')).toBeVisible();
  });
});

test.describe('şikayet ve yönetim', () => {
  test('şikayet et: girişsiz giriş ister; girişliyken kaydedilir; yönetici sayfasında görünür', async ({ page, browser }) => {
    await page.goto('/ilanlar?tur=molly');
    await page.locator('.card-link').first().click();
    const url = page.url();
    await expect(page.getByRole('link', { name: 'Şikayet etmek için giriş yapın' })).toBeVisible();
    await register(page);
    await page.goto(url);
    await page.getByText('Şikayet et', { exact: true }).click();
    await page.getByLabel('Neden').selectOption('sahte');
    const note = `E2E not ${Date.now()}`;
    await page.getByLabel('Ek açıklama (isteğe bağlı)').fill(note);
    await page.getByRole('button', { name: 'Şikayeti gönder' }).click();
    await expect(page.getByText('Şikayetiniz alındı')).toBeVisible();
    await page.goto(url);
    await expect(page.getByText('Bu ilanı daha önce şikayet ettiniz.')).toBeVisible();

    // normal kullanıcı yönetici sayfasını göremez
    expect((await page.goto('/admin/raporlar'))!.status()).toBe(404);
    // yönetici: hesap normal kayıtla açılır, bayrak yalnızca yerel CLI ile verilir (kayıt tek başına yönetici yapmaz)
    const ctx = await browser.newContext({ baseURL: page.url().split('/ilan')[0] });
    const admin = await ctx.newPage();
    await register(admin, 'yonetici@example.test').catch(async () => {
      await admin.goto('/giris'); await admin.getByLabel('E-posta').fill('yonetici@example.test'); await admin.getByLabel('Parola').fill(PASSWORD); await admin.getByRole('button', { name: 'Giriş yap' }).click();
    });
    execFileSync('node', ['scripts/make-admin.ts', 'yonetici@example.test'], { env: { ...process.env, DATA_DIR: './data/e2e' } });
    await admin.goto('/admin/raporlar');
    await expect(admin.getByRole('heading', { name: 'Şikayetler' })).toBeVisible();
    await expect(admin.getByText(note)).toBeVisible();
    await ctx.close();
  });
});

test.describe('satıcı sayfası ve yerleşim', () => {
  test('satıcı sayfası ilanları ve boş akvaryum durumunu gösterir', async ({ page }) => {
    await page.goto('/ilanlar');
    await page.locator('.card-link').first().click();
    await page.locator('.seller a[href^="/satici/"]').click();
    await expect(page.getByRole('heading', { name: 'Akvaryum', exact: true })).toBeVisible();
    await expect(page.locator('.card')).not.toHaveCount(0);
  });

  test('yatay kaydırma yok (mobil dahil)', async ({ page }) => {
    for (const p of ['/', '/ilanlar', '/giris', '/kayit']) {
      await page.goto(p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    }
  });

})

test.describe('erişilebilirlik (axe)', () => {
  test.use({ bypassCSP: true }); // axe'in sayfaya eklenmesi için; uygulamanın CSP'si diğer testlerde açıktır
  for (const [ad, path] of [['ana sayfa', '/'], ['ilan listesi', '/ilanlar?tur=betta'], ['giriş', '/giris'], ['kayıt', '/kayit']] as const) {
    test(`axe: ${ad}`, async ({ page }) => {
      await page.goto(path);
      expect(await axeViolations(page)).toEqual([]);
    });
  }
  test('axe: ilan detayı (3B ile) ve ilan formu', async ({ page }) => {
    await page.goto('/ilanlar?tur=betta');
    await page.locator('.card-link').first().click();
    await webglReady(page);
    expect(await axeViolations(page)).toEqual([]);
    await register(page);
    await page.goto('/ilan/yeni');
    await page.getByLabel('Tür', { exact: true }).selectOption('lepistes');
    await webglReady(page);
    expect(await axeViolations(page)).toEqual([]);
  });
});
