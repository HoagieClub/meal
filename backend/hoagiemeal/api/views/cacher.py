"""API views for caching menu, menu items, and location data.

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
from hoagiemeal.utils.logger import logger
from hoagiemeal.api.services.cacher import cacher_service
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.cache import cache_page


CACHE_TIMEOUT = 60 * 5


@cache_page(CACHE_TIMEOUT)
@api_view(["GET"])
def get_or_cache_all_locations(request):
    """Get or cache all locations."""
    try:
        locations = cacher_service.get_or_cache_all_locations()
        return Response(
            {"data": locations, "message": "Locations retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving all locations: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving all locations: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@cache_page(CACHE_TIMEOUT)
@api_view(["GET"])
def get_or_cache_all_menus_for_date(request):
    """Get or cache all menus for a date."""
    try:
        date = request.query_params.get("date")
        if not date:
            return Response(
                {"data": None, "message": "Date is required.", "error": "Date is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date = datetime.date.fromisoformat(date)
        menus = cacher_service.get_or_cache_all_menus_for_date(date)
        return Response(
            {"data": menus, "message": "All menus retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving all menus: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving all menus: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@cache_page(CACHE_TIMEOUT)
@api_view(["GET"])
def get_or_cache_menu_items(request):
    """Get or cache menu items for a list of IDs."""
    try:
        ids = request.query_params.get("ids")
        if not ids:
            return Response(
                {"data": None, "message": "IDs are required.", "error": "IDs are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ids = [id.strip() for id in ids.split(",")]
        menu_items = cacher_service.get_or_cache_menu_items(ids)
        return Response(
            {"data": menu_items, "message": "Menu items retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving menu items: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving menu items: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
