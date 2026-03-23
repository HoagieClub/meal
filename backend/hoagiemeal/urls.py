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
from hoagiemeal.api.views.cacher import (
    get_or_cache_all_locations,
    get_or_cache_all_menus_for_date,
    get_or_cache_menu_items,
)
from hoagiemeal.api.views.engagement import (
    get_user_menu_item_interactions,
    update_user_menu_item_interaction,
    get_menu_items_metrics,
)
from hoagiemeal.api.views.user import verify_and_get_or_create_user

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/locations/", get_or_cache_all_locations, name="all-locations"),
    path("api/menus/", get_or_cache_all_menus_for_date, name="all-menus-for-date"),
    path("api/menu-items/", get_or_cache_menu_items, name="menu-items"),
    path("api/engagement/interactions/", get_user_menu_item_interactions, name="user-menu-item-interactions"),
    path("api/engagement/interaction/", update_user_menu_item_interaction, name="update-user-menu-item-interaction"),
    path("api/engagement/metrics/", get_menu_items_metrics, name="menu-items-metrics"),
    path("api/user/", verify_and_get_or_create_user, name="verify-and-get-or-create-user"),
]
