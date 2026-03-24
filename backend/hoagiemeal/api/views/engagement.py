"""API views for user interactions with menu items.

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

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from hoagiemeal.utils.logger import logger
from hoagiemeal.api.services.engagement import interactions_service
from hoagiemeal.api.services.user import get_user_from_request

_MISSING = object()


def _parse_bool(value):
    """Coerce a request value to bool, handling string 'true'/'false'."""
    if value is None:
        return None
    if isinstance(value, str):
        return value.lower() == "true"
    return bool(value)


@api_view(["POST"])
def get_user_menu_item_interactions(request):
    """Django view function to get user menu item interactions for multiple menu items."""
    logger.debug("Getting user menu item interactions.")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response(
                {
                    "data": None,
                    "message": "Authentication required",
                    "error": "Authentication required",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_ids = request.data.get("menu_item_api_ids")
        if not menu_item_api_ids:
            return Response(
                {
                    "data": None,
                    "message": "menu_item_api_ids is required",
                    "error": "menu_item_api_ids is required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        interactions = interactions_service.get_user_menu_item_interactions(user, menu_item_api_ids)
        if interactions is None:
            return Response(
                {
                    "data": None,
                    "message": "Error fetching user menu item interactions",
                    "error": "Error fetching user menu item interactions",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.debug("User menu item interactions fetched successfully.")
        return Response(
            {
                "data": interactions,
                "message": "User menu item interactions fetched successfully.",
                "error": None,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_user_menu_item_interactions view: {e}")
        return Response(
            {
                "data": None,
                "message": f"Error fetching user menu item interactions: {str(e)}",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
def update_user_menu_item_interaction(request):
    """Django view function to update user menu item interaction."""
    logger.debug("Updating user menu item interaction.")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response(
                {
                    "message": "Authentication required",
                    "error": "Authentication required",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_id = request.data.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response(
                {
                    "message": "menu_item_api_id is required",
                    "error": "menu_item_api_id is required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build a dict of only the fields that were actually sent in the request.
        # This lets the service distinguish "not sent" from "sent as null".
        fields = {}
        liked = request.data.get("liked", _MISSING)
        if liked is not _MISSING:
            fields["liked"] = _parse_bool(liked)
        favorited = request.data.get("favorited")
        if favorited is not None:
            fields["favorited"] = _parse_bool(favorited)
        saved_for_later = request.data.get("saved_for_later")
        if saved_for_later is not None:
            fields["saved_for_later"] = _parse_bool(saved_for_later)
        would_eat_again = request.data.get("would_eat_again")
        if would_eat_again is not None:
            fields["would_eat_again"] = would_eat_again

        updated_interaction = interactions_service.update_user_menu_item_interaction(
            user,
            menu_item_api_id,
            **fields,
        )
        if not updated_interaction:
            return Response(
                {
                    "message": "Failed to update user menu item interaction",
                    "error": "Failed to update user menu item interaction",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.debug(f"Updated user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
        return Response(
            {
                "data": updated_interaction,
                "message": "User menu item interaction updated successfully.",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in update_user_menu_item_interaction view: {e}")
        return Response(
            {
                "data": None,
                "message": f"Error updating user menu item interaction: {str(e)}",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_menu_items_metrics(request):
    """Django view function to get metrics for multiple menu items."""
    logger.debug("Getting menu items metrics.")
    try:
        raw = request.query_params.get("menu_item_api_ids")
        menu_item_api_ids = [id.strip() for id in raw.split(",")] if raw else None
        if not menu_item_api_ids:
            return Response(
                {
                    "message": "menu_item_api_ids is required",
                    "error": "menu_item_api_ids is required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        metrics = interactions_service.get_or_create_menu_items_metrics(menu_item_api_ids)
        if not metrics:
            return Response(
                {
                    "message": "No metrics found",
                    "error": "No metrics found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "data": metrics,
                "message": "Menu items metrics fetched successfully.",
                "error": None,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_menu_items_metrics view: {e}")
        return Response(
            {
                "message": f"Error fetching menu items metrics: {str(e)}",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
