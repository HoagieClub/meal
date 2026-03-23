"""Cacher service for caching menu, menu items, and location data.

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
from typing import Optional
from hoagiemeal.utils.logger import logger
from hoagiemeal.models.dining import DiningLocation
from django.db import transaction, IntegrityError
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.api.services.scraper import Scraper, get_menu_item_ids_from_menus_for_all_locations_and_date
from hoagiemeal.serializers import (
    DiningLocationSerializer,
    MenuItemSerializer,
)
from collections import defaultdict


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


def cache_all_menus_for_locations_and_date(date: datetime.date, menus: dict) -> bool:
    """Cache all menus for all locations and a date.

    Prefetches all referenced locations in one query, then creates
    residential/retail menu rows accordingly.
    """
    logger.info(f"Caching all menus for date: {date}.")
    try:
        # One query to fetch all locations referenced in the menus dict
        locations_by_id = {
            loc.id: loc
            for loc in DiningLocation.objects.filter(id__in=menus.keys())
        }

        for location_id, meal_menus in menus.items():
            dining_location = locations_by_id.get(location_id)
            if not dining_location:
                logger.warning(f"Location {location_id} not found in DB, skipping.")
                continue

            if dining_location.category == "residential":
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
            elif dining_location.category == "retail":
                try:
                    RetailMenu.objects.get_or_create(
                        dining_location=dining_location,
                        date=date,
                        menu_items=meal_menus,
                    )
                except IntegrityError:
                    pass  # created by concurrent request

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

                    try:
                        MenuItemNutrition.objects.get_or_create(
                            menu_item=menu_item_obj,
                            **menu_item["nutrition"],
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

    def _get_location_qs(self, category: Optional[str] = None):
        """Return a DiningLocation queryset, optionally filtered by category."""
        qs = DiningLocation.objects.all()
        if category:
            qs = qs.filter(category=category)
        return qs

    def _serialize_locations(self, qs) -> dict:
        """Serialize a location queryset into {id: data} dict."""
        serialized = DiningLocationSerializer(qs, many=True).data
        return {loc["id"]: loc for loc in serialized}

    def get_or_cache_locations(self, category: Optional[str] = None) -> Optional[dict]:
        """Get or cache locations from the API, optionally filtered by category."""
        label = category or "all"
        logger.debug(f"Getting or caching {label} locations.")
        try:
            qs = self._get_location_qs(category)
            # Evaluate once — skip the separate exists() query
            locations = list(qs)
            if locations:
                logger.debug(f"Returning cached {label} locations.")
                return self._serialize_locations(locations)

            api_locations = self.SCRAPER.get_all_locations()
            if not api_locations:
                logger.error(f"No {label} locations found.")
                return None

            cached_success = cache_locations(api_locations)
            if not cached_success:
                logger.error(f"Error caching {label} locations.")
                return None

            return self._serialize_locations(self._get_location_qs(category))
        except Exception as e:
            logger.error(f"Error getting or caching {label} locations: {e}.")
            return None

    def get_or_cache_all_locations(self) -> Optional[dict]:
        """Get or cache all locations from the API."""
        return self.get_or_cache_locations()

    def _build_menus_dict(self, date: datetime.date) -> dict:
        """Build a combined menu dict from cached residential and retail menus for a date."""
        residential_menus = ResidentialMenu.objects.filter(date=date).select_related("dining_location")
        retail_menus = RetailMenu.objects.filter(date=date).select_related("dining_location")
        menus = defaultdict(dict)
        for menu in residential_menus:
            menus[menu.dining_location_id][menu.meal] = menu.menu_items
        for menu in retail_menus:
            menus[menu.dining_location_id] = menu.menu_items
        return dict(menus)

    def get_or_cache_all_menus_for_date(self, date: datetime.date) -> Optional[dict]:
        """Get or cache all menus for a date."""
        logger.debug(f"Getting or caching all menus for date: {date}.")
        try:
            cached = self._build_menus_dict(date)
            if cached:
                logger.debug(f"Returning cached all menus for date: {date}.")
                return cached

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

            return self._build_menus_dict(date)
        except Exception as e:
            logger.error(f"Error getting or caching all menus for date: {date}: {e}.")
            return None

    def _serialize_menu_items(self, qs) -> dict:
        """Serialize a MenuItem queryset into {id: data} dict."""
        serialized = MenuItemSerializer(qs, many=True).data
        return {item["id"]: item for item in serialized}

    def get_or_cache_menu_items(self, ids: "list[str]") -> Optional[dict]:
        """Get or cache menu items for a list of IDs."""
        logger.debug(f"Getting or caching menu items for {len(ids)} IDs.")
        try:
            cached_menu_items = list(
                MenuItem.objects.filter(id__in=ids).select_related("nutrition")
            )
            if len(cached_menu_items) == len(ids):
                logger.debug(f"Returning cached menu items for {len(ids)} IDs.")
                return self._serialize_menu_items(cached_menu_items)

            cached_ids = set(item.id for item in cached_menu_items)
            missing_ids = list(set(ids) - cached_ids)
            api_menu_items = self.SCRAPER.get_menu_items(missing_ids)
            if api_menu_items:
                cached_success = cache_menu_items(api_menu_items)
                if not cached_success:
                    logger.error(f"Error caching menu items for IDs: {missing_ids}.")
                    return None

            logger.info(f"Found {len(cached_ids)} existing cached menu items, cached {len(missing_ids)} menu items.")
            all_items = MenuItem.objects.filter(id__in=ids).select_related("nutrition")
            return self._serialize_menu_items(all_items)
        except Exception as e:
            logger.error(f"Error getting or caching menu items for IDs: {ids}: {e}.")
            return None


cacher_service = CacherService()
