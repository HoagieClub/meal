# Hoagie Meal

![Hoagie Meal](images/home.png)

Get the latest information regarding meals at Princeton with Hoagie Meal.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

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

1. **Create and activate a virtual environment:**

   ```sh
   cd backend
   uv venv --prompt hoagiemeal .venv
   source .venv/bin/activate    # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**

   ```sh
   uv sync
   ```

3. **Configure environment variables:**

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

4. **Run migrations:**

   ```sh
   uv run manage.py migrate
   ```

5. **Run the app:**

   ```sh
   uv run manage.py runserver
   ```

   The backend will now be running at `http://localhost:8000`.

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

   The app will now be running locally, and you can view it in your browser at `http://localhost:3000`.

## Project Structure

- **`backend/`** is a Django REST API. It scrapes Princeton dining menus, caches nutritional data in PostgreSQL, and serves it over a REST API. Authenticated users can like, favorite, and rate menu items.
  - **Models:** `CustomUser`, `DiningLocation`, `ResidentialMenu`, `RetailMenu`, `MenuItem`, `MenuItemNutrition`, `MenuItemInteraction`, `MenuItemMetrics`
  - **API routes:** `GET /api/menus/` (menus for a date), `POST /api/engagement/` (likes/favorites/metrics), `PATCH /api/engagement/interaction/` (update a user interaction), `POST /api/user/` (verify and create user)
- **`frontend/`** is a Next.js web app. It displays daily dining hall menus with nutritional info and proxies authenticated requests to the backend. Installable as a PWA.
  - **Pages:** `/` (main menu page), `/login` (login page)
  - **API routes:** `/api/auth/*` (Auth0 login/logout/callback), `/api/engagement/` and `/api/engagement/interaction/` (proxies to backend with Auth0 token)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
