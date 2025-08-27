import os
from sqlite3 import dbapi2
import sys
import django
from pathlib import Path

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


#################### Filtering, querying, creating #########################


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

