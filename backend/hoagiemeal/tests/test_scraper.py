"""Scraper tests against real pages saved from menus.princeton.edu (see fixtures/)."""

import datetime
import pathlib
import re
from unittest.mock import patch

from bs4 import BeautifulSoup
from django.test import SimpleTestCase

from hoagiemeal.api.services.scraper import (
    Scraper,
    add_inferred_daily_values,
    collect_menu_item_ids,
    decode_page,
    extract_locations,
    extract_menu_items,
    extract_menus,
    parse_nutrition_label,
)

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def soup(name: str) -> BeautifulSoup:
    return BeautifulSoup((FIXTURES / name).read_text(encoding="utf-8"), "html.parser")


def label_soup_for(url: str):
    """Stand-in for fetch_page_soup that serves saved label pages by item id, or None if unknown."""
    item_id_str = re.search(r"RecNumAndPort=(\d+)", url)
    assert item_id_str is not None
    item_id = item_id_str.group(1)

    path = FIXTURES / f"label_{item_id}.html"
    return soup(path.name) if path.exists() else None


class ExtractLocationsTests(SimpleTestCase):
    def test_landing_page(self):
        locations = extract_locations(soup("landing.html"))
        assert locations is not None

        self.assertEqual(
            sorted(locations), ["01", "03", "04", "05", "06", "07", "08", "12", "15", "16", "23", "24", "26"]
        )
        # Rockefeller shares location 01 with Mathey and is dropped in favour of the combined name.
        self.assertEqual(locations["01"]["name"], "Mathey & Rockefeller Colleges")
        self.assertEqual(locations["06"]["name"], "Yeh & Huo Colleges")
        self.assertEqual(locations["08"]["name"], "Whitman & Butler Colleges")
        self.assertEqual(locations["15"]["name"], "Frist Gallery")
        # The site has a trailing space in "Graduate College ".
        self.assertEqual(locations["04"]["name"], "Graduate College")
        self.assertEqual(locations["01"]["category"], "residential")
        self.assertEqual(locations["15"]["category"], "retail")
        self.assertTrue(locations["05"]["url"].startswith("https://menus.princeton.edu/dining/_Foodpro/online-menu/"))


class ExtractMenusTests(SimpleTestCase):
    def test_weekday_residential_menu(self):
        menus = extract_menus(soup("menu_rocky_friday.html"))
        assert menus is not None

        self.assertEqual(list(menus), ["Breakfast", "Lunch", "Dinner"])
        self.assertEqual(
            menus["Breakfast"],
            {
                "At the grill": ["113037", "061004", "280006", "161002", "061001", "280002", "061002"],
                "Breakfast Bars": ["218001", "217001", "560108"],
            },
        )
        self.assertEqual(menus["Lunch"]["Soups"], ["510577"])
        self.assertEqual(menus["Dinner"]["On the Side"], ["510271", "510540", "121109"])
        self.assertEqual(len(collect_menu_item_ids(menus)), 20)

    def test_weekend_breakfast_is_kept(self):
        menus = extract_menus(soup("menu_whitman_saturday.html"))
        assert menus is not None

        self.assertEqual(list(menus), ["Breakfast", "Lunch", "Dinner"])
        self.assertEqual(menus["Breakfast"]["Early Entree"], ["581044", "580787", "581342", "581114"])
        # The same soup is served at lunch and dinner; ids are de-duplicated when collected.
        self.assertEqual(menus["Lunch"]["Soups"], menus["Dinner"]["Soups"])
        self.assertEqual(len(collect_menu_item_ids(menus)), 17)

    def test_closed_location_is_empty_but_an_unreadable_page_is_none(self):
        self.assertEqual(extract_menus(soup("menu_grad_closed.html")), {})
        # A throttled or error response must not be mistaken for a closed location.
        self.assertIsNone(extract_menus(soup("landing.html")))
        self.assertIsNone(extract_menus(BeautifulSoup("<html><body>Service unavailable</body></html>", "html.parser")))

    def test_retail_menu(self):
        menus = extract_menus(soup("menu_frist_friday.html"))
        assert menus is not None

        self.assertEqual(list(menus), ["Today's Menu", "Inspired Offerings"])
        self.assertEqual(menus["Today's Menu"]["Soups"], ["601254", "610195"])
        self.assertEqual(len(menus["Today's Menu"]["Grab 'N Go"]), 11)
        self.assertEqual(menus["Inspired Offerings"]["Global Kitchen"], ["604151", "757700", "604167", "600969"])


class ParseNutritionLabelTests(SimpleTestCase):
    def test_full_label(self):
        nutrition = parse_nutrition_label(soup("label_061004.html"))

        expected = {
            "servings_per_container": 1,
            "serving_size": "2 each",
            "calories": 172.0,
            "total_fat": 13.1,
            "total_fat_dv": 17.0,
            "saturated_fat": 3.8,
            "saturated_fat_dv": 14.0,
            "trans_fat": 0.0,
            "cholesterol": 352.9,
            "cholesterol_dv": None,
            "sodium": 182.2,
            "sodium_dv": 8.0,
            "total_carbs": 0.7,
            "total_carbs_dv": 1.0,
            "dietary_fiber": 0.0,
            "dietary_fiber_dv": 0.0,
            "total_sugars": 0.4,
            "added_sugars": 0.0,
            "added_sugars_dv": None,
            "protein": 12.0,
            "protein_dv": 21.0,
            "vitamin_d": 1.9,
            "vitamin_d_dv": 0.0,
            "calcium": 54.6,
            "calcium_dv": 4.0,
            "iron": 1.7,
            "iron_dv": 9.0,
            "potassium": 133.8,
            "potassium_dv": 3.0,
            "ingredients": "Eggs",
            "allergens": "Eggs",
        }
        self.assertEqual(nutrition, expected)

    def test_odd_values_and_encodings(self):
        # "0mcg" is still an amount, a missing allergen line is None.
        sausage = parse_nutrition_label(soup("label_113037.html"))
        self.assertEqual(sausage["calories"], 113.0)
        self.assertEqual(sausage["calcium"], 0.0)
        self.assertIsNone(sausage["calcium_dv"])
        self.assertIsNone(sausage["allergens"])
        self.assertTrue(sausage["ingredients"].startswith("Chicken Sausage (Chicken thigh meat"))

        # Values printed as dashes are unknown, not zero.
        muffin = parse_nutrition_label(soup("label_328008.html"))
        self.assertIsNone(muffin["calories"])
        self.assertEqual(muffin["total_fat"], 0.0)
        self.assertIsNone(muffin["total_fat_dv"])

        # Pages arrive as UTF-8 with the odd stray Windows-1252 byte.
        self.assertEqual(decode_page(b"Saut\xe9ed Green Beans"), "Sautéed Green Beans")
        self.assertEqual(decode_page("Crème brûlée".encode()), "Crème brûlée")

    def test_allergen_strings_are_read_verbatim(self):
        self.assertEqual(
            parse_nutrition_label(soup("label_020038.html"))["allergens"], "Milk, Crustacean Shellfish, Wheat, Gluten"
        )
        self.assertEqual(
            parse_nutrition_label(soup("label_660124.html"))["allergens"], "Milk, Eggs, Tree Nut, Soybeans"
        )
        self.assertEqual(
            parse_nutrition_label(soup("label_020146.html"))["allergens"], "Soybeans, Ingredients include alcohol"
        )

    def test_inferred_daily_values(self):
        items = {
            "x": {
                "nutrition": {
                    "cholesterol": 300.0,
                    "cholesterol_dv": None,
                    "sodium": 1150.0,
                    "sodium_dv": 60.0,
                    "protein": None,
                    "protein_dv": None,
                }
            }
        }
        nutrition = add_inferred_daily_values(items)["x"]["nutrition"]

        self.assertEqual(nutrition["cholesterol_dv"], 100)
        self.assertEqual(nutrition["sodium_dv"], 60.0)
        self.assertIsNone(nutrition["protein_dv"])


class ScraperTests(SimpleTestCase):
    def test_menu_items_are_scraped_from_labels(self):
        with patch("hoagiemeal.api.services.scraper.fetch_page_soup", side_effect=label_soup_for):
            items = extract_menu_items(["061004", "020038", "999999"])

        self.assertEqual(sorted(items), ["020038", "061004"])
        self.assertEqual(items["061004"]["name"], "Eggs Made to Order")
        self.assertEqual(items["020038"]["nutrition"]["serving_size"], "6 oz")
        self.assertTrue(items["061004"]["url"].endswith("label.aspx?RecNumAndPort=061004"))

    def test_closed_location_and_fetch_failure_are_distinguished(self):
        scraper = Scraper()
        date = datetime.date(2026, 10, 2)
        pages = {"01": soup("menu_rocky_friday.html"), "04": soup("menu_grad_closed.html")}

        def fetch(url):
            location_id_str = re.search(r"locationNum=(\d+)", url)
            assert location_id_str is not None
            location_id = location_id_str.group(1)

            return pages.get(location_id)

        with patch("hoagiemeal.api.services.scraper.fetch_page_soup", return_value=None):
            self.assertIsNone(scraper.get_menus_for_location_and_date("04", date))
        with patch("hoagiemeal.api.services.scraper.fetch_page_soup", side_effect=fetch):
            menus = scraper.get_menus_for_all_locations_and_date(["01", "04", "08"], date)

        # Grad is closed (empty), Whitman's page failed to load and is left out of the day.
        self.assertEqual(sorted(menus), ["01", "04"])
        self.assertEqual(menus["04"], {})
        self.assertEqual(list(menus["01"]), ["Breakfast", "Lunch", "Dinner"])
