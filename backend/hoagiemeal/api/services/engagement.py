"""Service for managing user interactions with menu items.

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
from django.db import transaction, IntegrityError
from django.db.models import Count, Q
from hoagiemeal.utils.logger import logger
from hoagiemeal.models.engagement import (
    MenuItem,
    MenuItemInteraction,
    MenuItemMetrics,
)
from hoagiemeal.serializers import (
    MenuItemInteractionSerializer,
    MenuItemMetricsSerializer,
)

class MenuItemInteractionsService:
    """Service for managing user interactions with menu items."""

    def get_user_menu_item_interactions(
        self, user: Any, menu_item_api_ids: List[str]
    ) -> Optional[Dict[str, Optional[Dict]]]:
        """Get existing user menu item interactions. Only returns rows that exist — no auto-creation."""
        logger.debug(f"Getting interactions for user_id={user.id}, {len(menu_item_api_ids)} items.")
        try:
            interactions = MenuItemInteraction.objects.filter(user=user, menu_item_id__in=menu_item_api_ids)
            return {
                interaction.menu_item_id: MenuItemInteractionSerializer(interaction).data
                for interaction in interactions
            }
        except Exception as e:
            logger.error(
                f"Error getting user menu item interactions for user_id: {user.id}, menu_item_api_ids: {menu_item_api_ids}: {e}"
            )
            return None

    def get_or_create_menu_items_metrics(self, menu_item_api_ids: List[str]) -> Optional[Dict[str, Optional[Dict]]]:
        """Get or create metrics for multiple menu items."""
        logger.debug(f"Getting metrics for {len(menu_item_api_ids)} menu items.")
        try:
            metrics = MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids)
            missing_menu_item_api_ids = set(menu_item_api_ids) - set(metric.menu_item_id for metric in metrics)

            for menu_item_api_id in missing_menu_item_api_ids:
                # API might return invalid menu item IDs
                try:
                    menu_item = MenuItem.objects.get(id=menu_item_api_id)
                    try:
                        MenuItemMetrics.objects.get_or_create(menu_item=menu_item)
                    except IntegrityError:
                        pass  # created by concurrent request; refetch below
                except MenuItem.DoesNotExist:
                    logger.warning(f"Menu item with id {menu_item_api_id} does not exist.")
                    continue

            metrics = MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids)
            return {metric.menu_item_id: MenuItemMetricsSerializer(metric).data for metric in metrics}
        except Exception as e:
            logger.error(f"Error getting metrics for multiple menu items: {e}")
            return None

    def update_menu_item_metrics(self, menu_item_api_id: str) -> bool:
        """Update aggregated metrics for a menu item."""
        logger.debug(f"Updating metrics for menu_item_api_id: {menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(id=menu_item_api_id)
            interactions = MenuItemInteraction.objects.filter(menu_item=menu_item)
            try:
                metrics, _ = MenuItemMetrics.objects.get_or_create(menu_item=menu_item)
            except IntegrityError:
                metrics = MenuItemMetrics.objects.get(menu_item=menu_item)

            counts = interactions.aggregate(
                like_count=Count("id", filter=Q(liked=True)),
                dislike_count=Count("id", filter=Q(liked=False)),
                favorite_count=Count("id", filter=Q(favorited=True)),
                saved_for_later_count=Count("id", filter=Q(saved_for_later=True)),
                would_eat_again_yes=Count("id", filter=Q(would_eat_again="Y")),
                would_eat_again_no=Count("id", filter=Q(would_eat_again="N")),
                would_eat_again_maybe=Count("id", filter=Q(would_eat_again="M")),
            )

            with transaction.atomic():
                metrics.like_count = counts["like_count"]
                metrics.dislike_count = counts["dislike_count"]
                metrics.favorite_count = counts["favorite_count"]
                metrics.saved_for_later_count = counts["saved_for_later_count"]
                metrics.would_eat_again_yes = counts["would_eat_again_yes"]
                metrics.would_eat_again_no = counts["would_eat_again_no"]
                metrics.would_eat_again_maybe = counts["would_eat_again_maybe"]

                # Calculate average like score
                total_selected = counts["like_count"] + counts["dislike_count"]
                if total_selected > 0:
                    total_likes = counts["like_count"] - counts["dislike_count"]
                    metrics.average_like_score = (total_likes / total_selected) * 100
                else:
                    metrics.average_like_score = None

                # Calculate average would eat again score
                total_would_eat = counts["would_eat_again_yes"] + counts["would_eat_again_no"] + counts["would_eat_again_maybe"]
                if total_would_eat > 0:
                    sum_of_scores = counts["would_eat_again_yes"] * 1.0 + counts["would_eat_again_maybe"] * 0.5
                    metrics.average_would_eat_again_score = (sum_of_scores / total_would_eat) * 100
                else:
                    metrics.average_would_eat_again_score = None

                metrics.save()

            logger.debug(f"Updated metrics for menu_item_api_id: {menu_item_api_id}.")
            return True
        except Exception as e:
            logger.error(f"Error updating metrics for menu_item_api_id: {menu_item_api_id}: {e}")
            return False

    UPDATABLE_FIELDS = {"liked", "favorited", "saved_for_later", "would_eat_again"}

    def update_user_menu_item_interaction(
        self,
        user: Any,
        menu_item_api_id: str,
        **fields,
    ) -> bool:
        """Update user interaction for a menu item.

        Only the fields passed as keyword arguments are updated. This avoids
        the need for a sentinel value to distinguish "not sent" from "sent as None".

        Args:
            user: The user.
            menu_item_api_id: The menu item API ID.
            **fields: Fields to update. Valid keys: liked, favorited,
                      saved_for_later, would_eat_again.

        Returns:
            True if the interaction was updated successfully, False otherwise.

        """
        logger.debug(f"Updating interaction for user_id={user.id}, menu_item_api_id={menu_item_api_id}.")
        try:
            menu_item = MenuItem.objects.get(id=menu_item_api_id)
            try:
                interaction, _ = MenuItemInteraction.objects.get_or_create(user=user, menu_item=menu_item)
            except IntegrityError:
                interaction = MenuItemInteraction.objects.get(user=user, menu_item=menu_item)

            with transaction.atomic():
                for field, value in fields.items():
                    if field in self.UPDATABLE_FIELDS:
                        setattr(interaction, field, value)
                interaction.save()

            self.update_menu_item_metrics(menu_item_api_id)
            logger.debug(
                f"Updated user menu item interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}."
            )
            return True
        except Exception as e:
            logger.error(
                f"Error updating interaction for user_id: {user.id}, menu_item_api_id: {menu_item_api_id}: {e}"
            )
            return False


interactions_service = MenuItemInteractionsService()
