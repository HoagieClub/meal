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
from hoagiemeal.logger import logger


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
        logger.info("Fetching HTML content.")
        if link is None or link == "":
            logger.error("Exception occurred: No link provided.")
            return None
        try:
            response = requests.get(link, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, "lxml")
            logger.info("HTML content fetched successfully.")
            return soup
        except requests.RequestException as e:
            logger.error(f"Network error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching HTML content: {e}")
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
        if soup is None or not isinstance(soup, BeautifulSoup):
            logger.error("Exception occurred: No soup object found.")
            response = deepcopy(self.EMPTY_MENU_SCHEMA)
            return response
        try:
            response = deepcopy(self.EMPTY_MENU_SCHEMA)
            try:
                ingredients_element = soup.find_all(class_=self.INGREDIENTS_CLASS)[0]
                ingredients_parsed = ingredients_element.get_text().split(",")
                ingredients_list = [item.strip().capitalize() for item in ingredients_parsed]
                response["Ingredients"] = ingredients_list or []
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            try:
                allergens_element = soup.find_all(class_=self.ALLERGENS_CLASS)[0]
                allergens_text = allergens_element.get_text().strip()
                allergen_text_truncated = (
                    allergens_text[len("Ingredients include") :]
                    if allergens_text.startswith("Ingredients include")
                    else allergens_text
                )
                allergens_list = [allergen.strip().capitalize() for allergen in allergen_text_truncated.split(",")]
                response["Allergens"] = allergens_list or []
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            try:
                name_element = soup.find_all(self.NAME_QUERY)[0]
                name_text = name_element.get_text().strip()
                response["Name"] = name_text or ""
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            try:
                elements = soup.find_all(id=self.CALORIES_SIZE_ID)
                serving_size_element = elements[0]
                serving_size_text = serving_size_element.text.strip()[len("Serving Size") :].strip()
                response["Serving Size"] = serving_size_text if any(chr.isdigit() for chr in serving_size_text) else ""

                calories_element = elements[1]
                calories_text = calories_element.text.strip()[len("Calories") :].strip()
                calories_text = calories_text if calories_text.isnumeric() else ""
                response["Calories"] = calories_text if any(chr.isdigit() for chr in calories_text) else ""

                fat_calories_element = elements[2]
                fat_calories_text = fat_calories_element.text.strip()[len("Calories from Fat") :].strip()
                fat_calories_text = fat_calories_text if fat_calories_text.isnumeric() else ""
                response["Calories from Fat"] = (
                    fat_calories_text if any(chr.isdigit() for chr in fat_calories_text) else ""
                )
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            try:
                nutrition_elements = soup.find_all(id=self.NUTRITION_ID) or []
                total_fat_amount_element = nutrition_elements[0]
                total_fat_amount_text = total_fat_amount_element.text.strip()[len("Total Fat") :].strip()
                response["Fat"]["Total Fat"]["Amount"] = (
                    total_fat_amount_text if any(chr.isdigit() for chr in total_fat_amount_text) else ""
                )

                total_fat_dv_element = nutrition_elements[1]
                total_fat_dv_text = total_fat_dv_element.text.strip()
                response["Fat"]["Total Fat"]["Daily Value"] = (
                    total_fat_dv_text if any(chr.isdigit() for chr in total_fat_dv_text) else ""
                )

                total_carb_amount_element = nutrition_elements[2]
                total_carb_amount_text = total_carb_amount_element.text.strip()[len("Tot. Carb.") :].strip()
                response["Carbohydrates"]["Total Carbohydrates"]["Amount"] = (
                    total_carb_amount_text if any(chr.isdigit() for chr in total_carb_amount_text) else ""
                )

                total_carb_dv_element = nutrition_elements[3]
                total_carb_dv_text = total_carb_dv_element.text.strip()
                response["Carbohydrates"]["Total Carbohydrates"]["Daily Value"] = (
                    total_carb_dv_text if any(chr.isdigit() for chr in total_carb_dv_text) else ""
                )

                sat_fat_amount_element = nutrition_elements[4]
                sat_fat_amount_text = sat_fat_amount_element.text.strip()[len("Sat. Fat") :].strip()
                response["Fat"]["Saturated Fat"]["Amount"] = (
                    sat_fat_amount_text if any(chr.isdigit() for chr in sat_fat_amount_text) else ""
                )

                sat_fat_dv_element = nutrition_elements[5]
                sat_fat_dv_text = sat_fat_dv_element.text.strip()
                response["Fat"]["Saturated Fat"]["Daily Value"] = (
                    sat_fat_dv_text if any(chr.isdigit() for chr in sat_fat_dv_text) else ""
                )

                fiber_amount_element = nutrition_elements[6]
                fiber_amount_text = fiber_amount_element.text.strip()[len("Dietary Fiber") :].strip()
                response["Carbohydrates"]["Dietary Fiber"]["Amount"] = (
                    fiber_amount_text if any(chr.isdigit() for chr in fiber_amount_text) else ""
                )

                fiber_dv_element = nutrition_elements[7]
                fiber_dv_text = fiber_dv_element.text.strip()
                response["Carbohydrates"]["Dietary Fiber"]["Daily Value"] = (
                    fiber_dv_text if any(chr.isdigit() for chr in fiber_dv_text) else ""
                )

                trans_fat_amount_element = nutrition_elements[8]
                trans_fat_amount_text = trans_fat_amount_element.text.strip()[len("Trans Fat") :].strip()
                response["Fat"]["Trans Fat"]["Amount"] = (
                    trans_fat_amount_text if any(chr.isdigit() for chr in trans_fat_amount_text) else ""
                )

                trans_fat_dv_element = nutrition_elements[9]
                trans_fat_dv_text = trans_fat_dv_element.text.strip()
                response["Fat"]["Trans Fat"]["Daily Value"] = (
                    trans_fat_dv_text if any(chr.isdigit() for chr in trans_fat_dv_text) else ""
                )

                sugar_amount_element = nutrition_elements[10]
                sugar_amount_text = sugar_amount_element.text.strip()[len("Sugars") :].strip()
                response["Carbohydrates"]["Sugar"]["Amount"] = (
                    sugar_amount_text if any(chr.isdigit() for chr in sugar_amount_text) else ""
                )

                sugar_dv_element = nutrition_elements[11]
                sugar_dv_text = sugar_dv_element.text.strip()
                response["Carbohydrates"]["Sugar"]["Daily Value"] = (
                    sugar_dv_text if any(chr.isdigit() for chr in sugar_dv_text) else ""
                )

                chol_amount_element = nutrition_elements[12]
                chol_amount_text = chol_amount_element.text.strip()[len("Cholesterol") :].strip()
                response["Cholesterol"]["Amount"] = (
                    chol_amount_text if any(chr.isdigit() for chr in chol_amount_text) else ""
                )

                chol_dv_element = nutrition_elements[13]
                chol_dv_text = chol_dv_element.text.strip()
                response["Cholesterol"]["Daily Value"] = (
                    chol_dv_text if any(chr.isdigit() for chr in chol_dv_text) else ""
                )

                protein_amount_element = nutrition_elements[14]
                protein_amount_text = protein_amount_element.text.strip()[len("Protein") :].strip()
                response["Protein"]["Amount"] = (
                    protein_amount_text if any(chr.isdigit() for chr in protein_amount_text) else ""
                )

                protein_dv_element = nutrition_elements[15]
                protein_dv_text = protein_dv_element.text.strip()
                response["Protein"]["Daily Value"] = (
                    protein_dv_text if any(chr.isdigit() for chr in protein_dv_text) else ""
                )

                sodium_amount_element = nutrition_elements[16]
                sodium_amount_text = sodium_amount_element.text.strip()[len("Sodium") :].strip()
                response["Sodium"]["Amount"] = (
                    sodium_amount_text if any(chr.isdigit() for chr in sodium_amount_text) else ""
                )

                sodium_dv_element = nutrition_elements[17]
                sodium_dv_text = sodium_dv_element.text.strip()
                response["Sodium"]["Daily Value"] = (
                    sodium_dv_text if any(chr.isdigit() for chr in sodium_dv_text) else ""
                )
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            try:
                elements = soup.find_all("li")
                vitamin_d_dv_element = elements[0]
                vitamin_d_dv_sub_element = vitamin_d_dv_element.find("span")
                vitamin_d_dv_text = vitamin_d_dv_sub_element.get_text().strip()
                response["Vitamins"]["Vitamin D"]["Daily Value"] = (
                    vitamin_d_dv_text if any(chr.isdigit() for chr in vitamin_d_dv_text) else ""
                )

                potassium_dv_element = elements[1]
                potassium_dv_sub_element = potassium_dv_element.find("span")
                potassium_dv_text = potassium_dv_sub_element.get_text().strip()
                response["Vitamins"]["Potassium"]["Daily Value"] = (
                    potassium_dv_text if any(chr.isdigit() for chr in potassium_dv_text) else ""
                )

                calcium_dv_element = elements[2]
                calcium_dv_sub_element = calcium_dv_element.find("span")
                calcium_dv_text = calcium_dv_sub_element.get_text().strip()
                response["Vitamins"]["Calcium"]["Daily Value"] = (
                    calcium_dv_text if any(chr.isdigit() for chr in calcium_dv_text) else ""
                )

                iron_dv_element = elements[3]
                iron_dv_sub_element = iron_dv_element.find("span")
                iron_dv_text = iron_dv_sub_element.get_text().strip()
                response["Vitamins"]["Iron"]["Daily Value"] = (
                    iron_dv_text if any(chr.isdigit() for chr in iron_dv_text) else ""
                )
            except Exception as e:
                logger.error(f"Exception occurred: {e}")

            return response
        except Exception as e:
            logger.error(f"Exception occurred: {e}")
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
