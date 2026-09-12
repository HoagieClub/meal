"""Cacher tests: what gets stored, refreshed, replaced and kept."""

import datetime
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from hoagiemeal.api.services.cacher import ITEM_REFRESH_AFTER, MENU_REFRESH_AFTER, CacherService, local_today
from hoagiemeal.models import DiningLocation, MenuItem, MenuItemNutrition, ResidentialMenu, RetailMenu

ROCKY = {
    "Breakfast": {"At the grill": ["113037", "061004"]},
    "Lunch": {"Soups": ["510577"], "Main Entree": ["121033"]},
    "Dinner": {"Main Entree": ["459896"]},
}
FRIST = {"Today's Menu": {"Soups": ["601254"], "Panini": ["660120"]}}


def fake_item(item_id: str, calories: float = 100.0) -> dict:
    return {
        "id": item_id,
        "name": f"Item {item_id}",
        "url": f"https://example.test/label/{item_id}",
        "nutrition": {"calories": calories, "serving_size": "4 oz", "allergens": None, "ingredients": "Food"},
    }


def fake_items(ids):
    return {item_id: fake_item(item_id) for item_id in ids}


def age_rows(queryset, age: datetime.timedelta):
    """Back-date rows; auto_now fields cannot be set through save()."""
    queryset.update(updated_at=timezone.now() - age)


class CacherTests(TestCase):
    def setUp(self):
        cache.clear()
        self.service = CacherService()
        DiningLocation.objects.create(id="01", category="residential", name="Mathey & Rockefeller Colleges", url="u")
        DiningLocation.objects.create(id="08", category="residential", name="Whitman & Butler Colleges", url="u")
        DiningLocation.objects.create(id="15", category="retail", name="Frist Gallery", url="u")
        self.today = local_today()
        self.tomorrow = self.today + datetime.timedelta(days=1)

    def scrape_menus(self, return_value):
        return patch.object(self.service.scraper, "get_menus_for_all_locations_and_date", return_value=return_value)

    def scrape_items(self):
        return patch.object(self.service.scraper, "get_menu_items", side_effect=fake_items)

    def test_first_request_scrapes_stores_and_later_requests_reuse(self):
        with self.scrape_menus({"01": ROCKY, "15": FRIST, "08": {}}) as menus_mock, self.scrape_items():
            first = self.service.get_or_cache_all_menus_for_date(self.tomorrow)
            second = self.service.get_or_cache_all_menus_for_date(self.tomorrow)

        self.assertEqual(first, {"01": ROCKY, "15": FRIST})
        self.assertEqual(second, first)
        self.assertEqual(menus_mock.call_count, 1)
        self.assertEqual(ResidentialMenu.objects.filter(date=self.tomorrow).count(), 3)
        self.assertEqual(RetailMenu.objects.filter(date=self.tomorrow).count(), 1)
        self.assertEqual(
            set(MenuItem.objects.values_list("id", flat=True)),
            {"113037", "061004", "510577", "121033", "459896", "601254", "660120"},
        )
        self.assertEqual(MenuItemNutrition.objects.get(menu_item_id="113037").calories, 100.0)

    def test_stale_menus_are_rescraped_and_replaced_per_location(self):
        with self.scrape_menus({"01": ROCKY, "08": ROCKY, "15": FRIST}), self.scrape_items():
            self.service.get_or_cache_all_menus_for_date(self.today)
        age_rows(ResidentialMenu.objects.all(), MENU_REFRESH_AFTER * 2)
        age_rows(RetailMenu.objects.all(), MENU_REFRESH_AFTER * 2)

        # Rocky drops dinner and adds a lunch soup, Frist is now closed, Whitman's page failed to load.
        updated_rocky = {
            "Breakfast": ROCKY["Breakfast"],
            "Lunch": {"Soups": ["510577", "999001"], "Main Entree": ["121033"]},
        }
        with self.scrape_menus({"01": updated_rocky, "15": {}}) as menus_mock, self.scrape_items():
            menus = self.service.get_or_cache_all_menus_for_date(self.today)

        self.assertEqual(menus_mock.call_count, 1)
        self.assertEqual(menus["01"], updated_rocky)
        self.assertNotIn("15", menus)
        self.assertEqual(menus["08"], ROCKY, "a location whose page failed keeps its stored menu")
        self.assertFalse(ResidentialMenu.objects.filter(dining_location_id="01", meal="Dinner").exists())
        self.assertFalse(RetailMenu.objects.filter(dining_location_id="15").exists())
        self.assertTrue(MenuItem.objects.filter(id="999001").exists(), "new items on a refreshed menu are scraped")

    def test_past_days_are_frozen(self):
        yesterday = self.today - datetime.timedelta(days=1)
        with self.scrape_menus({"01": ROCKY}), self.scrape_items():
            self.service.get_or_cache_all_menus_for_date(yesterday)
        age_rows(ResidentialMenu.objects.all(), datetime.timedelta(days=30))

        with self.scrape_menus({"01": {}}) as menus_mock:
            menus = self.service.get_or_cache_all_menus_for_date(yesterday)

        self.assertEqual(menus_mock.call_count, 0)
        self.assertEqual(menus, {"01": ROCKY})

    def test_unreachable_site_and_empty_days(self):
        # Nothing stored and the site down: None, so callers can tell failure from "no menus".
        with self.scrape_menus({}):
            self.assertIsNone(self.service.get_or_cache_all_menus_for_date(self.tomorrow))

        # Every location closed: an empty answer, and nothing is stored.
        with self.scrape_menus({"01": {}, "08": {}, "15": {}}):
            self.assertEqual(self.service.get_or_cache_all_menus_for_date(self.tomorrow), {})
        self.assertEqual(ResidentialMenu.objects.count(), 0)

        # Stored menus survive a refresh attempt while the site is down.
        with self.scrape_menus({"01": ROCKY}), self.scrape_items():
            self.service.get_or_cache_all_menus_for_date(self.today)
        age_rows(ResidentialMenu.objects.all(), MENU_REFRESH_AFTER * 2)
        with self.scrape_menus({}):
            self.assertEqual(self.service.get_or_cache_all_menus_for_date(self.today), {"01": ROCKY})
        self.assertEqual(ResidentialMenu.objects.count(), 3)

    def test_menu_items_are_scraped_once_and_missing_ones_are_not_retried_immediately(self):
        MenuItem.objects.create(id="A", name="Known", url="u")
        MenuItemNutrition.objects.create(menu_item_id="A", calories=5.0)

        with self.scrape_items() as items_mock:
            items = self.service.get_or_cache_menu_items(["A", "B"])
        items_mock.assert_called_once_with(["B"])
        self.assertEqual(sorted(items), ["A", "B"])
        self.assertEqual(items["A"]["nutrition"]["calories"], 5.0)
        self.assertEqual(items["B"]["name"], "Item B")

        with patch.object(self.service.scraper, "get_menu_items", return_value={}) as items_mock:
            self.service.get_or_cache_menu_items(["Z"])
            self.service.get_or_cache_menu_items(["Z"])
        self.assertEqual(items_mock.call_count, 1)

    def test_refresh_stale_menu_items(self):
        MenuItem.objects.create(id="OLD", name="Old", url="u")
        MenuItemNutrition.objects.create(menu_item_id="OLD", calories=1.0)
        MenuItem.objects.create(id="NEW", name="New", url="u")
        MenuItemNutrition.objects.create(menu_item_id="NEW", calories=2.0)
        age_rows(MenuItemNutrition.objects.filter(menu_item_id="OLD"), ITEM_REFRESH_AFTER * 2)

        with patch.object(
            self.service.scraper,
            "get_menu_items",
            side_effect=lambda ids: {i: fake_item(i, calories=500.0) for i in ids},
        ) as items_mock:
            refreshed = self.service.refresh_stale_menu_items(["OLD", "NEW"])

        items_mock.assert_called_once_with(["OLD"])
        self.assertEqual(refreshed, 1)
        self.assertEqual(MenuItemNutrition.objects.get(menu_item_id="OLD").calories, 500.0)
        self.assertEqual(MenuItem.objects.get(id="OLD").name, "Item OLD")
        self.assertEqual(MenuItemNutrition.objects.get(menu_item_id="NEW").calories, 2.0)

    def test_location_refresh_picks_up_renames(self):
        DiningLocation.objects.create(id="06", category="residential", name="Yeh College & NCW", url="u")
        scraped = {
            "06": {"id": "06", "category": "residential", "name": "Yeh & Huo Colleges", "url": "u2"},
            "99": {"id": "99", "category": "retail", "name": "New Cafe", "url": "u3"},
        }

        with patch.object(self.service.scraper, "get_all_locations", return_value=scraped) as mock:
            self.service.get_or_cache_locations()
            self.assertEqual(mock.call_count, 0, "existing locations are not re-scraped without refresh")
            locations = self.service.get_or_cache_locations(refresh=True)

        self.assertEqual(DiningLocation.objects.get(id="06").name, "Yeh & Huo Colleges")
        self.assertEqual(locations["99"]["name"], "New Cafe")
