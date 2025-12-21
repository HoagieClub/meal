"""Dietary flag classifier for a menu item.

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

from typing import List, Set, TypedDict, Optional, Union
from decimal import Decimal


MEAT_KEYWORDS = {
    "chicken",
    "beef",
    "pork",
    "lamb",
    "bacon",
    "ham",
    "turkey",
    "duck",
    "veal",
    "sausage",
    "pepperoni",
    "salami",
    "prosciutto",
    "chorizo",
    "bison",
    "venison",
    "goat",
    "mutton",
    "anchovy",
    "anchovies",
    "tuna",
    "salmon",
    "cod",
    "trout",
    "sardine",
    "sardines",
    "shrimp",
    "crab",
    "lobster",
    "clam",
    "clams",
    "oyster",
    "oysters",
    "mussel",
    "mussels",
    "scallop",
    "scallops",
    "crayfish",
    "squid",
    "octopus",
    "calamari",
    "caviar",
    "roe",
    "poultry",
    "meat",
    "game",
    "fish",
}

DAIRY_EGG_HONEY_KEYWORDS = {
    "milk",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "kefir",
    "ghee",
    "casein",
    "caseinate",
    "whey",
    "lactose",
    "egg",
    "eggs",
    "mayonnaise",
    "honey",
    "royal jelly",
    "beeswax",
}

HIDDEN_ANIMAL_KEYWORDS = {
    "gelatin",
    "lard",
    "tallow",
    "suet",
    "collagen",
    "cochineal",
    "carmine",
    "isinglass",
    "shellac",
    "rennet",
}

PORK_KEYWORDS = {
    "pork",
    "bacon",
    "ham",
    "lard",
    "gelatin",
    "pepperoni",
    "salami",
    "prosciutto",
    "chorizo",
    "pancetta",
}

NON_KOSHER_SEAFOOD_KEYWORDS = {
    "shrimp",
    "crab",
    "lobster",
    "clam",
    "clams",
    "oyster",
    "oysters",
    "mussel",
    "mussels",
    "scallop",
    "scallops",
    "crayfish",
    "squid",
    "octopus",
    "calamari",
    "catfish",
    "swordfish",
    "shark",
    "eel",
    "sturgeon",
}

ALCOHOL_KEYWORDS = {
    "alcohol",
    "wine",
    "beer",
    "lager",
    "ale",
    "stout",
    "cider",
    "brandy",
    "cognac",
    "rum",
    "whiskey",
    "whisky",
    "gin",
    "vodka",
    "tequila",
    "vermouth",
    "sherry",
    "port",
    "sake",
    "liqueur",
    "mead",
}


def classify_by_dietary_flags(ingredients: List[str], allergens: List[str], name: str, description: str) -> List[str]:
    """Classify dietary flags for a menu item.

    Args:
        ingredients: The ingredients of the menu item.
        allergens: The allergens of the menu item.
        name: The name of the menu item.
        description: The description of the menu item.

    Returns:
        A list of dietary flags.

    """

    def get_tokens(text: str) -> Set[str]:
        """Tokenize and normalize text into searchable terms."""
        if not text:
            return set()
        text = text.lower().replace(",", " ").replace("(", " ").replace(")", " ").replace(":", " ")
        return {t.strip() for t in text.split() if len(t.strip()) > 1}

    def contains(tokens: Set[str], keywords: Set[str]) -> bool:
        """Check if any keyword matches directly or as a substring."""
        for token in tokens:
            if token in keywords:
                return True
            for keyword in keywords:
                if keyword in token:
                    return True
        return False

    dietary_flags = []
    structured_tokens = set()
    for ing in ingredients:
        structured_tokens.update(get_tokens(ing))
    for allergen in allergens:
        structured_tokens.update(get_tokens(allergen))

    combined_text = f"{name or ''} {description or ''}".lower()
    text_tokens = get_tokens(combined_text)

    explicit = {
        "vegan": "(vg)" in combined_text or "vegan" in combined_text,
        "vegetarian": "(v)" in combined_text or "vegetarian" in combined_text,
        "halal": "(h)" in combined_text or "halal" in combined_text,
        "kosher": "(k)" in combined_text or "kosher" in combined_text,
    }

    lower_flags = [f.lower() for f in dietary_flags]
    for label in ["vegan", "vegetarian", "halal", "kosher"]:
        if label in lower_flags:
            explicit[label] = True

    has_meat = contains(structured_tokens, MEAT_KEYWORDS) or contains(text_tokens, MEAT_KEYWORDS)
    has_dairy_egg_honey = contains(structured_tokens, DAIRY_EGG_HONEY_KEYWORDS) or contains(
        text_tokens, DAIRY_EGG_HONEY_KEYWORDS
    )
    has_hidden_animal = contains(structured_tokens, HIDDEN_ANIMAL_KEYWORDS) or contains(
        text_tokens, HIDDEN_ANIMAL_KEYWORDS
    )
    has_pork = contains(structured_tokens, PORK_KEYWORDS) or contains(text_tokens, PORK_KEYWORDS)
    has_non_kosher_seafood = contains(structured_tokens, NON_KOSHER_SEAFOOD_KEYWORDS) or contains(
        text_tokens, NON_KOSHER_SEAFOOD_KEYWORDS
    )
    has_alcohol = contains(structured_tokens, ALCOHOL_KEYWORDS) or contains(text_tokens, ALCOHOL_KEYWORDS)

    flags: List[str] = []

    if explicit["vegan"]:
        flags.append("vegan")
        flags.append("vegetarian")
    elif explicit["vegetarian"]:
        flags.append("vegetarian")
        if not has_dairy_egg_honey and not has_hidden_animal:
            flags.append("vegan")
    else:
        if not has_meat and not has_hidden_animal:
            flags.append("vegetarian")
            if not has_dairy_egg_honey:
                flags.append("vegan")

    if explicit["halal"] or (not has_pork and not has_alcohol):
        flags.append("halal")

    if explicit["kosher"]:
        flags.append("kosher")
    else:
        meat_and_dairy = (has_meat or has_hidden_animal) and has_dairy_egg_honey
        if not has_pork and not has_non_kosher_seafood and not meat_and_dairy:
            flags.append("kosher")

    seen = set()
    final_flags = []
    for f in flags:
        if f not in seen:
            seen.add(f)
            final_flags.append(f)

    return final_flags


Numeric = Union[int, Decimal]


class AmountField(TypedDict, total=False):
    amount: Optional[Numeric]
    dv: Optional[Numeric]
    unit: Optional[str]


class NutritionSchema(TypedDict, total=False):
    name: Optional[str]
    ingredients: Optional[List[str]]
    allergens: Optional[List[str]]
    serving_size: AmountField
    calories: AmountField
    calories_from_fat: AmountField
    total_fat: AmountField
    saturated_fat: AmountField
    trans_fat: AmountField
    cholesterol: AmountField
    sodium: AmountField
    total_carbohydrates: AmountField
    dietary_fiber: AmountField
    sugars: AmountField
    protein: AmountField
    vitamin_d: AmountField
    potassium: AmountField
    calcium: AmountField
    iron: AmountField
    dietary_flags: List[str]


def parse_nutrition_data_for_menu_item_nutrient(nutrition_data: NutritionSchema) -> dict:
    """Parse nutrition data to a format that can be used to create a menu item nutrient instance ."""

    return {
        "serving_size": nutrition_data.get("serving_size", {}).get("amount"),
        "serving_size_unit": nutrition_data.get("serving_size", {}).get("unit"),
        "calories": nutrition_data.get("calories", {}).get("amount"),
        "calories_from_fat": nutrition_data.get("calories_from_fat", {}).get("amount"),
        "total_fat": nutrition_data.get("total_fat", {}).get("amount"),
        "saturated_fat": nutrition_data.get("saturated_fat", {}).get("amount"),
        "trans_fat": nutrition_data.get("trans_fat", {}).get("amount"),
        "cholesterol": nutrition_data.get("cholesterol", {}).get("amount"),
        "sodium": nutrition_data.get("sodium", {}).get("amount"),
        "total_carbohydrates": nutrition_data.get("total_carbohydrates", {}).get("amount"),
        "dietary_fiber": nutrition_data.get("dietary_fiber", {}).get("amount"),
        "sugars": nutrition_data.get("sugars", {}).get("amount"),
        "protein": nutrition_data.get("protein", {}).get("amount"),
        "vitamin_d": nutrition_data.get("vitamin_d", {}).get("dv"),
        "potassium": nutrition_data.get("potassium", {}).get("dv"),
        "calcium": nutrition_data.get("calcium", {}).get("dv"),
        "iron": nutrition_data.get("iron", {}).get("dv"),
    }


def parse_nutrition_data_for_menu_item(nutrition_data: NutritionSchema) -> dict:
    """Parse nutrition data to a format that can be used to update a menu item instance."""

    return {
        "allergens": nutrition_data.get("allergens", []),
        "ingredients": nutrition_data.get("ingredients", []),
    }
