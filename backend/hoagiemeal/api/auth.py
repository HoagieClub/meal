import jwt
from typing import Optional, Dict, Any
from jwt import PyJWKClient, InvalidTokenError, ExpiredSignatureError, DecodeError
from django.conf import settings
from hoagiemeal.utils.logger import logger
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpRequest
from django.contrib.auth import get_user_model
from hoagiemeal.serializers import UserSerializer

User = get_user_model()

_JWK_CLIENT = PyJWKClient(f"{settings.AUTH0_ISSUER}.well-known/jwks.json")

def get_bearer_token(request: HttpRequest) -> Optional[str]:
    """Extract the Bearer token from the request headers."""
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION") or ""
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Verify the JWT token with Auth0 and return the claims."""
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
    

def get_or_create_user(claims: Dict[str, Any]) -> User:
    """Find or create a user based on Auth0 token claims."""
    auth0_id = claims.get('sub')
    if not auth0_id:
        return None

    try:
        user = User.objects.get(auth0_id=auth0_id)
    except User.DoesNotExist:   
        user = User.objects.create(
            username="DummyUser",
            email="dummyuser@example.com",
            first_name='Dummy',
            last_name='User',
            auth0_id=auth0_id,
            is_active=True
        )
        logger.info(f"Created new user: {user.username} (Auth0 ID: {auth0_id})")
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return None
    
    return user


def authenticate_request(request: HttpRequest) -> Optional[User]:
    """Check if the request is authenticated and return the user."""
    token = get_bearer_token(request)
    if not token:
        return None
    
    try:
        claims = decode_jwt_token(token)
        logger.info(f"Decoded JWT token: {claims}")
        user = get_or_create_user(claims)
        logger.info(f"User: {user}")
        return user
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        return None
    
    
@api_view(["GET"])
def me(request):
    """Get current user information."""
    user = authenticate_request(request)
    if not user:
        return Response({"error": "Authentication required"}, status=401)
    serializer = UserSerializer(user)
    return Response(serializer.data, status=200)

@api_view(["GET"])
def verify(request):
    """Verify if the user is authenticated."""
    user = authenticate_request(request)
    return Response({"authenticated": bool(user)}, status=200)