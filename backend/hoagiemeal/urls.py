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
    get_or_cache_menus_and_items_for_date,
)
from hoagiemeal.api.views.engagement import (
    get_engagement_data,
    update_user_menu_item_interaction,
)
from hoagiemeal.api.views.user import verify_and_get_or_create_user

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/menus/", get_or_cache_menus_and_items_for_date, name="menus-and-items-for-date"),
    path("api/engagement/", get_engagement_data, name="engagement-data"),
    path("api/engagement/interaction/", update_user_menu_item_interaction, name="update-user-menu-item-interaction"),
    path("api/user/", verify_and_get_or_create_user, name="verify-and-get-or-create-user"),
]
