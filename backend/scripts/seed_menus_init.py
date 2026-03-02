import sys
import os
import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")

import django

django.setup()

from hoagiemeal.api.cacher import CacherService

WEEKS_BEHIND = 3
WEEKS_AHEAD = 3


def main():
    cacher = CacherService()
    today = datetime.date.today()
    start = today - datetime.timedelta(weeks=WEEKS_BEHIND)
    total_days = WEEKS_BEHIND * 7 + WEEKS_AHEAD * 7 + 1
    dates = [start + datetime.timedelta(days=i) for i in range(total_days)]

    print(f"[seed_menus_init] Seeding {len(dates)} days: {dates[0]} -> {dates[-1]}")

    failed = []
    for date in dates:
        print(f"[seed_menus_init] Caching {date}...", flush=True)
        result = cacher.get_or_cache_all_menus_for_date(date)
        if result is not None:
            print(f"[seed_menus_init] Success: {date} -> {len(result)} locations")
        else:
            print(f"[seed_menus_init] Failed: {date} -> returned no data", file=sys.stderr)
            failed.append(date)

    if failed:
        print(f"[seed_menus_init] Done with {len(failed)} failure(s): {failed}", file=sys.stderr)
        sys.exit(1)

    print(f"[seed_menus_init] All {len(dates)} days seeded successfully.")
    sys.exit(0)


if __name__ == "__main__":
    main()
