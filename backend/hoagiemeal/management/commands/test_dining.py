"""Django management command to run the dining API testing script.

Copyright © 2021-2025 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:

    https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

import json
import datetime
from django.core.management.base import BaseCommand, CommandError
from hoagiemeal.api.dining import (
    get_all_dining_locations,
    get_all_dining_events,
    get_dining_events_for_date,
    analyze_date_range,
    convert_utc_to_eastern,
    dining_api,
)


def datetime_serializer(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


class Command(BaseCommand):
    """Command to run the dining API testing script."""

    help = "Test the dining API endpoints with various options"

    def add_arguments(self, parser):
        """Add command-line arguments."""
        # Subcommands
        subparsers = parser.add_subparsers(dest="command", help="Command to run")

        # locations command
        locations_parser = subparsers.add_parser("locations", help="Get dining locations")
        locations_parser.add_argument(
            "--category", help="Filter by category IDs (comma-separated, default: 2,3)", default="2,3"
        )
        locations_parser.add_argument("--output", help="Save results to a JSON file", default=None)

        # events command
        events_parser = subparsers.add_parser("events", help="Get dining events")
        events_parser.add_argument("--date", help="Filter events by date (YYYY-MM-DD)", default=None)
        events_parser.add_argument(
            "--category", help="Filter by category IDs (comma-separated, default: 2,3)", default="2,3"
        )
        events_parser.add_argument("--output", help="Save results to a JSON file", default=None)
        events_parser.add_argument("--analyze", help="Analyze date range of events", action="store_true")

        # menu command
        menu_parser = subparsers.add_parser("menu", help="Get dining menu")
        menu_parser.add_argument("--location", required=True, help="Location ID")
        menu_parser.add_argument("--menu", required=True, help="Menu ID (format: YYYY-MM-DD-MealName)")
        menu_parser.add_argument("--output", help="Save results to a JSON file", default=None)

    def handle(self, *args, **options):
        """Handle the command to run the dining API testing script."""
        command = options.get("command")

        if not command:
            self.stdout.write(self.style.ERROR("Please specify a command: locations, events, or menu"))
            return

        if command == "locations":
            self._handle_locations(options)
        elif command == "events":
            self._handle_events(options)
        elif command == "menu":
            self._handle_menu(options)
        else:
            self.stdout.write(self.style.ERROR(f"Unknown command: {command}"))

    def _handle_locations(self, options):
        """Handle the locations command."""
        category_str = options.get("category", "2,3")
        category_ids = category_str.split(",")
        output_file = options.get("output")

        self.stdout.write(self.style.SUCCESS(f"Fetching dining locations for categories: {category_str}"))

        # Get locations
        locations = get_all_dining_locations(category_ids)

        # Save to file if requested
        if output_file:
            with open(output_file, "w") as f:
                json.dump(locations, f, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Saved locations to {output_file}"))

        # Print summary
        self.stdout.write(self.style.SUCCESS(f"Found {len(locations)} dining locations"))

        # Print locations in a table format
        self.stdout.write("\nDINING LOCATIONS:")
        self.stdout.write("-" * 80)
        self.stdout.write(f"{'Name':<30} {'ID':<10} {'Building':<30}")
        self.stdout.write("-" * 80)

        for location in locations:
            self.stdout.write(f"{location['name']:<30} {location['dbid']:<10} {location['building_name']:<30}")

    def _handle_events(self, options):
        """Handle the events command."""
        date_str = options.get("date")
        category_str = options.get("category", "2,3")
        category_ids = category_str.split(",")
        output_file = options.get("output")
        analyze = options.get("analyze", False)

        # Get events
        if date_str:
            try:
                # Validate date format
                datetime.datetime.strptime(date_str, "%Y-%m-%d")
                self.stdout.write(self.style.SUCCESS(f"Fetching dining events for date: {date_str}"))
                all_location_events = get_dining_events_for_date(date_str, category_ids)
            except ValueError:
                raise CommandError(f"Invalid date format: {date_str}. Use YYYY-MM-DD.")
        else:
            self.stdout.write(self.style.SUCCESS("Fetching all dining events"))
            all_location_events = get_all_dining_events(category_ids)

        # Save to file if requested
        if output_file:
            with open(output_file, "w") as f:
                json.dump(all_location_events, f, default=datetime_serializer, indent=2)
            self.stdout.write(self.style.SUCCESS(f"Saved events to {output_file}"))

        # Print summary
        locations_with_events = sum(1 for data in all_location_events.values() if data["events"])
        total_events = sum(len(data["events"]) for data in all_location_events.values())

        self.stdout.write(
            self.style.SUCCESS(
                f"Found {total_events} events across {locations_with_events} locations "
                f"(out of {len(all_location_events)} total locations)"
            )
        )

        # Analyze date range if requested
        if analyze:
            earliest_date, latest_date, total_days = analyze_date_range(all_location_events)
            if earliest_date and latest_date:
                self.stdout.write("\nDATE RANGE ANALYSIS:")
                self.stdout.write("-" * 40)
                self.stdout.write(f"Earliest Date: {earliest_date}")
                self.stdout.write(f"Latest Date: {latest_date}")
                self.stdout.write(f"Total Days: {total_days}")

                # Compare with current date
                today = datetime.datetime.now().date()
                days_from_today_to_earliest = (earliest_date - today).days
                days_from_today_to_latest = (latest_date - today).days

                self.stdout.write(f"Today's Date: {today}")
                self.stdout.write(f"Days from today to earliest date: {days_from_today_to_earliest}")
                self.stdout.write(f"Days from today to latest date: {days_from_today_to_latest}")

        # Print events in a table format (limited to first 10 for readability)
        self.stdout.write("\nSAMPLE DINING EVENTS:")
        self.stdout.write("-" * 100)
        self.stdout.write(f"{'Location':<30} {'Event':<40} {'Start Time (ET)':<20} {'End Time (ET)':<20}")
        self.stdout.write("-" * 100)

        count = 0
        for name, data in all_location_events.items():
            events = data["events"]
            if not events:
                continue

            for event in events[:2]:  # Show at most 2 events per location
                # Convert times to Eastern Time
                start_time = convert_utc_to_eastern(event["start"])
                end_time = convert_utc_to_eastern(event["end"])

                # Format the times
                if isinstance(start_time, datetime.datetime):
                    start_str = start_time.strftime("%Y-%m-%d %I:%M %p")
                else:
                    start_str = str(start_time)

                if isinstance(end_time, datetime.datetime):
                    end_str = end_time.strftime("%Y-%m-%d %I:%M %p")
                else:
                    end_str = str(end_time)

                self.stdout.write(f"{name[:28]:<30} {event['summary'][:38]:<40} {start_str:<20} {end_str:<20}")

                count += 1
                if count >= 10:
                    break

            if count >= 10:
                self.stdout.write("... (showing first 10 events only)")
                break

    def _handle_menu(self, options):
        """Handle the menu command."""
        location_id = options.get("location")
        menu_id = options.get("menu")
        output_file = options.get("output")

        self.stdout.write(self.style.SUCCESS(f"Fetching dining menu for location: {location_id}, menu: {menu_id}"))

        try:
            # Get menu
            menu = dining_api.get_menu(location_id, menu_id)

            # Save to file if requested
            if output_file:
                with open(output_file, "w") as f:
                    json.dump(menu, f, indent=2)
                self.stdout.write(self.style.SUCCESS(f"Saved menu to {output_file}"))

            # Print summary
            if "menus" in menu and menu["menus"]:
                self.stdout.write(self.style.SUCCESS(f"Found {len(menu['menus'])} menu items"))

                # Print menu items in a table format
                self.stdout.write("\nMENU ITEMS:")
                self.stdout.write("-" * 100)
                self.stdout.write(f"{'ID':<10} {'Name':<40} {'Description':<50}")
                self.stdout.write("-" * 100)

                for item in menu["menus"]:
                    description = item.get("description", "")
                    if len(description) > 47:
                        description = description[:47] + "..."

                    name = item.get("name", "")
                    if len(name) > 37:
                        name = name[:37] + "..."

                    self.stdout.write(f"{item.get('id', ''):<10} {name:<40} {description:<50}")
            else:
                self.stdout.write(self.style.WARNING("No menu items found or invalid menu structure"))
                self.stdout.write(f"Raw response: {menu}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error fetching menu: {str(e)}"))
            self.stdout.write(self.style.WARNING("Make sure the location_id and menu_id are valid."))
            self.stdout.write(self.style.WARNING("Menu ID format should be: YYYY-MM-DD-MealName"))
            self.stdout.write(self.style.WARNING("Example: 2025-02-27-Breakfast"))
