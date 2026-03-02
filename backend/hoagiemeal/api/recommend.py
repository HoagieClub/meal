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
from hoagiemeal.models.engagement import (
    MenuItemInteraction,
    MenuItemSimilarity,
    MenuItem,
)


#################### RecommendationService class for managing recommendations business logic #########################


class RecommendationService:
    """Service for scoring menu items based on user likes/dislikes."""

    def _calculate_score(
        self,
        menu_item_api_id: str,
        liked_items: set,
        disliked_items: set,
        similarity_map: Dict[str, Dict[str, float]],
    ) -> float:
        """Calculate recommendation score for a single menu item. Formula: score = sum(similarity_score for liked items) - sum(similarity_score for disliked items)."""
        score = 0.0
        for liked in liked_items:
            score += similarity_map.get(liked, {}).get(menu_item_api_id, 0.0)
        for disliked in disliked_items:
            score -= similarity_map.get(disliked, {}).get(menu_item_api_id, 0.0)
        return score

    def get_menu_items_score(
        self,
        user: Any,
        menu_item_api_ids: List[str],
    ) -> Dict[str, float]:
        """Get recommendation scores for multiple menu items."""
        logger.debug(f"Getting scores for {len(menu_item_api_ids)} menu items for user_id={user.id}.")
        try:
            # API might return invalid menu item IDs
            menu_item_ids = set(menu_item_api_ids)
            for menu_item_id in menu_item_ids:
                if not MenuItem.objects.filter(id=menu_item_id).exists():
                    logger.warning(f"Menu item with id {menu_item_id} does not exist.")
                    menu_item_ids.remove(menu_item_id)

            liked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=True).values_list("menu_item__id", flat=True)
            )
            disliked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=False).values_list("menu_item__id", flat=True)
            )

            if not liked_items and not disliked_items:
                logger.debug(f"No interaction history for user_id={user.id}, returning all scores as 0.0.")
                return {item_id: 0.0 for item_id in menu_item_api_ids}

            similarities = MenuItemSimilarity.objects.filter(item_a__id__in=liked_items | disliked_items)
            similarity_map = defaultdict(dict)
            for sim in similarities:
                similarity_map[sim.item_a.id][sim.item_b.id] = sim.score

            scores = {}
            for item_id in menu_item_api_ids:
                score = self._calculate_score(item_id, liked_items, disliked_items, similarity_map)
                scores[item_id] = score

            logger.debug(f"Calculated scores for {len(menu_item_api_ids)} items for user_id={user.id}.")
            return scores
        except Exception as e:
            logger.error(f"Error calculating scores for menu items for user_id={user.id}: {e}")
            return {item_id: 0.0 for item_id in menu_item_api_ids}


#################### Exposed endpoints #########################


recommendation_service = RecommendationService()


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

        scores = {item_id: 0.0 for item_id in menu_item_api_ids}
        logger.debug(f"Returning scores for {len(scores)} items for user_id={user.id}.")
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
