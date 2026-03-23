"""API views for menu item recommendations.

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

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from hoagiemeal.utils.logger import logger
from hoagiemeal.api.services.user import get_user_from_request
from hoagiemeal.api.services.recommend import recommendation_service


@api_view(["POST"])
def get_menu_items_score(request):
    """Django view function to get recommendation scores for multiple menu items."""
    logger.debug("Getting menu items scores.")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"data": None, "message": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_ids = request.data.get("menu_item_api_ids")
        if not menu_item_api_ids:
            return Response(
                {"data": None, "message": "menu_item_api_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        scores = recommendation_service.get_menu_items_score(user, menu_item_api_ids)
        return Response(
            {"data": scores, "message": "Menu items scores retrieved successfully."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_menu_items_score view: {e}")
        return Response(
            {"data": None, "message": f"Error getting menu items scores: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
