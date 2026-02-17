"""Cacher class for caching menu, menu items, and location data.

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

if __name__ == "__main__":
    import sys
    import os

    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    sys.path.insert(0, project_root)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")

    import django

    django.setup()


import datetime
from urllib.parse import urlencode
from typing import Any, Optional
import requests
from bs4 import BeautifulSoup
from hoagiemeal.utils.logger import logger
import logging
import pprint
import re
import time
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from hoagiemeal.models.dining import DiningLocation
from django.db import transaction, IntegrityError
from django.utils import timezone
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.models.engagement import MenuItemMetrics, MenuItemInteraction
from hoagiemeal.api.scraper import Scraper, get_menu_item_ids_from_menus_for_all_locations_and_date
from hoagiemeal.serializers import (
    DiningLocationSerializer,
    ResidentialMenuSerializer,
    RetailMenuSerializer,
    MenuItemSerializer,
    MenuItemNutritionSerializer,
)
from collections import defaultdict
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.cache import cache_page


logger.setLevel(logging.DEBUG)
session = requests.Session()
CACHE_TIMEOUT = 60 * 5


###################################### Caching helper functions #####################################


def cache_locations(locations: dict) -> bool:
    """Cache locations in the database."""
    logger.info(f"Caching {len(locations)} locations.")
    try:
        with transaction.atomic():
            for location in locations.values():
                try:
                    DiningLocation.objects.get_or_create(
                        id=location["id"],
                        category=location["category"],
                        name=location["name"],
                        url=location["url"],
                    )
                except IntegrityError:
                    pass  # created by concurrent request
        return True
    except Exception as e:
        logger.error(f"Error caching locations: {e}.")
        return False


def cache_residential_menus_for_locations_and_date(date: datetime.date, menus: dict) -> bool:
    """Cache residential menus for a location and date."""
    logger.info(f"Caching residential menus for date: {date}.")
    try:
        for location_id, meal_menus in menus.items():
            dining_location = DiningLocation.objects.get(id=location_id)
            for meal, menu_items in meal_menus.items():
                try:
                    ResidentialMenu.objects.get_or_create(
                        dining_location=dining_location,
                        date=date,
                        meal=meal,
                        menu_items=menu_items,
                    )
                except IntegrityError:
                    pass  # created by concurrent request
        return True
    except Exception as e:
        logger.error(f"Error caching residential menus for date: {date}: {e}.")
        return False


def cache_retail_menus_for_locations_and_date(date: datetime.date, menus: dict) -> bool:
    """Cache retail menus for a location and date."""
    logger.info(f"Caching retail menus for date: {date}.")
    try:
        for location_id, menu_items in menus.items():
            dining_location = DiningLocation.objects.get(id=location_id)
            try:
                RetailMenu.objects.get_or_create(
                    dining_location=dining_location,
                    date=date,
                    menu_items=menu_items,
                )
            except IntegrityError:
                pass  # created by concurrent request
        return True
    except Exception as e:
        logger.error(f"Error caching retail menus for date: {date}: {e}.")
        return False


def cache_all_menus_for_locations_and_date(date: datetime.date, menus: dict) -> bool:
    """Cache all menus for a location and date."""
    logger.info(f"Caching all menus for date: {date}.")
    try:
        residential_menus = {}
        retail_menus = {}
        for location_id, meal_menus in menus.items():
            dining_location = DiningLocation.objects.get(id=location_id)
            if dining_location.category == "residential":
                residential_menus[location_id] = meal_menus
            elif dining_location.category == "retail":
                retail_menus[location_id] = meal_menus

        cache_residential_menus_for_locations_and_date(date, residential_menus)
        cache_retail_menus_for_locations_and_date(date, retail_menus)
        return True
    except Exception as e:
        logger.error(f"Error caching all menus for date: {date}: {e}.")
        return False


def cache_menu_items(menu_items: dict) -> bool:
    """Cache menu items in the database."""
    logger.info(f"Caching {len(menu_items)} menu items.")
    try:
        for menu_item in menu_items.values():
            try:
                with transaction.atomic():
                    try:
                        menu_item_obj, created = MenuItem.objects.get_or_create(
                            id=menu_item["id"],
                            name=menu_item["name"],
                            url=menu_item["url"],
                        )
                    except IntegrityError:
                        menu_item_obj = MenuItem.objects.get(id=menu_item["id"])

                    nutrition = menu_item["nutrition"]
                    try:
                        MenuItemNutrition.objects.get_or_create(
                            menu_item=menu_item_obj,
                            servings_per_container=nutrition["servings_per_container"],
                            serving_size=nutrition["serving_size"],
                            calories=nutrition["calories"],
                            total_fat=nutrition["total_fat"],
                            total_fat_dv=nutrition["total_fat_dv"],
                            saturated_fat=nutrition["saturated_fat"],
                            saturated_fat_dv=nutrition["saturated_fat_dv"],
                            trans_fat=nutrition["trans_fat"],
                            cholesterol=nutrition["cholesterol"],
                            cholesterol_dv=nutrition["cholesterol_dv"],
                            sodium=nutrition["sodium"],
                            sodium_dv=nutrition["sodium_dv"],
                            total_carbs=nutrition["total_carbs"],
                            total_carbs_dv=nutrition["total_carbs_dv"],
                            dietary_fiber=nutrition["dietary_fiber"],
                            dietary_fiber_dv=nutrition["dietary_fiber_dv"],
                            total_sugars=nutrition["total_sugars"],
                            added_sugars_dv=nutrition["added_sugars_dv"],
                            added_sugars=nutrition["added_sugars"],
                            protein=nutrition["protein"],
                            protein_dv=nutrition["protein_dv"],
                            vitamin_d=nutrition["vitamin_d"],
                            vitamin_d_dv=nutrition["vitamin_d_dv"],
                            calcium=nutrition["calcium"],
                            calcium_dv=nutrition["calcium_dv"],
                            iron=nutrition["iron"],
                            iron_dv=nutrition["iron_dv"],
                            potassium=nutrition["potassium"],
                            potassium_dv=nutrition["potassium_dv"],
                            ingredients=nutrition["ingredients"],
                            allergens=nutrition["allergens"],
                        )
                    except IntegrityError:
                        pass  # created by concurrent request
            except Exception as e:
                logger.error(f"Error caching menu item: {e}.")
                continue
        return True
    except Exception as e:
        logger.error(f"Error caching menu items: {e}.")
        return False


###################################### Caching service class #####################################


class CacherService:
    """Service for caching dining menus and menu items."""

    SCRAPER = Scraper()

    def get_or_cache_all_locations(self) -> Optional[dict]:
        """Get or cache locations from the API."""
        logger.info("Getting or caching all locations.")
        try:
            cached_locations = DiningLocation.objects.all()
            if len(cached_locations) > 0:
                logger.info("Returning cached all locations.")
                return {location.id: DiningLocationSerializer(location).data for location in cached_locations}

            api_locations = self.SCRAPER.get_all_locations()
            if not api_locations:
                logger.error("No locations found.")
                return None

            cached_success = cache_locations(api_locations)
            if not cached_success:
                logger.error("Error caching locations.")
                return None

            cached_locations = DiningLocation.objects.all()
            return {location.id: DiningLocationSerializer(location).data for location in cached_locations}
        except Exception as e:
            logger.error(f"Error getting or caching all locations: {e}.")
            return None

    def get_or_cache_residential_locations(self) -> Optional[dict]:
        """Get or cache residential locations from the API."""
        logger.info("Getting or caching residential locations.")
        try:
            cached_locations = DiningLocation.objects.filter(category="residential")
            if len(cached_locations) > 0:
                logger.info("Returning cached residential locations.")
                return {location.id: DiningLocationSerializer(location).data for location in cached_locations}

            api_locations = self.SCRAPER.get_all_locations()
            if not api_locations:
                logger.error("No residential locations found.")
                return None

            cached_success = cache_locations(api_locations)
            if not cached_success:
                logger.error("Error caching residential locations.")
                return None

            cached_locations = DiningLocation.objects.filter(category="residential")
            return {location.id: DiningLocationSerializer(location).data for location in cached_locations}
        except Exception as e:
            logger.error(f"Error getting or caching residential locations: {e}.")
            return None

    def get_or_cache_retail_locations(self) -> Optional[dict]:
        """Get or cache retail locations from the API."""
        logger.info("Getting or caching retail locations.")
        try:
            cached_locations = DiningLocation.objects.filter(category="retail")
            if len(cached_locations) > 0:
                logger.info("Returning cached retail locations.")
                return {location.id: DiningLocationSerializer(location).data for location in cached_locations}

            api_locations = self.SCRAPER.get_all_locations()
            if not api_locations:
                logger.error("No retail locations found.")
                return None

            cached_success = cache_locations(api_locations)
            if not cached_success:
                logger.error("Error caching retail locations.")
                return None

            cached_locations = DiningLocation.objects.filter(category="retail")
            return {location.id: DiningLocationSerializer(location).data for location in cached_locations}
        except Exception as e:
            logger.error(f"Error getting or caching retail locations: {e}.")
            return None

    def get_or_cache_residential_menus_for_date(self, date: datetime.date) -> Optional[dict]:
        """Get or cache residential menus for a date."""
        logger.info(f"Getting or caching residential menus for date: {date}.")
        try:
            cached_menus = ResidentialMenu.objects.filter(date=date)
            if len(cached_menus) > 0:
                logger.info(f"Returning cached residential menus for date: {date}.")
                menus = defaultdict(dict)
                for menu in cached_menus:
                    menus[menu.dining_location.id][menu.meal] = menu.menu_items
                return dict(menus)

            api_menus = self.SCRAPER.get_menus_for_all_locations_and_date(date)
            if not api_menus:
                logger.error(f"No residential menus found for date: {date}.")
                return None

            cached_success = cache_all_menus_for_locations_and_date(date, api_menus)
            if not cached_success:
                logger.error(f"Error caching residential menus for date: {date}.")
                return None

            menu_items_ids = get_menu_item_ids_from_menus_for_all_locations_and_date(api_menus)
            cached_menu_items = self.get_or_cache_menu_items(menu_items_ids)
            if not cached_menu_items:
                logger.error(f"Error getting or caching menu items for date: {date}.")
                return None

            cached_menus = ResidentialMenu.objects.filter(date=date)
            menus = defaultdict(dict)
            for menu in cached_menus:
                menus[menu.dining_location.id][menu.meal] = menu.menu_items
            return dict(menus)
        except Exception as e:
            logger.error(f"Error getting or caching residential menus for date: {date}: {e}.")
            return None

    def get_or_cache_retail_menus_for_date(self, date: datetime.date) -> Optional[dict]:
        """Get or cache retail menus for a date."""
        logger.info(f"Getting or caching retail menus for date: {date}.")
        try:
            cached_menus = RetailMenu.objects.filter(date=date)
            if len(cached_menus) > 0:
                logger.info(f"Returning cached retail menus for date: {date}.")
                return {menu.dining_location.id: RetailMenuSerializer(menu).data for menu in cached_menus}

            api_menus = self.SCRAPER.get_menus_for_all_locations_and_date(date)
            if not api_menus:
                logger.error(f"No retail menus found for date: {date}.")
                return None

            cached_success = cache_all_menus_for_locations_and_date(date, api_menus)
            if not cached_success:
                logger.error(f"Error caching retail menus for date: {date}.")
                return None

            menu_items_ids = get_menu_item_ids_from_menus_for_all_locations_and_date(api_menus)
            cached_menu_items = self.get_or_cache_menu_items(menu_items_ids)
            if not cached_menu_items:
                logger.error(f"Error getting or caching menu items for date: {date}.")
                return None

            cached_menus = RetailMenu.objects.filter(date=date)
            return {menu.dining_location.id: RetailMenuSerializer(menu).data for menu in cached_menus}
        except Exception as e:
            logger.error(f"Error getting or caching retail menus for date: {date}: {e}.")
            return None

    def get_or_cache_all_menus_for_date(self, date: datetime.date) -> Optional[dict]:
        """Get or cache all menus for a date."""
        logger.info(f"Getting or caching all menus for date: {date}.")
        try:
            residential_menus = ResidentialMenu.objects.filter(date=date)
            retail_menus = RetailMenu.objects.filter(date=date)
            cached_menus = [*residential_menus, *retail_menus]
            if len(cached_menus) > 0:
                logger.info(f"Returning cached all menus for date: {date}.")
                menus = defaultdict(dict)
                for menu in cached_menus:
                    if menu.dining_location.category == "residential":
                        menus[menu.dining_location.id][menu.meal] = menu.menu_items
                    else:
                        menus[menu.dining_location.id] = menu.menu_items
                return dict(menus)

            locations = self.get_or_cache_all_locations()
            if not locations:
                logger.error(f"Error getting or caching locations before caching menus for date: {date}.")
                return None

            api_menus = self.SCRAPER.get_menus_for_all_locations_and_date(date)
            if not api_menus:
                logger.error(f"No all menus found for date: {date}.")
                return None

            cached_success = cache_all_menus_for_locations_and_date(date, api_menus)
            if not cached_success:
                logger.error(f"Error caching all menus for date: {date}.")
                return None

            menu_items_ids = get_menu_item_ids_from_menus_for_all_locations_and_date(api_menus)
            cached_menu_items = self.get_or_cache_menu_items(menu_items_ids)
            if not cached_menu_items:
                logger.error(f"Error getting or caching menu items for date: {date}.")
                return None

            residential_menus = ResidentialMenu.objects.filter(date=date)
            retail_menus = RetailMenu.objects.filter(date=date)
            cached_menus = [*residential_menus, *retail_menus]
            menus = defaultdict(dict)
            for menu in cached_menus:
                if menu.dining_location.category == "residential":
                    menus[menu.dining_location.id][menu.meal] = menu.menu_items
                else:
                    menus[menu.dining_location.id] = menu.menu_items
            return dict(menus)
        except Exception as e:
            logger.error(f"Error getting or caching all menus for date: {date}: {e}.")
            return None

    def get_or_cache_menu_items(self, ids: "list[str]") -> Optional[dict]:
        """Get or cache menu items for a list of IDs."""
        logger.info(f"Getting or caching menu items for IDs: {ids}.")
        try:
            cached_menu_items = MenuItem.objects.filter(id__in=ids)
            if len(cached_menu_items) == len(ids):
                logger.info(f"Returning cached menu items for IDs: {ids}.")
                return {menu_item.id: MenuItemSerializer(menu_item).data for menu_item in cached_menu_items}

            cached_ids = set(menu_item.id for menu_item in cached_menu_items)
            missing_ids = list(set(ids) - cached_ids)
            api_menu_items = self.SCRAPER.get_menu_items(missing_ids)
            if api_menu_items:
                cached_success = cache_menu_items(api_menu_items)
                if not cached_success:
                    logger.error(f"Error caching menu items for IDs: {missing_ids}.")
                    return None

            logger.info(f"Found {len(cached_ids)} existing cached menu items, cached {len(missing_ids)} menu items.")
            cached_menu_items = MenuItem.objects.filter(id__in=ids)
            return {menu_item.id: MenuItemSerializer(menu_item).data for menu_item in cached_menu_items}
        except Exception as e:
            logger.error(f"Error getting or caching menu items for IDs: {ids}: {e}.")
            return None


cacher_service = CacherService()

###################################### Exposed endpoints #####################################


@cache_page(CACHE_TIMEOUT)
@api_view(["GET"])
def get_or_cache_all_locations(request):
    """Get or cache all locations."""
    try:
        locations = cacher_service.get_or_cache_all_locations()
        return Response(
            {"data": locations, "message": "Locations retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving all locations: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving all locations: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@cache_page(CACHE_TIMEOUT)
@api_view(["GET"])
def get_or_cache_all_menus_for_date(request):
    """Get or cache all menus for a date."""
    try:
        date = request.query_params.get("date")
        if not date:
            return Response(
                {"data": None, "message": "Date is required.", "error": "Date is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date = datetime.date.fromisoformat(date)
        menus = cacher_service.get_or_cache_all_menus_for_date(date)
        return Response(
            {"data": menus, "message": "All menus retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving all menus: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving all menus: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_or_cache_menu_items(request):
    """Get or cache menu items for a list of IDs."""
    try:
        ids = request.data.get("ids")
        if not ids:
            return Response(
                {"data": None, "message": "IDs are required.", "error": "IDs are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ids = [id.strip() for id in ids.split(",")]
        menu_items = cacher_service.get_or_cache_menu_items(ids)
        return Response(
            {"data": menu_items, "message": "Menu items retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving menu items: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving menu items: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


###################################### Tester functions #####################################


def test_get_or_cache_all_locations():
    """Test getting or caching all locations."""
    logger.info("Testing getting or caching all locations.")
    locations = cacher_service.get_or_cache_all_locations()
    if not locations:
        logger.error("No locations found.")
        return None

    folder_name = "data/cache"
    os.makedirs(folder_name, exist_ok=True)
    with open(os.path.join(folder_name, "locations.json"), "w") as f:
        json.dump(locations, f, indent=2)


def test_get_or_cache_menu_with_menu_items():
    """Test getting or caching menu with menu items for a date."""
    logger.info("Testing getting or caching menu with menu items for a date.")
    date = datetime.date.today() + datetime.timedelta(days=4)
    menus = cacher_service.get_or_cache_all_menus_for_date(date)
    if not menus:
        logger.error("No menus found.")
        return None

    folder_name = f"data/cache/{date.strftime('%Y-%m-%d')}"
    os.makedirs(folder_name, exist_ok=True)
    with open(os.path.join(folder_name, "menus.json"), "w") as f:
        json.dump(menus, f, indent=2)


def test_get_or_cache_menu_items():
    """Test getting or caching menu items for a list of IDs."""
    logger.info("Testing getting or caching menu items for a list of IDs.")
    date = datetime.date.today() + datetime.timedelta(days=4)
    menus = cacher_service.get_or_cache_all_menus_for_date(date)
    if not menus:
        logger.error("No menus found.")
        return None

    menu_items_ids = get_menu_item_ids_from_menus_for_all_locations_and_date(menus)
    menu_items = cacher_service.get_or_cache_menu_items(menu_items_ids)
    if not menu_items:
        logger.error("No menu items found.")
        return None

    folder_name = f"data/cache/{date.strftime('%Y-%m-%d')}"
    os.makedirs(folder_name, exist_ok=True)
    with open(os.path.join(folder_name, "menu_items.json"), "w") as f:
        json.dump(menu_items, f, indent=2)


if __name__ == "__main__":
    test_get_or_cache_all_locations()
    test_get_or_cache_menu_with_menu_items()
    test_get_or_cache_menu_items()
