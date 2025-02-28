# Hoagie Meal Dining API

A crash course to the Hoagie Meal dining API.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
  - [Testing the API](#testing-the-api)
  - [Menu ID Format](#menu-id-format)
  - [Common IDs](#common-ids)
  - [Data Format](#data-format)
- [API Endpoints](#api-endpoints)
  - [Dining Locations](#dining-locations)
  - [Dining Events](#dining-events)
  - [Dining Menus](#dining-menus)
  - [Places Open](#places-open)
- [Testing Tools](#testing-tools)
  - [Django Management Commands](#django-management-commands)
  - [Shell Script](#shell-script)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The Dining API provides Princeton University dining information, including:

- Dining locations (residential halls, cafes, specialty venues)
- Dining events and hours
- Menus for specific locations and meals
- Currently open dining locations
- Menu item ratings and reviews

## Quick Start

### Testing the API

You can test the API in multiple ways:

- **Django Management Command**

  Test dining locations:

  ```bash
  python manage.py test_dining locations
  ```

  Test dining events:

  ```bash
  python manage.py test_dining events --date 2025-03-01
  ```

  Test dining menu:

  ```bash
  python manage.py test_dining menu --location 5 --menu 2025-02-27-Breakfast
  ```

- **Shell Script**

  Run the test script:

  ```bash
  ./run_dining_test.sh --date 2025-03-01 --category 2,3
  ```

- **Direct API Calls**

  Get all dining locations:

  ```bash
  curl http://localhost:8000/api/dining/locations/ | python3 -m json.tool --indent 2
  ```

  Get dining events for a specific date:

  ```bash
  curl http://localhost:8000/api/dining/events/?date=2025-03-01 | python3 -m json.tool --indent 2
  ```

  Get menu for a specific location and meal:

  ```bash
  curl http://localhost:8000/api/dining/menu/?location_id=5&menu_id=2025-02-27-Breakfast | python3 -m json.tool --indent 2
  ```

### Menu ID Format

The `menu_id` is formatted as `YYYY-MM-DD-MealName`, where:

- `YYYY-MM-DD`: Date of the meal
- `MealName`: One of `Breakfast`, `Lunch`, `Dinner`, or `Brunch` (weekends)

### Common IDs

**Location IDs:**

| ID   | Name                          |
|------|-------------------------------|
| 3    | Rockefeller College           |
| 4    | Mathey College                |
| 5    | Forbes College                |
| 6    | Whitman & Butler Colleges     |
| 7    | Center for Jewish Life        |
| 8    | Graduate College              |
| 1088 | Yeh College & New College West|

**Category IDs:**

- **2:** Residential dining halls
- **3:** Cafes & specialty venues

### Data Format

All responses are in JSON. Example:

```json
{
  "id": "123",
  "name": "Dining Hall A",
  "location": "Building X",
  "latitude": 40.123456,
  "longitude": -74.654321,
  "category_id": "2",
  "is_residential": true
}
```

---

## API Endpoints

### Dining Locations

**Endpoint:** `/api/dining/locations/`  
**Method:** GET  
**Query:** `category_id` (optional, default: ["2", "3"])

**Examples:**

Get all locations:

```bash
curl http://localhost:8000/api/dining/locations/ | python3 -m json.tool --indent 2
```

Filter by category:

```bash
curl http://localhost:8000/api/dining/locations/?category_id=2 | python3 -m json.tool --indent 2
```

---

### Dining Events

**Endpoint:** `/api/dining/events/`  
**Method:** GET  
**Query:**

- `category_id` (optional, default: ["2", "3"])
- `date` (optional, `YYYY-MM-DD`)
- `location_id` (optional)

**Examples:**

Get all events:

```bash
curl http://localhost:8000/api/dining/events/ | python -m json.tool --indent 2
```

Filter by date:

```bash
curl http://localhost:8000/api/dining/events/?date=2025-03-17 | python -m json.tool --indent 2
```

Filter by location:

```bash
curl http://localhost:8000/api/dining/events/?location_id=5 | python -m json.tool --indent 2
```

---

### Dining Menus

**Endpoint:** `/api/dining/menu/`  
**Method:** GET  
**Query:**

- `location_id` (required)
- `menu_id` (required, `YYYY-MM-DD-MealName`)

**Example:**

```bash
curl http://localhost:8000/api/dining/menu/?location_id=5&menu_id=2025-02-27-Breakfast | python -m json.tool --indent 2
```

---

### Places Open

**Endpoint:** `/api/dining/places/open/`  
**Method:** GET  

**Example:**

```bash
curl http://localhost:8000/api/dining/places/open/ | python -m json.tool --indent 2
```

---

## Testing Tools

### Django Management Commands

Use `test_dining` for quick API tests:

```bash
python manage.py test_dining [subcommand] [options]
```

**Subcommands:**

- `locations`
- `events`
- `menu`

**Options:**

- `--category` (comma-separated IDs)
- `--date` (YYYY-MM-DD)
- `--output` (save as JSON)
- `--analyze` (events only)
- `--location` (menu only)
- `--menu` (menu only)

### Shell Script

For comprehensive testing, use `run_dining_test.sh`:

```bash
ln -s scripts/run_dining_test.sh run_dining_test.sh
./run_dining_test.sh [options]
```

**Options include:**

- `--date DATE`
- `--category IDS` (default: 2,3)
- `--output FILE`
- `--analyze`
- `--location ID`
- `--menu MENU_ID`
- `--help`

Output files are stored in `scripts/outputs/` (gitignored).

---

## Troubleshooting

**Empty Menu Response:**

- Verify the `location_id` is valid.
- Confirm `menu_id` follows `YYYY-MM-DD-MealName`.
- Ensure the date is within the available range.
- Check that the meal type is offered on that date.

**API Errors:**

- **400 Bad Request:** Missing parameters.
- **404 Not Found:** Invalid location or menu ID.
- **500 Internal Server Error:** Server-side issues.

---

## Contributing

When contributing:

- Update the documentation.
- Add tests.
- Follow the established code style.
