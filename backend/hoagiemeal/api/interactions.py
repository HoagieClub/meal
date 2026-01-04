"""API manager for user interactions with menu items.

This module provides functionality for managing user interactions with menu items,
including views, likes, favorites, and metrics aggregation.

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

from typing import Optional, Dict, Any
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.cache import cache_page
from hoagiemeal.utils.logger import logger
from hoagiemeal.models.menu import MenuItem, MenuItemInteraction, MenuItemMetrics
from hoagiemeal.serializers import MenuItemInteractionSerializer, MenuItemMetricsSerializer
from hoagiemeal.api.user import get_user_from_request
from django.contrib.auth import get_user_model

User = get_user_model()

MISSING = object()

DEFAULT_MENU_ITEM_INTERACTION = {
    "viewed": False,
    "view_count": 0,
    "liked": None,
    "favorited": False,
    "saved_for_later": False,
    "would_eat_again": None,
}

#################### MenuItemInteractionsService class for managing interactions business logic #########################


class MenuItemInteractionsService:
    """Service for managing user interactions with menu items."""

    def get_or_create_user_menu_item_interaction(
        self, user: Any, menu_item_api_id: int
    ) -> Optional[MenuItemInteraction]:
        """Get or create user interaction for a menu item.

        Args:
            user (User): The user.
            menu_item_api_id (int): The menu item API ID.

        Returns:
            Optional[MenuItemInteraction]: The interaction.

        """
        logger.info(
            f"Getting or creating user interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
        )
        try:
            menu_item = MenuItem.objects.get(api_id=menu_item_api_id)
            interaction, created = MenuItemInteraction.objects.get_or_create(
                user=user,
                menu_item=menu_item,
                defaults=DEFAULT_MENU_ITEM_INTERACTION,
            )
            if created:
                logger.info(f"Created user interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
            else:
                logger.info(
                    f"Found existing user interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
                )
            return interaction
        except Exception as e:
            logger.error(
                f"Error getting or creating user interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}: {e}"
            )
            return None

    def get_or_create_menu_item_metrics(self, menu_item_api_id: int) -> Optional[Dict]:
        """Get metrics for a menu item.

        Args:
            menu_item_api_id (int): The menu item API ID.

        Returns:
            Optional[Dict]: The metrics data if they exist, None otherwise.

        """
        logger.info(f"Getting or creating metrics for menu_item_api_id: {menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(api_id=menu_item_api_id)
            metrics, created = MenuItemMetrics.objects.get_or_create(menu_item=menu_item)
            if created:
                logger.info(f"Created metrics for menu_item_api_id: {menu_item_api_id}.")
            else:
                logger.info(f"Found existing metrics for menu_item_api_id: {menu_item_api_id}.")
            return metrics
        except Exception as e:
            logger.error(f"Error getting or creating metrics for menu_item_api_id: {menu_item_api_id}: {e}")
            return None

    def update_menu_item_metrics(self, menu_item_api_id: int) -> bool:
        """Update aggregated metrics for a menu item.

        Args:
            menu_item_api_id (int): The menu item API ID.

        Returns:
            bool: True if metrics were updated successfully, False otherwise.

        """
        logger.info(f"Updating metrics for menu_item_api_id: {menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(api_id=menu_item_api_id)
            interactions = MenuItemInteraction.objects.filter(menu_item=menu_item)
            metrics, _ = MenuItemMetrics.objects.get_or_create(menu_item=menu_item)

            with transaction.atomic():
                # Aggregate view data
                total_view_count = sum(interaction.view_count for interaction in interactions)
                unique_view_count = interactions.filter(viewed=True).count()
                metrics.view_count = total_view_count
                metrics.unique_view_count = unique_view_count

                # Aggregate like data
                like_count = interactions.filter(liked=True).count()
                dislike_count = interactions.filter(liked=False).count()
                metrics.like_count = like_count
                metrics.dislike_count = dislike_count
                total_likes = like_count + dislike_count
                metrics.average_like_score = (like_count / total_likes * 100) if total_likes > 0 else None

                # Aggregate favorite and saved for later data
                favorite_count = interactions.filter(favorited=True).count()
                saved_for_later_count = interactions.filter(saved_for_later=True).count()
                metrics.favorite_count = favorite_count
                metrics.saved_for_later_count = saved_for_later_count

                # Aggregate would eat again data
                would_eat_again_yes = interactions.filter(would_eat_again="Y").count()
                would_eat_again_no = interactions.filter(would_eat_again="N").count()
                would_eat_again_maybe = interactions.filter(would_eat_again="M").count()
                metrics.would_eat_again_yes = would_eat_again_yes
                metrics.would_eat_again_no = would_eat_again_no
                metrics.would_eat_again_maybe = would_eat_again_maybe

                # Calculate average would eat again score
                total_would_eat = would_eat_again_yes + would_eat_again_no + would_eat_again_maybe
                if total_would_eat > 0:
                    # Calculate score: Yes = 1.0, Maybe = 0.5, No = 0.0
                    sum_of_scores = would_eat_again_yes * 1.0 + would_eat_again_maybe * 0.5 + would_eat_again_no * 0.0
                    score = (sum_of_scores / total_would_eat) * 100
                    metrics.average_would_eat_again_score = score
                else:
                    metrics.average_would_eat_again_score = None
                metrics.save()

            logger.info(f"Updated metrics for menu_item_api_id: {menu_item_api_id}.")
            return True
        except Exception as e:
            logger.error(f"Error updating metrics for menu_item_api_id: {menu_item_api_id}: {e}")
            return False

    def record_user_menu_item_view(self, user: Any, menu_item_api_id: int) -> bool:
        """Record a user menu item view.

        Args:
            user (Any): The user.
            menu_item_api_id (int): The menu item API ID.

        Returns:
            bool: True if the user menu item view was recorded successfully, False otherwise.

        """
        logger.info(f"Recording user menu item view for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
        try:
            interaction = self.get_or_create_user_menu_item_interaction(user, menu_item_api_id)
            if not interaction:
                return False

            # Update menu item interaction
            now = timezone.now()
            with transaction.atomic():
                interaction.viewed = True
                interaction.view_count += 1
                if interaction.first_viewed_at is None:
                    interaction.first_viewed_at = now
                interaction.last_viewed_at = now
                interaction.save()

            # Update metrics after recording view
            self.update_menu_item_metrics(menu_item_api_id)
            logger.info(f"Recorded user menu item view for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
            return True
        except Exception as e:
            logger.error(
                f"Error recording user menu item view for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}: {e}"
            )
            return False

    def update_user_menu_item_interaction(
        self,
        user: Any,
        menu_item_api_id: int,
        liked: Optional[bool] = None,
        favorited: Optional[bool] = None,
        saved_for_later: Optional[bool] = None,
        would_eat_again: Optional[str] = None,
    ) -> bool:
        """Update user interaction for a menu item.

        Args:
            user (Any): The user.
            menu_item_api_id (int): The menu item API ID.
            liked (Optional[bool]): Whether the menu item was liked.
            favorited (Optional[bool]): Whether the menu item was favorited.
            saved_for_later (Optional[bool]): Whether the menu item was saved for later.
            would_eat_again (Optional[str]): Whether the menu item would be eaten again (Y/N/M).

        Returns:
            bool: True if the interaction was updated successfully, False otherwise.

        """
        logger.info(f"Updating interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
        try:
            interaction = self.get_or_create_user_menu_item_interaction(user, menu_item_api_id)
            if not interaction:
                return False

            # Update menu item interaction
            with transaction.atomic():
                if liked is not MISSING:
                    interaction.liked = liked
                if favorited is not None:
                    interaction.favorited = favorited
                if saved_for_later is not None:
                    interaction.saved_for_later = saved_for_later
                if would_eat_again is not None:
                    interaction.would_eat_again = would_eat_again
                interaction.save()

            # Update metrics after updating interaction
            self.update_menu_item_metrics(menu_item_api_id)
            logger.info(
                f"Updated user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
            )
            return True
        except Exception as e:
            logger.error(
                f"Error updating interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}: {e}"
            )
            return False


#################### Exposed endpoints #########################


interactions_service = MenuItemInteractionsService()


@api_view(["GET"])
def get_user_menu_item_interaction(request):
    """Django view function to get user menu item interaction for a menu item.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (int): The menu item API ID.

    Returns:
        Response: The HTTP response object.
        interaction (dict): The user interaction data.

    """
    logger.info(f"Getting user menu item interaction for request: {request}")
    try:
        user = None
        try:
            user = get_user_from_request(request)
        except Exception as e:
            logger.error(f"Error getting user from request: {e}")
            return Response({"message": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        menu_item_api_id = request.GET.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response({"message": "menu_item_api_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        interaction = interactions_service.get_or_create_user_menu_item_interaction(user, menu_item_api_id)
        if not interaction:
            return Response({"message": "No user menu item interaction found"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(
            f"Returning user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."  # type: ignore
        )
        return Response(
            {
                "data": MenuItemInteractionSerializer(interaction).data,
                "message": "User menu item interaction fetched successfully.",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_user_menu_item_interaction view: {e}")
        return Response(
            {"message": f"Error fetching user menu item interaction: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def record_user_menu_item_view(request):
    """Django view function to record a user menu item view.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (int): The menu item API ID.

    Returns:
        Response: The HTTP response object.

    """
    logger.info(f"Recording view for request: {request}")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        menu_item_api_id = request.data.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response({"message": "menu_item_api_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        success = interactions_service.record_user_menu_item_view(user, menu_item_api_id)
        if not success:
            return Response(
                {"message": "Failed to record user menu item view"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        logger.info(f"Recorded user menu item view for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
        return Response({"message": "User menu item view recorded successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in record_user_menu_item_view view: {e}")
        return Response(
            {"message": f"Error recording user menu item view: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT", "PATCH"])
def update_user_menu_item_interaction(request):
    """Django view function to update user menu item interaction.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (int): The menu item API ID.
        liked (Optional[bool]): Whether the menu item was liked.
        favorited (Optional[bool]): Whether the menu item was favorited.
        saved_for_later (Optional[bool]): Whether the menu item was saved for later.
        would_eat_again (Optional[str]): Whether the menu item would be eaten again (Y/N/M).

    Returns:
        Response: The HTTP response object.
        interaction (dict): The updated user menu item interaction data.

    """
    logger.info(f"Updating user menu item interaction for request: {request}")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        menu_item_api_id = request.data.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response({"message": "menu_item_api_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        liked = request.data.get("liked", MISSING)
        favorited = request.data.get("favorited")
        saved_for_later = request.data.get("saved_for_later")
        would_eat_again = request.data.get("would_eat_again")

        # Validate would_eat_again if provided
        if would_eat_again is not None and would_eat_again not in ["Y", "N", "M"]:
            return Response({"message": "would_eat_again must be Y, N, or M"}, status=status.HTTP_400_BAD_REQUEST)

        # Convert boolean strings to booleans
        if liked is not MISSING:
            if liked is None:
                liked = None
            else:
                liked = str(liked).lower() == "true" if isinstance(liked, str) else bool(liked)
        if favorited is not None:
            favorited = str(favorited).lower() == "true" if isinstance(favorited, str) else bool(favorited)
        if saved_for_later is not None:
            saved_for_later = (
                str(saved_for_later).lower() == "true" if isinstance(saved_for_later, str) else bool(saved_for_later)
            )

        cached_user_menu_item_interaction = interactions_service.update_user_menu_item_interaction(
            user, menu_item_api_id, liked, favorited, saved_for_later, would_eat_again
        )
        if not cached_user_menu_item_interaction:
            return Response(
                {"message": "Failed to update user menu item interaction"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        interaction = interactions_service.get_or_create_user_menu_item_interaction(user, menu_item_api_id)
        if not interaction:
            return Response({"message": "No user menu item interaction found"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(
            f"Updated user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
        )
        return Response(
            {
                "data": MenuItemInteractionSerializer(interaction).data,
                "message": "User menu item interaction updated successfully.",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in update_user_menu_item_interaction view: {e}")
        return Response(
            {"message": f"Error updating user menu item interaction: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_menu_item_metrics(request):
    """Django view function to get metrics for a menu item.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (int): The menu item API ID.

    Returns:
        Response: The HTTP response object.
        metrics (dict): The menu item metrics data.

    """
    logger.info(f"Getting menu item metrics for request: {request}")
    try:
        menu_item_api_id = request.GET.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response({"message": "menu_item_api_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        metrics = interactions_service.get_or_create_menu_item_metrics(menu_item_api_id)
        if metrics is None:
            return Response({"message": "No metrics found"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"Returning metrics for menu_item_api_id: {menu_item_api_id}.")
        return Response(
            {"data": MenuItemMetricsSerializer(metrics).data, "message": "Menu item metrics fetched successfully."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_menu_item_metrics view: {e}")
        return Response(
            {"message": f"Error fetching menu item metrics: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
