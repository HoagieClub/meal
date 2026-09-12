"""User endpoints."""

from rest_framework import status
from rest_framework.decorators import api_view

from hoagiemeal.api.services.user import decode_auth0_token, get_or_create_user
from hoagiemeal.api.views.responses import error, ok
from hoagiemeal.serializers import UserSerializer


@api_view(["POST"])
def verify_and_get_or_create_user(request):
    """Verify the caller's Auth0 token and return their user record, creating it on first login."""
    claims = decode_auth0_token(request)
    if not claims:
        return error("Authentication required.", status.HTTP_401_UNAUTHORIZED)
    user = get_or_create_user(claims)
    if not user:
        return error("Could not load your account.", status.HTTP_500_INTERNAL_SERVER_ERROR)
    return ok(UserSerializer(user).data, "User fetched or created successfully.")
