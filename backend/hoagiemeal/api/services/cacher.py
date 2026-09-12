"""Serve menus, menu items and locations from the database, scraping whatever is missing or stale."""

import datetime
from collections import defaultdict
from typing import Optional
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from hoagiemeal.api.services.scraper import Scraper, collect_menu_item_ids
from hoagiemeal.models.dining import DiningLocation
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.serializers import DiningLocationSerializer, MenuItemSerializer
from hoagiemeal.utils.logger import logger

# Princeton edits menus for today and upcoming days throughout the day (soups come and go, items
# get swapped), so stored menus are only trusted this long before being re-scraped. Past days
# are frozen.
MENU_REFRESH_AFTER = datetime.timedelta(hours=2)
# Nutrition labels change when recipes are edited. The seed job re-checks labels older than this.
ITEM_REFRESH_AFTER = datetime.timedelta(days=1)
# A label that could not be fetched is not retried for this long, so one broken label cannot
# slow down every request.
MISSING_ITEM_BACKOFF_SECONDS = 60 * 60
# A day where every location was closed leaves no rows to date, so a short-lived marker stops
# each request for it from scraping the whole site again.
EMPTY_DAY_RECHECK_SECONDS = 5 * 60
CAMPUS_TZ = ZoneInfo("America/New_York")


def local_today() -> datetime.date:
    """Today's date on campus, whatever the server's timezone."""
    return datetime.datetime.now(CAMPUS_TZ).date()


def _store_locations(locations: dict) -> None:
    for location in locations.values():
        DiningLocation.objects.update_or_create(
            id=location["id"],
            defaults={"category": location["category"], "name": location["name"], "url": location["url"]},
        )


def _store_menus(date: datetime.date, menus_by_location: dict) -> None:
    """Replace each scraped location's menus for the date. Locations not in the dict are untouched."""
    locations = {loc.id: loc for loc in DiningLocation.objects.filter(id__in=menus_by_location.keys())}
    for location_id, meal_menus in menus_by_location.items():
        location = locations.get(location_id)
        if not location:
            logger.warning(f"Location {location_id} not found in the database, skipping its menus.")
            continue

        with transaction.atomic():
            if location.category == "residential":
                for meal, stations in meal_menus.items():
                    ResidentialMenu.objects.update_or_create(
                        dining_location=location, date=date, meal=meal, defaults={"menu_items": stations}
                    )
                ResidentialMenu.objects.filter(dining_location=location, date=date).exclude(
                    meal__in=meal_menus.keys()
                ).delete()
            elif meal_menus:
                RetailMenu.objects.update_or_create(
                    dining_location=location, date=date, defaults={"menu_items": meal_menus}
                )
            else:
                RetailMenu.objects.filter(dining_location=location, date=date).delete()


def _store_menu_items(menu_items: dict) -> None:
    for item in menu_items.values():
        try:
            with transaction.atomic():
                menu_item, _ = MenuItem.objects.update_or_create(
                    id=item["id"], defaults={"name": item["name"], "url": item["url"]}
                )
                MenuItemNutrition.objects.update_or_create(menu_item=menu_item, defaults=item["nutrition"])
        except Exception:
            logger.exception(f"Error storing menu item {item.get('id')}")


class CacherService:
    """Database-first access to menus and menu items, refreshed from the Campus Dining site."""

    scraper = Scraper()

    def get_or_cache_locations(self, refresh: bool = False) -> Optional[dict]:
        """All locations as {id: data}. Scraped on first use, or again when `refresh` is set."""
        try:
            if refresh or not DiningLocation.objects.exists():
                scraped = self.scraper.get_all_locations()
                if scraped:
                    _store_locations(scraped)
                elif not DiningLocation.objects.exists():
                    logger.error("Failed to scrape locations.")
                    return None
            queryset = DiningLocation.objects.all()
            return {loc["id"]: loc for loc in DiningLocationSerializer(queryset, many=True).data}
        except Exception:
            logger.exception("Error getting locations")
            return None

    @staticmethod
    def _menu_rows(date: datetime.date) -> list:
        return list(ResidentialMenu.objects.filter(date=date)) + list(RetailMenu.objects.filter(date=date))

    @staticmethod
    def _menus_from_rows(rows: list) -> dict:
        """{location id: {meal: {station: [item ids]}}} from stored rows."""
        menus: dict = defaultdict(dict)
        for row in rows:
            if isinstance(row, ResidentialMenu):
                menus[row.dining_location_id][row.meal] = row.menu_items
            else:
                menus[row.dining_location_id] = row.menu_items
        return dict(menus)

    @staticmethod
    def _is_fresh(rows: list, date: datetime.date) -> bool:
        if date < local_today():
            return True
        cutoff = timezone.now() - MENU_REFRESH_AFTER
        return all(row.updated_at >= cutoff for row in rows)

    def get_or_cache_all_menus_for_date(self, date: datetime.date, force: bool = False) -> Optional[dict]:
        """Menus for every location on a date, scraping the day if it is missing, stale or `force`d.

        Returns an empty dict when no location has a menu that day, and None only when nothing is
        stored and the site could not be reached.
        """
        try:
            rows = self._menu_rows(date)
            if rows and not force and self._is_fresh(rows, date):
                return self._menus_from_rows(rows)
            checked_key = f"menus-checked:{date.isoformat()}"
            if not rows and not force and cache.get(checked_key):
                return {}

            locations = self.get_or_cache_locations()
            if not locations:
                return self._menus_from_rows(rows) if rows else None

            scraped = self.scraper.get_menus_for_all_locations_and_date(sorted(locations), date)
            if not scraped:
                if rows:
                    logger.error(f"Could not reach the menu site for {date}; serving stored menus.")
                    return self._menus_from_rows(rows)
                logger.error(f"Could not reach the menu site for {date} and nothing is stored.")
                return None

            _store_menus(date, scraped)
            self._store_missing_menu_items(collect_menu_item_ids(scraped))
            menus = self._menus_from_rows(self._menu_rows(date))
            if not menus:
                cache.set(checked_key, True, EMPTY_DAY_RECHECK_SECONDS)
            return menus
        except Exception:
            logger.exception(f"Error getting menus for {date}")
            return None

    def get_or_cache_menus_and_items_for_date(self, date: datetime.date) -> Optional[dict]:
        """Menus for a date together with every menu item they reference, or None on failure."""
        menus = self.get_or_cache_all_menus_for_date(date)
        if menus is None:
            return None
        item_ids = collect_menu_item_ids(menus)
        menu_items = self.get_or_cache_menu_items(item_ids) if item_ids else {}
        if menu_items is None:
            return None
        return {"menus": menus, "menu_items": menu_items}

    def _store_missing_menu_items(self, ids: list[str]) -> None:
        """Scrape and store the labels of any ids not yet in the database."""
        known = set(MenuItem.objects.filter(id__in=ids).values_list("id", flat=True))
        missing = [i for i in ids if i not in known and not cache.get(f"menu-item-missing:{i}")]
        if not missing:
            return
        scraped = self.scraper.get_menu_items(missing)
        _store_menu_items(scraped)
        for item_id in set(missing) - set(scraped):
            cache.set(f"menu-item-missing:{item_id}", True, MISSING_ITEM_BACKOFF_SECONDS)

    def get_or_cache_menu_items(self, ids: list[str]) -> Optional[dict]:
        """Menu items as {id: data}, scraping any ids not yet stored. None on failure."""
        try:
            self._store_missing_menu_items(ids)
            queryset = MenuItem.objects.filter(id__in=ids).select_related("nutrition")
            return {item["id"]: item for item in MenuItemSerializer(queryset, many=True).data}
        except Exception:
            logger.exception("Error getting menu items")
            return None

    def refresh_stale_menu_items(self, ids: list[str], older_than: datetime.timedelta = ITEM_REFRESH_AFTER) -> int:
        """Re-scrape the labels of the given items that were last checked more than `older_than` ago."""
        cutoff = timezone.now() - older_than
        stale = list(
            MenuItemNutrition.objects.filter(menu_item_id__in=ids, updated_at__lt=cutoff).values_list(
                "menu_item_id", flat=True
            )
        )
        if not stale:
            return 0
        scraped = self.scraper.get_menu_items(stale)
        _store_menu_items(scraped)
        return len(scraped)


cacher_service = CacherService()
