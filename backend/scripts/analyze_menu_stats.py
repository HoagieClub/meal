import sys
import os
import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hoagiemeal.settings")

import django

django.setup()

from collections import defaultdict
from hoagiemeal.models.menu import ResidentialMenu, RetailMenu


def collect_item_ids_from_menu_items(menu_items: dict) -> list:
    """Flatten the menu_items JSON structure into a list of item IDs (duplicates preserved).

    menu_items is expected to be { section: [item_id, ...] }
    but handles nesting one level deeper just in case.
    """
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
    # Gather per-date counts and global item occurrence tracking
    menus_per_day: dict[str, int] = defaultdict(int)
    items_per_day_unique: dict[str, set] = defaultdict(set)
    items_per_day_total: dict[str, int] = defaultdict(int)
    item_occurrence_count: dict[str, int] = defaultdict(int)  # how many days each item appears

    for menu in ResidentialMenu.objects.select_related("dining_location").all():
        date_key = menu.date.isoformat()
        menus_per_day[date_key] += 1
        ids = collect_item_ids_from_menu_items(menu.menu_items or {})
        items_per_day_unique[date_key].update(ids)
        items_per_day_total[date_key] += len(ids)

    for menu in RetailMenu.objects.select_related("dining_location").all():
        date_key = menu.date.isoformat()
        menus_per_day[date_key] += 1
        ids = collect_item_ids_from_menu_items(menu.menu_items or {})
        items_per_day_unique[date_key].update(ids)
        items_per_day_total[date_key] += len(ids)

    if not menus_per_day:
        print("No menu data found in the database.")
        return

    # Count how many days each unique item appears across all days
    for day_ids in items_per_day_unique.values():
        for item_id in day_ids:
            item_occurrence_count[item_id] += 1

    num_days = len(menus_per_day)
    total_menus = sum(menus_per_day.values())
    unique_items_ever = len(item_occurrence_count)
    avg_menus = total_menus / num_days
    avg_unique_items_per_day = sum(len(ids) for ids in items_per_day_unique.values()) / num_days
    avg_total_items_per_day = sum(items_per_day_total.values()) / num_days
    avg_occurrences_per_item = sum(item_occurrence_count.values()) / unique_items_ever if unique_items_ever else 0

    print(f"Days with data:                  {num_days}")
    print(f"Total menu records:              {total_menus}")
    print(f"Unique menu items ever served:   {unique_items_ever}")
    print(f"Avg menus per day:               {avg_menus:.2f}")
    print(f"Avg items per day (with dupes):  {avg_total_items_per_day:.2f}")
    print(f"Avg unique items per day:        {avg_unique_items_per_day:.2f}")
    print(f"Avg days each item appears:      {avg_occurrences_per_item:.2f}  (how often a given item recurs)")

    # Find the 7-day window with the most item appearances (including dupes)
    all_dates = sorted(datetime.date.fromisoformat(d) for d in menus_per_day)
    best_start = None
    best_items = -1
    best_menus = 0
    for i, start in enumerate(all_dates):
        end = start + datetime.timedelta(days=6)
        window_dates = [d for d in all_dates if start <= d <= end]
        window_items = sum(items_per_day_total[d.isoformat()] for d in window_dates)
        if window_items > best_items:
            best_items = window_items
            best_menus = sum(menus_per_day[d.isoformat()] for d in window_dates)
            best_start = start

    print()
    if best_start is not None:
        best_end = best_start + datetime.timedelta(days=6)
        print(f"Busiest 7-day period:            {best_start} to {best_end}")
        print(f"  Menu items served (w/ dupes):  {best_items}")
        print(f"  Menu records:                  {best_menus}")

    print()
    print("Breakdown by date:")
    print(f"  {'Date':<12}  {'Menus':>6}  {'Items (w/ dupes)':>16}  {'Unique Items':>12}")
    print(f"  {'-' * 12}  {'-' * 6}  {'-' * 16}  {'-' * 12}")
    for date_key in sorted(menus_per_day):
        print(f"  {date_key:<12}  {menus_per_day[date_key]:>6}  {items_per_day_total[date_key]:>16}  {len(items_per_day_unique[date_key]):>12}")


if __name__ == "__main__":
    main()
