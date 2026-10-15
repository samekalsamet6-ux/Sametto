import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const submit = (page: import('@playwright/test').Page) => page.locator('form button').first().click();

test.describe('hesaplayıcılar', () => {
  test('akvaryum hacmi', async ({ page }) => {
    await page.goto('/araclar/hacim/');
    await submit(page);
    await expect(page.locator('#out')).toHaveText('Brüt: 63 L · Net: 56.7 L');
    await page.fill('[name=length]', '0');
    await submit(page);
    await expect(page.locator('#out')).toContainText('pozitif');
  });

  test('ondalık virgül kabul edilir', async ({ page }) => {
    await page.goto('/araclar/hacim/');
    await page.fill('[name=length]', '60,5');
    await submit(page);
    await expect(page.locator('#out')).toContainText('Brüt: 63.5 L');
  });

  test('su değişimi', async ({ page }) => {
    await page.goto('/araclar/su-degisimi/');
    await submit(page);
    await expect(page.locator('#out')).toContainText('%50');
    await page.fill('[name=cur]', '10');
    await submit(page);
    await expect(page.locator('#out')).toHaveText('Değişim gerekmiyor.');
    await page.fill('[name=cur]', '80');
    await page.fill('[name=fresh]', '50');
    await submit(page);
    await expect(page.locator('#out')).toContainText('yüksek olmalı');
  });

  test('balık sayısı planlayıcı', async ({ page }) => {
    await page.goto('/araclar/stok/');
    await submit(page);
    await expect(page.locator('#out')).toContainText('Önerilen: 25');
    await page.check('[name=fry]');
    await submit(page);
    await expect(page.locator('#out')).not.toContainText('Önerilen: 25');
    await expect(page.locator('#warn')).toContainText('Yavru yükü');
  });

  test('gebelik takvimi', async ({ page }) => {
    await page.goto('/araclar/gebelik/');
    await page.fill('[name=start]', '2026-01-01');
    await submit(page);
    await expect(page.locator('#out')).toContainText('2026-01-22');
    await expect(page.locator('#out')).toContainText('2026-01-31');
    await page.fill('[name=min]', '40');
    await submit(page);
    await expect(page.locator('#out')).toContainText('aralığı geçersiz');
  });

  test('yem planlayıcı', async ({ page }) => {
    await page.goto('/araclar/yem/');
    await submit(page);
    await expect(page.locator('#out')).toContainText('Yetişkin (10): 08:00 · 20:00');
    await page.fill('[name=n0]', '5');
    await submit(page);
    await expect(page.locator('#out')).toContainText('Yeni doğan yavru (5): 08:00 · 12:00 · 16:00 · 20:00');
  });

  test('Punnett: otozomal, X ve Y', async ({ page }) => {
    await page.goto('/araclar/punnett/');
    await submit(page);
    await expect(page.locator('#out')).toContainText('BB: %25 (≈ 10) · Bb: %50 (≈ 20) · bb: %25 (≈ 10)');
    await page.selectOption('[name=mode]', 'y');
    await page.fill('[name=p2]', 'T');
    await submit(page);
    await expect(page.locator('#out')).toContainText('XYT');
    await page.selectOption('[name=mode]', 'auto');
    await page.fill('[name=p1]', 'B');
    await submit(page);
    await expect(page.locator('#out')).toContainText('2 alel gerekli');
  });

  test('Wright F', async ({ page }) => {
    await page.goto('/araclar/inbreeding/');
    await submit(page);
    await expect(page.locator('#out')).toContainText('F = 0.25');
    await page.fill('[name=sire]', 'C');
    await submit(page);
    await expect(page.locator('#out')).toContainText('F = 0.125');
    await page.fill('[name=sire]', 'Z');
    await submit(page);
    await expect(page.locator('#out')).toContainText('Bilinmeyen birey: Z');
    await page.fill('[name=ped]', 'A,B,\nB,A,');
    await page.fill('[name=sire]', 'A');
    await page.fill('[name=dam]', 'B');
    await submit(page);
    await expect(page.locator('#out')).toContainText('döngü');
  });
});

test('bakım takvimi .ics indirir', async ({ page }) => {
  await page.goto('/araclar/bakim-takvimi/');
  const [dl] = await Promise.all([page.waitForEvent('download'), submit(page)]);
  expect(dl.suggestedFilename()).toBe('lepistes-bakim.ics');
  const text = readFileSync((await dl.path())!, 'utf8');
  expect(text).toContain('BEGIN:VCALENDAR');
  expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(4);
  expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA');
  expect(text).toContain('\r\n');
  await page.locator('input[name=t]').evaluateAll((els) => els.forEach((e) => ((e as HTMLInputElement).checked = false)));
  await submit(page);
  await expect(page.locator('#out')).toHaveText('En az bir görev seçin.');
});

test.describe('azot döngüsü takipçisi', () => {
  const add = async (page: import('@playwright/test').Page, d: string, a: string, n2: string, n3: string) => {
    await page.fill('[name=date]', d);
    await page.fill('[name=nh3]', a);
    await page.fill('[name=no2]', n2);
    await page.fill('[name=no3]', n3);
    await submit(page);
  };

  test('kayıt, durum, kalıcılık, silme', async ({ page }) => {
    await page.goto('/araclar/azot-dongusu/');
    await expect(page.locator('#status')).toHaveText('Henüz ölçüm yok.');
    await add(page, '2026-01-01', '2', '0', '0');
    await expect(page.locator('#status')).toContainText('Amonyak görülüyor');
    await add(page, '2026-01-05', '1', '1', '0');
    await expect(page.locator('#status')).toContainText('Nitrit yüksek');
    await add(page, '2026-01-10', '0', '0', '10');
    await expect(page.locator('#status')).toContainText('Bir sonraki ölçümde');
    await add(page, '2026-01-12', '0', '0', '12');
    await expect(page.locator('#status')).toContainText('büyük olasılıkla tamamlandı');
    await expect(page.locator('#chart svg')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#tbl tr')).toHaveCount(5);
    await page.getByRole('button', { name: '2026-01-12 kaydını sil' }).click();
    await expect(page.locator('#tbl tr')).toHaveCount(4);
  });

  test('aynı tarih güncellenir, geçersiz değer reddedilir', async ({ page }) => {
    await page.goto('/araclar/azot-dongusu/');
    await add(page, '2026-02-01', '1', '0', '0');
    await add(page, '2026-02-01', '0', '0', '5');
    await expect(page.locator('#tbl tr')).toHaveCount(2);
    await add(page, '2026-02-02', '-1', '0', '0');
    await expect(page.locator('#status')).toContainText('0 veya pozitif');
    await expect(page.locator('#tbl tr')).toHaveCount(2);
  });

  test('dışa/içe aktarma gidiş-dönüş ve tümünü sil', async ({ page }) => {
    await page.goto('/araclar/azot-dongusu/');
    await add(page, '2026-03-01', '0.5', '0', '3');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exp')]);
    const file = (await dl.path())!;
    const json = JSON.parse(readFileSync(file, 'utf8'));
    expect(json.schemaVersion).toBe(1);
    expect(json.entries).toEqual([{ date: '2026-03-01', nh3: 0.5, no2: 0, no3: 3 }]);

    page.once('dialog', (d) => d.accept());
    await page.click('#clr');
    await expect(page.locator('#tbl tr')).toHaveCount(1);
    await page.setInputFiles('#imp', file);
    await expect(page.locator('#tbl tr')).toHaveCount(2);

    await page.setInputFiles('#imp', { name: 'bozuk.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
    await expect(page.locator('#status')).toContainText('tanınmadı');
    await expect(page.locator('#tbl tr')).toHaveCount(2);
  });
});
