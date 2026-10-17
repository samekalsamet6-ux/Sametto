import { expect, test } from '@playwright/test';
import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'pleko', h1: '3B pleko modeli', scope: 'L144 ve tür kimliği.', firstVariant: 'limon-mavi-goz',
  variant: { id: 'albino', ad: /Albino/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 13 }, { label: 'Dişi', value: 'disi', parts: 13 }],
  sexPart: { id: 'bristle-disi', sex: 'disi', ad: 'Kısa bristle’lar (dişi)' },
  verifyPart: { id: 'govde', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Gözler (L144: soluk mavi)' },
  visibility: [
    { view: 'ust', shown: ['goz', 'gogus-yuzgeci', 'govde'], hidden: ['agiz'] },
    { view: 'alt', shown: ['agiz', 'karin-yuzgeci', 'anal-yuzgec'], hidden: ['goz', 'sirt-yuzgeci'] },
  ],
  turnTo: { from: 'ust', part: 'agiz', to: 'alt' },
  svgCount: 3,
});

test.describe('3B pleko: şekil (form) ve renk bağımsızlığı', () => {
  test('her form x birkaç renk hatasız yüklenir; form değişince renk korunur; numaralar çalışır', async ({ page }) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/araclar/3d-pleko');
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    for (const color of ['limon-mavi-goz', 'albino', 'calico']) {
      await page.locator('#variant').selectOption(color);
      for (const form of ['tul', 'normal']) {
        await page.locator('#form').selectOption(form);
        await expect(page.locator('#stage')).toHaveAttribute('data-form', form);
        await expect(page.locator('#stage')).toHaveAttribute('data-variant', color);
      }
    }
    await page.locator('#form').selectOption('tul');
    await page.locator('#cv').focus();
    await expect(page.locator('.v3-hot:not([hidden])').first()).toBeVisible();
    await page.getByLabel('Numaraları göster').uncheck();
    await expect(page.locator('.v3-hot:not([hidden])')).toHaveCount(0);
    await page.getByLabel('Numaraları göster').check();
    expect(errors).toEqual([]);
  });
});
