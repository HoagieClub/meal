/**
 * Smoke checks in a real browser: what users see is compared with what the API returns for the
 * day the page is showing. Run with `bun run e2e` (see playwright.config.ts for the servers).
 */
import { expect, test, type Page } from '@playwright/test';
import { LOCATIONS } from '@/lib/constants';
import { availableMeals, mealLabel } from '@/lib/menus';
import { formatAmount, toCamelCase } from '@/lib/utils';
import type { MenuItem, MenusByLocation } from '@/types';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';

const cards = (page: Page) => page.locator('.card-fade-up');

/** What the API returns for the day the page is showing (the browser's clock decides the day). */
async function apiDataForShownDay(page: Page) {
  const dateKey = await page.locator('[data-date]').getAttribute('data-date');
  const json = await (await fetch(`${API_URL}/api/menus/?date=${dateKey}`)).json();
  return {
    date: new Date(`${dateKey}T12:00:00`),
    menus: (json.data?.menus ?? {}) as MenusByLocation,
    menuItems: toCamelCase(json.data?.menu_items ?? {}) as Record<string, MenuItem>,
  };
}

let pageErrors: Error[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.goto('/');
  // The dev server compiles on first request, so allow plenty of time for the cards.
  await expect(cards(page).first()).toBeVisible({ timeout: 90_000 });
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test('shows every hall, and a tab for each meal served today', async ({ page }) => {
  await expect(cards(page)).toHaveCount(6);

  const { date, menus } = await apiDataForShownDay(page);
  const residential = Object.fromEntries(
    Object.entries(menus).filter(([id]) => LOCATIONS[id]?.category === 'residential')
  );
  const expected = availableMeals(residential).map((meal) => mealLabel(meal, date));
  if (expected.length > 0) {
    await expect(page.locator('[role="tablist"] [role="tab"]')).toHaveText(expected);
  }
});

test('an expanded item shows the API nutrition, and starring asks for a login', async ({
  page,
}) => {
  const { menuItems } = await apiDataForShownDay(page);
  const row = page.locator('[data-item-id]').first();
  const itemId = await row.getAttribute('data-item-id');
  const item = menuItems[itemId!];
  expect(item, `item ${itemId} is not in the API response`).toBeTruthy();

  await row.locator('span').first().click();
  const carbs = item.nutrition?.totalCarbs;
  await expect(row.locator('[data-nutrient="totalCarbs"]')).toContainText(
    carbs == null ? '-' : `${formatAmount(carbs)} g`
  );
  await expect(row).toContainText(item.name);

  // Logged out, a star asks for a login instead of leaving the page.
  await row.getByRole('button', { name: /^Star / }).click();
  await expect(page.getByText('Log in to star and like items')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('switching to retail cafes shows retail cards', async ({ page }) => {
  await page.getByRole('button', { name: 'Retail Cafes' }).click();
  await expect(cards(page).first()).toContainText(/Frist|EQuad|Shultz|Genomics|Chemistry/);
});

test('on a phone, the filter drawer opens with Done in reach, and Done closes it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // The closed drawer is clipped to zero height rather than removed, so check its state.
  const drawer = page.locator('.mobile-filter-popover');
  const done = page.getByRole('button', { name: 'Done' });

  await page.getByRole('button', { name: 'Toggle filters' }).click();
  await expect(drawer).toHaveAttribute('data-state', 'open');
  await expect(done).toBeInViewport();
  await done.click();
  await expect(drawer).toHaveAttribute('data-state', 'closed');
});
