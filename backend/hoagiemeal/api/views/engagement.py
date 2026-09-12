"""Engagement endpoints: aggregate metrics and the caller's own interactions."""

from rest_framework import status
from rest_framework.decorators import api_view

from hoagiemeal.api.services.engagement import interactions_service
from hoagiemeal.api.services.user import decode_auth0_token, get_or_create_user
from hoagiemeal.api.views.responses import error, ok
from hoagiemeal.models.engagement import MenuItemInteraction
from hoagiemeal.utils.logger import logger

_MISSING = object()
# The frontend asks for one day's items at a time; anything much larger is not a real page.
MAX_IDS_PER_REQUEST = 1000


def _parse_bool(value):
    """Coerce a request value to bool, accepting the strings 'true' and 'false'."""
    if value is None:
        return None
    if isinstance(value, str):
        return value.lower() == "true"
    return bool(value)


def _menu_item_ids(request) -> list[str] | None:
    """The `menu_item_api_ids` list from the body, or None when it is missing or malformed."""
    ids = request.data.get("menu_item_api_ids")
    if not isinstance(ids, list) or not ids or len(ids) > MAX_IDS_PER_REQUEST:
        return None
    if not all(isinstance(item_id, str) for item_id in ids):
        return None
    return ids


@api_view(["POST"])
def get_engagement_data(request):
    """Metrics for the given menu items, plus the caller's interactions when authenticated."""
    try:
        menu_item_api_ids = _menu_item_ids(request)
        if menu_item_api_ids is None:
            return error("menu_item_api_ids must be a non-empty list of ids.", status.HTTP_400_BAD_REQUEST)

        claims = decode_auth0_token(request)
        user = get_or_create_user(claims) if claims else None
        interactions = {}
        if user:
            interactions = interactions_service.get_user_menu_item_interactions(user, menu_item_api_ids) or {}
        metrics = interactions_service.get_or_create_menu_items_metrics(menu_item_api_ids)
        if metrics is None:
            return error("An internal error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)

        return ok({"interactions": interactions, "metrics": metrics}, "Engagement data fetched successfully.")
    except Exception:
        logger.exception("Error in get_engagement_data view")
        return error("An internal error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PATCH"])
def update_user_menu_item_interaction(request):
    """Update the caller's interaction with one menu item. Only fields present in the body change."""
    try:
        claims = decode_auth0_token(request)
        if not claims:
            return error("Authentication required.", status.HTTP_401_UNAUTHORIZED)
        user = get_or_create_user(claims)
        if not user:
            return error("Could not load your account.", status.HTTP_500_INTERNAL_SERVER_ERROR)

        menu_item_api_id = request.data.get("menu_item_api_id")
        if not isinstance(menu_item_api_id, str) or not menu_item_api_id:
            return error("menu_item_api_id is required.", status.HTTP_400_BAD_REQUEST)

        # `liked` is tri-state (null clears it), so its presence is checked with a sentinel.
        fields = {}
        liked = request.data.get("liked", _MISSING)
        if liked is not _MISSING:
            fields["liked"] = _parse_bool(liked)
        for field in ("favorited", "saved_for_later"):
            value = request.data.get(field)
            if value is not None:
                fields[field] = _parse_bool(value)
        would_eat_again = request.data.get("would_eat_again")
        if would_eat_again is not None:
            if would_eat_again not in MenuItemInteraction.WouldEatAgain.values:
                return error("would_eat_again must be Y, N or M.", status.HTTP_400_BAD_REQUEST)
            fields["would_eat_again"] = would_eat_again

        if not interactions_service.update_user_menu_item_interaction(user, menu_item_api_id, **fields):
            return error("Failed to update the interaction.", status.HTTP_500_INTERNAL_SERVER_ERROR)
        return ok(True, "Interaction updated successfully.")
    except Exception:
        logger.exception("Error in update_user_menu_item_interaction view")
        return error("An internal error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)
