"""API manager class for the /dining/ endpoint from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/locations
- /dining/events
- /dining/menus

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

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas


class Dining(StudentApp):
    """Handles functionalities related to dining information, such as locations, menus, and events."""

    def __init__(self):
        """Initialize the Dining class."""
        super().__init__()
        self.DINING_LOCATIONS = "/dining/locations"
        self.DINING_EVENTS = "/dining/events"
        self.DINING_MENU = "/dining/menu"
        self.schemas = Schemas()

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
            category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

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
                        # If there's only one location, it might not be in a list
                        all_locations["locations"]["location"].append(locations)
                    logger.info(
                        f"Added {len(locations) if isinstance(locations, list) else 1} locations from category {category_id}"
                    )
            except Exception as e:
                logger.error(f"Error fetching locations for category {category_id}: {e}")

        return all_locations

    def get_events(self, place_id: str = "1007") -> dict:
        """Fetch dining venue open hours as an iCal stream for a given place_id.

        NOTE: "1007" seems to correspond to the Princeton Dining Calendar.
        NOTE: The API expects the parameters to be in camelCase.

        Remark: The response uses LF line-endings with a Content-Type of text/plain
        but is actually in iCal (text/calendar) format.

        Args:
            place_id (str): The ID of the dining venue.

        Returns:
            dict: Parsed iCal data with event details (summary, start time, end time, etc.).

        """
        logger.info(f"Fetching dining events for place_id: {place_id}.")
        params = {"placeID": place_id}
        response = self._make_request(self.DINING_EVENTS, params=params, fmt="ical")
        return self._parse_ical(response)

    def get_menu(self, location_id: str, menu_id: str) -> dict:
        """Fetch the menu for a specific dining location.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
            location_id (str): The ID of the dining location.
            menu_id (str): The ID of the dining menu.

        Returns:
            dict: A JSON object containing the menu details.

        """
        logger.info(f"Fetching dining menu for location_id: {location_id}, menu_id: {menu_id}.")
        params = {"locationID": location_id, "menuID": menu_id}
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
        events = dining.get_events(place_id="1007")  # 1007 ~ Princeton Dining Calendar?
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
            menu_data = dining.get_menu(location_id=dbid, menu_id="2025-02-28-Lunch")
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
                    logger.info(f"   Link: {link}")  # Scrape data from this link
                logger.info("---" * 40)
            else:
                logger.warning(f"No valid menu data available for {name} (location ID: {dbid}).")
        except Exception as e:
            logger.error(f"Exception occurred: {e}")
            logger.error(
                f"Location Details - Name: {name}, DBID: {dbid}, Latitude: {menu_data.get('geoloc', {}).get('lat', 'N/A')}, Longitude: {menu_data.get('geoloc', {}).get('long', 'N/A')}"
            )


def get_all_dining_locations(category_ids=None):
    """Fetch all dining locations and return them as a list of dictionaries.

    Args:
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        list: A list of dictionaries containing location information.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    dining = Dining()
    try:
        # Use the new method to get locations from all categories
        response = dining.get_all_category_locations(category_ids)
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


def get_events_for_location(dbid, location_name):
    """Fetch events for a specific dining location.

    Args:
        dbid (str): The database ID of the location.
        location_name (str): The name of the location (for logging).

    Returns:
        list: A list of event dictionaries.

    """
    dining = Dining()
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")
        events_data = dining.get_events(place_id=dbid)
        events = events_data.get("events", [])

        # Format the events for better readability
        formatted_events = []
        for event in events:
            formatted_event = {
                "summary": event.get("summary", "No Summary"),
                "start": event.get("start", "No Start Time"),
                "end": event.get("end", "No End Time"),
                "description": event.get("description", "No Description"),
            }
            formatted_events.append(formatted_event)

        logger.info(f"Retrieved {len(formatted_events)} events for {location_name}")
        return formatted_events
    except Exception as e:
        logger.error(f"Error fetching events for {location_name} (ID: {dbid}): {e}")
        return []


def analyze_date_range(all_location_events):
    """Analyze the date range of the events data.

    Args:
        all_location_events (dict): Dictionary mapping location names to events.

    Returns:
        tuple: (earliest_date, latest_date, total_days)

    """
    import datetime

    earliest_date = None
    latest_date = None

    # Collect all dates from all events
    all_dates = []

    for name, data in all_location_events.items():
        events = data["events"]

        for event in events:
            start_time = event["start"]
            end_time = event["end"]

            if isinstance(start_time, datetime.datetime):
                all_dates.append(start_time.date())

            if isinstance(end_time, datetime.datetime):
                all_dates.append(end_time.date())

    # Find the earliest and latest dates
    if all_dates:
        earliest_date = min(all_dates)
        latest_date = max(all_dates)

        # Calculate the total number of days
        total_days = (latest_date - earliest_date).days + 1

        return (earliest_date, latest_date, total_days)

    return (None, None, 0)


def get_events_for_location_with_date(dbid, location_name, date_str=None):
    """Fetch events for a specific dining location with an optional date filter.

    Args:
        dbid (str): The database ID of the location.
        location_name (str): The name of the location (for logging).
        date_str (str, optional): Date string in YYYY-MM-DD format. Defaults to None.

    Returns:
        list: A list of event dictionaries.

    """
    import datetime

    dining = Dining()
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")

        # Try to add date parameter if provided
        params = {"placeId": dbid}
        if date_str:
            # Add date parameter if API supports it
            params["date"] = date_str
            logger.info(f"Using date parameter: {date_str}")

        # Use the standard get_events method
        events_data = dining.get_events(place_id=dbid)
        events = events_data.get("events", [])

        # Format the events for better readability
        formatted_events = []
        for event in events:
            formatted_event = {
                "summary": event.get("summary", "No Summary"),
                "start": event.get("start", "No Start Time"),
                "end": event.get("end", "No End Time"),
                "description": event.get("description", "No Description"),
            }

            # Filter by date if specified
            if date_str and isinstance(formatted_event["start"], datetime.datetime):
                event_date = formatted_event["start"].date()
                filter_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

                if event_date == filter_date:
                    formatted_events.append(formatted_event)
            else:
                formatted_events.append(formatted_event)

        logger.info(f"Retrieved {len(formatted_events)} events for {location_name}")
        return formatted_events
    except Exception as e:
        logger.error(f"Error fetching events for {location_name} (ID: {dbid}): {e}")
        return []


def test_all_dining_events(category_ids=None):
    """Fetch and display events for all dining locations.

    Args:
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Testing events for all dining locations in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations = get_all_dining_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location(dbid, name)
        all_location_events[name] = {"location_info": location, "events": events}

    # Display the results in a formatted way
    logger.info("=" * 80)
    logger.info("DINING LOCATIONS AND THEIR EVENTS")
    logger.info("=" * 80)

    # Group locations by amenities to identify their category
    res_colleges = []
    cafes_specialty = []
    other = []

    for name, data in all_location_events.items():
        location = data["location_info"]
        amenities = location.get("amenities", [])

        # Check if it's a residential college
        if any("College:" in amenity for amenity in amenities):
            res_colleges.append(name)
        # Check if it's a cafe or specialty venue
        elif any("Cafe" in amenity or "Specialty" in amenity for amenity in amenities):
            cafes_specialty.append(name)
        else:
            other.append(name)

    # Print summary of location types
    logger.info("\nLocation Types Summary:")
    logger.info(f"Residential Colleges: {len(res_colleges)} locations")
    logger.info(f"Cafes/Specialty Venues: {len(cafes_specialty)} locations")
    logger.info(f"Other Venues: {len(other)} locations")
    logger.info(f"Total: {len(all_location_events)} locations")

    # Print details for each location
    for name, data in all_location_events.items():
        location = data["location_info"]
        events = data["events"]

        logger.info(f"\n\n{name.upper()} (ID: {location['dbid']})")
        logger.info("-" * 50)
        logger.info(f"Building: {location['building_name']}")
        logger.info(f"Coordinates: {location['latitude']}, {location['longitude']}")
        logger.info(f"Amenities: {', '.join(location['amenities'])}")

        if events:
            logger.info("\nUPCOMING EVENTS:")
            for i, event in enumerate(events, 1):
                logger.info(f"\n{i}. {event['summary']}")
                logger.info(f"   Start: {event['start']}")
                logger.info(f"   End: {event['end']}")
                if event["description"] != "No Description":
                    logger.info(f"   Description: {event['description']}")
        else:
            logger.info("\nNo events found for this location")

        logger.info("=" * 80)

    # Analyze the date range
    earliest_date, latest_date, total_days = analyze_date_range(all_location_events)
    if earliest_date and latest_date:
        logger.info("\nDate Range Analysis:")
        logger.info(f"Earliest Date: {earliest_date}")
        logger.info(f"Latest Date: {latest_date}")
        logger.info(f"Total Days: {total_days}")

        # Compare with current date
        import datetime

        today = datetime.datetime.now().date()
        days_from_today_to_earliest = (earliest_date - today).days
        days_from_today_to_latest = (latest_date - today).days

        logger.info(f"Today's Date: {today}")
        logger.info(f"Days from today to earliest date: {days_from_today_to_earliest}")
        logger.info(f"Days from today to latest date: {days_from_today_to_latest}")

    return all_location_events


def test_dining_events_for_date(date_str, category_ids=None):
    """Fetch and display events for all dining locations for a specific date.

    Args:
        date_str (str): Date string in YYYY-MM-DD format.
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Testing events for all dining locations on {date_str} in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations = get_all_dining_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location_with_date(dbid, name, date_str)
        all_location_events[name] = {"location_info": location, "events": events}

    # Display the results in a formatted way
    logger.info("=" * 80)
    logger.info(f"DINING LOCATIONS AND THEIR EVENTS FOR {date_str}")
    logger.info("=" * 80)

    # Count locations with events
    locations_with_events = sum(1 for data in all_location_events.values() if data["events"])
    logger.info(f"Found events for {locations_with_events} out of {len(all_location_events)} locations on {date_str}")

    for name, data in all_location_events.items():
        location = data["location_info"]
        events = data["events"]

        if events:
            logger.info(f"\n\n{name.upper()} (ID: {location['dbid']})")
            logger.info("-" * 50)
            logger.info(f"Building: {location['building_name']}")

            logger.info("\nEVENTS:")
            for i, event in enumerate(events, 1):
                # Convert to Eastern Time for display
                start_time = convert_utc_to_eastern(event["start"])
                end_time = convert_utc_to_eastern(event["end"])

                # Format times
                if isinstance(start_time, datetime.datetime):
                    start_str = start_time.strftime("%I:%M %p ET")
                else:
                    start_str = str(start_time)

                if isinstance(end_time, datetime.datetime):
                    end_str = end_time.strftime("%I:%M %p ET")
                else:
                    end_str = str(end_time)

                logger.info(f"{i}. {event['summary']} ({start_str} - {end_str})")

    return all_location_events


def format_events_as_table(all_location_events):
    """Format the events data as a table for easy viewing.

    Args:
        all_location_events (dict): Dictionary mapping location names to events.

    Returns:
        str: A formatted table string.

    """
    from tabulate import tabulate
    import datetime

    # Prepare data for tabulation
    table_data = []

    for name, data in all_location_events.items():
        location = data["location_info"]
        events = data["events"]

        if not events:
            # Add a row for locations with no events
            table_data.append(
                [
                    name,
                    location["dbid"],
                    "No events",
                    "",
                    "",
                ]
            )
        else:
            # Add a row for each event
            for event in events:
                # Try to parse datetime objects for better formatting
                start_time = event["start"]
                end_time = event["end"]

                if isinstance(start_time, datetime.datetime):
                    start_str = start_time.strftime("%Y-%m-%d %H:%M")
                else:
                    start_str = str(start_time)

                if isinstance(end_time, datetime.datetime):
                    end_str = end_time.strftime("%Y-%m-%d %H:%M")
                else:
                    end_str = str(end_time)

                table_data.append(
                    [
                        name,
                        location["dbid"],
                        event["summary"],
                        start_str,
                        end_str,
                    ]
                )

    # Create the table
    headers = ["Location", "ID", "Event", "Start Time", "End Time"]
    table = tabulate(table_data, headers=headers, tablefmt="grid")

    return table


def convert_utc_to_eastern(dt):
    """Convert a UTC datetime to Eastern Time.

    Args:
        dt: A datetime object in UTC

    Returns:
        A datetime object in Eastern Time with proper timezone info

    """
    import datetime
    import pytz

    # If it's not a datetime object, return as is
    if not isinstance(dt, datetime.datetime):
        return dt

    # If the datetime has no timezone info, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)

    # Convert to Eastern Time
    eastern = pytz.timezone("US/Eastern")
    return dt.astimezone(eastern)


def format_events_with_eastern_time(all_location_events):
    """Format the events data as a table with Eastern Time.

    Args:
        all_location_events (dict): Dictionary mapping location names to events.

    Returns:
        str: A formatted table string with times in Eastern Time.

    """
    from tabulate import tabulate
    import datetime

    # Prepare data for tabulation
    table_data = []

    for name, data in all_location_events.items():
        location = data["location_info"]
        events = data["events"]

        if not events:
            # Add a row for locations with no events
            table_data.append(
                [
                    name,
                    location["dbid"],
                    "No events",
                    "",
                    "",
                ]
            )
        else:
            # Add a row for each event
            for event in events:
                # Convert times to Eastern Time
                start_time = convert_utc_to_eastern(event["start"])
                end_time = convert_utc_to_eastern(event["end"])

                # Format the times
                if isinstance(start_time, datetime.datetime):
                    start_str = start_time.strftime("%Y-%m-%d %I:%M %p ET")
                else:
                    start_str = str(start_time)

                if isinstance(end_time, datetime.datetime):
                    end_str = end_time.strftime("%Y-%m-%d %I:%M %p ET")
                else:
                    end_str = str(end_time)

                # Add a row for this event
                table_data.append(
                    [
                        name,
                        location["dbid"],
                        event["summary"],
                        start_str,
                        end_str,
                    ]
                )

    # Create the table
    headers = ["Location", "ID", "Event", "Start Time (ET)", "End Time (ET)"]
    table = tabulate(table_data, headers=headers, tablefmt="grid")

    return table


if __name__ == "__main__":
    # _test_dining_locations()
    # _test_dining_apis()
    # _test_get_events()

    # Test all dining events and get the results
    all_location_events = test_all_dining_events(
        ["2", "3"]
    )  # Get both residential colleges and cafes/specialty venues

    # Analyze the date range
    earliest_date, latest_date, total_days = analyze_date_range(all_location_events)
    if earliest_date and latest_date:
        print("\nDate Range Analysis:")
        print(f"Earliest Date: {earliest_date}")
        print(f"Latest Date: {latest_date}")
        print(f"Total Days: {total_days}")

        # Compare with current date
        import datetime

        today = datetime.datetime.now().date()
        days_from_today_to_earliest = (earliest_date - today).days
        days_from_today_to_latest = (latest_date - today).days

        print(f"Today's Date: {today}")
        print(f"Days from today to earliest date: {days_from_today_to_earliest}")
        print(f"Days from today to latest date: {days_from_today_to_latest}")

    # Try to format as a table if tabulate is available
    try:
        # Original UTC table
        table = format_events_as_table(all_location_events)
        logger.info("\n\nEVENTS TABLE (UTC):\n")
        logger.info(table)

        # Eastern Time table
        try:
            et_table = format_events_with_eastern_time(all_location_events)
            logger.info("\n\nEVENTS TABLE (Eastern Time):\n")
            logger.info(et_table)
        except ImportError:
            logger.warning("pytz package not installed. Install with: pip install pytz")
    except ImportError:
        logger.warning("tabulate package not installed. Install with: pip install tabulate")

    # Test for specific dates
    # Uncomment to test specific dates
    today = datetime.datetime.now().date()
    test_dining_events_for_date(today.strftime("%Y-%m-%d"), ["2", "3"])
    test_dining_events_for_date((today + datetime.timedelta(days=3)).strftime("%Y-%m-%d"), ["2", "3"])
