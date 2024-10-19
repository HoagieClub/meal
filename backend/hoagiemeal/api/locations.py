"""
API manager class for the /locations/search endpoint from the StudentApp API.

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


class Locations(StudentApp):
    """
    Fetches the name and ID of a location provided a home/office address.
    """

    def __init__(self):
        super().__init__()
        self.LOCATIONS = "/locations/search"

    def get_location(self, office: str) -> dict:
        """
        Fetches the name and ID of a location provided an address.

        Args:
            office (str): The address of the location.

        Returns:
            dict: A JSON object containing the name and ID of the location.

        Example:
            office="45 Stanworth Apartments"
            {
                {
                "id": "5063",
                    "name": "Stanworth Apartments"
                }
            }
        """
        params = {"office": office}
        return self._make_request(self.LOCATIONS, params=params)


def test_locations():
    locations = Locations()
    office_address = "45 Stanworth Apartments"

    try:
        result = locations.get_location(office=office_address)
        result = msj.format(result, indent=0)
        logger.info(f"Location fetched: {result}")

    except Exception as e:
        logger.error(f"Error fetching location: {e}")


if __name__ == "__main__":
    test_locations()
