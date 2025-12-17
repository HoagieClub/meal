"""API manager class for the /dining/ endpoints from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/locations
- /dining/events
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
from hoagiemeal.models.menu import MenuItem, MenuRating, Menu, MenuItemNutrient, MenuItemBookmark, MenuItemUpvote
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.serializers import (
    MenuRatingSerializer,
    MenuRatingCreateSerializer,
    MenuItemWithRatingsSerializer,
    FullMenuItemSerializer,
)
from hoagiemeal.api.user import user_api
from hoagiemeal.api.database import get_mapped_menu_item_nutrient_data
from hoagiemeal.utils.scraper import Scraper
from hoagiemeal.utils.dietary import classify_dietary_restrictions


USE_SAMPLE_MENUS = False  # Toggle this to False later when the API is fixed


class DiningAPI(StudentApp):
    """Handles functionalities related to dining information, such as locations, menus, and events."""

    DINING_LOCATIONS = "/dining/locations"
    DINING_EVENTS = "/dining/events"
    DINING_MENU = "/dining/menu"
    schemas = Schemas()
    scraper = Scraper()

    def get_locations(self, category_id: str = "2", fmt: str = "xml") -> dict:
        """Fetch a list of dining locations in XML format.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
          category_id (str): The category ID to fetch. Defaults to "2".
                    Use "2" for residential colleges, "3" for cafes/specialty venues.
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          dict: A dictionary containing the dining locations.

        """
        logger.info(f"Fetching dining locations for category {category_id}.")
        response = self._make_request(
            self.DINING_LOCATIONS,
            params={"categoryId": category_id},
            fmt=fmt,
        )
        schema = self.schemas.get_dining_xsd()
        if not self.validate_xml(response, schema):
            logger.error(f"Invalid XML format for dining locations (category {category_id}).")
            raise ValueError(f"Invalid XML format for dining locations (category {category_id}).")
        return self._parse_xml(response)

    def get_all_category_locations(self, category_ids=None, fmt: str = "xml") -> dict:
        """Fetch dining locations from multiple categories and combine them.

        Args:
          category_ids (list): List of category IDs to fetch. Defaults to ["2", "3"].
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          dict: A dictionary containing combined dining locations from all categories.

        """
        if category_ids is None:
            category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

        logger.info(f"Fetching dining locations for categories: {', '.join(category_ids)}")

        all_locations = {"locations": {"location": []}}

        for category_id in category_ids:
            try:
                response = self.get_locations(category_id=category_id, fmt=fmt)
                if response and "locations" in response and "location" in response["locations"]:
                    locations = response["locations"]["location"]
                    if isinstance(locations, list):
                        all_locations["locations"]["location"].extend(locations)
                    else:
                        # If there's only one location, it might not be in a list
                        all_locations["locations"]["location"].append(locations)
                    logger.info(
                        f"Added {len(locations) if isinstance(locations, list) else 1} locations from category {category_id}"
                    )
            except Exception as e:
                logger.error(f"Error fetching locations for category {category_id}: {e}")

        return all_locations

    def get_events(self, place_id: str = "1007") -> dict:
        """Fetch dining venue open hours as an iCal stream for a given place_id.

        NOTE: "1007" seems to correspond to the Princeton Dining Calendar.
        NOTE: The API expects the parameters to be in camelCase.

        Remark: The response uses LF line-endings with a Content-Type of text/plain
        but is actually in iCal (text/calendar) format.

        Args:
          place_id (str): The ID of the dining venue.

        Returns:
          dict: Parsed iCal data with event details (summary, start time, end time, etc.).

        """
        logger.info(f"Fetching dining events for place_id: {place_id}.")
        params = {"placeID": place_id}
        response = self._make_request(self.DINING_EVENTS, params=params, fmt="ical")
        return self._parse_ical(response)

    def _fetch_and_decode_menu_from_api(self, location_id: str, menu_id: str) -> dict:
        """Helper to abstract the raw API call for menus."""
        params = {"locationID": location_id, "menuID": menu_id}
        try:
            response = self._make_request(self.DINING_MENU, params=params)
            logger.info(msg=f"Menu API response for {location_id}/{menu_id}: {response}")
            decoded_data = msj.decode(response)

            # If the response is a list, we need to extract the dictionary.
            if isinstance(decoded_data, list):
                for item in decoded_data:
                    # Return the first dictionary found (usually the second element after null)
                    if isinstance(item, dict):
                        return item
                # If the list contains no dicts, return empty dict to prevent AttributeError downstream
                return {}

            return decoded_data
        except Exception as e:
            logger.error(f"Error fetching menu from raw API for {location_id}/{menu_id}: {e}")
            return {}  # Return an empty dict on failure

    def _scrape_nutrition_data(self, url: str) -> dict:
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

        combined = self.get_all_category_locations(category_ids=category_ids, fmt="xml")
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

dining_api = DiningAPI()


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations(request):
    """Django view function to get dining locations."""
    try:
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        locations = dining_api.get_all_category_locations(category_ids)
        return Response(locations)
    except Exception as e:
        logger.error(f"Error in get_dining_locations view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_events(request):
    """Django view function to get dining events."""
    try:
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        date_str = request.GET.get("date", None)

        if date_str:
            events = get_dining_events_for_date(date_str, category_ids)
        else:
            events = get_all_dining_events(category_ids)

        return Response(events)
    except Exception as e:
        logger.error(f"Error in get_dining_events view: {e}")
        return Response({"error": str(e)}, status=500)


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
def get_menu_item_with_ratings(request, menu_item_id):
    """Get a menu item with its ratings.

    Args:
      request: The HTTP request.
      menu_item_id: The ID of the menu item.

    Returns:
      Response: The menu item with its ratings.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = MenuItemWithRatingsSerializer(menu_item, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def get_menu_item_ratings(request, menu_item_id):
    """Get all ratings for a menu item.

    Args:
      request: The HTTP request.
      menu_item_id: The ID of the menu item.

    Returns:
      Response: The ratings for the menu item.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    ratings = menu_item.ratings.all()
    serializer = MenuRatingSerializer(ratings, many=True)
    return Response(serializer.data)


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
        # Look up the item by its api_id (what the frontend receives)
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_menu_item_rating(request, menu_item_id):
    """Create a rating for a menu item.

    Args:
      request: The HTTP request.
      menu_item_id: The ID of the menu item.

    Returns:
      Response: The created rating.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    # Add menu_item to the request data
    data = request.data.copy()
    data["menu_item"] = menu_item.id

    serializer = MenuRatingCreateSerializer(data=data, context={"request": request})

    if serializer.is_valid():
        rating = serializer.save()
        return Response(MenuRatingSerializer(rating).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_rating(request, rating_id):
    """Get, update, or delete a rating.

    Args:
      request: The HTTP request.
      rating_id: The ID of the rating.

    Returns:
      Response: The response based on the action.

    """
    try:
        rating = MenuRating.objects.get(id=rating_id)
    except MenuRating.DoesNotExist:
        return Response({"error": "Rating not found"}, status=status.HTTP_44_NOT_FOUND)

    # Check if the user is the owner of the rating
    if rating.user != request.user:
        return Response(
            {"error": "You do not have permission to perform this action"},
            status=status.HTTP_403_FORBIDDEN,  # Corrected typo from 4OS
        )

    if request.method == "GET":
        serializer = MenuRatingSerializer(rating)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = MenuRatingCreateSerializer(rating, data=request.data, partial=True)

        if serializer.is_valid():
            updated_rating = serializer.save()
            return Response(MenuRatingSerializer(updated_rating).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # Corrected from 403

    elif request.method == "DELETE":
        rating.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_ratings(request):
    """Get all ratings by the current user.

    Args:
      request: The HTTP request.

    Returns:
      Response: The user's ratings.

    """
    ratings = MenuRating.objects.filter(user=request.user)
    serializer = MenuRatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_top_rated_menu_items(request):
    """Get the top-rated menu items.

    Args:
      request: The HTTP request.

    Returns:
      Response: The top-rated menu items.

    """
    # Get menu items with at least 3 ratings
    menu_items = (
        MenuItem.objects.annotate(avg_rating=models.Avg("ratings__rating"), num_ratings=models.Count("ratings"))
        .filter(num_ratings__gte=3)
        .order_by("-avg_rating")[:10]
    )

    serializer = MenuItemWithRatingsSerializer(menu_items, many=True, context={"request": request})
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


@api_view(["GET"])
def get_upvotes_bookmarks_for_menu_item(request, menu_item_id):
    """Get upvotes and bookmarks for a menu item.

    Args:
      request: The HTTP request.
      menu_item_id: The ID of the menu item.

    Returns:
      Response: The upvotes and bookmarks for the menu item.

    """
    try:
        claims = user_api.authenticate_request(request)
        if not claims:
            logger.error("Authentication failed in get_upvotes_bookmarks_for_menu_item view")
            return Response({"error": "Authentication required"}, status=401)

        menu_item = MenuItem.objects.get(api_id=menu_item_id)
        user = user_api.get_or_create_user(claims, create=False)
        if not user:
            logger.error("User not found in get_upvotes_bookmarks_for_menu_item view")
            return Response({"error": "User not found"}, status=404)

        upvotes = menu_item.upvote_count
        bookmarks = menu_item.bookmark_count
        has_user_upvoted = MenuItemUpvote.objects.filter(user=user, menu_item=menu_item).exists()
        has_user_bookmarked = MenuItemBookmark.objects.filter(user=user, menu_item=menu_item).exists()

        return Response(
            {
                "upvotes": upvotes,
                "bookmarks": bookmarks,
                "has_user_upvoted": has_user_upvoted,
                "has_user_bookmarked": has_user_bookmarked,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in get_upvotes_bookmarks_for_menu_item view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def post_upvotes_bookmarks_for_menu_item(request, menu_item_id):
    """Post upvotes or bookmarks for a menu item.

    Args:
      request: The HTTP request.
      menu_item_id: The ID of the menu item.

    Returns:
      Response: The response based on the action.

    """
    try:
        claims = user_api.authenticate_request(request)
        if not claims:
            logger.error("Authentication failed in post_upvotes_bookmarks_for_menu_item view")
            return Response({"error": "Authentication required"}, status=401)

        menu_item = MenuItem.objects.get(api_id=menu_item_id)
        user = user_api.get_or_create_user(claims, create=False)
        if not user:
            logger.error("User not found in post_upvotes_bookmarks_for_menu_item view")
            return Response({"error": "User not found"}, status=404)

        action = request.data.get("action")
        if action not in ["bookmark", "upvote"]:
            return Response({"error": "Invalid action"}, status=400)

        if action == "bookmark":
            existing_bookmark = MenuItemBookmark.objects.filter(user=user, menu_item=menu_item).first()
            if existing_bookmark:
                existing_bookmark.delete()
            else:
                MenuItemBookmark.objects.create(user=user, menu_item=menu_item)
            menu_item.bookmark_count = MenuItemBookmark.objects.filter(menu_item=menu_item).count()
            menu_item.save()

        if action == "upvote":
            existing_upvote = MenuItemUpvote.objects.filter(user=user, menu_item=menu_item).first()
            if existing_upvote:
                existing_upvote.delete()
            else:
                MenuItemUpvote.objects.create(user=user, menu_item=menu_item)
            menu_item.upvote_count = MenuItemUpvote.objects.filter(menu_item=menu_item).count()
            menu_item.save()

        new_upvotes = MenuItemUpvote.objects.filter(menu_item=menu_item).count()
        new_bookmarks = MenuItemBookmark.objects.filter(menu_item=menu_item).count()
        has_user_upvoted = MenuItemUpvote.objects.filter(user=user, menu_item=menu_item).exists()
        has_user_bookmarked = MenuItemBookmark.objects.filter(user=user, menu_item=menu_item).exists()

        return Response(
            {
                "upvotes": new_upvotes,
                "bookmarks": new_bookmarks,
                "has_user_upvoted": has_user_upvoted,
                "has_user_bookmarked": has_user_bookmarked,
            },
            status=200,
        )
    except Exception as e:
        logger.error(f"Error in post_upvotes_bookmarks_for_menu_item view: {e}")
        return Response({"error": str(e)}, status=500)


# Utility functions for working with dining data


def get_all_dining_locations(category_ids=None):
    """Fetch all dining locations and return them as a list of dictionaries.

    Args:
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      list: A list of dictionaries containing location information.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    dining = DiningAPI()
    try:
        # Use the new method to get locations from all categories
        response = dining.get_all_category_locations(category_ids)
        locations = []

        for location in response["locations"]["location"]:
            loc_info = {
                "name": location.get("name"),
                "map_name": location.get("mapName"),
                "dbid": location.get("dbid"),
                "latitude": location["geoloc"].get("lat"),
                "longitude": location["geoloc"].get("long"),
                "building_name": location["building"].get("name"),
            }

            # Handle both single and multiple amenities
            amenities_data = location["amenities"]["amenity"]
            if isinstance(amenities_data, list):
                loc_info["amenities"] = [amenity["name"] for amenity in amenities_data]
            else:
                loc_info["amenities"] = [amenities_data["name"]]

            locations.append(loc_info)

        logger.info(f"Retrieved {len(locations)} dining locations from categories: {', '.join(category_ids)}")
        return locations
    except Exception as e:
        logger.error(f"Error fetching dining locations: {e}")
        return []


def get_events_for_location(dbid, location_name):
    """Fetch events for a specific dining location.

    Args:
      dbid (str): The database ID of the location.
      location_name (str): The name of the location (for logging).

    Returns:
      list: A list of event dictionaries.

    """
    dining = DiningAPI()
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")
        events_data = dining.get_events(place_id=dbid)
        events = events_data.get("events", [])

        # Format the events for better readability
        formatted_events = []
        for event in events:
            formatted_event = {
                "summary": event.get("summary", "No Summary"),
                "start": event.get("start", "No Start Time"),
                "end": event.get("end", "No End Time"),
                "description": event.get("description", "No Description"),
            }
            formatted_events.append(formatted_event)

        logger.info(f"Retrieved {len(formatted_events)} events for {location_name}")
        return formatted_events
    except Exception as e:
        logger.error(f"Error fetching events for {location_name} (ID: {dbid}): {e}")
        return []


def get_events_for_location_with_date(dbid, location_name, date_str=None):
    """Fetch events for a specific dining location with an optional date filter.

    Args:
      dbid (str): The database ID of the location.
      location_name (str): The name of the location (for logging).
      date_str (str, optional): Date string in YYYY-MM-DD format. Defaults to None.

    Returns:
      list: A list of event dictionaries.

    """
    dining = DiningAPI()
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")

        # Try to add date parameter if provided
        params = {"placeId": dbid}
        if date_str:
            # Add date parameter if API supports it
            params["date"] = date_str
            logger.info(f"Using date parameter: {date_str}")

        # Use the standard get_events method
        events_data = dining.get_events(place_id=dbid)
        events = events_data.get("events", [])

        # Format the events for better readability
        formatted_events = []
        for event in events:
            formatted_event = {
                "summary": event.get("summary", "No Summary"),
                "start": event.get("start", "No Start Time"),
                "end": event.get("end", "No End Time"),
                "description": event.get("description", "No Description"),
            }

            # Filter by date if specified
            if date_str and isinstance(formatted_event["start"], datetime.datetime):
                event_date = formatted_event["start"].date()
                filter_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

                if event_date == filter_date:
                    formatted_events.append(formatted_event)
            else:
                formatted_events.append(formatted_event)

        logger.info(f"Retrieved {len(formatted_events)} events for {location_name}")
        return formatted_events
    except Exception as e:
        logger.error(f"Error fetching events for {location_name} (ID: {dbid}): {e}")
        return []


def analyze_date_range(all_location_events):
    """Analyze the date range of the events data.

    Args:
      all_location_events (dict): Dictionary mapping location names to events.

    Returns:
      tuple: (earliest_date, latest_date, total_days)

    """
    earliest_date = None
    latest_date = None

    # Collect all dates from all events
    all_dates = []

    for name, data in all_location_events.items():
        logger.info(f"Analyzing date range for {name}")

        events = data["events"]

        for event in events:
            start_time = event["start"]
            end_time = event["end"]

            if isinstance(start_time, datetime.datetime):
                all_dates.append(start_time.date())

            if isinstance(end_time, datetime.datetime):
                all_dates.append(end_time.date())

    # Find the earliest and latest dates
    if all_dates:
        earliest_date = min(all_dates)
        latest_date = max(all_dates)

        # Calculate the total number of days
        total_days = (latest_date - earliest_date).days + 1

        return (earliest_date, latest_date, total_days)

    return (None, None, 0)


def get_all_dining_events(category_ids=None):
    """Fetch events for all dining locations.

    Args:
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Fetching events for all dining locations in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations = get_all_dining_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location(dbid, name)
        all_location_events[name] = {"location_info": location, "events": events}

    return all_location_events


def get_dining_events_for_date(date_str, category_ids=None):
    """Fetch events for all dining locations for a specific date.

    Args:
      date_str (str): Date string in YYYY-MM-DD format.
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Fetching events for all dining locations on {date_str} in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations = get_all_dining_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location_with_date(dbid, name, date_str)
        all_location_events[name] = {"location_info": location, "events": events}

    return all_location_events


def convert_utc_to_eastern(dt):
    """Convert a UTC datetime to Eastern Time.

    Args:
      dt: A datetime object in UTC

    Returns:
      A datetime object in Eastern Time with proper timezone info

    """
    # If it's not a datetime object, return as is
    if not isinstance(dt, datetime.datetime):
        return dt

    # If the datetime has no timezone info, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)

    # Convert to Eastern Time
    eastern = pytz.timezone("US/Eastern")
    return dt.astimezone(eastern)


# For testing directly
if __name__ == "__main__":
    print("WARNING: This script should be run through Django's management command:")
    print("python manage.py test_dining")
    print("\nAttempting to run directly, but this may fail if Django is not properly configured.")

    # Try to set up Django environment
    import os
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
    try:
        django.setup()
        # Test getting all dining locations
        locations = get_all_dining_locations()
        print(f"Retrieved {len(locations)} dining locations")

        # Test getting all dining events
        events = get_all_dining_events()
        print(f"Retrieved events for {len(events)} dining locations")
    except Exception as e:
        print(f"Error: {e}")
        print("Please use the management command instead.")
