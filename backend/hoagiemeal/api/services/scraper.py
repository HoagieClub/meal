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
import re
import time


session = requests.Session()


###################################### Helper functions #####################################


def get_menu_item_ids_from_menus_for_location_and_date(menus: dict) -> "list[str]":
    """Get unique menu item ids from a dictionary of menus."""
    logger.debug(f"Getting menu item ids from menus for location and date: {menus}.")
    all_ids = []
    for _, meal_menus in menus.items():
        for _, ids in meal_menus.items():
            for id in ids:
                all_ids.append(id)

    return list(set(all_ids))


def get_menu_item_ids_from_menus_for_all_locations_and_date(menus: dict) -> "list[str]":
    """Get unique menu item ids from a dictionary of menus for all locations and date."""
    logger.debug("Getting menu item ids from menus for all locations and date.")
    all_ids = []
    for _, location_menus in menus.items():
        for _, meal_menus in location_menus.items():
            for _, ids in meal_menus.items():
                for id in ids:
                    all_ids.append(id)

    return list(set(all_ids))


def build_menu_url(date: datetime.date, location_id: str) -> str:
    """Build a URL for the Princeton dining menu page."""
    logger.debug(f"Building menu URL for date: {date}, location_id: {location_id}.")
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
    logger.debug(f"Fetching page soup for URL: {url}.")
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
    logger.debug(f"Adding inferred daily values for {len(items_map)} items.")
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
        logger.debug(f"Adding inferred daily values for item: {item_data.get('id')}.")
        nutrition = item_data.get("nutrition", {})

        for nutrient, standard in DV_STANDARDS.items():
            dv_key = f"{nutrient}_dv"
            if nutrition.get(nutrient) is not None and nutrition.get(dv_key) is None:
                nutrition[dv_key] = calculate_dv(nutrition[nutrient], standard)

    return items_map


###################################### Scraper functions #####################################


def extract_locations(soup: BeautifulSoup) -> Optional[dict]:
    """Extract all dining locations from a BeautifulSoup object."""
    logger.debug("Extracting locations from soup.")
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
    logger.debug("Extracting menus from soup.")
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
                            logger.debug("Skipping menu item with unavailable nutritional information.")
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


# Each rule: (match_fn, unit_regex, value_field, dv_field or None)
# Order matters — first match wins (mirrors the original if/elif chain).
NUTRIENT_RULES = [
    (lambda t: "Total Fat" in t and "Saturated" not in t and "Trans" not in t,
     r"([\d.]+)g", "total_fat", "total_fat_dv"),
    (lambda t: "Saturated Fat" in t,
     r"([\d.]+)g", "saturated_fat", "saturated_fat_dv"),
    (lambda t: "Trans" in t and "Fat" in t,
     r"([\d.]+)g", "trans_fat", None),
    (lambda t: "Cholesterol" in t and t.index("Cholesterol") < 5,
     r"([\d.]+)mg", "cholesterol", "cholesterol_dv"),
    (lambda t: "Sodium" in t and t.index("Sodium") < 5,
     r"([\d.]+)mg", "sodium", "sodium_dv"),
    (lambda t: "Total Carbohydrate" in t,
     r"([\d.]+)g", "total_carbs", "total_carbs_dv"),
    (lambda t: "Dietary Fiber" in t,
     r"([\d.]+)g", "dietary_fiber", "dietary_fiber_dv"),
    (lambda t: "Total Sugars" in t,
     r"([\d.]+)g", "total_sugars", None),
    (lambda t: "Added Sugars" in t,
     r"([\d.]+)g", "added_sugars", "added_sugars_dv"),
    (lambda t: "Protein" in t and t.index("Protein") < 5,
     r"([\d.]+)g", "protein", "protein_dv"),
    (lambda t: "Vitamin D" in t,
     r"([\d.]+)mcg", "vitamin_d", "vitamin_d_dv"),
    (lambda t: "Calcium" in t and t.index("Calcium") < 5,
     r"([\d.]+)mg", "calcium", "calcium_dv"),
    (lambda t: "Iron" in t and t.index("Iron") < 5,
     r"([\d.]+)mg", "iron", "iron_dv"),
    (lambda t: "Potassium" in t and t.index("Potassium") < 5,
     r"([\d.]+)mg", "potassium", "potassium_dv"),
]


def _build_empty_nutrition_data() -> dict:
    """Build a nutrition_data dict with all fields set to None."""
    data = {
        "servings_per_container": None,
        "serving_size": None,
        "calories": None,
        "ingredients": None,
        "allergens": None,
    }
    for _, _, value_field, dv_field in NUTRIENT_RULES:
        data[value_field] = None
        if dv_field:
            data[dv_field] = None
    return data


def _parse_numeric(value: str) -> Optional[float]:
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


def extract_menu_items(ids: "list[str]") -> dict:
    """Extract detailed information for menu items by scraping their nutrition label pages."""
    logger.debug(f"Extracting menu items from {len(ids)} ids.")
    items_map = {}

    for id in ids:
        logger.debug(f"Extracting menu item from id: {id}.")
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

            nutrition_data = _build_empty_nutrition_data()

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
                                nutrition_data["calories"] = _parse_numeric(cal_text)  # type: ignore

                all_rows = soup.select("#mobile-label .card-body .row.ms-0.me-0")

                for row in all_rows:
                    col_9 = row.select_one(".col-9")
                    col_3 = row.select_one(".col-3")
                    if not col_9:
                        continue

                    label_text = col_9.get_text(strip=True)
                    dv_text = col_3.get_text(strip=True) if col_3 else ""
                    if dv_text and not re.match(r"^-+$", dv_text):
                        dv_value = _parse_numeric(dv_text)
                    else:
                        dv_value = None

                    for matches, unit_pattern, value_field, dv_field in NUTRIENT_RULES:
                        if matches(label_text):
                            match = re.search(unit_pattern, label_text)
                            if match:
                                nutrition_data[value_field] = float(match.group(1))
                                if dv_field:
                                    nutrition_data[dv_field] = dv_value
                            elif re.search(r"-\s*-\s*-", label_text):
                                nutrition_data[value_field] = None
                            break

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


###################################### Service class #####################################


class Scraper:
    """Scraper class for scraping dining menus and menu items."""

    def get_all_locations(self) -> Optional[dict]:
        """Get all locations."""
        logger.debug("Getting all locations from main menu page.")
        url = "https://menus.princeton.edu/dining/_Foodpro/online-menu/default.asp"
        soup = fetch_page_soup(url)
        if not soup:
            logger.error("Failed to fetch main menu page")
            return None

        locations = extract_locations(soup)
        if not locations:
            logger.error("Failed to extract locations")
            return None

        logger.debug(f"Extracted {len(locations)} locations")
        return locations

    def get_menus_for_location_and_date(self, location_id: str, date: datetime.date) -> Optional[dict]:
        """Get the menus for a given location and date."""
        logger.debug(f"Getting menus for location: {location_id} and date: {date}.")

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
        logger.debug(f"Getting menus for all locations and date: {date}.")

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

        logger.debug(f"Extracted {len(all_menus)} menus for all locations and date: {date}")
        return all_menus

    def get_menu_items(self, ids: "list[str]") -> Optional[dict]:
        """Get the menu items for a given ids."""
        logger.debug(f"Getting menu items for {len(ids)} ids.")

        menu_items = extract_menu_items(ids)
        if not menu_items:
            logger.error(f"Failed to extract menu items for {ids}")
            return None

        menu_items = add_inferred_daily_values(menu_items)
        if not menu_items:
            logger.error(f"Failed to add inferred daily values for {ids}")
            return None

        return menu_items
