import { expect, test } from '@playwright/test';

const URL = '/araclar/3d-molly/';
type P = import('@playwright/test').Page;
const ready = (page: P) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
const visibleParts = (page: P) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.lb3-hot:not([hidden])')].map((b) => b.dataset.part));
const goView = async (page: P, v: string) => {
  await page.uncheck('#swim');
  await page.locator(`.lb3-btn[data-view=${v}]`).click();
  await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
  await page.waitForTimeout(1300); // geçiş animasyonu + kare
};

test.describe('3B molly modeli', () => {
  test('sayfa açılır, model yüklenir; tür varsayımı ve şematik notu görünür', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('h1')).toHaveText('3B molly modeli');
    await expect(page.getByText('Tür varsayımı.')).toBeVisible();
    await ready(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    await expect(page.locator('#swim')).toBeChecked();
    await expect(page.locator('#hotspots')).toBeChecked();
    await expect(page.locator('.lb3-hot:not([hidden])').first()).toBeVisible();
  });

  test('erkek/dişi değiştirince parça listesi değişir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const list = page.locator('#parts li:not([hidden])');
    await expect(list).toHaveCount(12);
    await expect(page.locator('#parts li[data-part=gonopodium]')).toBeVisible();
    await expect(page.locator('#parts li[data-part=gravid-spot]')).toBeHidden();
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'disi');
    await expect(list).toHaveCount(13);
    await expect(page.locator('#parts li[data-part=gravid-spot]')).toBeVisible();
    await expect(page.locator('#parts li[data-part=gonopodium]')).toBeHidden();
    await expect(page.locator('#sexnote')).toContainText('gravid spot');
  });

  test('parça seçimi açıklamayı gösterir; cinsiyet değişince seçim temizlenir; doğrulanmalı rozeti', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const btn = page.locator('.lb3-part[data-part=gonopodium]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Gonopodium');
    await expect(page.locator('.lb3-hot.on')).toHaveAttribute('data-part', 'gonopodium');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    await page.locator('.lb3-part[data-part=yan-cizgi]').click();
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
  });

  test('klavyeyle parça seçilebilir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('.lb3-part[data-part=goz]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail h3')).toHaveText('Göz');
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
  });

  test('numaralı nokta tıklaması parçayı seçer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
    await page.locator('.lb3-hot[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Göz');
  });

  test('gizlenme: yandan hepsi görünür; üstten karın tarafı gizli; arkadan göz ve ağız gizli', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await goView(page, 'yan');
    let v = await visibleParts(page);
    for (const id of ['agiz', 'goz', 'pul', 'anal-yuzgec', 'gravid-spot', 'kuyruk-yuzgeci']) expect(v, `yan: ${id}`).toContain(id);
    await goView(page, 'ust');
    v = await visibleParts(page);
    expect(v).toContain('goz');
    for (const id of ['gravid-spot', 'anal-yuzgec', 'agiz']) expect(v, `üst: ${id} gizli olmalı`).not.toContain(id);
    await goView(page, 'alt');
    v = await visibleParts(page);
    expect(v).toContain('gravid-spot');
    expect(v).not.toContain('goz');
    await goView(page, 'arka');
    v = await visibleParts(page);
    for (const id of ['goz', 'agiz']) expect(v, `arka: ${id} gizli olmalı`).not.toContain(id);
    // yüzme açıkken de aynı kalır
    await page.check('#swim');
    await page.waitForTimeout(800);
    v = await visibleParts(page);
    expect(v).not.toContain('goz');
  });

  test('Numaraları göster: kapatınca noktalar gizlenir, liste seçimi çalışır, tercih hatırlanır', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await expect(page.locator('#hotspots')).toBeChecked();
    expect((await visibleParts(page)).length).toBeGreaterThan(0);
    await page.uncheck('#hotspots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
    await expect.poll(() => visibleParts(page)).toEqual([]);
    await page.locator('.lb3-part[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Göz');
    await page.reload();
    await ready(page);
    await expect(page.locator('#hotspots')).not.toBeChecked();
    expect(await visibleParts(page)).toEqual([]);
    await page.check('#hotspots');
    await expect.poll(async () => (await visibleParts(page)).length).toBeGreaterThan(0);
  });

  test('listeden gizli bir parça seçilince (noktalar açıkken) kamera yana döner', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    await page.locator('.lb3-part[data-part=agiz]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'yan');
    await page.waitForTimeout(1300);
    expect(await visibleParts(page)).toContain('agiz');
  });

  test('varyete seçimi, yüzme ve otomatik döndürme anahtarları, görünüm düğmeleri', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.selectOption('#variant', 'chocolate');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'chocolate');
    await expect(page.locator('#sexnote')).toContainText('Chocolate');
    await expect(page.locator('#sexnote')).toContainText('Kaynakla doğrulanmalı');
    await page.selectOption('#variant', 'dalmatian');
    await expect(page.locator('#sexnote')).not.toContainText('Kaynakla doğrulanmalı');
    await page.uncheck('#swim');
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    await page.check('#rot');
    await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames'))).toBeGreaterThan(f0 + 2);
    await page.uncheck('#rot');
    for (const v of ['ust', 'alt', 'yan', 'on', 'arka', 'capraz'] as const) {
      await page.locator(`.lb3-btn[data-view=${v}]`).click();
      await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
    }
  });

  test('her varyete, her iki cinsiyette hata vermeden yüklenir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    const opts = await page.locator('#variant option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
    expect(opts.length).toBe(9);
    for (const sex of ['Erkek', 'Dişi']) {
      await page.getByRole('radio', { name: sex }).check();
      for (const o of opts) {
        await page.selectOption('#variant', o);
        await expect(page.locator('#stage')).toHaveAttribute('data-variant', o);
      }
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
    await expect(page.locator('#fallback svg')).toHaveCount(2);
    await expect(page.locator('#cv')).toBeHidden();
    await page.locator('.lb3-part[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Göz');
  });
});
