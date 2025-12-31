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
import datetime
import random
import hashlib
from typing import Optional, Tuple, List, Set

import msgspec.json as msj
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from rest_framework import status
from django.db import models, transaction

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.menu import MenuItem, Menu, MenuItemNutrient
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.serializers import (
    FullMenuItemSerializer,
    MenuItemSerializer,
    MenuItemNutrientSerializer,
)
from hoagiemeal.utils.scraper import Scraper
from hoagiemeal.api.locations import LocationsService
from hoagiemeal.data import (
    MEAT_KEYWORDS,
    DAIRY_EGG_HONEY_KEYWORDS,
    HIDDEN_ANIMAL_KEYWORDS,
    PORK_KEYWORDS,
    NON_KOSHER_SEAFOOD_KEYWORDS,
    ALCOHOL_KEYWORDS,
    SAMPLE_MENUS,
)

USE_SAMPLE_MENUS = True


class MenuAPI(StudentApp):
    """Handles API communication for dining menus and menu item nutrition information."""

    DINING_MENU = "/dining/menu"
    SCHEMAS = Schemas()
    SCRAPER = Scraper()
    LOCATIONS_SERVICE = LocationsService()

    def get_menu(self, location_id: str, menu_id: str) -> list:
        """Fetch menu from external API. Returns a list of menu items.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of menu items.

        """
        logger.info(f"Fetching menu from API for location_id: {location_id}, menu_id: {menu_id}.")

        # If API is down, use sample menus instead (mock API response)
        if USE_SAMPLE_MENUS:
            logger.info(f"Using sample menus for location_id: {location_id}, menu_id: {menu_id}.")
            key = f"{location_id}:{menu_id}".encode("utf-8")
            digest = hashlib.md5(key).hexdigest()
            index = int(digest, 16) % len(SAMPLE_MENUS)
            menu = SAMPLE_MENUS[index]
            return [parse_menu_item(menu_item) for menu_item in menu]

        # Otherwise, fetch menu from API
        params = {"locationID": location_id, "menuID": menu_id}
        response = self._make_request(self.DINING_MENU, params=params)
        menu = msj.decode(response)

        # API either returns a list or dictionary, must process both cases
        if not isinstance(menu, list) and not isinstance(menu, dict):
            logger.error(f"Invalid menu format for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        if isinstance(menu, dict):
            menu = menu.get("menus", [])

        # Parse API data into desired format
        logger.info(f"Fetched menu from API for location_id: {location_id}, menu_id: {menu_id}.")
        return [parse_menu_item(menu_item) for menu_item in menu]

    def get_menu_item_nutrition_info(self, api_url: str) -> dict:
        """Fetch nutrition information for a menu item from the API.

        Args:
            api_url (str): The API URL.

        Returns:
            dict: The nutrition information.

        """
        logger.info(msg=f"Fetching nutrition information from API URL for api_url: {api_url}.")
        try:
            # Scrape nutrition data from API URL using Scraper class
            scraped_nutrition_data = self.SCRAPER.scrape_api_url(api_url=api_url)  # type: ignore
            if not scraped_nutrition_data:
                logger.error(f"No nutrition data found for api_url: {api_url}.")
                return {}

            # Parse scraped nutrition data into desired format
            logger.info(f"Fetched nutrition data for api_url: {api_url}.")
            return parse_nutrition_data(scraped_nutrition_data)
        except Exception as e:
            logger.error(f"Error fetching nutrition information for api_url: {api_url}: {e}")
            return {}

    def get_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Fetch menu with nutrition information for each menu item from the API.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: Menu with nutrition information for each menu item.

        """
        logger.info(
            f"Fetching menu with nutrition information from API for location_id: {location_id}, menu_id: {menu_id}."
        )

        # Fetch menu from API
        menu = self.get_menu(location_id, menu_id)
        if len(menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Get nutrition information for each menu item
        for menu_item in menu:
            api_url = menu_item.get("link")
            parsed_nutrition_data = self.get_menu_item_nutrition_info(api_url)
            if len(parsed_nutrition_data) == 0:
                logger.error(f"No nutrition data found for api_url: {api_url}.")
                continue

            # Add nutrition information to menu item
            menu_item["nutrition"] = parsed_nutrition_data

        logger.info(
            f"Fetched menu with nutrition information from API for location_id: {location_id}, menu_id: {menu_id}."
        )
        return menu

    def get_menu_with_menu_item_nutrition_info_for_locations(self, menu_id: str) -> list:
        """Fetch menu with nutrition information for each menu item from the API for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menu with nutrition information for each menu item.

        """
        logger.info(f"Fetching menu with nutrition information from API for all locations for menu_id: {menu_id}.")

        # Fetch locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return []

        for location in locations:
            location_id = location.get("database_id")
            menu = self.get_menu_with_menu_item_nutrition_info(location_id, menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
                continue

            # Add menu to location
            location["menu"] = menu

        logger.info(f"Fetched menu with nutrition information from API for all locations for menu_id: {menu_id}.")
        return locations

    def get_menu_with_menu_item_nutrition_info_for_locations_and_day(
        self, menu_date: datetime.date, meals: List[str] = ["Breakfast", "Lunch", "Dinner"]
    ) -> dict:
        """Fetch menu with nutrition information for each menu item from the API for all locations and a given day.

        Args:
            menu_date (datetime.date): The menu date.
            meals (List[str]): The meals to get.

        Returns:
            dict: Dictionary of menu items with nutrition information for each meal at each location on the given day.

        """
        logger.info(f"Fetching menu with nutrition information from API for all locations and day: {menu_date}.")

        # Fetch locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for day: {menu_date}.")
            return {meal: [] for meal in meals}

        # Fetch menu for each meal
        menus = {meal: [] for meal in meals}
        for meal in meals:
            # Fetch menu with nutrition information from API for each location
            menu_id = f"{menu_date}-{meal}"
            menu = self.get_menu_with_menu_item_nutrition_info_for_locations(menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for day: {menu_date}, meal: {meal}.")
                continue

            # Add menu to meals dictionary
            menus[meal] = menu

        logger.info(f"Fetched menu with nutrition information from API for all locations and day: {menu_date}.")
        return menus


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    LOCATIONS_SERVICE = LocationsService()

    def get_cached_menu(self, location_id: str, menu_id: str) -> list:
        """Get cached menu from database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of cached menu items.

        """
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")

        # Parse menu ID into date and meal code
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return []

        # Get cached menu from database
        cached_menu = (
            Menu.objects.prefetch_related(models.Prefetch("menu_items", queryset=MenuItem.objects.all()))
            .filter(dining_venue__database_id=location_id, date=menu_date, meal=meal_code)
            .first()
        )
        if not cached_menu or len(cached_menu.menu_items.all()) == 0:
            logger.info(f"No cached menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
        return MenuItemSerializer(cached_menu.menu_items.all(), many=True).data

    def get_cached_menu_item_nutrition_info(self, menu_item_id: int) -> dict:
        """Get cached nutrition information for a menu item.

        Args:
            menu_item_id (int): The menu item ID.

        Returns:
            dict: The cached nutrition information.

        """
        logger.info(f"Checking cache for menu_item_id: {menu_item_id}.")

        # Get menu item nutrition information from database
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
            nutrient = MenuItemNutrient.objects.get(menu_item=menu_item)
        except Exception as e:
            logger.error(f"Error getting nutrition information for menu_item_id: {menu_item_id}: {e}")
            return {}

        logger.info(f"Returning cached nutrition information for menu_item_id: {menu_item_id}.")
        return MenuItemNutrientSerializer(nutrient).data

    def get_cached_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get cached menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of cached menu items with nutrition information.

        """
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")

        # Parse menu ID into date and meal code
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return []

        # Get cached menu with nutrition information from database
        cached_menu = (
            Menu.objects.prefetch_related(
                models.Prefetch("menu_items", queryset=MenuItem.objects.select_related("nutrition").all())
            )
            .filter(dining_venue__database_id=location_id, date=menu_date, meal=meal_code)
            .first()
        )
        if not cached_menu or len(cached_menu.menu_items.all()) == 0:
            logger.info(f"No cached menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Only return if all menu items have nutrition information
        for menu_item in cached_menu.menu_items.all():
            cached_menu_item_nutrition_info = self.get_cached_menu_item_nutrition_info(menu_item.id)
            if not cached_menu_item_nutrition_info:
                logger.error(f"No nutrition information found for menu_item: {menu_item.id}.")
                return []

        logger.info(
            f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )
        return FullMenuItemSerializer(cached_menu.menu_items.all(), many=True).data

    def cache_menu(self, location_id: str, menu_id: str, menu: list) -> bool:
        """Cache menu data in the database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            menu (list): Menu data to cache.

        Returns:
            bool: True if menu was cached successfully, False otherwise.

        """
        logger.info(f"Caching menu for location_id: {location_id}, menu_id: {menu_id}.")

        # Make sure locations are cached
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return False

        # Parse menu ID into date and meal code
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return False

        # If menu is empty, create empty menu in database
        if len(menu) == 0:
            logger.info(f"Caching empty menu for location_id: {location_id}, menu_id: {menu_id}.")
            try:
                with transaction.atomic():
                    menu_obj, _ = Menu.objects.get_or_create(
                        dining_venue__database_id=location_id, date=menu_date, meal=meal_code
                    )
                menu_obj.menu_items.set([])
                logger.info(f"Cached empty menu for location_id: {location_id}, menu_id: {menu_id}.")
                return True
            except Exception as e:
                logger.error(
                    f"Error creating empty menu in database for location_id: {location_id}, menu_id: {menu_id}: {e}"
                )
                return False

        # Extract API IDs from menu data
        menu_item_api_ids = [int(item.get("id")) for item in menu if item.get("id")]

        # Get existing menu item API IDs from database
        existing_api_ids = set(MenuItem.objects.filter(api_id__in=menu_item_api_ids).values_list("api_id", flat=True))

        # Create MenuItem objects for items that don't exist yet
        menu_items_to_create = [
            MenuItem(
                api_id=int(item.get("id")),
                name=item.get("name"),
                description=item.get("description"),
                link=item.get("link"),
            )
            for item in menu
            if item.get("id") and int(item.get("id")) not in existing_api_ids
        ]

        # Bulk-create new menu items if any
        if menu_items_to_create:
            try:
                MenuItem.objects.bulk_create(menu_items_to_create, ignore_conflicts=True)
                logger.info(f"Bulk-created {len(menu_items_to_create)} new menu items.")
            except Exception as e:
                logger.error(f"Error bulk-creating menu items for location_id: {location_id}, menu_id: {menu_id}: {e}")
                return False

        # Create menu in database with all menu items
        try:
            menu_items = MenuItem.objects.filter(api_id__in=menu_item_api_ids)
            with transaction.atomic():
                menu_obj, _ = Menu.objects.get_or_create(
                    dining_venue__database_id=location_id, date=menu_date, meal=meal_code
                )
                menu_obj.menu_items.set(menu_items)
        except Exception as e:
            logger.error(f"Error creating menu in database for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return False

        logger.info(
            f"Cached menu with {len(menu_items)} items (created {len(menu_items_to_create)} new) "
            f"for location_id: {location_id}, menu_id: {menu_id}."
        )
        return True

    def cache_menu_item_nutrition_info(
        self,
        menu_item_id: int,
        nutrition_data: dict,
    ) -> bool:
        """Cache nutrition information for a menu item and update associated MenuItem fields.

        Args:
            menu_item_id: The menu item ID.
            nutrition_data: Dictionary with fields already in Django model format.

        Returns:
            bool: True if nutrition information was cached successfully, False otherwise.

        """
        logger.info(f"Caching nutrition information for menu_item: {menu_item_id}.")
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
            with transaction.atomic():
                MenuItemNutrient.objects.get_or_create(menu_item=menu_item, **nutrition_data)
            logger.info(f"Cached nutrition information for menu_item: {menu_item_id}.")
            return True
        except Exception as e:
            logger.error(f"Error caching nutrition information for menu_item: {menu_item_id}: {e}")
            return False

    def cache_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str, menu: list) -> bool:
        """Cache menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.
            menu (list): The menu data with nutrition information for each menu item.

        Returns:
            bool: True if menu with nutrition information was cached successfully, False otherwise.

        """
        logger.info(f"Caching menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")

        # Cache menu with all menu items
        cached_menu = self.cache_menu(location_id, menu_id, menu)
        if not cached_menu:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return False

        # For each menu item, cache nutrition information (if not already cached)
        for menu_item_data in menu:
            nutrition_data = menu_item_data.get("nutrition")
            menu_item = MenuItem.objects.get(api_id=menu_item_data.get("id"))

            # Check if nutrition information is already cached
            cached_menu_item_nutrition_info = self.get_cached_menu_item_nutrition_info(menu_item.id)
            if cached_menu_item_nutrition_info:
                logger.info(f"Nutrition information already cached for menu_item: {menu_item.api_id}.")
                continue

            # Cache nutrition information for menu item
            cached_menu_item_nutrition_info = self.cache_menu_item_nutrition_info(menu_item.id, nutrition_data)
            if not cached_menu_item_nutrition_info:
                logger.error(f"Error caching menu item nutrition info for menu_item: {menu_item.api_id}.")
                return False

        logger.info(f"Cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        return True


class MenuService:
    """Service for managing dining menus and menu items."""

    MENU_CACHE = MenuCache()
    MENU_API = MenuAPI()
    LOCATIONS_SERVICE = LocationsService()
    SCRAPER = Scraper()

    def get_or_cache_menu(self, location_id: str, menu_id: str) -> list:
        """Get or cache a menu if it does not exist in the cache.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of menu items.

        """
        logger.info(f"Getting or caching menu for location_id: {location_id}, menu_id: {menu_id}.")

        # Return cached menu if it exists
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if len(cached_menu) > 0:
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            return cached_menu

        # Otherwise, fetch menu from API
        api_menu = self.MENU_API.get_menu(location_id, menu_id)
        if len(api_menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Cache menu
        logger.info(f"Caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu = self.MENU_CACHE.cache_menu(location_id, menu_id, api_menu)
        if not cached_menu:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return api_menu

        # Return cached menu
        logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
        return self.MENU_CACHE.get_cached_menu(location_id, menu_id)

    def get_or_cache_menu_item_nutrition_info(self, api_url: str) -> dict:
        """Get or cache nutrition information for a menu item.

        Args:
            api_url (str): The API URL.

        Returns:
            dict: The nutrition information.

        """
        logger.info(f"Getting or caching nutrition information for api_url: {api_url}.")

        # Get menu item from database
        menu_item_id = None
        try:
            menu_item = MenuItem.objects.get(link=api_url)
            menu_item_id = menu_item.id
        except Exception as e:
            logger.error(f"Error getting menu item for api_url: {api_url}: {e}")
            return {}

        # Return cached nutrition information if it exists
        cached_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_item_nutrition_info(menu_item_id)
        if cached_menu_item_nutrition_info:
            logger.info(f"Returning cached nutrition information for menu_item: {menu_item_id}.")
            return cached_menu_item_nutrition_info

        # Otherwise, fetch nutrition information from API
        nutrition_data = self.MENU_API.get_menu_item_nutrition_info(api_url)
        if len(nutrition_data) == 0:
            logger.error(f"No nutrition data found for api_url: {api_url}.")
            return {}

        # Cache nutrition information
        cached_menu_item_nutrition_info = self.MENU_CACHE.cache_menu_item_nutrition_info(menu_item_id, nutrition_data)
        if not cached_menu_item_nutrition_info:
            logger.error(f"Error caching nutrition information for menu_item: {menu_item_id}.")
            return nutrition_data

        # Return cached nutrition information
        logger.info(f"Returning cached nutrition information for menu_item: {menu_item_id}.")
        return self.MENU_CACHE.get_cached_menu_item_nutrition_info(menu_item_id)

    def get_or_cache_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get or cache menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of menu items with nutrition information.

        """
        logger.info(
            f"Getting or caching menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )

        # Return cached menu with nutrition information if it exists
        cached_menu_with_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        if len(cached_menu_with_menu_item_nutrition_info) > 0:
            logger.info(
                f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
            )
            return cached_menu_with_menu_item_nutrition_info

        # Otherwise, fetch menu from API
        api_menu_with_nutrition_info = self.MENU_API.get_menu_with_menu_item_nutrition_info(location_id, menu_id)
        if len(api_menu_with_nutrition_info) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Cache menu
        cached_menu = self.MENU_CACHE.cache_menu_with_menu_item_nutrition_info(
            location_id, menu_id, api_menu_with_nutrition_info
        )
        if not cached_menu:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return api_menu_with_nutrition_info

        # Return cached menu with nutrition information
        logger.info(
            f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )
        return self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(location_id, menu_id)

    def get_or_cache_menu_with_menu_item_nutrition_info_for_locations(self, menu_id: str) -> list:
        """Get or cache menu with nutrition information for each menu item for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menu with nutrition information for each menu item.

        """
        logger.info(f"Getting or caching menu with nutrition information for all locations for menu_id: {menu_id}.")

        # Get locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return []

        # Get menu with nutrition information for each location
        locations_with_menu = []
        for location in locations:
            location_id = location.get("database_id")
            menu_with_menu_item_nutrition_info = self.get_or_cache_menu_with_menu_item_nutrition_info(
                location_id, menu_id
            )
            location["menu"] = menu_with_menu_item_nutrition_info
            locations_with_menu.append(location)

        logger.info(f"Returning cached menu with nutrition information for all locations for menu_id: {menu_id}.")
        return locations_with_menu

    def get_or_cache_menu_with_menu_item_nutrition_info_for_locations_and_day(
        self, menu_date: datetime.date, meals: List[str] = ["Breakfast", "Lunch", "Dinner"]
    ) -> dict:
        """Get or cache menu with nutrition information for each menu item for all locations and a given day.

        Args:
            menu_date (datetime.date): The menu date.
            meals (List[str]): The meals to get.

        Returns:
            dict: Dictionary of menu items with nutrition information for each meal at each location on the given day.
        """
        logger.info(f"Getting or caching menu with nutrition information for all locations and day: {menu_date}.")

        # Get locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for day: {menu_date}.")
            return {meal: [] for meal in meals}

        # Get menu with nutrition information for each location and meal
        menus = {meal: [] for meal in meals}
        for meal in meals:
            menu_id = f"{menu_date}-{meal}"
            menu = self.get_or_cache_menu_with_menu_item_nutrition_info_for_locations(menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for day: {menu_date}, meal: {meal}.")
                continue
            menus[meal] = menu

        logger.info(f"Returning cached menu with nutrition information for all locations and day: {menu_date}.")
        return menus


#################### Exposed endpoints #########################

menu_service = MenuService()


@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get or cache dining menu.

    Args:
        request (Request): The HTTP request object.

    Returns:
        Response: The HTTP response object.
        menu (list): List of menu items.

    """
    logger.info(f"Getting dining menu for request: {request}")
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        menu = menu_service.get_or_cache_menu(location_id, menu_id)
        logger.info(f"Returning dining menu for location_id: {location_id}, menu_id: {menu_id}.")
        return Response(menu)
    except Exception as e:
        logger.error(f"Error in get_dining_menu view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_item_nutrition_info(request):
    """Django view function to get or cache dining menu item nutrition information.

    Args:
        request (Request): The HTTP request object.
        api_url (str): The API URL.

    Returns:
        Response: The HTTP response object.
        menu_item_nutrition_info (dict): The nutrition information for the menu item.

    """
    logger.info(f"Getting dining menu item nutrition information for request: {request}")
    try:
        api_url = request.GET.get("api_url")
        if not api_url:
            return Response({"error": "api_url is required"}, status=400)

        menu_item_nutrition_info = menu_service.get_or_cache_menu_item_nutrition_info(api_url)
        logger.info(f"Returning dining menu item nutrition information for api_url: {api_url}.")
        return Response(menu_item_nutrition_info)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_item_nutrition_info view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_with_menu_item_nutrition_info(request):
    """Django view function to get or cache dining menu with nutrition information for each menu item.

    Args:
        request (Request): The HTTP request object.

    Returns:
        Response: The HTTP response object.
        menu_with_menu_item_nutrition_info (list): List of menu items with nutrition information.

    """
    logger.info(f"Getting dining menu with nutrition information for each menu item for request: {request}")
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        menu_with_menu_item_nutrition_info = menu_service.get_or_cache_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        logger.info(
            f"Returning dining menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )
        return Response(menu_with_menu_item_nutrition_info)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_item_nutrition_info view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_with_menu_item_nutrition_info_for_locations(request):
    """Django view function to get or cache dining menu with nutrition information for each menu item for all locations.

    Args:
        request (Request): The HTTP request object.

    Returns:
        Response: The HTTP response object.
        menu_with_menu_item_nutrition_info (list): List of locations with menu with nutrition information for each menu item.

    """
    logger.info(
        f"Getting dining menu with nutrition information for each menu item for all locations for request: {request}"
    )
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        menu_with_menu_item_nutrition_info = (
            menu_service.get_or_cache_menu_with_menu_item_nutrition_info_for_locations(menu_id)
        )
        logger.info(f"Returning dining menu with nutrition information for all locations for menu_id: {menu_id}.")
        return Response(menu_with_menu_item_nutrition_info)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_item_nutrition_info_for_locations view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_with_menu_item_nutrition_info_for_locations_and_day(request):
    """Django view function to get or cache dining menu with nutrition information for each menu item for all locations and a given day.

    Args:
        request (Request): The HTTP request object.
        menu_date (datetime.date): The menu date.

    Returns:
        Response: The HTTP response object.
        menu_with_menu_item_nutrition_info (dict): Dictionary of menu items with nutrition information for each meal at each location on the given day.

    """
    logger.info(
        f"Getting or caching dining menu with nutrition information for all locations and day for request: {request}"
    )
    try:
        menu_date = request.GET.get("menu_date")
        meals = request.GET.getlist("meal", ["Breakfast", "Lunch", "Dinner"])
        if not menu_date or not meals:
            return Response({"error": "menu_date and meals are required"}, status=400)

        menu_with_menu_item_nutrition_info = (
            menu_service.get_or_cache_menu_with_menu_item_nutrition_info_for_locations_and_day(menu_date, meals)
        )
        logger.info(f"Returning dining menu with nutrition information for all locations and day: {menu_date}.")
        return Response(menu_with_menu_item_nutrition_info)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_item_nutrition_info_for_locations_and_day view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def clear_cache(request):
    """Django view function to clear the database cache for dining_venues, dining menus, menu items, and menu item nutrients.

    Args:
        request (Request): The HTTP request object.

    """
    logger.info(
        f"Clearing database cache for dining_venues, dining menus, menu items, and menu item nutrients for request: {request}"
    )
    try:
        clear_database_cache()
        logger.info("Database cache cleared successfully.")
        return Response({"message": "Database cache cleared successfully."})
    except Exception as e:
        logger.error(f"Error in clear_database_cache view: {e}")
        return Response({"error": str(e)}, status=500)


#################### Utility functions for working with menu data #########################


def clear_database_cache():
    """Clear the database cache for dining_venues, dining menus, menu items, and menu item nutrients.

    Returns:
        bool: True if database cache was cleared successfully, False otherwise.

    """
    logger.info("Clearing database cache for dining_venues, dining menus, menu items, and menu item nutrients.")
    try:
        DiningVenue.objects.all().delete()
        Menu.objects.all().delete()
        MenuItem.objects.all().delete()
        MenuItemNutrient.objects.all().delete()
    except Exception as e:
        logger.error(f"Error clearing database cache: {e}")
        return False
    return True


def parse_menu_id(menu_id: str) -> Tuple[Optional[datetime.date], Optional[str]]:
    """Parse menu_id into date and meal code.

    Args:
        menu_id (str): The menu ID.

    Returns:
        Tuple[Optional[datetime.date], Optional[str]]: The date and meal code.

    """
    try:
        MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}
        date_str, meal_type = menu_id.rsplit("-", 1)
        menu_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        meal_code = MEAL_TYPE_MAP[meal_type]
        return menu_date, meal_code
    except ValueError as e:
        logger.error(f"Error parsing menu_id: {menu_id}: {e}")
        return None, None


def classify_by_dietary_flags(ingredients: List[str], allergens: List[str], name: str) -> List[str]:
    """Classify dietary flags for a menu item.

    Args:
        ingredients: The ingredients of the menu item.
        allergens: The allergens of the menu item.
        name: The name of the menu item.

    Returns:
        A list of dietary flags.

    """
    logger.info(f"Classifying dietary flags for ingredients: {ingredients}, allergens: {allergens}, name: {name}.")

    # Extracts tokens from text
    def get_tokens(text: str) -> Set[str]:
        """Tokenize and normalize text into searchable terms."""
        if not text:
            return set()
        text = text.lower().replace(",", " ").replace("(", " ").replace(")", " ").replace(":", " ")
        return {t.strip() for t in text.split() if len(t.strip()) > 1}

    # Checks if any keyword matches directly or as a substring
    def contains(tokens: Set[str], keywords: Set[str]) -> bool:
        """Check if any keyword matches directly or as a substring."""
        for token in tokens:
            if token in keywords:
                return True
            for keyword in keywords:
                if keyword in token:
                    return True
        return False

    # Extracts tokens from ingredients and allergens
    structured_tokens = set()
    for ing in ingredients:
        structured_tokens.update(get_tokens(ing))
    for allergen in allergens:
        structured_tokens.update(get_tokens(allergen))

    combined_text = f"{name or ''}".lower()
    text_tokens = get_tokens(combined_text)

    # Checks for explicit labels
    explicit = {
        "vegan": "(vg)" in combined_text or "vegan" in combined_text,
        "vegetarian": "(v)" in combined_text or "vegetarian" in combined_text,
        "halal": "(h)" in combined_text or "halal" in combined_text,
        "kosher": "(k)" in combined_text or "kosher" in combined_text,
    }

    # Checks for keywords
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

    # Assigns flags based on explicit labels and keywords
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

    # Removes duplicate flags
    final_flags = list(set(flags))
    return final_flags


def parse_menu_item(menu_item: dict) -> dict:
    """Parse menu item to a format that can be used to create a menu item instance.

    Args:
        menu_item (dict): The menu item data.

    Returns:
        dict: The parsed menu item.

    """
    return {
        "api_id": int(menu_item.get("id")),  # type: ignore
        "name": menu_item.get("name"),
        "description": menu_item.get("description"),
        "link": menu_item.get("link"),
    }


def parse_nutrition_data(nutrition_data: dict) -> dict:
    """Parse nutrition data to a format that can be used to create a menu item nutrient instance.

    Args:
        nutrition_data (dict): The nutrition data.

    Returns:
        dict: The parsed nutrition data.

    """
    name = nutrition_data.get("name")
    serving_size = nutrition_data.get("serving_size", {}).get("amount")
    serving_unit = nutrition_data.get("serving_size", {}).get("unit")
    calories = nutrition_data.get("calories", {}).get("amount")
    calories_from_fat = nutrition_data.get("calories_from_fat", {}).get("amount")
    total_fat = nutrition_data.get("total_fat", {}).get("amount")
    saturated_fat = nutrition_data.get("saturated_fat", {}).get("amount")
    trans_fat = nutrition_data.get("trans_fat", {}).get("amount")
    cholesterol = nutrition_data.get("cholesterol", {}).get("amount")
    sodium = nutrition_data.get("sodium", {}).get("amount")
    total_carbohydrates = nutrition_data.get("total_carbohydrates", {}).get("amount")
    dietary_fiber = nutrition_data.get("dietary_fiber", {}).get("amount")
    sugars = nutrition_data.get("sugars", {}).get("amount")
    protein = nutrition_data.get("protein", {}).get("amount")
    vitamin_d = nutrition_data.get("vitamin_d", {}).get("dv")
    potassium = nutrition_data.get("potassium", {}).get("dv")
    calcium = nutrition_data.get("calcium", {}).get("dv")
    iron = nutrition_data.get("iron", {}).get("dv")
    allergens = nutrition_data.get("allergens", [])
    ingredients = nutrition_data.get("ingredients", [])
    dietary_flags = classify_by_dietary_flags(ingredients=ingredients, allergens=allergens, name=name)  # type: ignore

    return {
        "serving_size": serving_size,
        "serving_unit": serving_unit,
        "calories": calories,
        "calories_from_fat": calories_from_fat,
        "total_fat": total_fat,
        "saturated_fat": saturated_fat,
        "trans_fat": trans_fat,
        "cholesterol": cholesterol,
        "sodium": sodium,
        "total_carbohydrates": total_carbohydrates,
        "dietary_fiber": dietary_fiber,
        "sugars": sugars,
        "protein": protein,
        "vitamin_d": vitamin_d,
        "potassium": potassium,
        "calcium": calcium,
        "iron": iron,
        "allergens": allergens,
        "ingredients": ingredients,
        "dietary_flags": dietary_flags,
    }
