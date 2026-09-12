import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ALLERGENS } from '@/types';
import type { Allergen, MenuItemNutrition } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Recursively convert snake_case object keys to camelCase. */
export function toCamelCase(value: any): any {
  if (Array.isArray(value)) return value.map(toCamelCase);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        toCamelCase(inner),
      ])
    );
  }
  return value;
}

/** A label amount rounded to `decimals` places without trailing zeroes; a dash when missing. */
export function formatAmount(value: number | string | null | undefined, decimals = 1): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return '-';
  return parseFloat(n.toFixed(decimals)).toString();
}

/** Percent of the daily value, or null when the amount is missing or zero. */
export function calculateDVPercentage(
  amount: number | null | undefined,
  dailyValue: number
): number | null {
  if (!amount) return null;
  return Math.round((amount / dailyValue) * 100);
}

// How Campus Dining labels name allergens, mapped to the names the app uses. Matching is on whole
// comma-separated entries so that, for example, "Crustacean Shellfish" is never read as "Fish".
const ALLERGEN_SYNONYMS: Record<string, Allergen> = {
  peanut: 'Peanut',
  peanuts: 'Peanut',
  'tree nut': 'Tree Nuts',
  'tree nuts': 'Tree Nuts',
  coconut: 'Coconut',
  'ingredients include coconut': 'Coconut',
  egg: 'Eggs',
  eggs: 'Eggs',
  milk: 'Milk',
  dairy: 'Milk',
  wheat: 'Wheat',
  soy: 'Soybeans',
  soybean: 'Soybeans',
  soybeans: 'Soybeans',
  crustacean: 'Crustacean',
  shellfish: 'Crustacean',
  'crustacean shellfish': 'Crustacean',
  alcohol: 'Alcohol',
  'ingredients include alcohol': 'Alcohol',
  fish: 'Fish',
  sesame: 'Sesame',
  gluten: 'Gluten',
};

/** Allergens declared on the item's label, in canonical order. Ingredients text is not searched. */
export function detectAllergens(nutrition: MenuItemNutrition | null | undefined): Allergen[] {
  const found = new Set<Allergen>();
  for (const entry of (nutrition?.allergens ?? '').split(/[,;]/)) {
    const match = ALLERGEN_SYNONYMS[entry.trim().toLowerCase().replace(/\.$/, '')];
    if (match) found.add(match);
  }
  return ALLERGENS.filter((allergen) => found.has(allergen));
}

/** Today's date at local midnight. */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** `count` consecutive dates starting today, each at local midnight. */
export function upcomingDates(count: number): Date[] {
  const today = startOfToday();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });
}

/** YYYY-MM-DD in local time; the key used for menu requests and caching. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
