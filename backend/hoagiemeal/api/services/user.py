"""Auth0 token verification and user lookup."""

from typing import Any, Optional

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError
from django.http import HttpRequest
from django.utils import timezone
from jwt import PyJWKClient

from hoagiemeal.api.services.cacher import local_today
from hoagiemeal.models.user import UserActivityDay
from hoagiemeal.utils.logger import logger

User = get_user_model()

# Longer than a day, so the key for today outlives today and is never re-added before midnight.
ACTIVITY_CACHE_SECONDS = 36 * 60 * 60

_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")

# Custom claims added by the Hoagie Auth0 tenant.
HOAGIE_IO_EMAIL_CLAIM = "https://hoagie.io/email"
HOAGIE_IO_NAME_CLAIM = "https://hoagie.io/name"


def decode_auth0_token(request: HttpRequest) -> Optional[dict]:
    """Verify the bearer token on a request and return its claims, or None if absent or invalid."""
    parts = (request.headers.get("Authorization") or "").split()
    if len(parts) < 2:
        return None

    try:
        key = _JWK_CLIENT.get_signing_key_from_jwt(parts[1]).key
        return jwt.decode(
            parts[1],
            key,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=settings.AUTH0_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            leeway=5,
        )
    except Exception as e:
        logger.warning(f"Failed to decode Auth0 token: {e}")
        return None


def _unique_username(email: str, auth0_id: str) -> str:
    """The email's local part, or the Auth0 subject when that is taken or there is no email."""
    preferred = email.split("@")[0] if email else ""
    if preferred and not User.objects.filter(username=preferred).exists():
        return preferred
    return auth0_id


def _record_activity_day(user: Any) -> None:
    """Note that `user` was active today. A failure here never blocks the login."""
    today = local_today()
    # Every logged-in request comes through here, so the cache keeps it to one write per user per
    # day per server process instead of one per request.
    key = f"user-active:{user.id}:{today.isoformat()}"
    if not cache.add(key, True, ACTIVITY_CACHE_SECONDS):
        return
    try:
        # ignore_conflicts: other server processes may already have written today's row.
        UserActivityDay.objects.bulk_create([UserActivityDay(user=user, date=today)], ignore_conflicts=True)
    except Exception:
        cache.delete(key)  # so the next request tries again
        logger.exception(f"Failed to record activity for user {user.id}")


def get_or_create_user(auth0_claims: dict) -> Optional[Any]:
    """Find the user for a set of verified claims, creating one from the Hoagie claims on first login."""
    auth0_id = auth0_claims.get("sub")
    if not auth0_id:
        logger.error(f"Auth0 token is missing the 'sub' claim: {auth0_claims}")
        return None

    email = auth0_claims.get(HOAGIE_IO_EMAIL_CLAIM) or ""
    name_parts = (auth0_claims.get(HOAGIE_IO_NAME_CLAIM) or "").split()
    try:
        try:
            user, created = User.objects.get_or_create(
                auth0_id=auth0_id,
                defaults={
                    "username": _unique_username(email, auth0_id),
                    "email": email,
                    "first_name": name_parts[0] if name_parts else "",
                    "last_name": name_parts[-1] if len(name_parts) > 1 else "",
                },
            )
        except IntegrityError:
            # A concurrent first login created the user between the lookup and the insert.
            user, created = User.objects.get(auth0_id=auth0_id), False
        if created:
            logger.info(f"User created for auth0_id {auth0_id}")
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        _record_activity_day(user)
        return user
    except Exception:
        logger.exception(f"Failed to get or create user for auth0_id {auth0_id}")
        return None
