import { expect, test } from '@playwright/test';

const URL = '/araclar/3d-vatoz/';
const ready = (page: import('@playwright/test').Page) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
const visibleParts = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
const goView = async (page: import('@playwright/test').Page, v: string) => {
  await page.uncheck('#swim');
  await page.locator(`.v3-btn[data-view=${v}]`).click();
  await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
  await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // kare döngüsü yalnızca görünürken çalışır
  await page.waitForTimeout(1300); // geçiş animasyonu + kare
};

test.describe('3B tatlı su vatozu modeli', () => {
  test('sayfa açılır, model yüklenir, araç dizininde bağlantısı var; tür varsayımı ve güvenlik notu görünür', async ({ page }) => {
    await page.goto('/araclar/');
    await page.getByRole('link', { name: /3B tatlı su vatozu modeli/ }).click();
    await expect(page).toHaveURL(/3d-vatoz/);
    await expect(page.locator('h1')).toHaveText('3B tatlı su vatozu modeli');
    await expect(page.getByText('Tür varsayımı.')).toBeVisible();
    await expect(page.locator('#safety')).toContainText('kuyruk dikeni');
    await ready(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    await expect(page.locator('#swim')).toBeChecked();
    await expect(page.locator('#formnote')).toContainText('şekil varyetesi yok');
    await expect(page.locator('#form')).toHaveCount(0);
    await expect(page.locator('.v3-hot:not([hidden])').first()).toBeVisible();
  });

  test('erkek/dişi değiştirince parça listesi değişir; klasper yalnızca erkekte', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const list = page.locator('#parts li:not([hidden])');
    await expect(list).toHaveCount(12);
    await expect(page.locator('#parts li[data-part=klasper]')).toBeHidden();
    await page.getByRole('radio', { name: 'Erkek' }).check();
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'erkek');
    await expect(list).toHaveCount(13);
    await expect(page.locator('#parts li[data-part=klasper]')).toBeVisible();
    await expect(page.locator('#sexnote')).toContainText('klasper');
  });

  test('parça seçimi açıklamayı gösterir; dikende güvenlik uyarısı ve doğrulanmalı rozeti; cinsiyet değişince seçim temizlenir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('radio', { name: 'Erkek' }).check();
    const btn = page.locator('.v3-part[data-part=klasper]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Klasperler (erkekte)');
    await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', 'klasper');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    await page.locator('.v3-part[data-part=kuyruk-dikeni]').click();
    await expect(page.locator('#detail')).toContainText('tıbbi yardım');
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
  });

  test('klavyeyle parça seçilebilir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('.v3-part[data-part=goz]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail h3')).toHaveText('Gözler (üstte)');
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
  });

  test('numaralı nokta tıklaması parçayı seçer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
    await page.locator('.v3-hot[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Gözler (üstte)');
  });

  test('gizlenme: üst görünümde üst yüz noktaları görünür, alt yüz noktaları gizli; alt görünümde tersi', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    let v = await visibleParts(page);
    for (const id of ['goz', 'spirakul', 'desen', 'kuyruk-dikeni']) expect(v, `üst: ${id}`).toContain(id);
    for (const id of ['agiz', 'burun-delikleri', 'solungac-yarigi']) expect(v, `üst: ${id} gizli olmalı`).not.toContain(id);
    await goView(page, 'alt');
    v = await visibleParts(page);
    for (const id of ['agiz', 'burun-delikleri', 'solungac-yarigi']) expect(v, `alt: ${id}`).toContain(id);
    for (const id of ['goz', 'spirakul', 'desen', 'burun-ucu', 'kuyruk-dikeni']) expect(v, `alt: ${id} gizli olmalı`).not.toContain(id);
    // yüzme açıkken de aynı kalır
    await page.check('#swim');
    await page.waitForTimeout(800);
    v = await visibleParts(page);
    expect(v).toContain('agiz'); expect(v).not.toContain('goz');
  });

  test('alt görünümde erkekte klasper görünür; listeden üst yüz parçası seçilince kamera üste döner', async ({ page }) => {
    test.slow();
    await page.goto(URL);
    await ready(page);
    await page.getByRole('radio', { name: 'Erkek' }).check();
    await goView(page, 'alt');
    await expect.poll(() => visibleParts(page), { timeout: 20_000 }).toContain('klasper'); // mobilde kare döngüsü gecikebilir
    await page.locator('.v3-part[data-part=spirakul]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'ust');
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // liste tıklaması sahneyi görünüm dışına kaydırabilir
    await expect.poll(() => visibleParts(page), { timeout: 20_000 }).toContain('spirakul');
  });

  test('desen seçimi, yüzme ve otomatik döndürme anahtarları, görünüm düğmeleri', async ({ page }) => {
    test.slow();
    await page.goto(URL);
    await ready(page);
    await page.selectOption('#variant', 'motoro');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'motoro');
    await expect(page.locator('#sexnote')).toContainText('Motoro');
    await expect(page.locator('#sexnote')).not.toContainText('Kaynakla doğrulanmalı');
    await page.selectOption('#variant', 'albino');
    await expect(page.locator('#sexnote')).toContainText('Kaynakla doğrulanmalı');
    await page.selectOption('#variant', 'motoro');
    await page.uncheck('#swim');
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    await page.check('#rot');
    await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames'))).toBeGreaterThan(f0 + 2);
    await page.uncheck('#rot');
    for (const v of ['ust', 'alt', 'yan', 'on', 'arka', 'capraz'] as const) {
      await page.locator(`.v3-btn[data-view=${v}]`).click();
      await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
    }
  });

  test('Numaraları göster: kapatınca noktalar gizlenir, liste seçimi çalışır, tercih hatırlanır', async ({ page }) => {
    test.slow();
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    await expect(page.locator('#hotspots')).toBeChecked();
    expect((await visibleParts(page)).length).toBeGreaterThan(0);
    await page.uncheck('#hotspots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
    await expect.poll(() => visibleParts(page)).toEqual([]);
    await expect(page.locator('.v3-hot[aria-hidden=true]:not([hidden])')).toHaveCount(0);
    await page.locator('.v3-part[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Gözler (üstte)');
    await page.reload();
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // geri yüklenen kaydırma konumu modeli tembel yüklemeden uzak tutabilir
    await ready(page);
    await expect(page.locator('#hotspots')).not.toBeChecked();
    expect(await visibleParts(page)).toEqual([]);
    await page.check('#hotspots');
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // kare döngüsü yalnızca görünürken çalışır
    await expect.poll(async () => (await visibleParts(page)).length, { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('her desen seçilebilir ve hata vermeden yüklenir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    for (const o of await page.locator('#variant option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value))) {
      await page.selectOption('#variant', o);
      await expect(page.locator('#stage')).toHaveAttribute('data-variant', o);
    }
    expect(errors).toEqual([]);
  });

  test('tuvale odaklanıp ok tuşları ile döndürülür (kare üretilir)', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('#cv').focus();
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('+');
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames'))).toBeGreaterThan(f0);
  });

  test('hareket azaltma tercihinde animasyonlar kapalı başlar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(URL);
    await ready(page);
    await expect(page.locator('#swim')).not.toBeChecked();
    await expect(page.locator('#rot')).not.toBeChecked();
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
  });

  test('WebGL yoksa SVG yedeği ve parça açıklamaları görünür', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
        if (/webgl/.test(type)) return null;
        return (orig as (...x: unknown[]) => unknown).call(this, type, ...a);
      } as typeof orig;
    });
    await page.goto(URL);
    await expect(page.locator('#fallback')).toBeVisible();
    await expect(page.locator('#fallback')).toContainText('3B görüntü bu tarayıcıda açılamadı');
    await expect(page.locator('#fallback svg')).toHaveCount(4);
    await expect(page.locator('#cv')).toBeHidden();
    await page.locator('.v3-part[data-part=spirakul]').click();
    await expect(page.locator('#detail h3')).toHaveText('Spirakül (nefes deliği)');
  });
});
