import { expect, test } from '@playwright/test';

const URL = '/araclar/3d-lepistes/';
const ready = (page: import('@playwright/test').Page) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });

test.describe('3B lepistes modeli', () => {
  test('sayfa açılır, model yüklenir, araç dizininde bağlantısı var', async ({ page }) => {
    await page.goto('/araclar/');
    await page.getByRole('link', { name: /3B lepistes modeli/ }).click();
    await expect(page).toHaveURL(/3d-lepistes/);
    await expect(page.locator('h1')).toHaveText('3B lepistes modeli');
    await ready(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    // varsayılan: reduced-motion kapalı olduğundan yüzme açık
    await expect(page.locator('#swim')).toBeChecked();
    await expect(page.locator('.g3-hot:not([hidden])').first()).toBeVisible();
  });

  test('erkek/dişi değiştirince parça listesi ve cinsiyete özgü parçalar değişir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const list = page.locator('#parts li:not([hidden])');
    await expect(list).toHaveCount(11);
    await expect(page.locator('#parts li[data-part=gonopodium]')).toBeVisible();
    await expect(page.locator('#parts li[data-part=gravid-spot]')).toBeHidden();
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'disi');
    await expect(list).toHaveCount(12);
    await expect(page.locator('#parts li[data-part=gravid-spot]')).toBeVisible();
    await expect(page.locator('#parts li[data-part=gonopodium]')).toBeHidden();
    await expect(page.locator('#sexnote')).toContainText('gravid spot');
  });

  test('parça seçimi açıklamayı ve wiki bağlantısını gösterir; seçili parça kaybolunca temizlenir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const btn = page.locator('.g3-part[data-part=gonopodium]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Gonopodium');
    await expect(page.locator('#detail')).toContainText('çubuk biçimli');
    await expect(page.locator('#detail a')).toHaveAttribute('href', '/wiki/gonopodium');
    await expect(page.locator('.g3-hot.on')).toHaveAttribute('data-part', 'gonopodium');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    await page.locator('.g3-part[data-part=yan-cizgi]').click();
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
  });

  test('klavyeyle parça seçilebilir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('.g3-part[data-part=goz]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail h3')).toHaveText('Göz');
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
  });

  test('noktaya tıklamak parçayı seçer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.uncheck('#swim'); // hareketli düğme tıklamada kararsız sayılır
    await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
    await page.locator('.g3-hot[data-part=kuyruk-yuzgeci]').click();
    await expect(page.locator('#detail h3')).toHaveText('Kuyruk yüzgeci');
  });

  test('varyete seçimi, yüzme ve otomatik döndürme anahtarları, görünüm düğmeleri', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.selectOption('#variant', 'cobra');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'cobra');
    await expect(page.locator('#sexnote')).toContainText('Cobra');
    await page.uncheck('#swim');
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    await page.check('#rot');
    await page.locator('#stage').scrollIntoViewIfNeeded(); // dar ekranda sahne ilk açılışta görünüm alanının altında kalabilir
    await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames'))).toBeGreaterThan(f0 + 2);
    await page.uncheck('#rot');
    for (const v of ['ust', 'on', 'yan'] as const) {
      await page.locator(`.g3-btn[data-view=${v}]`).click();
      await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
    }
  });

  test('tüm varyeteler gruplu listede; her biri hatasız yüklenir', async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    expect(await page.locator('#variant optgroup').count()).toBeGreaterThanOrEqual(4);
    const ids = await page.locator('#variant option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    expect(ids.length).toBeGreaterThanOrEqual(25);
    expect(new Set(ids).size).toBe(ids.length);
    expect(await page.locator('main li strong').count()).toBeGreaterThanOrEqual(ids.length);
    await page.uncheck('#swim');
    for (const id of ids) {
      await page.selectOption('#variant', id);
      await expect(page.locator('#stage')).toHaveAttribute('data-variant', id);
      await page.waitForTimeout(60);
    }
    await page.check('input[name=sex][value=disi]');
    await page.selectOption('#variant', 'moscow-blue');
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('form (şekil) seçimi: tüm formlar örneklenen renklerle hatasız yüklenir, renk korunur, noktalar çalışır', async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    await page.uncheck('#swim');
    expect(await page.locator('#form optgroup').count()).toBeGreaterThanOrEqual(4);
    const forms = await page.locator('#form option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    expect(forms[0]).toBe('standart');
    expect(forms.length).toBeGreaterThanOrEqual(14);
    expect(forms).toEqual(expect.arrayContaining(['delta', 'veiltail', 'lyretail', 'kilic-ust', 'kilic-cift', 'pintail', 'round', 'spade', 'flag', 'ribbon', 'dumbo']));
    const colours = ['cobra', 'blue-grass', 'platinum'];
    for (const [i, f] of forms.entries()) {
      await page.selectOption('#variant', colours[i % colours.length]);
      await page.selectOption('#form', f);
      await expect(page.locator('#stage')).toHaveAttribute('data-form', f);
      await expect(page.locator('#stage')).toHaveAttribute('data-variant', colours[i % colours.length]);
      await expect(page.locator('#variant')).toHaveValue(colours[i % colours.length]);
      await expect(page.locator('#sexnote')).toContainText('Form');
      await page.waitForTimeout(60);
    }
    // kılıç parçası yalnızca kılıçlı formda erkekte listelenir
    await page.selectOption('#form', 'kilic-ust');
    await expect(page.locator('#parts li[data-part=kilic]')).toBeVisible();
    await page.locator('.g3-part[data-part=kilic]').click();
    await expect(page.locator('#detail h3')).toContainText('Kılıç');
    await page.check('input[name=sex][value=disi]');
    await expect(page.locator('#parts li[data-part=kilic]')).toBeHidden();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    await page.selectOption('#form', 'dumbo');
    await page.locator('.g3-btn[data-view=yan]').click();
    const visible = () => page.locator('.g3-hot:not([hidden])').evaluateAll((b) => b.map((x) => (x as HTMLElement).dataset.part));
    await expect.poll(visible).toContain('gogus-yuzgeci');
    await page.uncheck('#hotspots');
    await expect.poll(visible).toEqual([]);
    await page.check('#hotspots');
    await expect.poll(async () => (await visible()).length, { timeout: 20_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('gövdenin arkasında kalan numaralı noktalar gizlenir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.uncheck('#swim');
    const visible = () => page.locator('.g3-hot:not([hidden])').evaluateAll((b) => b.map((x) => (x as HTMLElement).dataset.part));
    await page.locator('.g3-btn[data-view=yan]').click();
    await expect.poll(visible).toContain('gonopodium');
    await page.locator('.g3-btn[data-view=ust]').click();
    await expect.poll(visible).not.toContain('gonopodium');
    await page.locator('.g3-btn[data-view=alt]').click();
    await expect.poll(visible).not.toContain('sirt-yuzgeci');
    for (const b of await page.locator('.g3-hot[hidden]').all()) await expect(b).toHaveAttribute('aria-hidden', 'true');
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
    await expect(page.locator('#fallback svg')).toHaveCount(2);
    await expect(page.locator('#cv')).toBeHidden();
    await page.locator('.g3-part[data-part=sirt-yuzgeci]').click();
    await expect(page.locator('#detail h3')).toHaveText('Sırt yüzgeci');
  });

  test('Numaraları göster: kapatınca noktalar gizlenir, liste seçimi çalışır, tercih hatırlanır', async ({ page }) => {
    test.slow();
    await page.goto(URL);
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    const visible = () => page.locator('.g3-hot:not([hidden])').evaluateAll((b) => b.map((x) => (x as HTMLElement).dataset.part));
    await page.uncheck('#swim');
    await expect(page.locator('#hotspots')).toBeChecked();
    await expect.poll(async () => (await visible()).length, { timeout: 20_000 }).toBeGreaterThan(0);
    await page.uncheck('#hotspots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
    await expect.poll(visible).toEqual([]);
    await page.locator('.g3-part[data-part=sirt-yuzgeci]').click();
    await expect(page.locator('#detail h3')).toHaveText('Sırt yüzgeci');
    await page.reload();
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // geri yüklenen kaydırma konumu modeli tembel yüklemeden uzak tutabilir
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await expect(page.locator('#hotspots')).not.toBeChecked();
    expect(await visible()).toEqual([]);
    await page.check('#hotspots');
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // kare döngüsü yalnızca görünürken çalışır
    await expect.poll(async () => (await visible()).length, { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('sayfa ve araç dizini; ilgili sayfalardan bağlantı', async ({ page }) => {
    await page.goto('/wiki/gonopodium/');
    await page.getByRole('link', { name: /3B lepistes modeli/ }).click();
    await expect(page).toHaveURL(/3d-lepistes/);
  });
});
