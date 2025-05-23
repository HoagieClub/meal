#!/usr/bin/env python3

"""Test script for dining events API.

This script fetches dining events from the StudentApp API and displays them in a formatted way.
It can be used to test the API functionality and to get a quick overview of dining events.

Usage:
    python test_dining_events.py [--date YYYY-MM-DD] [--category ID1,ID2,...] [--output filename.json]

Options:
    --date YYYY-MM-DD    Filter events by date
    --category ID1,ID2   Filter by category IDs (default: 2,3)
    --output filename    Save results to a JSON file (default: dining_events.json or dining_events_YYYY-MM-DD.json)
"""

import sys
import json
import argparse
import datetime

from tabulate import tabulate

from hoagiemeal.api.dining import (
        get_all_dining_events,
        get_dining_events_for_date,
        analyze_date_range,
        convert_utc_to_eastern,
    )
from hoagiemeal.utils.logger import logger


def datetime_serializer(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def save_events_to_json(events, filename):
    """Save events to a JSON file."""
    try:
        with open(filename, "w") as f:
            json.dump(events, f, default=datetime_serializer, indent=2)
        logger.info(f"Events saved to {filename}")
        return True
    except Exception as e:
        logger.error(f"Error saving events to {filename}: {e}")
        return False


def ensure_dependencies():
    """Ensure that required dependencies are installed."""
    try:
        import tabulate
        import pytz

        return True
    except ImportError as e:
        missing_package = str(e).split("'")[1]
        print(f"Error: Missing required package: {missing_package}")
        print(f"Please install it with: pip install {missing_package}")
        return False


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Test dining events API")
    parser.add_argument("--date", help="Filter events by date (YYYY-MM-DD)")
    parser.add_argument("--category", help="Filter by category IDs (comma-separated, default: 2,3)")
    parser.add_argument("--output", help="Save results to a JSON file")
    return parser.parse_args()


def format_events_as_table(all_location_events):
    """Format the events data as a table for easy viewing."""
    table_data = []

    for name, data in all_location_events.items():
        location = data["location_info"]
        events = data["events"]

        if not events:
            # Add a row for locations with no events
            table_data.append([name, location["dbid"], "No events", "", ""])
        else:
            # Add a row for each event
            for event in events:
                # Convert times to Eastern Time
                start_time = convert_utc_to_eastern(event["start"])
                end_time = convert_utc_to_eastern(event["end"])

                # Format the times
                if isinstance(start_time, datetime.datetime):
                    start_str = start_time.strftime("%Y-%m-%d %I:%M %p ET")
                else:
                    start_str = str(start_time)

                if isinstance(end_time, datetime.datetime):
                    end_str = end_time.strftime("%Y-%m-%d %I:%M %p ET")
                else:
                    end_str = str(end_time)

                # Add a row for this event
                table_data.append(
                    [
                        name,
                        location["dbid"],
                        event["summary"],
                        start_str,
                        end_str,
                    ]
                )

    # Create the table
    headers = ["Location", "ID", "Event", "Start Time (ET)", "End Time (ET)"]
    return tabulate(table_data, headers=headers, tablefmt="grid")


def main():
    """Test the dining events API."""
    if not ensure_dependencies():  # Check dependencies
        sys.exit(1)

    # Parse command-line arguments
    args = parse_args()

    # Parse category IDs
    category_ids = None
    if args.category:
        category_ids = args.category.split(",")
        logger.info(f"Using category IDs: {category_ids}")

    # Determine output filename
    output_file = args.output
    if not output_file:
        if args.date:
            output_file = f"dining_events_{args.date}.json"
        else:
            output_file = "dining_events.json"

    try:
        # Fetch events
        if args.date:
            try:
                # Validate date format
                datetime.datetime.strptime(args.date, "%Y-%m-%d")
                logger.info(f"Fetching dining events for date: {args.date}")
                all_location_events = get_dining_events_for_date(args.date, category_ids)
            except ValueError:
                logger.error(f"Invalid date format: {args.date}. Use YYYY-MM-DD.")
                sys.exit(1)
        else:
            logger.info("Fetching all dining events")
            all_location_events = get_all_dining_events(category_ids)

        # Save to JSON
        save_events_to_json(all_location_events, output_file)

        # Display as table
        table = format_events_as_table(all_location_events)
        print("\nDINING EVENTS TABLE:\n")
        print(table)

        # Analyze date range
        earliest_date, latest_date, total_days = analyze_date_range(all_location_events)
        if earliest_date and latest_date:
            print("\nDate Range Analysis:")
            print(f"Earliest Date: {earliest_date}")
            print(f"Latest Date: {latest_date}")
            print(f"Total Days: {total_days}")

            # Compare with current date
            today = datetime.datetime.now().date()
            days_from_today_to_earliest = (earliest_date - today).days
            days_from_today_to_latest = (latest_date - today).days

            print(f"Today's Date: {today}")
            print(f"Days from today to earliest date: {days_from_today_to_earliest}")
            print(f"Days from today to latest date: {days_from_today_to_latest}")

            # Print available dates for testing
            print("\nAvailable dates for testing:")
            current_date = earliest_date
            while current_date <= latest_date:
                print(f"  {current_date.strftime('%Y-%m-%d')}")
                current_date += datetime.timedelta(days=1)

    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
