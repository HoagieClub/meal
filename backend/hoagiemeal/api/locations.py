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


class LocationsAPI(StudentApp):
    """Handles functionalities related to dining locations."""

    DINING_LOCATIONS = "/dining/locations"
    schemas = Schemas()

    def get_locations(self, category_id: str = "2", fmt: str = "xml") -> dict:
        """Fetch a list of dining locations in XML format.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
          category_id (str): The category ID to fetch. Defaults to "2".
                    Use "2" for residential colleges, "3" for cafes/specialty venues.
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          dict: A dictionary containing the dining locations.

        """
        logger.info(f"Fetching dining locations for category {category_id}.")
        response = self._make_request(
            self.DINING_LOCATIONS,
            params={"categoryId": category_id},
            fmt=fmt,
        )
        schema = self.schemas.get_dining_xsd()
        if not self.validate_xml(response, schema):
            logger.error(f"Invalid XML format for dining locations (category {category_id}).")
            raise ValueError(f"Invalid XML format for dining locations (category {category_id}).")
        return self._parse_xml(response)

    def get_all_category_locations(self, category_ids=None, fmt: str = "xml") -> dict:
        """Fetch dining locations from multiple categories and combine them.

        Args:
          category_ids (list): List of category IDs to fetch. Defaults to ["2", "3"].
          fmt (str): The format of the response. Defaults to "xml".

        Returns:
          dict: A dictionary containing combined dining locations from all categories.

        """
        if category_ids is None:
            category_ids = ["2", "3"]

        logger.info(f"Fetching dining locations for categories: {', '.join(category_ids)}")
        all_locations = {"locations": {"location": []}}

        for category_id in category_ids:
            try:
                response = self.get_locations(category_id=category_id, fmt=fmt)
                if response and "locations" in response and "location" in response["locations"]:
                    locations = response["locations"]["location"]
                    if isinstance(locations, list):
                        all_locations["locations"]["location"].extend(locations)
                    else:
                        all_locations["locations"]["location"].append(locations)
                    logger.info(
                        f"Added {len(locations) if isinstance(locations, list) else 1} locations from category {category_id}"
                    )
            except Exception as e:
                logger.error(f"Error fetching locations for category {category_id}: {e}")

        return all_locations


#################### Exposed endpoints #########################

locations_api = LocationsAPI()


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations(request):
    """Django view function to get dining locations."""
    try:
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        locations = locations_api.get_all_category_locations(category_ids)
        return Response(locations)
    except Exception as e:
        logger.error(f"Error in get_dining_locations view: {e}")
        return Response({"error": str(e)}, status=500)


#################### Utility functions for working with dining data #########################


def get_all_dining_locations(category_ids=None):
    """Fetch all dining locations and return them as a list of dictionaries.

    Args:
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      list: A list of dictionaries containing location information.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    try:
        response = locations_api.get_all_category_locations(category_ids)
        locations = []

        for location in response["locations"]["location"]:
            loc_info = {
                "name": location.get("name"),
                "map_name": location.get("mapName"),
                "dbid": location.get("dbid"),
                "latitude": location["geoloc"].get("lat"),
                "longitude": location["geoloc"].get("long"),
                "building_name": location["building"].get("name"),
            }

            # Handle both single and multiple amenities
            amenities_data = location["amenities"]["amenity"]
            if isinstance(amenities_data, list):
                loc_info["amenities"] = [amenity["name"] for amenity in amenities_data]
            else:
                loc_info["amenities"] = [amenities_data["name"]]

            locations.append(loc_info)

        logger.info(f"Retrieved {len(locations)} dining locations from categories: {', '.join(category_ids)}")
        return locations
    except Exception as e:
        logger.error(f"Error fetching dining locations: {e}")
        return []
