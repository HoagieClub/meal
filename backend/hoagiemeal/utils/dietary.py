"""Utility for classifying menu items by dietary restrictions.

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License.
"""

from typing import List, Set, Dict

# Keyword definitions for dietary classification
MEAT_KEYWORDS = {
    'chicken', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'turkey', 'duck', 'veal',
    'sausage', 'pepperoni', 'salami', 'prosciutto', 'chorizo', 'bison', 'venison',
    'goat', 'mutton', 'anchovy', 'anchovies', 'tuna', 'salmon', 'cod', 'trout',
    'sardine', 'sardines', 'shrimp', 'crab', 'lobster', 'clam', 'clams', 'oyster',
    'oysters', 'mussel', 'mussels', 'scallop', 'scallops', 'crayfish', 'squid',
    'octopus', 'calamari', 'caviar', 'roe', 'poultry', 'meat', 'game', 'fish'
}

DAIRY_EGG_HONEY_KEYWORDS = {
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'kefir', 'ghee', 'casein',
    'caseinate', 'whey', 'lactose', 'egg', 'eggs', 'mayonnaise', 'honey',
    'royal jelly', 'beeswax'
}

HIDDEN_ANIMAL_KEYWORDS = {
    'gelatin', 'lard', 'tallow', 'suet', 'collagen', 'cochineal', 'carmine',
    'isinglass', 'shellac', 'rennet'
}

PORK_KEYWORDS = {
    'pork', 'bacon', 'ham', 'lard', 'gelatin', 'pepperoni', 'salami',
    'prosciutto', 'chorizo', 'pancetta'
}

NON_KOSHER_SEAFOOD_KEYWORDS = {
    'shrimp', 'crab', 'lobster', 'clam', 'clams', 'oyster', 'oysters',
    'mussel', 'mussels', 'scallop', 'scallops', 'crayfish', 'squid',
    'octopus', 'calamari', 'catfish', 'swordfish', 'shark', 'eel', 'sturgeon'
}

ALCOHOL_KEYWORDS = {
    'alcohol', 'wine', 'beer', 'lager', 'ale', 'stout', 'cider', 'brandy',
    'cognac', 'rum', 'whiskey', 'whisky', 'gin', 'vodka', 'tequila', 'vermouth',
    'sherry', 'port', 'sake', 'liqueur', 'mead'
}


def get_tokens(text: str) -> Set[str]:
    """Clean and tokenize a string for keyword checking.
    
    Args:
        text: The string to process.
        
    Returns:
        A set of lowercase, trimmed words/phrases.
    """
    tokens = set()
    if not text:
        return tokens
    
    # Split by commas, parentheses, colons, and spaces
    for token in text.lower().replace(',', ' ').replace('(', ' ').replace(')', ' ').replace(':', ' ').split():
        trimmed = token.strip()
        if len(trimmed) > 1:  # Ignore single letters
            tokens.add(trimmed)
    
    return tokens


def set_intersects(tokens: Set[str], keywords: Set[str]) -> bool:
    """Check if any token from a given set exists in a keyword set.
    
    Args:
        tokens: The tokens to check (e.g., from an ingredient).
        keywords: The keyword set to check against.
        
    Returns:
        True if a match is found, false otherwise.
    """
    for token in tokens:
        if token in keywords:
            return True
        # Also check for partials, e.g., 'chicken broth'
        for keyword in keywords:
            if keyword in token:
                return True
    return False


def classify_dietary_restrictions(
    name: str,
    description: str,
    ingredients: List[str],
    allergens: List[str],
    dietary_flags: List[str] = None
) -> Dict[str, bool]:
    """Classify a menu item based on dietary restrictions.
    
    This function uses structured data (allergens, ingredients) first,
    then falls back to unstructured text (name, description).
    
    Args:
        name: The item name.
        description: The item description.
        ingredients: List of ingredient strings.
        allergens: List of allergen strings.
        dietary_flags: Raw dietary flags from source (e.g., from nutrition page icons).
        
    Returns:
        A dictionary with keys: is_vegetarian, is_vegan, is_halal, is_kosher.
    """
    dietary_flags = dietary_flags or []
    
    # Process structured data
    structured_tokens = set()
    for ing in ingredients:
        structured_tokens.update(get_tokens(ing))
    for all in allergens:
        structured_tokens.update(get_tokens(all))
    
    # Process unstructured data
    combined_text = f"{name} {description}".lower()
    text_tokens = get_tokens(combined_text)
    
    # Check for explicit labels (highest priority)
    has_vegan_label = '(vg)' in combined_text or 'vegan' in combined_text
    has_vegetarian_label = '(v)' in combined_text or 'vegetarian' in combined_text
    has_halal_label = '(h)' in combined_text or 'halal' in combined_text
    has_kosher_label = '(k)' in combined_text or 'kosher' in combined_text
    
    # Check dietary flags from source
    flags_lower = [f.lower() for f in dietary_flags]
    if 'vegan' in flags_lower:
        has_vegan_label = True
    if 'vegetarian' in flags_lower:
        has_vegetarian_label = True
    if 'halal' in flags_lower:
        has_halal_label = True
    if 'kosher' in flags_lower:
        has_kosher_label = True
    
    # Detect problematic ingredients
    has_meat = (set_intersects(structured_tokens, MEAT_KEYWORDS) or 
                set_intersects(text_tokens, MEAT_KEYWORDS))
    has_dairy_egg_honey = (set_intersects(structured_tokens, DAIRY_EGG_HONEY_KEYWORDS) or 
                           set_intersects(text_tokens, DAIRY_EGG_HONEY_KEYWORDS))
    has_hidden_animal = (set_intersects(structured_tokens, HIDDEN_ANIMAL_KEYWORDS) or 
                         set_intersects(text_tokens, HIDDEN_ANIMAL_KEYWORDS))
    has_pork = (set_intersects(structured_tokens, PORK_KEYWORDS) or 
                set_intersects(text_tokens, PORK_KEYWORDS))
    has_non_kosher_seafood = (set_intersects(structured_tokens, NON_KOSHER_SEAFOOD_KEYWORDS) or 
                              set_intersects(text_tokens, NON_KOSHER_SEAFOOD_KEYWORDS))
    has_alcohol = (set_intersects(structured_tokens, ALCOHOL_KEYWORDS) or 
                   set_intersects(text_tokens, ALCOHOL_KEYWORDS))
    
    # Determine classifications
    is_vegetarian = False
    is_vegan = False
    is_halal = False
    is_kosher = False
    
    # Vegan & Vegetarian
    if has_vegan_label:
        is_vegan = True
        is_vegetarian = True
    elif has_vegetarian_label:
        is_vegetarian = True
        # Check if it's also vegan
        if not has_dairy_egg_honey and not has_hidden_animal:
            is_vegan = True
    else:
        # Use keyword analysis
        if not has_meat and not has_hidden_animal:
            is_vegetarian = True
            if not has_dairy_egg_honey:
                is_vegan = True
    
    # Halal
    if has_halal_label:
        is_halal = True
    elif not has_pork and not has_alcohol:
        # Best-effort filter
        is_halal = True
    
    # Kosher
    if has_kosher_label:
        is_kosher = True
    else:
        # Check for violations
        has_meat_and_dairy = (has_meat or has_hidden_animal) and has_dairy_egg_honey
        if not has_pork and not has_non_kosher_seafood and not has_meat_and_dairy:
            is_kosher = True
    
    return {
        'is_vegetarian': is_vegetarian,
        'is_vegan': is_vegan,
        'is_halal': is_halal,
        'is_kosher': is_kosher
    }