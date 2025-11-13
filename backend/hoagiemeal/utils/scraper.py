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

import requests
import pprint
from bs4 import BeautifulSoup
from copy import deepcopy
from hoagiemeal.utils.logger import logger


class Scraper:
    """Web scraper for extracting and structuring menu item information.

    Attributes:
        INGREDIENTS_CLASS (str): CSS class used to locate ingredient elements in HTML.
        ALLERGENS_CLASS (str): CSS class used to locate allergen elements in HTML.
        CALORIES_SIZE_ID (str): HTML ID used to locate calorie and serving size elements.
        NUTRITION_ID (str): HTML ID used to locate nutrition facts.
        NAME_QUERY (str): HTML tag used to locate the menu item name.
        EMPTY_MENU_SCHEMA (dict): A default schema for structured menu information,
                                  including "Name", "Serving Size", "Calories",
                                  "Calories from Fat", and detailed nutritional sections
                                  for "Fat", "Carbohydrates", "Protein", and "Vitamins".

    """

    def __init__(self):
        """Initialize the Scraper with HTML selectors and an empty schema template."""
        self.INGREDIENTS_CLASS = "labelingredientsvalue"
        self.ALLERGENS_CLASS = "labelallergensvalue"
        self.CALORIES_SIZE_ID = "facts2"
        self.NUTRITION_ID = "facts4"
        self.NAME_QUERY = "h2"
        self.EMPTY_MENU_SCHEMA = {
            "Name": "",
            "Serving Size": "",
            "Calories": "",
            "Calories from Fat": "",
            "Ingredients": [],
            "Allergens": [],
            "Fat": {
                "Total Fat": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Saturated Fat": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Trans Fat": {
                    "Amount": "",
                    "Daily Value": "",
                },
            },
            "Cholesterol": {
                "Amount": "",
                "Daily Value": "",
            },
            "Sodium": {
                "Amount": "",
                "Daily Value": "",
            },
            "Carbohydrates": {
                "Total Carbohydrates": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Dietary Fiber": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Sugar": {
                    "Amount": "",
                    "Daily Value": "",
                },
            },
            "Protein": {
                "Amount": "",
                "Daily Value": "",
            },
            "Vitamins": {
                "Vitamin D": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Calcium": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Iron": {
                    "Amount": "",
                    "Daily Value": "",
                },
                "Potassium": {
                    "Amount": "",
                    "Daily Value": "",
                },
            },
        }

    def get_html(self, link: str) -> BeautifulSoup | None:
        """Fetch and parse HTML content from the specified URL.

        Args:
            link (str): The URL to fetch HTML content from. If None or empty,
                        logs an error and returns None.

        Returns:
            BeautifulSoup: Parsed HTML content as a BeautifulSoup object if the request
                        is successful. Returns None if no link is provided or if an
                        exception occurs during fetching.

        """
        logger.info(f"Fetching HTML content for link: {link}.")
        try:
            response = requests.get(link, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "lxml")
            return soup
        except Exception as e:
            logger.error(f"Unexpected error fetching HTML content: {e}")
            return None

    def get_info(self, soup: BeautifulSoup) -> dict:
        """Extract menu item information.

        Args:
            soup (BeautifulSoup): Parsed HTML content containing menu item data. If None
                or invalid, an empty schema is returned.

        Returns:
            dict: A dictionary with the following keys (indented implies nested keys):
                - "Ingredients"
                - "Allergens"
                - "Name"
                - "Serving Size"
                - "Calories"
                - "Calories from Fat"
                - "Fat"
                    - "Total Fat", "Saturated Fat", "Trans Fat"
                - "Carbohydrates"
                    - "Total Carbohydrates", "Dietary Fiber", "Sugar"
                - "Cholesterol"
                - "Protein"
                - "Sodium"
                - "Vitamins"
                    - "Vitamin D", "Potassium", "Calcium", "Iron")

        """

        def extract_field(text: str) -> str:
            """Finds the first numerical digit and returns the rest of the string."""
            for i, c in enumerate(text):
                if c.isdigit():
                    return text[i:].strip()
            return ""

        def safe_get_text(elements_list: list, index: int, extractor=extract_field) -> str:
            """Safely get text from a list of elements at a specific index."""
            try:
                if index < len(elements_list):
                    return extractor(elements_list[index].get_text())
            except Exception as e:
                logger.warning(f"Failed to safely extract text at index {index}: {e}")
            return ""

        def process_allergen(raw_allergen: str) -> str:
            """Strips, maps, and capitalizes allergen strings."""
            allergen = raw_allergen.strip()
            
            # Apply mappings (case-insensitive for robustness)
            if allergen.lower() == "crustacean shellfish":
                return "Crustacean"
            if allergen.lower() == "ingredients include alcohol":
                return "Alcohol"
            if allergen.lower() == "ingredients include coconut":
                return "Coconut"
            
            # Capitalize anything that didn't match a map
            return allergen.capitalize()

        response = deepcopy(self.EMPTY_MENU_SCHEMA)
        if not soup:
            return response

        try:
            # Ingredients
            ingredients_elements = soup.find_all(class_=self.INGREDIENTS_CLASS)
            if ingredients_elements:
                ingredients_parsed = ingredients_elements[0].get_text().split(",")
                ingredients_list = [item.strip().capitalize() for item in ingredients_parsed]
                response["Ingredients"] = ingredients_list or []

            # Allergens
            allergens_elements = soup.find_all(class_=self.ALLERGENS_CLASS)
            if allergens_elements:
                allergens_text = allergens_elements[0].get_text().strip()
                allergen_text_truncated = (
                    allergens_text[len("Ingredients include") :]
                    if allergens_text.startswith("Ingredients include")
                    else allergens_text
                )
                
                # Split, process/map, and filter out empty strings
                raw_allergens = allergen_text_truncated.split(",")
                print(raw_allergens)
                processed_allergens = [process_allergen(a) for a in raw_allergens if a.strip()]
                response["Allergens"] = processed_allergens

            # Name
            name_elements = soup.find_all(self.NAME_QUERY)
            if name_elements:
                response["Name"] = name_elements[0].get_text().strip()

            # Serving Size, Calories
            elements = soup.find_all(id=self.CALORIES_SIZE_ID)
            response["Serving Size"] = safe_get_text(elements, 0)
            response["Calories"] = safe_get_text(elements, 1)
            response["Calories from Fat"] = safe_get_text(elements, 2)

            # --- Macronutrients ---
            nutrition_elements = soup.find_all(id=self.NUTRITION_ID)

            # Fat
            response["Fat"]["Total Fat"]["Amount"] = safe_get_text(nutrition_elements, 0)
            response["Fat"]["Total Fat"]["Daily Value"] = safe_get_text(nutrition_elements, 1)
            response["Fat"]["Saturated Fat"]["Amount"] = safe_get_text(nutrition_elements, 4)
            response["Fat"]["Saturated Fat"]["Daily Value"] = safe_get_text(nutrition_elements, 5)
            response["Fat"]["Trans Fat"]["Amount"] = safe_get_text(nutrition_elements, 8)
            response["Fat"]["Trans Fat"]["Daily Value"] = safe_get_text(nutrition_elements, 9)

            # Carbs
            response["Carbohydrates"]["Total Carbohydrates"]["Amount"] = safe_get_text(
                nutrition_elements, 2
            )
            response["Carbohydrates"]["Total Carbohydrates"]["Daily Value"] = safe_get_text(
                nutrition_elements, 3
            )
            response["Carbohydrates"]["Dietary Fiber"]["Amount"] = safe_get_text(
                nutrition_elements, 6
            )
            response["Carbohydrates"]["Dietary Fiber"]["Daily Value"] = safe_get_text(
                nutrition_elements, 7
            )
            response["Carbohydrates"]["Sugar"]["Amount"] = safe_get_text(nutrition_elements, 10)
            response["Carbohydrates"]["Sugar"]["Daily Value"] = safe_get_text(
                nutrition_elements, 11
            )

            # Cholesterol
            response["Cholesterol"]["Amount"] = safe_get_text(nutrition_elements, 12)
            response["Cholesterol"]["Daily Value"] = safe_get_text(nutrition_elements, 13)

            # Protein
            response["Protein"]["Amount"] = safe_get_text(nutrition_elements, 14)
            response["Protein"]["Daily Value"] = safe_get_text(nutrition_elements, 15)

            # Sodium
            response["Sodium"]["Amount"] = safe_get_text(nutrition_elements, 16)
            response["Sodium"]["Daily Value"] = safe_get_text(nutrition_elements, 17)

            # --- Micronutrients (Vitamins) ---
            vitamin_elements = soup.find_all("li")
            response["Vitamins"]["Vitamin D"]["Daily Value"] = safe_get_text(vitamin_elements, 0)
            response["Vitamins"]["Potassium"]["Daily Value"] = safe_get_text(vitamin_elements, 1)
            response["Vitamins"]["Calcium"]["Daily Value"] = safe_get_text(vitamin_elements, 2)
            response["Vitamins"]["Iron"]["Daily Value"] = safe_get_text(vitamin_elements, 3)
            # print(response)
            return response
        except Exception as e:
            logger.error(f"Exception occurred during scraping: {e}", exc_info=True)
            # Return whatever was scraped so far, or the empty schema
            return response


def _test_scraper():
    """Test the dining hall menus scraper."""
    # This link is for "Choice of Toppings", which has full nutrition
    link = "http://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=680005"
    
    # This link is for "Shanghai Pork Noodles", which also has full nutrition
    # link = "http://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=601067"
    
    # This link is for an item that might be missing data (for testing robustness)
    # link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=390047"
    
    scraper = Scraper()
    soup = scraper.get_html(link=link)
    info = scraper.get_info(soup=soup)

if __name__ == "__main__":
    # Configure a simple logger for testing if run directly
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    _test_scraper()