"""API manager class for the /dining/locations endpoint from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/locations

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

  https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.dining import DiningVenue
from django.db import transaction
from typing import TypedDict, List
from hoagiemeal.serializers import DiningVenueSerializer


class LocationsAPI(StudentApp):
    """Handles functionalities related to dining locations."""

    DINING_LOCATIONS = "/dining/locations"
    schemas = Schemas()

    def get_locations(self, category_id: str = "2", fmt: str = "xml") -> list:
        """Fetch a list of dining locations in XML format.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
          category_id (str): The category ID to fetch. Defaults to "2".
                    Use "2" for residential colleges, "3" for cafes/specialty venues.
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          list: A list of dining locations.

          API Response Structure:
          [
            {
                "name": str,
                "mapName": str,
                "dbid": str,
                "maploc": str,
                "geoloc": {
                    "lat": str,
                    "long": str
                },
                "building": {
                    "location_id": str,
                    "name": str
                },
                "eventsFeedConfig": {
                    "locationID": str,
                    "baseURL": str,
                    "menuURL": str
                },
                "amenities": {
                    "amenity": [
                        {
                            "name": str
                        }
                    ]
                }
            }
          ]

          Parsed Location Data Structure:
          [
            {
               "name": str,
               "map_name": str,
               "database_id": str,
               "latitude": str,
               "longitude": str,
               "building_name": str,
               "amenities": [str],
               "is_active": bool,
               "category_id": int,
            }
          ]

        """
        logger.info(f"Fetching dining locations for category {category_id}.")
        if category_id[0] not in ["2", "3"]:
            logger.error(f"Invalid category ID: {category_id[0]}.")
            raise ValueError(f"Invalid category ID: {category_id[0]}.")

        response = self._make_request(
            self.DINING_LOCATIONS,
            params={"categoryId": category_id},
            fmt=fmt,
        )
        schema = self.schemas.get_dining_xsd()
        if not self.validate_xml(response, schema):
            logger.error(f"Invalid XML format for dining locations (category {category_id}).")
            raise ValueError(f"Invalid XML format for dining locations (category {category_id}).")
        locations = self._parse_xml(response).get("locations", {}).get("location", [])
        locations = [parse_location_data(location) for location in locations]

        if len(locations) == 0:
            logger.error(f"No locations found for category {category_id}.")
            return []
        logger.info(f"Retrieved {len(locations)} dining locations for category {category_id}.")
        return locations


class LocationsCache:
    """Cache for dining locations."""

    def get_cached_locations(self, category_ids=None) -> list:
        """Get cached dining locations for a given category.

        Args:
            category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

        Returns:
            list: A list of dining venue data.

        """
        logger.info(f"Getting cached dining locations for categories: {', '.join(category_ids)}")
        if category_ids is None:
            category_ids = ["2", "3"]
        if not all(category_id in ["2", "3"] for category_id in category_ids):
            logger.error(f"Invalid category IDs: {category_ids}.")
            raise ValueError(f"Invalid category IDs: {category_ids}.")

        locations = DiningVenue.objects.filter(category_id__in=category_ids)
        if len(locations) == 0:
            logger.error(f"No locations found for category {category_ids}.")
            return []

        serializer = DiningVenueSerializer(locations, many=True)
        logger.info(f"Retrieved {len(serializer.data)} dining locations for category {category_ids}.")
        return serializer.data

    def cache_locations(self, locations: list) -> list:
        """Cache dining locations.

        Args:
            locations (list): The list of locations to cache.

        Returns:
            list: A list of dining venue data.

        """
        logger.info(f"Caching {len(locations)} dining locations.")
        if len(locations) == 0:
            logger.error("No locations to cache.")
            return []

        dining_venues = []
        for location in locations:
            database_id = location.get("database_id")
            category_id = location.get("category_id")
            try:
                with transaction.atomic():
                    exists = DiningVenue.objects.filter(database_id=database_id, category_id=category_id).exists()
                    if exists:
                        continue
                    dining_venue, _ = DiningVenue.objects.get_or_create(**location)
                    dining_venues.append(DiningVenueSerializer(dining_venue).data)
            except Exception as e:
                logger.error(f"Error caching location {location.get('name')}: {e}")
                continue

        if len(dining_venues) == 0:
            logger.error("No locations cached.")
            return []
        logger.info(f"Cached {len(dining_venues)} dining locations.")
        return dining_venues


class LocationsService:
    """Service for managing dining locations."""

    LOCATIONS_API = LocationsAPI()
    LOCATIONS_CACHE = LocationsCache()

    def get_locations(self, category_ids=None) -> list:
        """Get dining locations from the cache or API.

        Args:
            category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

        Returns:
            list: A list of dining venue data.

        """
        logger.info(
            f"Getting dining locations for categories: {', '.join(category_ids if category_ids else ['2', '3'])}"
        )
        cached_locations = self.LOCATIONS_CACHE.get_cached_locations(category_ids)
        if len(cached_locations) > 0:
            return cached_locations

        api_locations = self.LOCATIONS_API.get_all_category_locations(category_ids)
        if len(api_locations) == 0:
            logger.error(f"No locations found for category {category_ids}.")
            return []
        return api_locations

    def get_or_cache_locations(self, category_ids=None) -> list:
        """Get or cache dining locations for a given category.

        Args:
            category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

        Returns:
            list: A list of dining venue data.

        """
        logger.info(
            f"Getting or caching dining locations for categories: {', '.join(category_ids if category_ids else ['2', '3'])}"
        )
        cached_locations = self.LOCATIONS_CACHE.get_cached_locations(category_ids)
        if len(cached_locations) > 0:
            return cached_locations

        api_locations = self.LOCATIONS_API.get_all_category_locations(category_ids)
        cached_locations = self.LOCATIONS_CACHE.cache_locations(api_locations)
        if len(cached_locations) == 0:
            logger.error(f"No locations cached for category {category_ids}.")
            return []
        return cached_locations


#################### Exposed endpoints #########################

locations_service = LocationsService()


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations(request):
    """Django view function to get dining locations.

    Args:
        request (Request): The HTTP request object.
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        Response: The HTTP response object.
        locations (list): A list of dining venue data.

    """
    try:
        logger.info(
            f"Getting dining locations for categories: {', '.join(request.GET.getlist('category_id', ['2', '3']))}"
        )
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        locations = locations_service.get_locations(category_ids)
        return Response(locations)
    except Exception as e:
        logger.error(f"Error in get_dining_locations view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@cache_page(60 * 5)
def get_or_cache_locations(request):
    """Django view function to get or cache dining locations for a given category.

    Args:
        request (Request): The HTTP request object.
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        Response: The HTTP response object.
        locations (list): A list of dining venue data.

    """
    try:
        logger.info(
            f"Getting or caching dining locations for categories: {', '.join(request.GET.getlist('category_id', ['2', '3']))}"
        )
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        locations = locations_service.get_or_cache_locations(category_ids)
        return Response(locations)
    except Exception as e:
        logger.error(f"Error in get_or_cache_locations view: {e}")
        return Response({"error": str(e)}, status=500)


#################### Utility functions for working with dining data #########################


def parse_location_data(location: dict) -> dict:
    """Parse dining location data to a format that can be used to create a dining location instance.

    Args:
        location (dict): The location data to parse.

    Returns:
        dict: The parsed location data.
        Returned data structure:
        {
            "name": str,
            "map_name": str,
            "database_id": str,
            "latitude": str,
            "longitude": str,
            "building_name": str,
            "amenities": [str],
            "is_active": bool,
            "category_id": int,
        }

    """
    amenities = location.get("amenities", {}).get("amenity", [])
    if isinstance(amenities, dict):
        amenities = [amenities]
    amenity_list = [amenity.get("name") for amenity in amenities]

    name = location.get("name", "").strip()
    map_name = location.get("mapName", "").strip()
    latitude = location.get("geoloc", {}).get("lat", "").strip()
    longitude = location.get("geoloc", {}).get("long", "").strip()
    building_name = location.get("building", {}).get("name", "").strip()
    database_id = location.get("dbid", "").strip()
    is_active = True

    inactive_suffixes = [" - closed", " -closed"]
    for suffix in inactive_suffixes:
        lower_suffix = suffix.lower()

        if name.lower().endswith(lower_suffix):
            name = name[: -len(suffix)].rstrip()
            is_active = False

        if map_name.lower().endswith(lower_suffix):
            map_name = map_name[: -len(suffix)].rstrip()
            is_active = False

    remove_suffix = "-Fri & Sat Dinner Hours based on sundown & service times"
    if name.endswith(remove_suffix):
        name = name[: -len(remove_suffix)].rstrip()
    if map_name.endswith(remove_suffix):
        map_name = map_name[: -len(remove_suffix)].rstrip()

    CATEGORY_2_DINING_VENUES = {
        "Center for Jewish Life",
        "Forbes College",
        "Graduate College",
        "Mathey College",
        "Rockefeller College",
        "Whitman & Butler Colleges",
        "Yeh College & New College West",
    }
    CATEGORY_3_DINING_VENUES = {
        "Atrium Cafe",
        "Cafe 701",
        "Cafe Vivian",
        "Chancellor Green Cafe",
        "Chemistry CaFe",
        "EQuad Cafe",
        "Frist Gallery",
        "Garden Room",
        "Genomics Cafe",
        "Meadows Cafe",
        "Mosaic Restaurant",
        "Sally Frank Cafe at Prospect House",
        "Shultz Cafe",
        "Studio 34",
        "Tiger Tea Room",
        "Witherspoon's",
    }

    category_id = 2 if name in CATEGORY_2_DINING_VENUES else 3 if name in CATEGORY_3_DINING_VENUES else None
    if category_id is None:
        logger.error(f"Unknown category for dining venue: {name}")

    return {
        "name": name,
        "map_name": map_name,
        "database_id": database_id,
        "latitude": latitude,
        "longitude": longitude,
        "building_name": building_name,
        "amenities": amenity_list,
        "is_active": is_active,
        "category_id": category_id,
    }
