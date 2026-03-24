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
def get_or_cache_menus_and_items_for_date(request):
    """Get or cache all menus and their menu items for a date."""
    try:
        date = request.query_params.get("date")
        if not date:
            return Response(
                {"data": None, "message": "Date is required.", "error": "Date is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date = datetime.date.fromisoformat(date)
        result = cacher_service.get_or_cache_menus_and_items_for_date(date)
        return Response(
            {"data": result, "message": "Menus and items retrieved successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error retrieving menus and items: {e}.")
        return Response(
            {"data": None, "message": f"Error retrieving menus and items: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
