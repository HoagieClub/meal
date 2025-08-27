import os
import sys
import django
from pathlib import Path
import decimal
import re
import requests


BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
django.setup()

from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.models.menu import MenuItem, Menu, MenuItemNutrient, MenuRating
from hoagiemeal.models.meal_plan import MealPlanType, UserMealPlan, SwipeTransactionIndividual
from hoagiemeal.models.user import CustomUser, UserDietaryProfile

from django.db.models import QuerySet, Model, Avg
from django.core.paginator import Paginator, Page
from django.core.cache import cache
from django.db import transaction

import datetime
from typing import List, Optional, Dict, Any, Literal, Optional, TypeVar, Type, Tuple

T = TypeVar("T", bound=Model)


#################### Filtering, querying utility functions #########################


def paginate(qs: QuerySet, page: int, per_page: int) -> Page:
    paginator = Paginator(qs, per_page)
    return paginator.page(page)


def limit(qs: QuerySet, limit: int) -> QuerySet:
    return qs[:limit]


def cache(key: str, seconds: int, fn, *args, **kwargs):
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
    lookup = {"exact": "exact", "greater": "gte", "less": "lte"}[mode]
    return qs.filter(**{f"{field}__{lookup}": quantity})


#################### Creating, updating, deleting, etc. utility functions #########################


def get_or_create(
    model_class: Type[T], lookup_kwargs: Dict[str, Any], **create_kwargs: Any
) -> Tuple[T, bool]:
    existing_object = model_class.objects.filter(**lookup_kwargs).first()
    if existing_object:
        return existing_object, False
    else:
        full_creation_data = {**lookup_kwargs, **create_kwargs}
        new_object = model_class.objects.create(**full_creation_data)
        return new_object, True


def bulk_get_and_create(
    model_class: Type[T], data_list: List[Dict[str, Any]], lookup_fields: List[str]
) -> List[Tuple[T, bool]]:
    results = []
    with transaction.atomic():
        for item_data in data_list:
            lookup_kwargs = {field: item_data[field] for field in lookup_fields}
            instance, created = model_class.objects.get_or_create(
                **lookup_kwargs, defaults=item_data
            )
            results.append((instance, created))
    return results


def update(
    model_class: Type[T], lookup_kwargs: Dict[str, Any], update_data: Dict[str, Any]
) -> Optional[T]:
    try:
        with transaction.atomic():
            instance = model_class.objects.get(**lookup_kwargs)
            for field_name, value in update_data.items():
                if hasattr(instance, field_name):
                    setattr(instance, field_name, value)
            instance.save()
            return instance
    except model_class.DoesNotExist:
        return None


def delete(model_class: Type[T], lookup_kwargs: Dict[str, Any]) -> Tuple[int, Dict[str, int]]:
    return model_class.objects.filter(**lookup_kwargs).delete()


def clear_table(model_class: Type[T]) -> None:
    model_class.objects.all().delete()


def highest_rated_menu_items(
    limit: int = 10,
    after: Optional[datetime.datetime] = None,
    before: Optional[datetime.datetime] = None,
    highest_first: bool = True,
) -> List[MenuItem]:
    qs = MenuItem.objects.all()
    ratings_filter_kwargs = {}
    if after:
        ratings_filter_kwargs["menurating_set__created_at__gte"] = after
    if before:
        ratings_filter_kwargs["menurating_set__created_at__lte"] = before

    qs = qs.filter(**ratings_filter_kwargs)
    qs = qs.annotate(avg_rating=Avg("menurating_set__rating"))
    qs = qs.exclude(avg_rating__isnull=True)

    if highest_first:
        qs = qs.order_by("-avg_rating")
    else:
        qs = qs.order_by("avg_rating")
    return list(qs[:limit])


#################### Utility functions for uploading to database #########################


def get_mapped_dining_venue_data(api_data: Dict[str, Any]) -> Dict[str, Any]:
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


def get_mapped_menu_item_data(api_data: Dict[str, Any], link_data: Dict[str, Any], menu_id: int):
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
        "menu_id": menu_id,
    }

    return {
        "lookup_kwargs": lookup_kwargs,
        "create_kwargs": create_kwargs,
        "kwargs": lookup_kwargs | create_kwargs,
    }


def get_mapped_menu_item_nutrient_data(
    menu_item_id: int, link_data: Dict[str, Any]
) -> Dict[str, Any]:

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
    serving_size_unit_match = re.search(r"([0-9.]+)\s*([a-zA-Z/]+)", serving_size_str)
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
        "total_fat": _safe_float_to_decimal(
            link_data.get("Fat", {}).get("Total Fat", {}).get("Amount")
        ),
        "saturated_fat": _safe_float_to_decimal(
            link_data.get("Fat", {}).get("Saturated Fat", {}).get("Amount")
        ),
        "trans_fat": _safe_float_to_decimal(
            link_data.get("Fat", {}).get("Trans Fat", {}).get("Amount")
        ),
        "cholesterol": _safe_float_to_decimal(link_data.get("Cholesterol", {}).get("Amount")),
        "sodium": _safe_float_to_decimal(link_data.get("Sodium", {}).get("Amount")),
        "total_carbohydrates": _safe_float_to_decimal(
            link_data.get("Carbohydrates", {}).get("Total Carbohydrates", {}).get("Amount")
        ),
        "dietary_fiber": _safe_float_to_decimal(
            link_data.get("Carbohydrates", {}).get("Dietary Fiber", {}).get("Amount")
        ),
        "sugars": _safe_float_to_decimal(
            link_data.get("Carbohydrates", {}).get("Sugar", {}).get("Amount")
        ),
        "protein": _safe_float_to_decimal(link_data.get("Protein", {}).get("Amount")),
        "vitamin_d": _safe_float_to_decimal(
            link_data.get("Vitamins", {}).get("Vitamin D", {}).get("Amount")
        ),
        "potassium": _safe_float_to_decimal(
            link_data.get("Vitamins", {}).get("Potassium", {}).get("Amount")
        ),
        "calcium": _safe_float_to_decimal(
            link_data.get("Vitamins", {}).get("Calcium", {}).get("Amount")
        ),
        "iron": _safe_float_to_decimal(link_data.get("Vitamins", {}).get("Iron", {}).get("Amount")),
    }

    return {
        "lookup_kwargs": lookup_kwargs,
        "create_kwargs": create_kwargs,
        "kwargs": lookup_kwargs | create_kwargs,
    }


def insert_dining_venue_data(category_ids: Optional[List[int]] = None) -> None:
    clear_table(DiningVenue)
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
    insert_dining_venue_data()
