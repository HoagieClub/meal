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
    # Empty menu schema for when the scraper fails to find any data
    EMPTY_MENU_SCHEMA = {
        "Name": "",
        "Serving Size": "",
        "Calories": "",
        "Calories from Fat": "",
        "Ingredients": [],
        "Allergens": [],
        "Fat": {
            "Total Fat": {"Amount": "", "Daily Value": ""},
            "Saturated Fat": {"Amount": "", "Daily Value": ""},
            "Trans Fat": {"Amount": "", "Daily Value": ""},
        },
        "Cholesterol": {"Amount": "", "Daily Value": ""},
        "Sodium": {"Amount": "", "Daily Value": ""},
        "Carbohydrates": {
            "Total Carbohydrates": {"Amount": "", "Daily Value": ""},
            "Dietary Fiber": {"Amount": "", "Daily Value": ""},
            "Sugar": {"Amount": "", "Daily Value": ""},
        },
        "Protein": {"Amount": "", "Daily Value": ""},
        "Vitamins": {
            "Vitamin D": {"Amount": "", "Daily Value": ""},
            "Calcium": {"Amount": "", "Daily Value": ""},
            "Iron": {"Amount": "", "Daily Value": ""},
            "Potassium": {"Amount": "", "Daily Value": ""},
        },
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
            return deepcopy(self.EMPTY_MENU_SCHEMA)

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

        ingredients_el = soup.find(class_=self.INGREDIENTS_CLASS)
        allergens_el = soup.find(class_=self.ALLERGENS_CLASS)
        name_el = soup.find(self.NAME_QUERY)
        calories_fields = soup.find_all(id=self.CALORIES_SIZE_ID)
        nutrition_fields = soup.find_all(id=self.NUTRITION_ID)
        vitamins = soup.find_all("li")

        if ingredients_el:
            items = [x.strip().capitalize() for x in ingredients_el.get_text().split(",")]
            data["Ingredients"] = items

        if allergens_el:
            txt = allergens_el.get_text().strip()
            if txt.startswith("Ingredients include"):
                txt = txt[len("Ingredients include") :]
            allergen_list = [process_allergen(a) for a in txt.split(",") if a.strip()]
            data["Allergens"] = allergen_list

        if name_el:
            data["Name"] = name_el.get_text().strip()

        data["Serving Size"] = safe(0, calories_fields)
        data["Calories"] = safe(1, calories_fields)
        data["Calories from Fat"] = safe(2, calories_fields)

        mappings = [
            ("Fat", "Total Fat", 0, 1),
            ("Carbohydrates", "Total Carbohydrates", 2, 3),
            ("Fat", "Saturated Fat", 4, 5),
            ("Carbohydrates", "Dietary Fiber", 6, 7),
            ("Fat", "Trans Fat", 8, 9),
            ("Carbohydrates", "Sugar", 10, 11),
        ]

        for section, nutrient, idx_amt, idx_dv in mappings:
            data[section][nutrient]["Amount"] = safe(idx_amt, nutrition_fields)
            data[section][nutrient]["Daily Value"] = safe(idx_dv, nutrition_fields)

        data["Cholesterol"]["Amount"] = safe(12, nutrition_fields)
        data["Cholesterol"]["Daily Value"] = safe(13, nutrition_fields)
        data["Protein"]["Amount"] = safe(14, nutrition_fields)
        data["Protein"]["Daily Value"] = safe(15, nutrition_fields)
        data["Sodium"]["Amount"] = safe(16, nutrition_fields)
        data["Sodium"]["Daily Value"] = safe(17, nutrition_fields)

        vitamin_keys = ["Vitamin D", "Potassium", "Calcium", "Iron"]
        for i, key in enumerate(vitamin_keys):
            data["Vitamins"][key]["Daily Value"] = safe(i, vitamins)

        return data


def _test_scraper():
    """Test the dining hall menus scraper."""
    # This link is for "Choice of Toppings", which has full nutrition
    link = "http://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=680005"

    # This link is for "Shanghai Pork Noodles", which also has full nutrition
    # link = "http://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=601067"

    # This link is for an item that might be missing data (for testing robustness)
    # link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=390047"

    scraper = Scraper()
    info = scraper.scrape(link=link)
    pprint.pprint(info)


if __name__ == "__main__":
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    _test_scraper()
