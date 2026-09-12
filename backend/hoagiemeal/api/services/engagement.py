"""User interactions with menu items and the aggregate metrics derived from them."""

from typing import Any, Optional

from django.db.models import Count, Q

from hoagiemeal.models.engagement import MenuItemInteraction, MenuItemMetrics
from hoagiemeal.models.menu_item import MenuItem
from hoagiemeal.serializers import MenuItemInteractionSerializer, MenuItemMetricsSerializer
from hoagiemeal.utils.logger import logger


class MenuItemInteractionsService:
    """Reads and writes interactions and keeps each item's metrics in sync."""

    UPDATABLE_FIELDS = {"liked", "favorited", "saved_for_later", "would_eat_again"}

    def get_user_menu_item_interactions(self, user: Any, menu_item_api_ids: list[str]) -> Optional[dict[str, dict]]:
        """The user's existing interactions as {menu item id: data}. Items never interacted with are omitted."""
        try:
            interactions = MenuItemInteraction.objects.filter(user=user, menu_item_id__in=menu_item_api_ids)
            return {i.menu_item_id: MenuItemInteractionSerializer(i).data for i in interactions}
        except Exception:
            logger.exception(f"Error getting interactions for user {user.id}")
            return None

    def get_or_create_menu_items_metrics(self, menu_item_api_ids: list[str]) -> Optional[dict[str, dict]]:
        """Metrics as {menu item id: data}, creating zeroed rows for items that have none yet."""
        try:
            existing = set(
                MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids).values_list(
                    "menu_item_id", flat=True
                )
            )
            missing = set(menu_item_api_ids) - existing
            if missing:
                known_items = set(MenuItem.objects.filter(id__in=missing).values_list("id", flat=True))
                for unknown in missing - known_items:
                    logger.warning(f"Menu item {unknown} does not exist.")
                MenuItemMetrics.objects.bulk_create(
                    [MenuItemMetrics(menu_item_id=item_id) for item_id in known_items], ignore_conflicts=True
                )

            metrics = MenuItemMetrics.objects.filter(menu_item_id__in=menu_item_api_ids)
            return {m.menu_item_id: MenuItemMetricsSerializer(m).data for m in metrics}
        except Exception:
            logger.exception("Error getting metrics")
            return None

    def update_menu_item_metrics(self, menu_item_api_id: str) -> bool:
        """Recompute a menu item's metrics from all of its interactions."""
        try:
            metrics, _ = MenuItemMetrics.objects.get_or_create(menu_item_id=menu_item_api_id)
            counts = MenuItemInteraction.objects.filter(menu_item_id=menu_item_api_id).aggregate(
                like_count=Count("id", filter=Q(liked=True)),
                dislike_count=Count("id", filter=Q(liked=False)),
                favorite_count=Count("id", filter=Q(favorited=True)),
                saved_for_later_count=Count("id", filter=Q(saved_for_later=True)),
                would_eat_again_yes=Count("id", filter=Q(would_eat_again="Y")),
                would_eat_again_no=Count("id", filter=Q(would_eat_again="N")),
                would_eat_again_maybe=Count("id", filter=Q(would_eat_again="M")),
            )
            for field, value in counts.items():
                setattr(metrics, field, value)

            # Net approval as a percentage, in [-100, 100].
            total_votes = counts["like_count"] + counts["dislike_count"]
            metrics.average_like_score = (
                (counts["like_count"] - counts["dislike_count"]) / total_votes * 100 if total_votes else None
            )

            # "Yes" counts fully and "maybe" half, as a percentage of all answers.
            total_answers = (
                counts["would_eat_again_yes"] + counts["would_eat_again_no"] + counts["would_eat_again_maybe"]
            )
            metrics.average_would_eat_again_score = (
                (counts["would_eat_again_yes"] + counts["would_eat_again_maybe"] * 0.5) / total_answers * 100
                if total_answers
                else None
            )
            metrics.save()
            return True
        except Exception:
            logger.exception(f"Error updating metrics for menu item {menu_item_api_id}")
            return False

    def update_user_menu_item_interaction(self, user: Any, menu_item_api_id: str, **fields) -> bool:
        """Set the given interaction fields (see UPDATABLE_FIELDS) and refresh the item's metrics."""
        try:
            menu_item = MenuItem.objects.get(id=menu_item_api_id)
            interaction, _ = MenuItemInteraction.objects.get_or_create(user=user, menu_item=menu_item)
            for field, value in fields.items():
                if field in self.UPDATABLE_FIELDS:
                    setattr(interaction, field, value)
            interaction.save()
            self.update_menu_item_metrics(menu_item_api_id)
            return True
        except MenuItem.DoesNotExist:
            logger.warning(f"Menu item {menu_item_api_id} does not exist.")
            return False
        except Exception:
            logger.exception(f"Error updating interaction for user {user.id}, menu item {menu_item_api_id}")
            return False


interactions_service = MenuItemInteractionsService()
