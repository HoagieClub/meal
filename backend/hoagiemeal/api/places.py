"""
API manager class for the /places/open endpoint from the StudentApp API.

Copyright © 2021-2024 Hoagie Club and affiliates.

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

from student_app import StudentApp
from hoagiemeal.logger import logger


class Places(StudentApp):
    """
    Fetches availability of various campus venues.
    """

    def __init__(self):
        super().__init__()
        self.PLACES_OPEN = "/places/open"

    def get_open_places(self) -> dict:
        """
        Retrieve a list of venues in a category (default: all dining venues)
        with their current open status.

        The "open" property will be either "yes" or "no".

        Returns:
            dict: A JSON object containing venue names, IDs, and their open status.

        Example:
            [{
                "name": "Whitman College",
                "id": "1",
                "open": "yes"
            }]
        """
        return self._make_request(self.PLACES_OPEN)  # JSON-only endpoint.


def test_places_open(formatted: bool = True):
    places = Places()
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
    test_places_open()
