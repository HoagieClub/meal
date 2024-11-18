# Hoagie Meal Backend

This is the backend directory for Hoagie Meal.

## Prerequisites

Before you begin, ensure you have [uv](docs.astral.sh/uv) installed.

## Getting started

1. Create a virtual environment and activate it:

```zsh
uv venv --prompt hoagiemeal --python 3.12.7 .venv
source .venv/bin/activate
```

2. Install the dependencies:

```zsh
uv sync
```

> Optional: Generate a requirements.txt file from the pyproject.toml file, run:

```zsh
uv pip compile pyproject.toml --no-deps -o requirements.txt 
```

## Running the app

To run the app, use the following command:

```zsh
uv run manage.py runserver
```

This will start the development server on port 8000.
