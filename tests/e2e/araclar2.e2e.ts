import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const submit = (page: Page, sel = 'form button') => page.locator(sel).first().click();

test('araç dizini 25 aracı listeler', async ({ page }) => {
  await page.goto('/araclar/');
  await expect(page.locator('a.card')).toHaveCount(25);
});

test('maliyet ve kârlılık', async ({ page }) => {
  await page.goto('/araclar/maliyet/');
  await submit(page);
  const out = page.locator('#out');
  await expect(out).toContainText('495.33');
  await expect(out).toContainText('24.77');
  await expect(out).toContainText('304.67');
  await expect(out).toContainText('ayda 13 balık');
  await page.fill('[name=sold]', '0');
  await submit(page);
  await expect(out).toContainText('Balık başı maliyet: —');
  await page.fill('[name=life]', '0');
  await submit(page);
  await expect(out).toContainText('ömrü pozitif');
});

test.describe('etiket oranı ölçekleyici', () => {
  test('uyarı görünür; iki mod doğru hesaplar', async ({ page }) => {
    await page.goto('/araclar/dozaj/');
    await expect(page.getByText('Bu araç doz önermez')).toBeVisible();
    await page.fill('#f1 [name=net]', '100');
    await page.fill('#f1 [name=amt]', '5');
    await page.fill('#f1 [name=per]', '40');
    await page.locator('#f1 button').click();
    await expect(page.locator('#out1')).toContainText('12.5');
    await page.fill('#f2 [name=net]', '50');
    await page.fill('#f2 [name=target]', '2');
    await page.fill('#f2 [name=stock]', '100');
    await page.locator('#f2 button').click();
    await expect(page.locator('#out2')).toContainText('1 mL');
  });

  test('geçersiz girdi reddedilir', async ({ page }) => {
    await page.goto('/araclar/dozaj/');
    await page.fill('#f1 [name=net]', '0');
    await page.fill('#f1 [name=amt]', '5');
    await page.fill('#f1 [name=per]', '40');
    await page.locator('#f1 button').click();
    await expect(page.locator('#out1')).toContainText('pozitif');
  });
});

test.describe('büyüme takipçisi', () => {
  const addCohort = async (page: Page, name: string, birth: string) => {
    await page.fill('#fc [name=name]', name);
    await page.fill('#fc [name=birth]', birth);
    await page.locator('#fc button').click();
  };
  const addM = async (page: Page, date: string, len: string, n = '5') => {
    await page.fill('#fm [name=date]', date);
    await page.fill('#fm [name=len]', len);
    await page.fill('#fm [name=n]', n);
    await page.locator('#fm button').click();
  };

  test('grup, ölçüm, hız, kalıcılık, silme', async ({ page }) => {
    await page.goto('/araclar/buyume/');
    await expect(page.locator('#chart')).toHaveText('');
    await addCohort(page, 'Parti 1', '2026-01-01');
    await expect(page.locator('#cmsg')).toHaveText('Grup eklendi.');
    await addM(page, '2026-01-15', '10');
    await addM(page, '2026-01-29', '16');
    await expect(page.locator('#summary')).toContainText('2 ölçüm');
    await expect(page.locator('#summary')).toContainText('3 mm/hafta');
    await expect(page.locator('#chart svg')).toHaveCount(1);
    await expect(page.locator('#tbl')).toContainText('28');
    await page.reload();
    await expect(page.locator('#tbl tr')).toHaveCount(3);
    await page.getByRole('button', { name: '2026-01-15 ölçümünü sil' }).click();
    await expect(page.locator('#tbl tr')).toHaveCount(2);
  });

  test('doğum öncesi ve geçersiz ölçüm reddedilir; referans uyarısı görünür', async ({ page }) => {
    await page.goto('/araclar/buyume/');
    await expect(page.getByText('Referans eğri yok')).toBeVisible();
    await addCohort(page, 'Parti 2', '2026-02-01');
    await addM(page, '2026-01-31', '5');
    await expect(page.locator('#mmsg')).toContainText('doğum tarihinden önce');
    await addM(page, '2026-02-10', '0');
    await expect(page.locator('#mmsg')).toContainText('0–200');
  });

  test('dışa/içe aktarma gidiş-dönüş', async ({ page }) => {
    await page.goto('/araclar/buyume/');
    await addCohort(page, 'Parti 3', '2026-03-01');
    await addM(page, '2026-03-15', '9');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exp')]);
    const file = (await dl.path())!;
    const json = JSON.parse(readFileSync(file, 'utf8'));
    expect(json.schemaVersion).toBe(1);
    expect(json.cohorts[0].name).toBe('Parti 3');
    expect(json.measurements).toHaveLength(1);
    page.once('dialog', (d) => d.accept());
    await page.click('#clr');
    await expect(page.locator('#tbl tr')).toHaveCount(0);
    await page.setInputFiles('#imp', file);
    await expect(page.locator('#tbl tr')).toHaveCount(2);
    await page.setInputFiles('#imp', { name: 'bozuk.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":1,"cohorts":[],"measurements":[{"cohortId":"x"}]}') });
    await expect(page.locator('#mmsg')).toContainText('geçersiz');
  });
});

test.describe('pedigri çizici', () => {
  test('varsayılan soy ağacı çizilir, F değerleri doğru', async ({ page }) => {
    await page.goto('/araclar/pedigri/');
    await expect(page.locator('#out svg')).toHaveCount(1);
    await expect(page.locator('#msg')).toContainText('5 birey, 6 bağlantı');
    const row = (id: string) => page.locator('#tbl tr').filter({ has: page.locator('td', { hasText: new RegExp(`^${id}$`) }) });
    await expect(row('C').locator('td').nth(2)).toHaveText('0.25');
    await expect(row('A').locator('td').nth(2)).toHaveText('0');
    await expect(page.locator('#out svg')).toHaveAttribute('role', 'img');
  });

  test('döngü hatası gösterilir ve çizim temizlenir', async ({ page }) => {
    await page.goto('/araclar/pedigri/');
    await page.fill('[name=ped]', 'A,B,\nB,A,');
    await submit(page);
    await expect(page.locator('#msg')).toContainText('döngü');
    await expect(page.locator('#out svg')).toHaveCount(0);
  });

  test('tanımsız ata soluk gösterilir; SVG indirilebilir', async ({ page }) => {
    await page.goto('/araclar/pedigri/');
    await page.fill('[name=ped]', 'X,P,Q');
    await submit(page);
    await expect(page.locator('#tbl')).toContainText('bilinmiyor');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dl')]);
    expect(dl.suggestedFilename()).toBe('pedigri.svg');
    const text = readFileSync((await dl.path())!, 'utf8');
    expect(text).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(text).not.toContain('class=');
  });
});

test('sorun giderme: sürtünme → Gyrodactylus ilk sırada', async ({ page }) => {
  await page.goto('/sorun-giderme/');
  await page.check('input[value=surtunme]');
  await page.locator('form button').click();
  await expect(page.locator('#res article').first().locator('h3')).toContainText('Gyrodactylus');
  await expect(page.locator('#res article').first().locator('a')).toHaveAttribute('href', '/wiki/gyrodactylus');
});

test('kanıt düzeyi rozeti ve kaynak notları görünür', async ({ page }) => {
  await page.goto('/rehber/baslangic/10-ureme-biyolojisi/');
  await expect(page.locator('.badge.ev-karma')).toContainText('Kanıt: karma');
  await expect(page.getByText('25–35 gün')).toBeVisible();
  await page.goto('/kaynaklar/');
  await expect(page.getByText('Okuma yöntemi')).toBeVisible();
  await expect(page.locator('li#dzikowski2001')).toContainText('25–27');
});
