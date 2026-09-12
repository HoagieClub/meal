"""Django models for the Hoagie Meal backend."""

from .dining import DiningLocation
from .engagement import MenuItemInteraction, MenuItemMetrics, MenuItemSimilarity
from .menu import ResidentialMenu, RetailMenu
from .menu_item import MenuItem, MenuItemNutrition
from .user import CustomUser

__all__ = [
    "CustomUser",
    "DiningLocation",
    "MenuItem",
    "MenuItemInteraction",
    "MenuItemMetrics",
    "MenuItemNutrition",
    "MenuItemSimilarity",
    "ResidentialMenu",
    "RetailMenu",
]
