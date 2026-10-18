import { test, expect, type Page } from '@playwright/test';
import { register, axeViolations } from './helpers.ts';

const LABEL = 'temsili 3B görünüm — satıcının gerçek stoğu değildir';
const DEMO_SELLER = '/satici/1';

const noWebgl = (page: Page) => page.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error test: WebGL'i kapat
  HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : orig.call(this, t, ...a); };
});
const tankReady = (page: Page) => expect(page.locator('#tank')).toHaveAttribute('data-state', 'ready', { timeout: 60_000 });
const consoleErrors = (page: Page) => { const errs: string[] = []; page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message)); return errs; };

async function addFish(page: Page, species: string, sex?: string) {
  await page.goto('/profil/akvaryum');
  await page.locator('#tur').selectOption(species);
  if (sex) await page.locator('#sex').selectOption(sex);
  await page.getByRole('button', { name: 'Akvaryuma ekle' }).click();
  await expect(page.getByText('Balık akvaryuma eklendi.')).toBeVisible();
}

test.describe('akvaryum', () => {
  test('sahibi balık ekler, sahneyi görür; klavye ile döndürür; konsol temiz; axe temiz', async ({ page }) => {
    const errs = consoleErrors(page);
    await register(page);
    const uid = (await page.locator('.nav-user').getAttribute('href'))!;
    await page.goto('/profil/akvaryum');
    await expect(page.getByText('Henüz balık eklemediniz.')).toBeVisible();
    // canlı önizleme
    await page.locator('#tur').selectOption('betta');
    await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'ready', { timeout: 60_000 });
    await expect(page.locator('#form option')).not.toHaveCount(0);
    await page.locator('#variant').selectOption('mavi');
    await page.locator('#sex').selectOption('erkek');
    await page.getByRole('button', { name: 'Akvaryuma ekle' }).click();
    await expect(page.getByText('Balık akvaryuma eklendi.')).toBeVisible();
    await addFish(page, 'lepistes');
    await addFish(page, 'karides');   // şekli olmayan tür
    await expect(page.locator('#duzenle-liste li')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: /Akvaryumdaki balıklar \(3 \/ 12\)/ })).toBeVisible();

    await page.goto(uid);
    await expect(page.getByTestId('etiket-akvaryum')).toHaveText(LABEL);
    await tankReady(page);
    await page.locator('#tank').scrollIntoViewIfNeeded();
    const cv = page.locator('#tank-cv');
    await expect(cv).toHaveAttribute('aria-label', /3 balık.*temsili 3B görünüm/);
    await expect(page.locator('#akv-liste li')).toHaveCount(3);
    const stats = await page.evaluate(() => (window as any).__akvaryum.stats());
    expect(stats.fish).toBe(3); expect(stats.triangles).toBeGreaterThan(1000); expect(stats.active).toBe(true);
    // klavye
    await cv.focus();
    const az0 = Number(await page.locator('#tank').getAttribute('data-azimuth'));
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    await expect.poll(async () => Number(await page.locator('#tank').getAttribute('data-azimuth'))).toBeGreaterThan(az0 + 0.2);
    const d0 = (await page.evaluate(() => (window as any).__akvaryum.stats())).distance;
    await page.keyboard.press('+');
    expect((await page.evaluate(() => (window as any).__akvaryum.stats())).distance).toBeLessThan(d0);
    // düğmeler
    await page.getByRole('button', { name: 'Sola döndür' }).click();
    // sürükleme
    const box = (await cv.boundingBox())!;
    const before = (await page.evaluate(() => (window as any).__akvaryum.stats())).azimuth;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 }); await page.mouse.up();
    expect((await page.evaluate(() => (window as any).__akvaryum.stats())).azimuth).not.toBe(before);
    // sahibinde düzenle bağlantısı, silme
    await page.getByRole('link', { name: 'Akvaryumu düzenle' }).click();
    await page.getByRole('button', { name: /Karides.*kaldır/ }).click();
    await expect(page.locator('#duzenle-liste li')).toHaveCount(2);
    expect(errs).toEqual([]);
  });

  test('ziyaretçi (girişsiz) demo akvaryumunu görür; sayfadan çıkınca kaynaklar bırakılır', async ({ page }) => {
    const errs = consoleErrors(page);
    await page.goto(DEMO_SELLER);
    await expect(page.getByText('Örnek akvaryum', { exact: true })).toBeVisible();
    await expect(page.getByTestId('etiket-akvaryum')).toHaveText(LABEL);
    await tankReady(page);
    await expect(page.locator('#akv-liste li')).toHaveCount(12);
    await expect(page.getByRole('link', { name: 'Akvaryumu düzenle' })).toHaveCount(0);
    await expect(page.locator('#tank')).toHaveAttribute('data-lod', 'low');
    const s = await page.evaluate(() => (window as any).__akvaryum.stats());
    expect(s.fish).toBe(12); expect(s.pixelRatio).toBeLessThanOrEqual(2); expect(s.triangles).toBeGreaterThan(10000);
    // ölçüm (yazılım WebGL): kare başına ms
    const ms = await page.evaluate(() => (window as any).__akvaryum.benchmark(20));
    test.info().annotations.push({ type: 'kare-süresi', description: `${ms.toFixed(1)} ms/kare (yazılım WebGL, 12 balık, low, ${s.width}x${s.height}); ${s.triangles} üçgen, ${s.drawCalls} çizim çağrısı, ${s.programs} program` });
    console.log('AKV-ÖLÇÜM', test.info().project.name, ms.toFixed(1), 'ms', s.triangles, s.drawCalls, s.programs);
    // temizlik
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
    const after = await page.evaluate(() => (window as any).__akvaryum.stats());
    expect(after.disposed).toBe(true); expect(after.geometries).toBe(0); expect(after.textures).toBe(0); expect(after.cache.entries).toBe(0);
    expect(errs).toEqual([]);
  });

  test('sekme gizlenince/ekran dışında durur; azaltılmış harekette durağan', async ({ page }) => {
    await page.goto(DEMO_SELLER); await tankReady(page);
    await page.locator('#tank').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => (window as any).__akvaryum.stats().active)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => (window as any).__akvaryum.stats().active)).toBe(false);
    const ctx = await page.context().browser()!.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 }, locale: 'tr-TR' });
    const p2 = await ctx.newPage(); await p2.goto(DEMO_SELLER); await tankReady(p2);
    await expect(p2.locator('#tank')).toHaveAttribute('data-reduced', 'true');
    await p2.locator('#tank-cv').focus(); await p2.keyboard.press('ArrowLeft');
    await expect.poll(async () => Number(await p2.locator('#tank').getAttribute('data-azimuth'))).toBeLessThan(0.3); // yine de döndürülebilir
    await ctx.close();
  });

  test('WebGL yoksa okunur balık listesi gösterilir', async ({ page }) => {
    await noWebgl(page);
    await page.goto(DEMO_SELLER);
    await expect(page.locator('#tank')).toHaveAttribute('data-state', 'nowebgl');
    await expect(page.locator('#tank-yedek')).toBeVisible();
    await expect(page.locator('#tank-cv')).toBeHidden();
    await expect(page.getByTestId('etiket-akvaryum')).toHaveText(LABEL);
    await expect(page.locator('#akv-liste li')).toHaveCount(12);
    await expect(page.locator('#akv-liste li').first()).toContainText('Lepistes');
  });

  test('boş durum: akvaryumu olmayan satıcı', async ({ page, browser }) => {
    await register(page);
    const href = (await page.locator('.nav-user').getAttribute('href'))!;
    const ctx = await browser.newContext(); const v = await ctx.newPage();
    await v.goto(href);
    await expect(v.getByText('Bu satıcı henüz akvaryum oluşturmadı')).toBeVisible();
    await expect(v.locator('#tank')).toHaveCount(0);
    await ctx.close();
    await page.goto(href);
    await expect(page.getByRole('link', { name: 'Akvaryum oluştur' })).toBeVisible();
  });

  test('geçersiz ve fazla balık: arayüzde hata gösterilir', async ({ page }) => {
    await register(page);
    for (let i = 0; i < 3; i++) await addFish(page, 'karides');
    await page.goto('/profil/akvaryum');
    await page.locator('#tur').selectOption('karides');
    await page.getByRole('button', { name: 'Akvaryuma ekle' }).click();
    await expect(page.getByRole('alert')).toContainText('en fazla 3 karides');
  });
});

// axe-core sayfaya satır içi betik olarak eklenir; uygulamanın CSP'si yukarıdaki testlerde açıktır.
test.describe('akvaryum erişilebilirlik (axe)', () => {
  test.use({ bypassCSP: true });
  test('profil (3B sahne), düzenleyici, yedek liste ve boş durum: ihlal yok', async ({ page }) => {
    await page.goto(DEMO_SELLER); await tankReady(page);
    expect(await axeViolations(page)).toEqual([]);
    await noWebgl(page);
    await page.goto(DEMO_SELLER);
    await expect(page.locator('#tank')).toHaveAttribute('data-state', 'nowebgl');
    expect(await axeViolations(page)).toEqual([]);
    await register(page);
    await addFish(page, 'betta'); await addFish(page, 'neon');
    expect(await axeViolations(page)).toEqual([]);
    await page.goto((await page.locator('.nav-user').getAttribute('href'))!);
    expect(await axeViolations(page)).toEqual([]);
    const empty = await page.context().newPage(); // aynı oturum: yeni kullanıcı gerekmez, boş profil için demo ikinci satıcı
    await empty.goto('/satici/2'); await expect(empty.getByText('Bu satıcı henüz akvaryum oluşturmadı')).toBeVisible();
    expect(await axeViolations(empty)).toEqual([]);
  });
});
