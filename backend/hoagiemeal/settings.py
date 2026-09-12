"""Django settings for the Hoagie Meal backend."""

import os
import sys
from pathlib import Path

import dj_database_url
import django_heroku
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "t")


def _csv_env(name: str, default: str) -> list[str]:
    """A comma-separated environment variable as a list. Unset or empty falls back to the default."""
    return [value.strip() for value in (os.getenv(name) or default).split(",") if value.strip()]


ALLOWED_HOSTS = _csv_env("ALLOWED_HOSTS", "localhost,127.0.0.1")
CORS_ALLOWED_ORIGINS = _csv_env("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000")
CORS_ALLOW_CREDENTIALS = True

AUTH0_ISSUER = os.environ.get("AUTH0_ISSUER")
AUTH0_AUDIENCE = os.environ.get("AUTH0_AUDIENCE")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "hoagiemeal",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "hoagiemeal.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "hoagiemeal.wsgi.application"

# DATABASE_URL, with connections kept open between requests and checked before reuse.
DATABASES = {"default": dj_database_url.config(conn_max_age=600, conn_health_checks=True)}

# The test suite runs against an in-memory SQLite database instead of the real Postgres.
if len(sys.argv) > 1 and sys.argv[1] == "test":
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}

AUTH_USER_MODEL = "hoagiemeal.CustomUser"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# The API is JSON only. Callers are identified by the Auth0 bearer token the views check
# themselves, so DRF's session and basic authentication (and their CSRF checks) stay off.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# WhiteNoise for static files on Heroku, and nothing else: left to its defaults, django-heroku would
# also open ALLOWED_HOSTS to everything, override SECRET_KEY, replace the test runner and logging.
django_heroku.settings(
    locals(), databases=False, allowed_hosts=False, secret_key=False, logging=False, test_runner=False
)
