"""Web scraper for extracting and structuring menu item information.

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import requests
import pprint
from bs4 import BeautifulSoup
from copy import deepcopy

# from hoagiemeal.logger import logger


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

    def get_html(self, link: str = None) -> BeautifulSoup | None:
        """Fetch and parse HTML content from the specified URL.

        Args:
            link (str): The URL to fetch HTML content from. If None or empty,
                        logs an error and returns None.

        Returns:
            BeautifulSoup: Parsed HTML content as a BeautifulSoup object if the request
                        is successful. Returns None if no link is provided or if an
                        exception occurs during fetching.

        """
        # logger.info(f"Fetching HTML content for link: {link}.")
        try:
            response = requests.get(link, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "lxml")
            return soup
        except Exception as e:
            # logger.error(f"Unexpected error fetching HTML content: {e}")
            return None

    def get_info(self, soup: BeautifulSoup = None) -> dict:
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
            for i, c in enumerate(text):
                if c.isdigit():
                    return text[i:].strip()
            return ""

        try:
            response = deepcopy(self.EMPTY_MENU_SCHEMA)
            ingredients_element = soup.find_all(class_=self.INGREDIENTS_CLASS)[0]
            ingredients_parsed = ingredients_element.get_text().split(",")
            ingredients_list = [item.strip().capitalize() for item in ingredients_parsed]
            response["Ingredients"] = ingredients_list or []

            allergens_element = soup.find_all(class_=self.ALLERGENS_CLASS)[0]
            allergens_text = allergens_element.get_text().strip()
            allergen_text_truncated = (
                allergens_text[len("Ingredients include") :]
                if allergens_text.startswith("Ingredients include")
                else allergens_text
            )
            response["Allergens"] = [
                allergen.strip().capitalize() for allergen in allergen_text_truncated.split(",")
            ]

            response["Name"] = soup.find_all(self.NAME_QUERY)[0].get_text().strip()

            elements = soup.find_all(id=self.CALORIES_SIZE_ID)
            response["Serving Size"] = extract_field(elements[0].text)
            response["Calories"] = extract_field(elements[1].text)
            response["Calories from Fat"] = extract_field(elements[2].text)

            nutrition_elements = soup.find_all(id=self.NUTRITION_ID)

            response["Fat"]["Total Fat"]["Amount"] = extract_field(nutrition_elements[0].text)
            response["Fat"]["Total Fat"]["Daily Value"] = extract_field(nutrition_elements[1].text)

            response["Carbohydrates"]["Total Carbohydrates"]["Amount"] = extract_field(
                nutrition_elements[2].text
            )
            response["Carbohydrates"]["Total Carbohydrates"]["Daily Value"] = extract_field(
                nutrition_elements[3].text
            )

            response["Fat"]["Saturated Fat"]["Amount"] = extract_field(nutrition_elements[4].text)
            response["Fat"]["Saturated Fat"]["Daily Value"] = extract_field(
                nutrition_elements[5].text
            )

            response["Carbohydrates"]["Dietary Fiber"]["Amount"] = extract_field(
                nutrition_elements[6].text
            )
            response["Carbohydrates"]["Dietary Fiber"]["Daily Value"] = extract_field(
                nutrition_elements[7].text
            )

            response["Fat"]["Trans Fat"]["Amount"] = extract_field(nutrition_elements[8].text)
            response["Fat"]["Trans Fat"]["Daily Value"] = extract_field(nutrition_elements[9].text)

            response["Carbohydrates"]["Sugar"]["Amount"] = extract_field(
                nutrition_elements[10].text
            )
            response["Carbohydrates"]["Sugar"]["Daily Value"] = extract_field(
                nutrition_elements[11].text
            )

            response["Cholesterol"]["Amount"] = extract_field(nutrition_elements[12].text)
            response["Cholesterol"]["Daily Value"] = extract_field(nutrition_elements[13].text)

            response["Protein"]["Amount"] = extract_field(nutrition_elements[14].text)
            response["Protein"]["Daily Value"] = extract_field(nutrition_elements[15].text)

            response["Sodium"]["Amount"] = extract_field(nutrition_elements[16].text)
            response["Sodium"]["Daily Value"] = extract_field(nutrition_elements[17].text)

            vitamin_elements = soup.find_all("li")
            response["Vitamins"]["Vitamin D"]["Daily Value"] = extract_field(
                vitamin_elements[0].text
            )
            response["Vitamins"]["Potassium"]["Daily Value"] = extract_field(
                vitamin_elements[1].text
            )
            response["Vitamins"]["Calcium"]["Daily Value"] = extract_field(vitamin_elements[2].text)
            response["Vitamins"]["Iron"]["Daily Value"] = extract_field(vitamin_elements[3].text)

            return response
        except Exception as e:
            # logger.error(f"Exception occurred: {e}")
            response = deepcopy(self.EMPTY_MENU_SCHEMA)
            return response


def _test_scraper():
    """Test the dining hall menus scraper."""
    link = "https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort=390047"
    scraper = Scraper()
    soup = scraper.get_html(link=link)
    info = scraper.get_info(soup=soup)
    pprint.pprint(info)


if __name__ == "__main__":
    _test_scraper()
