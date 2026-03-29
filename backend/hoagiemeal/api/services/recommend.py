"""Service for menu item recommendations.

This module provides functionality for ranking menu items for a user
using item-item collaborative filtering based on user likes/dislikes.

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

from hoagiemeal.utils.logger import logger
from hoagiemeal.models.engagement import (
    MenuItemInteraction,
    MenuItemSimilarity,
    MenuItem,
)


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
            # Filter out invalid menu item IDs
            existing_ids = set(
                MenuItem.objects.filter(id__in=menu_item_api_ids).values_list("id", flat=True)
            )
            invalid_ids = set(menu_item_api_ids) - existing_ids
            for invalid_id in invalid_ids:
                logger.warning(f"Menu item with id {invalid_id} does not exist.")

            liked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=True).values_list("menu_item__id", flat=True)
            )
            disliked_items = set(
                MenuItemInteraction.objects.filter(user=user, liked=False).values_list("menu_item__id", flat=True)
            )

            if not liked_items and not disliked_items:
                logger.debug(f"No interaction history for user_id={user.id}, returning all scores as 0.0.")
                return {item_id: 0.0 for item_id in menu_item_api_ids}

            similarities = MenuItemSimilarity.objects.filter(menu_item_a__id__in=liked_items | disliked_items)
            similarity_map = defaultdict(dict)
            for sim in similarities:
                similarity_map[sim.menu_item_a_id][sim.menu_item_b_id] = sim.score

            scores = {}
            for item_id in menu_item_api_ids:
                score = self._calculate_score(item_id, liked_items, disliked_items, similarity_map)
                scores[item_id] = score

            logger.debug(f"Calculated scores for {len(menu_item_api_ids)} items for user_id={user.id}.")
            return scores
        except Exception as e:
            logger.error(f"Error calculating scores for menu items for user_id={user.id}: {e}")
            return {item_id: 0.0 for item_id in menu_item_api_ids}


recommendation_service = RecommendationService()
