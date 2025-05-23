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

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from django.views.decorators.cache import cache_page
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import models

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.student_app import StudentApp
from hoagiemeal.api.schemas import Schemas
from hoagiemeal.models.menu import MenuItem, MenuRating
from hoagiemeal.serializers import MenuRatingSerializer, MenuRatingCreateSerializer, MenuItemWithRatingsSerializer


class DiningAPI(StudentApp):
    """Handle functionalities related to dining information, such as locations, menus, and events."""

    def __init__(self):
        """Initialize the DiningAPI class."""
        super().__init__()
        self.DINING_LOCATIONS = "/dining/locations"
        self.DINING_EVENTS = "/dining/events"
        self.DINING_MENU = "/dining/menu"
        self.schemas = Schemas()

    def get_locations(self, fmt: str = "xml") -> dict:
        """Fetch a list of dining locations in XML format.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
            fmt (str): The format of the response. Defaults to "xml".

        Returns:
            dict: A dictionary containing the dining locations.

        """
        try:
            response = self._make_request(
                self.DINING_LOCATIONS,
                params={"categoryId": "2"},
                fmt=fmt,
            )
            schema = self.schemas.get_dining_xsd()
            if not self.validate_xml(response, schema):
                raise APIException("Invalid XML format for dining locations")
            return self._parse_xml(response)
        except Exception as e:
            logger.error(f"Error fetching dining locations: {e}")
            raise APIException(str(e)) from e

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
        try:
            response = self._make_request(self.DINING_EVENTS, params={"placeId": place_id}, fmt="ical")
            return self._parse_ical(response)
        except Exception as e:
            logger.error(f"Error fetching dining events: {e}")
            raise APIException(str(e)) from e

    def get_menu(self, location_id: str, menu_id: str) -> dict:
        """Fetch the menu for a specific dining location.

        NOTE: The API expects the parameters to be in camelCase.

        Args:
            location_id (str): The ID of the dining location.
            menu_id (str): The ID of the dining menu.

        Returns:
            dict: A JSON object containing the menu details.

        """
        try:
            response = self._make_request(self.DINING_MENU, params={"locationId": location_id, "menuId": menu_id})
            return msj.decode(response)
        except Exception as e:
            logger.error(f"Error fetching menu: {e}")
            raise APIException(str(e)) from e


#################### Exposed endpoints #########################

dining_api = DiningAPI()


@api_view(["GET"])
@cache_page(60 * 15)
def get_locations(request):
    """Get all dining locations."""
    locations = dining_api.get_locations()
    location_list = locations.get("locations", {}).get("location", [])
    return Response({"data": location_list, "message": "Successfully fetched dining locations"})


@api_view(["GET"])
@cache_page(60 * 5)
def get_events(request):
    """Get dining events/hours."""
    place_id = request.query_params.get("place_id", "1007")
    events = dining_api.get_events(place_id)
    return Response({"data": events.get("events", []), "message": "Successfully fetched dining events"})


@api_view(["GET"])
@cache_page(60 * 5)
def get_menu(request):
    """Get menu for a specific location."""
    location_id = request.query_params.get("location_id")
    menu_id = request.query_params.get("menu_id")

    if not location_id or not menu_id:
        return Response({"error": "location_id and menu_id are required"}, status=400)

    menu = dining_api.get_menu(location_id, menu_id)

    return Response({"data": menu.get("menus", []), "message": "Successfully fetched menu"})


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
            {"error": "You do not have permission to perform this action"}, status=status.HTTP_403_FORBIDDEN
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
        MenuItem.objects.annotate(avg_rating=models.Avg("ratings__rating"), num_ratings=models.Count("ratings"))
        .filter(num_ratings__gte=3)
        .order_by("-avg_rating")[:10]
    )

    serializer = MenuItemWithRatingsSerializer(menu_items, many=True, context={"request": request})
    return Response(serializer.data)
