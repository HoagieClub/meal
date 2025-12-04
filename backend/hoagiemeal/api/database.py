"""A collection of utility functions for Django models.

This module provides reusable functions for common database operations, including
filtering, pagination, caching, and CRUD (Create, Read, Update, Delete) operations.
It also includes specialized functions for data mapping and database-seeding tasks.

The functions are designed to be generic and type-safe, making them applicable
across different Django models.

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

import os
import sys
import django
from pathlib import Path
import decimal
import re


BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
django.setup()

from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.models.menu import MenuItem

from django.db.models import QuerySet, Model, Avg
from django.core.paginator import Paginator, Page
from django.core.cache import cache
from django.db import transaction, IntegrityError

import datetime
from typing import List, Dict, Any, Literal, Optional, TypeVar, Type, Tuple

T = TypeVar("T", bound=Model)


#################### Filtering, querying utility functions #########################


def paginate(qs: QuerySet, page: int, per_page: int) -> Page:
    """Paginates a Django QuerySet."""
    paginator = Paginator(qs, per_page)
    return paginator.page(page)


def limit(qs: QuerySet, limit: int) -> QuerySet:
    """Limits a QuerySet to a specific number of items."""
    return qs[:limit]


def cache_result(key: str, seconds: int, fn, *args, **kwargs):
    """Caches the result of a function call."""
    cached = cache.get(key)
    if cached:
        return cached
    value = fn(*args, **kwargs)
    cache.set(key, value, seconds)
    return value


def filter_by_datetime(
    qs: QuerySet[T],
    after: Optional[datetime.datetime] = None,
    before: Optional[datetime.datetime] = None,
) -> QuerySet[T]:
    """Filters a QuerySet based on a datetime range.

    Filters are applied to the 'created_at' field.

    Args:
      qs (QuerySet[T]): The QuerySet to filter.
      after (Optional[datetime.datetime]): The start of the datetime range (inclusive).
      before (Optional[datetime.datetime]): The end of the datetime range (inclusive).

    Returns:
      QuerySet[T]: The filtered QuerySet.
    """
    if after:
        qs = qs.filter(created_at__gte=after)
    if before:
        qs = qs.filter(created_at__lte=before)
    return qs


def filter_by_list(
    qs: QuerySet[T],
    field: str,
    values: List,
    mode: Literal["include", "exclude"] = "include",
) -> QuerySet[T]:
    """Filters a QuerySet to include or exclude items with a list-based field.

    This function is useful for filtering on ArrayField, JSONField, or other
    fields that store a list of values.

    Args:
      qs (QuerySet[T]): The QuerySet to filter.
      field (str): The name of the list field to filter on.
      values (List): The list of values to search for.
      mode (Literal["include", "exclude"]): Whether to include items
        containing any of the values or exclude items with any of the values.

    Returns:
      QuerySet[T]: The filtered QuerySet.
    """
    if mode == "include":
        qs = qs.filter(**{f"{field}__contains": values})
    elif mode == "exclude":
        qs = qs.exclude(**{f"{field}__overlap": values})
    return qs


def filter_by_quantity(
    field: str,
    quantity: float | int,
    mode: Literal["exact", "greater", "less"],
    qs: QuerySet[T],
) -> QuerySet[T]:
    """Filters a QuerySet based on a numeric field's quantity.

    Args:
      field (str): The name of the numeric field to filter on.
      quantity (float | int): The quantity value to filter against.
      mode (Literal["exact", "greater", "less"]): The comparison mode.
      qs (QuerySet[T]): The QuerySet to filter.

    Returns:
      QuerySet[T]: The filtered QuerySet.
    """
    lookup = {"exact": "exact", "greater": "gte", "less": "lte"}[mode]
    return qs.filter(**{f"{field}__{lookup}": quantity})


#################### Utility functions #########################


def highest_rated_menu_items(
    limit: int = 10,
    after: Optional[datetime.datetime] = None,
    before: Optional[datetime.datetime] = None,
    highest_first: bool = True,
) -> List[MenuItem]:
    """Gets the highest or lowest rated menu items within a time range.

    This function filters menu items that have ratings, annotates them with
    an average rating, and orders them accordingly.

    Args:
      limit (int): The maximum number of menu items to return.
      after (Optional[datetime.datetime]): The start date for the rating filter.
      before (Optional[datetime.datetime]): The end date for the rating filter.
      highest_first (bool): If True, returns the highest-rated items; otherwise,
        returns the lowest-rated items.

    Returns:
      List[MenuItem]: A list of MenuItem objects.
    """
    qs = MenuItem.objects.all()
    ratings_filter_kwargs = {}
    if after:
        ratings_filter_kwargs["ratings__created_at__gte"] = after
    if before:
        ratings_filter_kwargs["ratings__created_at__lte"] = before

    qs = qs.filter(**ratings_filter_kwargs)
    qs = qs.annotate(avg_rating=Avg("ratings__rating"))
    qs = qs.exclude(avg_rating__isnull=True)

    if highest_first:
        qs = qs.order_by("-avg_rating")
    else:
        qs = qs.order_by("avg_rating")
    return list(qs[:limit])


#################### Utility functions for uploading API to database #########################


def get_mapped_dining_venue_data(api_data: Dict[str, Any]) -> Dict[str, Any]:
    """Maps raw API data to a format suitable for the DiningVenue model.

    This function extracts and cleans data from a dining API response,
    preparing it for use in model creation or updating functions.

    Args:
      api_data (Dict[str, Any]): The raw data dictionary from the API.

    Returns:
      Dict[str, Any]: A dictionary containing lookup and creation arguments.
    """
    amenity_names: List[str] = []
    amenities_data = api_data.get("amenities", {})

    if amenities_data and isinstance(amenities_data.get("amenity"), list):
        for amenity in amenities_data["amenity"]:
            name = amenity.get("name")
            if name:
                amenity_names.append(name)

    lookup_kwargs = {
        "database_id": api_data.get("dbid"),
        "name": api_data.get("name"),
    }

    create_kwargs = {
        "map_name": api_data.get("mapName"),
        "latitude": decimal.Decimal(api_data.get("geoloc", {}).get("lat", "0.0")),
        "longitude": decimal.Decimal(api_data.get("geoloc", {}).get("long", "0.0")),
        "building_name": api_data.get("building", {}).get("name"),
        "amenities": amenity_names,
        "operation_hours": None,
    }

    return {
        "lookup_kwargs": lookup_kwargs,
        "create_kwargs": create_kwargs,
        "kwargs": lookup_kwargs | create_kwargs,
    }


def get_mapped_menu_item_data(api_data: Dict[str, Any], link_data: Dict[str, Any]):
    """Maps raw API menu item data to a format for the MenuItem model.

    This function handles parsing nested data, extracting allergens from the
    description, and merging information from different API sources.

    Args:
      api_data (Dict[str, Any]): The raw menu item data from the API.
      link_data (Dict[str, Any]): The linked nutritional data for the item.

    Returns:
      Dict[str, Any]: A dictionary containing lookup and creation arguments.
    """
    description = api_data.get("description", "")
    allergen_match = re.search(r"Allergens: (.+)", description)
    allergens_from_desc: List[str] = []
    if allergen_match:
        allergens_from_desc = [a.strip() for a in allergen_match.group(1).split(",")]

    ingredients: List[str] = link_data.get("Ingredients", [])
    allergens_from_link: List[str] = link_data.get("Allergens", [])

    allergens = allergens_from_link if allergens_from_link else allergens_from_desc

    lookup_kwargs = {"api_id": api_data.get("id")}

    create_kwargs = {
        "name": api_data.get("name"),
        "description": description,
        "link": api_data.get("link"),
        "allergens": allergens,
        "ingredients": ingredients,
        "calories": link_data.get("Calories"),
    }

    return {
        "lookup_kwargs": lookup_kwargs,
        "create_kwargs": create_kwargs,
        "kwargs": lookup_kwargs | create_kwargs,
    }


def get_mapped_menu_item_nutrient_data(menu_item_id: int, link_data: Dict[str, Any]) -> Dict[str, Any]:
    """Maps nutritional data from an API link to the MenuItemNutrient model.

    This function extracts and converts nutritional values, handling missing
    or invalid data gracefully.

    Args:
      menu_item_id (int): The ID of the parent MenuItem object.
      link_data (Dict[str, Any]): The raw nutritional data.

    Returns:
      Dict[str, Any]: A dictionary containing lookup and creation arguments.
    """

    def _safe_float_to_decimal(value: Any) -> decimal.Decimal | None:
        try:
            if isinstance(value, str) and "%" in value:
                value = value.replace("%", "").strip()
            if not value:
                return None
            return decimal.Decimal(str(value))
        except (decimal.InvalidOperation, ValueError):
            return None

    serving_size_str = link_data.get("Serving Size", "")

    serving_size_unit_match = re.search(r"([\d\./]+)\s*(.*)", serving_size_str)

    serving_size = None
    serving_unit = None
    if serving_size_unit_match:
        serving_size = serving_size_unit_match.group(1).strip()
        serving_unit = serving_size_unit_match.group(2).strip()

    lookup_kwargs = {"menu_item_id": menu_item_id}

    create_kwargs = {
        "serving_size": serving_size,
        "serving_unit": serving_unit,
        "calories": link_data.get("Calories"),
        "calories_from_fat": link_data.get("Calories from Fat"),
        "total_fat": _safe_float_to_decimal(link_data.get("Fat", {}).get("Total Fat", {}).get("Amount")),
        "saturated_fat": _safe_float_to_decimal(link_data.get("Fat", {}).get("Saturated Fat", {}).get("Amount")),
        "trans_fat": _safe_float_to_decimal(link_data.get("Fat", {}).get("Trans Fat", {}).get("Amount")),
        "cholesterol": _safe_float_to_decimal(link_data.get("Cholesterol", {}).get("Amount")),
        "sodium": _safe_float_to_decimal(link_data.get("Sodium", {}).get("Amount")),
        "total_carbohydrates": _safe_float_to_decimal(
            link_data.get("Carbohydrates", {}).get("Total Carbohydrates", {}).get("Amount")
        ),
        "dietary_fiber": _safe_float_to_decimal(
            link_data.get("Carbohydrates", {}).get("Dietary Fiber", {}).get("Amount")
        ),
        "sugars": _safe_float_to_decimal(link_data.get("Carbohydrates", {}).get("Sugar", {}).get("Amount")),
        "protein": _safe_float_to_decimal(link_data.get("Protein", {}).get("Amount")),
        "vitamin_d": _safe_float_to_decimal(link_data.get("Vitamins", {}).get("Vitamin D", {}).get("Amount")),
        "potassium": _safe_float_to_decimal(link_data.get("Vitamins", {}).get("Potassium", {}).get("Amount")),
        "calcium": _safe_float_to_decimal(link_data.get("Vitamins", {}).get("Calcium", {}).get("Amount")),
        "iron": _safe_float_to_decimal(link_data.get("Vitamins", {}).get("Iron", {}).get("Amount")),
    }

    return {
        "lookup_kwargs": lookup_kwargs,
        "create_kwargs": create_kwargs,
        "kwargs": lookup_kwargs | create_kwargs,
    }


def insert_dining_venue_data(category_ids: Optional[List[int]] = None) -> None:
    """Inserts dining venue data from the API into the database.

    This function orchestrates the process of fetching data from the API,
    mapping it to the model's format, and using the bulk_get_and_create
    utility to insert the records. It first clears the entire table for a fresh
    sync.

    Args:
      category_ids (Optional[List[int]]): A list of dining category IDs to fetch.
    """
    from hoagiemeal.api.dining import DiningAPI

    dining_api = DiningAPI()
    dining_venue_data = dining_api.get_all_category_locations(category_ids=category_ids)
    dining_venue_data = dining_venue_data.get("locations", {}).get("location", [])

    dining_venues = []
    for venue in dining_venue_data:
        mapped_data = get_mapped_dining_venue_data(venue)
        dining_venues.append(mapped_data["kwargs"])
    bulk_get_and_create(DiningVenue, dining_venues, ["database_id"])


if __name__ == "__main__":
    clear_table(DiningVenue)
    insert_dining_venue_data()
