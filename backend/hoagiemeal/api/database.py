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
from typing import List, Optional, Dict, Any, Literal, Optional


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
        values: List[str],
        mode: Literal["include", "exclude"] = "include",
        qs: QuerySet,
    ) -> QuerySet:
        if mode == "include":
            return qs.filter(**{f"{field}__contains": values})
        elif mode == "exclude":
            return qs.exclude(**{f"{field}__overlap": values})

    def _apply_number_filter(
        self,
        *,
        field: str,
        amount: float | int,
        mode: Literal["exact", "greater", "less"],
        qs: QuerySet,
    ) -> QuerySet:
        if mode == "exact":
            return qs.filter(**{f"{field}__exact": amount})
        elif mode == "greater":
            return qs.filter(**{f"{field}__gte": amount})
        elif mode == "less":
            return qs.filter(**{f"{field}__lte": amount})

    def _get_single(self, model_cls: type[Model], **filters) -> Optional[Model]:
        qs = model_cls.objects.filter(**{k: v for k, v in filters.items() if v})
        return qs.first()

    def list_menu_items(
        self,
        *,
        order_by: str = "name",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["MenuItem"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE
        qs: QuerySet = MenuItem.objects.all()
        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

    def filter_menu_items(
        self,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        menu_id: Optional[int] = None,
        allergens: Optional[List[str]] = None,
        allergens_mode: Literal["include", "exclude"] = "include",
        ingredients: Optional[List[str]] = None,
        ingredients_mode: Literal["include", "exclude"] = "include",
        after: datetime.datetime | None = None,
        before: datetime.datetime | None = None,
        order_by: str = "name",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["MenuItem"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE
        qs: QuerySet = MenuItem.objects.all()

        qs = qs.filter(name__icontains=name) if name else qs
        qs = qs.filter(description__icontains=description) if description else qs
        qs = qs.filter(menu_id=menu_id) if menu_id else qs
        qs = self._apply_date_filter(after=after, before=before, qs=qs) if after or before else qs
        qs = (
            self._apply_array_filter(
                field="allergens", values=allergens, mode=allergens_mode, qs=qs
            )
            if allergens
            else qs
        )
        qs = (
            self._apply_array_filter(
                field="ingredients", values=ingredients, mode=ingredients_mode, qs=qs
            )
            if ingredients
            else qs
        )

        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

    def retrieve_menu_item(
        self,
        *,
        id: Optional[int] = None,
        api_id: Optional[str] = None,
        link: Optional[str] = None,
    ) -> Optional["MenuItem"]:
        if id is None and api_id is None and link is None:
            raise ValueError("At least one of id, api_id, or link must be provided.")
        return self._get_single(MenuItem, id=id, api_id=api_id, link=link)

    def list_menus(
        self,
        *,
        order_by: str = "date",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["Menu"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE
        qs: QuerySet = Menu.objects.all()
        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

    def filter_menus(
        self,
        *,
        dining_hall_id: Optional[int] = None,
        date: Optional[datetime.date] = None,
        last_fetched: Optional[datetime.datetime] = None,
        after: Optional[datetime.datetime] = None,
        before: Optional[datetime.datetime] = None,
        order_by: str = "date",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["Menu"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE
        qs: QuerySet = Menu.objects.all()

        qs = qs.filter(dining_hall_id=dining_hall_id) if dining_hall_id else qs
        qs = qs.filter(date=date) if date else qs
        qs = qs.filter(last_fetched__gte=last_fetched) if last_fetched else qs
        qs = self._apply_date_filter(after=after, before=before, qs=qs) if after or before else qs

        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

    def retrieve_menu(
        self,
        *,
        id: Optional[int] = None,
        dining_hall_id: Optional[int] = None,
        date: Optional[datetime.date] = None,
    ) -> Optional["Menu"]:
        if id is None and (dining_hall_id is None or date is None):
            raise ValueError("Either id or both dining_hall_id and date must be provided.")
        return self._get_single(Menu, id=id, dining_hall_id=dining_hall_id, date=date)

    def retrieve_menu_by_dining_hall_and_date(
        self, *, dining_hall_id: int, date: datetime.date
    ) -> Optional["Menu"]:
        return self._get_single(Menu, dining_hall_id=dining_hall_id, date=date)

    def list_dining_venues(self, *, order_by: str = "name") -> QuerySet["DiningVenue"]:
        qs: QuerySet = DiningVenue.objects.all()
        qs = qs.order_by(order_by)
        return qs

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
        qs = qs.filter(name__icontains=name) if name else qs
        qs = qs.filter(is_active=is_active) if is_active is not None else qs
        qs = qs.filter(building_name__icontains=building_name) if building_name else qs
        qs = (
            self._apply_array_filter(
                field="amenities", values=amenities, mode=amenities_mode, qs=qs
            )
            if amenities
            else qs
        )
        return qs

    def retrieve_dining_venue(
        self,
        *,
        id: int | None = None,
        name: str | None = None,
        database_id: str | None = None,
    ) -> Optional["DiningVenue"]:
        if id is None and name is None and database_id is None:
            raise ValueError("At least one of id, name, or database_id must be provided.")
        return self._get_single(DiningVenue, id=id, name=name, database_id=database_id)

    def list_users(
        self,
        *,
        order_by: str = "username",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["CustomUser"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE

        qs: QuerySet = CustomUser.objects.all()
        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

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
        order_by: str = "username",
        limit: Optional[int] = None,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ) -> QuerySet["CustomUser"] | Page:
        limit = limit if limit is not None else self.DEFAULT_LIMIT
        per_page = per_page if per_page is not None else self.DEFAULT_PER_PAGE

        qs: QuerySet = CustomUser.objects.all()
        qs = qs.filter(is_staff=is_staff) if is_staff is not None else qs
        qs = qs.filter(is_active=is_active) if is_active is not None else qs
        qs = qs.filter(class_year=class_year) if class_year else qs
        qs = (
            self._apply_array_filter(
                field="dietary_restrictions",
                values=dietary_restrictions,
                mode=dietary_restrictions_mode,
                qs=qs,
            )
            if dietary_restrictions
            else qs
        )
        qs = (
            self._apply_number_filter(
                field="dietary_profile__daily_calorie_goal",
                amount=daily_calorie_goal,
                mode=daily_calorie_goal_mode,
                qs=qs,
            )
            if daily_calorie_goal
            else qs
        )
        qs = (
            self._apply_number_filter(
                field="dietary_profile__daily_protein_goal",
                amount=daily_protein_goal,
                mode=daily_protein_goal_mode,
                qs=qs,
            )
            if daily_protein_goal
            else qs
        )
        qs = self._apply_date_filter(after=after, before=before, qs=qs) if after or before else qs

        qs = qs.order_by(order_by)
        qs = self._paginate(qs=qs, page=page, per_page=per_page) if page else qs
        qs = self._limit(qs=qs, limit=limit)
        return qs

    def retrieve_user(
        self,
        *,
        id: Optional[int] = None,
        username: Optional[str] = None,
        email: Optional[str] = None,
        net_id: Optional[str] = None,
    ) -> Optional["CustomUser"]:
        if id is None and username is None and email is None and net_id is None:
            raise ValueError("At least one of id, username, email, or net_id must be provided.")
        return self._get_single(CustomUser, id=id, username=username, email=email, net_id=net_id)

    def retrieve_menu_item_nutrients(
        self, *, id: Optional[int] = None, menu_item_id: Optional[int] = None
    ) -> Optional[MenuItemNutrient]:
        if id is None and menu_item_id is None:
            raise ValueError("At least one of id or menu_item_id must be provided.")
        return self._get_single(MenuItemNutrient, id=id, menu_item_id=menu_item_id)

    def retrieve_menu_item_rating(
        self, *, id: Optional[int] = None, menu_item_id: Optional[int] = None
    ) -> Optional[MenuRating]:
        if id is None and menu_item_id is None:
            raise ValueError("At least one of id or menu_item_id must be provided.")
        return self._get_single(MenuRating, id=id, menu_item_id=menu_item_id)

    def retrieve_user_dietary_profile(
        self, *, id: Optional[int] = None, user_id: Optional[int] = None
    ) -> Optional[UserDietaryProfile]:
        if id is None and user_id is None:
            raise ValueError("At least one of id or user_id must be provided.")
        return self._get_single(UserDietaryProfile, id=id, user_id=user_id)

    def retrieve_user_meal_plan(
        self, *, id: Optional[int] = None, user_id: Optional[int] = None
    ) -> Optional[UserMealPlan]:
        if id is None and user_id is None:
            raise ValueError("At least one of id or user_id must be provided.")
        return self._get_single(UserMealPlan, id=id, user_id=user_id)

    def create_dining_venue(
        self,
        *,
        name: str,
        database_id: Optional[str] = None,
        is_active: bool = True,
        building_name: Optional[str] = None,
        amenities: Optional[List[str]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Optional[DiningVenue]:
        existing_dining_venue = self.retrieve_dining_venue(name=name, database_id=database_id)
        if existing_dining_venue:
            return existing_dining_venue

        new_dining_venue = DiningVenue(
            name=name,
            database_id=database_id,
            is_active=is_active,
            building_name=building_name,
            amenities=amenities,
            latitude=latitude,
            longitude=longitude,
        )
        new_dining_venue.save()
        return new_dining_venue

    def create_menu(
        self,
        *,
        dining_hall_id: int,
        date: datetime.date,
        last_fetched: Optional[datetime.datetime] = None,
    ) -> Optional[Menu]:
        existing_menu = self.retrieve_menu_by_dining_hall_and_date(
            dining_hall_id=dining_hall_id, date=date
        )
        if existing_menu:
            return existing_menu

        new_menu = Menu(dining_hall_id=dining_hall_id, date=date, last_fetched=last_fetched)
        new_menu.save()
        return new_menu

    def create_menu_item(
        self,
        *,
        name: str,
        description: Optional[str] = None,
        menu_id: int,
        allergens: Optional[List[str]] = None,
        ingredients: Optional[List[str]] = None,
        api_id: Optional[str] = None,
        link: Optional[str] = None,
    ) -> Optional[MenuItem]:
        existing_item = self.retrieve_menu_item(api_id=api_id, link=link)
        if existing_item:
            return existing_item

        new_item = MenuItem(
            name=name,
            description=description,
            menu_id=menu_id,
            allergens=allergens,
            ingredients=ingredients,
            api_id=api_id,
            link=link,
        )
        new_item.save()
        return new_item

    def create_menu_item_nutrients(
        self,
        *,
        dict: Dict[str, Any],
        menu_item_id: int,
    ) -> Optional[MenuItemNutrient]:
        existing_nutrient = self.retrieve_menu_item_nutrients(menu_item_id=menu_item_id)
        if existing_nutrient:
            return existing_nutrient

        unallowed_fields = ["menu_item_id"]
        allowed_fields = {
            f.name
            for f in MenuItemNutrient._meta.get_fields()
            if f.name not in unallowed_fields and not f.auto_created and f.concrete
        }
        dict_allowed = {k: v for k, v in dict.items() if k in allowed_fields}
        new_nutrient = MenuItemNutrient(menu_item_id=menu_item_id, **dict_allowed)
        new_nutrient.save()
        return new_nutrient


if __name__ == "__main__":
    db_api = DatabaseAPI()

    new_dining_venue = db_api.create_dining_venue(
        name="Test Dining Hall",
        database_id=1,
        is_active=True,
        building_name="Test Building",
        amenities=["wifi", "outdoor_seating"],
        latitude=40.7128,
        longitude=-74.0060,
    )

    new_menu = db_api.create_menu(
        dining_hall_id=3, date=datetime.date.today(), last_fetched=datetime.datetime.now()
    )
    if new_menu:
        print(f"Added Menu: {new_menu.date} at Dining Hall ID: {new_menu.dining_hall_id}")

    new_menu_item = db_api.create_menu_item(
        name="Test Item",
        description="A test menu item",
        menu_id=5,
        allergens=["gluten"],
        ingredients=["wheat", "sugar"],
        api_id=1,
        link="http://example.com/test-item",
    )
    if new_menu_item:
        print(f"Added Menu Item: {new_menu_item.name}")

    new_menu_nutrients = db_api.create_menu_item_nutrients(
        dict={
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
        menu_item_id=3,
    )

    print("-" * 40)
    print("Menu Item Nutrients for Menu Item ID 3:")
    menu_item_nutrients = db_api.retrieve_menu_item_nutrients(menu_item_id=3)
    if menu_item_nutrients:
        print(model_to_dict(new_menu_nutrients))

    print("-" * 40)
    print("Menu Item with ID 3:")
    menu_item = db_api.retrieve_menu_item(id=3)
    if menu_item:
        print(model_to_dict(menu_item))

    print("-" * 40)
    print("Listing all dining venues:")
    dining_venues = db_api.list_dining_venues()
    for venue in dining_venues:
        print(model_to_dict(venue))

    print("-" * 40)
    print("Finding menus for dining hall ID 3:")
    menus = db_api.filter_menus(dining_hall_id=3, date=datetime.date.today())
    for menu in menus:
        print(model_to_dict(menu))
