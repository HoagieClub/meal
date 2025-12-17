"""URL endpoints for Hoagie Meal backend."""

from django.contrib import admin
from django.urls import path

from hoagiemeal.api.dining import (
    get_dining_locations,
    get_dining_events,
    get_dining_menu,
    get_menu_item_with_ratings,
    get_menu_item_ratings,
    get_menu_item_details,
    create_menu_item_rating,
    manage_rating,
    get_user_ratings,
    get_top_rated_menu_items,
    get_dining_locations_with_menus,
    scrape_nutrition_url,
    get_upvotes_bookmarks_for_menu_item,
    post_upvotes_bookmarks_for_menu_item,
)
from hoagiemeal.api.places import get_open_places
from hoagiemeal.api.user import me, update_user_profile, verify


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dining/locations/", get_dining_locations, name="dining-locations"),
    path("api/dining/locations/with-menus/", get_dining_locations_with_menus, name="dining-locations-with-menus"),
    path("api/dining/events/", get_dining_events, name="dining-events"),
    path("api/dining/menu/", get_dining_menu, name="dining-menu"),
    path("api/dining/scrape-url/", scrape_nutrition_url, name="scrape-nutrition-url"),
    path("api/menu-items/details/<int:menu_item_api_id>/", get_menu_item_details, name="menu-item-details"),
    path("api/dining/places/open/", get_open_places, name="dining-places-open"),
    path(
        "api/menu-items/upvotes-bookmarks/<int:menu_item_id>/",
        get_upvotes_bookmarks_for_menu_item,
        name="get-upvotes-bookmarks",
    ),
    path(
        "api/menu-items/upvotes-bookmarks/update/<int:menu_item_id>/",
        post_upvotes_bookmarks_for_menu_item,
        name="post-upvotes-bookmarks",
    ),
    path("api/menu-items/<int:menu_item_id>/", get_menu_item_with_ratings, name="menu-item-with-ratings"),
    path("api/menu-items/<int:menu_item_id>/ratings/", get_menu_item_ratings, name="menu-item-ratings"),
    path("api/menu-items/<int:menu_item_id>/rate/", create_menu_item_rating, name="create-menu-item-rating"),
    path("api/ratings/<int:rating_id>/", manage_rating, name="manage-rating"),
    path("api/user/ratings/", get_user_ratings, name="user-ratings"),
    path("api/menu-items/top-rated/", get_top_rated_menu_items, name="top-rated-menu-items"),
    path("api/user/me/", me, name="auth-me"),
    path("api/auth/verify/", verify, name="auth-verify"),
    path("api/user/update/", update_user_profile, name="update-user-profile"),
]
