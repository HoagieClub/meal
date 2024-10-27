"""API manager class for the /dining/ endpoint from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/locations
- /dining/events
- /dining/menus

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

from hoagiemeal.logger import logger
from student_app import StudentApp
from schemas import Schemas


class Dining(StudentApp):
    """Handles functionalities related to dining information, such as locations, menus, and events."""

    def __init__(self):
        super().__init__()
        self.DINING_LOCATIONS = "/dining/locations"
        self.DINING_EVENTS = "/dining/events"
        self.DINING_MENU = "/dining/menu"
        self.schemas = Schemas()

    def get_locations(self, fmt: str = "xml") -> dict:
        """Fetch a list of dining locations in XML format."""
        logger.info("Fetching dining locations.")
        response = self._make_request(
            self.DINING_LOCATIONS,
            params={"categoryId": "2"},  # how do i get 3 as well?
            fmt=fmt,
        )
        schema = self.schemas.get_dining_xsd()
        if not self.validate_xml(response, schema):
            logger.error("Invalid XML format for dining locations.")
            raise ValueError("Invalid XML format for dining locations.")
        return self._parse_xml(response)

    def get_events(self, placeID: str = "1007") -> dict:
        """Fetch dining venue open hours as an iCal stream for a given placeID.
        
        Note: "1007" seems to correspond to the Princeton Dining Calendar.

        Remark: The response uses LF line-endings with a Content-Type of text/plain
        but is actually in iCal (text/calendar) format.

        Args:
            placeID (str): The ID of the dining venue.

        Returns:
            dict: Parsed iCal data with event details (summary, start time, end time, etc.).

        """
        logger.info(f"Fetching dining events for placeID: {placeID}.")
        params = {"placeID": placeID}
        response = self._make_request(self.DINING_EVENTS, params=params, fmt="ical")
        return self._parse_ical(response)

    def get_menu(self, locationID: str, menuID: str) -> dict:
        """Fetch the menu for a specific dining location.

        Args:
            locationID (str): The ID of the dining location.
            menuID (str): The ID of the dining menu.

        Returns:
            dict: A JSON object containing the menu details.

        """
        logger.info(f"Fetching dining menu for locationID: {locationID}, menuID: {menuID}.")
        params = {"locationID": locationID, "menuID": menuID}
        response = self._make_request(self.DINING_MENU, params=params)
        response = msj.decode(response)
        return response


def _test_dining_locations():
    # Create an instance of the Dining class
    dining = Dining()

    # Test: Get Dining Locations
    logger.info("Testing: Get Dining Locations...")
    try:
        # Fetch dining locations in XML format and log the raw XML response
        locations_xml = dining.get_locations(fmt="xml")
        logger.info(f"Dining Locations (Raw XML): {locations_xml}")

        # Extract location IDs with corresponding names
        locations = locations_xml.get("locations", {}).get("location", [])
        location_id_name_pairs = []

        # Loop over each location in the response
        for loc in locations:
            building = loc.get("building", {})
            location_id = building.get("location_id", "Unknown ID")
            location_name = loc.get("name", "Unknown Name")
            location_id_name_pairs.append((location_id, location_name))

        # Log and return the location ID and name pairs
        logger.info(f"Location ID and Name Pairs: {location_id_name_pairs}")
        logger.info(f"Location ID length: {len(location_id_name_pairs)}")
        return location_id_name_pairs

    except Exception as e:
        logger.error(f"Error fetching dining locations: {e}")


def _test_get_events():
    dining = Dining()
    logger.info("Testing: Get Dining Events...")
    try:
        events = dining.get_events(placeID="1007") # 1007 ~ Princeton Dining Calendar?
        logger.info(f"Dining Events fetched: {events}")

        # Iterate and log each event detail
        event_list = events.get("events", [])
        for event in event_list:
            summary = event.get("summary", "No Summary")
            start = event.get("start", "No Start Time")
            end = event.get("end", "No End Time")
            uid = event.get("uid", "No UID")
            description = event.get("description", "No Description")
            logger.info(
                f"Event Summary: {summary}, Start: {start}, End: {end}, UID: {uid}, Description: {description}"
            )

    except Exception as e:
        logger.error(f"Error fetching dining events: {e}")


def _test_dining_apis():
    dining = Dining()
    response = dining.get_locations()

    for location in response["locations"]["location"]:
        name = location.get("name")
        map_name = location.get("mapName")
        dbid = location.get("dbid")
        latitude = location["geoloc"].get("lat")
        longitude = location["geoloc"].get("long")
        building_name = location["building"].get("name")

        # Handle both single and multiple amenities
        amenities_data = location["amenities"]["amenity"]
        if isinstance(amenities_data, list):
            amenities = [amenity["name"] for amenity in amenities_data]
        else:
            amenities = [amenities_data["name"]]

        logger.info(f"Location Name: {name}")
        logger.info(f"Map Name: {map_name}")
        logger.info(f"Database ID: {dbid}")
        logger.info(f"Latitude: {latitude}")
        logger.info(f"Longitude: {longitude}")
        logger.info(f"Building Name: {building_name}")
        logger.info(f"Amenities: {', '.join(amenities)}")
        logger.info("---" * 40)

        try:
            # Fetch the menu data
            menu_data = dining.get_menu(locationID=dbid, menuID="2024-10-24-Dinner")
            logger.debug(f"Raw menu data fetched: {menu_data}")

            # Now check if menu_data is a dictionary and has the "menus" key
            if isinstance(menu_data, dict) and "menus" in menu_data:
                logger.info(f"Dining Menu for {name}:")
                for item in menu_data["menus"]:
                    menu_id = item.get("id")
                    menu_name = item.get("name")
                    description = item.get("description")
                    link = item.get("link")

                    logger.info(f" - Menu Item ID: {menu_id}")
                    logger.info(f"   Name: {menu_name}")
                    logger.info(f"   Description: {description}")
                    logger.info(f"   Link: {link}") # Scrape data from this link
                logger.info("---" * 40)
            else:
                logger.warning(f"No valid menu data available for {name} (location ID: {dbid}).")
        except Exception as e:
            logger.error(f"Exception occurred: {e}")
            logger.error(
                f"Location Details - Name: {name}, DBID: {dbid}, Latitude: {menu_data.get('geoloc', {}).get('lat', 'N/A')}, Longitude: {menu_data.get('geoloc', {}).get('long', 'N/A')}"
            )


if __name__ == "__main__":
    _test_dining_locations()
    _test_get_events()
    _test_dining_apis()
