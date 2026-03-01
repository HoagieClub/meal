import sys
import os
import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")

import django

django.setup()

from hoagiemeal.api.cacher import CacherService

DAYS_AHEAD = 7


def main():
    cacher = CacherService()
    today = datetime.date.today()
    dates = [today + datetime.timedelta(days=i) for i in range(DAYS_AHEAD)]

    print(f"[seed_menus] Seeding {len(dates)} days: {dates[0]} -> {dates[-1]}")

    failed = []
    for date in dates:
        print(f"[seed_menus] Caching {date}...", flush=True)
        result = cacher.get_or_cache_all_menus_for_date(date)
        if result is not None:
            print(f"[seed_menus] Success: {date} -> {len(result)} locations")
        else:
            print(f"[seed_menus] Failed: {date} -> returned no data", file=sys.stderr)
            failed.append(date)

    if failed:
        print(f"[seed_menus] Done with {len(failed)} failure(s): {failed}", file=sys.stderr)
        sys.exit(1)

    print(f"[seed_menus] All {len(dates)} days seeded successfully.")
    sys.exit(0)


if __name__ == "__main__":
    main()
