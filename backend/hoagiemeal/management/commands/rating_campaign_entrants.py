"""List the rating campaign's raffle tickets, and optionally draw a winner.

    uv run manage.py rating_campaign_entrants                  # tickets so far, by student
    uv run manage.py rating_campaign_entrants --draw           # plus a winner, one chance per ticket
    uv run manage.py rating_campaign_entrants --start 2026-11-11 --end 2026-11-14
                                                               # other dates, e.g. a past test run

On Heroku: heroku run python manage.py rating_campaign_entrants --draw
"""

import datetime
import secrets

from django.core.management.base import BaseCommand, CommandError

from hoagiemeal.api.services.rating_campaign import RatingCampaign, campaign_entrants, configured_campaign


class Command(BaseCommand):
    """See the module docstring."""

    help = "List the rating campaign's raffle tickets by student, and optionally draw a winner."

    def add_arguments(self, parser):
        """Add --draw, --start and --end."""
        parser.add_argument("--draw", action="store_true", help="Pick a winner, one chance per ticket.")
        parser.add_argument("--start", type=datetime.date.fromisoformat, help="First day, YYYY-MM-DD.")
        parser.add_argument("--end", type=datetime.date.fromisoformat, help="Last day, YYYY-MM-DD.")

    def handle(self, *args, **options):
        """Print the tickets, then the winner when --draw is given."""
        campaign = self._campaign(options["start"], options["end"])
        entrants = campaign_entrants(campaign)
        tickets = sum(len(days) for _, days in entrants)
        last_day = campaign.ends_on.isoformat() if campaign.ends_on else "today (no end date)"
        self.stdout.write(
            f"{tickets} {'ticket' if tickets == 1 else 'tickets'} for {len(entrants)} "
            f"{'student' if len(entrants) == 1 else 'students'} from {campaign.starts_on.isoformat()} to "
            f"{last_day}, at {campaign.ratings_per_ticket} rated per day per ticket:"
        )
        for user, days in entrants:
            listed = ", ".join(day.strftime("%a %b %-d") for day in days)
            self.stdout.write(f"  {user.email or user.username}\t{len(days)}\t{listed}")

        if not options["draw"]:
            return
        if campaign.is_running():
            self.stdout.write(self.style.WARNING("The campaign is still running, so more tickets may come in."))
        if not entrants:
            raise CommandError("Nobody has a ticket yet, so there is no winner to draw.")
        winner = secrets.choice([user for user, days in entrants for _ in days])
        self.stdout.write(self.style.SUCCESS(f"Winner: {winner.email or winner.username}"))

    def _campaign(self, start, end) -> RatingCampaign:
        configured = configured_campaign()
        if start is None:
            if configured is None:
                raise CommandError("No rating campaign is set up. Set RATING_CAMPAIGN_* or pass --start.")
            return configured.with_dates(configured.starts_on, end or configured.ends_on)
        if end is not None and end < start:
            raise CommandError("--end is before --start.")
        if configured is None:
            return RatingCampaign(starts_on=start, ends_on=end, prize="", goal=None, ratings_per_ticket=1)
        return configured.with_dates(start, end)
