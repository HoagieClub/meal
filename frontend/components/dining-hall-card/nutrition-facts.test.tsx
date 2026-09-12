import { expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import fixture from '@/lib/__fixtures__/menus-2026-09-11.json';
import { toCamelCase } from '@/lib/utils';
import type { MenuItemNutrition } from '@/types';
import NutritionFacts, { hasNutritionValues } from './nutrition-facts';

const sausage: MenuItemNutrition = toCamelCase(fixture.menu_items['113037'].nutrition);

// Campus Dining publishes some labels with no calories and zero for everything else.
const unanalysed: MenuItemNutrition = {
  servingSize: '1 each',
  calories: null,
  totalFat: 0,
  sodium: 0,
  totalCarbs: 0,
  protein: 0,
  ingredients: 'Raisin Bran Muffin, Corn Muffin, Blueberry Muffins',
  allergens: 'Milk, Eggs, Wheat, Soybeans, Gluten',
};

const nutrientText = (container: HTMLElement, nutrient: string) =>
  container.querySelector(`[data-nutrient="${nutrient}"]`)?.textContent ?? '';

test('renders a full label with rounding and folded ingredients, and explains missing ones', () => {
  const { container } = render(
    <NutritionFacts nutrition={{ ...sausage, sodium: 594.6, totalFat: 11.26 }} />
  );
  expect(screen.getByText('2 each')).toBeTruthy();
  expect(screen.getByText('30')).toBeTruthy();
  expect(nutrientText(container, 'totalCarbs')).toContain('4.8 g');
  // Milligrams are whole numbers, grams keep a tenth, and each has a % DV.
  expect(nutrientText(container, 'sodium')).toContain('595 mg');
  expect(nutrientText(container, 'sodium')).toMatch(/26%.*DV/);
  expect(nutrientText(container, 'totalFat')).toContain('11.3 g');
  const details = container.querySelector('details');
  expect(details?.hasAttribute('open')).toBe(false);
  expect(details?.textContent).toContain('Ingredients');

  cleanup();
  render(<NutritionFacts nutrition={unanalysed} />);
  expect(screen.getByText(/has not published nutrition facts/)).toBeTruthy();
  expect(screen.queryByText('Total Carbs')).toBeNull();
  expect(screen.getByText('Milk, Eggs, Wheat, Soybeans, Gluten')).toBeTruthy();

  cleanup();
  render(<NutritionFacts nutrition={null} />);
  expect(screen.getByText('No nutrition information available')).toBeTruthy();

  expect(hasNutritionValues(sausage)).toBe(true);
  expect(hasNutritionValues(unanalysed)).toBe(false);
});
