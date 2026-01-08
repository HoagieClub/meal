"""API manager class for the /dining/menu endpoints from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/menus

and manages the caching of menu items and menus in the database.

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
from typing import Any, Optional, Tuple, List, Set

import msgspec.json as msj
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from rest_framework import status
from django.db import models, transaction

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.menu import MenuItem, Menu, MenuItemNutrition
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.serializers import (
    MenuItemSerializer,
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
DISABLE_CACHE = False


#################### MenuAPI class for managing API communication #########################


class MenuAPI(StudentApp):
    """Handles API communication for dining menus and menu items."""

    DINING_MENU = "/dining/menu"
    SCHEMAS = Schemas()
    SCRAPER = Scraper()
    LOCATIONS_SERVICE = LocationsService()

    def get_menu_item(self, api_id: int) -> Optional[dict]:
        """Fetch menu item from the API.

        Args:
            api_id (int): The API ID.

        Returns:
            dict: The menu item data.

        """
        logger.info(msg=f"Fetching menu item from API for api_id: {api_id}.")
        try:
            # Scrape API URL data from API URL using Scraper class
            api_url = f"https://menus.princeton.edu/dining/_Foodpro/online-menu/label.asp?RecNumAndPort={api_id}"
            scraped_api_url_data = self.SCRAPER.scrape_api_url(api_url=api_url)  # type: ignore
            if not scraped_api_url_data:
                logger.error(f"No scraped API URL data found for api_url: {api_url}.")
                return None

            # Parse scraped API URL data into desired format and add extra fields
            parsed_scraped_api_url_data = parse_scraped_api_url_data(scraped_api_url_data)
            if not parsed_scraped_api_url_data:
                logger.error(f"No parsed scraped API URL data found for api_url: {api_url}.")
                return None

            menu_item = parsed_scraped_api_url_data
            menu_item["api_id"] = api_id
            menu_item["api_url"] = api_url
            menu_item["dietary_flags"] = classify_by_dietary_flags(
                ingredients=menu_item.get("ingredients", []),
                allergens=menu_item.get("allergens", []),
                name=menu_item.get("name", ""),
            )

            logger.info(f"Fetched menu item for api_id: {api_id}.")
            return menu_item
        except Exception as e:
            logger.error(f"Error fetching menu item for api_id: {api_id}: {e} in get_menu_item.")
            return None

    def get_menu_items(self, api_ids: List[int]) -> Optional[dict]:
        """Fetch menu items from the API.

        Args:
            api_ids (List[int]): The API IDs.

        Returns:
            dict: Dictionary of menu items by API ID.

        """
        logger.info(f"Fetching menu items from API for api_ids: {api_ids}.")
        try:
            # Fetch menu for each API ID, append to dictionary
            menu_items = {}
            for api_id in api_ids:
                menu_item = self.get_menu_item(api_id)
                if not menu_item:
                    logger.error(f"No menu item found for api_id: {api_id}.")
                    menu_items[api_id] = None
                menu_items[api_id] = menu_item

            menu_items_length = len(list(menu_items.keys()))
            logger.info(f"Fetched {menu_items_length} menu items from API for api_ids: {api_ids}.")
            return menu_items
        except Exception as e:
            logger.error(f"Error fetching menu items for api_ids: {api_ids}: {e} in get_menu_items.")
            return None

    def get_menu(self, location_id: int, menu_id: str) -> Optional[list]:
        """Fetch menu from API. Returns a list of API IDs.

        Args:
            location_id (int): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of API IDs.

        """
        logger.info(f"Fetching menu from API for location_id: {location_id}, menu_id: {menu_id}.")
        try:
            # If API is down, use sample menus instead (mock API response)
            if USE_SAMPLE_MENUS:
                logger.info(f"Using sample menus for location_id: {location_id}, menu_id: {menu_id}.")
                key = f"{location_id}:{menu_id}".encode("utf-8")
                digest = hashlib.md5(key).hexdigest()
                index = int(digest, 16) % len(SAMPLE_MENUS)
                menu = SAMPLE_MENUS[index]
                return [int(menu_item.get("id")) for menu_item in menu]  # type: ignore

            # Otherwise, fetch menu from API
            params = {"locationID": str(location_id), "menuID": menu_id}
            response = self._make_request(self.DINING_MENU, params=params)
            menu = msj.decode(response)

            # API either returns a list or dictionary, must process both cases
            if not isinstance(menu, list) and not isinstance(menu, dict):
                logger.error(f"Invalid menu format for location_id: {location_id}, menu_id: {menu_id}.")
                return None
            if isinstance(menu, dict):
                menu = menu.get("menus", [])

            # Extract API IDs from menu and return as list
            logger.info(f"Fetched menu from API for location_id: {location_id}, menu_id: {menu_id}.")
            api_ids = [int(menu_item.get("id")) for menu_item in menu]
            return api_ids
        except Exception as e:
            logger.error(f"Error fetching menu for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return None


#################### MenuCache class for managing database caching operations #########################


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    LOCATIONS_SERVICE = LocationsService()

    def get_cached_menu(self, location_id: int, menu_id: str) -> Optional[list]:
        """Get cached menu from database.

        Args:
            location_id (int): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of API IDs.

        """
        logger.info(f"Getting cached menu for location_id: {location_id}, menu_id: {menu_id}.")
        try:
            # Parse menu ID into date and meal code
            menu_date, meal_code = parse_menu_id(menu_id)
            if not menu_date or not meal_code:
                logger.error(f"Invalid menu_id: {menu_id}.")
                return None

            # Get cached menu from the location and menu
            cached_menu = Menu.objects.filter(
                dining_venue__database_id=location_id, date=menu_date, meal=meal_code
            ).first()
            if not cached_menu:
                logger.info(f"No cached menu for location_id: {location_id}, menu_id: {menu_id}.")
                return None

            # Extract API IDs from cached menu
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            api_ids = [menu_item.api_id for menu_item in cached_menu.menu_items.all()]
            return api_ids
        except Exception as e:
            logger.error(
                f"Error getting cached menu for location_id: {location_id}, menu_id: {menu_id}: {e} in get_cached_menu."
            )
            return None

    def get_cached_menu_item(self, api_id: int) -> Optional[dict]:
        """Get cached menu item from database.

        Args:
            api_id (int): The menu item API ID.

        Returns:
            dict: The cached menu item.

        """
        logger.info(f"Getting cached menu item for api_id: {api_id}.")
        try:
            # Get cached menu item from database
            try:
                cached_menu_item = MenuItem.objects.get(api_id=api_id)
            except MenuItem.DoesNotExist:
                logger.info(f"No cached menu item found for api_id: {api_id}.")
                return None

            # Serialize and return cached menu item
            logger.info(f"Returning cached menu item for api_id: {api_id}.")
            return MenuItemSerializer(cached_menu_item).data
        except Exception as e:
            logger.error(f"Error getting cached menu item for api_id: {api_id}: {e} in get_cached_menu_item.")
            return None

    def get_cached_menu_items(self, api_ids: List[int]) -> Optional[dict]:
        """Get cached menu items from database.

        Args:
            api_ids (List[int]): The API IDs.

        Returns:
            dict: Dictionary of cached menu items by API ID.

        """
        logger.info(f"Getting cached menu items for api_ids: {api_ids}.")
        try:
            # Get cached menu items from database
            cached_menu_items = MenuItem.objects.filter(api_id__in=api_ids)
            if not cached_menu_items:
                logger.info(f"No cached menu items found for api_ids: {api_ids}.")
                return None

            # Convert to dictionary of API IDs to menu items
            logger.info(f"Returning cached menu items for api_ids: {api_ids}.")
            cached_menu_items_dict = {
                cached_menu_item.api_id: MenuItemSerializer(cached_menu_item).data
                for cached_menu_item in cached_menu_items
            }
            return cached_menu_items_dict
        except Exception as e:
            logger.error(f"Error getting cached menu items for api_ids: {api_ids}: {e} in get_cached_menu_items.")
            return None

    def cache_menu_items(self, menu_items_data: dict) -> bool:
        """Cache menu items in the database.

        Args:
            menu_items_data (dict): The dictionary of menu items data by API ID.

        Returns:
            bool: True if menu items were cached successfully, False otherwise.

        """
        logger.info(f"Caching menu items for api_ids: {menu_items_data.keys()}.")
        try:
            # Cache new menu items
            with transaction.atomic():
                for api_id in menu_items_data.keys():
                    # Cache error menu item if no menu item data found
                    if not menu_items_data[api_id]:
                        logger.error(f"No menu item data found for api_id: {api_id}, caching error menu item.")
                        cached_error_menu_item = self.cache_error_menu_item(api_id)
                        if not cached_error_menu_item:
                            raise Exception(f"Error caching error menu item for api_id: {api_id}.")

                    # Cache menu item if menu item data found
                    else:
                        cached_menu_item = self.cache_menu_item(menu_items_data[api_id])
                        if not cached_menu_item:
                            raise Exception(f"Error caching menu item for api_id: {api_id}.")

            logger.info(f"Cached menu items for api_ids: {menu_items_data.keys()}.")
            return True
        except Exception as e:
            logger.error(
                f"Error caching menu items for api_ids: {menu_items_data.keys()}: {e} in cache_menu_items in cache_menu_items."
            )
            return False

    def cache_error_menu_item(self, api_id: int) -> bool:
        """Cache error menu item in the database.

        Args:
            api_id (int): The API ID.

        Returns:
            bool: True if error menu item was cached successfully, False otherwise.

        """
        logger.info(f"Caching error menu item for api_id: {api_id}.")
        try:
            with transaction.atomic():
                # Create menu item instance without any fields but the API ID
                MenuItem.objects.get_or_create(api_id=api_id)
                return True
        except Exception as e:
            logger.error(f"Error caching error menu item for api_id: {api_id}: {e} in cache_error_menu_item.")
            return False

    def cache_menu_item(self, menu_item_data: dict) -> bool:
        """Cache menu item in the database.

        Args:
            menu_item_data (dict): The menu item data to cache.

        Returns:
            bool: True if menu item was cached successfully, False otherwise.

        """
        api_id = menu_item_data.get("api_id")
        logger.info(f"Caching menu item for api_id: {api_id}.")
        try:
            with transaction.atomic():
                # Create menu item instance
                menu_item_without_nutrition = {
                    key: value for key, value in menu_item_data.items() if key != "nutrition"
                }
                menu_item = MenuItem.objects.get_or_create(**menu_item_without_nutrition)

                # Create menu item nutrition instance
                nutrition_data = menu_item_data.get("nutrition")
                MenuItemNutrition.objects.get_or_create(menu_item=menu_item, **nutrition_data)  # type: ignore

            logger.info(f"Cached menu item for api_id: {api_id}.")
            return True
        except Exception as e:
            logger.error(f"Error caching menu item for api_id: {api_id}: {e} in cache_menu_item.")
            return False

    def cache_menu(self, location_id: int, menu_id: str, menu: list) -> bool:
        """Cache menu in the database.

        NOTE: This method assumes that the menu items have already been cached.

        Args:
            location_id (int): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            menu (list): The list of API IDs.

        Returns:
            bool: True if menu was cached successfully, False otherwise.

        """
        logger.info(f"Caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        try:
            # Parse menu ID into date and meal code
            menu_date, meal_code = parse_menu_id(menu_id)
            if not menu_date or not meal_code:
                logger.error(f"Invalid menu_id: {menu_id}.")
                return False

            # Create menu in database
            with transaction.atomic():
                # Get dining venue and create menu instance
                dining_venue = DiningVenue.objects.get(database_id=location_id)
                menu_obj, _ = Menu.objects.get_or_create(dining_venue=dining_venue, date=menu_date, meal=meal_code)

                # Get menu items and set them to the menu
                menu_items = MenuItem.objects.filter(api_id__in=menu)
                menu_obj.menu_items.set(menu_items)
                menu_obj.save()

            logger.info(f"Cached menu with {len(menu)} menu items for location_id: {location_id}, menu_id: {menu_id}.")
            return True
        except Exception as e:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}: {e} in cache_menu.")
            return False


#################### MenuService class for managing dining menus and menu items #########################


class MenuService:
    """Service for managing dining menus and menu items."""

    MENU_CACHE = MenuCache()
    MENU_API = MenuAPI()
    LOCATIONS_SERVICE = LocationsService()
    SCRAPER = Scraper()

    def get_or_cache_menu_item(self, api_id: int) -> Optional[dict]:
        """Get or cache a menu item.

        Args:
            api_id (int): The API ID.

        Returns:
            dict: The menu item.

        """
        logger.info(f"Getting or caching menu item for api_id: {api_id}.")
        try:
            # Get menu item from database
            cached_menu_item = self.MENU_CACHE.get_cached_menu_item(api_id)
            if cached_menu_item:
                logger.info(f"Returning cached menu item for api_id: {api_id}.")
                return cached_menu_item

            # Otherwise, fetch menu item from API
            api_menu_item = self.MENU_API.get_menu_item(api_id)
            if not api_menu_item:
                logger.error(f"No menu item found for api_id: {api_id}.")
                return None

            # If cache is disabled, return API menu item
            if DISABLE_CACHE:
                logger.info(f"Cache is disabled, returning API menu item for api_id: {api_id}.")
                return api_menu_item

            # Cache menu item
            cached_menu_item = self.MENU_CACHE.cache_menu_item(api_menu_item)
            if not cached_menu_item:
                logger.error(f"Error caching menu item for api_id: {api_id}.")
                return None

            # Return cached menu item
            logger.info(f"Returning cached menu item for api_id: {api_id}.")
            return self.MENU_CACHE.get_cached_menu_item(api_id)
        except Exception as e:
            logger.error(f"Error getting or caching menu item for api_id: {api_id}: {e} in get_or_cache_menu_item.")
            return None

    def get_or_cache_menu_items(self, api_ids: List[int]) -> Optional[dict]:
        """Get or cache menu items.

        Args:
            api_ids (List[int]): The API IDs.

        Returns:
            dict: Dictionary of menu items by API ID.

        """
        logger.info(f"Getting or caching menu items for api_ids: {api_ids}.")
        try:
            # Get menu items from database
            cached_menu_items = self.MENU_CACHE.get_cached_menu_items(api_ids)

            # Get found API IDs and missing API IDs
            found_api_ids = list(cached_menu_items.keys()) if cached_menu_items else []
            missing_api_ids = list(set(api_ids) - set(found_api_ids))
            if not missing_api_ids:
                logger.info(f"Returning cached menu items for api_ids: {api_ids}.")
                return cached_menu_items

            # Otherwise, fetch menu items from API
            api_menu_items = self.MENU_API.get_menu_items(missing_api_ids)
            if not api_menu_items:
                logger.error(f"No menu items found for api_ids: {missing_api_ids}.")
                return None

            # If cache is disabled, return API menu items
            if DISABLE_CACHE:
                logger.info(f"Cache is disabled, returning API menu items for api_ids: {api_ids}.")
                return api_menu_items

            # Cache menu items
            cached_menu_items = self.MENU_CACHE.cache_menu_items(api_menu_items)
            if not cached_menu_items:
                logger.error(f"Error caching menu items for api_ids: {api_ids}.")
                return None

            # Return cached menu items
            logger.info(f"Returning cached menu items for api_ids: {api_ids}.")
            return self.MENU_CACHE.get_cached_menu_items(api_ids)
        except Exception as e:
            logger.error(
                f"Error getting or caching menu items for api_ids: {api_ids}: {e} in get_or_cache_menu_items."
            )
            return None

    def get_or_cache_menu_and_cache_menu_items(self, location_id: int, menu_id: str) -> Optional[list]:
        """Get or cache a menu and cache its menu items if it does not exist in the cache.

        Args:
            location_id (int): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of API IDs.

        """
        logger.info(f"Getting or caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        try:
            # Return cached menu if it exists
            cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
            if cached_menu:
                logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
                return cached_menu

            # Otherwise, fetch menu from API
            api_menu = self.MENU_API.get_menu(location_id, menu_id)
            if not api_menu:
                logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
                return None

            # If cache is disabled, return API menu
            if DISABLE_CACHE:
                logger.info(
                    f"Cache is disabled, returning API menu for location_id: {location_id}, menu_id: {menu_id}."
                )
                return api_menu

            # Get menu items from API or cache
            cached_menu_items = self.MENU_CACHE.get_cached_menu_items(api_menu)

            # Get found API IDs and missing API IDs
            found_api_ids = list(cached_menu_items.keys()) if cached_menu_items else []
            missing_api_ids = list(set(api_menu) - set(found_api_ids))

            # If there are missing API IDs, fetch them from API and cache them
            if missing_api_ids:
                # Fetch menu items from API
                api_menu_items = self.MENU_API.get_menu_items(missing_api_ids)
                if not api_menu_items:
                    logger.error(f"No menu items found for api_ids: {missing_api_ids}.")
                    return None

                # Cache menu items
                cached_menu_items = self.MENU_CACHE.cache_menu_items(api_menu_items)
                if not cached_menu_items:
                    logger.error(f"Error caching menu items for api_ids: {missing_api_ids}.")
                    return None

            # Make sure locations are cached
            locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
            if not locations:
                logger.error("No locations found, cannot cache menu.")
                return None

            # Cache menu
            cached_menu = self.MENU_CACHE.cache_menu(location_id, menu_id, api_menu)
            if not cached_menu:
                logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
                return None

            # Return cached menu
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            return self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        except Exception as e:
            logger.error(
                f"Error getting or caching menu for location_id: {location_id}, menu_id: {menu_id}: {e} in get_or_cache_menu_and_cache_menu_items."
            )
            return None

    def get_or_cache_menus_and_cache_menu_items_for_locations(self, menu_id: str) -> Optional[dict]:
        """Get or cache menus and cache their menu items for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            dict: Dictionary of locations with their menus (list of API IDs).

        """
        logger.info(f"Getting or caching menus for all locations for menu_id: {menu_id}.")
        try:
            # Get locations from API or cache
            locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2"])
            if not locations:
                logger.error(f"No locations found for menu_id: {menu_id}.")
                return None

            # Get menus for each location
            menus = {}
            for location_id in locations.keys():
                menu = self.get_or_cache_menu_and_cache_menu_items(location_id, menu_id)
                if not menu:
                    logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
                    continue

                # Add menu to menus dictionary
                menus[location_id] = menu

            # If no menus were found, return None
            if not menus:
                logger.error(f"No menus found for menu_id: {menu_id}.")
                return None

            logger.info(f"Returning cached menus for all locations for menu_id: {menu_id}.")
            return menus
        except Exception as e:
            logger.error(
                f"Error getting or caching menus for all locations for menu_id: {menu_id}: {e} in get_or_cache_menus_and_cache_menu_items_for_locations."
            )
            return None

    def get_or_cache_menus_and_cache_menu_items_for_locations_and_day(self, menu_date: str) -> Optional[dict]:
        """Get or cache menus and cache their menu items for all locations on a given day.

        Args:
            menu_date (str): The menu date.

        Returns:
            dict: Dictionary of locations with their menus (list of API IDs) for each meal on the given day.

        """
        logger.info(f"Getting or caching menus for all locations on day: {menu_date}.")
        try:
            # Get menus with menu items for each meal
            meals = ["Breakfast", "Lunch", "Dinner"]
            menus = {}
            for meal in meals:
                meal_menus = self.get_or_cache_menus_and_cache_menu_items_for_locations(f"{menu_date}-{meal}")
                if not meal_menus:
                    logger.error(f"No menus found for day: {menu_date}, meal: {meal}.")
                    continue

                # Add meal menus to menus dictionary
                menus[meal] = meal_menus

            # If no menus were found, return None
            if not menus:
                logger.error(f"No menus found for day: {menu_date}.")
                return None

            logger.info(f"Returning cached menus for all locations and day: {menu_date}.")
            return menus
        except Exception as e:
            logger.error(
                f"Error getting or caching menus for all locations on day: {menu_date}: {e} in get_or_cache_menus_and_cache_menu_items_for_locations_and_day."
            )
            return None

    def get_or_cache_menus_and_cache_menu_items_for_locations_and_days(
        self, start_date: str, end_date: str
    ) -> Optional[dict]:
        """Get or cache menus and cache their menu items for all locations for a given date range.

        Args:
            start_date (str): The start date.
            end_date (str): The end date. YYYY-MM-DD format.

        Returns:
            dict: Dictionary of locations with their menus (list of API IDs) for each meal on the given date range.

        """
        logger.info(f"Getting or caching menus for all locations for date range: {start_date} to {end_date}.")
        try:
            # Specify all dates in the date range
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
            dates = [
                start_date_obj + datetime.timedelta(days=i) for i in range((end_date_obj - start_date_obj).days + 1)
            ]

            # Get menus for each date
            menus = {}
            for date in dates:
                date_str = str(date.strftime("%Y-%m-%d"))
                day_menus = self.get_or_cache_menus_and_cache_menu_items_for_locations_and_day(date_str)
                if not day_menus:
                    logger.error(f"No menus found for date: {date_str}.")
                    continue

                # Add day menus to menus dictionary
                menus[date_str] = day_menus

            # If no menus were found, return None
            if not menus:
                logger.error(f"No menus found for date range: {start_date} to {end_date}.")
                return None

            logger.info(f"Returning cached menus for all locations for date range: {start_date} to {end_date}.")
            return menus
        except Exception as e:
            logger.error(
                f"Error getting or caching menus for all locations for date range: {start_date} to {end_date}: {e} in get_or_cache_menus_and_cache_menu_items_for_locations_and_days."
            )
            return None


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
        # Get API ID from request
        api_id = request.GET.get("api_id")
        if not api_id:
            return Response({"data": None, "message": "api_id is required", "error": "api_id is required"}, status=400)

        # Get menu item
        menu_item = menu_service.get_or_cache_menu_item(int(api_id))
        if not menu_item:
            return Response(
                {
                    "data": None,
                    "message": "No menu item found for api_id: {api_id}",
                    "error": "No menu item found for api_id: {api_id}",
                },
                status=404,
            )

        # Return menu item
        logger.info(f"Returning dining menu item for api_id: {api_id}.")
        return Response(
            {"data": menu_item, "message": "Dining menu item fetched successfully.", "error": None},
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menu_item view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching dining menu item: {str(e)}", "error": str(e)}, status=500
        )


@api_view(["POST"])
def get_dining_menu_items(request):
    """Django view function to get or cache dining menu items.

    Args:
        request (Request): The HTTP request object.
        api_ids (list[int]): The list of API IDs in request body.

    Returns:
        Response: The HTTP response object.
        menu_items (dict): Dictionary of menu items by API ID.

    """
    logger.info(f"Getting dining menu items for request: {request}")
    try:
        # Get API IDs from request body
        api_ids = request.data.get("api_ids")
        if not api_ids:
            return Response(
                {"data": None, "message": "api_ids is required", "error": "api_ids is required"}, status=400
            )

        # Parse API IDs
        api_ids = [int(api_id) for api_id in api_ids]

        # Get menu items
        menu_items = menu_service.get_or_cache_menu_items(api_ids)
        if not menu_items:
            return Response(
                {
                    "data": None,
                    "message": "No menu items found for api_ids: {api_ids}",
                    "error": "No menu items found for api_ids: {api_ids}",
                },
                status=404,
            )

        # Return menu items
        logger.info(f"Returning dining menu items for api_ids: {api_ids}.")
        return Response(
            {"data": menu_items, "message": "Dining menu items fetched successfully.", "error": None}, status=200
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menu_items view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching dining menu items: {str(e)}", "error": str(e)}, status=500
        )


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get or cache dining menu with menu items.

    Args:
        request (Request): The HTTP request object.
        location_id (str): The location ID.
        menu_id (str): The menu ID.

    Returns:
        Response: The HTTP response object.
        menu (list): List of API IDs for the menu.

    """
    logger.info(f"Getting dining menu for request: {request}")
    try:
        # Get location ID and menu ID from request
        location_id = int(request.GET.get("location_id"))
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response(
                {
                    "data": None,
                    "message": "location_id and menu_id are required",
                    "error": "location_id and menu_id are required",
                },
                status=400,
            )

        # Get menu
        menu = menu_service.get_or_cache_menu_and_cache_menu_items(location_id, menu_id)
        if not menu:
            return Response(
                {
                    "data": None,
                    "message": "No menu found for location_id: {location_id}, menu_id: {menu_id}",
                    "error": "No menu found for location_id: {location_id}, menu_id: {menu_id}",
                },
                status=404,
            )

        # Return menu
        logger.info(f"Returning dining menu for location_id: {location_id}, menu_id: {menu_id}.")
        return Response(
            {
                "data": menu,
                "message": "Dining menu fetched successfully.",
                "error": None,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menu view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching dining menu: {str(e)}", "error": str(e)}, status=500
        )


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menus_for_locations(request):
    """Django view function to get or cache dining menus for all locations.

    Args:
        request (Request): The HTTP request object.
        menu_id (str): The menu ID.

    Returns:
        Response: The HTTP response object.
        menus (dict): Dictionary of locations with menus for the given menu ID.

    """
    logger.info(f"Getting dining menus for all locations for request: {request}")
    try:
        # Get menu ID from request
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response(
                {"data": None, "message": "menu_id is required", "error": "menu_id is required"}, status=400
            )

        # Get menus for all locations
        menus = menu_service.get_or_cache_menus_and_cache_menu_items_for_locations(menu_id)
        if not menus:
            return Response(
                {
                    "data": None,
                    "message": "No menus found for menu_id: {menu_id}",
                    "error": "No menus found for menu_id: {menu_id}",
                },
                status=404,
            )

        # Return menus
        logger.info(f"Returning dining menus for all locations for menu_id: {menu_id}.")
        return Response(
            {
                "data": menus,
                "message": "Dining menus fetched successfully.",
                "error": None,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menus_for_locations view: {e}")
        return Response(
            {
                "data": None,
                "message": f"Error fetching dining menus: {str(e)}",
                "error": str(e),
            },
            status=500,
        )


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menus_for_locations_and_day(request):
    """Django view function to get or cache dining menus for all locations on a given day.

    Args:
        request (Request): The HTTP request object.
        menu_date (datetime.date): The menu date.

    Returns:
        Response: The HTTP response object.
        menus (dict): Dictionary of locations with menus for each meal on the given day.

    """
    logger.info(f"Getting dining menus for all locations for request: {request}")
    try:
        # Get menu date from request
        menu_date = request.GET.get("menu_date")
        if not menu_date:
            return Response(
                {"data": None, "message": "menu_date is required", "error": "menu_date is required"}, status=400
            )

        # Get menus for all locations on the given day
        menus = menu_service.get_or_cache_menus_and_cache_menu_items_for_locations_and_day(menu_date)
        if not menus:
            return Response(
                {
                    "data": None,
                    "message": "No menus found for menu_date: {menu_date}",
                    "error": "No menus found for menu_date: {menu_date}",
                },
                status=404,
            )

        # Return menus
        logger.info(f"Returning dining menus for all locations on day: {menu_date}.")
        return Response(
            {
                "data": menus,
                "message": "Dining menus fetched successfully.",
                "error": None,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menus_for_locations_day view: {e}")
        return Response(
            {
                "data": None,
                "message": f"Error fetching dining menus: {str(e)}",
                "error": str(e),
            },
            status=500,
        )


@cache_page(60 * 5)
@api_view(["GET"])
def get_dining_menus_for_locations_and_days(request):
    """Django view function to get or cache dining menus for all locations for a given date range.

    Args:
        request (Request): The HTTP request object.
        start_date (datetime.date): The start date.
        end_date (datetime.date): The end date.

    Returns:
        Response: The HTTP response object.
        menus (dict): Dictionary of locations with menus for each meal on the given date range.

    """
    logger.info(f"Getting dining menus for all locations for days for request: {request}")
    try:
        # Get start date and end date from request
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        if not start_date or not end_date:
            return Response(
                {
                    "data": None,
                    "message": "start_date and end_date are required",
                    "error": "start_date and end_date are required",
                },
                status=400,
            )

        # Get menus for all locations for the given date range
        menus = menu_service.get_or_cache_menus_and_cache_menu_items_for_locations_and_days(start_date, end_date)
        if not menus:
            return Response(
                {
                    "data": None,
                    "message": "No menus found for start_date: {start_date}, end_date: {end_date}",
                    "error": "No menus found for start_date: {start_date}, end_date: {end_date}",
                },
                status=404,
            )

        # Return menus
        logger.info(f"Returning dining menus for all locations for date range: {start_date} to {end_date}.")
        return Response(
            {
                "data": menus,
                "message": "Dining menus fetched successfully.",
                "error": None,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_menus_for_locations_days view: {e}")
        return Response(
            {
                "data": None,
                "message": f"Error fetching dining menus: {str(e)}",
                "error": str(e),
            },
            status=500,
        )


#################### Utility functions for working with menu data #########################


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


def classify_by_dietary_flags(ingredients: List[str], allergens: List[str], name: str) -> Optional[List[str]]:
    """Classify dietary flags for a menu item.

    Args:
        ingredients: The ingredients of the menu item.
        allergens: The allergens of the menu item.
        name: The name of the menu item.

    Returns:
        A list of dietary flags.

    """
    logger.info(f"Classifying dietary flags for ingredients: {ingredients}, allergens: {allergens}, name: {name}.")
    try:
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

        # Add explicit labels if they are present
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
    except Exception as e:
        logger.error(
            f"Error classifying dietary flags for ingredients: {ingredients}, allergens: {allergens}, name: {name}: {e} in classify_by_dietary_flags."
        )
        return None


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


def parse_scraped_api_url_data(scraped_api_url_data: dict) -> Optional[dict]:
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

    # Test if API URL has nutrition information
    if not name:
        logger.error(f"No nutrition information found for scraped API URL data: {scraped_api_url_data}.")
        return None

    # Extract nutrition information
    nutrition = {
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
    }

    # Extract menu item data and attach nutrition information
    menu_item = {
        "name": name,
        "allergens": allergens,
        "ingredients": ingredients,
        "nutrition": nutrition,
    }

    return menu_item
