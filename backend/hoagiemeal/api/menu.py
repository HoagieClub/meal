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
from typing import Optional, Tuple

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
from hoagiemeal.utils.menu import (
    classify_by_dietary_flags,
    parse_nutrition_data_for_menu_item_nutrient,
    parse_nutrition_data_for_menu_item,
)
from hoagiemeal.api.locations import LocationsAPI

MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}


def parse_menu_id(menu_id: str) -> Tuple[datetime.date, str]:
    """Parse menu_id into date and meal code."""
    date_str, meal_type = menu_id.rsplit("-", 1)
    menu_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    meal_code = MEAL_TYPE_MAP[meal_type]
    return menu_date, meal_code


class MenuAPI(StudentApp):
    """Handles API communication for dining menus and menu item nutrition information."""

    DINING_MENU = "/dining/menu"
    SCHEMAS = Schemas()
    SCRAPER = Scraper()

    def get_menu(self, location_id: str, menu_id: str) -> list:
        """Fetch menu from external API. Returns a list of menu items.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: List of menu items.

        """
        logger.info(f"Fetching menu for location_id: {location_id}, menu_id: {menu_id}.")
        try:
            params = {"locationID": location_id, "menuID": menu_id}
            response = self._make_request(self.DINING_MENU, params=params)
            api_menu_data = msj.decode(response)

            if isinstance(api_menu_data, dict):
                return api_menu_data.get("menus", [])
            elif isinstance(api_menu_data, list):
                return api_menu_data
        except Exception as e:
            logger.error(f"Error fetching menu for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return []

    def get_menu_item_nutrition_info(self, api_url: str) -> Optional[dict]:
        """Get nutrition information for a menu item from API.

        Args:
            api_url (str): The API URL of the menu item.

        Returns:
            dict: Parsed nutrition data for the menu item nutrient.

        """
        logger.info(f"Getting nutrition information for API URL: {api_url}.")
        try:
            scraped_nutrition_data = self.SCRAPER.scrape_api_url(api_url=api_url)
            parsed_nutrition_data_for_menu_item_nutrient = parse_nutrition_data_for_menu_item_nutrient(
                scraped_nutrition_data
            )
            return parsed_nutrition_data_for_menu_item_nutrient
        except Exception as e:
            logger.error(f"Error getting nutrition information for API URL: {api_url}: {e}")
            return None

    def get_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get menu with nutrition information for each menu item.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID.

        Returns:
            list: Menu with nutrition information for each menu item.

        """
        try:
            logger.info(f"Getting menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}.")
            api_menu_data = self.get_menu(location_id, menu_id)
            if len(api_menu_data) == 0:
                logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
                return []

            for api_menu_item_data in api_menu_data:
                logger.info(f"Getting nutrition information for item: {api_menu_item_data.get('name')}.")
                api_url = api_menu_item_data.get("link")

                try:
                    scraped_nutrition_data = self.SCRAPER.scrape_api_url(api_url=api_url)
                    parsed_nutrition_data_for_menu_item_nutrient = parse_nutrition_data_for_menu_item_nutrient(
                        scraped_nutrition_data
                    )
                    api_menu_item_data["nutrition"] = parsed_nutrition_data_for_menu_item_nutrient

                    parsed_nutrition_data_for_menu_item = parse_nutrition_data_for_menu_item(scraped_nutrition_data)
                    allergens = parsed_nutrition_data_for_menu_item.get("allergens", [])
                    ingredients = parsed_nutrition_data_for_menu_item.get("ingredients", [])
                    api_menu_item_data["allergens"] = allergens
                    api_menu_item_data["ingredients"] = ingredients

                    dietary_flags = classify_by_dietary_flags(
                        ingredients=ingredients,
                        allergens=allergens,
                        name=api_menu_item_data.get("name"),
                        description=api_menu_item_data.get("description"),
                    )
                    api_menu_item_data["dietary_flags"] = dietary_flags
                except Exception as e:
                    logger.error(
                        f"Error getting nutrition information for item: {api_menu_item_data.get('name')}: {e}"
                    )
                    continue

            return api_menu_data
        except Exception as e:
            logger.error(
                f"Error getting menu with nutrition information for location_id: {location_id}, menu_id: {menu_id}: {e}"
            )
            return []


class MenuCache:
    """Handles database caching operations for dining menus.

    This class manages caching of menu data in the database, including
    cache lookups, saving menus, and managing menu items.
    """

    MEAL_TYPE_MAP = {"Breakfast": "BR", "Lunch": "LU", "Dinner": "DI"}

    def get_cached_menu(self, location_id: str, menu_id: str) -> list:
        """Get cached menu from database."""
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)

        try:
            dining_venue = DiningVenue.objects.get(database_id=location_id)
        except Exception as e:
            logger.error(f"Error getting dining venue for location_id: {location_id}: {e}")
            return []

        cached_menu = (
            Menu.objects.prefetch_related(models.Prefetch("menu_items", queryset=MenuItem.objects))
            .filter(dining_venue=dining_venue, date=menu_date, meal=meal_code)
            .first()
        )

        if not cached_menu:
            return []
        menu_items = cached_menu.menu_items.all()
        serialized_menu_items = [MenuItemSerializer(menu_item).data for menu_item in menu_items]
        return serialized_menu_items

    def get_cached_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get cached menu with nutrition information for each menu item."""
        logger.info(f"Checking cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)

        try:
            dining_venue = DiningVenue.objects.get(database_id=location_id)
        except Exception as e:
            logger.error(f"Error getting dining venue for location_id: {location_id}: {e}")
            return []

        cached_menu = (
            Menu.objects.prefetch_related(
                models.Prefetch("menu_items", queryset=MenuItem.objects.select_related("nutrition"))
            )
            .filter(dining_venue=dining_venue, date=menu_date, meal=meal_code)
            .first()
        )
        if not cached_menu:
            return []

        menu_items = cached_menu.menu_items.all()
        serialized_menu_items = [FullMenuItemSerializer(menu_item).data for menu_item in menu_items]
        return serialized_menu_items

    def cache_menu(self, location_id: str, menu_id: str, api_menu_data: list) -> list:
        """Save menu to database cache.

        Args:
            location_id (str): The location ID.
            menu_id (str): The menu ID (date and meal type, e.g., "2024-01-15-Breakfast").
            api_menu_data (dict): Raw menu data from API.

        Returns:
            Optional[list]: The saved menu data.

        """
        logger.info(f"Saving menu to cache for location_id: {location_id}, menu_id: {menu_id}.")
        menu_date, meal_code = parse_menu_id(menu_id)

        try:
            dining_venue = DiningVenue.objects.get(database_id=location_id)
        except Exception as e:
            logger.error(f"Error getting dining venue for location_id: {location_id}: {e}")
            return []

        if len(api_menu_data) == 0:
            logger.info(f"Saving empty menu to cache for location_id: {location_id}, menu_id: {menu_id}.")
            with transaction.atomic():
                menu, _ = Menu.objects.get_or_create(dining_venue=dining_venue, date=menu_date, meal=meal_code)
                menu.menu_items.set([])
                logger.info(f"Cached empty menu for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        menu_item_api_id_map = {}
        for menu_item_data in api_menu_data:
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
                menu, _ = Menu.objects.get_or_create(dining_venue=dining_venue, date=menu_date, meal=meal_code)
                menu.menu_items.set(menu_items)
        except Exception as e:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}: {e}")
            return []

        logger.info(
            f"Cached menu with {len(menu_items)} items (created {len(menu_items_to_create)} new) "
            f"for location_id: {location_id}, menu_id: {menu_id}."
        )

        menu_items = menu.menu_items.all()
        serialized_menu_items = [MenuItemSerializer(menu_item).data for menu_item in menu_items]
        return serialized_menu_items

    def cache_menu_item_nutrition_info(self, menu_item: MenuItem, nutrition_data: dict) -> Optional[dict]:
        """Cache nutrition information for a menu item and update associated MenuItem fields.

        Args:
            menu_item: The MenuItem instance to cache nutrition for.
            nutrition_data: Dictionary with fields already in Django model format.

        Returns:
            Optional[dict]: The cached nutrition data.

        """
        try:
            parsed_nutrition_data_for_menu_item_nutrient = parse_nutrition_data_for_menu_item_nutrient(nutrition_data)  # type: ignore
            nutrient, _ = MenuItemNutrient.objects.update_or_create(
                menu_item=menu_item, defaults=parsed_nutrition_data_for_menu_item_nutrient
            )

            parsed_nutrition_data_for_menu_item = parse_nutrition_data_for_menu_item(nutrition_data)  # type: ignore
            menu_item.allergens = parsed_nutrition_data_for_menu_item.get("allergens", [])
            menu_item.ingredients = parsed_nutrition_data_for_menu_item.get("ingredients", [])
            menu_item.dietary_flags = classify_by_dietary_flags(
                ingredients=parsed_nutrition_data_for_menu_item.get("ingredients", []),
                allergens=parsed_nutrition_data_for_menu_item.get("allergens", []),
                name=menu_item.name,
                description=menu_item.description,
            )

            menu_item.save()
            serialized_nutrient = MenuItemNutrientSerializer(nutrient).data
            return serialized_nutrient
        except Exception as e:
            logger.error(f"Error caching menu item nutrition info for menu_item: {menu_item.api_id}: {e}")
            return None


class MenuService:
    """Service for managing dining menus and menu items."""

    MENU_CACHE = MenuCache()
    MENU_API = MenuAPI()
    SCRAPER = Scraper()

    def get_menu(self, location_id: str, menu_id: str) -> list:
        """Get a menu from the cache or API."""
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if len(cached_menu) > 0:
            return cached_menu

        api_menu_data = self.MENU_API.get_menu(location_id, menu_id)
        if len(api_menu_data) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []
        return api_menu_data

    def cache_menu(self, location_id: str, menu_id: str) -> list:
        """Cache a menu if it does not exist in the cache."""
        cached_menu = self.MENU_CACHE.get_cached_menu(location_id, menu_id)
        if len(cached_menu) > 0:
            return cached_menu

        api_menu_data = self.MENU_API.get_menu(location_id, menu_id)
        if len(api_menu_data) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        cached_menu = self.MENU_CACHE.cache_menu(location_id, menu_id, api_menu_data)
        return cached_menu

    def get_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Get menu with nutrition information for each menu item."""
        cached_menu = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(location_id, menu_id)
        if len(cached_menu) > 0:
            return cached_menu

        api_menu_data = self.MENU_API.get_menu_with_menu_item_nutrition_info(location_id, menu_id)
        if len(api_menu_data) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []
        return api_menu_data

    def cache_menu_with_menu_item_nutrition_info(self, location_id: str, menu_id: str) -> list:
        """Cache menu with nutrition information for each menu item."""
        cached_menu_with_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        if len(cached_menu_with_menu_item_nutrition_info) > 0:
            return cached_menu_with_menu_item_nutrition_info

        api_menu_data = self.MENU_API.get_menu_with_menu_item_nutrition_info(location_id, menu_id)
        if len(api_menu_data) == 0:
            logger.error(f"No menu found for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        cached_menu = self.MENU_CACHE.cache_menu(location_id, menu_id, api_menu_data)
        if len(cached_menu) == 0:
            logger.error(f"Error caching menu for location_id: {location_id}, menu_id: {menu_id}.")
            return []

        for menu_item_data in api_menu_data:
            api_id = menu_item_data.get("id")
            nutrition_data = menu_item_data.get("nutrition", {})
            menu_item = MenuItem.objects.get(api_id=api_id)
            self.MENU_CACHE.cache_menu_item_nutrition_info(menu_item, nutrition_data)

        cached_menu_with_menu_item_nutrition_info = self.MENU_CACHE.get_cached_menu_with_menu_item_nutrition_info(
            location_id, menu_id
        )
        return cached_menu_with_menu_item_nutrition_info


#################### Exposed endpoints #########################

menu_service = MenuService()


@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get dining menu."""
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        menu = menu_service.get_menu(location_id, menu_id)
        return Response(menu)
    except Exception as e:
        logger.error(f"Error in get_dining_menu view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menus_for_locations(request):
    """Django view function to get dining menus for all locations."""
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        locations_api = LocationsAPI()
        locations = locations_api.get_all_category_locations(category_ids=["2", "3"])
        locations = locations["locations"]["location"]
        if len(locations) == 0:
            logger.error("No locations found.")
            return Response({"error": "No locations found"}, status=404)

        menus = []
        for location in locations:
            menu = menu_service.get_menu(location["dbid"], menu_id)
            if len(menu) == 0:
                logger.error(f"No menu found for location_id: {location['dbid']}, menu_id: {menu_id}.")
                continue
            location["menu"] = menu
            menus.append(location)
        return Response(menus)
    except Exception as e:
        logger.error(f"Error in get_dining_menus_for_locations view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menus_for_locations_and_menu_ids(request):
    """Django view function to get dining menus for all locations and select menu ids."""
    try:
        menu_ids = request.GET.getlist("menu_ids")
        if len(menu_ids) == 0:
            logger.error("menu_ids are required.")
            return Response({"error": "menu_ids are required."}, status=404)

        locations_api = LocationsAPI()
        locations = locations_api.get_all_category_locations(category_ids=["2", "3"])
        locations = locations["locations"]["location"]
        if len(locations) == 0:
            logger.error("No locations found.")
            return Response({"error": "No locations found"}, status=404)

        menus = []
        for menu_id in menu_ids:
            menus = get_dining_menus_for_locations(request)
            if len(menus) == 0:
                logger.error(f"No menus found for menu_id: {menu_id}.")
                return Response({"error": "No menus found"}, status=404)
            menus.append({menu_id: menus})
        return Response(menus)
    except Exception as e:
        logger.error(f"Error in get_dining_menus_for_locations_and_menu_ids view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_with_menu_item_nutrition_info(request):
    """Django view function to get dining menu with nutrition information for each menu item."""
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")
        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        menu_with_menu_item_nutrition_info = menu_service.get_menu_with_menu_item_nutrition_info(location_id, menu_id)
        return Response(menu_with_menu_item_nutrition_info)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_item_nutrition_info view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_dining_menu_with_menu_item_nutrition_info_for_locations(request):
    """Django view function to get dining menu with nutrition information for each menu item for all locations."""
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        locations_api = LocationsAPI()
        locations = locations_api.get_all_category_locations(category_ids=["2", "3"])
        locations = locations["locations"]["location"]

        locations_with_menu = []
        for location in locations:
            menu_with_menu_item_nutrition_info = menu_service.get_menu_with_menu_item_nutrition_info(
                location["dbid"], menu_id
            )
            location["menu"] = menu_with_menu_item_nutrition_info
            locations_with_menu.append(location)
        return Response(locations_with_menu)
    except Exception as e:
        logger.error(f"Error in get_dining_menu_with_menu_item_nutrition_info_for_locations: {e}")
        return Response({"error": str(e)}, status=500)
