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

from typing import Optional, Dict, Any, List
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.cache import cache_page
from hoagiemeal.utils.logger import logger
from hoagiemeal.models.engagement import MenuItem, MenuItemInteraction, MenuItemMetrics
from hoagiemeal.serializers import MenuItemInteractionSerializer, MenuItemMetricsSerializer
from hoagiemeal.api.user import get_user_from_request
from django.contrib.auth import get_user_model

User = get_user_model()

MISSING = object()

#################### MenuItemInteractionsService class for managing interactions business logic #########################


class MenuItemInteractionsService:
    """Service for managing user interactions with menu items."""

    def get_or_create_user_menu_item_interactions(
        self, user: Any, menu_item_api_ids: List[str]
    ) -> Optional[Dict[str, Optional[Dict]]]:
        """Get or create user menu item interactions for multiple menu items."""
        logger.info(
            f"Getting or creating user menu item interactions for user_id: {user.id}, menu_item_api_ids: {menu_item_api_ids}."
        )
        try:
            interactions = MenuItemInteraction.objects.filter(user=user, menu_item_id__in=menu_item_api_ids)
            missing_menu_item_api_ids = set(menu_item_api_ids) - set(
                interaction.menu_item_id for interaction in interactions
            )

            for menu_item_api_id in missing_menu_item_api_ids:
                # API might return invalid menu item IDs
                try:
                    menu_item = MenuItem.objects.get(id=menu_item_api_id)
                    MenuItemInteraction.objects.get_or_create(user=user, menu_item=menu_item)
                except MenuItem.DoesNotExist:
                    logger.warn(f"Menu item with id {menu_item_api_id} does not exist.")
                    continue

            interactions = MenuItemInteraction.objects.filter(user=user, menu_item_id__in=menu_item_api_ids)
            return {
                interaction.menu_item_id: MenuItemInteractionSerializer(interaction).data
                for interaction in interactions
            }
        except Exception as e:
            logger.error(
                f"Error getting or creating user menu item interactions for user_id: {user.id}, menu_item_api_ids: {menu_item_api_ids}: {e}"
            )
            return None

    def get_or_create_menu_items_metrics(self, menu_item_api_ids: List[str]) -> Optional[Dict[str, Optional[Dict]]]:
        """Get or create metrics for multiple menu items."""
        logger.info(f"Getting metrics for {len(menu_item_api_ids)} menu items.")
        try:
            metrics = MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids)
            missing_menu_item_api_ids = set(menu_item_api_ids) - set(metric.menu_item_id for metric in metrics)

            for menu_item_api_id in missing_menu_item_api_ids:
                # API might return invalid menu item IDs
                try:
                    menu_item = MenuItem.objects.get(id=menu_item_api_id)
                    MenuItemMetrics.objects.get_or_create(menu_item=menu_item)
                except MenuItem.DoesNotExist:
                    logger.warn(f"Menu item with id {menu_item_api_id} does not exist.")
                    continue

            metrics = MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids)
            return {metric.menu_item_id: MenuItemMetricsSerializer(metric).data for metric in metrics}
        except Exception as e:
            logger.error(f"Error getting metrics for multiple menu items: {e}")
            return None

    def update_menu_item_metrics(self, menu_item_api_id: str) -> bool:
        """Update aggregated metrics for a menu item."""
        logger.info(f"Updating metrics for menu_item_api_id: {menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(id=menu_item_api_id)
            interactions = MenuItemInteraction.objects.filter(menu_item=menu_item)
            metrics, _ = MenuItemMetrics.objects.get_or_create(menu_item=menu_item)

            with transaction.atomic():
                # Aggregate like data
                like_count = interactions.filter(liked=True).count()
                dislike_count = interactions.filter(liked=False).count()
                metrics.like_count = like_count
                metrics.dislike_count = dislike_count
                total_likes = like_count - dislike_count
                total_selected = like_count + dislike_count
                metrics.average_like_score = (total_likes / total_selected * 100) if total_selected > 0 else None

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

    def update_user_menu_item_interaction(
        self,
        user: Any,
        menu_item_api_id: str,
        liked: Optional[bool] = None,
        favorited: Optional[bool] = None,
        saved_for_later: Optional[bool] = None,
        would_eat_again: Optional[str] = None,
    ) -> bool:
        """Update user interaction for a menu item.

        Args:
            user (Any): The user.
            menu_item_api_id (str): The menu item API ID.
            liked (Optional[bool]): Whether the menu item was liked.
            favorited (Optional[bool]): Whether the menu item was favorited.
            saved_for_later (Optional[bool]): Whether the menu item was saved for later.
            would_eat_again (Optional[str]): Whether the menu item would be eaten again (Y/N/M).

        Returns:
            bool: True if the interaction was updated successfully, False otherwise.

        """
        logger.info(f"Updating interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(id=menu_item_api_id)
            interaction, _ = MenuItemInteraction.objects.get_or_create(user=user, menu_item=menu_item)

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


@api_view(["POST"])
def get_user_menu_item_interactions(request):
    """Django view function to get user menu item interactions for multiple menu items."""
    logger.info(f"Getting user menu item interactions for request: {request}")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"data": None, "message": "Authentication required", "error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_ids = request.data.get("menu_item_api_ids")
        if not menu_item_api_ids:
            return Response(
                {"data": None, "message": "menu_item_api_ids is required", "error": "menu_item_api_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        interactions = interactions_service.get_or_create_user_menu_item_interactions(user, menu_item_api_ids)
        if not interactions:
            return Response(
                {"message": "No user menu item interactions found", "error": "No user menu item interactions found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        logger.info("User menu item interactions fetched successfully")
        return Response(
            {"data": interactions, "message": "User menu item interactions fetched successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_user_menu_item_interactions view: {e}")
        return Response(
            {"data": None, "message": f"Error fetching user menu item interactions: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
def update_user_menu_item_interaction(request):
    """Django view function to update user menu item interaction.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (str): The menu item API ID.
        liked (Optional[bool]): Whether the menu item was liked.
        favorited (Optional[bool]): Whether the menu item was favorited.
        saved_for_later (Optional[bool]): Whether the menu item was saved for later.
        would_eat_again (Optional[str]): Whether the menu item would be eaten again (Y/N/M).

    Returns:
        Response: The HTTP response object.

    """
    logger.info(f"Updating user menu item interaction for request: {request}")
    try:
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"message": "Authentication required", "error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_id = request.data.get("menu_item_api_id")
        if not menu_item_api_id:
            return Response(
                {"message": "menu_item_api_id is required", "error": "menu_item_api_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        liked = request.data.get("liked", MISSING)
        favorited = request.data.get("favorited")
        saved_for_later = request.data.get("saved_for_later")
        would_eat_again = request.data.get("would_eat_again")

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

        updated_interaction = interactions_service.update_user_menu_item_interaction(
            user, menu_item_api_id, liked, favorited, saved_for_later, would_eat_again
        )
        if not updated_interaction:
            return Response(
                {
                    "message": "Failed to update user menu item interaction",
                    "error": "Failed to update user menu item interaction",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info(
            f"Updated user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
        )
        return Response(
            {"data": updated_interaction, "message": "User menu item interaction updated successfully."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in update_user_menu_item_interaction view: {e}")
        return Response(
            {"data": None, "message": f"Error updating user menu item interaction: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_menu_items_metrics(request):
    """Django view function to get metrics for multiple menu items."""
    logger.info(f"Getting menu items metrics for request: {request}")
    try:
        menu_item_api_ids = request.data.get("menu_item_api_ids")
        if not menu_item_api_ids:
            return Response(
                {"message": "menu_item_api_ids is required", "error": "menu_item_api_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metrics = interactions_service.get_or_create_menu_items_metrics(menu_item_api_ids)
        if not metrics:
            return Response(
                {"message": "No metrics found", "error": "No metrics found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"data": metrics, "message": "Menu items metrics fetched successfully.", "error": None},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.error(f"Error in get_menu_items_metrics view: {e}")
        return Response(
            {"message": f"Error fetching menu items metrics: {str(e)}", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
