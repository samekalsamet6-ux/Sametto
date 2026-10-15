import { expect, test } from '@playwright/test';

test.describe('sorun giderme', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/sorun-giderme/'); });

  test('beyaz noktalar → beyaz benek, güçlü işaret', async ({ page }) => {
    await page.check('input[value=beyaz-noktalar]');
    await page.locator('form button').click();
    const first = page.locator('#res article').first();
    await expect(first.locator('h3')).toContainText('Beyaz benek');
    await expect(first.locator('.badge')).toHaveText('Güçlü işaret');
    await expect(first.locator('a')).toHaveAttribute('href', '/wiki/beyaz-benek');
    await expect(page.locator('#triage .callout')).toHaveCount(0);
  });

  test('acil belirtilerde uyarı çıkar', async ({ page }) => {
    await page.check('input[value=ani-toplu-olum]');
    await page.check('input[value=yuzeyde-nefes]');
    await page.locator('form button').click();
    await expect(page.locator('#triage .callout-hata')).toContainText('Acil durum');
    await expect(page.locator('#res article').first().locator('h3')).toContainText('Amonyak');
  });

  test('seçim yoksa uyarır; sonuç sayısı en fazla 5', async ({ page }) => {
    await page.locator('form button').click();
    await expect(page.locator('#res')).toContainText('En az bir belirti seçin');
    for (const cb of await page.locator('input[name=s]').all()) await cb.check();
    await page.locator('form button').click();
    expect(await page.locator('#res article').count()).toBeLessThanOrEqual(5);
  });

  test('ilaç dozu verilmez, uyarı görünür', async ({ page }) => {
    await expect(page.getByText('İlaç ve tuz dozları burada verilmez')).toBeVisible();
  });

  test('sonuçtaki wiki bağlantıları açılır', async ({ page }) => {
    await page.check('input[value=pamuk-tuy]');
    await page.locator('form button').click();
    await page.locator('#res article a').first().click();
    await expect(page.locator('h1')).toContainText('Mantar');
  });
});
