"""Menu endpoints."""

import datetime

from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from hoagiemeal.api.services.cacher import cacher_service, local_today
from hoagiemeal.api.views.responses import error
from hoagiemeal.utils.logger import logger

# Successful, non-empty responses are cached briefly so bursts of traffic do not each hit the
# database (and possibly the scraper). Empty or failed results are never cached.
RESPONSE_CACHE_SECONDS = 5 * 60
# Dates further from today than this are refused, so nobody can make the server scrape years of
# menus that Campus Dining will never publish.
MAX_DAYS_FROM_TODAY = 31


@api_view(["GET"])
def get_or_cache_menus_and_items_for_date(request):
    """Menus and menu items for `?date=YYYY-MM-DD`."""
    raw_date = request.query_params.get("date")
    if not raw_date:
        return error("Date is required.", status.HTTP_400_BAD_REQUEST)
    try:
        date = datetime.date.fromisoformat(raw_date)
    except ValueError:
        return error("Date must be formatted as YYYY-MM-DD.", status.HTTP_400_BAD_REQUEST)
    if abs((date - local_today()).days) > MAX_DAYS_FROM_TODAY:
        return error(f"Date must be within {MAX_DAYS_FROM_TODAY} days of today.", status.HTTP_400_BAD_REQUEST)

    cache_key = f"menus-response:{date.isoformat()}"
    payload = cache.get(cache_key)
    if payload:
        return Response(payload)

    try:
        result = cacher_service.get_or_cache_menus_and_items_for_date(date)
    except Exception:
        logger.exception(f"Error retrieving menus and items for {date}")
        return error("An internal error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)
    if result is None:
        # Nothing stored and the menu site could not be reached: say so rather than "no menus".
        return error("Menus are temporarily unavailable.", status.HTTP_503_SERVICE_UNAVAILABLE)

    payload = {"data": result, "message": "Menus and items retrieved successfully.", "error": None}
    if result["menus"]:
        cache.set(cache_key, payload, RESPONSE_CACHE_SECONDS)
    return Response(payload)
