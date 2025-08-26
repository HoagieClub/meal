import os
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

from django.db.models import QuerySet
from django.core.paginator import Paginator, Page
from django.core.cache import cache
from django.db.models import Model
from django.forms.models import model_to_dict

import datetime
from typing import List, Optional, Dict, Any, Literal, Optional, TypeVar, Type

T = TypeVar("T", bound=Model)


class DatabaseAPI:
    """Database API for interacting with the HoagieMeal database."""

    def __init__(self):
        self.DEFAULT_PER_PAGE = 50
        self.DEFAULT_LIMIT = 50
        self.MAX_LIMIT = 1000
        self.TIMEOUT = 10

    """Static helper methods for pagination, limiting, caching, filtering, etc."""

    @staticmethod
    def _paginate(qs: QuerySet, page: int, per_page: int) -> Page:
        paginator = Paginator(qs, per_page)
        return paginator.page(page)

    @staticmethod
    def _limit(qs: QuerySet, limit: int) -> QuerySet:
        return qs[:limit]

    @staticmethod
    def _cache(key: str, seconds: int, fn, *args, **kwargs):
        cached = cache.get(key)
        if cached:
            return cached
        value = fn(*args, **kwargs)
        cache.set(key, value, seconds)
        return value

    def _apply_date_filter(
        self,
        *,
        after: Optional[datetime.datetime] = None,
        before: Optional[datetime.datetime] = None,
        qs: QuerySet,
    ) -> QuerySet:
        if after:
            qs = qs.filter(created_at__gte=after)
        if before:
            qs = qs.filter(created_at__lte=before)
        return qs

    def _apply_array_filter(
        self,
        *,
        field: str,
        values: Optional[List[str]] = None,
        mode: Literal["include", "exclude"] = "include",
        qs: QuerySet,
    ) -> QuerySet:
        if mode not in ["include", "exclude"]:
            raise ValueError("Mode must be either 'include' or 'exclude'.")
        if not values:
            return qs
        if mode == "include":
            return qs.filter(**{f"{field}__contains": values})
        return qs.exclude(**{f"{field}__overlap": values})

    def _apply_number_filter(
        self,
        *,
        field: str,
        amount: float | int | None = None,
        mode: Literal["exact", "greater", "less"],
        qs: QuerySet,
    ) -> QuerySet:
        if amount is None:
            return qs
        if mode not in ["exact", "greater", "less"]:
            raise ValueError("Mode must be either 'exact', 'greater', or 'less'.")
        lookup = {"exact": "exact", "greater": "gte", "less": "lte"}[mode]
        return qs.filter(**{f"{field}__{lookup}": amount})

    def _get_single(self, model_cls: Type[T], **filters) -> Optional[T]:
        if not filters or all(v is None for v in filters.values()):
            raise ValueError("At least one filter must be provided.")
        qs = model_cls.objects.filter(**{k: v for k, v in filters.items() if v})
        return qs.first()

    def _apply_pagination_and_limiting(
        self,
        qs: QuerySet,
        limit: Optional[int],
        page: Optional[int],
        per_page: Optional[int],
    ) -> QuerySet | Page:
        if limit is None:
            limit = self.DEFAULT_LIMIT
        limit = min(limit, self.MAX_LIMIT)
        if per_page is None:
            per_page = self.DEFAULT_PER_PAGE
        if limit is not None and page is not None:
            raise ValueError("Cannot perform both limiting and pagination simultaneously.")
        if page is not None:
            return self._paginate(qs=qs, page=page, per_page=per_page)
        return self._limit(qs=qs, limit=limit)

    def list_menu_items(
        self,
        *,
        order_by: str = "name",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["MenuItem"] | Page:
        qs: QuerySet = MenuItem.objects.all().order_by(order_by)
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def filter_menu_items(
        self,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        menu_id: Optional[int] = None,
        allergens: Optional[List[str]] = None,
        allergens_mode: Optional[Literal["include", "exclude"]] = "include",
        ingredients: Optional[List[str]] = None,
        ingredients_mode: Optional[Literal["include", "exclude"]] = "include",
        after: Optional[datetime.datetime] = None,
        before: Optional[datetime.datetime] = None,
        order_by: Optional[str] = "name",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["MenuItem"] | Page:
        qs: QuerySet = MenuItem.objects.all().order_by(order_by or "name")
        if name is not None:
            qs = qs.filter(name__icontains=name)
        if description is not None:
            qs = qs.filter(description__icontains=description)
        if menu_id is not None:
            qs = qs.filter(menu_id=menu_id)
        qs = self._apply_date_filter(after=after, before=before, qs=qs)
        qs = self._apply_array_filter(
            field="allergens", values=allergens, mode=allergens_mode or "include", qs=qs
        )
        qs = self._apply_array_filter(
            field="ingredients",
            values=ingredients,
            mode=ingredients_mode or "include",
            qs=qs,
        )
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def retrieve_menu_item(
        self,
        *,
        id: Optional[int] = None,
        api_id: Optional[int] = None,
        link: Optional[str] = None,
    ) -> Optional["MenuItem"]:
        return self._get_single(MenuItem, id=id, api_id=api_id, link=link)

    def list_menus(
        self,
        *,
        order_by: str = "date",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["Menu"] | Page:
        qs: QuerySet = Menu.objects.all().order_by(order_by)
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def filter_menus(
        self,
        *,
        dining_venue_id: Optional[int] = None,
        date: Optional[datetime.date] = None,
        last_fetched: Optional[datetime.datetime] = None,
        after: Optional[datetime.datetime] = None,
        before: Optional[datetime.datetime] = None,
        order_by: Optional[str] = "date",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["Menu"] | Page:
        qs: QuerySet = Menu.objects.all().order_by(order_by)
        if dining_venue_id is not None:
            qs = qs.filter(dining_venue_id=dining_venue_id)
        if date is not None:
            qs = qs.filter(date=date)
        if last_fetched is not None:
            qs = qs.filter(last_fetched__gte=last_fetched)
        qs = self._apply_date_filter(after=after, before=before, qs=qs)
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def retrieve_menu(
        self,
        *,
        id: Optional[int] = None,
        dining_venue_id: Optional[int] = None,
        date: Optional[datetime.date] = None,
    ) -> Optional["Menu"]:
        return self._get_single(Menu, id=id, dining_venue_id=dining_venue_id, date=date)

    def list_dining_venues(self, *, order_by: str = "name") -> QuerySet["DiningVenue"]:
        return DiningVenue.objects.all().order_by(order_by)

    def filter_dining_venues(
        self,
        *,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
        building_name: Optional[str] = None,
        amenities: Optional[List[str]] = None,
        amenities_mode: Literal["include", "exclude"] = "include",
    ) -> QuerySet["DiningVenue"]:
        qs: QuerySet = DiningVenue.objects.all()
        if name:
            qs = qs.filter(name__icontains=name)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if building_name:
            qs = qs.filter(building_name__icontains=building_name)
        qs = self._apply_array_filter(
            field="amenities", values=amenities, mode=amenities_mode, qs=qs
        )
        return qs

    def retrieve_dining_venue(
        self,
        *,
        id: Optional[int] = None,
        name: Optional[str] = None,
        database_id: Optional[int] = None,
    ) -> Optional["DiningVenue"]:
        return self._get_single(DiningVenue, id=id, name=name, database_id=database_id)

    def list_users(
        self,
        *,
        order_by: Optional[str] = "username",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["CustomUser"] | Page:
        qs: QuerySet = CustomUser.objects.all().order_by(order_by)
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def filter_users(
        self,
        *,
        is_staff: Optional[bool] = None,
        is_active: Optional[bool] = None,
        class_year: Optional[str] = None,
        dietary_restrictions: Optional[List[str]] = None,
        dietary_restrictions_mode: Literal["include", "exclude"] = "include",
        daily_calorie_goal: Optional[int] = None,
        daily_calorie_goal_mode: Literal["exact", "greater", "less"] = "greater",
        daily_protein_goal: Optional[int] = None,
        daily_protein_goal_mode: Literal["exact", "greater", "less"] = "greater",
        after: Optional[datetime.datetime] = None,
        before: Optional[datetime.datetime] = None,
        order_by: Optional[str] = "username",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["CustomUser"] | Page:
        qs: QuerySet = CustomUser.objects.all().order_by(order_by)
        if is_staff is not None:
            qs = qs.filter(is_staff=is_staff)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if class_year:
            qs = qs.filter(class_year=class_year)
        qs = self._apply_array_filter(
            field="dietary_restrictions",
            values=dietary_restrictions,
            mode=dietary_restrictions_mode,
            qs=qs,
        )
        qs = self._apply_number_filter(
            field="dietary_profile__daily_calorie_goal",
            amount=daily_calorie_goal,
            mode=daily_calorie_goal_mode,
            qs=qs,
        )
        qs = self._apply_number_filter(
            field="dietary_profile__daily_protein_goal",
            amount=daily_protein_goal,
            mode=daily_protein_goal_mode,
            qs=qs,
        )
        qs = self._apply_date_filter(after=after, before=before, qs=qs) if after or before else qs
        return self._apply_pagination_and_limiting(qs=qs, limit=limit, page=page, per_page=per_page)

    def retrieve_user(
        self,
        *,
        id: Optional[int] = None,
        username: Optional[str] = None,
        email: Optional[str] = None,
        net_id: Optional[str] = None,
    ) -> Optional["CustomUser"]:
        return self._get_single(CustomUser, id=id, username=username, email=email, net_id=net_id)

    def retrieve_menu_item_nutrients(
        self, *, id: Optional[int] = None, menu_item_id: Optional[int] = None
    ) -> Optional[MenuItemNutrient]:
        return self._get_single(MenuItemNutrient, id=id, menu_item_id=menu_item_id)

    def retrieve_menu_item_rating(
        self, *, id: Optional[int] = None, menu_item_id: Optional[int] = None
    ) -> Optional[MenuRating]:
        return self._get_single(MenuRating, id=id, menu_item_id=menu_item_id)

    def retrieve_user_dietary_profile(
        self, *, id: Optional[int] = None, user_id: Optional[int] = None
    ) -> Optional[UserDietaryProfile]:
        return self._get_single(UserDietaryProfile, id=id, user_id=user_id)

    def retrieve_user_meal_plan(
        self, *, id: Optional[int] = None, user_id: Optional[int] = None
    ) -> Optional[UserMealPlan]:
        return self._get_single(UserMealPlan, id=id, user_id=user_id)

    def create_dining_venue(
        self,
        *,
        name: str,
        database_id: int,
        is_active: Optional[bool] = True,
        building_name: Optional[str] = None,
        amenities: Optional[List[str]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Optional[DiningVenue]:
        lookup_kwargs = {"name": name, "database_id": database_id}
        defaults = {
            "is_active": is_active,
            "building_name": building_name,
            "amenities": amenities,
            "latitude": latitude,
            "longitude": longitude,
        }
        dining_venue, created = DiningVenue.objects.get_or_create(
            **lookup_kwargs, defaults=defaults
        )
        return dining_venue

    def create_menu(
        self,
        *,
        dining_venue_id: int,
        date: datetime.date,
        last_fetched: Optional[datetime.datetime] = None,
    ) -> Menu:
        lookup_kwargs = {
            "dining_venue_id": dining_venue_id,
            "date": date,
        }
        defaults = {
            "last_fetched": last_fetched,
        }
        menu, created = Menu.objects.get_or_create(**lookup_kwargs, defaults=defaults)
        return menu

    def create_menu_item(
        self,
        *,
        name: str,
        menu_id: int,
        description: Optional[str] = None,
        allergens: Optional[List[str]] = None,
        ingredients: Optional[List[str]] = None,
        api_id: int,
        link: str,
    ) -> MenuItem:
        lookup_kwargs = {"api_id": api_id, "link": link, "menu_id": menu_id, "name": name}
        defaults = {
            "name": name,
            "menu_id": menu_id,
            "description": description,
            "allergens": allergens,
            "ingredients": ingredients,
            "api_id": api_id,
            "link": link,
        }
        menu_item, created = MenuItem.objects.get_or_create(**lookup_kwargs, defaults=defaults)
        return menu_item

    def create_menu_item_nutrients(
        self,
        *,
        nutrient_data: Dict[str, Any],
        menu_item_id: int,
    ) -> MenuItemNutrient:
        allowed_fields = [
            "serving_size",
            "serving_unit",
            "calories",
            "calories_from_fat",
            "total_fat",
            "saturated_fat",
            "trans_fat",
            "cholesterol",
            "sodium",
            "total_carbohydrates",
            "dietary_fiber",
            "sugars",
            "protein",
            "vitamin_d",
            "potassium",
            "calcium",
            "iron",
        ]
        defaults = {k: v for k, v in nutrient_data.items() if k in allowed_fields}
        menu_item_nutrient, created = MenuItemNutrient.objects.get_or_create(
            menu_item_id=menu_item_id,
            defaults=defaults,
        )
        return menu_item_nutrient


def first_test():
    db_api = DatabaseAPI()
    MenuItemNutrient.objects.all().delete()
    MenuItem.objects.all().delete()
    Menu.objects.all().delete()
    DiningVenue.objects.all().delete()

    test_dining_venue = db_api.create_dining_venue(
        name="Test Dining Venue",
        database_id=1,
        is_active=True,
        building_name="Test Building",
        amenities=["wifi", "outdoor_seating"],
        latitude=40.7128,
        longitude=-74.0060,
    )
    print(f"Added Dining Venue: {test_dining_venue.name}")

    test_menu = db_api.create_menu(
        dining_venue_id=test_dining_venue.database_id,
        date=datetime.date.today(),
        last_fetched=datetime.datetime.now(),
    )
    print(f"Added Menu: {test_menu.id}")

    test_menu_item = db_api.create_menu_item(
        name="Test Item",
        description="A delicious test item",
        allergens=["nuts", "dairy"],
        ingredients=["ingredient1", "ingredient2"],
        menu_id=test_menu.id,
        api_id=1,
        link="http://example.com/test-item",
    )
    print(f"Added Menu Item: {test_menu_item.name}")

    test_menu_item_nutrients = db_api.create_menu_item_nutrients(
        nutrient_data={
            "serving_size": "1 cup",
            "serving_unit": "cup",
            "calories": 250,
            "calories_from_fat": 100,
            "total_fat": 11.5,
            "saturated_fat": 3,
            "trans_fat": 0.5,
            "cholesterol": 30,
            "sodium": 200,
            "total_carbohydrates": 30.0,
            "dietary_fiber": 2.0,
            "sugars": 15.0,
            "protein": 5.0,
            "vitamin_d": 0.0,
            "potassium": 350.0,
            "calcium": 200.0,
            "iron": 1.0,
        },
        menu_item_id=test_menu_item.id,
    )
    print(f"Added Nutrients for Menu Item ID: {test_menu_item_nutrients.menu_item_id}")

    print("-" * 40)
    print(f"Menu Item Nutrients for Menu Item ID {test_menu_item.id}:")
    menu_item_nutrients = db_api.retrieve_menu_item_nutrients(menu_item_id=test_menu_item.id)
    print(model_to_dict(menu_item_nutrients))

    print("-" * 40)
    print(f"Menu Item with ID: {test_menu_item.id}")
    menu_item = db_api.retrieve_menu_item(id=test_menu_item.id)
    print(model_to_dict(menu_item))

    print("-" * 40)
    print("Listing all dining venues:")
    dining_venues = db_api.list_dining_venues()
    for venue in dining_venues:
        print(model_to_dict(venue))

    print("-" * 40)
    print(f"Finding menus for dining hall ID: {test_dining_venue.database_id}")
    menus = db_api.filter_menus(dining_venue_id=test_dining_venue.database_id)
    for menu in menus:
        print(model_to_dict(menu))


if __name__ == "__main__":
    first_test()
