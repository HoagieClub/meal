/**
 * Saves screenshots of the app at phone, tablet and desktop sizes for a visual check.
 * Run with `bun run screenshots`; the images land in ./screenshots (git-ignored) unless
 * SCREENSHOT_DIR says otherwise.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const outDir = process.env.SCREENSHOT_DIR ?? 'screenshots';

test('capture the app at every size', async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(outDir, { recursive: true });
  const shoot = (name: string, fullPage = false) =>
    page.screenshot({ path: join(outDir, `${name}.png`), fullPage });

  const firstItem = page.locator('[data-item-id]').first();
  const toggleFirstItem = () => firstItem.locator('span').first().click();

  await page.goto('/');
  await expect(page.locator('.card-fade-up').first()).toBeVisible({ timeout: 90_000 });
  await page.waitForTimeout(1500); // let the splash screen leave and animations settle
  await shoot('desktop-1400');
  await shoot('desktop-1400-full', true);

  await toggleFirstItem();
  await expect(firstItem.locator('[data-nutrient="totalCarbs"]')).toBeVisible();
  await page.waitForTimeout(400);
  await shoot('desktop-1400-expanded');
  await toggleFirstItem();

  await page.getByRole('button', { name: 'Retail Cafes' }).click();
  await page.waitForTimeout(800);
  await shoot('desktop-1400-retail');
  await page.getByRole('button', { name: 'Dining Halls' }).click();

  // A narrow laptop with the sidebar open, then tablets.
  for (const [name, width, height] of [
    ['desktop-1100', 1100, 900],
    ['tablet-1024', 1024, 900],
    ['tablet-820', 820, 1100],
    ['phone-360', 360, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(600);
    await shoot(name);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await shoot('phone-390');
  await shoot('phone-390-full', true);

  await page.getByRole('button', { name: 'Toggle filters' }).click();
  await page.waitForTimeout(600);
  await shoot('phone-390-filters');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(400);

  await toggleFirstItem();
  await expect(firstItem.locator('[data-nutrient="totalCarbs"]')).toBeVisible();
  await firstItem.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shoot('phone-390-expanded');
});
