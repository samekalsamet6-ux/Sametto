import { expect, test } from '@playwright/test';

const URL = '/araclar/3d-amano-karidesi/';
type P = import('@playwright/test').Page;
const ready = (page: P) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
const visibleParts = (page: P) =>
  page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
const goView = async (page: P, v: string) => {
  await page.uncheck('#swim');
  await page.locator(`.v3-btn[data-view=${v}]`).click();
  await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
  await page.waitForTimeout(1300); // geçiş animasyonu + kare
};

test.describe('3B Amano karidesi modeli', () => {
  test.describe.configure({ timeout: 120_000 });
  test('sayfa açılır, model yüklenir; şematik notu görünür; form ve renk dürüst tek seçenek; numaralar varsayılan açık', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('h1')).toHaveText('3B Amano karidesi modeli');
    await expect(page.getByText('Tür ve model varsayımı.')).toBeVisible();
    await expect(page.locator('.callout-bilgi').first()).toContainText('Caridina multidentata');
    await expect(page.locator('.callout-bilgi').first()).toContainText('şematik');
    await ready(page);
    await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
    await expect(page.locator('#swim')).toBeChecked();
    await expect(page.locator('#formnote')).toContainText('Standart (tek biçim)');
    await expect(page.locator('#form')).toBeDisabled();
    await expect(page.locator('#form option')).toHaveCount(1);
    await expect(page.locator('#variant option')).toHaveCount(1);
    await expect(page.locator('#hots')).toBeChecked();
    await expect(page.locator('.v3-hot:not([hidden])').first()).toBeVisible();
  });

  test('erkek/dişi değiştirince parça listesi değişir; benek açıklaması nokta/çizgi; eyer ve yumurta yalnızca dişide, appendix yalnızca erkekte', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const list = page.locator('#parts li:not([hidden])');
    await expect(list).toHaveCount(16);
    await expect(page.locator('#parts li[data-part=appendix]')).toBeHidden();
    await expect(page.locator('#parts li[data-part=eyer]')).toBeVisible();
    await expect(page.locator('#berrywrap')).toBeVisible();
    await page.getByRole('radio', { name: 'Erkek' }).check();
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'erkek');
    await expect(list).toHaveCount(15);
    await expect(page.locator('#parts li[data-part=appendix]')).toBeVisible();
    await expect(page.locator('#parts li[data-part=eyer]')).toBeHidden();
    await expect(page.locator('#parts li[data-part=yumurta]')).toBeHidden();
    await expect(page.locator('#berrywrap')).toBeHidden();
    await expect(page.locator('#sexnote')).toContainText('yuvarlak noktalardır');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#sexnote')).toContainText('tire');
  });

  test('parça seçimi açıklamayı gösterir; doğrulanmalı rozeti; cinsiyet değişince seçim temizlenir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    const btn = page.locator('.v3-part[data-part=eyer]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#detail h3')).toHaveText('Eyer (dişide, sırtta)');
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
    await page.getByRole('radio', { name: 'Erkek' }).check();
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    await page.locator('.v3-part[data-part=telson]').click();
    await expect(page.locator('#detail h3')).toHaveText('Telson (kuyruk ortası)');
  });

  test('klavyeyle parça seçilebilir', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('.v3-part[data-part=goz]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail h3')).toHaveText('Saplı gözler');
    await page.keyboard.press('Enter');
    await expect(page.locator('#detail')).toContainText('Bir parça seçin');
  });

  test('numaralı nokta tıklaması parçayı seçer', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
    await page.locator('.v3-hot[data-part=karapaks]').click();
    await expect(page.locator('#detail h3')).toHaveText('Karapaks (baş-göğüs kabuğu)');
    await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', 'karapaks');
  });

  test('"Numaraları göster" kapatılınca noktalar gizlenir ve tıklanamaz; liste çalışır; tekrar açılınca döner', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'yan');
    expect((await visibleParts(page)).length).toBeGreaterThan(4);
    await page.uncheck('#hots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
    await expect.poll(async () => (await visibleParts(page)).length).toBe(0);
    await expect(page.locator('.v3-hot[data-part=karapaks]')).toBeHidden();
    await expect(page.locator('#hot')).toBeHidden();
    // yüzme açıkken kareler üretilse de noktalar kapalı kalır
    await page.check('#swim');
    await page.waitForTimeout(600);
    expect((await visibleParts(page)).length).toBe(0);
    // parça listesi hâlâ çalışır
    await page.locator('.v3-part[data-part=telson]').click();
    await expect(page.locator('#detail h3')).toHaveText('Telson (kuyruk ortası)');
    await page.check('#hots');
    await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'on');
    await expect.poll(async () => (await visibleParts(page)).length).toBeGreaterThan(4);
    await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', 'telson');
  });

  test('gizlenme: üstten bakınca karın altındaki yüzme bacakları ve ağız gizli; alttan bakınca görünür, sırttaki karapaks gizli', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    let v = await visibleParts(page);
    for (const id of ['karapaks', 'karin', 'telson']) expect(v, `üst: ${id}`).toContain(id);
    for (const id of ['yuzme-bacagi', 'agiz', 'yumurta']) expect(v, `üst: ${id} gizli olmalı`).not.toContain(id);
    await goView(page, 'alt');
    v = await visibleParts(page);
    for (const id of ['yuzme-bacagi', 'agiz', 'yumurta']) expect(v, `alt: ${id}`).toContain(id);
    for (const id of ['karapaks', 'karin', 'eyer', 'telson']) expect(v, `alt: ${id} gizli olmalı`).not.toContain(id);
    // hareket açıkken de aynı kalır
    await page.check('#swim');
    await page.waitForTimeout(800);
    v = await visibleParts(page);
    expect(v).toContain('yuzme-bacagi'); expect(v).not.toContain('karapaks');
  });

  test('listeden görünmeyen parça seçilince kamera uygun görünüme döner; yumurta anahtarı', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await goView(page, 'ust');
    await page.locator('.v3-part[data-part=yuzme-bacagi]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'alt');
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView()); // liste tıklaması sahneyi görünüm dışına kaydırabilir
    await expect.poll(async () => await visibleParts(page), { timeout: 20_000 }).toContain('yuzme-bacagi');
    await page.uncheck('#berry');
    await expect(page.locator('#stage')).toHaveAttribute('data-berry', 'off');
  });

  test('hareket ve otomatik döndürme anahtarları, görünüm düğmeleri; renk seçicisi tek doğal görünüm', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await expect(page.locator('#variant')).toHaveValue('dogal');
    await page.uncheck('#swim');
    await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    await page.check('#rot');
    await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
    await page.evaluate(() => document.getElementById('stage')?.scrollIntoView());
    await page.waitForTimeout(500);
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 20_000 }).toBeGreaterThan(f0 + 2);
    await page.uncheck('#rot');
    for (const v of ['ust', 'alt', 'yan', 'on', 'arka', 'capraz'] as const) {
      await page.locator(`.v3-btn[data-view=${v}]`).click();
      await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
    }
  });

  test('yan benek ve sırt çizgisi parçaları: yandan benek noktası görünür; her iki cinsiyet hatasız yüklenir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL);
    await ready(page);
    for (const sex of ['Dişi', 'Erkek']) {
      await page.getByRole('radio', { name: sex }).check();
      await goView(page, 'yan');
      expect(await visibleParts(page), sex).toContain('benek');
      await goView(page, 'ust');
      expect(await visibleParts(page), sex).toContain('sirt-cizgisi');
    }
    await page.locator('.v3-part[data-part=benek]').click();
    await expect(page.locator('#detail h3')).toContainText('Yan benek sırası');
    await expect(page.locator('#detail')).toContainText('Kaynakla doğrulanmalı');
    expect(errors).toEqual([]);
  });

  test('tuvale odaklanıp ok tuşları ile döndürülür (kare üretilir)', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('#cv').focus();
    const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('+');
    await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 20_000 }).toBeGreaterThan(f0);
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
    await page.locator('.v3-part[data-part=uropod]').click();
    await expect(page.locator('#detail h3')).toHaveText('Uropodlar (kuyruk yelpazesi yanları)');
  });
});
