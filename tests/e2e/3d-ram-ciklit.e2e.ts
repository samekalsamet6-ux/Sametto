import { expect, test } from '@playwright/test';
import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'ram-ciklit', h1: '3B ram çiklit (kelebek çiklit) modeli', scope: 'Kapsam.', firstVariant: 'normal',
  variant: { id: 'gold', ad: /Altın/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 14 }, { label: 'Dişi', value: 'disi', parts: 14 }],
  sexPart: { id: 'ikinci-diken', sex: 'erkek', ad: 'Uzayan 2. sırt dikeni (erkek)' },
  verifyPart: { id: 'govde-lekesi', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Göz (kırmızı)' },
  visibility: [
    { view: 'yan', shown: ['goz', 'agiz', 'sirt-yuzgeci', 'anal-yuzgec', 'kuyruk-yuzgeci', 'govde-lekesi', 'goz-cubugu'], hidden: [] },
    { view: 'arka', shown: ['kuyruk-yuzgeci'], hidden: ['goz', 'agiz'] },
  ],
  svgCount: 6,
  forms: { ids: ['standart', 'uzun-yuzgec', 'balon'], colours: ['normal', 'gold', 'albino'], counts: { standart: 14, 'uzun-yuzgec': 14, balon: 14 } },
});

test.describe('ram çiklit: kamera ve gizlenme', () => {
  test('arkadan göz gizli; listeden gözü seçince kamera yana döner ve nokta görünür', async ({ page }) => {
    test.setTimeout(150_000);
    const vis = () => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
    await page.goto('/araclar/3d-ram-ciklit/');
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

test.describe('ram çiklit: form, cinsiyet ve dürüstlük', () => {
  test('üç form; renk form değişince korunur; erkek/dişi notu değişir; Bolivya ramı ayrı tür uyarısı görünür', async ({ page }) => {
    await page.goto('/araclar/3d-ram-ciklit/');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await expect(page.locator('#form option')).toHaveCount(3);
    await page.selectOption('#variant', 'gold');
    await page.selectOption('#form', 'balon');
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'balon');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'gold');
    await expect(page.locator('#sexnote')).toContainText('2. dikeni');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#sexnote')).toContainText('pembe');
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'disi');
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'balon');
    await expect(page.locator('.callout', { hasText: 'Bolivya ramı' }).first()).toBeVisible();
  });
});
