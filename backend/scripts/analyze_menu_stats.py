"""Print statistics about the menus stored in the database.

Run from the backend directory: `uv run scripts/analyze_menu_stats.py`.
"""

import datetime
import os
import sys
from collections import defaultdict


def setup_django():
    """Make the backend importable and initialise Django."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")
    import django

    django.setup()


def collect_item_ids(menu_items: dict) -> list[str]:
    """Flatten a menu's {section: [ids]} or {area: {section: [ids]}} structure, keeping duplicates."""
    ids = []
    for value in menu_items.values():
        if isinstance(value, list):
            ids.extend(str(v) for v in value)
        elif isinstance(value, dict):
            for inner in value.values():
                if isinstance(inner, list):
                    ids.extend(str(v) for v in inner)
    return ids


def main():
    """Aggregate every stored menu and print the statistics."""
    setup_django()
    from hoagiemeal.models.menu import ResidentialMenu, RetailMenu

    menus_per_day: dict[str, int] = defaultdict(int)
    unique_items_per_day: dict[str, set] = defaultdict(set)
    total_items_per_day: dict[str, int] = defaultdict(int)

    for model in (ResidentialMenu, RetailMenu):
        for menu in model.objects.all():
            day = menu.date.isoformat()
            ids = collect_item_ids(menu.menu_items or {})
            menus_per_day[day] += 1
            unique_items_per_day[day].update(ids)
            total_items_per_day[day] += len(ids)

    if not menus_per_day:
        print("No menu data found in the database.")
        return

    days_per_item: dict[str, int] = defaultdict(int)
    for ids in unique_items_per_day.values():
        for item_id in ids:
            days_per_item[item_id] += 1

    num_days = len(menus_per_day)
    total_menus = sum(menus_per_day.values())
    unique_items = len(days_per_item)
    print(f"Days with data:                  {num_days}")
    print(f"Total menu records:              {total_menus}")
    print(f"Unique menu items ever served:   {unique_items}")
    print(f"Avg menus per day:               {total_menus / num_days:.2f}")
    print(f"Avg items per day (with dupes):  {sum(total_items_per_day.values()) / num_days:.2f}")
    print(f"Avg unique items per day:        {sum(len(ids) for ids in unique_items_per_day.values()) / num_days:.2f}")
    print(f"Avg days each item appears:      {sum(days_per_item.values()) / unique_items if unique_items else 0:.2f}")

    # Busiest seven-day window by item appearances.
    all_dates = sorted(datetime.date.fromisoformat(day) for day in menus_per_day)
    best = None
    for start in all_dates:
        window = [d for d in all_dates if start <= d <= start + datetime.timedelta(days=6)]
        items = sum(total_items_per_day[d.isoformat()] for d in window)
        if best is None or items > best[1]:
            best = (start, items, sum(menus_per_day[d.isoformat()] for d in window))
    if best:
        start, items, menus = best
        print()
        print(f"Busiest 7-day period:            {start} to {start + datetime.timedelta(days=6)}")
        print(f"  Menu items served (w/ dupes):  {items}")
        print(f"  Menu records:                  {menus}")

    print()
    print("Breakdown by date:")
    print(f"  {'Date':<12}  {'Menus':>6}  {'Items (w/ dupes)':>16}  {'Unique Items':>12}")
    print(f"  {'-' * 12}  {'-' * 6}  {'-' * 16}  {'-' * 12}")
    for day in sorted(menus_per_day):
        print(
            f"  {day:<12}  {menus_per_day[day]:>6}  {total_items_per_day[day]:>16}  {len(unique_items_per_day[day]):>12}"
        )


if __name__ == "__main__":
    main()
