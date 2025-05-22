import os
import json
import re

from hoagiemeal.api.test import Dining

# from hoagiemeal.utils.logger import logger


FILEPATH = "archives/menus.json"
dining = Dining()


def save_menus_to_json(menus: object, menu_id: str) -> None:
    """
    Saves the menu to a JSON file.
    """

    os.makedirs(os.path.dirname(FILEPATH), exist_ok=True)
    data = {}
    if os.path.exists(FILEPATH):
        with open(FILEPATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    data[menu_id] = menus
    with open(FILEPATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_menus_from_json(menu_id: str) -> object:
    """
    Loads the response object from a JSON file.
    """

    os.makedirs(os.path.dirname(FILEPATH), exist_ok=True)
    if os.path.exists(FILEPATH):
        with open(FILEPATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get(menu_id)
    return None


def save_menus_from_date(date: str) -> None:
    """
    Saves all dining hall information from a given date in JSON.
    """

    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise ValueError("Date must be in YYYY-MM-DD format")
    meals = ["Breakfast", "Lunch", "Dinner"]
    menu_ids = [f"{date}-{meal}" for meal in meals]
    dining = Dining()

    for menu_id in menu_ids:
        try:
            response = dining.get_locations()
            for location in response["locations"]["location"]:
                dbid = location.get("dbid")
                menu_data = dining.get_menu(location_id=dbid, menu_id=menu_id)
                location["menu"] = menu_data
                save_menus_to_json(response, menu_id)
        except Exception as e:
            # logger.error(f"Error fetching menu for {menu_id}: {e}")
            pass


if __name__ == "__main__":
    date = "2025-05-13"
    try:
        save_menus_from_date(date)
    except Exception as e:
        # logger.error(f"An error occurred: {e}")
        pass
