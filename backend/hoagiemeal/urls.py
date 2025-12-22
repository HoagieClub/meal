"""URL endpoints for Hoagie Meal backend."""

from django.contrib import admin
from django.urls import path
from hoagiemeal.api.locations import (
    get_dining_locations,
    get_or_cache_locations,
)
from hoagiemeal.api.menu import (
    get_dining_menu_with_menu_item_nutrition_info,
    get_dining_menu_with_menu_item_nutrition_info_for_locations,
    get_dining_menu,
    get_or_cache_dining_menu,
    get_or_cache_dining_menu_with_menu_item_nutrition_info,
    get_or_cache_dining_menu_with_menu_item_nutrition_info_for_locations,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Location API Endpoints
    path("api/dining/locations/", get_dining_locations, name="dining-locations"),
    path("api/dining/locations/cache/", get_or_cache_locations, name="cache-dining-locations"),
    # Menu API Endpoints
    path("api/dining/menu/", get_dining_menu, name="dining-menu"),
    path(
        "api/dining/menu/with-nutrition/",
        get_dining_menu_with_menu_item_nutrition_info,
        name="dining-menu-with-nutrition",
    ),
    path(
        "api/dining/menu/with-nutrition/all-locations/",
        get_dining_menu_with_menu_item_nutrition_info_for_locations,
        name="dining-menu-with-nutrition-for-all-locations",
    ),
    path("api/dining/menu/cache/", get_or_cache_dining_menu, name="cache-dining-menu"),
    path(
        "api/dining/menu/with-nutrition/cache/",
        get_or_cache_dining_menu_with_menu_item_nutrition_info,
        name="cache-dining-menu-with-nutrition",
    ),
    path(
        "api/dining/menu/with-nutrition/all-locations/cache/",
        get_or_cache_dining_menu_with_menu_item_nutrition_info_for_locations,
        name="cache-dining-menu-with-nutrition-for-all-locations",
    ),
]
