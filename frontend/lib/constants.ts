import type { Allergen, LocationType } from '@/types';

export interface Location {
  id: string;
  category: LocationType;
  name: string;
}

/** Campus Dining locations keyed by the id used on menus.princeton.edu. Names match the backend. */
export const LOCATIONS: Record<string, Location> = {
  '05': { id: '05', category: 'residential', name: 'Center for Jewish Life' },
  '03': { id: '03', category: 'residential', name: 'Forbes College' },
  '04': { id: '04', category: 'residential', name: 'Graduate College' },
  '01': { id: '01', category: 'residential', name: 'Mathey & Rockefeller Colleges' },
  '08': { id: '08', category: 'residential', name: 'Whitman & Butler Colleges' },
  '06': { id: '06', category: 'residential', name: 'Yeh & Huo Colleges' },
  '15': { id: '15', category: 'retail', name: 'Frist Gallery' },
  '16': { id: '16', category: 'retail', name: "Witherspoon's" },
  '23': { id: '23', category: 'retail', name: 'Chemistry CaFe' },
  '24': { id: '24', category: 'retail', name: 'EQuad Cafe' },
  '26': { id: '26', category: 'retail', name: 'Genomics Cafe' },
  '07': { id: '07', category: 'retail', name: 'Shultz Cafe' },
  '12': { id: '12', category: 'retail', name: 'Tiger Tea Room' },
};

/** Locations the app displays. Witherspoon's and Tiger Tea Room publish no menus. */
export const DINING_HALLS = [
  'Forbes College',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Yeh & Huo Colleges',
  'Center for Jewish Life',
  'Graduate College',
  'Chemistry CaFe',
  'EQuad Cafe',
  'Frist Gallery',
  'Genomics Cafe',
  'Shultz Cafe',
] as const;
export type DiningHall = (typeof DINING_HALLS)[number];

export const LOCATION_ID_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.values(LOCATIONS).map((location) => [location.name, location.id])
);

/** Short display name and filter-list icon for each dining hall. Banners live in banners.ts. */
export const DINING_HALL_INFO: Record<DiningHall, { shortName: string; icon: string }> = {
  'Forbes College': { shortName: 'Forbes', icon: '/images/icons/forbes.png' },
  'Mathey & Rockefeller Colleges': { shortName: 'Rocky / Mathey', icon: '/images/icons/rocky.png' },
  'Whitman & Butler Colleges': {
    shortName: 'Whitman / Butler',
    icon: '/images/icons/whitman-butler.png',
  },
  'Yeh & Huo Colleges': { shortName: 'Yeh / Huo', icon: '/images/icons/yeh.png' },
  'Center for Jewish Life': { shortName: 'CJL', icon: '/images/icons/cjl.png' },
  'Graduate College': { shortName: 'Grad', icon: '/images/icons/grad.png' },
  'Chemistry CaFe': { shortName: 'Chemistry', icon: '/images/icons/chemistry.png' },
  'EQuad Cafe': { shortName: 'EQuad', icon: '/images/icons/equad.png' },
  'Frist Gallery': { shortName: 'Frist', icon: '/images/icons/frist.png' },
  'Genomics Cafe': { shortName: 'Genomics', icon: '/images/icons/genomics.png' },
  'Shultz Cafe': { shortName: 'Shultz', icon: '/images/icons/shultz.png' },
};

/** Display order of residential halls and of retail locations. */
export const RESIDENTIAL_HALL_ORDER: DiningHall[] = [
  'Yeh & Huo Colleges',
  'Mathey & Rockefeller Colleges',
  'Whitman & Butler Colleges',
  'Forbes College',
  'Center for Jewish Life',
  'Graduate College',
];

export const RETAIL_LOCATION_ORDER: DiningHall[] = [
  'Frist Gallery',
  'EQuad Cafe',
  'Shultz Cafe',
  'Genomics Cafe',
  'Chemistry CaFe',
];

/** Order of menu sections within a card. Unlisted sections go last, alphabetically. */
export const SECTION_TITLE_ORDER: string[] = [
  'Early Entree',
  'At the grill',
  'Breakfast Bars',
  'Main Entree',
  'Entree',
  'Vegetarian & Vegan Entree',
  'Specialty Bars',
  'Action Station',
  'Asian Station',
  'Pasta Station',
  'Pizza Station',
  'Entree & Sides',
  'Global Kitchen',
  'Panini',
  'Quesadillas',
  'Pasta',
  'Sandwich',
  'Sandwiches',
  'Gallery Sandwiches',
  'Food for Thought',
  'Grill',
  'On the Side',
  'Sides',
  'Soups',
  'Soup',
  'Salads',
  'Salad',
  'Gallery Salads',
  'Appetizers',
  'Desserts',
  'Breakfast',
  "Grab 'N Go",
  'Grab N Go',
  'Grab n Go',
];

/** Position of `item` in `order`, or Infinity when it is not listed. */
export function canonicalIndex(item: string, order: readonly string[]): number {
  const index = order.indexOf(item);
  return index === -1 ? Infinity : index;
}

export const ALLERGEN_ICON_MAP: Record<Allergen, string> = {
  Peanut: '/images/icons/peanut.svg',
  'Tree Nuts': '/images/icons/tree-nut.svg',
  Coconut: '/images/icons/coconut.svg',
  Eggs: '/images/icons/egg.svg',
  Milk: '/images/icons/milk.svg',
  Wheat: '/images/icons/wheat.svg',
  Soybeans: '/images/icons/soybean.svg',
  Crustacean: '/images/icons/shellfish.svg',
  Alcohol: '/images/icons/alcohol.svg',
  Fish: '/images/icons/fish.svg',
  Sesame: '/images/icons/sesame.svg',
  Gluten: '/images/icons/gluten.svg',
};

/**
 * Entries for the dining-hall / retail toggle. The light icon sits on the green selected pill;
 * the dark icon is for the unselected side.
 */
export const LOCATION_TYPE_OPTIONS: {
  type: LocationType;
  label: string;
  lightIcon: string;
  darkIcon: string;
}[] = [
  {
    type: 'residential',
    label: 'Dining Halls',
    lightIcon: '/images/icons/dhall-light.svg',
    darkIcon: '/images/icons/dhall-dark.svg',
  },
  {
    type: 'retail',
    label: 'Retail Cafes',
    lightIcon: '/images/icons/retail-light.svg',
    darkIcon: '/images/icons/retail-dark.svg',
  },
];
