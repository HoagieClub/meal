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


class NutrientField(TypedDict, total=False):
    amount: Optional[Numeric]
    dv: Optional[Numeric]
    unit: Optional[str]


class NutritionSchema(TypedDict, total=False):
    serving_size: Optional[Numeric]
    serving_unit: Optional[str]

    calories: Optional[int]
    calories_from_fat: Optional[int]

    ingredients: Optional[List[str]]
    allergens: Optional[List[str]]

    total_fat: NutrientField
    saturated_fat: NutrientField
    trans_fat: NutrientField

    cholesterol: NutrientField
    sodium: NutrientField

    total_carbohydrates: NutrientField
    dietary_fiber: NutrientField
    sugars: NutrientField

    protein: NutrientField

    vitamin_d: NutrientField
    potassium: NutrientField
    calcium: NutrientField
    iron: NutrientField


class Scraper:
    """Web scraper for extracting and structuring menu item information."""

    INGREDIENTS_CLASS = "labelingredientsvalue"
    ALLERGENS_CLASS = "labelallergensvalue"
    CALORIES_SIZE_ID = "facts2"
    NUTRITION_ID = "facts4"
    NAME_QUERY = "h2"
    # Allergen mappings for the scraper to map the allergens to the correct names
    ALLERGEN_MAPPINGS = {
        "crustacean shellfish": "Crustacean",
        "ingredients include alcohol": "Alcohol",
        "ingredients include coconut": "Coconut",
    }

    EMPTY_MENU_SCHEMA: NutritionSchema = {
        "serving_size": None,
        "serving_unit": None,
        "calories": None,
        "calories_from_fat": None,
        "ingredients": None,
        "allergens": None,
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

    def scrape(self, link: str) -> dict:
        """Fetch HTML and extract menu item information in one call."""
        logger.info(f"Fetching HTML content for link: {link}.")

        try:
            response = requests.get(link, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "lxml")
        except Exception as e:
            logger.error(f"Unexpected error fetching HTML content: {e}")
            return deepcopy(self.EMPTY_MENU_SCHEMA)  # type: ignore

        data = deepcopy(self.EMPTY_MENU_SCHEMA)

        # Helper functions for extracting the data from the HTML
        def extract_field(text: str) -> str:
            for i, c in enumerate(text):
                if c.isdigit():
                    return text[i:].strip()
            return ""

        def safe(index, elements, fn=extract_field):
            return fn(elements[index].get_text()) if 0 <= index < len(elements) else ""

        def process_allergen(a: str) -> str:
            a = a.strip()
            m = a.lower()
            return self.ALLERGEN_MAPPINGS.get(m, a.capitalize())

        def to_numeric(value: str) -> Optional[Numeric]:
            if not value:
                return None
            match = re.search(r"[\d\.]+", value)
            if not match:
                return None
            number = match.group(0)
            if "." in number:
                return Decimal(number)
            return int(number)

        def parse_amount_and_unit(value: str):
            if not value:
                return None, None
            num = to_numeric(value)
            unit_match = re.search(r"(mg|g|mcg)", value, re.IGNORECASE)
            unit = unit_match.group(0).lower() if unit_match else None
            return num, unit

        ingredients_el = soup.find(class_=self.INGREDIENTS_CLASS)
        allergens_el = soup.find(class_=self.ALLERGENS_CLASS)
        name_el = soup.find(self.NAME_QUERY)
        calories_fields = soup.find_all(id=self.CALORIES_SIZE_ID)
        nutrition_fields = soup.find_all(id=self.NUTRITION_ID)
        vitamins = soup.find_all("li")

        if ingredients_el:
            items = [x.strip().capitalize() for x in ingredients_el.get_text().split(",") if x.strip()]
            data["ingredients"] = items

        if allergens_el:
            txt = allergens_el.get_text().strip()
            if txt.startswith("Ingredients include"):
                txt = txt[len("Ingredients include") :]
            allergen_list = [process_allergen(a) for a in txt.split(",") if a.strip()]
            data["allergens"] = allergen_list

        data["serving_size"] = to_numeric(safe(0, calories_fields))

        try:
            data["calories"] = int(safe(1, calories_fields)) if safe(1, calories_fields) else None
        except Exception:
            data["calories"] = None

        try:
            data["calories_from_fat"] = int(safe(2, calories_fields)) if safe(2, calories_fields) else None
        except Exception:
            data["calories_from_fat"] = None

        mappings = [
            ("total_fat", 0, 1),
            ("total_carbohydrates", 2, 3),
            ("saturated_fat", 4, 5),
            ("dietary_fiber", 6, 7),
            ("trans_fat", 8, 9),
            ("sugars", 10, 11),
        ]

        for key, idx_amt, idx_dv in mappings:
            amt_raw = safe(idx_amt, nutrition_fields)
            dv_raw = safe(idx_dv, nutrition_fields)
            amount, unit = parse_amount_and_unit(amt_raw)
            dv = to_numeric(dv_raw)
            data[key] = {"amount": amount, "dv": dv, "unit": unit}

        chol_amt, chol_unit = parse_amount_and_unit(safe(12, nutrition_fields))
        data["cholesterol"] = {"amount": chol_amt, "dv": to_numeric(safe(13, nutrition_fields)), "unit": chol_unit}

        prot_amt, prot_unit = parse_amount_and_unit(safe(14, nutrition_fields))
        data["protein"] = {"amount": prot_amt, "dv": to_numeric(safe(15, nutrition_fields)), "unit": prot_unit}

        sodium_amt, sodium_unit = parse_amount_and_unit(safe(16, nutrition_fields))
        data["sodium"] = {"amount": sodium_amt, "dv": to_numeric(safe(17, nutrition_fields)), "unit": sodium_unit}

        vitamin_map = ["vitamin_d", "potassium", "calcium", "iron"]
        for i, key in enumerate(vitamin_map):
            dv = to_numeric(safe(i, vitamins))
            data[key] = {"amount": None, "dv": dv, "unit": None}

        return data  # type: ignore


def _test_scraper():
    """Test the dining hall menus scraper."""
    # This link is for "Choice of Toppings", which has full nutrition
    link = "http://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=680005"

    scraper = Scraper()
    info = scraper.scrape(link=link)
    pprint.pprint(info)


if __name__ == "__main__":
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    _test_scraper()
