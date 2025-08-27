import decimal
from typing import Dict, Any, List
import re

from django.db import models


class DiningVenueManager(models.Manager):
    def get_mapped_data(self, api_data: Dict[str, Any]) -> Dict[str, Any]:
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


class MenuItemManager(models.Manager):
    def get_mapped_data(self, api_data: Dict[str, Any], link_data: Dict[str, Any], menu_id: int):
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


class MenuItemNutrientManager(models.Manager):
    def _safe_float_to_decimal(self, value: Any) -> decimal.Decimal | None:
        try:
            if isinstance(value, str) and "%" in value:
                value = value.replace("%", "").strip()
            if not value:
                return None
            return decimal.Decimal(str(value))
        except (decimal.InvalidOperation, ValueError):
            return None

    def get_mapped_data(self, menu_item_id: int, link_data: Dict[str, Any]) -> Dict[str, Any]:
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
            "total_fat": self._safe_float_to_decimal(
                link_data.get("Fat", {}).get("Total Fat", {}).get("Amount")
            ),
            "saturated_fat": self._safe_float_to_decimal(
                link_data.get("Fat", {}).get("Saturated Fat", {}).get("Amount")
            ),
            "trans_fat": self._safe_float_to_decimal(
                link_data.get("Fat", {}).get("Trans Fat", {}).get("Amount")
            ),
            "cholesterol": self._safe_float_to_decimal(
                link_data.get("Cholesterol", {}).get("Amount")
            ),
            "sodium": self._safe_float_to_decimal(link_data.get("Sodium", {}).get("Amount")),
            "total_carbohydrates": self._safe_float_to_decimal(
                link_data.get("Carbohydrates", {}).get("Total Carbohydrates", {}).get("Amount")
            ),
            "dietary_fiber": self._safe_float_to_decimal(
                link_data.get("Carbohydrates", {}).get("Dietary Fiber", {}).get("Amount")
            ),
            "sugars": self._safe_float_to_decimal(
                link_data.get("Carbohydrates", {}).get("Sugar", {}).get("Amount")
            ),
            "protein": self._safe_float_to_decimal(link_data.get("Protein", {}).get("Amount")),
            "vitamin_d": self._safe_float_to_decimal(
                link_data.get("Vitamins", {}).get("Vitamin D", {}).get("Amount")
            ),
            "potassium": self._safe_float_to_decimal(
                link_data.get("Vitamins", {}).get("Potassium", {}).get("Amount")
            ),
            "calcium": self._safe_float_to_decimal(
                link_data.get("Vitamins", {}).get("Calcium", {}).get("Amount")
            ),
            "iron": self._safe_float_to_decimal(
                link_data.get("Vitamins", {}).get("Iron", {}).get("Amount")
            ),
        }

        return {
            "lookup_kwargs": lookup_kwargs,
            "create_kwargs": create_kwargs,
            "kwargs": lookup_kwargs | create_kwargs,
        }
