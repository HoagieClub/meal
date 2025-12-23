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
        logger.info(f"Fetching menu for location_id: {location_id}, menu_id: {menu_id}.")

        if USE_SAMPLE_MENUS:
            logger.info(f"Using sample menus for location_id: {location_id}, menu_id: {menu_id}.")
            key = f"{location_id}:{menu_id}".encode("utf-8")
            digest = hashlib.md5(key).hexdigest()
            index = int(digest, 16) % len(SAMPLE_MENUS)
            menu = SAMPLE_MENUS[index]
            return [parse_menu_item(menu_item) for menu_item in menu]

        params = {"locationID": location_id, "menuID": menu_id}
        response = self._make_request(self.DINING_MENU, params=params)
        menu = msj.decode(response)

        if not isinstance(menu, list) and not isinstance(menu, dict):
            logger.error(f"Invalid menu format for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        if isinstance(menu, dict):
            menu = menu.get("menus", [])
        logger.info(f"Returning menu for location_id: {location_id}, menu_id: {menu_id}.")
        return [parse_menu_item(menu_item) for menu_item in menu]

    def get_menu_item_nutrition_info(self, menu_item: dict) -> dict:
        """Get nutrition information for a menu item.

        Args:
            menu_item (dict): The menu item data.

        Returns:
            dict: The nutrition information.

        """
        try:
            api_url = menu_item.get("link")
            scraped_nutrition_data = self.SCRAPER.scrape_api_url(api_url=api_url)  # type: ignore
            if not scraped_nutrition_data:
                logger.error(f"No nutrition data found for menu_item: {menu_item.get('name')}.")
                return {}

            logger.info(f"Scraped nutrition data for menu_item: {menu_item.get('name')}.")
            parsed_nutrition_data = parse_nutrition_data(scraped_nutrition_data)
            return parsed_nutrition_data
        except Exception as e:
            logger.error(f"Error getting nutrition information for menu_item: {menu_item.get('name')}: {e}")
            return {}

    def get_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: Menu with nutrition information for each menu item.

        """
        logger.info(f"Getting menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        menu = self.get_menu(location_id, menu_id)
        if len(menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        for menu_item in menu:
            name = menu_item.get("name")
            parsed_nutrition_data = self.get_menu_item_nutrition_info(menu_item)
            if len(parsed_nutrition_data) == 0:
                logger.error(f"No nutrition data found for item: {name}.")
                continue
            menu_item["nutrition"] = parsed_nutrition_data

        logger.info(f"Returning menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        return menu

    def get_menu_with_menu_item_nutrition_info_for_locations(self, menu_id: str) -> list:
        """Get menu with nutrition information for each menu item for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menu with nutrition information for each menu item.

        """
        logger.info(f"Getting menu with nutrition information for all locations for menu_id: {menu_id}.")
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
            location["menu"] = menu

        logger.info(f"Returning menu with nutrition information for all locations for menu_id: {menu_id}.")
        return locations

    def get_menu_with_menu_item_nutrition_info_for_locations_and_day(
        self, menu_date: datetime.date, meals: List[str] = ["Breakfast", "Lunch", "Dinner"]
    ) -> dict:
        """Get menu with nutrition information for each menu item for all locations and a given day.

        Args:
            menu_date (datetime.date): The menu date.
            meals (List[str]): The meals to get.

        Returns:
            dict: Dictionary of menu items with nutrition information for each meal at each location on the given day.

        """
        logger.info(f"Getting menu with nutrition information for all locations and day: {menu_date}.")
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for day: {menu_date}.")
            return {meal: [] for meal in meals}

        menus = {meal: [] for meal in meals}
        for meal in meals:
            menu_id = f"{menu_date}-{meal}"
            menu = self.get_menu_with_menu_item_nutrition_info_for_locations(menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for day: {menu_date}, meal: {meal}.")
                continue
            menus[meal] = menu

        logger.info(f"Returning menu with nutrition information for all locations and day: {menu_date}.")
        return menus


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    def get_cached_menu(self, location_id: str, menu_id: str) -> list:
        """Get cached menu from database.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of cached menu items.

        """
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return []

        cached_menu = (
            Menu.objects.prefetch_related(models.Prefetch("menu_items", queryset=MenuItem.objects.all()))
            .filter(dining_venue__database_id=location_id, date=menu_date, meal=meal_code)
            .first()
        )
        if not cached_menu:
            logger.info(f"No cached menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
        serialized_menu_items = MenuItemSerializer(cached_menu.menu_items.all(), many=True).data
        return serialized_menu_items

    def get_cached_menu_item_nutrition_info(self, menu_item: MenuItem) -> dict:
        """Get cached nutrition information for a menu item.

        Args:
            menu_item (MenuItem): The menu item.

        Returns:
            dict: The cached nutrition information.

        """
        logger.info(f"Checking cache for menu_item: {menu_item.api_id}.")
        try:
            nutrient = MenuItemNutrient.objects.get(menu_item=menu_item)
        except Exception as e:
            logger.error(f"Error getting nutrition information for menu_item: {menu_item.api_id}: {e}")
            return {}
        logger.info(f"Returning cached nutrition information for menu_item: {menu_item.api_id}.")
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
        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return []

        cached_menu = (
            Menu.objects.prefetch_related(
                models.Prefetch("menu_items", queryset=MenuItem.objects.select_related("nutrition").all())
            )
            .filter(dining_venue__database_id=location_id, date=menu_date, meal=meal_code)
            .first()
        )
        if not cached_menu:
            logger.info(f"No cached menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        for menu_item in cached_menu.menu_items.all():
            cached_menu_item_nutrition_info = self.get_cached_menu_item_nutrition_info(menu_item)
            if not cached_menu_item_nutrition_info:
                logger.error(f"No nutrition information found for menu_item: {menu_item.api_id}.")
                return []

        logger.info(
            f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )
        serialized_menu_items = FullMenuItemSerializer(cached_menu.menu_items.all(), many=True).data
        return serialized_menu_items

    def get_or_cache_menu(self, location_id: str, menu_id: str, menu: list) -> list:
        """Get or cache menu data from the API.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            menu (list): Menu data to cache.

        Returns:
            list: The menu data.

        """
        logger.info(f"Getting or caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu = self.get_cached_menu(location_id, menu_id)
        if len(cached_menu) > 0:
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            return cached_menu

        menu_date, meal_code = parse_menu_id(menu_id)
        if not menu_date or not meal_code:
            logger.error(f"Invalid menu_id: {menu_id}.")
            return []

        if len(menu) == 0:
            logger.info(f"Caching empty menu for location_id: {location_id}, menu_id: {menu_id}.")
            with transaction.atomic():
                menu_obj, _ = Menu.objects.get_or_create(
                    dining_venue__database_id=location_id, date=menu_date, meal=meal_code
                )
                menu_items = []
                menu_obj.menu_items.set(menu_items)
                logger.info(f"Cached empty menu for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        menu_item_api_id_map = {}
        for menu_item_data in menu:
            menu_item_api_id_str = menu_item_data.get("id")
            menu_item_api_id_map[int(menu_item_api_id_str)] = menu_item_data

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
            try:
                MenuItem.objects.bulk_create(menu_items_to_create, ignore_conflicts=True)
                logger.info(f"Bulk-created {len(menu_items_to_create)} new menu items.")
            except Exception as e:
                logger.error(f"Error bulk-creating menu items for location_id: {location_id}, menu_id: {menu_id}: {e}")
                return []

        try:
            menu_items = MenuItem.objects.filter(api_id__in=menu_item_api_ids)
            with transaction.atomic():
                menu_obj, _ = Menu.objects.get_or_create(
                    dining_venue__database_id=location_id, date=menu_date, meal=meal_code
                )
                menu_obj.menu_items.set(menu_items)
        except Exception as e:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return []

        logger.info(
            f"Cached menu with {len(menu_items)} items (created {len(menu_items_to_create)} new) "
            f"for location_id: {location_id}, menu_id: {menu_id}."
        )
        cached_menu_with_menu_item_nutrition_info = self.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        return cached_menu_with_menu_item_nutrition_info

    def get_or_cache_menu_item_nutrition_info(
        self,
        menu_item: MenuItem,
        nutrition_data: dict,
    ) -> dict:
        """Get or cache nutrition information for a menu item and update associated MenuItem fields.

        Args:
            menu_item: The MenuItem instance to cache nutrition for.
            nutrition_data: Dictionary with fields already in Django model format.

        Returns:
            dict: The cached nutrition data for the menu item nutrient.

        """
        logger.info(f"Getting or caching nutrition information for menu_item: {menu_item.api_id}.")
        cached_menu_item_nutrition_info = self.get_cached_menu_item_nutrition_info(menu_item)
        if cached_menu_item_nutrition_info:
            logger.info(f"Returning cached nutrition information for menu_item: {menu_item.api_id}.")
            return cached_menu_item_nutrition_info

        MenuItemNutrient.objects.create(menu_item=menu_item, **nutrition_data)
        logger.info(f"Cached nutrition information for menu_item: {menu_item.api_id}.")
        cached_menu_item_nutrition_info = self.get_cached_menu_item_nutrition_info(menu_item)
        return cached_menu_item_nutrition_info

    def get_or_cache_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str, menu: list) -> list:
        """Get or cache menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.
            menu (list): The menu data.

        Returns:
            list: List of menu items with nutrition information.

        """
        logger.info(
            f"Getting or caching menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
        )
        cached_menu = self.get_cached_menu_with_menu_item_nutrition_info(location_id, menu_id)
        if len(cached_menu) > 0:
            logger.info(
                f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
            )
            return cached_menu

        cached_menu = self.get_or_cache_menu(location_id, menu_id, menu)
        if len(cached_menu) == 0:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        for menu_item in menu:
            nutrition_data = menu_item.get("nutrition")
            cached_menu_item_nutrition_info = self.get_or_cache_menu_item_nutrition_info(menu_item, nutrition_data)
            if not cached_menu_item_nutrition_info:
                logger.error(f"Error getting or caching menu item nutrition info for menu_item: {menu_item.api_id}.")
                return []

        logger.info(f"Cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu_with_menu_item_nutrition_info = self.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        return cached_menu_with_menu_item_nutrition_info


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
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if len(cached_menu) > 0:
            logger.info(f"Returning cached menu for location_id: {location_id}, menu_id: {menu_id}.")
            return cached_menu

        api_menu = self.MENU_API.get_menu(location_id, menu_id)
        if len(api_menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        logger.info(f"Caching menu for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu = self.MENU_CACHE.get_or_cache_menu(location_id, menu_id, api_menu)
        return cached_menu

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
        cached_menu_with_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        if len(cached_menu_with_menu_item_nutrition_info) > 0:
            logger.info(
                f"Returning cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}."
            )
            return cached_menu_with_menu_item_nutrition_info

        menu = self.MENU_API.get_menu(location_id, menu_id)
        if len(menu) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        cached_menu = self.MENU_CACHE.get_or_cache_menu(location_id, menu_id, menu)
        if len(cached_menu) == 0:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        for menu_item in menu:
            api_id = menu_item.get("id")
            menu_item_obj = MenuItem.objects.get(api_id=api_id)
            cached_menu_item_nutrition_info = self.MENU_CACHE.get_or_cache_menu_item_nutrition_info(
                menu_item_obj, menu_item.get("nutrition")
            )
            if not cached_menu_item_nutrition_info:
                logger.error(f"Error caching menu item nutrition info for menu_item: {menu_item_obj.api_id}.")
                return []

        logger.info(f"Cached menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
        cached_menu_with_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        return cached_menu_with_menu_item_nutrition_info

    def get_or_cache_menu_with_menu_item_nutrition_info_for_locations(self, menu_id: str) -> list:
        """Get or cache menu with nutrition information for each menu item for all locations.

        Args:
            menu_id (str): The menu ID.

        Returns:
            list: List of locations with menu with nutrition information for each menu item.

        """
        logger.info(f"Getting or caching menu with nutrition information for all locations for menu_id: {menu_id}.")
        locations = self.LOCATIONS_SERVICE.get_or_cache_locations(category_ids=["2", "3"])
        if len(locations) == 0:
            logger.error(f"No locations found for menu_id: {menu_id}.")
            return []

        locations_with_menu = []
        for location in locations:
            location_id = location.get("database_id")
            menu_with_menu_item_nutrition_info = self.get_or_cache_menu_with_menu_item_nutrition_info(
                location_id, menu_id
            )
            location["menu"] = menu_with_menu_item_nutrition_info
            locations_with_menu.append(location)

        logger.info(f"Cached menu with nutrition information for all locations for menu_id: {menu_id}.")
        return locations_with_menu


#################### Exposed endpoints #########################

menu_service = MenuService()


@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get dining menu.

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
def get_dining_menu_with_menu_item_nutrition_info(request):
    """Django view function to get dining menu with nutrition information for each menu item.

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
    """Django view function to get dining menu with nutrition information for each menu item for all locations.

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

    def get_tokens(text: str) -> Set[str]:
        """Tokenize and normalize text into searchable terms."""
        if not text:
            return set()
        text = text.lower().replace(",", " ").replace("(", " ").replace(")", " ").replace(":", " ")
        return {t.strip() for t in text.split() if len(t.strip()) > 1}

    def contains(tokens: Set[str], keywords: Set[str]) -> bool:
        """Check if any keyword matches directly or as a substring."""
        for token in tokens:
            if token in keywords:
                return True
            for keyword in keywords:
                if keyword in token:
                    return True
        return False

    structured_tokens = set()
    for ing in ingredients:
        structured_tokens.update(get_tokens(ing))
    for allergen in allergens:
        structured_tokens.update(get_tokens(allergen))

    combined_text = f"{name or ''}".lower()
    text_tokens = get_tokens(combined_text)

    explicit = {
        "vegan": "(vg)" in combined_text or "vegan" in combined_text,
        "vegetarian": "(v)" in combined_text or "vegetarian" in combined_text,
        "halal": "(h)" in combined_text or "halal" in combined_text,
        "kosher": "(k)" in combined_text or "kosher" in combined_text,
    }

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

    seen = set()
    final_flags = []
    for f in flags:
        if f not in seen:
            seen.add(f)
            final_flags.append(f)

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
