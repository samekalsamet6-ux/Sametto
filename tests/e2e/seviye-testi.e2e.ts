import { expect, test, type Page } from '@playwright/test';
import { questions } from '../../src/data/quiz';

const answer = async (page: Page, pick: (q: (typeof questions)[number]) => number | null) => {
  for (const q of questions) {
    const v = pick(q);
    if (v !== null) await page.locator(`input[name="${q.id}"][value="${v}"]`).check();
  }
  await page.locator('form button').click();
};

test.describe('seviye testi', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/seviye-testi/'); });

  test('18 soru, her birinin seçenekleri var', async ({ page }) => {
    await expect(page.locator('fieldset')).toHaveCount(18);
    for (const q of questions) await expect(page.locator(`input[name="${q.id}"]`)).toHaveCount(q.options.length);
  });

  test('boş test → başlangıç, 18 soru boş', async ({ page }) => {
    await page.locator('form button').click();
    await expect(page.locator('#res h2')).toContainText('Başlangıç yolu');
    await expect(page.locator('#res')).toContainText('18 soru boş bırakıldı');
  });

  test('hepsi doğru → ileri, kaçırılan soru yok', async ({ page }) => {
    await answer(page, (q) => q.correct);
    await expect(page.locator('#res h2')).toContainText('İleri seviye yolu');
    await expect(page.locator('#res')).toContainText('Tüm soruları doğru');
    await page.getByRole('link', { name: /Bu yola başla/ }).click();
    await expect(page).toHaveURL(/\/rehber\/ileri\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('başlangıç tam, orta yanlış → orta yol', async ({ page }) => {
    await answer(page, (q) => (q.tier === 'orta' ? (q.correct + 1) % q.options.length : q.correct));
    await expect(page.locator('#res h2')).toContainText('Orta seviye yolu');
    await expect(page.locator('#res .callout')).toHaveCount(6);
    await page.getByRole('link', { name: /Bu yola başla/ }).click();
    await expect(page).toHaveURL(/\/rehber\/orta\//);
  });

  test('başlangıç zayıf → başlangıç; yanlış cevap açıklama ve wiki bağlantısı gösterir', async ({ page }) => {
    await answer(page, (q) => (q.tier === 'baslangic' ? (q.correct + 1) % q.options.length : q.correct));
    await expect(page.locator('#res h2')).toContainText('Başlangıç yolu');
    const first = page.locator('#res .callout').first();
    await expect(first).toContainText('Doğru cevap');
    await first.locator('a').click();
    await expect(page).toHaveURL(/\/wiki\//);
  });

  test('seçenek sırası karışır ama değerlendirme etkilenmez', async ({ page }) => {
    const labels = async () => page.locator('fieldset').first().locator('label').allInnerTexts();
    const a = await labels();
    let differs = false;
    for (let i = 0; i < 8 && !differs; i++) { await page.reload(); differs = JSON.stringify(await labels()) !== JSON.stringify(a); }
    expect(differs).toBe(true);
  });
});
