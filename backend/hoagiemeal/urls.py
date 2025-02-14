"""URL endpoints for Hoagie Meal backend."""

from django.contrib import admin
from django.urls import path
from hoagiemeal.api.dining import DiningAPI
from hoagiemeal.api.places import get_open_places

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/dining/locations/", DiningAPI.get_locations, name="dining-locations"),
    path("api/dining/events/", DiningAPI.get_events, name="dining-events"),
    path("api/dining/menu/", DiningAPI.get_menu, name="dining-menu"),
    path("api/dining/places/open/", get_open_places, name="dining-places-open"),
]
