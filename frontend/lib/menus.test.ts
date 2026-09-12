import { describe, expect, test } from 'bun:test';
import fixture from '@/lib/__fixtures__/menus-2026-09-11.json';
import { DINING_HALLS, LOCATIONS } from '@/lib/constants';
import { availableMeals, buildDisplayData, type DisplayDataOptions } from '@/lib/menus';
import { toCamelCase } from '@/lib/utils';
import type { MenuData, MenusByLocation } from '@/types';

/** The real API response for 2026-09-11, trimmed to Rocky, CJL, Whitman and Frist. */
function loadFixture(): MenuData {
  const residentialMenus: MenusByLocation = {};
  const retailMenus: MenusByLocation = {};
  for (const [id, tree] of Object.entries(fixture.menus as MenusByLocation)) {
    (LOCATIONS[id].category === 'residential' ? residentialMenus : retailMenus)[id] = tree;
  }
  return {
    residentialMenus,
    retailMenus,
    menuItems: toCamelCase(fixture.menu_items),
    interactions: {},
    metrics: {},
  };
}

const baseOptions: DisplayDataOptions = {
  locationType: 'residential',
  meal: 'Breakfast',
  searchTerm: '',
  starredOnly: false,
  diningHalls: [...DINING_HALLS],
  allergens: [],
  pinnedHalls: [],
};

const ROCKY = 'Mathey & Rockefeller Colleges';
const WHITMAN = 'Whitman & Butler Colleges';
const CJL = 'Center for Jewish Life';

test('availableMeals lists the meals served that day in order, folding in the site aliases', () => {
  expect(availableMeals(loadFixture().residentialMenus)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
  expect(
    availableMeals({
      '04': { 'Continental Breakfast': { Bakery: ['1'] } },
      '01': { 'Late Night': {}, Lunch: {}, Dinner: {} },
    })
  ).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Late Night']);
  expect(availableMeals({})).toEqual([]);
});

describe('buildDisplayData with real menu data', () => {
  test('one card per selected hall: halls with food first, empty ones after, each in canonical order', () => {
    const data = loadFixture();
    // Grad publishes breakfast under the site's "Continental Breakfast" name.
    data.residentialMenus['04'] = { 'Continental Breakfast': { Bakery: ['113037'] } };
    const { displayData, hasAnyRawLocations } = buildDisplayData(data, baseOptions);

    expect(hasAnyRawLocations).toBe(true);
    expect(displayData.map((location) => location.name)).toEqual([
      ROCKY,
      WHITMAN,
      CJL,
      'Graduate College',
      'Yeh & Huo Colleges',
      'Forbes College',
    ]);

    const rocky = displayData.find((location) => location.name === ROCKY)!;
    expect(rocky.menu).toHaveLength(10);
    expect(new Set(rocky.menu.map((item) => item.category))).toEqual(
      new Set(['At the grill', 'Breakfast Bars'])
    );
    expect(rocky.menu[0]).toMatchObject({ id: '113037', name: 'Chicken Sausage' });
    expect(rocky.menu[0].nutrition?.totalCarbs).toBe(4.8);

    const grad = displayData.find((location) => location.name === 'Graduate College')!;
    expect(grad.menu.map((item) => item.category)).toEqual(['Bakery']);
    const forbes = displayData.find((location) => location.name === 'Forbes College')!;
    expect(forbes).toMatchObject({ menu: [], rawMenuCount: 0 });
  });

  test('search, hall selection, pinning and starred-only each narrow what is shown', () => {
    const searched = buildDisplayData(loadFixture(), { ...baseOptions, searchTerm: '  SAUSAGE ' });
    const found = searched.displayData.flatMap((location) => location.menu);
    expect(found.length).toBeGreaterThan(0);
    for (const item of found) expect(item.name.toLowerCase()).toContain('sausage');

    const onlyCjl = buildDisplayData(loadFixture(), { ...baseOptions, diningHalls: [CJL] });
    expect(onlyCjl.displayData.map((location) => location.name)).toEqual([CJL]);

    const pinned = buildDisplayData(loadFixture(), {
      ...baseOptions,
      pinnedHalls: ['Forbes College'],
    });
    expect(pinned.displayData[0]).toMatchObject({ name: 'Forbes College', menu: [] });

    const data = loadFixture();
    data.interactions['113037'] = { favorited: true };
    const starred = buildDisplayData(data, { ...baseOptions, starredOnly: true });
    expect(starred.displayData.flatMap((location) => location.menu).map((i) => i.id)).toEqual([
      '113037',
    ]);
  });

  test('allergen filter removes items whose label lists the allergen', () => {
    const all = buildDisplayData(loadFixture(), { ...baseOptions, meal: 'Lunch' });
    const filtered = buildDisplayData(loadFixture(), {
      ...baseOptions,
      meal: 'Lunch',
      allergens: ['Milk'],
    });
    const countItems = (result: typeof all) =>
      result.displayData.reduce((n, l) => n + l.menu.length, 0);

    expect(countItems(filtered)).toBeLessThan(countItems(all));
    for (const location of filtered.displayData) {
      for (const item of location.menu) {
        expect(item.nutrition?.allergens ?? '').not.toMatch(/\bMilk\b/);
      }
    }
    // rawMenuCount still reflects the unfiltered menu, so cards can say "filtered out".
    const rocky = filtered.displayData.find((location) => location.name === ROCKY)!;
    expect(rocky.rawMenuCount).toBe(
      all.displayData.find((location) => location.name === ROCKY)!.menu.length
    );
  });

  test('retail locations flatten every section into one card', () => {
    const { displayData } = buildDisplayData(loadFixture(), {
      ...baseOptions,
      locationType: 'retail',
    });

    expect(displayData.map((location) => location.name)).toEqual([
      'Frist Gallery',
      'EQuad Cafe',
      'Shultz Cafe',
      'Genomics Cafe',
      'Chemistry CaFe',
    ]);
    const frist = displayData[0];
    expect(frist.menu.length).toBeGreaterThan(20);
    const categories = new Set(frist.menu.map((item) => item.category));
    expect(categories).toContain('Soups');
    expect(categories).toContain("Grab 'N Go");
  });
});
