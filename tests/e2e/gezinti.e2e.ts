import { expect, test } from '@playwright/test';

test('ana sayfa: seviye kartları ve araç bağlantıları', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Lepistes');
  await expect(page.locator('a.card[href^="/rehber#"]')).toHaveCount(3);
  await page.getByRole('link', { name: /Kısa testi çözün/ }).click();
  await expect(page).toHaveURL(/seviye-testi/);
});

test('üst menü tüm bölümlere gider', async ({ page }) => {
  await page.goto('/');
  for (const [name, url] of [['Rehber', /\/rehber\/?$/], ['Wiki', /\/wiki\/?$/], ['Araçlar', /\/araclar\/?$/], ['Sorun giderme', /sorun-giderme/], ['Kaynaklar', /kaynaklar/], ['Hakkında', /hakkinda/]] as const) {
    await page.locator('header.site nav').getByRole('link', { name }).click();
    await expect(page).toHaveURL(url);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test.describe('rehber', () => {
  test('üç seviye de 15 ders listeler', async ({ page }) => {
    await page.goto('/rehber/');
    for (const lvl of ['baslangic', 'orta', 'ileri']) await expect(page.locator(`#${lvl} a.card`)).toHaveCount(15);
  });

  test('ders: içindekiler, önceki/sonraki, terim bağlantısı', async ({ page }) => {
    await page.goto('/rehber/baslangic/05-azot-dongusu-kurulum/');
    await expect(page.locator('h1')).toHaveText('Azot döngüsü: tankı hazırlamak');
    await expect(page.locator('nav.toc a').first()).toBeVisible();
    await expect(page.locator('figure.diyagram svg')).toHaveCount(2);
    await expect(page.locator('.lesson-nav a')).toHaveCount(2);
    const term = page.locator('a.terim').first();
    const href = await term.getAttribute('href');
    expect(href).toMatch(/^\/wiki\//);
    await page.locator('.lesson-nav a').last().click();
    await expect(page).toHaveURL(/06-su-parametreleri/);
    await page.locator('.lesson-nav a').first().click();
    await expect(page).toHaveURL(/05-azot-dongusu-kurulum/);
  });

  test('ilk dersin önceki, son dersin sonraki bağlantısı yok; seviyeler arası geçiş var', async ({ page }) => {
    await page.goto('/rehber/baslangic/01-lepistes-nedir/');
    await expect(page.locator('.lesson-nav a')).toHaveCount(1);
    await page.goto('/rehber/baslangic/15-baslangic-sinavi-ve-sonraki-adim/');
    await expect(page.locator('.lesson-nav a').last()).toHaveAttribute('href', /\/rehber\/orta\/01-/);
    await page.goto('/rehber/ileri/15-vaka-calismalari-ve-ileri-sinav/');
    await expect(page.locator('.lesson-nav a')).toHaveCount(1);
  });

  test('doğrulanmamış içerikte uyarı görünür', async ({ page }) => {
    await page.goto('/rehber/orta/03-cinsiyet-ayrimi-zamani/');
    await expect(page.locator('.callout-uyari').first()).toContainText('doğrulanmayı bekliyor');
    await page.goto('/wiki/sallanma-hastaligi/');
    await expect(page.locator('.callout-uyari').first()).toContainText('doğrulanmayı bekliyor');
    await page.goto('/rehber/baslangic/13-rutin-bakim-takvimi/');
    await expect(page.getByText('doğrulanmayı bekliyor')).toHaveCount(0);
  });
});

test.describe('wiki', () => {
  test('liste kategorilere ayrılır', async ({ page }) => {
    await page.goto('/wiki/');
    expect(await page.locator('section h2').count()).toBeGreaterThanOrEqual(8);
    expect(await page.locator('a.card').count()).toBe(63);
  });

  test('madde: ilgili maddeler ve geri bağlantı', async ({ page }) => {
    await page.goto('/wiki/gonopodium/');
    await expect(page.locator('figure.diyagram svg')).toHaveCount(1);
    const related = page.locator('section.related a');
    await expect(related.first()).toBeVisible();
    await page.goto('/wiki/gravid-spot/');
    await expect(page.locator('section.related')).toContainText('Gonopodium');
  });
});

test('sözlük, SSS ve kaynaklar', async ({ page }) => {
  await page.goto('/sozluk/');
  await page.locator('a.az').first().click();
  await expect(page).toHaveURL(/#h-/);
  await page.goto('/sss/');
  const first = page.locator('details').first();
  await expect(first).not.toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await page.goto('/kaynaklar/');
  await expect(page.locator('li#paris2022')).toContainText('Nature Communications');
  await expect(page.locator('li#lindholm2002')).toContainText('Özgün makale okunamadı');
});

test('olmayan sayfa 404 verir', async ({ request }) => {
  expect((await request.get('/olmayan-sayfa/')).status()).toBe(404);
});

test.describe('arama (Pagefind)', () => {
  test('wiki maddesini bulur ve sonuca gider', async ({ page }) => {
    await page.goto('/ara/');
    const input = page.locator('.pagefind-ui__search-input');
    await expect(input).toHaveAttribute('aria-label', 'Sitede ara');
    await input.fill('gonopodium');
    const result = page.locator('.pagefind-ui__result-link').first();
    await expect(result).toBeVisible({ timeout: 10_000 });
    await result.click();
    await expect(page).toHaveURL(/gonopodium|lepistes-nedir|ureme|cinsiyet/);
  });

  test('Türkçe karakter olmadan da bulur', async ({ page }) => {
    await page.goto('/ara/');
    await page.locator('.pagefind-ui__search-input').fill('azot dongusu');
    await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
  });
});

test('erişilebilirlik temelleri: atlama bağlantısı, dil, tek h1', async ({ page }) => {
  await page.goto('/rehber/orta/04-secilim-temelleri/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#icerik$/);
});
