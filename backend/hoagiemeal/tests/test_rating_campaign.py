"""Rating campaign tests: its settings, daily tickets, the stats endpoint and the draw."""

import datetime
from io import StringIO
from unittest.mock import patch

from django.core.management import CommandError, call_command
from django.test import TestCase
from django.utils import timezone

from hoagiemeal.api.services.cacher import CAMPUS_TZ, local_today
from hoagiemeal.api.services.engagement import interactions_service
from hoagiemeal.api.services.rating_campaign import (
    campaign_entrants,
    campaign_ratings,
    configured_campaign,
    ticket_days,
)
from hoagiemeal.models import CustomUser, MenuItem, MenuItemInteraction

CAMPAIGN = {
    "RATING_CAMPAIGN_START": "2026-11-11",
    "RATING_CAMPAIGN_END": "2026-11-14",
    "RATING_CAMPAIGN_PRIZE": "any Amazon item up to $100",
    "RATING_CAMPAIGN_GOAL": "500",
    "RATING_CAMPAIGN_RATINGS_PER_TICKET": "1",
}
THURSDAY = datetime.date(2026, 11, 12)
SUNDAY = datetime.date(2026, 11, 15)
LOCAL_TODAY = "hoagiemeal.api.services.rating_campaign.local_today"
DECODE = "hoagiemeal.api.views.engagement.decode_auth0_token"
GET_USER = "hoagiemeal.api.views.engagement.get_or_create_user"


def campus(day: int, hour: int = 12, minute: int = 0) -> datetime.datetime:
    """A moment in November 2026, campus time."""
    return datetime.datetime(2026, 11, day, hour, minute, tzinfo=CAMPUS_TZ)


def rate(user, item_id: str, liked, first_rated_at, **fields):
    """Store a rating first made at `first_rated_at`; its updated_at is deliberately left as now."""
    MenuItemInteraction.objects.create(
        user=user, menu_item_id=item_id, liked=liked, first_rated_at=first_rated_at, **fields
    )


class CampaignTestCase(TestCase):
    def setUp(self):
        self.alice, self.bob, self.carol = (
            CustomUser.objects.create(username=name, auth0_id=f"auth0|{name}", email=f"{name}@princeton.edu")
            for name in ("alice", "bob", "carol")
        )
        for item_id in "ABCDEF":
            MenuItem.objects.create(id=item_id, name=f"Item {item_id}", url="u")


class CampaignSettingsTests(TestCase):
    def test_reads_the_settings_and_runs_between_its_dates(self):
        with self.settings(**CAMPAIGN):
            campaign = configured_campaign()

        self.assertEqual(
            (campaign.starts_on, campaign.ends_on), (datetime.date(2026, 11, 11), datetime.date(2026, 11, 14))
        )
        self.assertEqual(
            (campaign.prize, campaign.goal, campaign.ratings_per_ticket), ("any Amazon item up to $100", 500, 1)
        )
        self.assertFalse(campaign.is_running(datetime.date(2026, 11, 10)))
        self.assertTrue(campaign.is_running(datetime.date(2026, 11, 11)))
        self.assertTrue(campaign.is_running(datetime.date(2026, 11, 14)))
        self.assertFalse(campaign.is_running(SUNDAY))

        with self.settings(**{**CAMPAIGN, "RATING_CAMPAIGN_END": "", "RATING_CAMPAIGN_GOAL": ""}):
            open_ended = configured_campaign()
        self.assertIsNone(open_ended.goal)
        self.assertTrue(open_ended.is_running(datetime.date(2027, 5, 1)))

    def test_is_off_when_unset_or_any_value_is_invalid(self):
        with self.settings(**{**CAMPAIGN, "RATING_CAMPAIGN_START": None}):
            self.assertIsNone(configured_campaign())
        for bad in (
            {"RATING_CAMPAIGN_START": "Nov 11"},
            {"RATING_CAMPAIGN_END": "2026-11-01"},
            {"RATING_CAMPAIGN_GOAL": "lots"},
            {"RATING_CAMPAIGN_RATINGS_PER_TICKET": "0"},
        ):
            with self.subTest(bad), self.settings(**{**CAMPAIGN, **bad}):
                self.assertIsNone(configured_campaign())


class FirstRatedAtTests(CampaignTestCase):
    def test_is_set_by_the_first_vote_and_kept_through_stars_changes_and_clearing(self):
        interactions_service.update_user_menu_item_interaction(self.alice, "A", favorited=True)
        self.assertIsNone(MenuItemInteraction.objects.get(user=self.alice).first_rated_at)

        interactions_service.update_user_menu_item_interaction(self.alice, "A", liked=True)
        first = MenuItemInteraction.objects.get(user=self.alice).first_rated_at
        self.assertIsNotNone(first)

        for change in ({"favorited": False}, {"liked": False}, {"liked": None}, {"liked": True}):
            interactions_service.update_user_menu_item_interaction(self.alice, "A", **change)
            self.assertEqual(MenuItemInteraction.objects.get(user=self.alice).first_rated_at, first)


class TicketTests(CampaignTestCase):
    def test_ratings_count_by_the_campus_day_they_were_first_made(self):
        rate(self.alice, "A", True, campus(10, 23, 59))  # the night before it starts
        rate(self.alice, "B", False, campus(11, 0, 1))  # just after midnight on the first day
        rate(self.alice, "C", True, campus(14, 23, 59))  # the last minute of the last day
        rate(self.alice, "D", True, campus(15, 0, 1))  # the morning after it ends
        rate(self.alice, "E", None, campus(12))  # a vote taken back
        rate(self.bob, "A", None, None, favorited=True)  # a star, never a vote

        with self.settings(**CAMPAIGN):
            campaign = configured_campaign()

        self.assertEqual(set(campaign_ratings(campaign).values_list("menu_item_id", flat=True)), {"B", "C"})
        self.assertEqual(ticket_days(campaign, self.alice), [datetime.date(2026, 11, 11), datetime.date(2026, 11, 14)])

    def test_one_ticket_per_day_with_enough_ratings_and_most_tickets_first(self):
        rate(self.alice, "A", True, campus(11, 9))
        rate(self.alice, "B", True, campus(11, 18))  # a second rating the same day: still one ticket
        rate(self.alice, "C", True, campus(12))
        rate(self.alice, "D", True, campus(13))
        rate(self.bob, "A", False, campus(12))
        rate(self.carol, "A", True, campus(1))  # before the campaign

        with self.settings(**CAMPAIGN):
            entrants = campaign_entrants(configured_campaign())
        with self.settings(**{**CAMPAIGN, "RATING_CAMPAIGN_RATINGS_PER_TICKET": "2"}):
            stricter = campaign_entrants(configured_campaign())

        nov = lambda day: datetime.date(2026, 11, day)  # noqa: E731
        self.assertEqual(entrants, [(self.alice, [nov(11), nov(12), nov(13)]), (self.bob, [nov(12)])])
        self.assertEqual(stricter, [(self.alice, [nov(11)])])


class StatsEndpointTests(CampaignTestCase):
    def get_stats(self, user=None):
        with patch(DECODE, return_value={"sub": user.auth0_id} if user else None), patch(GET_USER, return_value=user):
            response = self.client.get("/api/engagement/stats/")
        self.assertEqual(response.status_code, 200)
        return response.json()["data"]

    def test_shows_the_total_and_while_running_the_campaign_and_the_callers_tickets(self):
        rate(self.alice, "A", True, campus(1))  # before the campaign: in the total only
        rate(self.alice, "B", False, campus(11))
        rate(self.alice, "C", True, campus(12, 8))
        rate(self.bob, "A", True, campus(11))

        with self.settings(**CAMPAIGN), patch(LOCAL_TODAY, return_value=THURSDAY):
            anonymous = self.get_stats()
            alice = self.get_stats(self.alice)
            carol = self.get_stats(self.carol)
        with self.settings(**CAMPAIGN), patch(LOCAL_TODAY, return_value=SUNDAY):
            after = self.get_stats(self.alice)

        self.assertEqual(
            anonymous,
            {
                "total_ratings": 4,
                "campaign": {
                    "starts_on": "2026-11-11",
                    "ends_on": "2026-11-14",
                    "today": "2026-11-12",
                    "prize": "any Amazon item up to $100",
                    "goal": 500,
                    "ratings_per_ticket": 1,
                    "user": None,
                },
            },
        )
        self.assertEqual(alice["campaign"]["user"], {"ticket_days": ["2026-11-11", "2026-11-12"], "rated_today": 1})
        self.assertEqual(carol["campaign"]["user"], {"ticket_days": [], "rated_today": 0})
        self.assertEqual(after, {"total_ratings": 4, "campaign": None})

    def test_a_vote_cast_now_earns_todays_ticket(self):
        interactions_service.update_user_menu_item_interaction(self.carol, "A", liked=True)
        interactions_service.update_user_menu_item_interaction(self.carol, "B", favorited=True)

        today = local_today().isoformat()
        with self.settings(**{**CAMPAIGN, "RATING_CAMPAIGN_START": today, "RATING_CAMPAIGN_END": ""}):
            stats = self.get_stats(self.carol)

        self.assertEqual(stats["campaign"]["user"], {"ticket_days": [today], "rated_today": 1})
        self.assertLessEqual(MenuItemInteraction.objects.get(menu_item_id="A").first_rated_at, timezone.now())


class EntrantsCommandTests(CampaignTestCase):
    def test_lists_tickets_by_student_and_draws_one_of_them(self):
        rate(self.alice, "A", True, campus(11))
        rate(self.alice, "B", True, campus(13))
        rate(self.bob, "A", True, campus(1))  # before the campaign

        out = StringIO()
        with self.settings(**CAMPAIGN), patch(LOCAL_TODAY, return_value=SUNDAY):
            call_command("rating_campaign_entrants", "--draw", stdout=out)

        self.assertIn("2 tickets for 1 student from 2026-11-11 to 2026-11-14", out.getvalue())
        self.assertIn("alice@princeton.edu\t2\tWed Nov 11, Fri Nov 13", out.getvalue())
        self.assertIn("Winner: alice@princeton.edu", out.getvalue())
        self.assertNotIn("bob", out.getvalue())

    def test_other_dates_can_be_looked_back_at_without_a_campaign_set_up(self):
        rate(self.bob, "A", True, campus(1))

        out = StringIO()
        with self.settings(RATING_CAMPAIGN_START=None):
            call_command("rating_campaign_entrants", "--start", "2026-11-01", "--end", "2026-11-02", stdout=out)

        self.assertIn("1 ticket for 1 student from 2026-11-01 to 2026-11-02", out.getvalue())

    def test_refuses_without_a_campaign_or_without_tickets(self):
        with self.settings(RATING_CAMPAIGN_START=None), self.assertRaises(CommandError):
            call_command("rating_campaign_entrants", stdout=StringIO())
        with self.settings(**CAMPAIGN), self.assertRaises(CommandError):
            call_command("rating_campaign_entrants", "--draw", stdout=StringIO())
