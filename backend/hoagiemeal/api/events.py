"""API manager class for the /dining/events endpoint from the StudentApp API.

This module fetches data from the following endpoints:

- /dining/events

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

import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.api.locations import LocationsAPI


class EventsAPI(StudentApp):
    """Handles functionalities related to dining events."""

    DINING_EVENTS = "/dining/events"
    schemas = Schemas()

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


#################### Exposed endpoints #########################

events_api = EventsAPI()


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_events(request):
    """Django view function to get dining events."""
    try:
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        date_str = request.GET.get("date", None)
        if date_str:
            events = get_dining_events_for_date(date_str, category_ids)
        else:
            events = get_all_dining_events(category_ids)

        return Response(events)
    except Exception as e:
        logger.error(f"Error in get_dining_events view: {e}")
        return Response({"error": str(e)}, status=500)


#################### Utility functions for working with dining data #########################


def get_events_for_location(dbid, location_name):
    """Fetch events for a specific dining location.

    Args:
      dbid (str): The database ID of the location.
      location_name (str): The name of the location (for logging).

    Returns:
      list: A list of event dictionaries.

    """
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")
        events_data = events_api.get_events(place_id=dbid)
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


def get_events_for_location_with_date(dbid, location_name, date_str=None):
    """Fetch events for a specific dining location with an optional date filter.

    Args:
      dbid (str): The database ID of the location.
      location_name (str): The name of the location (for logging).
      date_str (str, optional): Date string in YYYY-MM-DD format. Defaults to None.

    Returns:
      list: A list of event dictionaries.

    """
    try:
        logger.info(f"Fetching events for {location_name} (ID: {dbid})")

        # Try to add date parameter if provided
        params = {"placeId": dbid}
        if date_str:
            # Add date parameter if API supports it
            params["date"] = date_str
            logger.info(f"Using date parameter: {date_str}")

        # Use the standard get_events method
        events_data = events_api.get_events(place_id=dbid)
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


def analyze_date_range(all_location_events):
    """Analyze the date range of the events data.

    Args:
      all_location_events (dict): Dictionary mapping location names to events.

    Returns:
      tuple: (earliest_date, latest_date, total_days)

    """
    earliest_date = None
    latest_date = None
    all_dates = []

    for name, data in all_location_events.items():
        logger.info(f"Analyzing date range for {name}")

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


def get_all_dining_events(category_ids=None):
    """Fetch events for all dining locations.

    Args:
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Fetching events for all dining locations in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations_api = LocationsAPI()
    locations = locations_api.get_all_category_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location(dbid, name)
        all_location_events[name] = {"location_info": location, "events": events}

    return all_location_events


def get_dining_events_for_date(date_str, category_ids=None):
    """Fetch events for all dining locations for a specific date.

    Args:
      date_str (str): Date string in YYYY-MM-DD format.
      category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
      dict: Dictionary mapping location names to events.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    logger.info(f"Fetching events for all dining locations on {date_str} in categories: {', '.join(category_ids)}...")

    # Get all dining locations from specified categories
    locations_api = LocationsAPI()
    locations = locations_api.get_all_category_locations(category_ids)

    # Dictionary to store location name -> events mapping
    all_location_events = {}

    # Fetch events for each location
    for location in locations:
        name = location["name"]
        dbid = location["dbid"]

        events = get_events_for_location_with_date(dbid, name, date_str)
        all_location_events[name] = {"location_info": location, "events": events}

    return all_location_events
