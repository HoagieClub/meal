"""Scraper class for menu, menu items, and location data.

Copyright © 2021-2025 Hoagie Club and affiliates.

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

import datetime
from urllib.parse import urlencode
from typing import Optional
import requests
from bs4 import BeautifulSoup
from hoagiemeal.utils.logger import logger
import logging
import pprint
import re
import time
import json
import os

logger.setLevel(logging.DEBUG)
session = requests.Session()


###################################### Helper functions #####################################


def get_menu_item_ids_from_menus_for_location_and_date(menus: dict) -> "list[str]":
    """Get unique menu item ids from a dictionary of menus."""
    logger.info(f"Getting menu item ids from menus for location and date: {menus}.")
    all_ids = []
    for _, meal_menus in menus.items():
        for _, ids in meal_menus.items():
            for id in ids:
                all_ids.append(id)

    return list(set(all_ids))


def get_menu_item_ids_from_menus_for_all_locations_and_date(menus: dict) -> "list[str]":
    """Get unique menu item ids from a dictionary of menus for all locations and date."""
    logger.info(f"Getting menu item ids from menus for all locations and date: {menus}.")
    all_ids = []
    for _, location_menus in menus.items():
        for _, meal_menus in location_menus.items():
            for _, ids in meal_menus.items():
                for id in ids:
                    all_ids.append(id)

    return list(set(all_ids))


def build_menu_url(date: datetime.date, location_id: str) -> str:
    """Build a URL for the Princeton dining menu page."""
    logger.info(f"Building menu URL for date: {date}, location_id: {location_id}.")
    date_str = f"{date.month}/{date.day}/{date.year}"
    base_url = "https://menus.princeton.edu/dining/_Foodpro/online-menu/menuDetails.asp"
    params = {"myaction": "read", "dtdate": date_str, "locationNum": location_id}
    query_string = urlencode(params)
    return f"{base_url}?{query_string}"


def build_nutrition_url(id: str) -> str:
    """Build a URL for the Princeton dining nutrition label page."""
    return f"https://menus.princeton.edu/dining/_Foodpro/online-menu/label.aspx?RecNumAndPort={id}"


def build_location_url(id: str) -> str:
    """Build a URL for the Princeton dining location page."""
    return f"https://menus.princeton.edu/dining/_Foodpro/online-menu/menuDetails.asp?sName=Princeton+University+Campus+Dining&locationNum={id}"


def fetch_page_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch a webpage and return a BeautifulSoup object."""
    logger.info(f"Fetching page soup for URL: {url}.")
    RETRY_COUNT = 5
    TIMEOUT = 8
    SLEEP_TIME = 1
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Connection": "keep-alive",
    }

    for attempt in range(RETRY_COUNT):
        try:
            response = session.get(url, headers=headers, timeout=TIMEOUT)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching {url}. Attempt {attempt + 1}/{RETRY_COUNT}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error fetching {url}: {e}")
        if attempt == RETRY_COUNT - 1:
            return None
        time.sleep(SLEEP_TIME * (2**attempt))


def add_inferred_daily_values(items_map: dict) -> dict:
    """Add inferred daily value percentages for nutrition fields based on FDA guidelines for a 2000 calorie diet."""
    logger.info(f"Adding inferred daily value percentages for nutrition fields for items map: {items_map}.")
    DV_STANDARDS = {
        "total_fat": 78,  # grams
        "saturated_fat": 20,  # grams
        "cholesterol": 300,  # mg
        "sodium": 2300,  # mg
        "total_carbs": 275,  # grams
        "dietary_fiber": 28,  # grams
        "added_sugars": 50,  # grams
        "protein": 50,  # grams
        "vitamin_d": 20,  # mcg
        "calcium": 1300,  # mg
        "iron": 18,  # mg
        "potassium": 4700,  # mg
    }

    def calculate_dv(amount: Optional[float], standard: float) -> Optional[int]:
        """Calculate daily value percentage."""
        if amount is None:
            return None
        try:
            dv = (amount / standard) * 100
            return int(round(dv))
        except (ValueError, ZeroDivisionError):
            return None

    for _, item_data in items_map.items():
        logger.info(f"Adding inferred daily value percentages for nutrition fields for item data: {item_data}.")
        nutrition = item_data.get("nutrition", {})

        if nutrition.get("total_fat") is not None and nutrition.get("total_fat_dv") is None:
            nutrition["total_fat_dv"] = calculate_dv(nutrition["total_fat"], DV_STANDARDS["total_fat"])

        if nutrition.get("saturated_fat") is not None and nutrition.get("saturated_fat_dv") is None:
            nutrition["saturated_fat_dv"] = calculate_dv(nutrition["saturated_fat"], DV_STANDARDS["saturated_fat"])

        if nutrition.get("cholesterol") is not None and nutrition.get("cholesterol_dv") is None:
            nutrition["cholesterol_dv"] = calculate_dv(nutrition["cholesterol"], DV_STANDARDS["cholesterol"])

        if nutrition.get("sodium") is not None and nutrition.get("sodium_dv") is None:
            nutrition["sodium_dv"] = calculate_dv(nutrition["sodium"], DV_STANDARDS["sodium"])

        if nutrition.get("total_carbs") is not None and nutrition.get("total_carbs_dv") is None:
            nutrition["total_carbs_dv"] = calculate_dv(nutrition["total_carbs"], DV_STANDARDS["total_carbs"])

        if nutrition.get("dietary_fiber") is not None and nutrition.get("dietary_fiber_dv") is None:
            nutrition["dietary_fiber_dv"] = calculate_dv(nutrition["dietary_fiber"], DV_STANDARDS["dietary_fiber"])

        if nutrition.get("added_sugars") is not None and nutrition.get("added_sugars_dv") is None:
            nutrition["added_sugars_dv"] = calculate_dv(nutrition["added_sugars"], DV_STANDARDS["added_sugars"])

        if nutrition.get("protein") is not None and nutrition.get("protein_dv") is None:
            nutrition["protein_dv"] = calculate_dv(nutrition["protein"], DV_STANDARDS["protein"])

        if nutrition.get("vitamin_d") is not None and nutrition.get("vitamin_d_dv") is None:
            nutrition["vitamin_d_dv"] = calculate_dv(nutrition["vitamin_d"], DV_STANDARDS["vitamin_d"])

        if nutrition.get("calcium") is not None and nutrition.get("calcium_dv") is None:
            nutrition["calcium_dv"] = calculate_dv(nutrition["calcium"], DV_STANDARDS["calcium"])

        if nutrition.get("iron") is not None and nutrition.get("iron_dv") is None:
            nutrition["iron_dv"] = calculate_dv(nutrition["iron"], DV_STANDARDS["iron"])

        if nutrition.get("potassium") is not None and nutrition.get("potassium_dv") is None:
            nutrition["potassium_dv"] = calculate_dv(nutrition["potassium"], DV_STANDARDS["potassium"])

    return items_map


###################################### Scraper functions #####################################


def extract_locations(soup: BeautifulSoup) -> Optional[dict]:
    """Extract all dining locations from a BeautifulSoup object."""
    logger.info("Extracting locations from soup.")
    try:
        locations = {}
        residential_ul = soup.find("ul", id="residential")
        retail_ul = soup.find("ul", id="retail")

        location_lists = []
        if residential_ul:
            location_lists.append(("residential", residential_ul))
        if retail_ul:
            location_lists.append(("retail", retail_ul))

        for category, ul_element in location_lists:
            items = ul_element.find_all("li", class_=category)

            for item in items:
                try:
                    location_id = item.get("id")
                    if not location_id:
                        continue

                    link = item.find("a")
                    if not link:
                        continue

                    location_name = link.get_text(strip=True)
                    href = link.get("href")
                    location_url = None
                    if href:
                        location_url = f"https://menus.princeton.edu/dining/_Foodpro/online-menu/{href}"

                    if location_name == "Rockefeller College":
                        continue
                    if location_name == "Mathey College":
                        location_name = "Mathey & Rockefeller Colleges"
                    if location_name == "Yeh College & New College West":
                        location_name = "Yeh College & NCW"
                    if location_name == "Whitman College & Butler College":
                        location_name = "Whitman & Butler Colleges"
                    if location_name == "The Gallery":
                        location_name = "Frist Gallery"

                    locations[location_id] = {
                        "id": location_id,
                        "category": category,
                        "name": location_name,
                        "url": location_url,
                    }
                except Exception as e:
                    logger.warning(f"Error extracting location item: {e}")
                    continue

        return locations
    except Exception as e:
        logger.error(f"Error extracting locations from soup: {e}.")
        return None


def extract_menus(soup: BeautifulSoup) -> Optional[dict]:
    """Extract menu data from a BeautifulSoup object."""
    logger.info("Extracting menus from soup.")
    MEAL_CARD_CLASS = ".card.mealCard"
    HEADER_CLASS = ".card-header"
    BODY_CLASS = ".card-body"
    STATION_CLASS = "mealStation"
    ITEM_CLASS = "accordion-item"
    NUTRITION_LINK_CLASS = ".tour-nutrition-link"

    try:
        menu = {}
        for meal_card in soup.select(MEAL_CARD_CLASS):
            meal_name_el = meal_card.select_one(HEADER_CLASS)
            if not meal_name_el:
                continue

            meal_name = meal_name_el.contents[0].get_text(strip=True)
            meal_data = {}
            current_station = None

            body = meal_card.select_one(BODY_CLASS)
            if not body:
                continue

            for element in body.select(".mealStation, .accordion-item"):
                classes = element.get("class") or []

                if STATION_CLASS in classes:
                    current_station = element.get_text(strip=True)
                    meal_data[current_station] = []
                    continue

                if ITEM_CLASS in classes and current_station:
                    accordion_body = element.select_one("div.accordion-body.p-2")
                    if accordion_body:
                        body_text = accordion_body.get_text()
                        if "nutritional information is not available" in body_text.lower():
                            logger.info("Skipping menu item with unavailable nutritional information")
                            continue

                    nutrition_link = element.select_one(NUTRITION_LINK_CLASS)
                    if nutrition_link:
                        href = nutrition_link.get("href")
                        if href:
                            match = re.search(r"RecNumAndPort=(\d+)", href)  # type: ignore
                            if match:
                                menu_item_id = match.group(1)
                                meal_data[current_station].append(menu_item_id)

            menu[meal_name] = meal_data

        return menu
    except Exception as e:
        logger.error(f"Error extracting menu data in extract_menu_data: {e}.")
        return None


def extract_menu_items(ids: "list[str]") -> dict:
    """Extract detailed information for menu items by scraping their nutrition label pages."""
    logger.info(f"Extracting menu items from ids: {ids}.")
    items_map = {}

    def parse_numeric(value: str) -> Optional[float]:
        """Extract numeric value from string with units (e.g., '5.7g' -> 5.7, '7%' -> 7)."""
        if not value:
            return None
        match = re.search(r"([\d.]+)", value)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    for id in ids:
        logger.info(f"Extracting menu item from id: {id}.")
        nutrition_url = build_nutrition_url(id)
        try:
            soup = fetch_page_soup(nutrition_url)
            if not soup:
                logger.warning(f"Failed to fetch nutrition label for menu item id: {id}")
                continue

            item_name = "Unknown"
            name_el = soup.select_one("#mobile-label .h5.text-center")
            if name_el:
                item_name = name_el.get_text(strip=True)

            nutrition_data = {
                "servings_per_container": None,
                "serving_size": None,
                "calories": None,
                "total_fat": None,
                "total_fat_dv": None,
                "saturated_fat": None,
                "saturated_fat_dv": None,
                "trans_fat": None,
                "cholesterol": None,
                "cholesterol_dv": None,
                "sodium": None,
                "sodium_dv": None,
                "total_carbs": None,
                "total_carbs_dv": None,
                "dietary_fiber": None,
                "dietary_fiber_dv": None,
                "total_sugars": None,
                "added_sugars": None,
                "added_sugars_dv": None,
                "protein": None,
                "protein_dv": None,
                "vitamin_d": None,
                "vitamin_d_dv": None,
                "calcium": None,
                "calcium_dv": None,
                "iron": None,
                "iron_dv": None,
                "potassium": None,
                "potassium_dv": None,
                "ingredients": None,
                "allergens": None,
            }

            try:
                servings_text = soup.find(text=re.compile(r"\d+\s+servings per container"))
                if servings_text:
                    match = re.search(r"(\d+)\s+servings per container", servings_text.strip())  # type: ignore
                    if match:
                        nutrition_data["servings_per_container"] = int(match.group(1))  # type: ignore

                serving_rows = soup.select(".row.ms-0.me-0")
                for row in serving_rows:
                    if "Serving size" in row.get_text():
                        serving_strong = row.select_one("strong")
                        if serving_strong:
                            nutrition_data["serving_size"] = serving_strong.get_text(strip=True)  # type: ignore
                        break

                calories_section = soup.find("div", class_="h4 m-0 p-0")
                if calories_section and "Calories" in calories_section.get_text():
                    calories_row = calories_section.find_parent("div", class_="row")
                    if calories_row:
                        calories_div = calories_row.select_one("div[style*='font-size: 2em']")
                        if calories_div:
                            cal_text = calories_div.get_text(strip=True)
                            if cal_text and not re.match(r"^-+$", cal_text):
                                nutrition_data["calories"] = parse_numeric(cal_text)  # type: ignore

                all_rows = soup.select("#mobile-label .card-body .row.ms-0.me-0")

                for row in all_rows:
                    col_9 = row.select_one(".col-9")
                    col_3 = row.select_one(".col-3")
                    if not col_9:
                        continue

                    label_text = col_9.get_text(strip=True)
                    dv_text = col_3.get_text(strip=True) if col_3 else ""
                    if dv_text and not re.match(r"^-+$", dv_text):
                        dv_value = parse_numeric(dv_text)
                    else:
                        dv_value = None

                    if "Total Fat" in label_text and "Saturated" not in label_text and "Trans" not in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["total_fat"] = float(match.group(1))  # type: ignore
                            nutrition_data["total_fat_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["total_fat"] = None

                    elif "Saturated Fat" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["saturated_fat"] = float(match.group(1))  # type: ignore
                            nutrition_data["saturated_fat_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["saturated_fat"] = None

                    elif "Trans" in label_text and "Fat" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["trans_fat"] = float(match.group(1))  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["trans_fat"] = None

                    elif "Cholesterol" in label_text and label_text.index("Cholesterol") < 5:
                        match = re.search(r"([\d.]+)mg", label_text)
                        if match:
                            nutrition_data["cholesterol"] = float(match.group(1))  # type: ignore
                            nutrition_data["cholesterol_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["cholesterol"] = None

                    elif "Sodium" in label_text and label_text.index("Sodium") < 5:
                        match = re.search(r"([\d.]+)mg", label_text)
                        if match:
                            nutrition_data["sodium"] = float(match.group(1))  # type: ignore
                            nutrition_data["sodium_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["sodium"] = None

                    elif "Total Carbohydrate" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["total_carbs"] = float(match.group(1))  # type: ignore
                            nutrition_data["total_carbs_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["total_carbs"] = None

                    elif "Dietary Fiber" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["dietary_fiber"] = float(match.group(1))  # type: ignore
                            nutrition_data["dietary_fiber_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["dietary_fiber"] = None

                    elif "Total Sugars" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["total_sugars"] = float(match.group(1))  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["total_sugars"] = None

                    elif "Added Sugars" in label_text:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["added_sugars"] = float(match.group(1))  # type: ignore
                            nutrition_data["added_sugars_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["added_sugars"] = None

                    elif "Protein" in label_text and label_text.index("Protein") < 5:
                        match = re.search(r"([\d.]+)g", label_text)
                        if match:
                            nutrition_data["protein"] = float(match.group(1))  # type: ignore
                            nutrition_data["protein_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["protein"] = None

                    elif "Vitamin D" in label_text:
                        match = re.search(r"([\d.]+)mcg", label_text)
                        if match:
                            nutrition_data["vitamin_d"] = float(match.group(1))  # type: ignore
                            nutrition_data["vitamin_d_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["vitamin_d"] = None

                    elif "Calcium" in label_text and label_text.index("Calcium") < 5:
                        match = re.search(r"([\d.]+)mg", label_text)
                        if match:
                            nutrition_data["calcium"] = float(match.group(1))  # type: ignore
                            nutrition_data["calcium_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["calcium"] = None

                    elif "Iron" in label_text and label_text.index("Iron") < 5:
                        match = re.search(r"([\d.]+)mg", label_text)
                        if match:
                            nutrition_data["iron"] = float(match.group(1))  # type: ignore
                            nutrition_data["iron_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["iron"] = None

                    elif "Potassium" in label_text and label_text.index("Potassium") < 5:
                        match = re.search(r"([\d.]+)mg", label_text)
                        if match:
                            nutrition_data["potassium"] = float(match.group(1))  # type: ignore
                            nutrition_data["potassium_dv"] = dv_value  # type: ignore
                        elif re.search(r"-\s*-\s*-", label_text):
                            nutrition_data["potassium"] = None

                ingredients_div = soup.find("strong", string="INGREDIENTS:")
                if ingredients_div and ingredients_div.parent:
                    ingredients_text = ingredients_div.parent.get_text(strip=True)
                    cleaned = ingredients_text.replace("INGREDIENTS:", "").strip()
                    nutrition_data["ingredients"] = cleaned if cleaned else None  # type: ignore

                allergens_div = soup.find("strong", string="ALLERGENS:")
                if allergens_div and allergens_div.parent:
                    allergens_text = allergens_div.parent.get_text(strip=True)
                    cleaned = allergens_text.replace("ALLERGENS:", "").strip()
                    nutrition_data["allergens"] = cleaned if cleaned else None  # type: ignore

            except Exception as e:
                logger.warning(f"Error parsing nutrition details for menu item id: {id}: {e}")
            if item_name == "Unknown":
                logger.warning(f"Unknown item name for menu item id: {id}")
                continue

            items_map[id] = {
                "id": id,
                "name": item_name,
                "url": nutrition_url,
                "nutrition": nutrition_data,
            }
        except Exception as e:
            logger.warning(f"Error extracting menu item from URL {nutrition_url}: {e}")
            continue

    return items_map


###################################### Service functions #####################################


class Scraper:
    """Scraper class for scraping dining menus and menu items."""

    def get_all_locations(self) -> Optional[dict]:
        """Get all locations."""
        logger.info("Getting all locations from main menu page.")
        url = "https://menus.princeton.edu/dining/_Foodpro/online-menu/default.asp"
        soup = fetch_page_soup(url)
        if not soup:
            logger.error("Failed to fetch main menu page")
            return None

        locations = extract_locations(soup)
        if not locations:
            logger.error("Failed to extract locations")
            return None

        logger.info(f"Extracted {len(locations)} locations")
        return locations

    def get_menus_for_location_and_date(self, location_id: str, date: datetime.date) -> Optional[dict]:
        """Get the menus for a given location and date."""
        logger.info(f"Getting menus for location: {location_id} and date: {date}.")

        url = build_menu_url(date, location_id)
        soup = fetch_page_soup(url)
        if not soup:
            logger.error(f"Failed to fetch page soup for {url}")
            return None

        menus = extract_menus(soup)
        if not menus:
            logger.error(f"Failed to extract menus for {url}")
            return None

        return menus

    def get_menus_for_all_locations_and_date(self, date: datetime.date) -> Optional[dict]:
        """Get the menus for all locations and date."""
        logger.info(f"Getting menus for all locations and date: {date}.")

        locations = self.get_all_locations()
        if not locations:
            logger.error("Failed to get all locations")
            return None

        all_menus = {}
        for location_id in locations.keys():
            menus = self.get_menus_for_location_and_date(location_id, date)
            if not menus:
                logger.error(f"Failed to get menus for {location_id} and date: {date}")
                continue
            all_menus[location_id] = menus

        if not all_menus:
            logger.error(f"Failed to get menus for all locations and date: {date}")
            return None

        logger.info(f"Extracted {len(all_menus)} menus for all locations and date: {date}")
        return all_menus

    def get_menu_items(self, ids: "list[str]") -> Optional[dict]:
        """Get the menu items for a given ids."""
        logger.info(f"Getting menu items for ids: {ids}.")

        menu_items = extract_menu_items(ids)
        if not menu_items:
            logger.error(f"Failed to extract menu items for {ids}")
            return None

        menu_items = add_inferred_daily_values(menu_items)
        if not menu_items:
            logger.error(f"Failed to add inferred daily values for {ids}")
            return None

        return menu_items


scraper = Scraper()


###################################### Tester functions #####################################


def test_scrape_all_locations():
    """Test scraping all locations."""
    logger.info("Testing scraping all locations.")
    locations = scraper.get_all_locations()
    if not locations:
        logger.error("Failed to get all locations")
        return None
    pprint.pprint(locations)

    os.makedirs("data", exist_ok=True)
    with open("data/locations.json", "w") as f:
        json.dump(locations, f, indent=2)


def test_scrape_menu_with_menu_items():
    """Test scraping menu items."""
    logger.info("Testing scraping menu items.")
    date = datetime.date.today()
    menus = scraper.get_menus_for_all_locations_and_date(date)
    if not menus:
        logger.error(f"Failed to get menus for all locations and date: {date}")
        return None

    ids = get_menu_item_ids_from_menus_for_all_locations_and_date(menus)
    if not ids:
        logger.error(f"Failed to get menu item ids for all locations and date: {date}")
        return None
    pprint.pprint(ids)

    menu_items = scraper.get_menu_items(ids)
    if not menu_items:
        logger.error(f"Failed to get menu items for {ids}")
        return None
    pprint.pprint(menu_items)

    folder_name = f"data/{datetime.date.today().strftime('%Y-%m-%d')}"
    os.makedirs(folder_name, exist_ok=True)
    with open(f"{folder_name}/menus.json", "w") as f:
        json.dump(menus, f, indent=2)
    with open(f"{folder_name}/menu_items.json", "w") as f:
        json.dump(menu_items, f, indent=2)


if __name__ == "__main__":
    test_scrape_all_locations()
    test_scrape_menu_with_menu_items()
