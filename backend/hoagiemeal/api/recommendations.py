"""API manager for menu item recommendations.

This module provides functionality for ranking menu items for a user
using item–item collaborative filtering based on user likes/dislikes.

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

from typing import List, Dict, Any
from collections import defaultdict

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from hoagiemeal.utils.logger import logger
from hoagiemeal.api.user import get_user_from_request
from hoagiemeal.models.menu import (
    MenuItemInteraction,
    MenuItemSimilarity,
)


#################### RecommendationService #########################


class RecommendationService:
    """Service for scoring menu items for a user."""

    def _calculate_score(
        self,
        menu_item_api_id: int,
        liked_items: set,
        disliked_items: set,
        similarity_map: Dict[int, Dict[int, float]],
    ) -> float:
        """Calculate recommendation score for a single menu item.

        Args:
            menu_item_api_id (int): Menu item API ID to score.
            liked_items (set): Set of liked menu item API IDs.
            disliked_items (set): Set of disliked menu item API IDs.
            similarity_map (dict): Map of item_a -> item_b -> similarity score.

        Returns:
            float: Recommendation score for the menu item.

        """
        score = 0.0
        for liked in liked_items:
            score += similarity_map.get(liked, {}).get(menu_item_api_id, 0.0)
        for disliked in disliked_items:
            score -= similarity_map.get(disliked, {}).get(menu_item_api_id, 0.0)
        return score

    def get_menu_item_score(
        self,
        user: Any,
        menu_item_api_id: int,
    ) -> float:
        """Get recommendation score for a single menu item.

        Args:
            user (User): Authenticated user.
            menu_item_api_id (int): Menu item API ID to score.

        Returns:
            float: Recommendation score for the menu item.

        """
        logger.info(f"Getting score for menu item {menu_item_api_id} for user_id={user.id}.")
        try:
            # Get user likes and dislikes
            liked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=True).values_list("menu_item__api_id", flat=True)
            )
            disliked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=False).values_list("menu_item__api_id", flat=True)
            )

            # Cold start: no interactions, return 0.0
            if not liked_items and not disliked_items:
                logger.info(f"No interaction history for user_id={user.id}, returning score 0.0.")
                return 0.0

            # Fetch similarity rows for relevant items
            similarities = MenuItemSimilarity.objects.filter(item_a__api_id__in=liked_items | disliked_items)

            similarity_map = defaultdict(dict)
            for sim in similarities:
                similarity_map[sim.item_a.api_id][sim.item_b.api_id] = sim.score

            score = self._calculate_score(menu_item_api_id, liked_items, disliked_items, similarity_map)

            logger.info(
                f"Successfully calculated score {score} for menu item {menu_item_api_id} for user_id={user.id}."
            )
            return score
        except Exception as e:
            logger.error(f"Error calculating score for menu item {menu_item_api_id} for user_id={user.id}: {e}")
            return 0.0

    def get_menu_items_score(
        self,
        user: Any,
        menu_item_api_ids: List[int],
    ) -> Dict[int, float]:
        """Get recommendation scores for multiple menu items.

        Args:
            user (User): Authenticated user.
            menu_item_api_ids (list[int]): Menu item API IDs to score.

        Returns:
            dict[int, float]: Dictionary mapping menu item API IDs to their scores.

        """
        logger.info(f"Getting scores for {len(menu_item_api_ids)} menu items for user_id={user.id}.")
        try:
            # Get user likes and dislikes (only fetch once for efficiency)
            liked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=True).values_list("menu_item__api_id", flat=True)
            )
            disliked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=False).values_list("menu_item__api_id", flat=True)
            )

            # Cold start: no interactions, return all 0.0
            if not liked_items and not disliked_items:
                logger.info(f"No interaction history for user_id={user.id}, returning all scores as 0.0.")
                return {item_id: 0.0 for item_id in menu_item_api_ids}

            # Fetch similarity rows for relevant items (only fetch once)
            similarities = MenuItemSimilarity.objects.filter(item_a__api_id__in=liked_items | disliked_items)

            similarity_map = defaultdict(dict)
            for sim in similarities:
                similarity_map[sim.item_a.api_id][sim.item_b.api_id] = sim.score

            # Score each menu item
            scores = {}
            for item_id in menu_item_api_ids:
                score = self._calculate_score(item_id, liked_items, disliked_items, similarity_map)
                scores[item_id] = score

            logger.info(
                f"Successfully calculated scores for {len(menu_item_api_ids)} menu items for user_id={user.id}."
            )
            return scores
        except Exception as e:
            logger.error(f"Error calculating scores for menu items for user_id={user.id}: {e}")
            return {item_id: 0.0 for item_id in menu_item_api_ids}


#################### Exposed endpoints #########################


recommendation_service = RecommendationService()


@api_view(["POST"])
def get_menu_item_score(request):
    """Django view function to get recommendation score for a single menu item.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_id (int): Menu item API ID.

    Returns:
        Response: Recommendation score for the menu item.

    """
    logger.info(f"Getting menu item score for request: {request}")

    try:
        # Authenticate user
        user = get_user_from_request(request)
        if not user:
            return Response(
                {"data": None, "message": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        menu_item_api_id = request.data.get("menu_item_api_id")
        if menu_item_api_id is None:
            return Response(
                {"data": None, "message": "menu_item_api_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        score = recommendation_service.get_menu_item_score(user, int(menu_item_api_id))

        logger.info(f"Returning score {score} for menu item {menu_item_api_id} for user_id={user.id}.")
        return Response(
            {"data": score, "message": "Menu item score retrieved successfully."}, status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error in get_menu_item_score view: {e}")
        return Response(
            {"data": None, "message": f"Error getting menu item score: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def get_menu_items_score(request):
    """Django view function to get recommendation scores for multiple menu items.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_ids (list[int]): List of menu item API IDs.

    Returns:
        Response: Dictionary mapping menu item API IDs to their scores.

    """
    logger.info(f"Getting menu items scores for request: {request}")

    try:
        # Authenticate user
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

        menu_item_api_ids = [int(api_id) for api_id in menu_item_api_ids]
        scores = recommendation_service.get_menu_items_score(user, menu_item_api_ids)

        logger.info(f"Returning scores for {len(scores)} menu items for user_id={user.id}.")
        return Response(
            {"data": scores, "message": "Menu items scores retrieved successfully."}, status=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Error in get_menu_items_score view: {e}")
        return Response(
            {"data": None, "message": f"Error getting menu items scores: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
