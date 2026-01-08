"""Test the endpoints of the Hoagie Meal API.

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

import requests
import json
import os
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
OUTPUT_DIR = "endpoint_responses"

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
RUN_DIR = os.path.join(OUTPUT_DIR, timestamp)
os.makedirs(RUN_DIR, exist_ok=True)

endpoints = [
    {
        "name": "dining_locations_category_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/locations/",
        "params": {"category_id": "2"},
    },
    {
        "name": "dining_locations_category_3",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/locations/",
        "params": {"category_id": "3"},
    },
    {
        "name": "all_dining_locations",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/locations/all/",
        "params": {},
    },
    {
        "name": "menu_item_1",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menu-items/",
        "params": {"api_id": "560112"},
    },
    {
        "name": "menu_item_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menu-items/",
        "params": {"api_id": "560114"},
    },
    {
        "name": "menu_items_batch_1",
        "method": "POST",
        "url": f"{BASE_URL}/api/dining/menu-items/batch/",
        "body": {"api_ids": [560114, 560112, 680000]},
    },
    {
        "name": "menu_items_batch_2",
        "method": "POST",
        "url": f"{BASE_URL}/api/dining/menu-items/batch/",
        "body": {"api_ids": [560114]},
    },
    {
        "name": "menu_1",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/",
        "params": {"location_id": "1088", "menu_id": "2026-01-15-Breakfast"},
    },
    {
        "name": "menu_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/",
        "params": {"location_id": "5", "menu_id": "2026-01-16-Lunch"},
    },
    {
        "name": "menus_locations_1",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/",
        "params": {"menu_id": "2026-01-15-Breakfast"},
    },
    {
        "name": "menus_locations_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/",
        "params": {"menu_id": "2026-01-16-Dinner"},
    },
    {
        "name": "menus_locations_day_1",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/day/",
        "params": {"menu_date": "2026-01-15"},
    },
    {
        "name": "menus_locations_day_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/day/",
        "params": {"menu_date": "2026-01-20"},
    },
    {
        "name": "menus_locations_days_1",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/days/",
        "params": {"start_date": "2026-01-15", "end_date": "2026-01-20"},
    },
    {
        "name": "menus_locations_days_2",
        "method": "GET",
        "url": f"{BASE_URL}/api/dining/menus/locations/days/",
        "params": {"start_date": "2026-01-01", "end_date": "2026-01-07"},
    },
]


def build_full_url(url, params):
    """Build the full URL with the given parameters."""
    if not params:
        return url
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{url}?{query_string}"


def test_endpoint(endpoint):
    """Test the given endpoint."""
    name = endpoint["name"]
    method = endpoint.get("method", "GET")
    url = endpoint["url"]
    headers = {"Content-Type": "application/json"}

    print(f"Testing: {name}")
    print(f"Method: {method}")
    print(f"URL: {url}")

    try:
        if method == "GET":
            params = endpoint.get("params", {})
            full_url = build_full_url(url, params)
            print(f"Full URL: {full_url}")
            response = requests.get(url, params=params, headers=headers, timeout=360)
        elif method == "POST":
            body = endpoint.get("body", {})
            print(f"Body: {json.dumps(body, indent=2)}")
            response = requests.post(url, json=body, headers=headers, timeout=360)
            full_url = url
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        output_file = os.path.join(RUN_DIR, f"{name}.txt")

        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"{method} {full_url}\n")
            if method != "GET":
                f.write(f"Body: {json.dumps(endpoint.get('body', {}), indent=2)}\n")
            f.write("=" * 80 + "\n\n")

            f.write(f"Status Code: {response.status_code}\n")
            f.write(f"Headers:\n{json.dumps(dict(response.headers), indent=2)}\n\n")
            f.write("=" * 80 + "\n\n")

            try:
                content = response.json()
                f.write(json.dumps(content, indent=2))
            except (ValueError, json.JSONDecodeError):
                f.write(response.text)

        print(f"    Saved to {output_file} (Status: {response.status_code})")

    except requests.exceptions.RequestException as e:
        output_file = os.path.join(RUN_DIR, f"{name}.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"{method} {url}\n")
            if method != "GET":
                f.write(f"Body: {json.dumps(endpoint.get('body', {}), indent=2)}\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"ERROR: {str(e)}\n")
        print(f"    Error: {e}")
    except Exception as e:
        print(f"    Unexpected error: {e}")


if __name__ == "__main__":
    """Test the endpoints of the Hoagie Meal API."""
    print(f"Testing {len(endpoints)} endpoints...")
    print(f"Output directory: {RUN_DIR}\n")

    for endpoint in endpoints:
        test_endpoint(endpoint)
        print()

    print(f"Done! Results saved to {RUN_DIR}/")
