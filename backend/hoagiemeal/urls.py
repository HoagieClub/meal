"""Django URL patterns for the Hoagie Meal application.

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

from django.contrib import admin
from django.urls import path
from hoagiemeal.api.locations import get_dining_locations, get_all_dining_locations
from hoagiemeal.api.menu import (
    get_dining_menu_item,
    get_dining_menu_with_menu_items,
    get_dining_menus_with_menu_items_for_locations,
    get_dining_menus_with_menu_items_for_locations_and_day,
    clear_dining_menus_cache,
)
from hoagiemeal.api.user import (
    verify_and_get_or_create_user,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dining/menus/clear-cache/", clear_dining_menus_cache, name="clear-dining-menus-cache"),
    # Location API Endpoints
    path("api/dining/locations/", get_dining_locations, name="dining-locations"),
    path("api/dining/locations/all/", get_all_dining_locations, name="all-dining-locations"),
    # Menu API Endpoints
    path("api/dining/menu/item/", get_dining_menu_item, name="dining-menu-item"),
    path("api/dining/menu/", get_dining_menu_with_menu_items, name="dining-menu-with-menu-items"),
    path(
        "api/dining/menus/all-locations/",
        get_dining_menus_with_menu_items_for_locations,
        name="dining-menus-with-menu-items-for-locations",
    ),
    path(
        "api/dining/menus/all-locations/day/",
        get_dining_menus_with_menu_items_for_locations_and_day,
        name="dining-menus-with-menu-items-for-locations-and-day",
    ),
    # User API Endpoints
    path("api/user/verify/", verify_and_get_or_create_user, name="verify-and-get-or-create-user"),
]
