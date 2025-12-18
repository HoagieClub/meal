import { classifyDish } from '@/utils/dietary';
import { BuildDisplayDataProps, RawApiMenuItem, RawVenue, UIMenuItem, UIVenue } from './types';

const fetchMenuData = async (
  menuId: string,
  isCurrent: () => boolean
): Promise<UIVenue[] | null> => {
  try {
    const response = await fetch(`/api/dining/locations/with-menus?menu_id=${menuId}`);
    if (!response.ok) {
      throw new Error(`HTTP error fetching menu! status: ${response.status}`);
    }
    const data: { locations: { location: RawVenue[] } } = await response.json();
    if (!isCurrent()) return null;

    const uiVenues: UIVenue[] = data.locations.location.map((raw: RawVenue) => {
      // 1. Create the flat list of items
      const allItems: UIMenuItem[] = (raw.menu.menus || []).map((x: RawApiMenuItem) => ({
        id: x.id,
        name: x.name,
        description: x.description,
        link: x.link,
        calories: x.nutrition?.calories || 0,
        protein: x.nutrition?.protein || 0,
        allergens: x.allergens || [],
        ingredients: x.ingredients || [],
      }));

      // 2. Aggregate Allergens from all items for the Venue-level Set
      const venueAllergens = new Set<string>();
      allItems.forEach((item) => item.allergens.forEach((a) => venueAllergens.add(a)));

      // 3. Helper to filter items into categories (Logic assumed based on your error message)
      const categorizedItems = {
        'Main Entrée': allItems.filter((i) => true), // Replace 'true' with your category logic
        'Vegan Entrée': [],
        Soups: [],
      };

      // 4. Return the full UIVenue object
      return {
        name: raw.name,
        items: categorizedItems,
        allergens: venueAllergens,
        calories: {},
        protein: {},
        nutrition: new Set<string>(),
      };
    });

    return uiVenues;
  } catch (error) {
    if (isCurrent()) {
      console.error(`Error fetching menu data for ${menuId}:`, error);
    }
    return null;
  }
};

function buildDisplayData({
  venues,
  appliedHalls,
  appliedDietary,
  appliedAllergens,
  searchTerm,
  pinnedHalls,
  showNutrition,
}: BuildDisplayDataProps): UIVenue[] {
  const term = searchTerm.trim().toLowerCase();

  const hasDietFilter = appliedDietary.length > 0;
  const hasAllergenFilter = appliedAllergens.length > 0;
  const hasSearch = term !== '';

  const sortByPinned = (a: UIVenue, b: UIVenue) => {
    const aPinned = pinnedHalls.has(a.name);
    const bPinned = pinnedHalls.has(b.name);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  };

  // fast path
  if (!hasDietFilter && !hasAllergenFilter && !hasSearch) {
    return appliedHalls
      .map((name) => venues.find((v) => v.name === name))
      .filter((v): v is UIVenue => !!v)
      .sort(sortByPinned);
  }

  const matchesDish = (dish: Dish): boolean => {
    const text = `${dish.name} ${dish.description}`.toLowerCase();

    if (hasSearch && !text.includes(term)) return false;

    if (hasDietFilter) {
      const tags = classifyDish(dish);
      if (!tags.some((tag) => appliedDietary.includes(tag))) {
        return false;
      }
    }

    if (hasAllergenFilter) {
      const allergens = dish.allergens.map((a) => a.toLowerCase());
      if (appliedAllergens.some((a) => allergens.includes(a.toLowerCase()))) {
        return false;
      }
    }

    return true;
  };

  const normalizeDish = (dish: Dish): Dish => {
    if (showNutrition) return dish;
    if (!('nutrition' in dish)) return dish;

    const { nutrition, ...rest } = dish;
    return rest;
  };

  const buildVenue = (hallName: string): UIVenue | null => {
    const venue = venues.find((v) => v.name === hallName);
    if (!venue) return null;

    const items = Object.fromEntries(
      Object.entries(venue.items).map(([category, dishes]) => [
        category,
        dishes.filter(matchesDish).map(normalizeDish),
      ])
    ) as UIVenue['items'];

    const hasItems = Object.values(items).some((list) => list.length > 0);
    if (!hasItems) return null;

    return { ...venue, items };
  };

  return appliedHalls
    .map(buildVenue)
    .filter((v): v is UIVenue => v !== null)
    .sort(sortByPinned);
}

export { buildDisplayData, fetchMenuData };
