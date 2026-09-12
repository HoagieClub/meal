"""Scrape and store menus for a range of days around today, and re-check stale nutrition labels.

Run from the backend directory: `uv run scripts/seed_menus.py [--behind N] [--ahead N] [--skip-items] [--force]`.
With no arguments it seeds today plus the next six days, which is what the Heroku scheduler runs
daily. Menus for today and later are re-scraped when older than the cacher's refresh window, and
the labels of the items on those menus are re-scraped when older than a day.
"""

import argparse
import datetime
import os
import sys


def setup_django():
    """Make the backend importable and initialise Django."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
    import django

    django.setup()


def main() -> int:
    """Seed the requested date range and return a process exit code."""
    parser = argparse.ArgumentParser(description="Seed cached menus for a range of days.")
    parser.add_argument("--behind", type=int, default=0, help="days before today to seed (default: 0)")
    parser.add_argument("--ahead", type=int, default=6, help="days after today to seed (default: 6)")
    parser.add_argument("--skip-items", action="store_true", help="do not re-check stale nutrition labels")
    parser.add_argument("--force", action="store_true", help="re-scrape menus even if they were checked recently")
    args = parser.parse_args()

    setup_django()
    from hoagiemeal.api.services.cacher import cacher_service, local_today
    from hoagiemeal.api.services.scraper import collect_menu_item_ids

    # Pick up renamed or newly added locations before touching menus.
    cacher_service.get_or_cache_locations(refresh=True)

    today = local_today()
    dates = [today + datetime.timedelta(days=offset) for offset in range(-args.behind, args.ahead + 1)]
    print(f"Seeding {len(dates)} days: {dates[0]} -> {dates[-1]}")

    failed = []
    item_ids: set[str] = set()
    for date in dates:
        print(f"Caching {date}...", flush=True)
        result = cacher_service.get_or_cache_all_menus_for_date(date, force=args.force)
        if result is None:
            print(f"Failed: {date}", file=sys.stderr)
            failed.append(date)
        else:
            item_ids.update(collect_menu_item_ids(result))
            print(f"Cached {date}: {len(result)} locations")

    if not args.skip_items and item_ids:
        print(f"Re-checking stale labels among {len(item_ids)} menu items...", flush=True)
        refreshed = cacher_service.refresh_stale_menu_items(sorted(item_ids))
        print(f"Refreshed {refreshed} labels")

    if failed:
        print(f"{len(failed)} day(s) failed: {failed}", file=sys.stderr)
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
