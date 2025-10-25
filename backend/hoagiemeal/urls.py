"""URL endpoints for Hoagie Meal backend."""

from django.contrib import admin
from django.urls import path

from hoagiemeal.api.dining import (
    get_dining_locations,
    get_dining_events,
    get_dining_menu,
    get_menu_item_with_ratings,
    get_menu_item_ratings,
    create_menu_item_rating,
    manage_rating,
    get_user_ratings,
    get_top_rated_menu_items,
    get_dining_locations_with_menus
)
from hoagiemeal.api.places import get_open_places
from hoagiemeal.api.user import me, verify, update_user_profile


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dining/locations/", get_dining_locations, name="dining-locations"),
    path("api/dining/locations/with-menus/", get_dining_locations_with_menus, name="dining-locations-with-menus"),
    path("api/dining/events/", get_dining_events, name="dining-events"),
    path("api/dining/menu/", get_dining_menu, name="dining-menu"),
    path("api/dining/places/open/", get_open_places, name="dining-places-open"),
    # Menu ratings API endpoints
    path("api/menu-items/<int:menu_item_id>/", get_menu_item_with_ratings, name="menu-item-with-ratings"),
    path("api/menu-items/<int:menu_item_id>/ratings/", get_menu_item_ratings, name="menu-item-ratings"),
    path("api/menu-items/<int:menu_item_id>/rate/", create_menu_item_rating, name="create-menu-item-rating"),
    path("api/ratings/<int:rating_id>/", manage_rating, name="manage-rating"),
    path("api/user/ratings/", get_user_ratings, name="user-ratings"),
    path("api/menu-items/top-rated/", get_top_rated_menu_items, name="top-rated-menu-items"),
    path("api/user/me/", me, name="user-me"),
    path("api/auth/verify/", verify, name="user-verify"),
    path("api/user/update/", update_user_profile, name="user-update"),
]
