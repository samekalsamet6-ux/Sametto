import { test, expect, type Page } from '@playwright/test';
import { axeViolations, webglReady } from './helpers.ts';

const isMobile = (info: { project: { name: string } }) => info.project.name === 'mobil';

/** Sayfa yüklemesi sırasında istenen JS dosyalarının boyutlarını toplar. */
function trackScripts(page: Page) {
  const sizes = new Map<string, number>(); const pend: Promise<void>[] = [];
  page.on('response', (r) => { if (/\/assets\/.*\.js(\?|$)/.test(r.url())) pend.push(r.body().then((b) => { sizes.set(r.url(), b.length); }).catch(() => {})); });
  return { settle: async () => { await Promise.all(pend); return sizes; } };
}

test.describe('ilan listesi: kart, tarih, adet başı fiyat, sıralama', () => {
  test('kartta toplam + tanesi (türetilmiş), göreli tarih ve title, rozet; fotoğraf alanı boş değil', async ({ page }) => {
    await page.goto('/ilanlar?tur=lepistes');
    const card = page.locator('.card', { has: page.locator('.card-unit') }).first();
    await expect(card.locator('.card-unit')).toContainText(/tanesi ≈ [\d.,]+ ₺/);
    await expect(card.locator('.price-total')).toHaveText('toplam');
    await expect(card.locator('.card-unit')).toHaveAttribute('title', /yaklaşık, toplam fiyatın adede bölünmesi/);
    const t = card.locator('.card-date time');
    await expect(t).toHaveText(/^(bugün|dün|\d+ (gün|hafta|ay|yıl) önce)$/);
    await expect(t).toHaveAttribute('title', /^İlan tarihi: \d+ \p{L}+ \d{4}$/u);
    for (const b of await page.locator('.badge-verify').all()) await expect(b).toHaveAttribute('title', /kaynaklarda tutarsız/); // seed'de rozetli ilan yoksa birim testi kapsar
    expect(await page.locator('.card').first().innerText()).not.toContain('adı kaynaklarda tutarsız');
    for (const b of await page.locator('.card-photo').all()) { const bb = (await b.boundingBox())!; expect(bb.width).toBeGreaterThan(60); expect(bb.height).toBeGreaterThan(60); }
  });

  test('sıralama: adet başı fiyat artan; fiyat sıralamaları', async ({ page }) => {
    await page.goto('/ilanlar?sirala=adet');
    const opts = await page.locator('#f-sirala option').evaluateAll((o) => o.map((x) => x.textContent));
    expect(opts).toEqual(['En yeni', 'Fiyat (düşükten yükseğe)', 'Fiyat (yüksekten düşüğe)', 'Adet başı fiyat']);
    await expect(page.locator('#f-sirala')).toHaveValue('adet');
    const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'));
    const per = (await page.locator('.card').all()).length ? await page.locator('.card').evaluateAll((cs) => cs.map((c) => {
      const tot = c.querySelector('.price')!.textContent!; const u = c.querySelector('.card-unit')?.textContent?.match(/≈ ([\d.,]+)/)?.[1];
      return { tot, u: u ?? null, q: Number(c.querySelector('.card-loc')!.textContent!.match(/^(\d+) adet/)![1]) };
    })) : [];
    const vals = per.map((x) => (x.u ? num(x.u) : num(x.tot) / x.q));
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThanOrEqual(vals[i - 1] - 1); // yuvarlama payı
    await page.goto('/ilanlar');
    await expect(page.locator('#f-sirala')).toHaveValue('yeni');
  });

  test('filtre: çipler, kaldırma, tür değişince şekil/renk daralır ve otomatik uygulanır', async ({ page }, info) => {
    await page.goto('/ilanlar?tur=lepistes&sehir=Ankara');
    if (isMobile(info)) await expect(page.locator('#filtre-panel')).not.toHaveAttribute('open', '');
    const chips = page.locator('.filter-chips .chip-x');
    await expect(chips).toHaveCount(2);
    await expect(chips.first()).toContainText('Tür: Lepistes');
    await expect(page.getByTestId('sonuc-sayisi')).toBeVisible(); // filtre kapalıyken de görünür
    await chips.nth(1).click(); // şehri kaldır
    await expect(page).toHaveURL(/\/ilanlar\?tur=lepistes$/);
    if (isMobile(info)) await page.locator('.filter-toggle').click();
    const lepForms = await page.locator('#f-sekil option').allInnerTexts();
    await page.locator('#f-tur').selectOption('betta'); // otomatik uygular
    await expect(page).toHaveURL(/tur=betta/);
    expect(await page.locator('#f-sekil option').allInnerTexts()).not.toEqual(lepForms);
    // paylaşılabilir URL: aynı adres aynı sonucu verir
    const url = page.url(); const c = await page.getByTestId('sonuc-sayisi').innerText();
    await page.goto(url); await expect(page.getByTestId('sonuc-sayisi')).toHaveText(c);
    await page.locator('.filter-chips .chip-x').first().click();
    await expect(page).toHaveURL(/\/ilanlar(\?sirala=yeni)?$/);
  });
});

test.describe('mobil kompakt kart ve daraltılmış filtre', () => {
  test.beforeEach(({}, info) => { test.skip(!isMobile(info), 'yalnızca mobil'); });
  test('kartlar yatay ve kompakt; ana sayfada da', async ({ page }) => {
    for (const path of ['/ilanlar', '/']) {
      await page.goto(path);
      const photo = (await page.locator('.card-photo').first().boundingBox())!, card = (await page.locator('.card').first().boundingBox())!;
      expect(photo.width).toBeLessThanOrEqual(112); expect(photo.width).toBeGreaterThanOrEqual(90);
      expect(card.height).toBeLessThan(190);
      const body = (await page.locator('.card-body').first().boundingBox())!;
      expect(body.x).toBeGreaterThan(photo.x + photo.width - 2); // bilgi fotoğrafın sağında
    }
  });
  test('filtre kapalı başlar; Filtrele ile açılır/kapanır; Ara yedeği', async ({ page }) => {
    await page.goto('/ilanlar');
    const toggle = page.locator('.filter-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('#filtre')).toBeHidden();
    await expect(page.getByTestId('sonuc-sayisi')).toBeVisible();
    await toggle.click();
    await expect(page.locator('#filtre')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ara' })).toBeVisible();
    await toggle.click();
    await expect(page.locator('#filtre')).toBeHidden();
  });
  test('menü dokunma hedefleri en az 44 px', async ({ page }) => {
    await page.goto('/');
    for (const l of await page.locator('.nav a').all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
  test('3B: dokunuştan önce 3B/üç.js parçaları istenmez; dokunuşla yüklenir ve hatırlanır', async ({ page }) => {
    const tr = trackScripts(page);
    await page.goto('/ilan/1');
    await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'poster');
    await expect(page.getByRole('button', { name: 'Temsili 3B görünümü aç' })).toBeVisible();
    await expect(page.getByTestId('etiket-3b')).toBeVisible();
    await page.waitForTimeout(1500);
    const before = await tr.settle();
    expect(before.size).toBeGreaterThan(0);
    for (const [u, n] of before) expect(n, `ön yüklenen: ${u}`).toBeLessThan(100_000); // three.js parçası ~500 KB
    await page.getByRole('button', { name: 'Temsili 3B görünümü aç' }).click();
    await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'ready', { timeout: 60_000 });
    const after = await tr.settle();
    expect(Math.max(...after.values())).toBeGreaterThan(300_000);
    await expect(page.locator('#poster')).toBeHidden();
    // oturum boyunca hatırlanır: başka ilan kendiliğinden yüklenir
    await page.goto('/ilan/2');
    await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'ready', { timeout: 60_000 });
  });
  test('satıcı akvaryumu: dokunuştan önce 3B parçası yok; liste ve stok kartı 3B olmadan çalışır', async ({ page }) => {
    const tr = trackScripts(page);
    await page.goto('/satici/1');
    await expect(page.locator('#tank')).toHaveAttribute('data-state', 'poster');
    await expect(page.getByRole('button', { name: 'Akvaryumu aç' })).toBeVisible();
    await expect(page.getByTestId('etiket-akvaryum')).toBeVisible();
    await page.locator('#akv-liste [data-pick]').first().click();
    await expect(page.locator('#balik-karti')).toBeVisible();
    await page.waitForTimeout(1000);
    for (const [u, n] of await tr.settle()) expect(n, `ön yüklenen: ${u}`).toBeLessThan(100_000);
    await page.getByRole('button', { name: 'Akvaryumu aç' }).click();
    await expect(page.locator('#tank')).toHaveAttribute('data-state', 'ready', { timeout: 120_000 });
  });
});

test.describe('masaüstü', () => {
  test.beforeEach(({}, info) => { test.skip(isMobile(info), 'yalnızca masaüstü'); });
  test('filtre görünür, Filtrele düğmesi yok; kartlar ızgara', async ({ page }) => {
    await page.goto('/ilanlar');
    await expect(page.locator('#filtre')).toBeVisible();
    await expect(page.locator('.filter-toggle')).toBeHidden();
    const a = (await page.locator('.card').nth(0).boundingBox())!, b = (await page.locator('.card').nth(1).boundingBox())!;
    expect(Math.abs(a.y - b.y)).toBeLessThan(2); // yan yana
  });
  test('3B kendiliğinden yüklenir (poster yok)', async ({ page }) => {
    await page.goto('/ilan/1');
    await expect(page.locator('#poster')).toBeHidden();
    await webglReady(page);
    await page.goto('/satici/1');
    await expect(page.locator('#tank-poster')).toBeHidden();
    await expect(page.locator('#tank')).toHaveAttribute('data-state', 'ready', { timeout: 120_000 });
  });
  test('veri tasarrufu (saveData) varsa masaüstünde de poster', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }));
    await page.goto('/ilan/1');
    await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'poster');
  });
});

test.describe('kayıt sayfası ve okunurluk', () => {
  test('kayıt: sade metin, parola tekrarı yok, parolayı göster, kayıtsız gezinme satırı', async ({ page }) => {
    await page.goto('/kayit');
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/scrypt/i);
    expect(text).toContain('Parolanız güvenli biçimde saklanır');
    expect(text).toContain('Kayıt olmadan da ilanlara bakabilirsiniz');
    await expect(page.locator('#password2')).toHaveCount(0);
    const pw = page.getByLabel('Parola (en az 8 karakter)');
    await expect(pw).toHaveAttribute('type', 'password');
    await page.getByLabel('Parolayı göster').check();
    await expect(pw).toHaveAttribute('type', 'text');
    await page.getByLabel('Parolayı göster').uncheck();
    await expect(pw).toHaveAttribute('type', 'password');
  });
  test('gövde metni en az 16 px, ikincil metin en az 15 px', async ({ page }) => {
    await page.goto('/ilanlar');
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await page.locator('.card-meta').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(15);
    expect(await page.locator('.card-loc').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(15);
    expect(await page.locator('.price').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(20);
  });
});

test.describe('axe (tur A)', () => {
  test.use({ bypassCSP: true });
  for (const [ad, path] of [['liste + çipler', '/ilanlar?tur=lepistes&sehir=Ankara'], ['ana sayfa', '/'], ['kayıt', '/kayit'], ['ilan detayı (3B kapalı/poster)', '/ilan/1'], ['satıcı profili', '/satici/1']] as const) {
    test(`axe: ${ad}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(500);
      expect(await axeViolations(page)).toEqual([]);
    });
  }
  test('axe: mobilde filtre açıkken', async ({ page }, info) => {
    test.skip(!isMobile(info), 'yalnızca mobil');
    await page.goto('/ilanlar?tur=betta');
    await page.locator('.filter-toggle').click();
    expect(await axeViolations(page)).toEqual([]);
  });
});
