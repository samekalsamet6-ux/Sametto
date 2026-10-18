import { expect, test } from '@playwright/test';
import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'zebra-danio', h1: '3B zebra balığı (zebra danio) modeli', scope: 'Kapsam.', firstVariant: 'normal',
  variant: { id: 'leopar', ad: /Leopar/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 12 }, { label: 'Dişi', value: 'disi', parts: 12 }],
  verifyPart: { id: 'biyik', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Göz' },
  visibility: [
    { view: 'yan', shown: ['goz', 'agiz', 'sirt-yuzgeci', 'anal-yuzgec', 'kuyruk-yuzgeci', 'seritler'], hidden: [] },
    { view: 'arka', shown: ['kuyruk-yuzgeci'], hidden: ['goz', 'agiz'] },
  ],
  svgCount: 4,
  forms: { ids: ['standart', 'uzun-yuzgec'], colours: ['normal', 'leopar', 'albino'], counts: { standart: 12, 'uzun-yuzgec': 12 } },
});

test.describe('zebra danio: kamera ve gizlenme', () => {
  test('arkadan göz gizli; listeden gözü seçince kamera yana döner ve nokta görünür', async ({ page }) => {
    test.setTimeout(150_000);
    const vis = () => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
    await page.goto('/araclar/3d-zebra-danio/');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await page.uncheck('#swim');
    await page.locator('.v3-btn[data-view=arka]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'arka');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await vis()).includes('goz'), { timeout: 30_000 }).toBe(false);
    await page.locator('.v3-part[data-part=goz]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'yan');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect.poll(vis, { timeout: 30_000 }).toContain('goz');
  });
});

test.describe('zebra danio: form ve cinsiyet', () => {
  test('iki form; renk form değişince korunur; erkek/dişi notu değişir; bıyık notu', async ({ page }) => {
    await page.goto('/araclar/3d-zebra-danio/');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await expect(page.locator('#form option')).toHaveCount(2);
    await page.selectOption('#variant', 'altin');
    await page.selectOption('#form', 'uzun-yuzgec');
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'uzun-yuzgec');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'altin');
    await expect(page.locator('#sexnote')).toContainText('altın–sarımsı');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#sexnote')).toContainText('dolgun');
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'disi');
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'uzun-yuzgec');
    await expect(page.locator('.callout', { hasText: 'çift bıyık' }).first()).toBeVisible();
  });
});
