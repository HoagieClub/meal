# Hoagie Meal

![Hoagie Meal](images/home.png)

Get the latest information regarding meals at Princeton with Hoagie Meal.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (frontend package manager)
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Python 3.12+
- PostgreSQL

#### Installing Bun

macOS/Linux:

```sh
curl -fsSL https://bun.sh/install | bash
```

Windows:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Or via npm:

```sh
npm install -g bun
```

#### Installing uv

macOS/Linux:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows:

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Or via pip:

```sh
pip install uv
```

#### Installing PostgreSQL

**macOS (Homebrew):**

```sh
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**

Download and run the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). The installer includes pgAdmin and will set up PostgreSQL as a service automatically.

#### Setting up a local database

Once PostgreSQL is running, create a database for the project:

```sh
psql -U postgres
```

Then in the PostgreSQL prompt:

```sql
CREATE USER hoagie WITH PASSWORD 'hoagie';
CREATE DATABASE hoagiemeal OWNER hoagie;
GRANT ALL PRIVILEGES ON DATABASE hoagiemeal TO hoagie;
\q
```

Your `DATABASE_URL` will be:

```
postgres://hoagie:hoagie@localhost:5432/hoagiemeal
```

Use this value in your backend `.env` file.

### Backend

1. **Install dependencies** (this also creates `.venv`):

   ```sh
   cd backend
   uv sync
   ```

2. **Configure environment variables:**

   ```sh
   cp .env.example .env
   ```

   Fill in the values in `.env`:

   | Variable | Description |
   |----------|-------------|
   | `DJANGO_SECRET_KEY` | Django cryptographic signing key. Generate one with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
   | `DEBUG` | Set to `True` for development, `False` for production |
   | `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://hoagie:hoagie@localhost:5432/hoagiemeal`) |
   | `ALLOWED_HOSTS` | Comma-separated hostnames (e.g. `localhost,127.0.0.1`) |
   | `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (e.g. `http://localhost:3000`) |
   | `AUTH0_ISSUER` | Auth0 issuer URL (e.g. `https://hoagie.us.auth0.com/`) |
   | `AUTH0_AUDIENCE` | Auth0 API audience identifier |

3. **Run migrations:**

   ```sh
   uv run manage.py migrate
   ```

4. **Run the app:**

   ```sh
   uv run manage.py runserver
   ```

   The backend will now be running at `http://localhost:8000`.

5. **Seed menus** (optional). Menus are scraped on first request, but you can warm the cache ahead of time:

   ```sh
   uv run scripts/seed_menus.py                      # today plus the next six days, then re-check stale labels
   uv run scripts/seed_menus.py --behind 21 --ahead 21
   uv run scripts/seed_menus.py --force --skip-items # re-scrape menus now, even if checked recently
   ```

### Frontend

1. **Install dependencies:**

   ```sh
   cd frontend
   bun install
   ```

2. **Configure environment variables:**

   ```sh
   cp .env.example .env.local
   ```

   Fill in the values in `.env.local`:

   | Variable | Description |
   |----------|-------------|
   | `AUTH0_SECRET` | Secret key for signing and encrypting session cookies. Generate one with `openssl rand -hex 32` |
   | `AUTH0_BASE_URL` | Base URL of your app (e.g. `http://localhost:3000`) |
   | `AUTH0_ISSUER_BASE_URL` | Auth0 tenant URL (e.g. `https://hoagie.us.auth0.com`) |
   | `AUTH0_CLIENT_ID` | Auth0 application client ID |
   | `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
   | `AUTH0_AUDIENCE` | Auth0 API audience identifier |
   | `AUTH0_SCOPE` | OAuth scopes (e.g. `openid profile offline_access`) |
   | `HOAGIE_API_URL` | Backend API URL, used server-side (e.g. `http://localhost:8000`) |
   | `NEXT_PUBLIC_HOAGIE_API_URL` | Backend API URL, used client-side (e.g. `http://localhost:8000`) |

3. **Run the app:**

   ```sh
   bun run dev
   ```

   The app will now be running locally at `http://localhost:3000`.

### Running both at once

From the repository root, `npm install` once and then:

```sh
npm run dev
```

This starts the backend and frontend side by side with colour-coded output.

### Tests and checks

Backend (from `backend/`):

```sh
uv run manage.py test          # unit tests; runs against an in-memory SQLite database
uv run ruff check . && uv run ruff format .
```

The scraper tests parse real pages saved from menus.princeton.edu in `hoagiemeal/tests/fixtures/`.
If the site changes its markup, re-save the pages there and update the expected values.

Frontend (from `frontend/`):

```sh
bun run test                       # unit and component tests (bun test + Testing Library)
bunx playwright install chromium   # once: downloads the browser the e2e tests use
bun run e2e                        # Playwright smoke tests against the real app; starts the servers if needed
bun run screenshots                # saves phone, tablet and desktop screenshots to ./screenshots
bun run typecheck && bun run lint && bun run check-format
```

## Project Structure

- **`backend/`** is a Django REST API. It scrapes Princeton Campus Dining menus, stores them and their nutrition facts in PostgreSQL, and serves them over a small JSON API. Logged-in users can like, dislike and star menu items.
  - **Models:** `CustomUser`, `DiningLocation`, `ResidentialMenu`, `RetailMenu`, `MenuItem`, `MenuItemNutrition`, `MenuItemInteraction`, `MenuItemMetrics`
  - **API routes:** `GET /api/menus/?date=` (menus and items for a date), `POST /api/engagement/` (metrics, plus the caller's interactions when logged in), `PATCH /api/engagement/interaction/` (update an interaction), `POST /api/user/` (verify the Auth0 token and create the user)
  - **Scripts:** `scripts/seed_menus.py` warms the menu cache; `scripts/analyze_menu_stats.py` prints statistics about stored menus.
- **`frontend/`** is a Next.js app. It shows each day's dining hall and retail menus with nutrition facts and allergen tags, and proxies authenticated requests to the backend.
  - **Page:** `/` (the menu page)
  - **API routes:** `/api/auth/*` (Auth0 login, logout and callback), `/api/engagement/` and `/api/engagement/interaction/` (proxies that attach the Auth0 token)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
