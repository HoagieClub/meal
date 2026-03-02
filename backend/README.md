# Hoagie Meal Backend

## Getting Started

Ensure you have [uv](docs.astral.sh/uv) installed.

1. **Create and activate a virtual environment:**

   ```zsh
   uv venv --prompt hoagiemeal .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**

   ```zsh
   uv sync
   ```

   > *Optional:* Generate a `requirements.txt` from `pyproject.toml`:
   >
   > ```zsh
   > uv pip compile pyproject.toml --no-deps -o requirements.txt 
   > ```

3. **Run the app:**

   ```zsh
   uv run manage.py runserver
   ```

   The development server will run on port 8000.

### License

MIT License. Adapt freely with proper attribution.
