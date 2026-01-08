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
from rest_framework import status

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.dining import DiningVenue
from django.db import transaction
from hoagiemeal.serializers import DiningVenueSerializer
from typing import Optional

DISABLE_CACHE = False
CACHE_TIMEOUT = 60 * 30  # 30 minutes


class LocationsAPI(StudentApp):
    """Handles functionalities related to the /dining/locations endpoint from the StudentApp API."""

    DINING_LOCATIONS = "/dining/locations"
    SCHEMAS = Schemas()

    def get_locations(self, category_ids: list = ["2", "3"], fmt: str = "xml") -> Optional[dict]:
        """Fetch a list of dining locations in XML format.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
          category_ids (list): The category IDs to fetch. Defaults to ["2", "3"].
          Use "2" for residential colleges, "3" for cafes/specialty venues.
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          dict: A dictionary of dining locations by database ID.

        """
        logger.info(f"Fetching dining locations for categories: {', '.join(category_ids)}.")
        try:
            # Fetch locations for each category
            locations = {}
            for category_id in category_ids:
                # Fetch locations from API
                response = self._make_request(
                    self.DINING_LOCATIONS,
                    params={"categoryId": category_id},
                    fmt=fmt,
                )

                # Validate XML format and parse
                schema = self.SCHEMAS.get_dining_xsd()
                if not self.validate_xml(response, schema):  # type: ignore
                    logger.error(f"Invalid XML format for dining locations (category {category_id}).")
                    raise ValueError(f"Invalid XML format for dining locations (category {category_id}).")
                category_locations = self._parse_xml(response).get("locations", {}).get("location", [])  # type: ignore

                # Sometimes the response is a dictionary, convert to list if so
                if isinstance(category_locations, dict):
                    category_locations = [category_locations]

                # Parse each location and add to the locations dictionary
                for location in category_locations:
                    database_id = int(location.get("dbid", "").strip())
                    location_parsed = parse_location_data(location, category_id)
                    if location_parsed:
                        locations[database_id] = location_parsed

            # Check if no locations were found
            if not locations:
                logger.error(f"No locations found for categories: {', '.join(category_ids)}.")
                return None

            logger.info(
                f"Retrieved {len(locations.keys())} dining locations for categories: {', '.join(category_ids)}."
            )
            return locations
        except Exception as e:
            logger.error(f"Error in get_locations: {e}")
            return None


class LocationsCache:
    """Handles database caching operations for dining locations."""

    def get_cached_locations(self, category_ids: list = ["2", "3"]) -> Optional[dict]:
        """Get cached dining locations for a given category.

        Args:
            category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

        Returns:
            dict: A dictionary of dining venue data by database ID.

        """
        logger.info(f"Getting cached dining locations for categories: {', '.join(category_ids)}")
        try:
            # Get cached locations from database
            locations = DiningVenue.objects.filter(category_id__in=category_ids)
            if len(locations) == 0:
                logger.info(f"No cached locations found for categories: {', '.join(category_ids)}.")
                return None

            # Check if the number of unique categories matches the number of categories requested
            unique_categories = len(set(location.category_id for location in locations))
            if unique_categories != len(category_ids):
                logger.info(
                    f"Number of unique categories: {unique_categories} does not match number of categories: {len(category_ids)}, missing entries from cache."
                )
                return None

            # Serialize and return the locations as a dictionary by database ID
            serializer = DiningVenueSerializer(locations, many=True)
            locations_dict = {location.get("database_id"): location for location in serializer.data}
            if not locations_dict:
                logger.info(f"No cached locations found for categories: {', '.join(category_ids)}.")
                return None

            logger.info(
                f"Retrieved {len(serializer.data)} dining locations for categories: {', '.join(category_ids)}."
            )
            return locations_dict
        except Exception as e:
            logger.error(f"Error in get_cached_locations: {e}")
            return None

    def cache_locations(self, locations: dict) -> bool:
        """Cache dining locations.

        Args:
            locations (dict): The dictionary of locations to cache by database ID.

        Returns:
            bool: True if locations were cached successfully, False otherwise.

        """
        logger.info(f"Caching {len(list(locations.keys()))} dining locations.")
        try:
            # Cache each location
            with transaction.atomic():
                for _, location in locations.items():
                    DiningVenue.objects.get_or_create(**location)

            logger.info(f"Cached {len(list(locations.keys()))} dining locations.")
            return True
        except Exception as e:
            logger.error(f"Error in cache_locations: {e}")
            return False


class LocationsService:
    """Service for managing dining locations."""

    LOCATIONS_API = LocationsAPI()
    LOCATIONS_CACHE = LocationsCache()

    def get_or_cache_locations(self, category_ids: list = ["2", "3"]) -> Optional[dict]:
        """Get or cache dining locations for a given category.

        Args:
            category_ids (list): List of category IDs to fetch.

        Returns:
            dict: A dictionary of dining venue data by database ID.

        """
        logger.info(f"Getting or caching dining locations for categories: {', '.join(category_ids)}.")
        try:
            # Return cached locations if they exist
            cached_locations = self.LOCATIONS_CACHE.get_cached_locations(category_ids)
            if cached_locations:
                logger.info(f"Returning cached locations for categories: {', '.join(category_ids)}.")
                return cached_locations

            # Otherwise, fetch locations from API
            api_locations = self.LOCATIONS_API.get_locations(category_ids)
            if not api_locations:
                logger.error(f"No locations found for categories: {', '.join(category_ids)}.")
                return None

            # If cache is disabled, return API locations
            if DISABLE_CACHE:
                logger.info("Cache is disabled, returning API locations.")
                return api_locations

            # Cache locations
            cached_locations = self.LOCATIONS_CACHE.cache_locations(api_locations)
            if not cached_locations:
                logger.error(f"Error caching locations for categories: {', '.join(category_ids)}.")
                return None

            # Return cached locations
            logger.info(f"Returning cached locations for categories: {', '.join(category_ids)}.")
            return self.LOCATIONS_CACHE.get_cached_locations(category_ids)
        except Exception as e:
            logger.error(f"Error in get_or_cache_locations: {e}")
            return None


#################### Exposed endpoints #########################

locations_service = LocationsService()


@api_view(["GET"])
@cache_page(CACHE_TIMEOUT)
def get_dining_locations(request):
    """Django view function to get or cache dining locations.

    Args:
        request (Request): The HTTP request object.
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2"].

    Returns:
        Response: The HTTP response object.
        locations (dict): A dictionary of dining venue data by database ID.

    """
    logger.info(f"Getting or caching dining locations for request: {request}")
    try:
        # Get category IDs from request and validate
        category_ids = request.GET.getlist("category_id", ["2"])
        if not all(category_id in ["2", "3"] for category_id in category_ids):
            logger.error(f"Invalid category IDs: {category_ids}.")
            return Response(
                {
                    "data": None,
                    "message": f"Invalid category IDs: {category_ids}.",
                    "error": "Invalid category IDs: {category_ids}.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or cache dining locations
        logger.info(f"Getting or caching dining locations for categories: {', '.join(category_ids)}")
        locations = locations_service.get_or_cache_locations(category_ids)
        if not locations:
            return Response(
                {
                    "data": None,
                    "message": "No dining locations found",
                    "error": "No dining locations found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Return dining locations
        return Response(
            {"data": locations, "message": "Dining locations fetched successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_dining_locations view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching dining locations: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@cache_page(CACHE_TIMEOUT)
def get_all_dining_locations(request):
    """Django view function to get all dining locations.

    Args:
        request (Request): The HTTP request object.

    Returns:
        Response: The HTTP response object.
        locations (dict): A dictionary of dining venue data by database ID.

    """
    logger.info(f"Getting all dining locations for request: {request}")
    try:
        # Get all dining locations
        all_category_ids = ["2", "3"]
        locations = locations_service.get_or_cache_locations(all_category_ids)
        if not locations:
            return Response(
                {"data": None, "message": "No dining locations found", "error": "No dining locations found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Return dining locations
        logger.info(f"Returning dining locations for all categories: {', '.join(all_category_ids)}.")
        return Response(
            {"data": locations, "message": "Dining locations fetched successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_all_dining_locations view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching all dining locations: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


#################### Utility functions for working with locations data #########################


def parse_location_data(location: dict, category_id: str) -> Optional[dict]:
    """Parse dining location data to a format that can be used to create a dining location instance.

    Args:
        location (dict): The location data to parse.
        category_id (str): The category ID of the location.

    Returns:
        dict: The parsed location data.

    """
    logger.info(f"Parsing location data for location: {location} and category ID: {category_id}.")
    try:
        # Extract amenities from location data
        amenities = location.get("amenities", {}).get("amenity", [])
        if isinstance(amenities, dict):
            amenities = [amenities]
        amenity_list = [amenity.get("name") for amenity in amenities]

        # Extract other location data
        name = location.get("name", "").strip()
        map_name = location.get("mapName", "").strip()
        latitude = float(location.get("geoloc", {}).get("lat", "").strip())
        longitude = float(location.get("geoloc", {}).get("long", "").strip())
        building_name = location.get("building", {}).get("name", "").strip()
        database_id = int(location.get("dbid", "").strip())
        is_active = True

        # Remove inactive suffixes from name and map name
        inactive_suffixes = [" - closed", " -closed"]
        for suffix in inactive_suffixes:
            lower_suffix = suffix.lower()
            if name.lower().endswith(lower_suffix):
                name = name[: -len(suffix)].rstrip()
                is_active = False
            if map_name.lower().endswith(lower_suffix):
                map_name = map_name[: -len(suffix)].rstrip()
                is_active = False

        # Remove suffix from name and map name
        remove_suffix = "-Fri & Sat Dinner Hours based on sundown & service times"
        if name.endswith(remove_suffix):
            name = name[: -len(remove_suffix)].rstrip()
        if map_name.endswith(remove_suffix):
            map_name = map_name[: -len(remove_suffix)].rstrip()

        # Special case for Yeh College & New College West
        if name == "Yeh College & New College West":
            name = "Yeh College & NCW"
        if map_name == "Yeh College & New College West":
            map_name = "Yeh College & NCW"

        # Special case for Rockefeller College
        if map_name == "Rockefeller College" or name == "Rockefeller College":
            return None
        if map_name == "Mathey College":
            map_name = "Mathey & Rockefeller Colleges"
        if name == "Mathey College":
            name = "Mathey & Rockefeller Colleges"

        # Return parsed location data
        logger.info(f"Parsed location data for location: {location} and category ID: {category_id}.")
        return {
            "name": name,
            "map_name": map_name,
            "database_id": database_id,
            "latitude": latitude,
            "longitude": longitude,
            "building_name": building_name,
            "amenities": amenity_list,
            "is_active": is_active,
            "category_id": int(category_id),
        }
    except Exception as e:
        logger.error(f"Error in parse_location_data: {e}")
        return None
