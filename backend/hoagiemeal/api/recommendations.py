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
    """Service for ranking menu items for a user."""

    def rank_menu_items_for_user(
        self,
        user: Any,
        menu_item_api_ids: List[int],
    ) -> List[int]:
        """Rank menu items by likelihood a user will like them.

        Args:
            user (User): Authenticated user.
            menu_item_api_ids (list[int]): Menu item API IDs to rank.

        Returns:
            list[int]: Menu item API IDs ordered by recommendation score.

        """
        logger.info(f"Ranking {len(menu_item_api_ids)} menu items for user_id={user.id}.")
        try:
            # Get user likes and dislikes
            liked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=True).values_list("menu_item__api_id", flat=True)
            )
            disliked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=False).values_list("menu_item__api_id", flat=True)
            )

            # Cold start: no interactions, return original order
            if not liked_items and not disliked_items:
                logger.info(f"No interaction history for user_id={user.id}, returning original order.")
                return menu_item_api_ids

            # Fetch similarity rows for relevant items
            similarities = MenuItemSimilarity.objects.filter(item_a__api_id__in=liked_items | disliked_items)

            similarity_map: Dict[int, Dict[int, float]] = defaultdict(dict)
            for sim in similarities:
                similarity_map[sim.item_a.api_id][sim.item_b.api_id] = sim.score

            # Score each menu item
            scores: Dict[int, float] = {}

            for item_id in menu_item_api_ids:
                score = 0.0
                for liked in liked_items:
                    score += similarity_map.get(liked, {}).get(item_id, 0.0)
                for disliked in disliked_items:
                    score -= similarity_map.get(disliked, {}).get(item_id, 0.0)
                scores[item_id] = score

            # Sort by score (descending)
            ranked_ids = sorted(
                menu_item_api_ids,
                key=lambda item_id: scores[item_id],
                reverse=True,
            )

            logger.info(f"Successfully ranked menu items for user_id={user.id}.")
            return ranked_ids
        except Exception as e:
            logger.error(f"Error ranking menu items for user_id={user.id}: {e}")
            return menu_item_api_ids


#################### Exposed endpoints #########################


recommendation_service = RecommendationService()


@api_view(["POST"])
def rank_menu_items(request):
    """Django view function to rank menu items for a user.

    Args:
        request (Request): The HTTP request object.
        menu_item_api_ids (list[int]): List of menu item API IDs.

    Returns:
        Response: Ordered menu item API IDs.

    """
    logger.info(f"Ranking menu items for request: {request}")

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
        ranked_ids = recommendation_service.rank_menu_items_for_user(
            user,
            menu_item_api_ids,
        )

        logger.info(f"Returning ranked menu items for user_id={user.id} and menu_item_api_ids: {menu_item_api_ids}.")
        return Response({"data": ranked_ids, "message": "Menu items ranked successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in rank_menu_items view: {e}")
        return Response(
            {"data": None, "message": f"Error ranking menu items: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
