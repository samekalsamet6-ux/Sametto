import { expect, test } from '@playwright/test';
import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'cuce-gurami', h1: '3B cüce gurami modeli', scope: 'Kapsam.', firstVariant: 'neon',
  variant: { id: 'kobalt', ad: /Kobalt/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 13 }, { label: 'Dişi', value: 'disi', parts: 13 }],
  verifyPart: { id: 'labirent', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Göz' },
  visibility: [
    { view: 'yan', shown: ['goz', 'agiz', 'sirt-yuzgeci', 'anal-yuzgec', 'kuyruk-yuzgeci', 'seritler'], hidden: [] },
    { view: 'arka', shown: ['kuyruk-yuzgeci'], hidden: ['goz', 'agiz'] },
  ],
  svgCount: 2,
  // forms verilmez: yardımcı paket en az iki form bekler; tek (dürüst) form aşağıda ayrıca sınanır
});

test.describe('cüce gurami: kamera ve gizlenme', () => {
  test('arkadan göz gizli; listeden gözü seçince kamera yana döner ve nokta görünür', async ({ page }) => {
    test.setTimeout(150_000);
    const vis = () => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
    await page.goto('/araclar/3d-cuce-gurami/');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await page.uncheck('#swim');
    await page.locator('.v3-btn[data-view=arka]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'arka');
    await page.locator('#stage').scrollIntoViewIfNeeded(); // tuval görünmezken çizim durur
    await expect.poll(async () => (await vis()).includes('goz'), { timeout: 30_000 }).toBe(false);
    await page.locator('.v3-part[data-part=goz]').click();
    await expect(page.locator('#stage')).toHaveAttribute('data-view', 'yan');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect.poll(vis, { timeout: 30_000 }).toContain('goz');
  });
});

test.describe('cüce gurami: dürüst form notu ve cinsiyet', () => {
  test('tek form söylenir; erkek/dişi notu ve sırt yüzgeci özeti değişir', async ({ page }) => {
    await page.goto('/araclar/3d-cuce-gurami/');
    await page.locator('#stage').scrollIntoViewIfNeeded();
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await expect(page.locator('#formnote')).toContainText('bulunamadı');
    await expect(page.locator('#form option')).toHaveCount(1);
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'standart');
    await page.selectOption('#variant', 'alev');
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'standart');
    await expect(page.locator('#stage')).toHaveAttribute('data-variant', 'alev');
    await expect(page.locator('#sexnote')).toContainText('sivri');
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await expect(page.locator('#sexnote')).toContainText('kısa ve yuvarlak');
    await expect(page.locator('#stage')).toHaveAttribute('data-sex', 'disi');
    await expect(page.getByText('Labirent organı iç organdır').first()).toBeVisible();
  });
});
