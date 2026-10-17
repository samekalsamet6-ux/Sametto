// Balık 3B sayfaları (betta, neon, corydoras, japon) için ortak uçtan uca test paketi.
import { expect, test, type Page } from '@playwright/test';

export interface SpeciesE2E {
  slug: string;
  h1: string;
  /** Sayfada görünmesi gereken kapsam notunun başlığı (ör. "Kapsam.") */
  scope: string;
  firstVariant: string;
  /** Seçilip açıklaması sexnote içinde beklenen varyete */
  variant: { id: string; ad: RegExp };
  sexes: { label: string; value: string; parts: number }[];
  /** Yalnızca bir cinsiyette bulunan parça: kimlik, o cinsiyet, ad */
  sexPart?: { id: string; sex: string; ad: string };
  /** Seçilince doğrulanmalı rozeti/uyarı beklenen parça */
  verifyPart: { id: string; text: RegExp };
  /** Liste ve nokta ile seçilecek parça */
  pick: { id: string; ad: string };
  /** Görünüm bazlı görünürlük beklentileri */
  visibility: { view: string; shown: string[]; hidden: string[] }[];
  /** Listeden seçilince kameranın döneceği parça (görünümde gizliyken) */
  turnTo?: { from: string; part: string; to: string };
  svgCount: number;
}

const ready = (page: Page) => expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
const visibleParts = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.v3-hot:not([hidden])')].map((b) => b.dataset.part));
const goView = async (page: Page, v: string) => {
  await page.uncheck('#swim');
  await page.locator(`.v3-btn[data-view=${v}]`).click();
  await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
  await page.waitForTimeout(1300);
};

export function speciesSuite(c: SpeciesE2E) {
  const URL = `/araclar/3d-${c.slug}/`;
  test.describe(c.h1, () => {
    // yazılım (SwiftShader) çizimi ve paylaşılan CI makineleri yavaş olabilir
    test.setTimeout(150_000);
    test('sayfa açılır, kapsam notu görünür, model yüklenir; numaralar varsayılan açık', async ({ page }) => {
      await page.goto(URL);
      await expect(page.locator('h1')).toHaveText(c.h1);
      await expect(page.getByText(c.scope).first()).toBeVisible();
      await ready(page);
      await expect(page.locator('#cv')).toHaveAttribute('aria-label', /3B model/);
      await expect(page.locator('#swim')).toBeChecked();
      await expect(page.locator('#hotspots')).toBeChecked();
      await expect(page.locator('.v3-hot:not([hidden])').first()).toBeVisible();
    });

    test('cinsiyet değişince parça listesi değişir', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      const list = page.locator('#parts li:not([hidden])');
      if (c.sexes.length === 1) { await expect(list).toHaveCount(c.sexes[0].parts); return; }
      for (const s of c.sexes) {
        await page.getByRole('radio', { name: s.label }).check();
        await expect(page.locator('#stage')).toHaveAttribute('data-sex', s.value);
        await expect(list).toHaveCount(s.parts);
        await expect(page.locator('#sexnote')).not.toBeEmpty();
        if (c.sexPart) {
          const li = page.locator(`#parts li[data-part=${c.sexPart.id}]`);
          if (s.value === c.sexPart.sex) await expect(li).toBeVisible(); else await expect(li).toBeHidden();
        }
      }
    });

    test('parça seçimi açıklamayı gösterir; doğrulanmalı/uyarı; cinsiyete özgü seçim cinsiyet değişince temizlenir', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      if (c.sexPart && c.sexes.length > 1) {
        await page.getByRole('radio', { name: c.sexes.find((s) => s.value === c.sexPart!.sex)!.label }).check();
        const sb = page.locator(`.v3-part[data-part=${c.sexPart.id}]`);
        await sb.click();
        await expect(sb).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#detail h3')).toHaveText(c.sexPart.ad);
        await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', c.sexPart.id);
        await page.getByRole('radio', { name: c.sexes.find((s) => s.value !== c.sexPart!.sex)!.label }).check();
        await expect(page.locator('#detail')).toContainText('Bir parça seçin');
      }
      await page.locator(`.v3-part[data-part=${c.verifyPart.id}]`).click();
      await expect(page.locator('#detail')).toContainText(c.verifyPart.text);
    });

    test('klavyeyle parça seçilebilir', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      await page.locator(`.v3-part[data-part=${c.pick.id}]`).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#detail h3')).toHaveText(c.pick.ad);
      await page.keyboard.press('Enter');
      await expect(page.locator('#detail')).toContainText('Bir parça seçin');
    });

    test('numaralı nokta tıklaması parçayı seçer; "Numaraları göster" kapatılınca noktalar gizlenir, liste çalışır, açılınca döner', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      await goView(page, 'yan');
      await page.evaluate(() => window.scrollTo(0, (document.getElementById('stage')?.offsetTop ?? 0) - 100));
      await page.locator(`.v3-hot[data-part=${c.pick.id}]`).click();
      await expect(page.locator('#detail h3')).toHaveText(c.pick.ad);
      await page.uncheck('#hotspots');
      await expect(page.locator('#stage')).toHaveAttribute('data-hotspots', 'off');
      await expect.poll(async () => (await visibleParts(page)).length).toBe(0);
      await expect(page.locator('#hot')).toBeHidden();
      // liste yine çalışır
      await page.locator(`.v3-part[data-part=${c.pick.id}]`).click();
      await expect(page.locator('#detail')).toContainText('Bir parça seçin');
      await page.locator(`.v3-part[data-part=${c.pick.id}]`).click();
      await expect(page.locator('#detail h3')).toHaveText(c.pick.ad);
      await page.check('#hotspots');
      await expect.poll(async () => (await visibleParts(page)).length).toBeGreaterThan(2);
      await expect(page.locator('.v3-hot.on')).toHaveAttribute('data-part', c.pick.id);
    });

    test('gizlenme: görünüme göre yalnızca görünen yüzdeki noktalar gösterilir', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      for (const v of c.visibility) {
        await goView(page, v.view);
        const vis = await visibleParts(page);
        for (const id of v.shown) expect(vis, `${v.view}: ${id} görünmeli`).toContain(id);
        for (const id of v.hidden) expect(vis, `${v.view}: ${id} gizli olmalı`).not.toContain(id);
      }
      // yüzme açıkken de aynı kalır
      const last = c.visibility[c.visibility.length - 1];
      await page.check('#swim');
      await page.waitForTimeout(800);
      const vis = await visibleParts(page);
      for (const id of last.shown) expect(vis).toContain(id);
      for (const id of last.hidden) expect(vis).not.toContain(id);
    });

    if (c.turnTo) {
      test('listeden gizli bir parça seçilince kamera dönüp noktayı gösterir', async ({ page }) => {
        const t = c.turnTo!;
        await page.goto(URL);
        await ready(page);
        await goView(page, t.from);
        expect(await visibleParts(page)).not.toContain(t.part);
        await page.locator(`.v3-part[data-part=${t.part}]`).click();
        await expect(page.locator('#stage')).toHaveAttribute('data-view', t.to);
        await page.locator('#stage').scrollIntoViewIfNeeded(); // tuval görünmezken çizim durur
        await expect.poll(() => visibleParts(page), { timeout: 20_000 }).toContain(t.part);
      });
    }

    test('varyete seçimi, yüzme ve otomatik döndürme anahtarları, görünüm düğmeleri', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      await page.selectOption('#variant', c.variant.id);
      await expect(page.locator('#stage')).toHaveAttribute('data-variant', c.variant.id);
      await expect(page.locator('#sexnote')).toContainText(c.variant.ad);
      await page.uncheck('#swim');
      await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
      await page.check('#rot');
      await expect(page.locator('#stage')).toHaveAttribute('data-rotate', 'on');
      const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
      await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 30_000 }).toBeGreaterThan(f0 + 2);
      await page.uncheck('#rot');
      for (const v of ['ust', 'alt', 'yan', 'on', 'arka', 'capraz'] as const) {
        await page.locator(`.v3-btn[data-view=${v}]`).click();
        await expect(page.locator('#stage')).toHaveAttribute('data-view', v);
      }
    });

    test('her varyete her cinsiyette hata vermeden yüklenir', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(URL);
      await ready(page);
      const ids = await page.locator('#variant option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
      expect(ids[0]).toBe(c.firstVariant);
      for (const s of c.sexes) {
        if (c.sexes.length > 1) await page.getByRole('radio', { name: s.label }).check();
        for (const o of ids) {
          await page.selectOption('#variant', o);
          await expect(page.locator('#stage')).toHaveAttribute('data-variant', o);
        }
      }
      expect(errors).toEqual([]);
    });

    test('tuvale odaklanıp ok tuşları ile döndürülür (kare üretilir)', async ({ page }) => {
      await page.goto(URL);
      await ready(page);
      await page.locator('#cv').focus();
      const f0 = Number(await page.locator('#cv').getAttribute('data-frames'));
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('+');
      await expect.poll(async () => Number(await page.locator('#cv').getAttribute('data-frames')), { timeout: 30_000 }).toBeGreaterThan(f0);
    });

    test('hareket azaltma tercihinde animasyonlar kapalı başlar', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(URL);
      await ready(page);
      await expect(page.locator('#swim')).not.toBeChecked();
      await expect(page.locator('#rot')).not.toBeChecked();
      await expect(page.locator('#stage')).toHaveAttribute('data-swim', 'off');
    });

    test('WebGL yoksa SVG yedeği ve parça açıklamaları görünür', async ({ page }) => {
      await page.addInitScript(() => {
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
          if (/webgl/.test(type)) return null;
          return (orig as (...x: unknown[]) => unknown).call(this, type, ...a);
        } as typeof orig;
      });
      await page.goto(URL);
      await expect(page.locator('#fallback')).toBeVisible();
      await expect(page.locator('#fallback')).toContainText('3B görüntü bu tarayıcıda açılamadı');
      await expect(page.locator('#fallback svg')).toHaveCount(c.svgCount);
      await expect(page.locator('#cv')).toBeHidden();
      await page.locator(`.v3-part[data-part=${c.pick.id}]`).click();
      await expect(page.locator('#detail h3')).toHaveText(c.pick.ad);
    });
  });
}
