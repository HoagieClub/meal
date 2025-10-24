import jwt
from typing import Optional, Dict, Any
from jwt import PyJWKClient
from django.conf import settings
from hoagiemeal.utils.logger import logger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpRequest
from django.contrib.auth import get_user_model
from hoagiemeal.serializers import UserSerializer
from datetime import datetime

User = get_user_model()
_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")


def get_bearer_token(request: HttpRequest) -> Optional[str]:
    """Extract the Bearer token from the request headers."""
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION") or ""
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    logger.error("No Bearer token found in request headers in get_bearer_token")
    return None


def decode_jwt_token(token: Optional[str]) -> Optional[Any]:
    """Verify the JWT token with Auth0 and return the claims."""
    if not token:
        logger.error("No token found in decode_jwt_token")
        return None

    try:
        key = _JWK_CLIENT.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=settings.AUTH0_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            leeway=5,
        )
        return claims
    except Exception as e:
        logger.error(f"Error decoding JWT token: {e} in decode_jwt_token")
        return None


def get_or_create_user(claims: Any) -> Optional[Any]:
    """Find or create a user based on Auth0 token claims."""
    if not claims:
        logger.error("No claims found in get_or_create_user")
        return None

    if "sub" not in claims:
        logger.error("No Auth0 ID found in claims in get_or_create_user")
        return None

    auth0_id = claims["sub"]
    try:
        user = User.objects.get(auth0_id=auth0_id)
        logger.info(f"Found existing user: {user.username} (Auth0 ID: {auth0_id})")
        """Update the last login time for the user."""
        user.last_login = datetime.now()
        user.save()
        return user

    except User.DoesNotExist:
        """Create a new user if they don't exist."""
        email = claims.get("https://hoagie.io/email")
        full_name = claims.get("https://hoagie.io/name")
        name_parts = full_name.split(" ") if full_name else []
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        username = email.split("@")[0] if email else ""

        user_data = {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "auth0_id": auth0_id,
            "last_login": datetime.now(),
        }
        logger.info(f"Creating new user: {auth0_id}")
        user = User.objects.create(**user_data)
        logger.info(f"Created new user: {user.username} (Auth0 ID: {auth0_id})")
        return user


def authenticate_request(request: HttpRequest) -> Optional[Any]:
    """Check if the request is authenticated and return the user."""
    token = get_bearer_token(request)
    claims = decode_jwt_token(token)
    return get_or_create_user(claims)


#################### Exposed endpoints #########################


@api_view(["GET"])
def me(request):
    """Get current user information."""
    try:
        user = authenticate_request(request)
        if not user:
            logger.error("Authentication failed in me view")
            return Response({"error": "Authentication required"}, status=401)
        serializer = UserSerializer(user)
        user_data = serializer.data
        return Response({"authenticated": True, "user": user_data}, status=200)
    except Exception as e:
        logger.error(f"Error in me view: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def verify(request):
    """Verify if the user is authenticated."""
    try:
        user = authenticate_request(request)
        if not user:
            logger.error("Authentication failed in verify view")
            return Response({"authenticated": False, "user": None}, status=200)
        return Response({"authenticated": True, "user": user.id}, status=200)
    except Exception as e:
        logger.error(f"Error in verify view: {e}")
        return Response({"error": str(e)}, status=500)
