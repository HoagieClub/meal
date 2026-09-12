"""Admin registrations, so maintainers can inspect users, menus and interactions at /admin/."""

from django.contrib import admin

from hoagiemeal.models.dining import DiningLocation
from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemMetrics
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu
from hoagiemeal.models.menu_item import MenuItem, MenuItemNutrition
from hoagiemeal.models.user import CustomUser

for model in (
    CustomUser,
    DiningLocation,
    ResidentialMenu,
    RetailMenu,
    MenuItem,
    MenuItemNutrition,
    MenuItemInteraction,
    MenuItemMetrics,
):
    admin.site.register(model)
