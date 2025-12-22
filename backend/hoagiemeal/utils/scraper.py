"""Web scraper for extracting and structuring menu item information.

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

import pprint
import requests
from bs4 import BeautifulSoup
from copy import deepcopy
from hoagiemeal.utils.logger import logger
from typing import TypedDict, Optional, List, Union
from decimal import Decimal
import re

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


class Scraper:
    """Web scraper for extracting and structuring menu item information."""

    INGREDIENTS_CLASS = "labelingredientsvalue"
    ALLERGENS_CLASS = "labelallergensvalue"
    CALORIES_SIZE_ID = "facts2"
    NUTRITION_ID = "facts4"
    NAME_QUERY = "h2"
    ALLERGEN_MAPPINGS = {
        "crustacean shellfish": "Crustacean",
        "ingredients include alcohol": "Alcohol",
        "ingredients include coconut": "Coconut",
    }

    EMPTY_NUTRITION_SCHEMA: NutritionSchema = {
        "name": None,
        "ingredients": None,
        "allergens": None,
        "serving_size": {"amount": None, "dv": None, "unit": None},
        "calories": {"amount": None, "dv": None, "unit": None},
        "calories_from_fat": {"amount": None, "dv": None, "unit": None},
        "total_fat": {"amount": None, "dv": None, "unit": None},
        "saturated_fat": {"amount": None, "dv": None, "unit": None},
        "trans_fat": {"amount": None, "dv": None, "unit": None},
        "cholesterol": {"amount": None, "dv": None, "unit": None},
        "sodium": {"amount": None, "dv": None, "unit": None},
        "total_carbohydrates": {"amount": None, "dv": None, "unit": None},
        "dietary_fiber": {"amount": None, "dv": None, "unit": None},
        "sugars": {"amount": None, "dv": None, "unit": None},
        "protein": {"amount": None, "dv": None, "unit": None},
        "vitamin_d": {"amount": None, "dv": None, "unit": None},
        "potassium": {"amount": None, "dv": None, "unit": None},
        "calcium": {"amount": None, "dv": None, "unit": None},
        "iron": {"amount": None, "dv": None, "unit": None},
    }

    def scrape_api_url(self, api_url: str) -> dict:
        """Fetch HTML and extract menu item information in one call."""
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "lxml")
        scraped_data: NutritionSchema = deepcopy(self.EMPTY_NUTRITION_SCHEMA)

        def extract_field(text: str) -> str:
            for index, char in enumerate(text):
                if char.isdigit():
                    return text[index:].strip()
            return ""

        def safe(index, elements, transform_fn=extract_field):
            return transform_fn(elements[index].get_text()) if 0 <= index < len(elements) else ""

        def process_allergen(allergen_text: str) -> str:
            allergen_text = allergen_text.strip().lower()
            return self.ALLERGEN_MAPPINGS.get(allergen_text, allergen_text.capitalize())

        def to_numeric(raw_value: str) -> Optional[Numeric]:
            if not raw_value:
                return None
            number_match = re.search(r"[\d\.]+", raw_value)
            if not number_match:
                return None
            numeric_string = number_match.group(0)
            if "." in numeric_string:
                return Decimal(numeric_string)
            return int(numeric_string)

        def parse_amount_and_unit(raw_value: str):
            if not raw_value:
                return None, None

            numeric_value = to_numeric(raw_value)
            unit_match = re.search(r"[\d\.]+\s*([a-zA-Zµ%]+)", raw_value)
            unit_value = unit_match.group(1) if unit_match else None
            return numeric_value, unit_value

        ingredients_element = soup.find(class_=self.INGREDIENTS_CLASS)
        allergens_element = soup.find(class_=self.ALLERGENS_CLASS)
        name_element = soup.find(self.NAME_QUERY)
        calories_elements = soup.find_all(id=self.CALORIES_SIZE_ID)
        nutrition_elements = soup.find_all(id=self.NUTRITION_ID)
        vitamin_elements = soup.find_all("li")

        if ingredients_element:
            ingredients_text = ingredients_element.get_text().strip()
            ingredient_items: List[str] = []
            ingredient_buffer: List[str] = []
            parenthesis_depth = 0

            for char in ingredients_text:
                if char == "(":
                    parenthesis_depth += 1
                    ingredient_buffer.append(char)
                elif char == ")":
                    parenthesis_depth -= 1
                    ingredient_buffer.append(char)
                elif char == "," and parenthesis_depth == 0:
                    ingredient_value = "".join(ingredient_buffer).strip()
                    if ingredient_value:
                        ingredient_items.append(ingredient_value.capitalize())
                    ingredient_buffer = []
                else:
                    ingredient_buffer.append(char)

            final_ingredient_value = "".join(ingredient_buffer).strip()
            if final_ingredient_value:
                ingredient_items.append(final_ingredient_value.capitalize())
            scraped_data["ingredients"] = ingredient_items

        if name_element:
            scraped_data["name"] = name_element.get_text().strip()

        if allergens_element:
            allergens_text = allergens_element.get_text().strip()
            if allergens_text.startswith("Ingredients include"):
                allergens_text = allergens_text[len("Ingredients include") :]
            allergen_list = [process_allergen(a) for a in allergens_text.split(",") if a.strip()]
            scraped_data["allergens"] = allergen_list

        serving_amount, serving_unit = parse_amount_and_unit(safe(0, calories_elements))
        scraped_data["serving_size"] = {"amount": serving_amount, "dv": None, "unit": serving_unit}

        try:
            calories_raw_value = safe(1, calories_elements)
            scraped_data["calories"] = {
                "amount": int(calories_raw_value) if calories_raw_value else None,
                "dv": None,
                "unit": None,
            }
        except Exception:
            scraped_data["calories"] = {"amount": None, "dv": None, "unit": None}

        try:
            calories_from_fat_raw_value = safe(2, calories_elements)
            scraped_data["calories_from_fat"] = {
                "amount": int(calories_from_fat_raw_value) if calories_from_fat_raw_value else None,
                "dv": None,
                "unit": None,
            }
        except Exception:
            scraped_data["calories_from_fat"] = {"amount": None, "dv": None, "unit": None}

        nutrition_mapping = [
            ("total_fat", 0, 1),
            ("total_carbohydrates", 2, 3),
            ("saturated_fat", 4, 5),
            ("dietary_fiber", 6, 7),
            ("trans_fat", 8, 9),
            ("sugars", 10, 11),
        ]

        for nutrition_key, amount_index, dv_index in nutrition_mapping:
            nutrition_amount_raw = safe(amount_index, nutrition_elements)
            nutrition_dv_raw = safe(dv_index, nutrition_elements)
            numeric_amount, unit_value = parse_amount_and_unit(nutrition_amount_raw)
            dv_value = to_numeric(nutrition_dv_raw)
            scraped_data[nutrition_key] = {"amount": numeric_amount, "dv": dv_value, "unit": unit_value}

        cholesterol_amount, cholesterol_unit = parse_amount_and_unit(safe(12, nutrition_elements))
        scraped_data["cholesterol"] = {
            "amount": cholesterol_amount,
            "dv": to_numeric(safe(13, nutrition_elements)),
            "unit": cholesterol_unit,
        }

        protein_amount, protein_unit = parse_amount_and_unit(safe(14, nutrition_elements))
        scraped_data["protein"] = {
            "amount": protein_amount,
            "dv": to_numeric(safe(15, nutrition_elements)),
            "unit": protein_unit,
        }

        sodium_amount, sodium_unit = parse_amount_and_unit(safe(16, nutrition_elements))
        scraped_data["sodium"] = {
            "amount": sodium_amount,
            "dv": to_numeric(safe(17, nutrition_elements)),
            "unit": sodium_unit,
        }

        vitamin_keys = ["vitamin_d", "potassium", "calcium", "iron"]
        for vitamin_index, vitamin_key in enumerate(vitamin_keys):
            vitamin_dv_value = to_numeric(safe(vitamin_index, vitamin_elements))
            scraped_data[vitamin_key] = {"amount": None, "dv": vitamin_dv_value, "unit": None}

        return scraped_data  # type: ignore


def _test_scraper():
    """Test the dining hall menus scraper."""
    link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=680000"

    scraper = Scraper()
    scraped_data = scraper.scrape_api_url(api_url=link)
    pprint.pprint(scraped_data)

    """
    Example output:
    {'allergens': ['Fish', 'Soybeans', 'Alcohol'],
    'calcium': {'amount': None, 'dv': 1, 'unit': None},
    'calories': {'amount': 45, 'dv': None, 'unit': None},
    'calories_from_fat': {'amount': None, 'dv': None, 'unit': None},
    'cholesterol': {'amount': 12, 'dv': None, 'unit': 'mg'},
    'dietary_fiber': {'amount': Decimal('0.4'), 'dv': 1, 'unit': 'g'},
    'ingredients': ['Chipotle beef (ground beef vegetable blend (grass-fed beef, '
                    'spare starter (cauliflower, zucchini, tomato, onion, '
                    'eggplant, salt, garlic powder, black pepper), carrot fiber), '
                    'tomato strips, chipotle peppers)',
                    'Cumin tofu (tofu, cumin, smoked paprika, coriander, black '
                    'pepper, kosher salt)',
                    'Chipotle honey chicken (halal chicken breast, hot sauce '
                    '(aged cayenne red peppers, vinegar, water, salt, garlic '
                    'powder.), honey, chipotle peppers)',
                    'Dijon salmon (salmon filet, dijon mustard (water, vinegar, '
                    'mustard seed, salt, white wine, fruit pectin, citric  acid, '
                    'tartaric acid, sugar, spice.), flat leaf parsley, whole '
                    'grain mustard (water, mustard seeds, vinegar, salt))'],
    'iron': {'amount': None, 'dv': 3, 'unit': None},
    'name': 'Choice of Beef Chicken Salmon or Tofu',
    'potassium': {'amount': None, 'dv': 2, 'unit': None},
    'protein': {'amount': 5, 'dv': None, 'unit': 'g'},
    'saturated_fat': {'amount': Decimal('0.6'), 'dv': 2, 'unit': 'g'},
    'serving_size': {'amount': 6, 'dv': None, 'unit': 'oz'},
    'sodium': {'amount': Decimal('128.9'), 'dv': 6, 'unit': 'mg'},
    'sugars': {'amount': Decimal('0.7'), 'dv': None, 'unit': 'g'},
    'total_carbohydrates': {'amount': Decimal('1.3'), 'dv': 1, 'unit': 'g'},
    'total_fat': {'amount': Decimal('2.1'), 'dv': 3, 'unit': 'g'},
    'trans_fat': {'amount': Decimal('0.1'), 'dv': None, 'unit': 'g'},
    'vitamin_d': {'amount': None, 'dv': 0, 'unit': None}}
    """


if __name__ == "__main__":
    _test_scraper()
