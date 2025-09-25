import jwt
from typing import Optional, Dict, Any
from jwt import PyJWKClient, InvalidTokenError, ExpiredSignatureError, DecodeError
from django.conf import settings
from hoagiemeal.utils.logger import logger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpRequest

_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")


def get_bearer_token(request: HttpRequest) -> Optional[str]:
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION") or ""
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


def decode_jwt_token(token: str) -> Dict[str, Any]:
    key = _JWK_CLIENT.get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        audience=settings.AUTH0_AUDIENCE,
        issuer=settings.AUTH0_ISSUER,
        options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        leeway=5,
    )


def is_authenticated(request: HttpRequest) -> bool:
    token = get_bearer_token(request)
    if not token:
        return False
    try:
        decode_jwt_token(token)
        return True
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        return False


@api_view(["GET"])
def me(request):
    token = get_bearer_token(request)
    if not token:
        return Response({"error": "Missing bearer token"}, status=401)

    try:
        claims = decode_jwt_token(token)
        logger.info(f"Token claims: {claims}")
        return Response(claims)

    except ExpiredSignatureError:
        return Response({"error": "Token expired"}, status=401)
    except (InvalidTokenError, DecodeError) as e:
        logger.warning(f"Invalid token: {e}")
        return Response({"error": "Invalid token"}, status=401)
    except Exception as e:
        logger.error(f"Error verifying token: {e}", exc_info=True)
        return Response({"error": "Internal Server Error"}, status=500)
