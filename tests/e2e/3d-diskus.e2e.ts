import { expect, test, type Page } from '@playwright/test';

const URL = '/araclar/3d-diskus/';
const ready = (page: Page) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
const visibleParts = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
/** Kare üretimi yavaş (yazılım WebGL, yoğun makine) olabilir: koşulu sabit bekleme yerine yoklayarak doğrula */
const expectParts = async (page: Page, has: string[], not: string[] = []) => {
  await expect.poll(async () => {
    const v = (await visibleParts(page)) as string[];
    return has.every((id) => v.includes(id)) && not.every((id) => !v.includes(id));
  }, { timeout: 30_000, message: `görünür: ${has.join(',')}; gizli: ${not.join(',')}` }).toBe(true);
};
const goView = async (page: Page, v: string) => {
  await page.uncheck('#swim');
  await page.locator(`.v3-btn[data-view=${v}]`).click();
  await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
  await page.waitForTimeout(1300); // geçiş animasyonu + kare
};

test.describe('3B diskus modeli', () => {
  test('sayfa açılır, model yüklenir; tür varsayımı görünür; numaralı noktalar varsayılan açık', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('h1')).toHaveText('3B diskus modeli');
    await expect(page.getByText('Tür varsayımı.')).toBeVisible();
    await ready(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    await expect(page.locator('#swim')).toBeChecked();
    await expect(page.locator('#hotspots')).toBeChecked();
    await expect(page.locator('.v3-hot:not([hidden])').first()).toBeVisible();
  });

  test('cinsiyet: tek ve dürüst seçenek "Ayrım yok / belirgin değil"; parça listesi 13 öğe', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await expect(page.locator('input[name=sex]')).toHaveCount(1);
    await expect(page.getByRole('radio', { name: 'Ayrım yok / belirgin değil' })).toBeChecked();
    await expect(page.locator('#sexnote')).toContainText('güvenilir');
    await expect(page.locator('#parts li')).toHaveCount(13);
  });

  test('parça seçimi açıklamayı gösterir; doğrulanmalı rozeti; yeniden tıklayınca seçim kalkar', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const btn = page.locator('.v3-part[data-part=seritler]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Dikey şeritler (yabani desen)');
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
    await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', 'seritler');
    await btn.click();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
  });

  test('klavyeyle parça seçilebilir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('.v3-part[data-part=goz]').focus();
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
    await page.locator('.v3-hot[data-part=goz]').click();
    await expect(page.locator('#detail h3')).toHaveText('Göz');
  });

  test('"Numaraları göster" kapatılınca noktalar gizlenir ve tıklanamaz; parça listesi çalışır; açınca geri gelir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await expectParts(page, ['goz', 'sirt-yuzgeci']);
    await page.uncheck('#hotspots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
    await expect.poll(async () => (await visibleParts(page)).length, { timeout: 15_000 }).toBe(0);
    await expect(page.locator('#hot')).toBeHidden();
    // liste yine çalışır
    await page.locator('.v3-part[data-part=sirt-yuzgeci]').click();
    await expect(page.locator('#detail h3')).toHaveText('Sırt yüzgeci');
    await page.check('#hotspots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'on');
    await expectParts(page, ['goz']);
    await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', 'sirt-yuzgeci');
  });

  test('gizlenme: yandan gövde ve yüzgeç noktaları görünür; önden yan yüzey noktaları gizli; üstten karın altı gizli', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await expectParts(page, ['goz', 'agiz', 'solungac-kapagi', 'govde', 'sirt-yuzgeci', 'anal-yuzgec', 'pelvik-yuzgec', 'kuyruk-yuzgeci']);
    await goView(page, 'on');
    await expectParts(page, [], ['solungac-kapagi', 'govde', 'seritler']);
    await goView(page, 'ust');
    await expectParts(page, ['sirt-yuzgeci'], ['anal-yuzgec']);
    // yüzme açıkken yandan aynı kalır
    await page.locator('.v3-btn[data-view=yan]').click();
    await page.check('#swim');
    await expectParts(page, ['goz']);
  });

  test('öbür yandan bakınca da göz noktası görünür (yansıtma); listeden gizli parça seçilince kamera döner', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await page.locator('#cv').focus();
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
    await expectParts(page, ['goz']);
    await page.locator('.v3-btn[data-view=ust]').click();
    await expectParts(page, ['sirt-yuzgeci'], ['anal-yuzgec']);
    await page.locator('.v3-part[data-part=anal-yuzgec]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'yan');
    // dar ekranda liste modelin altındadır; kamera animasyonu model görünür olunca çalışır
    await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
    await expectParts(page, ['anal-yuzgec']);
  });

  test('varyete seçimi, yüzme ve otomatik döndürme anahtarları, görünüm düğmeleri', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.selectOption('#variant', 'leopar');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'leopar');
    await expect(page.locator('#sexnote')).toContainText('Leopar');
    await page.selectOption('#variant', 'panda');
    await expect(page.locator('#sexnote')).toContainText('Kaynakla doğrulanmalı');
    await page.uncheck('#swim');
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    await page.check('#rot');
    await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 30_000 }).toBeGreaterThan(f0 + 2);
    await page.uncheck('#rot');
    for (const v of ['yan', 'capraz', 'on', 'ust', 'arka'] as const) {
      await page.locator(`.v3-btn[data-view=${v}]`).click();
      await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
    }
  });

  test('her varyete seçilebilir ve hata vermeden yüklenir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    const opts = await page.locator('#variant option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
    expect(opts.length).toBeGreaterThanOrEqual(14);
    for (const o of opts) {
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
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 30_000 }).toBeGreaterThan(f0);
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
    await expect(page.locator('#fallback svg')).toHaveCount(1);
    await expect(page.locator('#cv')).toBeHidden();
    await page.locator('.v3-part[data-part=pelvik-yuzgec]').click();
    await expect(page.locator('#detail h3')).toHaveText('Karın yüzgeçleri (pelvik)');
  });
});
