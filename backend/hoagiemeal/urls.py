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
from hoagiemeal.api.user import (
    get_user,
    get_user_profile,
    verify_and_get_or_create_user_and_profile,
    update_user_profile,
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
    # User API Endpoints
    path("api/user/", get_user, name="user"),
    path("api/user/profile/", get_user_profile, name="user-profile"),
    path(
        "api/user/verify/", verify_and_get_or_create_user_and_profile, name="verify-and-get-or-create-user-and-profile"
    ),
    path("api/user/update/", update_user_profile, name="update-user-profile"),
]
