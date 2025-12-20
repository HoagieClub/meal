"""API manager class for the /dining/menu endpoints from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/menus

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

import json
import os
import re
import datetime
from random import sample
from decimal import Decimal, InvalidOperation
from typing import Optional, Tuple, Dict

import msgspec.json as msj
import pytz
import requests
from bs4 import BeautifulSoup

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import models, transaction, IntegrityError

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.menu import MenuItem, Menu, MenuItemNutrient
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.serializers import (
    FullMenuItemSerializer,
)
from hoagiemeal.api.locations import LocationsAPI
from hoagiemeal.api.database import get_mapped_menu_item_nutrient_data
from hoagiemeal.utils.scraper import Scraper
from hoagiemeal.utils.dietary import classify_by_dietary_flags


USE_SAMPLE_MENUS = False
MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}


def parse_menu_id(menu_id: str) -> Tuple[datetime.date, str]:
    """Parse menu_id into date and meal code."""
    date_str, meal_type = menu_id.rsplit("-", 1)
    menu_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    meal_code = MEAL_TYPE_MAP.get(meal_type)
    if not meal_code:
        raise ValueError(
            f"Invalid meal type '{meal_type}' in menu_id '{menu_id}'. Expected: Breakfast, Lunch, or Dinner."
        )
    return menu_date, meal_code


class MenuAPI(StudentApp):
    """Handles API communication for dining menus and menu item nutrition information."""

    DINING_MENU = "/dining/menu"
    SCHEMAS = Schemas()
    SCRAPER = Scraper()

    def get_menu(self, location_id: str, menu_id: str) -> dict:
        """Fetch menu from external API.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            dict: Raw menu data from API.

        """
        logger.info(f"Fetching menu for location_id: {location_id}, menu_id: {menu_id}.")
        params = {"locationID": location_id, "menuID": menu_id}
        response = self._make_request(self.DINING_MENU, params=params)
        decoded_menu = msj.decode(response).get("menus", [])
        return decoded_menu

    def get_menu_item_nutrition_info(self, api_url: str) -> dict:
        """Get nutrition information for a menu item from API.

        Args:
            api_url (str): The API URL of the menu item.

        Returns:
            dict: Nutrition information for the menu item.

        """
        logger.info(f"Getting nutrition information for API URL: {api_url}.")
        api_nutrition_info = self.SCRAPER.scrape_api_url(api_url=api_url)
        
        return api_nutrition_info

    def get_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> dict:
        """Get menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            dict: Menu with nutrition information for each menu item.

        """
        logger.info(f"Getting menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        menu = self.get_menu(location_id, menu_id)
        for menu_item in menu:
            api_url = menu_item.get("link")

            nutrition_info = self.get_menu_item_nutrition_info(api_url)
            dietary_flags = classify_by_dietary_flags(
                ingredients=nutrition_info.get("ingredients", []),
                allergens=nutrition_info.get("allergens", []),
                name=menu_item.get("name"),
                description=menu_item.get("description"),
            )
            nutrition_info["dietary_flags"] = dietary_flags
            menu_item["nutrition"] = nutrition_info
        return menu


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}

    def get_cached_menu(self, location_id: str, menu_id: str) -> Optional[Menu]:
        """Get cached menu from database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").

        Returns:
            Optional[Menu]: Cached menu if found, None otherwise.

        """
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)
        venue = DiningVenue.objects.get(database_id=location_id)
        cached_menu = (
            Menu.objects.prefetch_related(models.Prefetch("menu_items", queryset=MenuItem.objects))
            .filter(dining_venue=venue, date=menu_date, meal=meal_code)
            .first()
        )
        return cached_menu

    def get_cached_menu_item_nutrition_info(self, api_id: str) -> Optional[MenuItemNutrient]:
        """Get cached nutrition information for a menu item."""
        menu_item = MenuItem.objects.get(api_id=api_id)
        return MenuItemNutrient.objects.filter(menu_item=menu_item).first()

    def get_cached_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> Optional[Menu]:
        """Get cached menu with nutrition information for each menu item."""
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)
        venue = DiningVenue.objects.get(database_id=location_id)
        cached_menu = (
            Menu.objects.prefetch_related(
                models.Prefetch("menu_items", queryset=MenuItem.objects.select_related("nutrition"))
            )
            .filter(dining_venue=venue, date=menu_date, meal=meal_code)
            .first()
        )
        return cached_menu

    def cache_menu(self, location_id: str, menu_id: str, api_menu_data: dict) -> Optional[Menu]:
        """Save menu to database cache.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            api_menu_data (dict): Raw menu data from API.

        Returns:
            Optional[Menu]: The saved Menu object, or None if venue not found or invalid menu_id.

        """
        logger.info(f"Saving menu to cache for location_id: {location_id}, menu_id: {menu_id}.")

        menu_date, meal_code = parse_menu_id(menu_id)
        venue = DiningVenue.objects.get(database_id=location_id)
        menu_items_in_api = api_menu_data.get("menus", []) if api_menu_data else []

        if not menu_items_in_api:
            with transaction.atomic():
                menu, _ = Menu.objects.get_or_create(dining_venue=venue, date=menu_date, meal=meal_code)
                menu.menu_items.set([])
                logger.info(f"Cached empty menu for location_id: {location_id}, menu_id: {menu_id}.")
            return menu

        menu_item_api_id_map = {}
        for menu_item_data in menu_items_in_api:
            menu_item_api_id_str = menu_item_data.get("id")
            if not menu_item_api_id_str:
                logger.warning(f"Missing api_id for item '{menu_item_data.get('name')}'. Skipping.")
                continue
            try:
                menu_item_api_id_map[int(menu_item_api_id_str)] = menu_item_data
            except (ValueError, TypeError):
                logger.warning(f"Invalid api_id '{menu_item_api_id_str}'. Skipping item.")

        menu_item_api_ids = set(menu_item_api_id_map.keys())
        existing_menu_item_api_ids = set(
            MenuItem.objects.filter(api_id__in=menu_item_api_ids).values_list("api_id", flat=True)
        )

        menu_items_to_create = []
        for menu_item_api_id, menu_item_data in menu_item_api_id_map.items():
            if menu_item_api_id not in existing_menu_item_api_ids:
                menu_items_to_create.append(
                    MenuItem(
                        api_id=menu_item_api_id,
                        name=menu_item_data.get("name"),
                        description=menu_item_data.get("description"),
                        link=menu_item_data.get("link"),
                    )
                )

        if len(menu_items_to_create) > 0:
            MenuItem.objects.bulk_create(menu_items_to_create, ignore_conflicts=True)
            logger.info(f"Bulk-created {len(menu_items_to_create)} new menu items.")

        menu_items = MenuItem.objects.filter(api_id__in=menu_item_api_ids)
        with transaction.atomic():
            menu, _ = Menu.objects.get_or_create(dining_venue=venue, date=menu_date, meal=meal_code)
            menu.menu_items.set(menu_items)

        logger.info(
            f"Cached menu with {len(menu_items)} items (created {len(menu_items_to_create)} new) "
            f"for location_id: {location_id}, menu_id: {menu_id}."
        )
        return menu

    def cache_menu_item_nutrition_info(self, menu_item: MenuItem, nutrition_info: dict) -> Optional[MenuItemNutrient]:
        """Cache nutrition information for a menu item."""
        nutrient, _ = MenuItemNutrient.objects.update_or_create(menu_item=menu_item, defaults=nutrition_info)
        return nutrient

    def cache_menu_item_nutrition_info(self, menu_item: MenuItem, nutrition_data: dict) -> Optional[MenuItemNutrient]:
        """Cache nutrition information for a menu item and update associated MenuItem fields.

        Args:
            menu_item: The MenuItem instance to cache nutrition for.
            nutrition_data: Dictionary with fields already in Django model format.
                          Contains both MenuItemNutrient fields and MenuItem fields (allergens, ingredients, dietary_flags).

        Returns:
            Optional[MenuItemNutrient]: The cached MenuItemNutrient instance, or None if nutrition info was not cached.

        """
        menu_item_fields = ["allergens", "ingredients", "dietary_flags"]
        nutrient_fields = {k: v for k, v in nutrition_data.items() if k not in menu_item_fields}
        if not nutrient_fields:
            raise ValueError("Nutrition data is required")

        nutrient, _ = MenuItemNutrient.objects.update_or_create(menu_item=menu_item, defaults=nutrient_fields)

        updated_menu_item = False
        for field in menu_item_fields:
            if field in nutrition_data and nutrition_data[field]:
                setattr(menu_item, field, nutrition_data[field])
                updated_menu_item = True

        if updated_menu_item:
            menu_item.save(
                update_fields=[
                    "allergens",
                    "ingredients",
                    "dietary_flags",
                ]
            )
        return nutrient


class MenuService:
    """Service for managing dining menus and menu items."""

    MENU_CACHE = MenuCache()
    MENU_API = MenuAPI()
    SCRAPER = Scraper()

    def get_menu(self, location_id: str, menu_id: str) -> dict:
        """Get a menu from the cache or API."""
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if cached_menu:
            return cached_menu
        api_menu = self.MENU_API.get_menu(location_id, menu_id)
        return api_menu

    def get_menus_for_locations_and_menu_ids(self, location_ids: "list[str]", menu_ids: "list[str]") -> dict:
        """Get menus for multiple locations and menu IDs."""
        menus = {}
        for menu_id in menu_ids:
            menus[menu_id] = {}
            for location_id in location_ids:
                menus[menu_id][location_id] = self.get_menu(location_id, menu_id)
        return menus

    def cache_menu_if_not_exists(self, location_id: str, menu_id: str) -> Tuple[bool, Optional[Menu]]:
        """Cache a menu if it does not exist in the cache."""
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if cached_menu:
            return False, cached_menu
        api_menu = self.MENU_API.get_menu(location_id, menu_id)
        self.MENU_CACHE.cache_menu(location_id, menu_id, api_menu)
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        return True, cached_menu

    def cache_menus_for_locations_and_menu_ids_if_not_exists(
        self, location_ids: "list[str]", menu_ids: "list[str]"
    ) -> dict:
        """Cache menus for multiple locations if they do not exist in the cache."""
        cached_menus = {}
        for menu_id in menu_ids:
            cached_menus[menu_id] = {}
            for location_id in location_ids:
                cached_menus[menu_id][location_id] = self.cache_menu_if_not_exists(location_id, menu_id)
        return cached_menus

    def get_menu_item_nutrition_info(self, menu_item_id: str, api_url: str) -> dict:
        """Get nutrition information for a menu item from cache or API."""
        menu_item = MenuItem.objects.get(id=menu_item_id)
        if menu_item:
            nutrition_info = self.MENU_CACHE.get_cached_menu_item_nutrition_info(menu_item)
            if nutrition_info:
                return nutrition_info
        api_nutrition_info = self.SCRAPER.scrape_api_url(api_url=api_url)
        return api_nutrition_info

    def get_menu_item_nutrition_infos_for_menu_items(self, menu_item_ids: "list[str]", api_urls: "list[str]") -> dict:
        """Get nutrition information for multiple menu items from cache or API."""
        nutrition_infos = {}
        for menu_item_id, api_url in zip(menu_item_ids, api_urls, strict=True):  # type: ignore
            nutrition_infos[menu_item_id] = self.get_menu_item_nutrition_info(menu_item_id, api_url)
        return nutrition_infos

    def cache_menu_item_nutrition_info_if_not_exists(
        self, menu_item_id: str, api_url: str
    ) -> Tuple[bool, Optional[MenuItemNutrient]]:
        cached_nutrition_info = self.MENU_CACHE.get_cached_menu_item_nutrition_info(menu_item_id)
        if cached_nutrition_info:
            return False, cached_nutrition_info
        api_nutrition_info = self.SCRAPER.scrape_api_url(api_url=api_url)
        self.MENU_CACHE.cache_menu_item_nutrition_info(menu_item_id, api_nutrition_info)
        cached_nutrition_info = self.MENU_CACHE.get_cached_menu_item_nutrition_info(menu_item_id)
        return True, cached_nutrition_info

    def cache_menu_item_nutrition_infos_for_menu_items_if_not_exists(
        self, menu_item_ids: "list[str]", api_urls: "list[str]"
    ) -> dict:
        cached_nutrition_infos = {}
        for menu_item_id, api_url in zip(menu_item_ids, api_urls, strict=True):  # type: ignore
            cached_nutrition_infos[menu_item_id] = self.cache_menu_item_nutrition_info_if_not_exists(
                menu_item_id, api_url
            )
        return cached_nutrition_infos


class MenuAPILegacy(StudentApp):
    """Legacy MenuAPI class with caching, scraping, and database operations.

    This class is kept for backward compatibility. The new MenuAPI class above
    provides a pure API interface similar to EventsAPI and LocationsAPI.
    """

    DINING_MENU = "/dining/menu"
    schemas = Schemas()
    scraper = Scraper()

    def fetch_menu_from_api(self, location_id: str, menu_id: str) -> dict:
        """Fetch and decode the menu from the API."""
        params = {"locationID": location_id, "menuID": menu_id}
        try:
            response = self._make_request(self.DINING_MENU, params=params)
            logger.info(msg=f"Menu API response for {location_id}/{menu_id}: {response}")
            decoded_data = msj.decode(response)

            if isinstance(decoded_data, list):
                for item in decoded_data:
                    if isinstance(item, dict):
                        return item
                return {}

            return decoded_data
        except Exception as e:
            logger.error(f"Error fetching menu from raw API for {location_id}/{menu_id}: {e}")
            return {}

    def scrape_nutrition_data(self, url: str) -> dict:
        """
        Scrapes a nutrition URL page using the standalone Scraper class
        and adapts its output to the format expected by get_mapped_menu_item_nutrient_data.
        """
        try:
            scraped_data = self.scraper.scrape(link=url)
            if scraped_data is None:
                logger.warning(f"Failed to scrape {url}")
                return {}  # Return an empty dict on failure

            # 2. Adapt the new schema to the old schema expected by the database.
            def clean_amount_string(amount_str: str) -> str:
                """Extracts only the numeric part of a string like '9.1g' or '521.6mg'."""
                if not amount_str:
                    return ""
                # Find the first sequence of digits and an optional decimal point
                match = re.search(r"[\d\.]+", amount_str)
                if match:
                    return match.group(0)
                return ""

            # Helper to get 'Amount' from nested dicts like "Fat"
            def get_nested_amount(data_dict, parent_key, child_key):
                # Apply the new cleaning function to the raw amount
                raw_amount = data_dict.get(parent_key, {}).get(child_key, {}).get("Amount", "")
                return clean_amount_string(raw_amount)

            # Helper to get 'Daily Value' (for vitamins)
            def get_nested_dv(data_dict, parent_key, child_key):
                # This helper is fine as is, since we just want the % value
                return data_dict.get(parent_key, {}).get(child_key, {}).get("Daily Value", "")

            # Helper to get 'Amount' from flat dicts like "Cholesterol"
            def get_flat_amount(data_dict, key):
                # Apply the new cleaning function to the raw amount
                raw_amount = data_dict.get(key, {}).get("Amount", "")
                return clean_amount_string(raw_amount)

            # Try to parse calories, handling empty strings
            try:
                # We can also use the cleaner here for robustness
                calories_str = clean_amount_string(scraped_data.get("Calories", ""))
                calories = int(float(calories_str or 0))
            except (ValueError, TypeError):
                calories = None

            try:
                # And here
                calories_from_fat_str = clean_amount_string(scraped_data.get("Calories from Fat", ""))
                calories_from_fat = int(float(calories_from_fat_str or 0))
            except (ValueError, TypeError):
                calories_from_fat = None

            # Build the adapted schema
            adapted_data = {
                "Serving Size": scraped_data.get("Serving Size", ""),
                "Calories": calories,
                "Calories from Fat": calories_from_fat,
                "Ingredients": scraped_data.get("Ingredients", []),
                "Allergens": scraped_data.get("Allergens", []),
                "DietaryFlags": scraped_data.get("DietaryFlags", []),  # Pass flags through
                # These will now return clean numbers as strings (e.g., "15.7")
                "Fat": {
                    "Total Fat": {"Amount": get_nested_amount(scraped_data, "Fat", "Total Fat")},
                    "Saturated Fat": {"Amount": get_nested_amount(scraped_data, "Fat", "Saturated Fat")},
                    "Trans Fat": {"Amount": get_nested_amount(scraped_data, "Fat", "Trans Fat")},
                },
                "Cholesterol": {"Amount": get_flat_amount(scraped_data, "Cholesterol")},  # e.g., "48.9"
                "Sodium": {"Amount": get_flat_amount(scraped_data, "Sodium")},  # e.g., "521.6"
                "Carbohydrates": {
                    "Total Carbohydrates": {
                        "Amount": get_nested_amount(scraped_data, "Carbohydrates", "Total Carbohydrates")
                    },
                    "Dietary Fiber": {"Amount": get_nested_amount(scraped_data, "Carbohydrates", "Dietary Fiber")},
                    "Sugar": {"Amount": get_nested_amount(scraped_data, "Carbohydrates", "Sugar")},
                },
                "Protein": {"Amount": get_flat_amount(scraped_data, "Protein")},  # e.g., "9.1"
                "Vitamins": {
                    # This logic remains the same, as it's handling Daily Value %
                    "Vitamin D": {"Amount": get_nested_dv(scraped_data, "Vitamins", "Vitamin D").replace("%", "")},
                    "Potassium": {"Amount": get_nested_dv(scraped_data, "Vitamins", "Potassium").replace("%", "")},
                    "Calcium": {"Amount": get_nested_dv(scraped_data, "Vitamins", "Calcium").replace("%", "")},
                    "Iron": {"Amount": get_nested_dv(scraped_data, "Vitamins", "Iron").replace("%", "")},
                },
            }

            return adapted_data

        except Exception as e:
            logger.error(f"Error adapting scraped data from {url}: {e}")
            return {}

    def get_menu(self, location_id: str, menu_id: str) -> dict:
        """Fetch the menu for a specific dining location.
        ...
        """
        logger.info(f"Getting dining menu for location_id: {location_id}, menu_id: {menu_id}.")

        MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}

        # 1. Parse menu_id to get date and meal type
        try:
            date_str, meal_type = menu_id.rsplit("-", 1)
            menu_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            meal_code = MEAL_TYPE_MAP.get(meal_type)
            if not meal_code:
                raise ValueError("Invalid meal type in menu_id")
        except ValueError:
            logger.error(f"Invalid menu_id format for '{menu_id}'. Falling back to API call.")
            return self._fetch_and_decode_menu_from_api(location_id, menu_id)

        # 2. Check database for a cached menu
        try:
            venue = DiningVenue.objects.get(database_id=location_id)
            # Use prefetch_related for the M2M field
            # Use select_related for the OneToOne nutrient_info
            cached_menu = (
                Menu.objects.prefetch_related(
                    models.Prefetch("menu_items", queryset=MenuItem.objects.select_related("nutrient_info"))
                )
                .filter(dining_venue=venue, date=menu_date, meal=meal_code)
                .first()
            )

            if cached_menu:
                # logger.info(f"✅ CACHE HIT for menu_id: {menu_id} at location_id: {location_id}")
                menu_items = cached_menu.menu_items.all()  # Get items from prefetched M2M data

                serialized_items = []
                for item in menu_items:
                    # This is the default structure the client expects, matching DEFAULT_NUTRIENTS
                    nutrition_payload = {
                        "calories": 0,
                        "protein": 0,
                        "fat": 0,
                        "carbohydrates": 0,
                        "fiber": 0,
                        "sugar": 0,
                        "sodium": 0,
                        "cholesterol": 0,
                        "calcium": 0,
                        "iron": 0,
                        "potassium": 0,
                        "vitaminD": 0,
                        "vitaminA": 0,
                        "vitaminC": 0,
                        "magnesium": 0,
                        "zinc": 0,
                    }

                    # Check if nutrient_info exists and populate the payload
                    # We must assume the model's field names based on the scraper and common sense.
                    # e.g., scraper finds 'Total Fat', model is likely 'total_fat', client wants 'fat'.
                    if hasattr(item, "nutrient_info") and item.nutrient_info:
                        ni = item.nutrient_info

                        # Helper to safely convert Decimal/None to float/0
                        def to_float(val):
                            if val is None:
                                return 0.0
                            try:
                                return float(val)
                            except (TypeError, ValueError):
                                return 0.0

                        # Map database fields (assumed) to client fields
                        # This mapping is based on your client-side Nutrients interface
                        nutrition_payload.update(
                            {
                                "calories": to_float(getattr(ni, "calories", 0)),
                                "protein": to_float(getattr(ni, "protein", 0)),
                                "fat": to_float(getattr(ni, "total_fat", 0)),  # Assumed: 'Total Fat' -> total_fat
                                "carbohydrates": to_float(
                                    getattr(ni, "total_carbohydrates", 0)
                                ),  # Assumed: 'Tot. Carb' -> total_carbohydrates
                                "fiber": to_float(
                                    getattr(ni, "dietary_fiber", 0)
                                ),  # Assumed: 'Dietary Fiber' -> dietary_fiber
                                "sugar": to_float(getattr(ni, "sugars", 0)),  # Assumed: 'Sugars' -> sugar
                                "sodium": to_float(getattr(ni, "sodium", 0)),  # Assumed: 'Sodium' -> sodium
                                "cholesterol": to_float(
                                    getattr(ni, "cholesterol", 0)
                                ),  # Assumed: 'Cholesterol' -> cholesterol
                                "calcium": to_float(getattr(ni, "calcium", 0)),  # Assumed: 'Calcium' -> calcium
                                "iron": to_float(getattr(ni, "iron", 0)),  # Assumed: 'Iron' -> iron
                                "potassium": to_float(
                                    getattr(ni, "potassium", 0)
                                ),  # Assumed: 'Potassium' -> potassium
                                "vitaminD": to_float(getattr(ni, "vitamin_d", 0)),  # Assumed: 'Vitamin D' -> vitamin_d
                                # These fields are in the client interface but not explicitly scraped.
                                # We use getattr to safely access them, defaulting to 0.
                                "vitaminA": to_float(getattr(ni, "vitamin_a", 0)),
                                "vitaminC": to_float(getattr(ni, "vitamin_c", 0)),
                                "magnesium": to_float(getattr(ni, "magnesium", 0)),
                                "zinc": to_float(getattr(ni, "zinc", 0)),
                            }
                        )

                    item_data = {
                        "id": item.api_id,  # Use api_id as the 'id' to match API response
                        "name": item.name,
                        "description": item.description,
                        "link": item.link,
                        "allergens": item.allergens or [],
                        "ingredients": item.ingredients or [],
                        # Dietary flags
                        "is_vegetarian": item.is_vegetarian,
                        "is_vegan": item.is_vegan,
                        "is_halal": item.is_halal,
                        "is_kosher": item.is_kosher,
                        "nutrition": nutrition_payload,  # Nest the full nutrition object
                    }

                    serialized_items.append(item_data)

                # Return empty list if no items, matching API structure
                return {"menus": serialized_items}

        except DiningVenue.DoesNotExist:
            logger.warning(
                f"DiningVenue with database_id {location_id} not found in DB. Cannot check cache or save menu."
            )
            # If the venue isn't in our DB, we can't cache, just return API result.
            return self._fetch_and_decode_menu_from_api(location_id, menu_id)
        except Exception as e:
            logger.error(f"Database lookup error for menu_id {menu_id}: {e}. Falling back to API.")

        # --- Cache Miss Logic ---
        logger.info(f"🚫 CACHE MISS for menu_id: {menu_id}, location_id: {location_id}. Fetching from API.")

        # 3. Fetch from the external API
        api_menu_data = self._fetch_and_decode_menu_from_api(location_id, menu_id)

        # 4. Save the result (even if empty) to the database to cache it
        #  Only attempt to cache if the venue exists in our database.
        try:
            # This 'venue' variable is from the 'try' block above
            # If we're here, 'venue' exists.

            items_in_api = api_menu_data.get("menus", []) if api_menu_data else []

            # 4a. Handle empty menu from API
            if not items_in_api:
                with transaction.atomic():
                    new_menu, created = Menu.objects.get_or_create(
                        dining_venue=venue,
                        date=menu_date,
                        meal=meal_code,
                    )
                    # Ensure M2M is empty
                    new_menu.menu_items.set([])
                    if created:
                        logger.info(f"💾 CACHE SAVED empty menu for menu_id: {menu_id} at location_id: {location_id}")
                    else:
                        logger.info(f"Menu {menu_id} at location_id: {location_id} updated to be empty.")
                return api_menu_data  # Return the empty API response

            # 4b. Prepare all API item data
            api_id_to_data_map = {}
            all_api_ids_in_menu = set()
            for item_data in items_in_api:
                try:
                    # Use .get('id') which returns None if key missing
                    api_id_str = item_data.get("id")
                    if not api_id_str:
                        logger.warning(
                            f"Missing api_id for item '{item_data.get('name')}' in menu {menu_id}. Skipping."
                        )
                        continue

                    api_id_int = int(api_id_str)
                    api_id_to_data_map[api_id_int] = item_data
                    all_api_ids_in_menu.add(api_id_int)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid api_id '{item_data.get('id')}' for menu {menu_id}. Skipping item.")
                    continue

            # 4c. Find which canonical items already exist in DB
            existing_items = MenuItem.objects.filter(api_id__in=all_api_ids_in_menu)
            existing_api_ids = set(existing_items.values_list("api_id", flat=True))

            # 4d. Prepare list of *new* canonical items to be created
            items_to_create = []
            for api_id in all_api_ids_in_menu:
                if api_id not in existing_api_ids:
                    item_data = api_id_to_data_map[api_id]
                    items_to_create.append(
                        MenuItem(
                            api_id=api_id,
                            name=item_data.get("name"),
                            description=item_data.get("description"),
                            link=item_data.get("link"),
                        )
                    )

            # 4e. Bulk-create new canonical items.
            # This is the race-condition-safe step.
            # It's *outside* the main transaction.
            items_created_count = 0
            if items_to_create:
                try:
                    # ignore_conflicts=True relies on the unique=True constraint
                    # on MenuItem.api_id in your database.
                    created_item_objects = MenuItem.objects.bulk_create(items_to_create, ignore_conflicts=True)
                    # Note: len(created_item_objects) might be 0 if all items
                    # were created by a concurrent process.
                    items_created_count = len(created_item_objects)
                    logger.info(f"Bulk-created {items_created_count} new canonical menu items.")
                except IntegrityError as e:
                    # This might happen if ignore_conflicts is not supported (e.g., old DB)
                    # or a different constraint fails.
                    logger.warning(f"IntegrityError during bulk_create (race condition?): {e}")

            # 4f. Get the full list of ALL canonical items for this menu
            # (both the ones that existed and the ones we just created)
            all_menu_items_for_this_menu = MenuItem.objects.filter(api_id__in=all_api_ids_in_menu)
            all_menu_items_map = {item.api_id: item for item in all_menu_items_for_this_menu}

            # 4g. Now, start the main transaction to link menu and scrape nutrition
            with transaction.atomic():
                # Get or create the Menu record.
                new_menu, created = Menu.objects.get_or_create(
                    dining_venue=venue,
                    date=menu_date,
                    meal=meal_code,
                )

                # Atomically set the M2M relationship
                new_menu.menu_items.set(all_menu_items_for_this_menu)

                # --- NUTRITION SCRAPING & DIETARY CLASSIFICATION LOGIC ---
                # Loop through the items we just fetched
                for menu_item in all_menu_items_for_this_menu:
                    try:
                        # Scrape if the item is new OR if it has no nutrient info
                        has_nutrient_info = MenuItemNutrient.objects.filter(menu_item=menu_item).exists()
                        is_newly_created_item = menu_item.api_id not in existing_api_ids

                        if is_newly_created_item or not has_nutrient_info:
                            # Get the original API data for the link
                            item_data = api_id_to_data_map[menu_item.api_id]
                            link = item_data.get("link")

                            if link:
                                logger.info(
                                    f"Scraping nutrition for new/updated item: {menu_item.name} (ID: {menu_item.api_id})"
                                )
                                # Scrape the data from the item's link
                                nutrition_data = self._scrape_nutrition_data(link)

                                if nutrition_data:
                                    # Map the scraped data to the Nutrient model format
                                    mapped_nutrient_data = get_mapped_menu_item_nutrient_data(
                                        menu_item_id=menu_item.id, link_data=nutrition_data
                                    )

                                    # Save the nutrient data
                                    MenuItemNutrient.objects.update_or_create(
                                        menu_item=menu_item, defaults=mapped_nutrient_data["create_kwargs"]
                                    )

                                    # Update the main MenuItem with allergens/ingredients/dietary info
                                    updated_menu_item = False

                                    if "Allergens" in nutrition_data and nutrition_data["Allergens"]:
                                        menu_item.allergens = nutrition_data["Allergens"]
                                        updated_menu_item = True

                                    if "Ingredients" in nutrition_data and nutrition_data["Ingredients"]:
                                        menu_item.ingredients = nutrition_data["Ingredients"]
                                        updated_menu_item = True

                                    if "DietaryFlags" in nutrition_data and nutrition_data["DietaryFlags"]:
                                        menu_item.dietary_flags = nutrition_data["DietaryFlags"]
                                        updated_menu_item = True

                                    # Classify dietary restrictions
                                    dietary_classification = classify_dietary_restrictions(
                                        name=menu_item.name,
                                        description=menu_item.description,
                                        ingredients=menu_item.ingredients,
                                        allergens=menu_item.allergens,
                                        dietary_flags=nutrition_data.get("DietaryFlags", []),
                                    )

                                    menu_item.is_vegetarian = dietary_classification["is_vegetarian"]
                                    menu_item.is_vegan = dietary_classification["is_vegan"]
                                    menu_item.is_halal = dietary_classification["is_halal"]
                                    menu_item.is_kosher = dietary_classification["is_kosher"]
                                    updated_menu_item = True

                                    if updated_menu_item:
                                        menu_item.save(
                                            update_fields=[
                                                "allergens",
                                                "ingredients",
                                                "dietary_flags",
                                                "is_vegetarian",
                                                "is_vegan",
                                                "is_halal",
                                                "is_kosher",
                                            ]
                                        )
                                else:
                                    logger.warning(f"No nutrition data returned from scrape for {link}")
                    except Exception as e:
                        logger.error(
                            f"Error scraping/saving nutrition for {menu_item.name} (ID: {menu_item.api_id}): {e}"
                        )

                logger.info(
                    f"💾 CACHE SAVED: Synced {len(all_menu_items_for_this_menu)} items (created {items_created_count} new canonical items) for menu_id: {menu_id} at location_id: {location_id}"
                )

        except DiningVenue.DoesNotExist:
            # This case was handled before the API call, but good to have
            logger.warning(
                f"Could not cache menu for location_id {location_id} because the venue is not in the database."
            )
        except IntegrityError as e:
            # Catch specific integrity errors from the main transaction
            logger.error(f"Failed to cache menu items for menu_id {menu_id} due to DB constraint: {e}")
        except Exception as e:
            logger.error(f"Failed to cache menu for menu_id {menu_id}: {e}")
            # Do not block the response to the user if caching fails

        # Ensure we return the API data structure even if caching failed or API was empty
        # ** NOTE: The API data does NOT have the nutrition info we just scraped.

        try:
            # Re-fetch the data we just saved, this time with nutrition info
            # This call will now be a CACHE HIT and use our new serialization logic
            return self.get_menu(location_id, menu_id)
        except Exception:
            # Fallback to just returning what the API gave us
            return api_menu_data if api_menu_data else {"menus": []}

    def get_locations_with_menus(self, menu_id: str, category_ids=None) -> dict:
        if category_ids is None:
            category_ids = ["2", "3"]

        locations_api = LocationsAPI()
        combined = locations_api.get_all_category_locations(category_ids=category_ids, fmt="xml")
        locations_obj = combined.get("locations", {}) or {}
        locs = locations_obj.get("location", [])
        if not isinstance(locs, list):
            locs = [locs] if locs else []

        enriched = []
        for loc in locs:
            dbid = loc.get("dbid")
            try:
                # This call now benefits from the caching and nutrition logic
                menu = self.get_menu(location_id=dbid, menu_id=menu_id)
            except Exception as e:
                logger.error(f"Error fetching menu for dbid={dbid}, menu_id={menu_id}: {e}")
                menu = {}
            loc["menu"] = menu
            enriched.append(loc)

        return {menu_id: {"locations": {"location": enriched}}}


#################### Exposed endpoints #########################

# Using legacy class for backward compatibility
# New pure MenuAPI class is available above for future use
dining_api = MenuAPILegacy()


@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get dining menu."""
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")

        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        if USE_SAMPLE_MENUS:
            sample_data_path = os.path.join(os.path.dirname(__file__), "../archives/menus.json")

            try:
                with open(sample_data_path, "r") as f:
                    sample_menu_data = json.load(f)
            except Exception as e:
                return Response({"error": f"Failed to load sample menu file: {e}"}, status=500)
            if menu_id in sample_menu_data:
                logger.info(sample_menu_data[menu_id])
                return Response(sample_menu_data[menu_id])
            else:
                return Response({"error": f"No sample data found for menu_id: {menu_id}"}, status=44)

        # Live API call (which now includes caching, scraping, and serialization logic)
        menu = dining_api.get_menu(location_id, menu_id)
        return Response(menu)

    except Exception as e:
        logger.error(f"Error in get_dining_menu view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def scrape_nutrition_url(request):
    """
    Scrapes a nutrition URL and returns the data in the
    format expected by the NutritionLabelPage component.

    FIXED: This view now uses the central Scraper class.
    """
    url = request.GET.get("url")
    if not url:
        return Response({"error": "url parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. Use the scraper instance from the global dining_api
        soup = dining_api.scraper.get_html(link=url)
        if soup is None:
            return Response({"error": "Failed to fetch HTML from URL"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Get the structured data from the scraper
        scraped_data = dining_api.scraper.get_info(soup=soup)

        print(f"Scraped data: {scraped_data}")

        # 3. Adapt the scraper's output to the old, flat format this view expects

        # Helper to get 'Amount' from nested dicts
        def get_nested_amount(parent_key, child_key):
            return scraped_data.get(parent_key, {}).get(child_key, {}).get("Amount", "")

        # Helper to get 'Daily Value' (for vitamins)
        def get_nested_dv(parent_key, child_key):
            return scraped_data.get(parent_key, {}).get(child_key, {}).get("Daily Value", "")

        # Helper to get 'Amount' from flat dicts like "Cholesterol"
        def get_flat_amount(key):
            return scraped_data.get(key, {}).get("Amount", "")

        # Build the 'nutrition' dict
        nutrition = {
            "Total Fat": get_nested_amount("Fat", "Total Fat"),
            "Sat. Fat": get_nested_amount("Fat", "Saturated Fat"),  # Note: Key "Sat. Fat"
            "Trans Fat": get_nested_amount("Fat", "Trans Fat"),
            "Cholesterol": get_flat_amount("Cholesterol"),
            "Sodium": get_flat_amount("Sodium"),
            "Tot. Carb.": get_nested_amount("Carbohydrates", "Total Carbohydrates"),  # Note: Key "Tot. Carb."
            "Dietary Fiber": get_nested_amount("Carbohydrates", "Dietary Fiber"),
            "Sugars": get_nested_amount("Carbohydrates", "Sugar"),
            "Protein": get_flat_amount("Protein"),
        }

        # Build the 'micros' dict
        # Note: The old view had 'Vitamin D - mcg'. The new scraper just has 'Vitamin D'.
        # We will use the new scraper's keys for consistency.
        micros = {
            "Vitamin D": get_nested_dv("Vitamins", "Vitamin D"),
            "Potassium": get_nested_dv("Vitamins", "Potassium"),
            "Calcium": get_nested_dv("Vitamins", "Calcium"),
            "Iron": get_nested_dv("Vitamins", "Iron"),
        }

        # 4. Build the final response JSON
        data = {
            "title": scraped_data.get("Name", "Item"),
            "servingSize": scraped_data.get("Serving Size", ""),
            "calories": scraped_data.get("Calories", ""),
            "ingredients": ", ".join(scraped_data.get("Ingredients", [])),
            "allergens": ", ".join(scraped_data.get("Allergens", [])),
            "nutrition": nutrition,
            "micros": micros,
        }
        return Response(data)

    except Exception as e:
        logger.error(f"Error scraping nutrition URL {url}: {e}")
        return Response({"error": f"Failed to scrape URL: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def get_menu_item_details(request, menu_item_api_id):
    """
    Get all details for a menu item by its external API ID.

    Returns:
        - Basic item info (name, description, link)
        - Allergens and ingredients
        - Serving size
        - Dietary classifications (vegetarian, vegan, halal, kosher)
        - Full nutritional information
        - Ratings data
    """
    try:
        menu_item = MenuItem.objects.select_related("nutrient_info").get(api_id=menu_item_api_id)
    except MenuItem.DoesNotExist:
        return Response(
            {"error": f"Menu item with API ID {menu_item_api_id} not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error fetching menu item details for api_id {menu_item_api_id}: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    serializer = FullMenuItemSerializer(menu_item, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations_with_menus(request):
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        category_ids = request.GET.getlist("category_id", ["2", "3"])
        data = dining_api.get_locations_with_menus(menu_id=menu_id, category_ids=category_ids)
        return Response(data.get(menu_id, {"locations": {"location": []}}))
    except Exception as e:
        logger.error(f"Error in get_dining_locations_with_menus: {e}")
        return Response({"error": str(e)}, status=500)
