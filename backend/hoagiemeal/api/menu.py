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
from django.conf import settings
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
DEBUG = settings.DEBUG


#################### MenuAPI class for managing API communication #########################


class MenuAPI(StudentApp):
    """Handles API communication for dining menus and menu items."""

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

        logger.info(f"Fetched menu from API for location_id: {location_id}, menu_id: {menu_id}.")
        return [parse_menu_item(menu_item) for menu_item in menu]

    def get_menu_item(self, api_id: int) -> dict:
        """Fetch menu item from the API.

        Args:
            api_id (int): The API ID.

        Returns:
            dict: The menu item data.

        """
        logger.info(msg=f"Fetching menu item from API ID for api_id: {api_id}.")
        try:
            # Scrape API URL data from API URL using Scraper class
            api_url = f"https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort={api_id}"
            scraped_api_url_data = self.SCRAPER.scrape_api_url(api_url=api_url)  # type: ignore
            if not scraped_api_url_data:
                logger.error(f"No scraped API URL data found for api_url: {api_url}.")
                return {}

            # Parse scraped API URL data into desired format
            parsed_scraped_api_url_data = parse_scraped_api_url_data(scraped_api_url_data)
            menu_item = parsed_scraped_api_url_data
            menu_item["api_id"] = api_id
            menu_item["api_url"] = api_url
            return menu_item
        except Exception as e:
            logger.error(f"Error fetching menu item for api_id: {api_id}: {e}")
            return {}

    def get_menu_with_menu_items(self, location_id: str, menu_id: str) -> list:
        """Fetch menu with menu items from the API.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: Menu with menu items.

        """
        logger.info(f"Fetching menu with menu items from API for location_id: {location_id}, menu_id: {menu_id}.")

        # Fetch menu from API
        menu = self.get_menu(location_id, menu_id)
        if len(menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Get menu items from API
        menu_items_full = []
        for menu_item in menu:
            menu_item_full = self.get_menu_item(menu_item.get("api_id"))
            if not menu_item_full:
                logger.error(f"No menu item full data found for api_id: {menu_item.get('api_id')}.")
                continue
            menu_items_full.append(menu_item_full)

        logger.info(f"Fetched menu with menu items from API for location_id: {location_id}, menu_id: {menu_id}.")
        return menu_items_full

    def get_menus_with_menu_items_for_locations(self, menu_id: str) -> list:
        """Fetch menus with menu items for all locations from API.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menus with menu items.

        """
        logger.info(f"Fetching menus with menu items from API for all locations on menu_id: {menu_id}.")

        # Fetch locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return []

        for location in locations:
            location_id = location.get("database_id")
            menu = self.get_menu_with_menu_items(location_id, menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
                continue

            # Add menu to location
            location["menu"] = menu

        logger.info(f"Fetched menus with menu items from API for all locations on menu_id: {menu_id}.")
        return locations

    def get_menus_with_menu_items_for_locations_and_day(
        self, menu_date: datetime.date, meals: List[str] = ["Breakfast", "Lunch", "Dinner"]
    ) -> dict:
        """Fetch menus with menu items for all locations and meals from API.

        Args:
            menu_date (datetime.date): The menu date.
            meals (List[str]): The meals to get.

        Returns:
            dict: Dictionary of menus with menu items for all locations and meals from API.

        """
        logger.info(f"Fetching menus with menu items for all locations and meals from API on day: {menu_date}.")

        # Fetch locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for day: {menu_date}.")
            return {meal: [] for meal in meals}

        # Fetch menu for each meal
        menus = {meal: [] for meal in meals}
        for meal in meals:
            # Fetch menu with menu items from API for each location
            menu_id = f"{menu_date}-{meal}"
            meal_menus = self.get_menus_with_menu_items_for_locations(menu_id)
            if len(meal_menus) == 0:
                logger.error(f"No menus found for day: {menu_date}, meal: {meal}.")
                continue

            # Add meal menus to menus dictionary
            menus[meal] = meal_menus

        logger.info(f"Fetched menus with menu items from API for all locations and meals on day: {menu_date}.")
        return menus


#################### MenuCache class for managing database caching operations #########################


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    LOCATIONS_SERVICE = LocationsService()

    def get_cached_menu_with_menu_items(self, location_id: str, menu_id: str) -> list:
        """Get cached menu with menu items from database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of cached menu with menu items.

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

    def get_cached_menu_item(self, api_id: int) -> dict:
        """Get cached menu item from database.

        Args:
            api_id (int): The menu item API ID.

        Returns:
            dict: The cached menu item.

        """
        logger.info(f"Checking cache for menu item with api_id: {api_id}.")
        try:
            menu_item = MenuItem.objects.get(api_id=api_id)
            logger.info(f"Returning cached menu item for api_id: {api_id}.")
            return MenuItemSerializer(menu_item).data
        except Exception as e:
            logger.error(f"Error getting cached menu item for api_id: {api_id}: {e}")
            return {}

    def cache_menu_item(self, menu_item_data: dict) -> bool:
        """Cache menu item in the database.

        Args:
            menu_item_data (dict): The menu item data to cache.

        Returns:
            bool: True if menu item was cached successfully, False otherwise.

        """
        logger.info(f"Caching menu item for api_id: {menu_item_data.get('api_id')}.")

        # Check if menu item already exists in database
        if MenuItem.objects.filter(api_id=menu_item_data.get("api_id")).exists():
            logger.info(f"Menu item with api_id: {menu_item_data.get('api_id')} already exists in database.")
            return True

        # Create menu item instance
        try:
            with transaction.atomic():
                menu_item = MenuItem.objects.create(**menu_item_data)
                menu_item.save()
            logger.info(f"Cached menu item for api_id: {menu_item_data.get('api_id')}.")
            return True
        except Exception as e:
            logger.error(f"Error caching menu item for api_id: {menu_item_data.get('api_id')}: {e}")
            return False

    def cache_menu_with_menu_items(self, location_id: str, menu_id: str, menu_with_menu_items: list) -> bool:
        """Cache menu with menu items in the database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            menu_with_menu_items (list): Menu with menu items to cache.

        Returns:
            bool: True if menu with menu items was cached successfully, False otherwise.

        """
        logger.info(f"Caching menu with menu items for location_id: {location_id}, menu_id: {menu_id}.")

        # Make sure locations are cached
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error("No locations found, cannot cache menu with menu items.")
            return False

        # Parse menu ID into date and meal code
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return False

        # Cache menu items
        cached_menu_items = []
        for menu_item_data in menu_with_menu_items:
            cached_menu_item = self.get_cached_menu_item(menu_item_data.get("api_id"))
            if cached_menu_item:
                cached_menu_items.append(cached_menu_item)
            else:
                self.cache_menu_item(menu_item_data)
                cached_menu_item = self.get_cached_menu_item(menu_item_data.get("api_id"))
                if not cached_menu_item:
                    logger.error(f"Error caching menu item for api_id: {menu_item_data.get('api_id')}.")
                    continue
                cached_menu_items.append(cached_menu_item)

        # Create menu in database with all menu items
        try:
            dining_venue = DiningVenue.objects.get(database_id=location_id)
            with transaction.atomic():
                menu_obj, _ = Menu.objects.get_or_create(dining_venue=dining_venue, date=menu_date, meal=meal_code)
                menu_obj.menu_items.set(cached_menu_items)
            logger.info(
                f"Cached menu with {len(cached_menu_items)} menu items for location_id: {location_id}, menu_id: {menu_id}."
            )
        except Exception as e:
            logger.error(f"Error creating menu in database for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return False

        logger.info(f"Cached menu with menu items for location_id: {location_id}, menu_id: {menu_id}.")
        return True


#################### MenuService class for managing dining menus and menu items #########################


class MenuService:
    """Service for managing dining menus and menu items."""

    MENU_CACHE = MenuCache()
    MENU_API = MenuAPI()
    LOCATIONS_SERVICE = LocationsService()
    SCRAPER = Scraper()

    def get_or_cache_menu_with_menu_items(self, location_id: str, menu_id: str) -> list:
        """Get or cache a menu with menu items if it does not exist in the cache.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of menu with menu items.

        """
        logger.info(f"Getting or caching menu for location_id: {location_id}, menu_id: {menu_id}.")

        # Return cached menu if it exists
        cached_menu = self.MENU_CACHE.get_cached_menu_with_menu_items(location_id, menu_id)
        if len(cached_menu) > 0:
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            return cached_menu

        # Otherwise, fetch menu from API
        api_menu_with_menu_items = self.MENU_API.get_menu_with_menu_items(location_id, menu_id)
        if len(api_menu_with_menu_items) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        # Cache menu
        logger.info(f"Caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu = self.MENU_CACHE.cache_menu_with_menu_items(location_id, menu_id, api_menu_with_menu_items)
        if not cached_menu:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return api_menu_with_menu_items

        # Return cached menu
        logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
        return self.MENU_CACHE.get_cached_menu_with_menu_items(location_id, menu_id)

    def get_or_cache_menu_item(self, api_id: int) -> dict:
        """Get or cache a menu item.

        Args:
            api_id (int): The API ID.

        Returns:
            dict: The menu item.

        """
        logger.info(f"Getting or caching menu item for api_id: {api_id}.")

        # Get menu item from database
        cached_menu_item = self.MENU_CACHE.get_cached_menu_item(api_id)
        if cached_menu_item:
            logger.info(f"Returning cached menu item for api_id: {api_id}.")
            return cached_menu_item

        # Otherwise, fetch menu item from API
        api_menu_item = self.MENU_API.get_menu_item(api_id)
        if not api_menu_item:
            logger.error(f"No menu item found for api_id: {api_id}.")
            return {}

        # Cache menu item
        cached_menu_item = self.MENU_CACHE.cache_menu_item(api_menu_item)
        if not cached_menu_item:
            logger.error(f"Error caching menu item for api_id: {api_id}.")
            return api_menu_item

        # Return cached menu item
        logger.info(f"Returning cached menu item for api_id: {api_id}.")
        return self.MENU_CACHE.get_cached_menu_item(api_id)

    def get_or_cache_menus_with_menu_items_for_locations(self, menu_id: str) -> list:
        """Get or cache menus with menu items for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menus with menu items.

        """
        logger.info(f"Getting or caching menus with menu items for all locations for menu_id: {menu_id}.")

        # Get locations from API or cache
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return []

        # Get menus with menu items for each location
        locations_with_menu = []
        for location in locations:
            location_id = location.get("database_id")
            menu_with_menu_items = self.get_or_cache_menu_with_menu_items(location_id, menu_id)
            location["menu"] = menu_with_menu_items
            locations_with_menu.append(location)

        logger.info(f"Returning cached menus with menu items for all locations for menu_id: {menu_id}.")
        return locations_with_menu

    def get_or_cache_menus_with_menu_items_for_locations_and_day(self, menu_date: datetime.date) -> dict:
        """Get or cache menus with menu items for all locations and a given day.

        Args:
            menu_date (datetime.date): The menu date.

        Returns:
            dict: Dictionary of locations with menus with menu items for each meal on the given day.

        """
        logger.info(f"Getting or caching menus with menu items for all locations and day: {menu_date}.")

        # Get menus with menu items for each meal
        meals = ["Breakfast", "Lunch", "Dinner"]
        menus = {meal: [] for meal in meals}
        for meal in meals:
            menu_id = f"{menu_date}-{meal}"
            menu = self.get_or_cache_menus_with_menu_items_for_locations(menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for day: {menu_date}, meal: {meal}.")
                continue
            menus[meal] = menu

        logger.info(f"Returning cached menus with menu items for all locations and day: {menu_date}.")
        return menus


#################### Exposed endpoints #########################

menu_service = MenuService()


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menu_item(request):
    """Django view function to get or cache dining menu item.

    Args:
        request (Request): The HTTP request object.
        api_id (int): The API ID.

    Returns:
        Response: The HTTP response object.
        menu_item (dict): The menu item.

    """
    logger.info(f"Getting dining menu item for request: {request}")
    try:
        api_id = request.GET.get("api_id")
        if not api_id:
            return Response({"error": "api_id is required"}, status=400)

        menu_item = menu_service.get_or_cache_menu_item(api_id)
        logger.info(f"Returning dining menu item for api_id: {api_id}.")
        return Response({"data": menu_item, "message": "Dining menu item fetched successfully."}, status=200)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_item view: {e}")
        return Response({"message": f"Error fetching dining menu item: {str(e)}"}, status=500)


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menu_with_menu_items(request):
    """Django view function to get or cache dining menu with menu items.

    Args:
        request (Request): The HTTP request object.
        location_id (str): The location ID.
        menu_id (str): The menu ID.

    Returns:
        Response: The HTTP response object.
        menu (list): List of locations with menus with menu items.

    """
    logger.info(f"Getting dining menu with menu items for request: {request}")
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        menu = menu_service.get_or_cache_menu_with_menu_items(location_id, menu_id)
        logger.info(f"Returning dining menu with menu items for location_id: {location_id}, menu_id: {menu_id}.")
        return Response({"data": menu, "message": "Dining menu with menu items fetched successfully."}, status=200)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_items view: {e}")
        return Response({"message": f"Error fetching dining menu with menu items: {str(e)}"}, status=500)


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menus_with_menu_items_for_locations(request):
    """Django view function to get or cache dining menus with menu items for all locations.

    Args:
        request (Request): The HTTP request object.
        menu_id (str): The menu ID.

    Returns:
        Response: The HTTP response object.
        menus (list): List of locations with menus with menu items.

    """
    logger.info(f"Getting dining menus with menu items for all locations for request: {request}")
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        menus = menu_service.get_or_cache_menus_with_menu_items_for_locations(menu_id)
        logger.info(f"Returning dining menus with menu items for all locations for menu_id: {menu_id}.")
        return Response({"data": menus, "message": "Dining menus with menu items fetched successfully."}, status=200)
    except Exception as e:
        logger.error(f"Error in get_dining_menus_with_menu_items_for_locations view: {e}")
        return Response({"message": f"Error fetching dining menus with menu items: {str(e)}"}, status=500)


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menus_with_menu_items_for_locations_and_day(request):
    """Django view function to get or cache dining menus with menu items for all locations and a given day.

    Args:
        request (Request): The HTTP request object.
        menu_date (datetime.date): The menu date.

    Returns:
        Response: The HTTP response object.
        menus (list): List of locations with menus with menu items for each meal on the given day.

    """
    logger.info(f"Getting dining menus with menu items for all locations and day for request: {request}")
    try:
        menu_date = request.GET.get("menu_date")
        if not menu_date:
            return Response({"error": "menu_date is required"}, status=400)

        menus = menu_service.get_or_cache_menus_with_menu_items_for_locations_and_day(menu_date)
        logger.info(f"Returning dining menus with menu items for all locations and day: {menu_date}.")
        return Response({"data": menus, "message": "Dining menus with menu items fetched successfully."}, status=200)
    except Exception as e:
        logger.error(f"Error in get_dining_menus_with_menu_items_for_locations_and_day view: {e}")
        return Response({"message": f"Error fetching dining menus with menu items: {str(e)}"}, status=500)


@cache_page(60 * 5)
@api_view(["GET"])
def clear_dining_menus_cache(request):
    """Django view function to clear the database cache for dining_venues, dining menus, and menu items.

    Args:
        request (Request): The HTTP request object.

    Returns:
        Response: The HTTP response object.

    """
    logger.info(f"Clearing database cache for dining_venues, dining menus, and menu items for request: {request}")
    if not DEBUG:
        logger.info("Debug mode is disabled, cache not cleared.")
        return Response({"message": "Debug mode is disabled, cache not cleared."}, status=200)

    try:
        clear_menu_cache()
        logger.info("Database cache cleared successfully.")
        return Response({"message": "Database cache cleared successfully."}, status=200)
    except Exception as e:
        logger.error(f"Error in clear_dining_menus_cache view: {e}")
        return Response({"message": f"Error clearing database cache: {str(e)}"}, status=500)


#################### Utility functions for working with menu data #########################


def clear_menu_cache():
    """Clear the database cache for dining_venues, dining menus, and menu items.

    Returns:
        bool: True if database cache was cleared successfully, False otherwise.

    """
    logger.info("Clearing database cache for dining_venues, dining menus, and menu items.")
    try:
        with transaction.atomic():
            DiningVenue.objects.all().delete()
            Menu.objects.all().delete()
            MenuItem.objects.all().delete()
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
        "api_url": menu_item.get("link"),
        "name": menu_item.get("name"),
    }


def parse_scraped_api_url_data(scraped_api_url_data: dict) -> dict:
    """Parse scraped API URL data to a format that can be used to create a menu item instance.

    Args:
        scraped_api_url_data (dict): The scraped API URL data.

    Returns:
        dict: The parsed scraped API URL data.

    """
    serving_size = scraped_api_url_data.get("serving_size", {}).get("amount")
    serving_unit = scraped_api_url_data.get("serving_size", {}).get("unit")
    calories = scraped_api_url_data.get("calories", {}).get("amount")
    calories_from_fat = scraped_api_url_data.get("calories_from_fat", {}).get("amount")
    total_fat = scraped_api_url_data.get("total_fat", {}).get("amount")
    saturated_fat = scraped_api_url_data.get("saturated_fat", {}).get("amount")
    trans_fat = scraped_api_url_data.get("trans_fat", {}).get("amount")
    cholesterol = scraped_api_url_data.get("cholesterol", {}).get("amount")
    sodium = scraped_api_url_data.get("sodium", {}).get("amount")
    total_carbohydrates = scraped_api_url_data.get("total_carbohydrates", {}).get("amount")
    dietary_fiber = scraped_api_url_data.get("dietary_fiber", {}).get("amount")
    sugars = scraped_api_url_data.get("sugars", {}).get("amount")
    protein = scraped_api_url_data.get("protein", {}).get("amount")
    vitamin_d = scraped_api_url_data.get("vitamin_d", {}).get("dv")
    potassium = scraped_api_url_data.get("potassium", {}).get("dv")
    calcium = scraped_api_url_data.get("calcium", {}).get("dv")
    iron = scraped_api_url_data.get("iron", {}).get("dv")
    allergens = scraped_api_url_data.get("allergens", [])
    ingredients = scraped_api_url_data.get("ingredients", [])
    name = scraped_api_url_data.get("name")

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
        "name": name,
        "allergens": allergens,
        "ingredients": ingredients,
    }
