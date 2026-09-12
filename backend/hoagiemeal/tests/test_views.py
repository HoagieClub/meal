"""API endpoint tests."""

import datetime
import json
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase

from hoagiemeal.api.services.cacher import local_today
from hoagiemeal.models import CustomUser, MenuItem, MenuItemInteraction, MenuItemMetrics

MENUS_RESULT = {
    "menus": {"01": {"Lunch": {"Soups": ["1"]}}},
    "menu_items": {"1": {"id": "1", "name": "Soup", "url": "u", "nutrition": None}},
}
MENUS_SERVICE = "hoagiemeal.api.views.cacher.cacher_service.get_or_cache_menus_and_items_for_date"
CLAIMS = {"sub": "auth0|tiger"}


class MenusEndpointTests(TestCase):
    def setUp(self):
        cache.clear()
        self.today = local_today().isoformat()

    def test_validates_the_date_and_returns_menus_and_items(self):
        self.assertEqual(self.client.get("/api/menus/").status_code, 400)
        self.assertIn("YYYY-MM-DD", self.client.get("/api/menus/?date=tomorrow").json()["error"])
        far_away = (local_today() + datetime.timedelta(days=90)).isoformat()
        self.assertEqual(self.client.get(f"/api/menus/?date={far_away}").status_code, 400)

        with patch(MENUS_SERVICE, return_value=MENUS_RESULT) as service:
            response = self.client.get(f"/api/menus/?date={self.today}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], MENUS_RESULT)
        self.assertIsNone(response.json()["error"])
        self.assertEqual(service.call_args.args[0].isoformat(), self.today)

    def test_only_successful_responses_are_cached(self):
        # An outage, then an empty day, then a real menu: none of the first two may be served again.
        with patch(MENUS_SERVICE, side_effect=[None, {"menus": {}, "menu_items": {}}, MENUS_RESULT]) as service:
            first = self.client.get(f"/api/menus/?date={self.today}")
            second = self.client.get(f"/api/menus/?date={self.today}")
            third = self.client.get(f"/api/menus/?date={self.today}")
            fourth = self.client.get(f"/api/menus/?date={self.today}")

        self.assertEqual(service.call_count, 3, "the successful answer is served from the cache")
        self.assertEqual(first.status_code, 503)
        self.assertIsNone(first.json()["data"])
        self.assertEqual(second.json()["data"]["menus"], {})
        self.assertEqual(third.json()["data"], MENUS_RESULT)
        self.assertEqual(fourth.json()["data"], MENUS_RESULT)


class EngagementEndpointTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create(username="tiger", auth0_id="auth0|tiger")
        MenuItem.objects.create(id="A", name="Apple", url="u")
        MenuItem.objects.create(id="B", name="Bagel", url="u")

    def post_json(self, url, body):
        return self.client.generic("POST", url, json.dumps(body), content_type="application/json")

    def patch_json(self, url, body):
        return self.client.generic("PATCH", url, json.dumps(body), content_type="application/json")

    def test_anonymous_readers_get_metrics_and_only_logged_in_users_can_vote(self):
        with patch("hoagiemeal.api.views.engagement.decode_auth0_token", return_value=None):
            response = self.post_json("/api/engagement/", {"menu_item_api_ids": ["A", "B", "missing"]})
            refused = self.patch_json("/api/engagement/interaction/", {"menu_item_api_id": "A", "liked": True})

        data = response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["interactions"], {})
        self.assertEqual(sorted(data["metrics"]), ["A", "B"])
        self.assertEqual(data["metrics"]["A"]["like_count"], 0)
        self.assertEqual(refused.status_code, 401)

        with (
            patch("hoagiemeal.api.views.engagement.decode_auth0_token", return_value=CLAIMS),
            patch("hoagiemeal.api.views.engagement.get_or_create_user", return_value=self.user),
        ):
            liked = self.patch_json("/api/engagement/interaction/", {"menu_item_api_id": "A", "liked": True})
            self.assertEqual(liked.status_code, 200)
            self.assertEqual(MenuItemMetrics.objects.get(menu_item_id="A").like_count, 1)

            # Clearing with null takes the vote back; fields that are not sent stay as they were.
            self.patch_json("/api/engagement/interaction/", {"menu_item_api_id": "A", "liked": None})
            self.patch_json("/api/engagement/interaction/", {"menu_item_api_id": "A", "favorited": True})
            interaction = MenuItemInteraction.objects.get(user=self.user, menu_item_id="A")
            self.assertIsNone(interaction.liked)
            self.assertTrue(interaction.favorited)
            self.assertEqual(MenuItemMetrics.objects.get(menu_item_id="A").like_count, 0)

            # Values outside the model's choices are refused rather than stored.
            bad = self.patch_json("/api/engagement/interaction/", {"menu_item_api_id": "A", "would_eat_again": "X"})
            self.assertEqual(bad.status_code, 400)

            response = self.post_json("/api/engagement/", {"menu_item_api_ids": ["A"]})
            self.assertTrue(response.json()["data"]["interactions"]["A"]["favorited"])
