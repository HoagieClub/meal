"""API manager class for the /dining/ endpoints from the StudentApp API.

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
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import json
import os

import datetime
from random import sample
import msgspec.json as msj
import pytz

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import models, transaction

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.menu import MenuItem, MenuRating, Menu
from hoagiemeal.models.dining import DiningVenue
from hoagiemeal.serializers import (
    MenuRatingSerializer,
    MenuRatingCreateSerializer,
    MenuItemWithRatingsSerializer,
)


USE_SAMPLE_MENUS = False  # Toggle this to False later when the API is fixed


class DiningAPI(StudentApp):
    """Handles functionalities related to dining information, such as locations, menus, and events."""

    def __init__(self):
        """Initialize the DiningAPI class."""
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

    def _fetch_and_decode_menu_from_api(self, location_id: str, menu_id: str) -> dict:
        """Helper to abstract the raw API call for menus."""
        params = {"locationID": location_id, "menuID": menu_id}
        try:
            response = self._make_request(self.DINING_MENU, params=params)
            logger.info(msg=f"Menu API response for {location_id}/{menu_id}: {response}")
            return msj.decode(response)
        except Exception as e:
            logger.error(f"Error fetching menu from raw API for {location_id}/{menu_id}: {e}")
            return {}  # Return an empty dict on failure

    def get_menu(self, location_id: str, menu_id: str) -> dict:
            """Fetch the menu for a specific dining location.
            ...
            """
            logger.info(f"Getting dining menu for location_id: {location_id}, menu_id: {menu_id}.")

            MEAL_TYPE_MAP = {
                'Breakfast': 'BR',
                'Lunch': 'LU',
                'Dinner': 'DI'
            }

            # 1. Parse menu_id to get date and meal type
            try:
                date_str, meal_type = menu_id.rsplit('-', 1)
                menu_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                meal_code = MEAL_TYPE_MAP.get(meal_type)
                if not meal_code:
                    raise ValueError("Invalid meal type in menu_id")
            except ValueError:
                logger.error(f"Invalid menu_id format for '{menu_id}'. Falling back to API call.")
                return self._fetch_and_decode_menu_from_api(location_id, menu_id)

            # 2. Check database for a cached menu
            try:
                venue = DiningVenue.objects.get(database_id=location_id)
                # Use prefetch_related for potential slight performance improvement on hit
                cached_menu = Menu.objects.prefetch_related('menu_items').filter(
                    dining_venue=venue, date=menu_date, meal=meal_code
                ).first()

                if cached_menu:
                    logger.info(f"✅ CACHE HIT for menu_id: {menu_id} at location_id: {location_id}")
                    menu_items = cached_menu.menu_items.all() # Get items from prefetched data
                    serialized_items = [
                        {
                            "id": item.api_id,
                            "name": item.name,
                            "description": item.description,
                            "link": item.link,
                        }
                        for item in menu_items
                    ]
                    # Return empty list if no items, matching API structure
                    return {"menus": serialized_items}

            except DiningVenue.DoesNotExist:
                logger.warning(f"DiningVenue with database_id {location_id} not found in DB. Cannot check cache or save menu.")
                # If the venue isn't in our DB, we can't cache, just return empty API result.
                return self._fetch_and_decode_menu_from_api(location_id, menu_id) # Or just return {} directly? Let's try API first.
            except Exception as e:
                logger.error(f"Database lookup error for menu_id {menu_id}: {e}. Falling back to API.")

            # --- Cache Miss Logic ---
            logger.info(f"🚫 CACHE MISS for menu_id: {menu_id}, location_id: {location_id}. Fetching from API.")
            
            # 3. Fetch from the external API
            api_menu_data = self._fetch_and_decode_menu_from_api(location_id, menu_id)

            # 4. Save the result (even if empty) to the database to cache it
            #    Only attempt to cache if the venue exists in our database.
            try:
                # Re-fetch venue here in case the DoesNotExist happened above
                # Although technically it shouldn't if we reached this point, better safe.
                venue_for_caching = DiningVenue.objects.get(database_id=location_id)

                with transaction.atomic():
                    # Get or create the Menu record. This happens even if api_menu_data is empty.
                    new_menu, created = Menu.objects.get_or_create(
                        dining_venue=venue_for_caching,
                        date=menu_date,
                        meal=meal_code,
                        # Optionally update last_fetched if the menu already existed
                        # defaults={'last_fetched': timezone.now()} # Need import: from django.utils import timezone
                    )
                    # If using get_or_create defaults doesn't update, uncomment below:
                    # if not created:
                    #    new_menu.last_fetched = timezone.now()
                    #    new_menu.save(update_fields=['last_fetched'])


                    items_in_api = api_menu_data.get("menus", []) if api_menu_data else []
                    items_to_create = []

                    if items_in_api: # Only proceed if the API returned some items
                        existing_api_ids = set(new_menu.menu_items.values_list('api_id', flat=True))

                        for item_data in items_in_api:
                            api_id = item_data.get('id')
                            # Convert api_id to integer for comparison and saving if your model field is IntegerField
                            try:
                                api_id_int = int(api_id) if api_id else None
                            except (ValueError, TypeError):
                                logger.warning(f"Invalid api_id '{api_id}' received for menu {menu_id}. Skipping item.")
                                continue # Skip this item if api_id is invalid

                            if api_id_int and api_id_int not in existing_api_ids:
                                items_to_create.append(
                                    MenuItem(
                                        api_id=api_id_int, # Save as integer
                                        menu=new_menu,
                                        name=item_data.get('name'),
                                        description=item_data.get('description'),
                                        link=item_data.get('link'),
                                    )
                                )
                    
                    if items_to_create:
                        MenuItem.objects.bulk_create(items_to_create, ignore_conflicts=False) # Keep conflicts check
                        logger.info(f"💾 CACHE SAVED {len(items_to_create)} new items for menu_id: {menu_id} at location_id: {location_id}")
                    elif created : # Menu was created, but no items were added (empty menu)
                        logger.info(f"💾 CACHE SAVED empty menu for menu_id: {menu_id} at location_id: {location_id}")
                    else: # Menu existed, and no *new* items were found in API data
                        logger.info(f"Menu {menu_id} at location_id: {location_id} already up-to-date in cache.")

            except DiningVenue.DoesNotExist:
                # This case was handled before the API call, but double-checking doesn't hurt.
                logger.warning(f"Could not cache menu for location_id {location_id} because the venue is not in the database.")
            except IntegrityError as e:
                # Catch specific integrity errors like unique constraint violations during bulk_create
                logger.error(f"Failed to cache menu items for menu_id {menu_id} due to DB constraint: {e}")
            except Exception as e:
                logger.error(f"Failed to cache menu for menu_id {menu_id}: {e}")
                # Do not block the response to the user if caching fails, return API data directly

            # Ensure we return the API data structure even if caching failed or API was empty
            return api_menu_data if api_menu_data else {"menus": []}

    def get_locations_with_menus(self, menu_id: str, category_ids=None) -> dict:
        if category_ids is None:
            category_ids = ["2", "3"]

        combined = self.get_all_category_locations(category_ids=category_ids, fmt="xml")
        locations_obj = combined.get("locations", {}) or {}
        locs = locations_obj.get("location", [])
        if not isinstance(locs, list):
            locs = [locs] if locs else []

        enriched = []
        for loc in locs:
            dbid = loc.get("dbid")
            try:
                # This call now benefits from the caching logic
                menu = self.get_menu(location_id=dbid, menu_id=menu_id)
            except Exception as e:
                logger.error(f"Error fetching menu for dbid={dbid}, menu_id={menu_id}: {e}")
                menu = {}
            loc["menu"] = menu
            enriched.append(loc)

        return {menu_id: {"locations": {"location": enriched}}}


#################### Exposed endpoints #########################

dining_api = DiningAPI()


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations(request):
    """Django view function to get dining locations."""
    try:
        category_ids = request.GET.getlist("category_id", ["2", "3"])
        locations = dining_api.get_all_category_locations(category_ids)
        return Response(locations)
    except Exception as e:
        logger.error(f"Error in get_dining_locations view: {e}")
        return Response({"error": str(e)}, status=500)


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


@api_view(["GET"])
def get_dining_menu(request):
    """Django view function to get dining menu."""
    try:
        location_id = request.GET.get("location_id")
        menu_id = request.GET.get("menu_id")

        if not location_id or not menu_id:
            return Response({"error": "location_id and menu_id are required"}, status=400)

        if USE_SAMPLE_MENUS:
            sample_data_path = os.path.join(os.path.dirname(__file__), "../archives/menus.json")

            try:
                with open(sample_data_path, "r") as f:
                    sample_menu_data = json.load(f)
            except Exception as e:
                return Response({"error": f"Failed to load sample menu file: {e}"}, status=500)
            if menu_id in sample_menu_data:
                logger.info(sample_menu_data[menu_id])
                return Response(sample_menu_data[menu_id])
            else:
                return Response(
                    {"error": f"No sample data found for menu_id: {menu_id}"}, status=404
                )

        # Live API call (which now includes caching logic)
        menu = dining_api.get_menu(location_id, menu_id)
        return Response(menu)

    except Exception as e:
        logger.error(f"Error in get_dining_menu view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def get_menu_item_with_ratings(request, menu_item_id):
    """Get a menu item with its ratings.

    Args:
        request: The HTTP request.
        menu_item_id: The ID of the menu item.

    Returns:
        Response: The menu item with its ratings.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = MenuItemWithRatingsSerializer(menu_item, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def get_menu_item_ratings(request, menu_item_id):
    """Get all ratings for a menu item.

    Args:
        request: The HTTP request.
        menu_item_id: The ID of the menu item.

    Returns:
        Response: The ratings for the menu item.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    ratings = menu_item.ratings.all()
    serializer = MenuRatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_menu_item_rating(request, menu_item_id):
    """Create a rating for a menu item.

    Args:
        request: The HTTP request.
        menu_item_id: The ID of the menu item.

    Returns:
        Response: The created rating.

    """
    try:
        menu_item = MenuItem.objects.get(id=menu_item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    # Add menu_item to the request data
    data = request.data.copy()
    data["menu_item"] = menu_item.id

    serializer = MenuRatingCreateSerializer(data=data, context={"request": request})

    if serializer.is_valid():
        rating = serializer.save()
        return Response(MenuRatingSerializer(rating).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_rating(request, rating_id):
    """Get, update, or delete a rating.

    Args:
        request: The HTTP request.
        rating_id: The ID of the rating.

    Returns:
        Response: The response based on the action.

    """
    try:
        rating = MenuRating.objects.get(id=rating_id)
    except MenuRating.DoesNotExist:
        return Response({"error": "Rating not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if the user is the owner of the rating
    if rating.user != request.user:
        return Response(
            {"error": "You do not have permission to perform this action"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        serializer = MenuRatingSerializer(rating)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = MenuRatingCreateSerializer(rating, data=request.data, partial=True)

        if serializer.is_valid():
            updated_rating = serializer.save()
            return Response(MenuRatingSerializer(updated_rating).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        rating.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_ratings(request):
    """Get all ratings by the current user.

    Args:
        request: The HTTP request.

    Returns:
        Response: The user's ratings.

    """
    ratings = MenuRating.objects.filter(user=request.user)
    serializer = MenuRatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_top_rated_menu_items(request):
    """Get the top-rated menu items.

    Args:
        request: The HTTP request.

    Returns:
        Response: The top-rated menu items.

    """
    # Get menu items with at least 3 ratings
    menu_items = (
        MenuItem.objects.annotate(
            avg_rating=models.Avg("ratings__rating"), num_ratings=models.Count("ratings")
        )
        .filter(num_ratings__gte=3)
        .order_by("-avg_rating")[:10]
    )

    serializer = MenuItemWithRatingsSerializer(menu_items, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@cache_page(60 * 5)
def get_dining_locations_with_menus(request):
    try:
        menu_id = request.GET.get("menu_id")
        if not menu_id:
            return Response({"error": "menu_id is required"}, status=400)

        category_ids = request.GET.getlist("category_id", ["2", "3"])
        data = dining_api.get_locations_with_menus(menu_id=menu_id, category_ids=category_ids)
        return Response(data.get(menu_id, {"locations": {"location": []}}))
    except Exception as e:
        logger.error(f"Error in get_dining_locations_with_menus: {e}")
        return Response({"error": str(e)}, status=500)


# Utility functions for working with dining data


def get_all_dining_locations(category_ids=None):
    """Fetch all dining locations and return them as a list of dictionaries.

    Args:
        category_ids (list, optional): List of category IDs to fetch. Defaults to ["2", "3"].

    Returns:
        list: A list of dictionaries containing location information.

    """
    if category_ids is None:
        category_ids = ["2", "3"]  # Default to residential colleges and cafes/specialty venues

    dining = DiningAPI()
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

        logger.info(
            f"Retrieved {len(locations)} dining locations from categories: {', '.join(category_ids)}"
        )
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
    dining = DiningAPI()
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


def get_events_for_location_with_date(dbid, location_name, date_str=None):
    """Fetch events for a specific dining location with an optional date filter.

    Args:
        dbid (str): The database ID of the location.
        location_name (str): The name of the location (for logging).
        date_str (str, optional): Date string in YYYY-MM-DD format. Defaults to None.

    Returns:
        list: A list of event dictionaries.

    """
    dining = DiningAPI()
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


def analyze_date_range(all_location_events):
    """Analyze the date range of the events data.

    Args:
        all_location_events (dict): Dictionary mapping location names to events.

    Returns:
        tuple: (earliest_date, latest_date, total_days)

    """
    earliest_date = None
    latest_date = None

    # Collect all dates from all events
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

    logger.info(
        f"Fetching events for all dining locations in categories: {', '.join(category_ids)}..."
    )

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

    logger.info(
        f"Fetching events for all dining locations on {date_str} in categories: {', '.join(category_ids)}..."
    )

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

    return all_location_events


def convert_utc_to_eastern(dt):
    """Convert a UTC datetime to Eastern Time.

    Args:
        dt: A datetime object in UTC

    Returns:
        A datetime object in Eastern Time with proper timezone info

    """
    # If it's not a datetime object, return as is
    if not isinstance(dt, datetime.datetime):
        return dt

    # If the datetime has no timezone info, assume it's UTC
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)

    # Convert to Eastern Time
    eastern = pytz.timezone("US/Eastern")
    return dt.astimezone(eastern)


# For testing directly
if __name__ == "__main__":
    print("WARNING: This script should be run through Django's management command:")
    print("python manage.py test_dining")
    print("\nAttempting to run directly, but this may fail if Django is not properly configured.")

    # Try to set up Django environment
    import os
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
    try:
        django.setup()
        # Test getting all dining locations
        locations = get_all_dining_locations()
        print(f"Retrieved {len(locations)} dining locations")

        # Test getting all dining events
        events = get_all_dining_events()
        print(f"Retrieved events for {len(events)} dining locations")
    except Exception as e:
        print(f"Error: {e}")
        print("Please use the management command instead.")