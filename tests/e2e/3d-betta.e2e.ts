import { expect, test } from '@playwright/test';
import { FORMS } from '../../src/lib/betta/forms';
import { speciesSuite } from './species-helpers';

speciesSuite({
  slug: 'betta', h1: '3B betta modeli', scope: 'Kapsam.', firstVariant: 'kirmizi',
  variant: { id: 'koi', ad: /Koi/ },
  sexes: [{ label: 'Erkek', value: 'erkek', parts: 11 }, { label: 'Dişi', value: 'disi', parts: 12 }],
  sexPart: { id: 'yumurta-borusu', sex: 'disi', ad: 'Yumurta borusu noktası (ovipozitör)' },
  verifyPart: { id: 'govde', text: /Kaynakla doğrulanmalı/ },
  pick: { id: 'goz', ad: 'Gözler' },
  visibility: [
    { view: 'yan', shown: ['goz', 'solungac-kapagi', 'sirt-yuzgeci', 'kuyruk-yuzgeci', 'anal-yuzgec'], hidden: [] },
    { view: 'alt', shown: ['anal-yuzgec', 'karin-yuzgeci'], hidden: ['sirt-yuzgeci'] },
  ],
  svgCount: 2,
});

// ---- Form (şekil) varyeteleri
const hotParts = (page: import('@playwright/test').Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));

test.describe('3B betta: form varyeteleri', () => {
  test.setTimeout(240_000);
  test('form seçici gruplu; ilk seçenek plakat; renk seçicisinden bağımsız; form listesi sayfada', async ({ page }) => {
    await page.goto('/araclar/3d-betta/');
    await expect(page.locator('#form')).toBeVisible();
    await expect(page.locator('#form option')).toHaveCount(FORMS.length);
    await expect(page.locator('#form')).toHaveValue('plakat');
    await expect(page.locator('#form optgroup')).toHaveCount(4);
    await expect(page.locator('#stage')).toHaveAttribute('data-form', 'plakat');
    await expect(page.locator('#formnote')).toContainText('Plakat');
    await expect(page.getByRole('heading', { name: 'Form (şekil) varyeteleri' })).toBeVisible();
  });

  test('her form × birkaç renk × iki cinsiyet hatasız yüklenir; form değişince renk korunur; numaralar çalışır', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/araclar/3d-betta/');
    await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
    await page.uncheck('#swim');
    const colours = ['koi', 'selofan', 'siyah-orkide'];
    let i = 0;
    for (const f of FORMS) {
      const colour = colours[i++ % colours.length];
      await page.selectOption('#variant', colour);
      await page.selectOption('#form', f.id);
      await expect(page.locator('#stage')).toHaveAttribute('data-form', f.id);
      await expect(page.locator('#stage')).toHaveAttribute('data-variant', colour);
      await expect(page.locator('#variant')).toHaveValue(colour);
      await expect(page.locator('#formnote')).toContainText(f.ad.split(' (')[0].split(' /')[0]);
      await expect.poll(async () => (await hotParts(page)).length, { timeout: 20_000 }).toBeGreaterThan(3);
    }
    // dişi ve forma bağlı parça açıklaması
    await page.getByRole('radio', { name: 'Dişi' }).check();
    await page.selectOption('#form', 'halfmoon');
    await expect(page.locator('#parts li:not([hidden])')).toHaveCount(12);
    await page.locator('.v3-part[data-part=kuyruk-yuzgeci]').click();
    await expect(page.locator('#detail')).toContainText('Halfmoon');
    await page.selectOption('#form', 'dumbo');
    await expect(page.locator('#detail')).toContainText('Kuyruk yüzgeci'); // seçim korunur
    // numaraları kapat/aç
    await page.uncheck('#hotspots');
    await expect.poll(() => hotParts(page)).toEqual([]);
    await page.check('#hotspots');
    await expect.poll(async () => (await hotParts(page)).length).toBeGreaterThan(3);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
