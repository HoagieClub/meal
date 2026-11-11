"""The rating campaign: a raffle ticket for each day a student rates dishes while it runs.

A rating is a like or a dislike, dated by when the student first rated that dish (first_rated_at),
so starring a dish or changing a vote later never moves it to another day. Each campus day on which
a student first rated at least `ratings_per_ticket` dishes from that day's menu earns one ticket.
Ratings of dishes from other days' menus are kept and shown, but earn nothing. A vote taken back no
longer counts, and rating a dish again keeps its original day, so toggling a vote earns nothing.
"""

import datetime
from collections import defaultdict
from dataclasses import dataclass, replace
from typing import Any, Optional

from django.conf import settings
from django.db.models import Count, QuerySet
from django.db.models.functions import TruncDate

from hoagiemeal.api.services.cacher import CAMPUS_TZ, local_today
from hoagiemeal.models.engagement import MenuItemInteraction
from hoagiemeal.models.user import CustomUser
from hoagiemeal.utils.logger import logger


@dataclass(frozen=True)
class RatingCampaign:
    """A campaign's dates (campus time, both inclusive), prize and targets."""

    starts_on: datetime.date
    ends_on: Optional[datetime.date]
    prize: str
    goal: Optional[int]
    ratings_per_ticket: int

    @property
    def window_start(self) -> datetime.datetime:
        """Campus midnight at the start of the first day."""
        return datetime.datetime.combine(self.starts_on, datetime.time.min, tzinfo=CAMPUS_TZ)

    @property
    def window_end(self) -> Optional[datetime.datetime]:
        """Campus midnight after the last day, or None for an open-ended campaign."""
        if self.ends_on is None:
            return None
        return datetime.datetime.combine(
            self.ends_on + datetime.timedelta(days=1), datetime.time.min, tzinfo=CAMPUS_TZ
        )

    def is_running(self, today: Optional[datetime.date] = None) -> bool:
        """Whether `today` (default: today on campus) falls within the campaign."""
        today = today or local_today()
        return self.starts_on <= today and (self.ends_on is None or today <= self.ends_on)

    def with_dates(self, starts_on: datetime.date, ends_on: Optional[datetime.date]) -> "RatingCampaign":
        """The same campaign over other dates, e.g. to look back at a test run."""
        return replace(self, starts_on=starts_on, ends_on=ends_on)


def configured_campaign() -> Optional[RatingCampaign]:
    """The campaign set in settings, running or not. None when there is none or a value is invalid."""
    start = (settings.RATING_CAMPAIGN_START or "").strip()
    if not start:
        return None
    end = (settings.RATING_CAMPAIGN_END or "").strip()
    goal = (settings.RATING_CAMPAIGN_GOAL or "").strip()
    try:
        campaign = RatingCampaign(
            starts_on=datetime.date.fromisoformat(start),
            ends_on=datetime.date.fromisoformat(end) if end else None,
            prize=(settings.RATING_CAMPAIGN_PRIZE or "").strip(),
            goal=int(goal) if goal else None,
            ratings_per_ticket=int((settings.RATING_CAMPAIGN_RATINGS_PER_TICKET or "1").strip()),
        )
    except ValueError:
        logger.warning("Rating campaign is off: a RATING_CAMPAIGN_* value is not a valid date or number.")
        return None
    ends_too_soon = campaign.ends_on is not None and campaign.ends_on < campaign.starts_on
    if ends_too_soon or campaign.ratings_per_ticket < 1 or (campaign.goal is not None and campaign.goal < 1):
        logger.warning("Rating campaign is off: it ends before it starts, or a target is below 1.")
        return None
    return campaign


def all_ratings() -> QuerySet:
    """Every interaction that holds a like or a dislike."""
    return MenuItemInteraction.objects.filter(liked__isnull=False)


def campaign_ratings(campaign: RatingCampaign) -> QuerySet:
    """Ratings that count toward tickets: first made during the campaign, of a dish on that day's menu."""
    ratings = all_ratings().filter(first_rated_from_menu=True, first_rated_at__gte=campaign.window_start)
    if campaign.window_end is not None:
        ratings = ratings.filter(first_rated_at__lt=campaign.window_end)
    return ratings


def _ratings_per_day(ratings: QuerySet) -> QuerySet:
    """Rows of {user, day, ratings}: how many dishes each user first rated on each campus day."""
    return (
        ratings.annotate(day=TruncDate("first_rated_at", tzinfo=CAMPUS_TZ))
        .values("user", "day")
        .annotate(ratings=Count("id"))
        .order_by("user", "day")
    )


def ticket_days(campaign: RatingCampaign, user: Any) -> list[datetime.date]:
    """The days on which `user` earned a ticket, earliest first."""
    rows = _ratings_per_day(campaign_ratings(campaign).filter(user=user))
    return [row["day"] for row in rows if row["ratings"] >= campaign.ratings_per_ticket]


def campaign_entrants(campaign: RatingCampaign) -> list[tuple[CustomUser, list[datetime.date]]]:
    """Every user with at least one ticket, and the days they earned them, most tickets first."""
    days_by_user = defaultdict(list)
    for row in _ratings_per_day(campaign_ratings(campaign)):
        if row["ratings"] >= campaign.ratings_per_ticket:
            days_by_user[row["user"]].append(row["day"])
    users = CustomUser.objects.in_bulk(list(days_by_user))
    ranked = sorted(days_by_user.items(), key=lambda item: (-len(item[1]), item[0]))
    return [(users[user_id], days) for user_id, days in ranked]


def engagement_stats(user: Any) -> dict:
    """The all-time rating count and, while a campaign runs, its details and `user`'s tickets."""
    stats = {"total_ratings": all_ratings().count(), "campaign": None}
    campaign = configured_campaign()
    today = local_today()
    if campaign is None or not campaign.is_running(today):
        return stats

    progress = None  # Stays None for visitors who are not logged in, so the page can ask them to.
    if user:
        today_start = datetime.datetime.combine(today, datetime.time.min, tzinfo=CAMPUS_TZ)
        progress = {
            "ticket_days": [day.isoformat() for day in ticket_days(campaign, user)],
            "rated_today": campaign_ratings(campaign).filter(user=user, first_rated_at__gte=today_start).count(),
        }
    stats["campaign"] = {
        "starts_on": campaign.starts_on.isoformat(),
        "ends_on": campaign.ends_on.isoformat() if campaign.ends_on else None,
        # The campus date, so the page agrees with the server about which day's ticket is open.
        "today": today.isoformat(),
        "prize": campaign.prize,
        "goal": campaign.goal,
        "ratings_per_ticket": campaign.ratings_per_ticket,
        "user": progress,
    }
    return stats
