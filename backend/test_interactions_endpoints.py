"""Test the interaction endpoints of the Hoagie Meal API.

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
from datetime import datetime

BASE_URL = "http://localhost:8000"
OUTPUT_DIR = "endpoint_responses"

BEARER_TOKEN = os.environ.get("BEARER_TOKEN", None)
if not BEARER_TOKEN:
    raise ValueError("BEARER_TOKEN environment variable is not set")

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
RUN_DIR = os.path.join(OUTPUT_DIR, timestamp)
os.makedirs(RUN_DIR, exist_ok=True)

MENU_ITEM_API_ID = "560112"

endpoints = [
    {
        "name": "01_get_menu_item_metrics_initial",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/menu-item/metrics/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": False,
    },
    {
        "name": "02_get_user_menu_item_interaction_initial",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": True,
    },
    {
        "name": "03_record_user_menu_item_view",
        "method": "POST",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/view/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID)},
        "requires_auth": True,
    },
    {
        "name": "04_update_user_menu_item_interaction_like",
        "method": "PUT",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/update/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID), "liked": True},
        "requires_auth": True,
    },
    {
        "name": "05_update_user_menu_item_interaction_favorite",
        "method": "PUT",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/update/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID), "favorited": True},
        "requires_auth": True,
    },
    {
        "name": "06_update_user_menu_item_interaction_saved",
        "method": "PUT",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/update/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID), "saved_for_later": True},
        "requires_auth": True,
    },
    {
        "name": "07_update_user_menu_item_interaction_would_eat_again_yes",
        "method": "PUT",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/update/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID), "would_eat_again": "Y"},
        "requires_auth": True,
    },
    {
        "name": "08_get_user_menu_item_interaction_after_updates",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": True,
    },
    {
        "name": "09_get_menu_item_metrics_after_interactions",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/menu-item/metrics/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": False,
    },
    {
        "name": "10_update_user_menu_item_interaction_dislike",
        "method": "PUT",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/update/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID), "liked": False},
        "requires_auth": True,
    },
    {
        "name": "11_record_user_menu_item_view_again",
        "method": "POST",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/view/",
        "body": {"menu_item_api_id": int(MENU_ITEM_API_ID)},
        "requires_auth": True,
    },
    {
        "name": "12_get_user_menu_item_interaction_final",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/user/menu-item/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": True,
    },
    {
        "name": "13_get_menu_item_metrics_final",
        "method": "GET",
        "url": f"{BASE_URL}/api/interactions/menu-item/metrics/",
        "params": {"menu_item_api_id": MENU_ITEM_API_ID},
        "requires_auth": False,
    },
]


def build_full_url(url, params):
    """Build the full URL with the given parameters."""
    if not params:
        return url
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{url}?{query_string}"


def get_headers(requires_auth):
    """Get headers for the request, including auth if needed."""
    headers = {"Content-Type": "application/json"}
    if requires_auth and BEARER_TOKEN:
        headers["Authorization"] = f"Bearer {BEARER_TOKEN}"
    return headers


def test_endpoint(endpoint, index):
    """Test the given endpoint."""
    name = endpoint["name"]
    method = endpoint["method"]
    url = endpoint["url"]
    requires_auth = endpoint.get("requires_auth", False)
    headers = get_headers(requires_auth)

    filename = f"{name}.txt"
    output_file = os.path.join(RUN_DIR, filename)

    print(f"Testing: {name}")
    print(f"Method: {method}")
    print(f"URL: {url}")

    # Build full URL for GET requests
    if method == "GET":
        params = endpoint.get("params", {})
        full_url = build_full_url(url, params)
        print(f"Full URL: {full_url}")
    else:
        body = endpoint.get("body", {})
        print(f"Body: {json.dumps(body, indent=2)}")

    try:
        if method == "GET":
            params = endpoint.get("params", {})
            response = requests.get(url, params=params, headers=headers, timeout=360)
            full_url = build_full_url(url, params)
        elif method == "POST":
            body = endpoint.get("body", {})
            response = requests.post(url, json=body, headers=headers, timeout=360)
            full_url = url
        elif method in ["PUT", "PATCH"]:
            body = endpoint.get("body", {})
            response = requests.request(method, url, json=body, headers=headers, timeout=360)
            full_url = url
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

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
        output_file = os.path.join(RUN_DIR, filename)
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
    """Test the interaction endpoints of the Hoagie Meal API."""
    print(f"Testing {len(endpoints)} interaction endpoints...")
    print(f"Menu Item API ID: {MENU_ITEM_API_ID}")
    if BEARER_TOKEN:
        print(f"Using bearer token: {BEARER_TOKEN[:20]}...")
    else:
        print("WARNING: No bearer token set. Auth-required endpoints will fail.")
    print(f"Output directory: {RUN_DIR}\n")

    for index, endpoint in enumerate(endpoints, 1):
        test_endpoint(endpoint, index)
        print()

    print(f"Done! Results saved to {RUN_DIR}/")
