"""Engagement service tests: the metrics derived from votes."""

from django.test import TestCase

from hoagiemeal.api.services.engagement import interactions_service
from hoagiemeal.models import CustomUser, MenuItem, MenuItemMetrics


class MetricsTests(TestCase):
    def setUp(self):
        self.alice = CustomUser.objects.create(username="alice", auth0_id="auth0|alice")
        self.bob = CustomUser.objects.create(username="bob", auth0_id="auth0|bob")
        MenuItem.objects.create(id="A", name="Apple", url="u")

    def metrics(self):
        return MenuItemMetrics.objects.get(menu_item_id="A")

    def test_votes_update_the_counts_and_score_and_unknown_input_is_ignored(self):
        self.assertTrue(interactions_service.update_user_menu_item_interaction(self.alice, "A", liked=True))
        self.assertEqual((self.metrics().like_count, self.metrics().dislike_count), (1, 0))
        self.assertEqual(self.metrics().average_like_score, 100)

        interactions_service.update_user_menu_item_interaction(self.bob, "A", liked=False)
        self.assertEqual((self.metrics().like_count, self.metrics().dislike_count), (1, 1))
        self.assertEqual(self.metrics().average_like_score, 0)

        interactions_service.update_user_menu_item_interaction(self.alice, "A", liked=None)
        self.assertEqual((self.metrics().like_count, self.metrics().dislike_count), (0, 1))
        self.assertEqual(self.metrics().average_like_score, -100)

        self.assertTrue(interactions_service.update_user_menu_item_interaction(self.alice, "A", bogus=1))
        self.assertFalse(interactions_service.update_user_menu_item_interaction(self.alice, "missing", liked=True))
