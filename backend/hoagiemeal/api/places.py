"""API manager class for the /places/open endpoint from the StudentApp API.

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

import msgspec.json as msj

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page

from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.utils.logger import logger


class PlacesAPI(StudentApp):
    """Fetches availability of various campus venues."""

    def __init__(self):
        """Initialize the PlacesAPI class."""
        super().__init__()
        self.PLACES_OPEN = "/places/open"

    def get_open_places(self) -> dict:
        """Retrieve a list of venues in a category.

        NOTE: The "open" property will be either "yes" or "no".

        Returns:
            dict: A JSON object containing venue names, IDs, and their open status.

        Example:
            [{
                "name": "Whitman College",
                "id": "1",
                "open": "yes"
            }]

        """
        return self._make_request(self.PLACES_OPEN)  # type: ignore


@api_view(["GET"])
@cache_page(60 * 5)
def get_open_places(request):
    """Django view function to get open places."""
    try:
        places_api = PlacesAPI()
        open_places = places_api.get_open_places()
        return Response(msj.decode(open_places))
    except Exception as e:
        logger.error(f"Error in get_open_places view: {e}")
        return Response({"error": str(e)}, status=500)


def _test_places_open(formatted: bool = True):
    places = PlacesAPI()
    logger.debug("Testing: Get Open Places...")
    try:
        open_places = places.get_open_places()
        open_places = msj.decode(open_places)
        logger.info(f"Open Places fetched. Total places received: {len(open_places)}")

        place_status_list = []

        if isinstance(open_places, dict):
            places_list = open_places.get("places", [])
        elif isinstance(open_places, list):
            places_list = open_places
        else:
            logger.error("Unexpected format of open_places response")
            return []

        for place in places_list:
            if isinstance(place, dict):
                place_name = place.get("name", "Unknown Name")
                open_status = place.get("open", "Unknown Status")
            else:
                place_name = str(place)  # Cast non-dict types to string
                open_status = "Unknown Status"
            place_status_list.append((place_name, open_status))

        place_status_list_json = msj.encode(place_status_list)
        logger.info(f"Place Name and Open Status Pairs: {place_status_list_json}")

        total_open = sum(1 for _, status in place_status_list if status == "yes")
        logger.info(f"Total Open Places: {total_open} / {len(place_status_list)}")

        return place_status_list

    except Exception as e:
        logger.error(f"Error fetching open places: {e}")


if __name__ == "__main__":
    print("WARNING: This script should be run through Django's management command:")
    print("python manage.py test_places")
    print("\nAttempting to run directly, but this may fail if Django is not properly configured.")

    import os
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
    try:
        django.setup()
        _test_places_open()
    except Exception as e:
        print(f"Error: {e}")
        print("Please use the management command instead.")
