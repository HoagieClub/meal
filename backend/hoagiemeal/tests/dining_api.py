"""Interactive Test Client for Hoagie Meal Dining API.

This script allows users to interactively query dining information based on
meal type, location, and date.

Users can choose specific parameters or fetch all available data.

Usage:
    $ python manage.py test_dining

Copyright © 2021-2024 Hoagie Club and affiliates.

Licensed under the MIT License. You may obtain a copy of the License at:
https://github.com/hoagieclub/meal/blob/main/LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

This software is provided "as-is", without warranty of any kind.
"""

from datetime import datetime
from hoagiemeal.api.dining import DiningAPI
from hoagiemeal.utils.logger import logger


def prompt_user_choice(prompt, choices):
    """Prompt the user to select a choice from the provided list.

    Args:
        prompt (str): The prompt message to display.
        choices (list): A list of valid choices.

    Returns:
        str: The selected choice.

    """
    while True:
        print(f"\n{prompt}")
        for idx, choice in enumerate(choices, 1):
            print(f"{idx}. {choice.capitalize()}")
        try:
            selection = int(input("Enter the number corresponding to your choice: "))
            if 1 <= selection <= len(choices):
                return choices[selection - 1]
            else:
                print("Invalid selection. Please choose a valid number from the list.")
        except ValueError:
            print("Invalid input. Please enter a number.")


def prompt_user_input(prompt, input_type=str, allow_empty=False):
    """Prompt the user to input a value.

    Args:
        prompt (str): The prompt message to display.
        input_type (type): The expected type of the input.
        allow_empty (bool): Whether to allow empty input.

    Returns:
        The user input converted to the specified type.

    """
    while True:
        user_input = input(f"{prompt}: ").strip()
        if not user_input and allow_empty:
            return None
        try:
            return input_type(user_input)
        except ValueError:
            print(f"Invalid input type. Expected {input_type.__name__}.")


def prompt_yes_no(prompt):
    """Prompt the user with a yes/no question.

    Args:
        prompt (str): The question to ask.

    Returns:
        bool: True if the user answers yes, False otherwise.

    """
    while True:
        response = input(f"{prompt} (y/n): ").strip().lower()
        if response in ["y", "yes"]:
            return True
        elif response in ["n", "no"]:
            return False
        else:
            print("Please enter 'y' for yes or 'n' for no.")


def get_user_queries():
    """Collect query parameters from the user.

    Returns:
        dict: A dictionary containing the user's query parameters.

    """
    print("Welcome to the Hoagie Meal Dining API Interactive Test Client!")
    print(
        "Please provide the following details to query dining information. "
        "NOTE: Say 'n' to everything to get the entire unfiltered API response.\n"
    )

    queries = {}

    # Ask if the user wants to specify meal types
    if prompt_yes_no("Do you want to specify meal types?"):
        meal_types = []
        while True:
            meal_type = prompt_user_choice("Select a meal type to add:", ["breakfast", "lunch", "brunch", "dinner"])
            if meal_type not in meal_types:
                meal_types.append(meal_type)
                print(f"Added '{meal_type.capitalize()}'.")
            else:
                print(f"'{meal_type.capitalize()}' is already selected.")
            if not prompt_yes_no("Do you want to add another meal type?"):
                break
        queries["meal_types"] = meal_types

    # Ask if the user wants to specify dining locations
    if prompt_yes_no("Do you want to specify dining locations?"):
        locations = []
        while True:
            location = prompt_user_input("Enter the dining location name (or part of it)", allow_empty=False)
            locations.append(location)
            if not prompt_yes_no("Do you want to add another location?"):
                break
        queries["locations"] = locations

    # Ask if the user wants to specify the date(s)
    if prompt_yes_no("Do you want to specify date(s)?"):
        dates = []
        while True:
            date_str = prompt_user_input("Enter the date (YYYY-MM-DD)", allow_empty=False)
            try:
                date = datetime.strptime(date_str, "%Y-%m-%d").date()
                dates.append(date)
                print(f"Added date: {date}")
            except ValueError:
                print("Invalid date format. Please enter in YYYY-MM-DD format.")
                continue
            if not prompt_yes_no("Do you want to add another date?"):
                break
        queries["dates"] = dates

    # Ask if the user wants to specify category IDs
    if prompt_yes_no("Do you want to specify category IDs?"):
        category_ids = []
        while True:
            category_id = prompt_user_input("Enter the category ID (e.g., 2 or 3)", input_type=str, allow_empty=False)
            if category_id not in category_ids:
                category_ids.append(category_id)
                print(f"Added category ID: {category_id}")
            else:
                print(f"Category ID '{category_id}' is already selected.")
            if not prompt_yes_no("Do you want to add another category ID?"):
                break
        queries["category_ids"] = category_ids

    # Ask if the user wants to fetch dining events
    if prompt_yes_no("Do you want to fetch dining events?"):
        queries["fetch_events"] = True

    return queries


def filter_locations(locations, search_terms):
    """Filter dining locations based on search terms.

    Args:
        locations (list): A list of location dictionaries.
        search_terms (list): A list of terms to search for in location names.

    Returns:
        list: A list of matching location dictionaries.

    """
    filtered = []
    for loc in locations:
        name = loc.get("name", "").lower()
        if any(term.lower() in name for term in search_terms):
            filtered.append(loc)
    return filtered


def display_locations(locations):
    """Display a list of dining locations.

    Args:
        locations (list): A list of location dictionaries.

    """
    if not locations:
        print("No dining locations found matching your criteria.")
        return

    print("\nAvailable Dining Locations:")
    for idx, loc in enumerate(locations, 1):
        name = loc.get("name", "Unknown Name")
        dbid = loc.get("dbid", "Unknown DBID")
        print(f"{idx}. {name} (DBID: {dbid})")
    print("---" * 20)


def display_menus(menu_data, location_name):
    """Display menu items for a given location.

    Args:
        menu_data (dict): The menu data dictionary.
        location_name (str): The name of the dining location.

    """
    if not menu_data or "menus" not in menu_data:
        print(f"No menu data available for {location_name}.")
        return

    print(f"\nDining Menu for {location_name}:")
    for item in menu_data["menus"]:
        menu_id = item.get("id", "N/A")
        menu_name = item.get("name", "N/A")
        description = item.get("description", "No Description")
        link = item.get("link", "No Link")
        print(f" - Menu Item ID: {menu_id}")
        print(f"   Name: {menu_name}")
        print(f"   Description: {description}")
        print(f"   Link: {link}")
    print("---" * 20)


def display_events(events):
    """Display dining events.

    Args:
        events (list): A list of event dictionaries.

    """
    if not events:
        print("No dining events available.")
        return

    print("\nDining Events:")
    for event in events:
        summary = event.get("summary", "No Summary")
        start = event.get("start", "No Start Time")
        end = event.get("end", "No End Time")
        uid = event.get("uid", "No UID")
        description = event.get("description", "No Description")
        print(f"Event Summary: {summary}")
        print(f"Start: {start}, End: {end}")
        print(f"UID: {uid}")
        print(f"Description: {description}")
        print("---" * 10)


def execute_queries(dining_api, queries):
    """Execute the user's queries against the DiningAPI.

    Args:
        dining_api (DiningAPI): An instance of the DiningAPI.
        queries (dict): The user's query parameters.

    """
    logger.info("\nExecuting your queries...\n")

    try:
        # Fetch all locations first with specified category IDs if any
        category_ids = queries.get("category_ids", ["2"])  # Default to ["2"] if not specified
        # Adjusting _make_request to handle multiple category_ids
        # Assuming the API accepts multiple category IDs by repeating the parameter
        params = {"categoryId": category_ids}
        logger.info(f"Fetching dining locations with category IDs: {', '.join(category_ids)}")
        locations_response = dining_api._make_request(dining_api.DINING_LOCATIONS, params=params, fmt="xml")
        schema = dining_api.schemas.get_dining_xsd()
        if not dining_api.validate_xml(locations_response, schema):
            logger.error("Invalid XML format for dining locations.")
            print("Failed to validate dining locations XML.")
            return
        all_locations = dining_api._parse_xml(locations_response).get("locations", {}).get("location", [])
        logger.debug(f"All Locations: {all_locations}")

        # Filter locations if location queries are specified
        if "locations" in queries:
            filtered_locations = filter_locations(all_locations, queries["locations"])
            if not filtered_locations:
                print("No locations matched your search terms.")
                return
        else:
            filtered_locations = all_locations

        display_locations(filtered_locations)

        # Handle dates and meal types
        dates = queries.get("dates", [datetime.today().date()])
        meal_types = queries.get("meal_types", ["Dinner"])

        for date in dates:
            date_str = date.strftime("%Y-%m-%d")
            for meal_type in meal_types:
                meal_cap = meal_type.capitalize()
                menu_id = f"{date_str}-{meal_cap}"
                for loc in filtered_locations:
                    name = loc.get("name", "Unknown Name")
                    dbid = loc.get("dbid", "Unknown DBID")
                    logger.info(f"Fetching menu for {name} (DBID: {dbid}) on {date_str} for {meal_cap}...")
                    try:
                        menu_data = dining_api.get_menu(location_id=dbid, menu_id=menu_id)
                        display_menus(menu_data, name)
                    except Exception as e:
                        logger.error(f"Error fetching menu for {name} (DBID: {dbid}): {e}")
                        print(f"Failed to fetch menu for {name} (DBID: {dbid}). Check logs for details.")

        # Fetch and display events if requested
        if queries.get("fetch_events"):
            logger.info("\nFetching dining events...")
            try:
                events = dining_api.get_events(place_id="1007").get("events", [])
                display_events(events)
            except Exception as e:
                logger.error(f"Error fetching dining events: {e}")
                print("Failed to fetch dining events. Check logs for details.")

    except Exception as e:
        logger.error(f"An error occurred while executing queries: {e}")
        print("An unexpected error occurred. Check logs for details.")


def main():
    """The main function to run the interactive test client.
    """
    dining_api = DiningAPI()
    queries = get_user_queries()
    execute_queries(dining_api, queries)
    print("\nThank you for using the interactive dining API test client. Hope you found what you were looking for!")


if __name__ == "__main__":
    main()
