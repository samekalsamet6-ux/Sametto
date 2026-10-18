import { expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { placeholderPng } from '../../server/placeholder.ts';

export const photo = (n = 1) => ({ name: `balik-${n}.png`, mimeType: 'image/png', buffer: placeholderPng(n, 'ÖRNEK') });
let seq = 0;
export const uniqueEmail = (tag: string) => `${tag}.${Date.now().toString(36)}${seq++}${Math.random().toString(36).slice(2, 6)}@example.test`;
export const PASSWORD = 'e2e-parola-123';

export async function register(page: Page, email = uniqueEmail('kul'), name = 'E2E Kullanıcı') {
  await page.goto('/kayit');
  await page.getByLabel('Görünen ad').fill(name);
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Parola (en az 8 karakter)').fill(PASSWORD);
  await page.getByLabel('Parola (tekrar)').fill(PASSWORD);
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await expect(page).toHaveURL('/');
  return email;
}

export async function webglReady(page: Page, timeout = 45_000) {
  await expect(page.locator('#sahne')).toHaveAttribute('data-state', 'ready', { timeout });
}

const require = createRequire(import.meta.url);
export async function axeViolations(page: Page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const res = await page.evaluate(async () => {
    // @ts-expect-error axe sayfaya eklendi
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map((v: { id: string; impact: string; nodes: { target: string[] }[] }) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 3) }));
  });
  return res;
}
