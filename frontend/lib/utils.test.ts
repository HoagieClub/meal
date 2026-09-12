import { describe, expect, test } from 'bun:test';
import { detectAllergens } from '@/lib/utils';

describe('detectAllergens', () => {
  test('maps the label names to ours, never guesses, and never mistakes shellfish for fish', () => {
    expect(detectAllergens({ allergens: 'Milk, Eggs, Tree Nut, Soybeans, Gluten' })).toEqual([
      'Tree Nuts',
      'Eggs',
      'Milk',
      'Soybeans',
      'Gluten',
    ]);
    expect(
      detectAllergens({
        allergens: 'Soybeans, Ingredients include coconut, Ingredients include alcohol',
      })
    ).toEqual(['Coconut', 'Soybeans', 'Alcohol']);
    expect(detectAllergens({ allergens: 'Milk, Crustacean Shellfish, Wheat, Gluten' })).toEqual([
      'Milk',
      'Wheat',
      'Crustacean',
      'Gluten',
    ]);
    // Only the label's allergen line counts, never the ingredients text.
    expect(detectAllergens({ allergens: null, ingredients: 'Coconut Milk, Egg Noodles' })).toEqual(
      []
    );
    expect(detectAllergens(null)).toEqual([]);
  });
});
