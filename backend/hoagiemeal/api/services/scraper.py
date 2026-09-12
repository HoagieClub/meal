"""Scrape menus, menu items and locations from menus.princeton.edu."""

import datetime
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from hoagiemeal.utils.logger import logger

BASE_URL = "https://menus.princeton.edu/dining/_Foodpro/online-menu"
REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0", "Connection": "keep-alive"}
RETRY_COUNT = 3
TIMEOUT_SECONDS = 10
MAX_PARALLEL_REQUESTS = 8

# The site lists some locations under different names than we display. Rockefeller and Mathey
# share one menu (location 01), so Rockefeller's own entry is dropped.
LOCATION_NAME_OVERRIDES = {
    "Mathey College": "Mathey & Rockefeller Colleges",
    "Yeh College & New College West": "Yeh & Huo Colleges",
    "Whitman College & Butler College": "Whitman & Butler Colleges",
    "The Gallery": "Frist Gallery",
}
SKIPPED_LOCATIONS = {"Rockefeller College"}

# FDA daily values for a 2,000 calorie diet, used when a label omits the percentage.
DAILY_VALUES = {
    "total_fat": 78,  # g
    "saturated_fat": 20,  # g
    "cholesterol": 300,  # mg
    "sodium": 2300,  # mg
    "total_carbs": 275,  # g
    "dietary_fiber": 28,  # g
    "added_sugars": 50,  # g
    "protein": 50,  # g
    "vitamin_d": 20,  # mcg
    "calcium": 1300,  # mg
    "iron": 18,  # mg
    "potassium": 4700,  # mg
}

# How each nutrition label row is recognised: (matcher, amount field, daily-value field).
# Order matters, the first match wins. Amounts are read with AMOUNT_RE whatever their unit.
NUTRIENT_RULES = [
    (lambda t: "Total Fat" in t and "Saturated" not in t and "Trans" not in t, "total_fat", "total_fat_dv"),
    (lambda t: "Saturated Fat" in t, "saturated_fat", "saturated_fat_dv"),
    (lambda t: "Trans" in t and "Fat" in t, "trans_fat", None),
    (lambda t: t.startswith("Cholesterol"), "cholesterol", "cholesterol_dv"),
    (lambda t: t.startswith("Sodium"), "sodium", "sodium_dv"),
    (lambda t: "Total Carbohydrate" in t, "total_carbs", "total_carbs_dv"),
    (lambda t: "Dietary Fiber" in t, "dietary_fiber", "dietary_fiber_dv"),
    (lambda t: "Total Sugars" in t, "total_sugars", None),
    (lambda t: "Added Sugars" in t, "added_sugars", "added_sugars_dv"),
    (lambda t: t.startswith("Protein"), "protein", "protein_dv"),
    (lambda t: "Vitamin D" in t, "vitamin_d", "vitamin_d_dv"),
    (lambda t: t.startswith("Calcium"), "calcium", "calcium_dv"),
    (lambda t: t.startswith("Iron"), "iron", "iron_dv"),
    (lambda t: t.startswith("Potassium"), "potassium", "potassium_dv"),
]
AMOUNT_RE = re.compile(r"([\d.]+)\s*(?:mcg|mg|g)\b")
# The site prints dashes (sometimes as a mangled en dash) for values it does not have.
DASHES_RE = re.compile(r"^[-–—�\s]+$")

_thread_local = threading.local()


def _session() -> requests.Session:
    """One requests session per thread, so parallel fetches reuse connections safely."""
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        _thread_local.session = session
    return session


def decode_page(content: bytes) -> str:
    """Decode a page that is UTF-8 apart from stray Windows-1252 bytes, such as the e-acute in Sauteed."""
    text = content.decode("utf-8", errors="surrogateescape")
    return re.sub(
        r"[\udc80-\udcff]+",
        lambda m: m.group().encode("utf-8", errors="surrogateescape").decode("cp1252", errors="replace"),
        text,
    )


def collect_menu_item_ids(menus: dict) -> list[str]:
    """Unique menu item ids found anywhere in a nested menu structure, sorted."""
    ids: set[str] = set()

    def walk(node):
        if isinstance(node, dict):
            for value in node.values():
                walk(value)
        elif node:
            ids.update(node)

    walk(menus)
    return sorted(ids)


def _build_menu_url(date: datetime.date, location_id: str) -> str:
    params = {"myaction": "read", "dtdate": f"{date.month}/{date.day}/{date.year}", "locationNum": location_id}
    return f"{BASE_URL}/menuDetails.asp?{urlencode(params)}"


def _build_nutrition_url(item_id: str) -> str:
    return f"{BASE_URL}/label.aspx?RecNumAndPort={item_id}"


def fetch_page_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch a page, retrying transient failures. Returns None when it cannot be fetched."""
    for attempt in range(RETRY_COUNT):
        try:
            response = _session().get(url, headers=REQUEST_HEADERS, timeout=TIMEOUT_SECONDS)
            if 400 <= response.status_code < 500:
                logger.warning(f"HTTP {response.status_code} fetching {url}")
                return None
            response.raise_for_status()
            return BeautifulSoup(decode_page(response.content), "html.parser")
        except requests.exceptions.RequestException as e:
            logger.debug(f"Error fetching {url} (attempt {attempt + 1}/{RETRY_COUNT}): {e}")
        if attempt < RETRY_COUNT - 1:
            time.sleep(2**attempt)
    return None


def add_inferred_daily_values(items_map: dict) -> dict:
    """Fill in missing `*_dv` percentages from the FDA daily values."""
    for item in items_map.values():
        nutrition = item.get("nutrition", {})
        for nutrient, standard in DAILY_VALUES.items():
            amount = nutrition.get(nutrient)
            if amount is not None and nutrition.get(f"{nutrient}_dv") is None:
                nutrition[f"{nutrient}_dv"] = int(round(amount / standard * 100))
    return items_map


def extract_locations(soup: BeautifulSoup) -> Optional[dict]:
    """Parse the residential and retail location lists on the site's landing page."""
    try:
        locations = {}
        for category in ("residential", "retail"):
            ul = soup.find("ul", id=category)
            if not ul:
                continue
            for item in ul.find_all("li", class_=category):
                location_id = item.get("id")
                link = item.find("a")
                if not location_id or not link:
                    continue

                name = " ".join(link.get_text(strip=True).split())
                if name in SKIPPED_LOCATIONS:
                    continue
                href = link.get("href")
                locations[location_id] = {
                    "id": location_id,
                    "category": category,
                    "name": LOCATION_NAME_OVERRIDES.get(name, name),
                    "url": f"{BASE_URL}/{href}" if href else None,
                }
        return locations
    except Exception as e:
        logger.error(f"Error extracting locations: {e}")
        return None


def extract_menus(soup: BeautifulSoup) -> Optional[dict]:
    """Parse a location's menu page into {meal: {station: [item ids]}}.

    Returns an empty dict when the site explicitly says no menu is published, and None when
    the page has neither menus nor that marker (an error page, a throttled response), so a bad
    fetch is never mistaken for a closed location.
    """
    try:
        menu = {}
        for meal_card in soup.select(".card.mealCard"):
            header = meal_card.select_one(".card-header")
            body = meal_card.select_one(".card-body")
            if not header or not body:
                continue

            meal_name = header.contents[0].get_text(strip=True)
            stations: dict[str, list[str]] = {}
            current_station = None
            for element in body.select(".mealStation, .accordion-item"):
                classes = element.get("class") or []
                if "mealStation" in classes:
                    current_station = element.get_text(strip=True)
                    stations[current_station] = []
                    continue
                if "accordion-item" not in classes or not current_station:
                    continue

                accordion_body = element.select_one("div.accordion-body.p-2")
                if accordion_body and "nutritional information is not available" in accordion_body.get_text().lower():
                    continue
                nutrition_link = element.select_one(".tour-nutrition-link")
                match = re.search(r"RecNumAndPort=(\d+)", nutrition_link.get("href") or "") if nutrition_link else None
                if match:
                    stations[current_station].append(match.group(1))

            menu[meal_name] = stations

        if not menu and not soup.select_one("#noData"):
            logger.warning("Menu page has neither meal cards nor the no-data marker; treating it as unreadable.")
            return None
        return menu
    except Exception as e:
        logger.error(f"Error extracting menus: {e}")
        return None


def _empty_nutrition() -> dict:
    data = {
        "servings_per_container": None,
        "serving_size": None,
        "calories": None,
        "ingredients": None,
        "allergens": None,
    }
    for _, value_field, dv_field in NUTRIENT_RULES:
        data[value_field] = None
        if dv_field:
            data[dv_field] = None
    return data


def _parse_numeric(value: str) -> Optional[float]:
    """Leading number in a string with units, e.g. '5.7g' -> 5.7 or '7%' -> 7. Dashes mean unavailable."""
    if not value or DASHES_RE.match(value):
        return None
    match = re.search(r"([\d.]+)", value)
    try:
        return float(match.group(1)) if match else None
    except ValueError:
        return None


def _labelled_text(soup: BeautifulSoup, label: str) -> Optional[str]:
    """Text following a bold label such as 'INGREDIENTS:', or None when absent or empty."""
    strong = soup.find("strong", string=label)
    if not strong or not strong.parent:
        return None
    text = strong.parent.get_text(" ", strip=True).replace(label, "").strip()
    return " ".join(text.split()) or None


def parse_nutrition_label(soup: BeautifulSoup) -> dict:
    """Read every nutrition field from a label page. Fields the label does not show are None."""
    nutrition = _empty_nutrition()

    servings_text = soup.find(string=re.compile(r"\d+\s+servings per container"))
    if servings_text:
        match = re.search(r"(\d+)\s+servings per container", servings_text.strip())
        if match:
            nutrition["servings_per_container"] = int(match.group(1))

    for row in soup.select(".row.ms-0.me-0"):
        if "Serving size" in row.get_text():
            strong = row.select_one("strong")
            if strong:
                nutrition["serving_size"] = " ".join(strong.get_text(strip=True).split())
            break

    calories_heading = soup.find("div", class_="h4 m-0 p-0")
    if calories_heading and "Calories" in calories_heading.get_text():
        calories_row = calories_heading.find_parent("div", class_="row")
        calories_div = calories_row.select_one("div[style*='font-size: 2em']") if calories_row else None
        if calories_div:
            nutrition["calories"] = _parse_numeric(calories_div.get_text(strip=True))

    for row in soup.select("#mobile-label .card-body .row.ms-0.me-0"):
        label_col = row.select_one(".col-9")
        dv_col = row.select_one(".col-3")
        if not label_col:
            continue
        label_text = " ".join(label_col.get_text(" ", strip=True).split())
        dv_value = _parse_numeric(dv_col.get_text(strip=True)) if dv_col else None

        for matches, value_field, dv_field in NUTRIENT_RULES:
            if not matches(label_text):
                continue
            match = AMOUNT_RE.search(label_text)
            if match:
                nutrition[value_field] = float(match.group(1))
                if dv_field:
                    nutrition[dv_field] = dv_value
            break

    nutrition["ingredients"] = _labelled_text(soup, "INGREDIENTS:")
    nutrition["allergens"] = _labelled_text(soup, "ALLERGENS:")
    return nutrition


def _scrape_menu_item(item_id: str) -> Optional[dict]:
    url = _build_nutrition_url(item_id)
    soup = fetch_page_soup(url)
    if not soup:
        logger.warning(f"Failed to fetch nutrition label for menu item {item_id}")
        return None

    name_el = soup.select_one("#mobile-label .h5.text-center")
    if not name_el:
        logger.warning(f"No name found on the label for menu item {item_id}")
        return None

    try:
        nutrition = parse_nutrition_label(soup)
    except Exception as e:
        logger.warning(f"Error parsing nutrition label for menu item {item_id}: {e}")
        nutrition = _empty_nutrition()

    return {"id": item_id, "name": " ".join(name_el.get_text(strip=True).split()), "url": url, "nutrition": nutrition}


def extract_menu_items(ids: list[str]) -> dict:
    """Scrape the nutrition label of each menu item id, in parallel. Items that fail are omitted."""
    if not ids:
        return {}
    with ThreadPoolExecutor(max_workers=MAX_PARALLEL_REQUESTS) as pool:
        results = list(pool.map(_scrape_menu_item, ids))
    return {item["id"]: item for item in results if item}


class Scraper:
    """High-level scraping operations used by the cacher."""

    def get_all_locations(self) -> Optional[dict]:
        """All dining locations as {location id: data}."""
        soup = fetch_page_soup(f"{BASE_URL}/default.asp")
        if not soup:
            logger.error("Failed to fetch the main menu page")
            return None
        locations = extract_locations(soup)
        if not locations:
            logger.error("Failed to extract locations")
            return None
        return locations

    def get_menus_for_location_and_date(self, location_id: str, date: datetime.date) -> Optional[dict]:
        """One location's menus for a date, as {meal: {station: [item ids]}}.

        Returns an empty dict when the page loads but no menu is published, and None when the
        page could not be fetched or parsed, so callers can tell "closed" from "unknown".
        """
        url = _build_menu_url(date, location_id)
        soup = fetch_page_soup(url)
        if not soup:
            logger.error(f"Failed to fetch {url}")
            return None
        return extract_menus(soup)

    def get_menus_for_all_locations_and_date(self, location_ids: list[str], date: datetime.date) -> dict:
        """Menus for each location on a date, as {location id: {meal: {station: [item ids]}}}.

        Locations whose page could not be fetched are left out, so a partial result never masks
        data the caller already has.
        """
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_REQUESTS) as pool:
            results = list(pool.map(lambda loc: (loc, self.get_menus_for_location_and_date(loc, date)), location_ids))
        return {location_id: menus for location_id, menus in results if menus is not None}

    def get_menu_items(self, ids: list[str]) -> dict:
        """Menu items with nutrition for the given ids, as {item id: item}. Failed ids are omitted."""
        return add_inferred_daily_values(extract_menu_items(ids))
