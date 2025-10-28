// utils/dietary.ts

/**
 * Defines the minimal data required from a menu item to perform
 * dietary classification.
 */
export interface MenuItemData {
  name: string;
  description: string;
  allergens: string[];
  ingredients: string[];
}

/**
 * Defines the possible dietary tags our system can classify.
 */
export type DietTag = 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';

// --- Keyword Definitions ---
// Using Sets for efficient O(1) average time complexity lookups.

// Keywords that definitively indicate a non-vegetarian/non-vegan item.
const MEAT_KEYWORDS = new Set([
  'chicken',
  'beef',
  'pork',
  'lamb',
  'bacon',
  'ham',
  'turkey',
  'duck',
  'veal',
  'sausage',
  'pepperoni',
  'salami',
  'prosciutto',
  'chorizo',
  'bison',
  'venison',
  'goat',
  'mutton',
  'anchovy',
  'anchovies',
  'tuna',
  'salmon',
  'cod',
  'trout',
  'sardine',
  'sardines',
  'shrimp',
  'crab',
  'lobster',
  'clam',
  'clams',
  'oyster',
  'oysters',
  'mussel',
  'mussels',
  'scallop',
  'scallops',
  'crayfish',
  'squid',
  'octopus',
  'calamari',
  'caviar',
  'roe',
  'poultry',
  'meat',
  'game',
  'fish',
]);

// Keywords indicating animal byproducts (non-vegan).
const DAIRY_EGG_HONEY_KEYWORDS = new Set([
  'milk',
  'cheese',
  'butter',
  'cream',
  'yogurt',
  'kefir',
  'ghee',
  'casein',
  'caseinate',
  'whey',
  'lactose',
  'egg',
  'eggs',
  'mayonnaise',
  'honey',
  'royal jelly',
  'beeswax',
]);

// Keywords indicating animal-derived ingredients often hidden.
const HIDDEN_ANIMAL_KEYWORDS = new Set([
  'gelatin',
  'lard',
  'tallow',
  'suet',
  'collagen',
  'cochineal',
  'carmine',
  'isinglass',
  'shellac',
  'rennet', // (often in cheese)
]);

// Keywords indicating pork (non-halal, non-kosher).
const PORK_KEYWORDS = new Set([
  'pork',
  'bacon',
  'ham',
  'lard',
  'gelatin', // (often pork-derived)
  'pepperoni',
  'salami',
  'prosciutto',
  'chorizo',
  'pancetta',
]);

// Keywords indicating non-kosher seafood.
const NON_KOSHER_SEAFOOD_KEYWORDS = new Set([
  'shrimp',
  'crab',
  'lobster',
  'clam',
  'clams',
  'oyster',
  'oysters',
  'mussel',
  'mussels',
  'scallop',
  'scallops',
  'crayfish',
  'squid',
  'octopus',
  'calamari',
  'catfish',
  'swordfish',
  'shark',
  'eel',
  'sturgeon',
]);

// Keywords indicating alcohol (non-halal).
const ALCOHOL_KEYWORDS = new Set([
  'alcohol',
  'wine',
  'beer',
  'lager',
  'ale',
  'stout',
  'cider',
  'brandy',
  'cognac',
  'rum',
  'whiskey',
  'whisky',
  'gin',
  'vodka',
  'tequila',
  'vermouth',
  'sherry',
  'port',
  'sake',
  'liqueur',
  'mead',
]);

// --- Helper Functions ---

/**
 * Cleans and tokenizes a string (like an ingredient) for checking.
 * @param text The string to process.
 * @returns A Set of lowercase, trimmed words/phrases.
 */
function getTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  // Split by commas, parentheses, colons, and spaces
  text
    .toLowerCase()
    .split(/[\s,():]+/)
    .forEach((token) => {
      const trimmed = token.trim();
      if (trimmed.length > 1) {
        // Ignore single letters
        tokens.add(trimmed);
      }
    });
  return tokens;
}

/**
 * Checks if any token from a given set exists in a keyword set.
 * @param tokens The tokens to check (e.g., from an ingredient).
 * @param keywords The keyword set to check against.
 * @returns True if a match is found, false otherwise.
 */
function setIntersects(tokens: Set<string>, keywords: Set<string>): boolean {
  for (const token of tokens) {
    if (keywords.has(token)) {
      return true;
    }
    // Also check for partials, e.g., 'chicken broth'
    for (const keyword of keywords) {
      if (token.includes(keyword)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Classifies a menu item based on its data to generate dietary tags.
 * This function uses structured data (allergens, ingredients) first,
 * then falls back to unstructured text (name, description).
 *
 * @param item The menu item data.
 * @returns An array of applicable DietTag strings.
 */
export function classifyDish(item: MenuItemData): DietTag[] {
  const tags: Set<DietTag> = new Set();

  // --- Process Structured Data ---
  // Combine allergens and ingredients into a single token set for checking
  const structuredTokens = new Set<string>();
  item.ingredients.forEach((ing) => {
    getTokens(ing).forEach((token) => structuredTokens.add(token));
  });
  item.allergens.forEach((all) => {
    getTokens(all).forEach((token) => structuredTokens.add(token));
  });

  // --- Process Unstructured Data ---
  const nameText = item.name.toLowerCase();
  const descriptionText = item.description.toLowerCase();
  const combinedText = nameText + ' ' + descriptionText;
  const textTokens = getTokens(combinedText);

  // --- Flags ---
  let hasMeat = false;
  let hasDairyEggHoney = false;
  let hasHiddenAnimal = false;
  let hasPork = false;
  let hasNonKosherSeafood = false;
  let hasAlcohol = false;

  // 1. Check for Meat
  if (setIntersects(structuredTokens, MEAT_KEYWORDS) || setIntersects(textTokens, MEAT_KEYWORDS)) {
    hasMeat = true;
  }

  // 2. Check for Dairy/Egg/Honey
  if (
    setIntersects(structuredTokens, DAIRY_EGG_HONEY_KEYWORDS) ||
    setIntersects(textTokens, DAIRY_EGG_HONEY_KEYWORDS)
  ) {
    hasDairyEggHoney = true;
  }

  // 3. Check for Hidden Animal Products
  if (
    setIntersects(structuredTokens, HIDDEN_ANIMAL_KEYWORDS) ||
    setIntersects(textTokens, HIDDEN_ANIMAL_KEYWORDS)
  ) {
    hasHiddenAnimal = true;
  }

  // 4. Check for Pork
  if (setIntersects(structuredTokens, PORK_KEYWORDS) || setIntersects(textTokens, PORK_KEYWORDS)) {
    hasPork = true;
  }

  // 5. Check for Non-Kosher Seafood
  if (
    setIntersects(structuredTokens, NON_KOSHER_SEAFOOD_KEYWORDS) ||
    setIntersects(textTokens, NON_KOSHER_SEAFOOD_KEYWORDS)
  ) {
    hasNonKosherSeafood = true;
  }

  // 6. Check for Alcohol
  if (
    setIntersects(structuredTokens, ALCOHOL_KEYWORDS) ||
    setIntersects(textTokens, ALCOHOL_KEYWORDS)
  ) {
    hasAlcohol = true;
  }

  // --- Explicit Label Check (Highest Priority) ---
  const hasVeganLabel = combinedText.includes('(vg)') || combinedText.includes('vegan');
  const hasVegetarianLabel = combinedText.includes('(v)') || combinedText.includes('vegetarian');
  const hasHalalLabel = combinedText.includes('(h)') || combinedText.includes('halal');
  const hasKosherLabel = combinedText.includes('(k)') || combinedText.includes('kosher');

  // --- Tag Assignment Logic ---

  // Vegan & Vegetarian
  if (hasVeganLabel) {
    tags.add('Vegan');
    tags.add('Vegetarian');
  } else if (hasVegetarianLabel) {
    tags.add('Vegetarian');
    // Check if it's also accidentally vegan (based on keywords)
    if (!hasDairyEggHoney && !hasHiddenAnimal) {
      tags.add('Vegan');
    }
  } else {
    // No labels, use keyword analysis
    if (!hasMeat && !hasHiddenAnimal) {
      if (!hasDairyEggHoney) {
        tags.add('Vegan');
      }
      tags.add('Vegetarian');
    }
  }

  // Halal
  // We apply a "best-effort" filter.
  // We only add the tag if it's explicitly labeled *or*
  // if it doesn't contain obvious violations (pork, alcohol).
  if (hasHalalLabel) {
    tags.add('Halal');
  } else if (!hasPork && !hasAlcohol) {
    // Note: This does *not* guarantee Halal (e.g., meat source),
    // but it serves as a "likely Halal" filter.
    tags.add('Halal');
  }

  // Kosher
  if (hasKosherLabel) {
    tags.add('Kosher');
  } else {
    // Check for pork, non-kosher seafood, and mixing meat/dairy.
    const hasMeatAndDairy = (hasMeat || hasHiddenAnimal) && hasDairyEggHoney;
    if (!hasPork && !hasNonKosherSeafood && !hasMeatAndDairy) {
      // This is a "best-effort" filter.
      tags.add('Kosher');
    }
  }

  return Array.from(tags);
}
