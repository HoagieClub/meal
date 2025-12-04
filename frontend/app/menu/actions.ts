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
}: BuildDisplayDataProps): UIVenue[] {
  const term = searchTerm.trim().toLowerCase();
  // ** A filter is active if one or more options are selected **
  const isDietFilterActive = appliedDietary.length > 0;
  const isAllergenFilterActive = appliedAllergens.length > 0;
  const isSearchActive = term !== '';

  const sortFn = (a: UIVenue, b: UIVenue) => {
    const aIsPinned = pinnedHalls.has(a.name);
    const bIsPinned = pinnedHalls.has(b.name);
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return 0;
  };

  // If no filters are active, return the base data directly
  if (!isDietFilterActive && !isAllergenFilterActive && !isSearchActive) {
    return appliedHalls
      .map((h) => venues.find((v) => v.name === h))
      .filter((v): v is UIVenue => !!v)
      .sort(sortFn);
  }

  // Otherwise, apply filters
  return appliedHalls
    .map((hallName) => {
      const venue = venues.find((v) => v.name === hallName);
      if (!venue) return null;

      const items: UIVenue['items'] = {
        'Main Entrée': [],
        'Vegan Entrée': [],
        Soups: [],
      };
      let hasAnyItemsAfterFilter = false; // Track if any items remain after filtering this venue

      for (const cat of Object.keys(venue.items) as (keyof typeof venue.items)[]) {
        items[cat] = venue.items[cat].filter((dish) => {
          const dishText = (dish.name + ' ' + dish.description).toLowerCase();

          // ** 1. Get all dietary tags for this dish using the new function **
          const dishTags = classifyDish(dish); // e.g., ['Vegan', 'Vegetarian', 'Halal']

          // --- DIETARY FILTER (Opt-In: Show items that MATCH selected) ---
          if (isDietFilterActive) {
            // Check if *any* of the dish's tags are in the user's selected filter list
            // e.g., dishTags = ['Vegan', 'Vegetarian'], appliedDietary = ['Vegan']
            const matchesADiet = dishTags.some((tag) => appliedDietary.includes(tag));

            // If it doesn't match *any* of the selected diets, filter it out
            if (!matchesADiet) {
              return false;
            }
          }

          // --- ALLERGEN FILTER (Opt-In Avoidance: Hide items that MATCH selected allergens) ---
          if (isAllergenFilterActive) {
            // Use the structured dish.allergens array for reliable filtering
            // We must compare case-insensitively.
            const dishAllergensLower = dish.allergens.map((a) => a.toLowerCase());
            const containsAvoidedAllergen = appliedAllergens.some((avoidedAllergen) =>
              dishAllergensLower.includes(avoidedAllergen.toLowerCase())
            );

            // If it *does* contain an allergen the user wants to avoid, filter it out
            if (containsAvoidedAllergen) {
              return false;
            }
          }

          // --- SEARCH FILTER ---
          if (isSearchActive && !dishText.includes(term)) {
            return false;
          }

          // If we reach here, the item passes all active filters
          hasAnyItemsAfterFilter = true; // Mark that this venue has at least one item
          return true; // Keep the item
        });
      }

      // If, after filtering all categories, this venue has no items left, exclude the venue
      if (!hasAnyItemsAfterFilter) return null;

      // Otherwise, return the venue with its filtered items
      return { ...venue, items } as UIVenue;
    })
    .filter((v): v is UIVenue => v !== null) // Remove venues that became null
    .sort(sortFn);
}

export { buildDisplayData, fetchMenuData };

